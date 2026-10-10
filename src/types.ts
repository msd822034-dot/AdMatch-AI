/**
 * Data types and interfaces for AdMatch AI Auditor
 */

export type BusinessCategory = 'financial_services' | 'saas' | 'ecommerce' | 'other';
export type AdPlatform = 'google_ads' | 'meta_ads' | 'other';
export type SourceMode = 'html_snapshot' | 'raw_paste' | 'live_url' | 'zip_upload';

export type ClaimClassification =
  | 'Explicitly Supported'
  | 'Partially Supported'
  | 'Implied but Not Explicit'
  | 'Not Found'
  | 'Contradicted'
  | 'Requires Human Review';

export type PositionCategory =
  | 'Above the Fold / Hero'
  | 'Above the Fold / Hero (Estimated)'
  | 'Primary Content'
  | 'Secondary Content'
  | 'FAQ or Supporting Content'
  | 'Footer'
  | 'Metadata: Page Title'
  | 'Metadata: Meta Description'
  | 'Unknown Position';

export type FindingPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type FixTarget = 'ad' | 'landing_page' | 'both';
export type ReviewStatus = 'Open' | 'In Progress' | 'Resolved' | 'Dismissed';

export type EvidenceSourceType =
  | 'page_title'
  | 'meta_description'
  | 'hero_section'
  | 'main_body'
  | 'faq'
  | 'footer'
  | 'cta_button'
  | 'other';

export interface AdInput {
  name: string;
  category: BusinessCategory;
  platform: AdPlatform;
  headlines: string[];
  descriptions: string[];
  displayUrl?: string;
  finalUrl: string;
  cta: string;
  offerDetails?: string;
  priceOrDiscount?: string;
  eligibilityConditions?: string;
  campaignNotes?: string;
}

export interface ExtractedSection {
  id: string;
  sectionName: string;
  evidenceSource: EvidenceSourceType;
  positionCategory: PositionCategory;
  domSelector?: string;
  readingOrder: number;
  text: string;
  characterOffsetStart: number;
  characterOffsetEnd: number;
}

export interface ExtractedPageContent {
  title: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  heroText: string;
  mainContent: string;
  productDescriptions: string[];
  pricesAndDiscounts: string[];
  guaranteesAndConditions: string[];
  ctaButtons: { text: string; href?: string }[];
  faqItems: { question: string; answer: string }[];
  trustSignals: string[];
  footerText: string;
  canonicalText: string;
  sections: ExtractedSection[];
  contentLength: number;
  extractedAt: string;
  extractionStatus: 'success' | 'partial' | 'failed';
  sourceMode: SourceMode;
  sourceUrl?: string;
  sourceFilename?: string;
  contentHash: string;
  warnings?: string[];
}

export interface EvidenceRecord {
  quote: string;
  isVerified: boolean;
  verificationMethod: 'exact_substring' | 'normalized_substring' | 'rejected_hallucination' | 'none';
  evidenceSource: EvidenceSourceType;
  positionCategory: PositionCategory;
  sectionName: string;
  semanticRelevance: 'supports' | 'contradicts' | 'irrelevant' | 'none';
  isSemanticallyRelevant: boolean;
  relevanceExplanation?: string;
  readingOrder?: number;
  characterOffset?: number;
  domSelector?: string;
  confidenceScore: number;
}

export interface MismatchFinding {
  id: string;
  adClaim: string;
  claimType: 'headline' | 'description' | 'cta' | 'offer' | 'guarantee' | 'price';
  classification: ClaimClassification;
  evidenceQuote?: string;
  verifiedEvidence?: EvidenceRecord;
  evidenceSource?: EvidenceSourceType;
  positionCategory: PositionCategory;
  explanation: string;
  recommendedFix: string;
  priority: FindingPriority;
  fixTarget: FixTarget;
  estimatedEffort: 'Low' | 'Medium' | 'High';
  reviewStatus: ReviewStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isVerifiedFact: boolean;
  evidenceReferences?: EvidenceRecord[];
}

export interface ComplianceRiskWarning {
  id: string;
  riskType:
    | 'guaranteed_approval'
    | 'guaranteed_return'
    | 'risk_free_product'
    | 'medical_health_guarantee'
    | 'unsupported_savings'
    | 'misleading_discount'
    | 'unsubstantiated_superlative'
    | 'missing_eligibility_conditions'
    | 'missing_material_offer_terms';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  adClaimExcerpt: string;
  landingPageExcerpt?: string;
  recommendedComplianceAction: string;
}

export interface RewrittenAdSuggestion {
  suggestedHeadlines: string[];
  suggestedDescriptions: string[];
  suggestedCta: string;
  rationale: string;
  strictlyGroundedInPageContent: boolean;
}

export interface CategoryScores {
  promiseAlignment: number;      // weight 30%
  offerConsistency: number;      // weight 25%
  claimSupport: number;          // weight 20%
  ctaConsistency: number;        // weight 15%
  contentProminence: number;     // weight 10%
}

export interface EvidenceIntegrity {
  totalFindings: number;
  quoteExistenceRate: number;              // Percentage of quotes that actually exist in page content
  claimRelevanceRate: number;              // Percentage of existing quotes that actually support/address the claim
  findingsWithSufficientEvidence: number;  // Findings supported by verified & relevant evidence
  rejectedOrUnverifiedCount: number;       // Rejected hallucinations + unverified quotes
  verifiedQuotes: number;                  // Quotes that exist on page
  rejectedQuotes: number;                  // Hallucinated quotes rejected
  irrelevantQuotes: number;                // Quotes that exist on page but fail claim relevance
  findingsWithoutEvidence: number;
  evidenceVerificationPercentage: number;  // Quote existence rate
  evidenceCoverageScore: number;
}

export interface AuditReport {
  id: string;
  createdAt: string;
  updatedAt: string;
  adInput: AdInput;
  extractedPage?: ExtractedPageContent;
  messageMatchScore: number;
  rawWeightedScore?: number;
  isProvisional: boolean;
  scoringStatusText: string;
  categoryScores: CategoryScores;
  findings: MismatchFinding[];
  complianceRisks: ComplianceRiskWarning[];
  rewrittenAd?: RewrittenAdSuggestion;
  evidenceIntegrity: EvidenceIntegrity;
  analysisMode: 'gemini_llm' | 'deterministic_baseline';
  summaryRationale: string;
}

export interface BatchRowInput {
  rowId: number;
  audit_name: string;
  category: BusinessCategory;
  headline: string;
  description: string;
  landing_page_url: string;
  cta: string;
  snapshot_filename?: string;
  raw_html?: string;
}

export interface BatchItemResult {
  rowId: number;
  auditId?: string;
  auditName: string;
  status: 'completed' | 'failed' | 'needs_content';
  score?: number;
  criticalIssuesCount: number;
  error?: string;
}

export interface BatchJob {
  id: string;
  name: string;
  createdAt: string;
  totalRows: number;
  completedRows: number;
  failedRows: number;
  items: BatchItemResult[];
  status: 'processing' | 'completed' | 'partial';
}
