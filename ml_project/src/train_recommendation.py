"""
Train the recommendation model.

Two-stage funnel model (same idea as production ranking systems):
  P(click | shown)            -> model A (all impressions)
  P(book | clicked)           -> model B (clicked impressions only)
  score = P(click) * P(book | click)  = expected booking probability  -> used for ranking
Time-based split (train before 1 Oct 2025, test after) – no random shuffling for time-series data.
"""
import json, sys, time
from pathlib import Path
import joblib, numpy as np, pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score, log_loss

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.features import build_rec_features, fit_rec_stats, REC_FEATURES

MODEL_DIR = Path(__file__).resolve().parents[1] / "models"


def ndcg_at_k(df, score_col, k=10):
    """Mean NDCG@k over users. relevance: 0 none, 1 click, 3 booked."""
    rel = df["clicked"] + 2 * df["booked"]
    d = df.assign(_rel=rel).sort_values(["user_id", score_col], ascending=[True, False])
    out = []
    disc = 1 / np.log2(np.arange(2, k + 2))
    for _, g in d.groupby("user_id"):
        r = g["_rel"].values
        if r.sum() == 0:
            continue
        gains = (2 ** r[:k] - 1)
        ideal = (2 ** np.sort(r)[::-1][:k] - 1)
        out.append((gains * disc[:len(gains)]).sum() / (ideal * disc[:len(ideal)]).sum())
    return float(np.mean(out))


def train(df: pd.DataFrame, split_date="2025-10-01", seed=0):
    df = df.copy(); df["timestamp"] = pd.to_datetime(df["timestamp"])
    tr, te = df[df.timestamp < split_date].reset_index(drop=True), df[df.timestamp >= split_date].reset_index(drop=True)
    stats = fit_rec_stats(tr)
    Xtr, Xte = build_rec_features(tr, stats, is_train=True), build_rec_features(te, stats)

    params = dict(max_iter=300, learning_rate=0.06, max_leaf_nodes=31, l2_regularization=1.0,
                  categorical_features="from_dtype", early_stopping=True, random_state=seed)
    m_click = HistGradientBoostingClassifier(**params).fit(Xtr, tr["clicked"])
    ctr = tr["clicked"] == 1
    m_book = HistGradientBoostingClassifier(**params).fit(Xtr[ctr], tr.loc[ctr, "booked"])

    te["p_click"] = m_click.predict_proba(Xte)[:, 1]
    te["p_book_given_click"] = m_book.predict_proba(Xte)[:, 1]
    te["score"] = te["p_click"] * te["p_book_given_click"]
    # baseline: popularity (item CTR) ranking
    te["pop_score"] = Xte["item_ctr"].values
    te["rand_score"] = np.random.default_rng(0).random(len(te))

    metrics = {
        "auc_click": roc_auc_score(te["clicked"], te["p_click"]),
        "logloss_click": log_loss(te["clicked"], te["p_click"]),
        "auc_book_given_click": roc_auc_score(te.loc[te.clicked == 1, "booked"], te.loc[te.clicked == 1, "p_book_given_click"]),
        "auc_book_overall": roc_auc_score(te["booked"], te["score"]),
        "ndcg@10_model": ndcg_at_k(te, "score"),
        "ndcg@10_popularity_baseline": ndcg_at_k(te, "pop_score"),
        "ndcg@10_random_baseline": ndcg_at_k(te, "rand_score"),
        "train_rows": len(tr), "test_rows": len(te),
        "test_ctr": float(te["clicked"].mean()), "test_book_rate": float(te["booked"].mean()),
    }
    bundle = {"model_click": m_click, "model_book": m_book, "stats": stats, "features": REC_FEATURES,
              "metrics": metrics, "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
              "reference_features": Xte.sample(min(20000, len(Xte)), random_state=0).reset_index(drop=True)}
    return bundle, te


def predict_scores(bundle, df: pd.DataFrame) -> pd.DataFrame:
    X = build_rec_features(df, bundle["stats"])
    out = df.copy()
    out["p_click"] = bundle["model_click"].predict_proba(X)[:, 1]
    out["p_book_given_click"] = bundle["model_book"].predict_proba(X)[:, 1]
    out["score"] = out["p_click"] * out["p_book_given_click"]
    return out


def recommend_top_k(bundle, candidates: pd.DataFrame, k=10):
    """candidates: rows for ONE user (user_id,item_id,distance_km,price,is_available,category,area,month)."""
    return predict_scores(bundle, candidates).sort_values("score", ascending=False).head(k)


if __name__ == "__main__":
    data = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "recommendation.csv")
    bundle, _ = train(data)
    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(bundle, MODEL_DIR / "recommendation_model.joblib")
    print(json.dumps(bundle["metrics"], indent=2, default=float))
