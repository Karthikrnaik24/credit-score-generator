from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.insight_builder import build_base_insights
from app.services.lender_dashboard import build_lender_dashboard
from app.services.llm_service import enrich_report_with_llm
from app.services.pipeline import analyze_uploaded_csv

router = APIRouter()


@router.post("/upload")
async def predict_from_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        report = analyze_uploaded_csv(file.filename, content)
        base_report = build_base_insights(report)
        enriched_report = enrich_report_with_llm(base_report)
        return enriched_report
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {error}") from error


@router.get("/lender-dashboard")
def lender_dashboard():
    try:
        return {"users": build_lender_dashboard()}
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Lender dashboard failed: {error}") from error
