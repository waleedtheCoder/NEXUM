"""
Linear-trend demand forecasting from MarketSnapshot history.
Uses scikit-learn LinearRegression per (city, category) pair.
Requires at least 2 months of data; returns None when insufficient.
"""
import datetime
from collections import defaultdict

import numpy as np
from sklearn.linear_model import LinearRegression


def _next_month(d: datetime.date) -> datetime.date:
    if d.month == 12:
        return datetime.date(d.year + 1, 1, 1)
    return datetime.date(d.year, d.month + 1, 1)


def _forecast_from_snaps(city: str, category: str, snaps: list, forecast_month: datetime.date) -> dict | None:
    if len(snaps) < 2:
        return None

    X = np.array([[i] for i in range(len(snaps))], dtype=float)
    y = np.array([s['units_sold'] for s in snaps], dtype=float)

    model     = LinearRegression().fit(X, y)
    predicted = float(max(0.0, model.predict([[len(snaps)]])[0]))
    r2        = float(model.score(X, y))
    confidence = max(0.0, min(1.0, r2))

    return {
        'city':           city,
        'category':       category,
        'forecastMonth':  forecast_month.strftime('%Y-%m'),
        'predictedUnits': round(predicted, 1),
        'confidence':     round(confidence, 3),
    }


def _load_grouped_snaps(city: str = '') -> dict:
    """Load all MarketSnapshot rows in one query, grouped by (city, category)."""
    from analytics.models import MarketSnapshot

    qs = MarketSnapshot.objects.order_by('city', 'category', 'month').values('city', 'category', 'month', 'units_sold')
    if city:
        qs = qs.filter(city__iexact=city)

    grouped: dict[tuple, list] = defaultdict(list)
    for snap in qs:
        grouped[(snap['city'], snap['category'])].append(snap)
    return grouped


def get_forecast(city: str = '') -> dict:
    today          = datetime.date.today()
    forecast_month = _next_month(today.replace(day=1))

    grouped = _load_grouped_snaps(city)

    predictions = []
    for (city_key, category_key), snaps in grouped.items():
        result = _forecast_from_snaps(city_key, category_key, snaps, forecast_month)
        if result:
            predictions.append(result)

    predictions.sort(key=lambda x: (-x['predictedUnits'], x['city'], x['category']))

    return {
        'forecastMonth': forecast_month.strftime('%Y-%m'),
        'predictions':   predictions,
    }


def rebuild_forecasts() -> int:
    """Persist DemandForecast rows for all city+category pairs via a single bulk upsert."""
    from analytics.models import DemandForecast

    today          = datetime.date.today()
    forecast_month = _next_month(today.replace(day=1))

    grouped = _load_grouped_snaps()

    to_upsert = []
    for (city_key, category_key), snaps in grouped.items():
        result = _forecast_from_snaps(city_key, category_key, snaps, forecast_month)
        if result:
            to_upsert.append(DemandForecast(
                city=city_key,
                category=category_key,
                forecast_month=forecast_month,
                predicted_units=result['predictedUnits'],
                confidence=result['confidence'],
            ))

    if to_upsert:
        DemandForecast.objects.bulk_create(
            to_upsert,
            update_conflicts=True,
            unique_fields=['city', 'category', 'forecast_month'],
            update_fields=['predicted_units', 'confidence'],
        )

    return len(to_upsert)
