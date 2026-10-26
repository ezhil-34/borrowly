"""
Synthetic data generator for the PRICE SUGGESTION model.

Columns: item_id, category, brand, condition, area, lat, lng, asking_price_per_day,
         actual_agreed_price_per_day, booking_date, rental_start_date, completed,
         comparable_median_price, category_area_demand_30d

Ground truth:
  fair_price = base(category) * brand * condition * area * demand factors
  owners ask with noise (they overprice slightly); renters negotiate toward fair price.
  agreed price is only known when a booking happened (otherwise NaN).
"""
import numpy as np
import pandas as pd

CATEGORIES = ["camera", "drill", "camping", "bike", "projector", "party", "gaming", "music"]
BASE_PRICE = {"camera": 900, "drill": 250, "camping": 400, "bike": 350,
              "projector": 700, "party": 600, "gaming": 500, "music": 650}
BRANDS = {"premium": ["Sony", "Canon", "Bosch", "Yamaha"], "mid": ["Nikon", "Dewalt", "Giant", "Epson"],
          "budget": ["Generic", "Local", "Hero", "Ambrane"]}
BRAND_FACTOR = {"premium": 1.35, "mid": 1.0, "budget": 0.75}
CONDITIONS = ["new", "like_new", "good", "fair"]
COND_FACTOR = {"new": 1.2, "like_new": 1.05, "good": 0.9, "fair": 0.7}
AREAS = {  # (lat, lng, price factor)
    "Nandambakkam": (13.0239, 80.1970, 1.00), "T Nagar": (13.0418, 80.2341, 1.15),
    "Adyar": (13.0012, 80.2565, 1.12), "Velachery": (12.9815, 80.2180, 1.00),
    "Anna Nagar": (13.0850, 80.2101, 1.10), "Guindy": (13.0067, 80.2206, 1.05),
    "OMR": (12.9500, 80.2400, 1.08), "Tambaram": (12.9249, 80.1000, 0.88),
}
SEASON_PEAK = {"camping": [5, 6, 12], "party": [10, 11, 12], "bike": [1, 2, 3],
               "camera": [4, 10, 11], "projector": [8, 9], "drill": [6, 7], "gaming": [12, 6], "music": [1, 12]}


def generate_pricing_data(n_rows=60_000, n_items=15_000, start="2025-01-01", end="2025-12-31",
                          seed=7, drift=False, entity_seed=None) -> pd.DataFrame:
    ent = np.random.default_rng(seed if entity_seed is None else entity_seed)   # item universe
    rng = np.random.default_rng(seed)
    area_names = list(AREAS)

    it_cat = ent.choice(CATEGORIES, n_items)
    it_tier = ent.choice(["premium", "mid", "budget"], n_items, p=[0.25, 0.45, 0.30])
    it_brand = np.array([ent.choice(BRANDS[t]) for t in it_tier])
    it_cond = ent.choice(CONDITIONS, n_items, p=[0.12, 0.30, 0.40, 0.18])
    it_area = ent.choice(area_names, n_items)
    it_lat = np.array([AREAS[a][0] for a in it_area]) + ent.normal(0, 0.01, n_items)
    it_lng = np.array([AREAS[a][1] for a in it_area]) + ent.normal(0, 0.01, n_items)

    idx = rng.integers(0, n_items, n_rows)
    cat, tier, brand = it_cat[idx], it_tier[idx], it_brand[idx]
    cond, area, lat, lng = it_cond[idx], it_area[idx], it_lat[idx], it_lng[idx]

    days = (pd.Timestamp(end) - pd.Timestamp(start)).days
    booking_date = pd.Timestamp(start) + pd.to_timedelta(rng.integers(0, days, n_rows), unit="D")
    lead = rng.integers(0, 21, n_rows)
    rental_start = booking_date + pd.to_timedelta(lead, unit="D")
    month = np.asarray(rental_start.month)

    base = np.array([BASE_PRICE[c] for c in cat], dtype=float)
    brand_f = np.array([BRAND_FACTOR[t] for t in tier])
    cond_f = np.array([COND_FACTOR[c] for c in cond])
    area_f = np.array([AREAS[a][2] for a in area])

    season = np.array([1.0 if m in SEASON_PEAK[c] else 0.0 for m, c in zip(month, cat)])
    demand = rng.poisson(40 + 35 * season + 50 * (area_f - 1)).astype(float)
    if drift:
        demand = demand * 1.6
    demand_f = 1 + 0.0035 * (demand - 50)

    fair = base * brand_f * cond_f * area_f * demand_f
    comparable = (fair * rng.lognormal(0, 0.07, n_rows)).round(0)
    if drift:                                   # market moved +18% but comparable medians are stale
        fair = fair * 1.18
    asking = (fair * rng.lognormal(0.08, 0.18, n_rows)).round(0)
    w = rng.uniform(0.4, 0.9, n_rows)
    agreed = (w * fair + (1 - w) * asking) * rng.lognormal(0, 0.04, n_rows)

    p_book = 1 / (1 + np.exp(-(1.2 - 4.0 * (asking / comparable - 1) + 0.01 * (demand - 50))))
    booked = rng.random(n_rows) < p_book
    completed = (booked & (rng.random(n_rows) < 0.92)).astype(int)
    agreed = np.where(booked, agreed.round(0), np.nan)

    return pd.DataFrame({
        "item_id": idx, "category": cat, "brand": brand, "condition": cond, "area": area,
        "lat": lat.round(5), "lng": lng.round(5),
        "asking_price_per_day": asking, "actual_agreed_price_per_day": agreed,
        "booking_date": booking_date, "rental_start_date": rental_start, "completed": completed,
        "comparable_median_price": comparable, "category_area_demand_30d": demand,
    })


if __name__ == "__main__":
    df = generate_pricing_data()
    df.to_csv("data/pricing.csv", index=False)
    print(df.shape, "\nbooked rate=%.3f" % df.actual_agreed_price_per_day.notna().mean())
