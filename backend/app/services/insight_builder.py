from app.utils.feature_map import humanize_feature


def score_band(score):
    if score < 580:
        return "High Risk"
    if score < 670:
        return "Medium Risk"
    return "Low Risk"


def estimate_accuracy(metrics):
    completeness = 1.0 if metrics["transaction_count"] >= 5 else 0.72
    depth = min(metrics["transaction_count"] / 20, 1.0)
    diversity = min((metrics["income_frequency"] + len(str(metrics["transaction_count"]))) / 10, 1.0)
    accuracy = 78 + completeness * 8 + depth * 7 + diversity * 4
    return round(min(97.0, accuracy), 1)


def build_rule_insights(score, metrics, feature_importance):
    insights = []
    suggestions = []
    score_label = score_band(score)

    if score_label == "High Risk":
        insights.append("The current profile sits in a high-risk band, so lenders will focus heavily on payment discipline and cash-flow gaps.")
    elif score_label == "Medium Risk":
        insights.append("The profile is in a medium-risk band, which means the score is serviceable but still sensitive to a few weak drivers.")
    else:
        insights.append("The score is in a low-risk band, supported by stronger repayment capacity and healthier transaction behavior.")

    if metrics["missed_payments"] >= 1:
        insights.append(
            f"{metrics['missed_payments']} missed payment event(s) are increasing perceived default risk and lowering lender confidence."
        )
        suggestions.append("Eliminate missed payments first, because payment discipline is one of the fastest ways to improve approval odds.")

    if metrics["savings_rate"] >= 0.25:
        insights.append("A strong savings rate is helping the model trust the borrower's financial resilience.")
    elif metrics["savings_rate"] <= 0.08:
        insights.append("Thin savings are limiting the score because there is little monthly buffer after spending.")
        suggestions.append("Increase monthly surplus and savings so the account shows a stronger repayment cushion.")

    if metrics["expense"] > metrics["income"] * 0.8:
        insights.append("Spending is consuming most of the income, which makes the profile look stressed.")
        suggestions.append("Reduce total spending intensity and keep outflow below 75% of income.")
    elif metrics["expense"] < metrics["income"] * 0.55:
        insights.append("Expense levels are relatively controlled versus income, which supports better creditworthiness.")

    if metrics["avg_balance"] > 0:
        insights.append("A positive average balance is reinforcing the view that the account can absorb regular obligations.")
    elif metrics["min_balance"] < 0:
        insights.append("Negative balance dips are signaling short-term liquidity stress.")
        suggestions.append("Avoid balance dips below zero to reduce signs of liquidity stress.")

    ranked = sorted(feature_importance.items(), key=lambda item: abs(item[1]), reverse=True)
    negative_drivers = []
    positive_drivers = []

    for feature, value in ranked:
        label = humanize_feature(feature)
        if value >= 0:
            positive_drivers.append(label)
        else:
            negative_drivers.append(label)

    if negative_drivers:
        insights.append(f"The strongest downward pressure on the score is coming from {negative_drivers[0].lower()}.")
        if len(negative_drivers) > 1:
            insights.append(f"Secondary risk is also coming from {negative_drivers[1].lower()}.")
        if "Monthly spending" in negative_drivers or "Average debit size" in negative_drivers:
            suggestions.append("Trim high-spend categories and large debit spikes to reduce spending-related model pressure.")
        if "Lowest balance" in negative_drivers or "Cash-flow stability" in negative_drivers:
            suggestions.append("Stabilize balances across the month to reduce volatility and improve lender comfort.")
        if "Savings rate" in negative_drivers:
            suggestions.append("Build a more visible monthly savings habit so more income remains after expenses.")
        if "Income frequency" in negative_drivers or "Monthly income" in negative_drivers:
            suggestions.append("Strengthen and regularize incoming cash flow before taking on a larger loan obligation.")

    if positive_drivers:
        insights.append(f"Supportive signals in the profile include {', '.join(positive_drivers[:2]).lower()}.")

    if score_label == "High Risk":
        suggestions.append("Start with a smaller loan ask and improve 1-2 key risk drivers before applying for a larger amount.")
    elif score_label == "Medium Risk":
        suggestions.append("A moderate improvement in savings and spending discipline could move this profile into a safer approval zone.")
    else:
        suggestions.append("Maintain current payment discipline and cash-flow stability to preserve strong lending terms.")

    if score < 560:
        suggestions.append("Focus on repayment consistency first, because severe risk signals matter more than optimization at this score level.")
    elif score < 640:
        suggestions.append("A few months of cleaner spending and stronger balances could materially improve approval quality.")
    else:
        suggestions.append("The profile is already near lender-friendly territory, so protect the current strengths and avoid new stress signals.")

    insights = list(dict.fromkeys(insights))
    suggestions = list(dict.fromkeys(suggestions))

    return insights[:4], suggestions[:4]


def build_base_insights(report):
    metrics = report["metrics"]
    insights, suggestions = build_rule_insights(report["credit_score"], metrics, report["feature_importance"])

    report["score_band"] = score_band(report["credit_score"])
    report["analysis_accuracy"] = estimate_accuracy(metrics)
    report["insights"] = insights
    report["suggestions"] = suggestions
    report["llm_enabled"] = False
    return report
