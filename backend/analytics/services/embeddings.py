"""
TF-IDF embedding index over active listings.
Trained on DB contents at startup (incremental: only rebuilt when listing count changes).
Used for product similarity and category matching.
"""
import threading
from collections import defaultdict

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_lock = threading.Lock()
_vectorizer: TfidfVectorizer | None = None
_matrix = None                          # sparse (n_listings, n_features)
_listing_ids: list[int] = []
_listing_id_to_idx: dict[int, int] = {} # O(1) position lookup by listing id
_listing_meta: list[dict] = []          # [{id, category, price, location}]
_category_index: dict[str, list[dict]] = {}  # category.lower() → [meta, ...]


def _corpus_text(name: str, category: str, description: str) -> str:
    return f"{name} {category} {description}".strip()


def build_index(force: bool = False) -> int:
    """Fit TF-IDF on all active listings. Returns number of documents indexed."""
    global _vectorizer, _matrix, _listing_ids, _listing_id_to_idx, _listing_meta, _category_index

    from listings.models import Listing

    # COUNT first — avoids loading all rows just to bail on a cache-hit.
    current_count = Listing.objects.filter(status='active').count()
    if not current_count:
        return 0

    with _lock:
        if not force and _listing_ids and len(_listing_ids) == current_count:
            return len(_listing_ids)

        qs = list(
            Listing.objects.filter(status='active').values(
                'id', 'product_name', 'category', 'description', 'price', 'location'
            )
        )

        corpus = [_corpus_text(l['product_name'], l['category'], l['description']) for l in qs]
        ids    = [l['id'] for l in qs]
        meta   = [
            {'id': l['id'], 'category': l['category'],
             'price': float(l['price']), 'location': l['location']}
            for l in qs
        ]

        vec = TfidfVectorizer(max_features=8000, stop_words='english', ngram_range=(1, 2))
        mat = vec.fit_transform(corpus)

        # Build O(1) lookup structures once at index time.
        id_to_idx: dict[int, int] = {lid: i for i, lid in enumerate(ids)}
        cat_idx: dict[str, list[dict]] = defaultdict(list)
        for m in meta:
            cat_idx[m['category'].lower()].append(m)

        _vectorizer        = vec
        _matrix            = mat
        _listing_ids       = ids
        _listing_id_to_idx = id_to_idx
        _listing_meta      = meta
        _category_index    = dict(cat_idx)

    return len(ids)


def _ensure_index():
    if _matrix is None:
        build_index()


def find_similar(listing_id: int, top_k: int = 10) -> list[int]:
    """Return listing IDs most similar to listing_id by description/category."""
    _ensure_index()
    idx = _listing_id_to_idx.get(listing_id)   # O(1) — was O(n) list.index()
    if idx is None:
        return []
    scores = cosine_similarity(_matrix[idx], _matrix).flatten()
    scores[idx] = -1  # exclude self
    top_idx = np.argsort(scores)[::-1][:top_k]
    return [_listing_ids[i] for i in top_idx if scores[i] > 0.05]


def get_category_peers(category: str) -> list[dict]:
    """Return meta dicts for all indexed listings in the given category."""
    _ensure_index()
    return list(_category_index.get(category.lower(), []))  # O(1) — was O(n) scan


def category_avg_price(category: str) -> float | None:
    peers = get_category_peers(category)
    if not peers:
        return None
    return sum(p['price'] for p in peers) / len(peers)
