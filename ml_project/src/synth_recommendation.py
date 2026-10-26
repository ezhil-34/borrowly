"""
Synthetic data generator for the RECOMMENDATION model.

One row = one impression (an item shown to a user at a timestamp).
Columns: user_id, item_id, timestamp, shown, clicked, booked, completed,
         distance_km, price, is_available, category, area, month

Funnel: shown -> clicked -> booked -> completed (each step conditional on the previous).
Hidden ground truth (what the model must learn):
  * users have category preferences and a home area
  * closer items, cheaper-than-category-median items and available items get more clicks
  * seasonal effect per category (e.g. camping gear peaks in summer)
  * some items are intrinsically more popular (item quality)
"""
import numpy as np
import pandas as pd

CATEGORIES = ["camera", "drill", "camping", "bike", "projector", "party", "gaming", "music"]
AREAS = ["Nandambakkam", "T Nagar", "Adyar", "Velachery", "Anna Nagar", "Guindy", "OMR", "Tambaram"]
BASE_PRICE = {"camera": 900, "drill": 250, "camping": 400, "bike": 350,
              "projector": 700, "party": 600, "gaming": 500, "music": 650}
SEASON_PEAK = {"camping": [5, 6, 12], "party": [10, 11, 12], "bike": [1, 2, 3],
               "camera": [4, 10, 11], "projector": [8, 9], "drill": [6, 7], "gaming": [12, 6], "music": [1, 12]}


def _sigmoid(x):
    return 1 / (1 + np.exp(-x))


def generate_items(n_items=2000, rng=None):
    rng = rng or np.random.default_rng(0)
    cat = rng.choice(CATEGORIES, n_items)
    area = rng.choice(AREAS, n_items)
    base = np.array([BASE_PRICE[c] for c in cat])
    price = np.round(base * rng.lognormal(0, 0.25, n_items), -1).clip(50)
    return pd.DataFrame({"item_id": np.arange(n_items), "category": cat, "area": area,
                         "price": price, "quality": rng.normal(0, 0.6, n_items)})


def generate_users(n_users=3000, rng=None):
    rng = rng or np.random.default_rng(1)
    pref = rng.dirichlet(np.ones(len(CATEGORIES)) * 0.4, n_users)
    return pd.DataFrame({"user_id": np.arange(n_users),
                         "home_area": rng.choice(AREAS, n_users),
                         "price_sensitivity": rng.uniform(0.3, 1.5, n_users),
                         "pref": list(pref)})


def generate_recommendation_data(n_rows=300_000, n_users=3000, n_items=2000,
                                 start="2025-01-01", end="2025-12-31", seed=42,
                                 drift=False, entity_seed=None) -> pd.DataFrame:
    """drift=True shifts distributions (used to demo monitoring).
    entity_seed fixes the user/item universe so later batches (new seed/dates) reuse the same users & items."""
    rng = np.random.default_rng(seed)
    es = seed if entity_seed is None else entity_seed   # same users/items across batches
    items = generate_items(n_items, np.random.default_rng(es + 1))
    users = generate_users(n_users, np.random.default_rng(es + 2))
    cat_median = items.groupby("category")["price"].median()

    u_idx = rng.integers(0, n_users, n_rows)
    i_idx = rng.integers(0, n_items, n_rows)
    u = users.iloc[u_idx].reset_index(drop=True)
    it = items.iloc[i_idx].reset_index(drop=True)

    t0, t1 = pd.Timestamp(start).value // 10**9, pd.Timestamp(end).value // 10**9
    ts = pd.to_datetime(np.sort(rng.integers(t0, t1, n_rows)), unit="s")
    month = np.asarray(ts.month)

    same_area = (u["home_area"].values == it["area"].values)
    distance = np.where(same_area, rng.gamma(2, 1.2, n_rows), rng.gamma(4, 4.0, n_rows)).round(2)
    price = it["price"].values.copy()
    if drift:
        price = price * 1.25
        distance = distance * 1.3
    is_available = (rng.random(n_rows) < (0.55 if drift else 0.8)).astype(int)

    cat_idx = np.array([CATEGORIES.index(c) for c in it["category"]])
    pref_mat = np.vstack(u["pref"].values)
    if drift:                                   # concept drift: user tastes rotate to other categories
        pref_mat = np.roll(pref_mat, 2, axis=1)
    pref = pref_mat[np.arange(n_rows), cat_idx]
    rel_price = price / it["category"].map(cat_median).values
    season = np.array([1.0 if m in SEASON_PEAK[c] else 0.0 for m, c in zip(month, it["category"])])

    logit_click = (-3.2 + 5.0 * pref - 0.06 * distance
                   - 1.2 * u["price_sensitivity"].values * (rel_price - 1)
                   + 0.9 * season + 0.8 * it["quality"].values + 0.7 * is_available)
    clicked = (rng.random(n_rows) < _sigmoid(logit_click)).astype(int)

    logit_book = (-2.0 - 0.04 * distance - 0.8 * (rel_price - 1) + 1.5 * is_available
                  + 0.5 * it["quality"].values + 0.3 * season)
    booked = clicked * (rng.random(n_rows) < _sigmoid(logit_book)).astype(int) * is_available
    completed = booked * (rng.random(n_rows) < _sigmoid(1.8 - 0.02 * distance)).astype(int)

    return pd.DataFrame({
        "user_id": u["user_id"].values, "item_id": it["item_id"].values, "timestamp": ts,
        "shown": 1, "clicked": clicked, "booked": booked, "completed": completed,
        "distance_km": distance, "price": price, "is_available": is_available,
        "category": it["category"].values, "area": it["area"].values, "month": month,
    })


if __name__ == "__main__":
    df = generate_recommendation_data()
    df.to_csv("data/recommendation.csv", index=False)
    print(df.shape, "\nCTR=%.3f  book/click=%.3f" % (df.clicked.mean(), df.booked.sum() / df.clicked.sum()))
