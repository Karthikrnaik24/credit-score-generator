from pathlib import Path
import pickle

import pandas as pd
import shap

MODEL_PATH = Path(__file__).resolve().parent.parent / "models" / "model.pkl"

FEATURE_NAMES = [
    "income",
    "expense",
    "avg_expense",
    "txn_count",
    "savings_rate",
    "income_freq",
    "avg_balance",
    "min_balance",
    "cashflow_stability",
    "essential_ratio",
    "luxury_ratio",
]

with MODEL_PATH.open("rb") as model_file:
    model = pickle.load(model_file)

explainer = shap.Explainer(model)


def predict_score(features):
    frame = pd.DataFrame([features], columns=FEATURE_NAMES)
    prediction = float(model.predict(frame)[0])
    shap_values = explainer(frame)
    explanation = {
        FEATURE_NAMES[index]: float(shap_values.values[0][index])
        for index in range(len(FEATURE_NAMES))
    }
    return prediction, explanation
