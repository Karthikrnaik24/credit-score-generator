FEATURE_LABELS = {
    "income": "Monthly income",
    "expense": "Monthly spending",
    "avg_expense": "Average debit size",
    "txn_count": "Transaction activity",
    "savings_rate": "Savings rate",
    "income_freq": "Income frequency",
    "avg_balance": "Average balance",
    "min_balance": "Lowest balance",
    "cashflow_stability": "Cash-flow stability",
    "essential_ratio": "Essential spend ratio",
    "luxury_ratio": "Luxury spend ratio",
}


def humanize_feature(feature_name):
    return FEATURE_LABELS.get(feature_name, feature_name.replace("_", " ").title())
