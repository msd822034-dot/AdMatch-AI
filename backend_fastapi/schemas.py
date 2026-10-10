from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class AdInputSchema(BaseModel):
    name: str
    category: Literal["financial_services", "saas", "ecommerce", "other"]
    platform: Literal["google_ads", "meta_ads", "other"]
    headlines: List[str]
    descriptions: List[str]
    displayUrl: Optional[str] = None
    finalUrl: str
    cta: str
    offerDetails: Optional[str] = None
    priceOrDiscount: Optional[str] = None
    eligibilityConditions: Optional[str] = None
    campaignNotes: Optional[str] = None

class EvidenceRecordSchema(BaseModel):
    quote: str
    isVerified: bool
    verificationMethod: Literal["exact_substring", "normalized_substring", "rejected_hallucination", "none"]
    positionCategory: str
    sectionName: str
    readingOrder: Optional[int] = None
    characterOffset: Optional[int] = None
    confidenceScore: float

class MismatchFindingSchema(BaseModel):
    id: str
    adClaim: str
    claimType: str
    classification: str
    evidenceQuote: Optional[str] = None
    verifiedEvidence: Optional[EvidenceRecordSchema] = None
    positionCategory: str
    explanation: str
    recommendedFix: str
    priority: Literal["Critical", "High", "Medium", "Low"]
    fixTarget: Literal["ad", "landing_page", "both"]
    estimatedEffort: Literal["Low", "Medium", "High"]
    reviewStatus: Literal["Open", "In Progress", "Resolved", "Dismissed"] = "Open"
    isVerifiedFact: bool

class CategoryScoresSchema(BaseModel):
    promiseAlignment: int
    offerConsistency: int
    claimSupport: int
    ctaConsistency: int
    contentProminence: int

class AuditReportSchema(BaseModel):
    id: str
    createdAt: str
    updatedAt: str
    adInput: AdInputSchema
    messageMatchScore: int
    isProvisional: bool
    scoringStatusText: str
    categoryScores: CategoryScoresSchema
    findings: List[MismatchFindingSchema]
    analysisMode: str
    summaryRationale: str
