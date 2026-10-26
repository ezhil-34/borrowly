"""
Train the price-suggestion model.

Target: log(actual_agreed_price / comparable_median_price)  (relative price -> generalises across categories)
Models: median (q=0.5) + low (q=0.1) + high (q=0.9) quantile regressors => suggested price AND a price range.
Training rows = bookings with a known agreed price. Time-based split on booking_date.
"""
import json, sys, time
from pathlib import Path
import joblib, numpy as np, pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.features import build_price_features, PRICE_FEATURES

MODEL_DIR = Path(__file__).resolve().parents[1] / "models"


def _mape(y, p): return float(np.mean(np.abs(y - p) / y))


def train(df: pd.DataFrame, split_date="2025-10-01", seed=0):
    d = df.dropna(subset=["actual_agreed_price_per_day"]).copy()
    d["booking_date"] = pd.to_datetime(d["booking_date"]); d["rental_start_date"] = pd.to_datetime(d["rental_start_date"])
    tr, te = d[d.booking_date < split_date], d[d.booking_date >= split_date]
    cats = {c: sorted(d[c].unique()) for c in ["category", "brand", "condition", "area"]}
    Xtr, Xte = build_price_features(tr, cats), build_price_features(te, cats)
    ytr = np.log(tr["actual_agreed_price_per_day"] / tr["comparable_median_price"])

    def fit(q):
        return HistGradientBoostingRegressor(loss="quantile", quantile=q, max_iter=300, learning_rate=0.06,
                                             categorical_features="from_dtype", random_state=seed).fit(Xtr, ytr)
    m50, m10, m90 = fit(0.5), fit(0.1), fit(0.9)

    comp = te["comparable_median_price"].values
    p50, p10, p90 = (comp * np.exp(m.predict(Xte)) for m in (m50, m10, m90))
    y = te["actual_agreed_price_per_day"].values
    metrics = {
        "mae": float(mean_absolute_error(y, p50)), "mape": _mape(y, p50), "r2": float(r2_score(y, p50)),
        "baseline_comparable_median_mae": float(mean_absolute_error(y, comp)),
        "baseline_comparable_median_mape": _mape(y, comp),
        "baseline_asking_price_mape": _mape(y, te["asking_price_per_day"].values),
        "interval_80pct_coverage": float(np.mean((y >= p10) & (y <= p90))),
        "train_rows": len(tr), "test_rows": len(te),
    }
    bundle = {"m50": m50, "m10": m10, "m90": m90, "categories": cats, "features": PRICE_FEATURES,
              "metrics": metrics, "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
              "reference_features": Xte.sample(min(20000, len(Xte)), random_state=0).reset_index(drop=True)}
    return bundle, te.assign(pred=p50, pred_low=p10, pred_high=p90)


def suggest_price(bundle, items: pd.DataFrame) -> pd.DataFrame:
    """items needs the pricing columns (without agreed price). Returns suggested price + range."""
    X = build_price_features(items, bundle["categories"])
    comp = items["comparable_median_price"].values
    out = items.copy()
    out["suggested_price"] = (comp * np.exp(bundle["m50"].predict(X))).round(0)
    lo = comp * np.exp(bundle["m10"].predict(X)); hi = comp * np.exp(bundle["m90"].predict(X))
    out["price_low"] = np.minimum(lo, out["suggested_price"]).round(0)
    out["price_high"] = np.maximum(hi, out["suggested_price"]).round(0)
    return out


if __name__ == "__main__":
    data = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "pricing.csv")
    bundle, _ = train(data)
    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(bundle, MODEL_DIR / "pricing_model.joblib")
    print(json.dumps(bundle["metrics"], indent=2))
