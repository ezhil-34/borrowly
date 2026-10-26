# Rental Marketplace ML – Synthesis + Training (Recommendation & Price Suggestion)

## Quick start
```bash
pip install -r requirements.txt
python src/synth_recommendation.py   # -> data/recommendation.csv   (300k impressions)
python src/synth_pricing.py          # -> data/pricing.csv          (60k listings/bookings)
python src/train_recommendation.py   # -> models/recommendation_model.joblib
python src/train_pricing.py          # -> models/pricing_model.joblib
jupyter notebook notebooks/01_synthesis_training_evaluation.ipynb   # same flow, with plots
```

## Datasets (exact columns you specified)
**Recommendation** – one row per impression: `user_id, item_id, timestamp, shown, clicked, booked, completed, distance_km, price, is_available, category, area, month`
Funnel `shown → clicked → booked → completed`. Hidden truth baked into the generator: user category preference, distance penalty,
price vs category median, availability, seasonality, item quality.

**Pricing** – one row per listing/booking: `item_id, category, brand, condition, area, lat, lng, asking_price_per_day, actual_agreed_price_per_day, booking_date, rental_start_date, completed, comparable_median_price, category_area_demand_30d`
`fair_price = base × brand × condition × area × demand`; owners over-ask, negotiation pulls toward fair price; agreed price exists only for booked rows.

## Models
| | Recommendation | Price suggestion |
|---|---|---|
| Approach | 2-stage funnel: `score = P(click) · P(book∣click)` | median + p10 + p90 quantile regressors → price **and range** |
| Algorithm | HistGradientBoosting (sklearn, native categoricals) | HistGradientBoosting quantile loss |
| Key features | user×category click rate, item CTR/booking rate (leave-one-out, smoothed), rel. price, distance, availability, season | `ask_ratio`, comparable median, demand, brand, condition, area, lead days |
| Target | clicked / booked∣clicked | `log(agreed / comparable_median)` |
| Split | time-based (train < Oct-2025, test ≥ Oct-2025) | time-based on `booking_date` |
| Test results (synthetic) | AUC(click) 0.70, NDCG@10 **0.43** vs popularity 0.34 vs random 0.23 | MAPE **4.6 %** vs asking-price 9.7 % vs comparable-median 8.0 %; R² 0.98; 80 % interval coverage ≈ 75 % |

## Use the trained models
```python
import joblib, pandas as pd
from src import train_recommendation as rec, train_pricing as pri
rb = joblib.load("models/recommendation_model.joblib")
top10 = rec.recommend_top_k(rb, candidates_df_for_one_user, k=10)
pb = joblib.load("models/pricing_model.joblib")
pri.suggest_price(pb, new_listings_df)    # -> suggested_price, price_low, price_high
```

## Real data
Keep the same column names and replace `data/*.csv`; `features.py` + trainers don't change.
Design notes: leave-one-out target statistics prevent label leakage; time-based split prevents look-ahead;
`src/features.py` is shared with the MLOps project so training and serving use identical code.
