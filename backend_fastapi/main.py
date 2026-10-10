import os
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .schemas import AdInputSchema, AuditReportSchema

app = FastAPI(
    title="AdMatch AI — Ad-to-Landing-Page Message Match Auditor",
    description="PS-03 Auditor Backend with Strict Evidence Verification & Deterministic Scoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for demonstrations
audits_db: Dict[str, Any] = {}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AdMatch-FastAPI-Engine",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/audits", response_model=List[Dict[str, Any]])
def list_audits():
    return list(audits_db.values())

@app.get("/api/audits/{audit_id}")
def get_audit(audit_id: str):
    if audit_id not in audits_db:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audits_db[audit_id]

@app.delete("/api/audits/{audit_id}")
def delete_audit(audit_id: str):
    if audit_id not in audits_db:
        raise HTTPException(status_code=404, detail="Audit not found")
    del audits_db[audit_id]
    return {"success": True, "message": "Audit deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
