"""Feature engineering shared by training, serving and monitoring (avoids train/serve skew)."""
import numpy as np
import pandas as pd

# ------------------------------------------------------------------ RECOMMENDATION
REC_CAT = ["category", "area"]
REC_NUM = ["distance_km", "price", "is_available", "month", "rel_price", "user_cat_click_rate",
           "item_ctr", "item_book_rate", "user_n_events", "is_peak_season_proxy"]
REC_FEATURES = REC_CAT + REC_NUM
PRIOR_STRENGTH = 20


def fit_rec_stats(train: pd.DataFrame) -> dict:
    """Aggregate statistics learnt ONLY from training data."""
    g_click, g_book = train["clicked"].mean(), train["booked"].sum() / max(train["clicked"].sum(), 1)
    return {
        "global_ctr": g_click, "global_book_rate": g_book,
        "cat_median_price": train.groupby("category")["price"].median().to_dict(),
        "user_cat": train.groupby(["user_id", "category"])["clicked"].agg(["sum", "count"]),
        "item": train.groupby("item_id").agg(clicks=("clicked", "sum"), shows=("shown", "sum"),
                                            books=("booked", "sum")),
        "user_n": train.groupby("user_id").size(),
        "cat_month_ctr": train.groupby(["category", "month"])["clicked"].mean().to_dict(),
    }


def build_rec_features(df: pd.DataFrame, stats: dict, is_train: bool = False) -> pd.DataFrame:
    """is_train=True removes each row's own label from the aggregates (leave-one-out) to avoid leakage."""
    X = pd.DataFrame(index=df.index)
    for c in ["category", "area"]:
        X[c] = df[c].astype("category")
    for c in ["distance_km", "price", "is_available", "month"]:
        X[c] = df[c].values
    X["rel_price"] = df["price"].values / df["category"].map(stats["cat_median_price"]).fillna(df["price"].median()).values

    # user x category click rate (smoothed)
    uc = stats["user_cat"]
    keys = pd.MultiIndex.from_arrays([df["user_id"], df["category"]])
    s = uc["sum"].reindex(keys).fillna(0).values
    n = uc["count"].reindex(keys).fillna(0).values
    if is_train and "clicked" in df:
        s, n = s - df["clicked"].values, n - 1
    X["user_cat_click_rate"] = (s + PRIOR_STRENGTH * stats["global_ctr"]) / (n + PRIOR_STRENGTH)

    # item CTR / booking rate
    it = stats["item"].reindex(df["item_id"].values)
    clicks, shows, books = it["clicks"].fillna(0).values, it["shows"].fillna(0).values, it["books"].fillna(0).values
    if is_train and "clicked" in df:
        clicks, shows, books = clicks - df["clicked"].values, shows - 1, books - df["booked"].values
    X["item_ctr"] = (clicks + PRIOR_STRENGTH * stats["global_ctr"]) / (shows + PRIOR_STRENGTH)
    X["item_book_rate"] = (books + PRIOR_STRENGTH * stats["global_book_rate"] * stats["global_ctr"]) / (shows + PRIOR_STRENGTH)
    X["user_n_events"] = df["user_id"].map(stats["user_n"]).fillna(0).values
    cm = stats["cat_month_ctr"]
    X["is_peak_season_proxy"] = [cm.get((c, m), stats["global_ctr"]) / stats["global_ctr"]
                                 for c, m in zip(df["category"], df["month"])]
    return X[REC_FEATURES]


# ------------------------------------------------------------------ PRICING
PRICE_CAT = ["category", "brand", "condition", "area"]
PRICE_NUM = ["lat", "lng", "asking_price_per_day", "comparable_median_price",
             "category_area_demand_30d", "month", "lead_days", "ask_ratio"]
PRICE_FEATURES = PRICE_CAT + PRICE_NUM


def build_price_features(df: pd.DataFrame, categories: dict | None = None) -> pd.DataFrame:
    X = pd.DataFrame(index=df.index)
    for c in PRICE_CAT:
        X[c] = pd.Categorical(df[c], categories=(categories or {}).get(c)) if categories else df[c].astype("category")
    for c in ["lat", "lng", "asking_price_per_day", "comparable_median_price", "category_area_demand_30d"]:
        X[c] = df[c].values
    rs = pd.to_datetime(df["rental_start_date"]); bk = pd.to_datetime(df["booking_date"])
    X["month"] = rs.dt.month.values
    X["lead_days"] = (rs - bk).dt.days.values
    X["ask_ratio"] = df["asking_price_per_day"].values / df["comparable_median_price"].values
    return X[PRICE_FEATURES]
