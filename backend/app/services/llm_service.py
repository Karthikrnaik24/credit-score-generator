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
                        "Use the provided score band, SHAP-style signals, and metrics to personalize the output. "
                        "Do not repeat generic advice. Each insight must explain why this score looks the way it does "
                        "for this specific profile, and each suggestion must address the most important negative driver. "
                        "Mention concrete factors like missed payments, savings rate, spending pressure, balance stress, "
                        "or income stability only when supported by the data. Avoid policy or legal advice, and keep the tone direct and helpful."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Build Behavioral Lens and Next Best Moves for this report. "
                        "Base them on the score, score band, and strongest affecting factors.\n"
                        f"{json.dumps(prompt)}"
                    ),
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
