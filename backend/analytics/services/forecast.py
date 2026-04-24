"""
Linear-trend demand forecasting from MarketSnapshot history.
Uses scikit-learn LinearRegression per (city, category) pair.
Requires at least 2 months of data; returns None when insufficient.
"""
import datetime

import numpy as np
from sklearn.linear_model import LinearRegression


def _next_month(d: datetime.date) -> datetime.date:
    if d.month == 12:
        return datetime.date(d.year + 1, 1, 1)
    return datetime.date(d.year, d.month + 1, 1)


def _forecast_pair(city: str, category: str, forecast_month: datetime.date) -> dict | None:
    from analytics.models import MarketSnapshot

    snaps = list(
        MarketSnapshot.objects.filter(city=city, category=category)
        .order_by('month')
        .values('month', 'units_sold')
    )

    if len(snaps) < 2:
        return None

    X = np.array([[i] for i in range(len(snaps))], dtype=float)
    y = np.array([s['units_sold'] for s in snaps], dtype=float)

    model = LinearRegression().fit(X, y)
    predicted = float(max(0.0, model.predict([[len(snaps)]])[0]))
    r2 = float(model.score(X, y))
    confidence = max(0.0, min(1.0, r2))

    return {
        'city': city,
        'category': category,
        'forecastMonth': forecast_month.strftime('%Y-%m'),
        'predictedUnits': round(predicted, 1),
        'confidence': round(confidence, 3),
    }


def get_forecast(city: str = '') -> dict:
    from analytics.models import MarketSnapshot

    today = datetime.date.today()
    forecast_month = _next_month(today.replace(day=1))

    qs = MarketSnapshot.objects.values('city', 'category').distinct()
    if city:
        qs = qs.filter(city__iexact=city)

    predictions = []
    for row in qs:
        result = _forecast_pair(row['city'], row['category'], forecast_month)
        if result:
            predictions.append(result)

    predictions.sort(key=lambda x: (-x['predictedUnits'], x['city'], x['category']))

    return {
        'forecastMonth': forecast_month.strftime('%Y-%m'),
        'predictions': predictions,
    }


def rebuild_forecasts() -> int:
    """Persist DemandForecast rows for all city+category pairs."""
    from analytics.models import DemandForecast, MarketSnapshot

    today = datetime.date.today()
    forecast_month = _next_month(today.replace(day=1))

    pairs = MarketSnapshot.objects.values('city', 'category').distinct()
    count = 0
    for row in pairs:
        result = _forecast_pair(row['city'], row['category'], forecast_month)
        if result:
            DemandForecast.objects.update_or_create(
                city=row['city'],
                category=row['category'],
                forecast_month=forecast_month,
                defaults={
                    'predicted_units': result['predictedUnits'],
                    'confidence': result['confidence'],
                },
            )
            count += 1
    return count
