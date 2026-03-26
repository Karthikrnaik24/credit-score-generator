from io import BytesIO

import pandas as pd
from pandas.errors import EmptyDataError, ParserError

from app.services.feature_engineering import extract_features
from app.services.shap_explainer import predict_score


def _normalize_dataframe(frame):
    lowered = {column: column.strip().lower() for column in frame.columns}
    frame = frame.rename(columns=lowered)
    required = {"date", "amount", "type", "category"}
    missing = required.difference(frame.columns)
    if missing:
        raise ValueError(f"Missing required CSV columns: {', '.join(sorted(missing))}")

    frame = frame[list(required)].copy()
    frame["date"] = frame["date"].astype(str).str.strip()
    frame["type"] = frame["type"].astype(str).str.strip().str.lower()
    frame["category"] = frame["category"].astype(str).str.strip().str.lower()
    frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce").fillna(0.0)
    frame = frame.dropna(subset=["date"])
    return frame.to_dict(orient="records")


def analyze_uploaded_csv(file_name, file_content):
    try:
        frame = pd.read_csv(BytesIO(file_content))
    except (UnicodeDecodeError, EmptyDataError, ParserError) as error:
        raise ValueError(f"Could not read CSV file: {error}") from error

    transactions = _normalize_dataframe(frame)
    if not transactions:
        raise ValueError("No valid transactions were found in the uploaded CSV.")

    features, metrics, top_categories, monthly_trend, spend_timeline = extract_features(transactions)
    score, explanation = predict_score(features)

    return {
        "file_name": file_name,
        "credit_score": round(score),
        "metrics": metrics,
        "feature_importance": explanation,
        "top_categories": top_categories,
        "monthly_trend": monthly_trend,
        "spend_timeline": spend_timeline,
    }
