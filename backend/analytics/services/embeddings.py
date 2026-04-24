"""
TF-IDF embedding index over active listings.
Trained on DB contents at startup (incremental: only rebuilt when listing count changes).
Used for product similarity and category matching.
"""
import threading

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_lock = threading.Lock()
_vectorizer: TfidfVectorizer | None = None
_matrix = None          # sparse (n_listings, n_features)
_listing_ids: list[int] = []
_listing_meta: list[dict] = []  # [{id, category, price, location}]


def _corpus_text(name: str, category: str, description: str) -> str:
    return f"{name} {category} {description}".strip()


def build_index(force: bool = False) -> int:
    """Fit TF-IDF on all active listings. Returns number of documents indexed."""
    global _vectorizer, _matrix, _listing_ids, _listing_meta

    from listings.models import Listing

    qs = list(
        Listing.objects.filter(status='active').values(
            'id', 'product_name', 'category', 'description', 'price', 'location'
        )
    )
    if not qs:
        return 0

    # Skip rebuild if same count and not forced
    with _lock:
        if not force and _listing_ids and len(_listing_ids) == len(qs):
            return len(_listing_ids)

        corpus = [_corpus_text(l['product_name'], l['category'], l['description']) for l in qs]
        ids = [l['id'] for l in qs]
        meta = [{'id': l['id'], 'category': l['category'],
                 'price': float(l['price']), 'location': l['location']} for l in qs]

        vec = TfidfVectorizer(max_features=8000, stop_words='english', ngram_range=(1, 2))
        mat = vec.fit_transform(corpus)

        _vectorizer = vec
        _matrix = mat
        _listing_ids = ids
        _listing_meta = meta

    return len(ids)


def _ensure_index():
    if _matrix is None:
        build_index()


def find_similar(listing_id: int, top_k: int = 10) -> list[int]:
    """Return listing IDs most similar to listing_id by description/category."""
    _ensure_index()
    if listing_id not in _listing_ids:
        return []
    idx = _listing_ids.index(listing_id)
    scores = cosine_similarity(_matrix[idx], _matrix).flatten()
    scores[idx] = -1  # exclude self
    top_idx = np.argsort(scores)[::-1][:top_k]
    return [_listing_ids[i] for i in top_idx if scores[i] > 0.05]


def get_category_peers(category: str) -> list[dict]:
    """Return meta dicts for all indexed listings in the given category."""
    _ensure_index()
    cat_lower = category.lower()
    return [m for m in _listing_meta if m['category'].lower() == cat_lower]


def category_avg_price(category: str) -> float | None:
    peers = get_category_peers(category)
    if not peers:
        return None
    return sum(p['price'] for p in peers) / len(peers)
