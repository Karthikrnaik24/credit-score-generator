import json
import os
import re

from openai import OpenAI


def _extract_json_block(text):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in model response.")
    return json.loads(match.group(0))


def enrich_report_with_llm(report):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return report

    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-5.2")

    prompt = {
        "credit_score": report["credit_score"],
        "score_band": report["score_band"],
        "analysis_accuracy": report["analysis_accuracy"],
        "metrics": report["metrics"],
        "top_categories": report["top_categories"],
        "feature_importance": report["feature_importance"],
        "base_insights": report["insights"],
        "base_suggestions": report["suggestions"],
    }

    try:
        response = client.responses.create(
            model=model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are a financial insights assistant for a credit score dashboard. "
                        "Return valid JSON only with keys insights and suggestions. "
                        "Each key must contain an array of 3 short, human, non-technical strings. "
                        "Use the provided SHAP-style signals and metrics, avoid policy or legal advice, "
                        "and keep the tone direct and helpful."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(prompt),
                },
            ],
        )

        parsed = _extract_json_block(response.output_text)
        report["insights"] = parsed.get("insights", report["insights"])[:3]
        report["suggestions"] = parsed.get("suggestions", report["suggestions"])[:3]
        report["llm_enabled"] = True
    except Exception:
        report["llm_enabled"] = False
    return report
