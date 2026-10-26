"""
ML Serving & MLOps Monitoring Microservice for Borrowly
- Serves:
  1. /predict/pricing: Model-based price suggestion with confidence bounds
  2. /predict/recommend: ML 2-stage funnel ranking model (P(click) * P(book|click))
  3. /metrics: Prometheus metrics & MLOps system telemetry
  4. /mlops/stats: Live drift, request counts, latency & performance monitoring stats
"""
import os
import sys
import time
from typing import List, Optional, Dict, Any
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
from src.features import build_price_features, build_rec_features

app = FastAPI(title="Borrowly ML & MLOps Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained models
MODELS_DIR = BASE_DIR / "models"
PRICING_MODEL_PATH = MODELS_DIR / "pricing_model.joblib"
REC_MODEL_PATH = MODELS_DIR / "recommendation_model.joblib"

pricing_bundle = None
rec_bundle = None

try:
    if PRICING_MODEL_PATH.exists():
        pricing_bundle = joblib.load(PRICING_MODEL_PATH)
        print(f"[ML Service] Loaded pricing model trained at {pricing_bundle.get('trained_at')}")
except Exception as e:
    print(f"[ML Service] Error loading pricing model: {e}")

try:
    if REC_MODEL_PATH.exists():
        rec_bundle = joblib.load(REC_MODEL_PATH)
        print(f"[ML Service] Loaded rec model trained at {rec_bundle.get('trained_at')}")
except Exception as e:
    print(f"[ML Service] Error loading recommendation model: {e}")

# MLOps in-memory tracking & telemetry
mlops_metrics = {
    "pricing_requests": 0,
    "rec_requests": 0,
    "total_predictions": 0,
    "errors": 0,
    "avg_pricing_latency_ms": 0.0,
    "avg_rec_latency_ms": 0.0,
    "recent_price_predictions": [],
    "recent_rec_scores": [],
    "started_at": time.time()
}

# ----------------- Request Schemas -----------------
class PricingItemRequest(BaseModel):
    category: str
    brand: Optional[str] = "Generic"
    condition: Optional[str] = "Good"
    area: Optional[str] = "Adyar"
    lat: Optional[float] = 13.0067
    lng: Optional[float] = 80.2574
    asking_price_per_day: Optional[float] = None
    comparable_median_price: Optional[float] = None
    category_area_demand_30d: Optional[float] = 45.0
    rental_start_date: Optional[str] = None
    booking_date: Optional[str] = None

class CandidateItem(BaseModel):
    id: str
    category: str
    area: str
    price: float
    distance_km: Optional[float] = 3.0
    is_available: Optional[int] = 1
    month: Optional[int] = 10

class RecCandidatesRequest(BaseModel):
    user_id: str
    candidates: List[CandidateItem]

# ----------------- Endpoints -----------------
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "pricing_model_loaded": pricing_bundle is not None,
        "rec_model_loaded": rec_bundle is not None,
        "service": "Borrowly ML & MLOps Engine"
    }

@app.post("/predict/pricing")
def predict_pricing(req: PricingItemRequest):
    t0 = time.time()
    mlops_metrics["pricing_requests"] += 1
    
    if not pricing_bundle:
        raise HTTPException(status_code=503, detail="Pricing model is not loaded")

    try:
        # Default category medians if comparable_median_price not provided
        cat_medians = {
            "Electronics": 450.0,
            "Cameras & Photography": 650.0,
            "Tools & DIY": 300.0,
            "Sports & Fitness": 250.0,
            "Travel & Camping": 400.0,
            "Home & Kitchen": 220.0,
            "Books & Study": 90.0,
            "Events & Party Supplies": 850.0
        }
        comp_med = req.comparable_median_price or cat_medians.get(req.category, 350.0)
        asking = req.asking_price_per_day or comp_med
        today_str = time.strftime("%Y-%m-%d")

        row = {
            "category": req.category,
            "brand": req.brand or "Generic",
            "condition": req.condition or "Good",
            "area": req.area or "Adyar",
            "lat": req.lat or 13.0067,
            "lng": req.lng or 80.2574,
            "asking_price_per_day": asking,
            "comparable_median_price": comp_med,
            "category_area_demand_30d": req.category_area_demand_30d or 45.0,
            "rental_start_date": req.rental_start_date or today_str,
            "booking_date": req.booking_date or today_str
        }

        df = pd.DataFrame([row])
        X = build_price_features(df, pricing_bundle["categories"])

        pred_log = float(pricing_bundle["m50"].predict(X)[0])
        p10_log = float(pricing_bundle["m10"].predict(X)[0])
        p90_log = float(pricing_bundle["m90"].predict(X)[0])

        suggested = round(float(comp_med * np.exp(pred_log)), 0)
        price_low = round(float(comp_med * np.exp(p10_log)), 0)
        price_high = round(float(comp_med * np.exp(p90_log)), 0)

        latency = (time.time() - t0) * 1000
        mlops_metrics["total_predictions"] += 1
        n = mlops_metrics["pricing_requests"]
        mlops_metrics["avg_pricing_latency_ms"] = round((mlops_metrics["avg_pricing_latency_ms"] * (n - 1) + latency) / n, 2)
        mlops_metrics["recent_price_predictions"].append({
            "suggested": suggested,
            "low": price_low,
            "high": price_high,
            "category": req.category,
            "latency_ms": round(latency, 2),
            "timestamp": time.time()
        })
        if len(mlops_metrics["recent_price_predictions"]) > 50:
            mlops_metrics["recent_price_predictions"].pop(0)

        return {
            "suggested_price": suggested,
            "price_low": min(price_low, suggested),
            "price_high": max(price_high, suggested),
            "comparable_median": comp_med,
            "model_confidence": "80% prediction interval",
            "model_version": "v1-HistGradientBoostingRegressor",
            "latency_ms": round(latency, 2)
        }
    except Exception as e:
        mlops_metrics["errors"] += 1
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/recommend")
def predict_recommend(req: RecCandidatesRequest):
    t0 = time.time()
    mlops_metrics["rec_requests"] += 1
    
    if not rec_bundle:
        raise HTTPException(status_code=503, detail="Recommendation model not loaded")

    if not req.candidates:
        return {"ranked_items": [], "latency_ms": 0.0}

    try:
        now_month = int(time.strftime("%m"))
        rows = []
        for c in req.candidates:
            rows.append({
                "user_id": req.user_id,
                "item_id": c.id,
                "category": c.category,
                "area": c.area,
                "price": float(c.price),
                "distance_km": float(c.distance_km if c.distance_km is not None else 3.0),
                "is_available": int(c.is_available if c.is_available is not None else 1),
                "month": int(c.month or now_month)
            })

        df = pd.DataFrame(rows)
        X = build_rec_features(df, rec_bundle["stats"])

        p_click = rec_bundle["model_click"].predict_proba(X)[:, 1]
        p_book_given_click = rec_bundle["model_book"].predict_proba(X)[:, 1]
        scores = p_click * p_book_given_click

        ranked = []
        for i, c in enumerate(req.candidates):
            sc = float(scores[i])
            pc = float(p_click[i])
            pb = float(p_book_given_click[i])
            ranked.append({
                "id": c.id,
                "ml_score": round(sc, 5),
                "p_click": round(pc, 4),
                "p_book": round(pb, 4),
                "rank_reason": "ML 2-stage Funnel: High booking affinity" if sc > 0.05 else "ML personalized candidate"
            })

        ranked.sort(key=lambda x: x["ml_score"], reverse=True)

        latency = (time.time() - t0) * 1000
        mlops_metrics["total_predictions"] += len(req.candidates)
        n = mlops_metrics["rec_requests"]
        mlops_metrics["avg_rec_latency_ms"] = round((mlops_metrics["avg_rec_latency_ms"] * (n - 1) + latency) / n, 2)
        if ranked:
            mlops_metrics["recent_rec_scores"].append({
                "top_score": ranked[0]["ml_score"],
                "candidate_count": len(ranked),
                "latency_ms": round(latency, 2),
                "timestamp": time.time()
            })
            if len(mlops_metrics["recent_rec_scores"]) > 50:
                mlops_metrics["recent_rec_scores"].pop(0)

        return {
            "ranked_items": ranked,
            "mode": "ml_gradient_boosting_funnel",
            "model_version": "v1-2stage-histgb",
            "latency_ms": round(latency, 2)
        }
    except Exception as e:
        mlops_metrics["errors"] += 1
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mlops/stats")
def get_mlops_stats():
    uptime_sec = round(time.time() - mlops_metrics["started_at"], 1)
    return {
        "service": "Borrowly MLOps Monitoring Dashboard",
        "status": "active",
        "uptime_seconds": uptime_sec,
        "models": {
            "pricing": {
                "loaded": pricing_bundle is not None,
                "type": "HistGradientBoosting Quantile Regressor",
                "trained_metrics": pricing_bundle.get("metrics") if pricing_bundle else None,
                "trained_at": pricing_bundle.get("trained_at") if pricing_bundle else None,
                "total_requests": mlops_metrics["pricing_requests"],
                "avg_latency_ms": mlops_metrics["avg_pricing_latency_ms"]
            },
            "recommendation": {
                "loaded": rec_bundle is not None,
                "type": "2-Stage Funnel (P(click) * P(book|click))",
                "trained_metrics": rec_bundle.get("metrics") if rec_bundle else None,
                "trained_at": rec_bundle.get("trained_at") if rec_bundle else None,
                "total_requests": mlops_metrics["rec_requests"],
                "avg_latency_ms": mlops_metrics["avg_rec_latency_ms"]
            }
        },
        "telemetry": {
            "total_predictions": mlops_metrics["total_predictions"],
            "total_errors": mlops_metrics["errors"],
            "recent_pricing_samples": mlops_metrics["recent_price_predictions"][-10:],
            "recent_rec_samples": mlops_metrics["recent_rec_scores"][-10:]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
