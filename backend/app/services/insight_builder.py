from app.utils.feature_map import humanize_feature


def score_band(score):
    if score < 580:
        return "Needs attention"
    if score < 670:
        return "Building"
    if score < 740:
        return "Fair"
    if score < 800:
        return "Strong"
    return "Excellent"


def estimate_accuracy(metrics):
    completeness = 1.0 if metrics["transaction_count"] >= 5 else 0.72
    depth = min(metrics["transaction_count"] / 20, 1.0)
    diversity = min((metrics["income_frequency"] + len(str(metrics["transaction_count"]))) / 10, 1.0)
    accuracy = 78 + completeness * 8 + depth * 7 + diversity * 4
    return round(min(97.0, accuracy), 1)


def build_rule_insights(metrics, feature_importance):
    insights = []
    suggestions = []

    if metrics["missed_payments"] > 1:
        insights.append("You have a lower score because repeated missed payments are increasing repayment risk.")
        suggestions.append("Reduce missed payments to improve score by roughly 50 points and strengthen trust.")

    if metrics["savings_rate"] > 0.2:
        insights.append("Your savings habit is improving your creditworthiness and helping the model trust your profile.")
    else:
        suggestions.append("Increase monthly savings so the model sees stronger financial discipline.")

    if metrics["expense"] > metrics["income"] * 0.75:
        insights.append("Spending is taking a large share of your income, which is holding the score back.")
        suggestions.append("Reduce discretionary spending and keep total outflow under 75% of income.")

    ranked = sorted(feature_importance.items(), key=lambda item: abs(item[1]), reverse=True)[:3]
    for feature, value in ranked:
        label = humanize_feature(feature)
        if value >= 0:
            insights.append(f"{label} is making a positive contribution to the score.")
        else:
            insights.append(f"{label} is applying downward pressure on the score.")

    if not suggestions:
        suggestions.append("Keep timely payments and maintain a monthly surplus to preserve score momentum.")

    return insights[:4], suggestions[:4]


def build_base_insights(report):
    metrics = report["metrics"]
    insights, suggestions = build_rule_insights(metrics, report["feature_importance"])

    report["score_band"] = score_band(report["credit_score"])
    report["analysis_accuracy"] = estimate_accuracy(metrics)
    report["insights"] = insights
    report["suggestions"] = suggestions
    report["llm_enabled"] = False
    return report
