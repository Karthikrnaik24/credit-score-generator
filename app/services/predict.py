import pickle
import shap
import pandas as pd

# 🔹 Load trained model
model = pickle.load(open("app/model/finalmodel.pkl", "rb"))

# 🔹 Create SHAP explainer (for tree models like XGBoost)
explainer = shap.Explainer(model)

# 🔹 Feature names (MUST match training order)
feature_names = [
    "income", "expense", "avg_expense", "txn_count",
    "savings_rate", "income_freq",
    "avg_balance", "min_balance", "cashflow_stability",
    "essential_ratio", "luxury_ratio"
]


def predict_score(features):
    # Convert to DataFrame
    df = pd.DataFrame([features], columns=feature_names)

    # 🔹 Convert prediction to Python float
    prediction = float(model.predict(df)[0])

    # 🔹 SHAP values
    shap_values = explainer(df)

    # 🔹 Convert ALL values to Python float
    explanation = {
        feature_names[i]: float(shap_values.values[0][i])
        for i in range(len(feature_names))
    }

    return prediction, explanation