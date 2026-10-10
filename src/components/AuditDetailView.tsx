import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  Share2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  Layers,
  ArrowRight,
  Filter,
  CheckSquare,
  MessageSquare,
  Scale,
  RefreshCw,
  GitCompare,
} from 'lucide-react';
import { AuditReport, MismatchFinding, PositionCategory } from '../types.js';
import { Language, translations } from '../lib/i18n.js';
import { exportAuditAsCsv, exportAuditAsJson, printAuditPdfReport } from '../lib/export.js';
import { updateFindingReview } from '../lib/api.js';

interface AuditDetailViewProps {
  audit: AuditReport;
  allAudits: AuditReport[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onAuditUpdated: (updated: AuditReport) => void;
  lang: Language;
}

export const AuditDetailView: React.FC<AuditDetailViewProps> = ({
  audit,
  allAudits,
  onBack,
  onDelete,
  onAuditUpdated,
  lang,
}) => {
  const t = translations[lang];

  // Active Tab
  const [activeTab, setActiveTab] = useState<'mismatches' | 'evidence' | 'sideBySide' | 'fixPlan' | 'compliance' | 'compare'>('mismatches');

  // Filtering states in Mismatches tab
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [classificationFilter, setClassificationFilter] = useState<string>('all');
  const [evidenceSearch, setEvidenceSearch] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedRelevance, setSelectedRelevance] = useState<string>('all');

  // Version comparison state
  const otherAudits = allAudits.filter((a) => a.id !== audit.id);
  const [compareTargetId, setCompareTargetId] = useState<string>(otherAudits[0]?.id || '');

  // Reviewing modal / state
  const [editingFinding, setEditingFinding] = useState<MismatchFinding | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('Open');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isUpdatingReview, setIsUpdatingReview] = useState<boolean>(false);

  // Score color helpers
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Filtered findings
  const filteredFindings = audit.findings.filter((f) => {
    if (priorityFilter !== 'all' && f.priority !== priorityFilter) return false;
    if (classificationFilter !== 'all' && f.classification !== classificationFilter) return false;
    if (selectedPosition !== 'all' && f.positionCategory !== selectedPosition) return false;
    if (selectedSource !== 'all') {
      const src = f.evidenceSource || f.verifiedEvidence?.evidenceSource;
      if (src !== selectedSource) return false;
    }
    if (selectedRelevance !== 'all') {
      const rel = f.verifiedEvidence?.semanticRelevance || 'none';
      if (rel !== selectedRelevance) return false;
    }
    if (evidenceSearch.trim()) {
      const q = evidenceSearch.toLowerCase();
      const claim = f.adClaim.toLowerCase();
      const quote = (f.evidenceQuote || '').toLowerCase();
      const expl = f.explanation.toLowerCase();
      if (!claim.includes(q) && !quote.includes(q) && !expl.includes(q)) return false;
    }
    return true;
  });

  // Handle Review Status update
  const handleSaveReview = async () => {
    if (!editingFinding) return;
    setIsUpdatingReview(true);
    try {
      const updated = await updateFindingReview(audit.id, editingFinding.id, {
        status: reviewStatus,
        notes: reviewNotes,
        reviewedBy: 'Compliance Reviewer',
      });

      // Update in local state
      const newFindings = audit.findings.map((f) => (f.id === updated.id ? updated : f));
      onAuditUpdated({ ...audit, findings: newFindings });
      setEditingFinding(null);
    } catch (err: any) {
      alert(`Failed to save review: ${err.message}`);
    } finally {
      setIsUpdatingReview(false);
    }
  };

  const compareTarget = allAudits.find((a) => a.id === compareTargetId);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 mb-1"
          >
            ← Back to Audits
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {audit.adInput.name}
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · {audit.adInput.category.toUpperCase()} · {new Date(audit.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
            <span>URL: {audit.adInput.finalUrl}</span>
            <span>· Mode: {audit.analysisMode === 'gemini_llm' ? 'Gemini 3.8 Flash LLM' : 'Deterministic Grounding Baseline'}</span>
          </div>
        </div>

        {/* Action Buttons: Exports & Delete */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => printAuditPdfReport(audit)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Download or Print PDF"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>PDF Report</span>
          </button>

          <button
            onClick={() => exportAuditAsCsv(audit)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Export CSV findings"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportAuditAsJson(audit)}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title="Export JSON"
          >
            <span>JSON</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this audit record?')) {
                onDelete(audit.id);
              }
            }}
            className="rounded-md border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
            title="Delete Audit"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hero Score & Category Breakdown Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Score Gauge */}
          <div className="lg:col-span-4 flex items-center gap-5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-5 dark:border-slate-800">
            <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-slate-100 dark:border-slate-800">
              <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(audit.messageMatchScore)}`}>
                {audit.messageMatchScore}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {t.messageMatchScore}
              </div>
              <div className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                {audit.scoringStatusText}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                {audit.summaryRationale}
              </p>
            </div>
          </div>

          {/* 5-Category Weights Breakdown */}
          <div className="lg:col-span-8 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Deterministic Rubric Score Breakdown</span>
              <span className="text-[11px] text-slate-400">Total 100% Weighted</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <div className="text-[11px] text-slate-500">Promise Alignment</div>
                <div className="text-[10px] text-slate-400">Weight: 30%</div>
                <div className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {audit.categoryScores.promiseAlignment} / 100
                </div>
              </div>

              <div className="rounded bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <div className="text-[11px] text-slate-500">Offer & Price</div>
                <div className="text-[10px] text-slate-400">Weight: 25%</div>
                <div className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {audit.categoryScores.offerConsistency} / 100
                </div>
              </div>

              <div className="rounded bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <div className="text-[11px] text-slate-500">Claim Support</div>
                <div className="text-[10px] text-slate-400">Weight: 20%</div>
                <div className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {audit.categoryScores.claimSupport} / 100
                </div>
              </div>

              <div className="rounded bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <div className="text-[11px] text-slate-500">CTA Alignment</div>
                <div className="text-[10px] text-slate-400">Weight: 15%</div>
                <div className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {audit.categoryScores.ctaConsistency} / 100
                </div>
              </div>

              <div className="rounded bg-slate-50 p-2.5 dark:bg-slate-800/60">
                <div className="text-[11px] text-slate-500">Prominence</div>
                <div className="text-[10px] text-slate-400">Weight: 10%</div>
                <div className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {audit.categoryScores.contentProminence} / 100
                </div>
              </div>
            </div>

            {/* Transparent Reproducible Formula (BUG 3) */}
            <div className="rounded border border-slate-100 bg-slate-50/80 p-2 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300 font-mono">
              <span className="font-sans font-semibold text-slate-700 dark:text-slate-200">Weighted Calculation: </span>
              <span>
                ({audit.categoryScores.promiseAlignment} × 30%) + ({audit.categoryScores.offerConsistency} × 25%) + ({audit.categoryScores.claimSupport} × 20%) + ({audit.categoryScores.ctaConsistency} × 15%) + ({audit.categoryScores.contentProminence} × 10%) = {audit.rawWeightedScore !== undefined ? audit.rawWeightedScore : Number((audit.categoryScores.promiseAlignment * 0.3 + audit.categoryScores.offerConsistency * 0.25 + audit.categoryScores.claimSupport * 0.2 + audit.categoryScores.ctaConsistency * 0.15 + audit.categoryScores.contentProminence * 0.1).toFixed(1))} → <strong>{audit.messageMatchScore}/100</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Integrity & Verification Metrics (BUG 5) */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {audit.evidenceIntegrity.claimRelevanceRate >= 75 && audit.evidenceIntegrity.quoteExistenceRate >= 90 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            )}
            <span className="font-bold text-slate-900 dark:text-white">
              Evidence Grounding & Verification Integrity
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Two-Stage Verified: Existence + Semantic Relevance
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {audit.extractedPage ? (
              <span>Canonical Page DOM: <strong>{audit.extractedPage.contentLength.toLocaleString()} chars</strong> across <strong>{audit.extractedPage.sections.length} sections</strong></span>
            ) : (
              <span>Extraction Incomplete</span>
            )}
          </div>
        </div>

        {/* 4 Distinct Evidence Integrity Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <div className="rounded-md border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-[11px] font-medium text-slate-500">Quote Existence Rate</div>
            <div className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
              {audit.evidenceIntegrity.quoteExistenceRate}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {audit.evidenceIntegrity.verifiedQuotes} verified in DOM · {audit.evidenceIntegrity.rejectedQuotes} rejected hallucinations
            </div>
          </div>

          <div className="rounded-md border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-[11px] font-medium text-slate-500">Claim Relevance Rate</div>
            <div className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
              {audit.evidenceIntegrity.claimRelevanceRate}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {audit.evidenceIntegrity.irrelevantQuotes} quote(s) exist but failed claim relevance
            </div>
          </div>

          <div className="rounded-md border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-[11px] font-medium text-slate-500">Sufficient Evidence Findings</div>
            <div className="mt-0.5 text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {audit.evidenceIntegrity.findingsWithSufficientEvidence} <span className="text-xs font-normal text-slate-400">/ {audit.evidenceIntegrity.totalFindings}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Supported by verified & semantically relevant quotes
            </div>
          </div>

          <div className="rounded-md border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="text-[11px] font-medium text-slate-500">Rejected / Irrelevant Evidence</div>
            <div className="mt-0.5 text-lg font-extrabold text-amber-600 dark:text-amber-400">
              {audit.evidenceIntegrity.rejectedOrUnverifiedCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {audit.evidenceIntegrity.rejectedQuotes} hallucinations + {audit.evidenceIntegrity.irrelevantQuotes} irrelevant quotes
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            <em>Evidence Principle:</em> Exact quote presence in the page text does NOT guarantee claim support. Quotes must directly substantiate the advertised benefit.
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Coverage Score: {audit.evidenceIntegrity.evidenceCoverageScore}%
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('mismatches')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'mismatches'
                ? 'border-sky-600 text-sky-600 font-semibold dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Mismatch Findings ({audit.findings.length})
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'evidence'
                ? 'border-sky-600 text-sky-600 font-semibold dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Evidence Explorer
          </button>

          <button
            onClick={() => setActiveTab('sideBySide')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'sideBySide'
                ? 'border-sky-600 text-sky-600 font-semibold dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Ad vs Page Comparison
          </button>

          <button
            onClick={() => setActiveTab('fixPlan')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'fixPlan'
                ? 'border-sky-600 text-sky-600 font-semibold dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Fix Plan & Grounded Ad
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'border-sky-600 text-sky-600 font-semibold dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Compliance Risks</span>
            {audit.complianceRisks.length > 0 && (
              <span className="rounded-full bg-rose-100 text-rose-700 px-1.5 py-0.2 text-[10px] font-bold">
                {audit.complianceRisks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'compare'
                ? 'border-sky-600 text-sky-600 font-semibold dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Compare Versions
          </button>
        </nav>
      </div>

      {/* TAB 1: Mismatch Findings Table */}
      {activeTab === 'mismatches' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-medium">Filter by:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              <select
                value={classificationFilter}
                onChange={(e) => setClassificationFilter(e.target.value)}
                className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Classifications</option>
                <option value="Contradicted">Contradicted</option>
                <option value="Not Found">Not Found</option>
                <option value="Explicitly Supported">Explicitly Supported</option>
                <option value="Partially Supported">Partially Supported</option>
                <option value="Implied but Not Explicit">Implied but Not Explicit</option>
                <option value="Requires Human Review">Requires Human Review</option>
              </select>

              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Evidence Sources</option>
                <option value="hero_section">Hero Section</option>
                <option value="main_body">Main Body</option>
                <option value="faq">FAQ</option>
                <option value="footer">Footer</option>
                <option value="page_title">Page Title (Metadata)</option>
                <option value="meta_description">Meta Description (Metadata)</option>
                <option value="cta_button">CTA Button</option>
              </select>

              <select
                value={selectedRelevance}
                onChange={(e) => setSelectedRelevance(e.target.value)}
                className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Semantic Relevance</option>
                <option value="supports">Supports Claim</option>
                <option value="irrelevant">Irrelevant to Claim</option>
                <option value="contradicts">Contradicts Claim</option>
                <option value="none">No Quote Found</option>
              </select>

              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Page Positions</option>
                <option value="Above the Fold / Hero">Above the Fold / Hero</option>
                <option value="Above the Fold / Hero (Estimated)">Above the Fold (Estimated)</option>
                <option value="Primary Content">Primary Content</option>
                <option value="Secondary Content">Secondary Content</option>
                <option value="FAQ or Supporting Content">FAQ / Supporting</option>
                <option value="Metadata: Page Title">Metadata: Page Title</option>
                <option value="Metadata: Meta Description">Metadata: Meta Description</option>
                <option value="Footer">Footer (Low Prominence)</option>
                <option value="Unknown Position">Unknown Position</option>
              </select>
            </div>

            <div>
              <input
                type="text"
                value={evidenceSearch}
                onChange={(e) => setEvidenceSearch(e.target.value)}
                placeholder="Search claims or quotes..."
                className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Ad Promise / Claim</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Classification</th>
                  <th className="px-4 py-2.5">Verified Page Quote & Semantic Relevance</th>
                  <th className="px-4 py-2.5">Evidence Source & Position</th>
                  <th className="px-4 py-2.5">Recommended Action</th>
                  <th className="px-4 py-2.5">Review Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredFindings.map((finding) => (
                  <tr
                    key={finding.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          finding.priority === 'Critical'
                            ? 'text-rose-600 dark:text-rose-400'
                            : finding.priority === 'High'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {finding.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-xs">
                      <div>{finding.adClaim}</div>
                      {finding.evidenceReferences && finding.evidenceReferences.length > 1 && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                          <span>{finding.evidenceReferences.length} verified evidence sources</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {finding.claimType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${
                          finding.classification === 'Explicitly Supported'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : finding.classification === 'Contradicted'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : finding.classification === 'Not Found'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {finding.classification}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      {finding.evidenceQuote ? (
                        <div className="space-y-1">
                          <p className="italic text-slate-700 dark:text-slate-300 line-clamp-2">
                            "{finding.evidenceQuote}"
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {finding.verifiedEvidence?.isSemanticallyRelevant ? (
                              finding.verifiedEvidence.semanticRelevance === 'supports' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded dark:bg-emerald-950/40 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> Supports Claim
                                </span>
                              ) : finding.verifiedEvidence.semanticRelevance === 'contradicts' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded dark:bg-rose-950/40 dark:text-rose-400">
                                  <XCircle className="h-3 w-3" /> Contradicts Claim
                                </span>
                              ) : null
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded dark:bg-amber-950/40 dark:text-amber-400">
                                <AlertTriangle className="h-3 w-3" /> Irrelevant to Claim
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              · Verified via {finding.verifiedEvidence?.verificationMethod || 'exact match'}
                            </span>
                          </div>
                          {finding.verifiedEvidence && !finding.verifiedEvidence.isSemanticallyRelevant && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                              {finding.verifiedEvidence.relevanceExplanation || 'Quote exists on page but does not substantiate the claim'}
                            </p>
                          )}
                          {finding.evidenceReferences && finding.evidenceReferences.length > 1 && (
                            <div className="mt-2 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-1.5">
                              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Corroborating Evidence References ({finding.evidenceReferences.length}):
                              </div>
                              {finding.evidenceReferences.map((ref, rIdx) => (
                                <div key={rIdx} className="rounded bg-slate-50 dark:bg-slate-800/50 p-1.5 text-[10px]">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">[{ref.sectionName || ref.evidenceSource}] ({ref.positionCategory}):</span>{' '}
                                  <span className="italic">"{ref.quote}"</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No verified evidence on page</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-block self-start text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {finding.evidenceSource || finding.verifiedEvidence?.evidenceSource || 'other'}
                        </span>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {finding.positionCategory}
                        </div>
                        {finding.verifiedEvidence?.sectionName && (
                          <div className="text-[10px] text-slate-400">
                            {finding.verifiedEvidence.sectionName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs text-slate-700 dark:text-slate-300">
                      {finding.recommendedFix}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                          finding.reviewStatus === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : finding.reviewStatus === 'In Progress'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {finding.reviewStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingFinding(finding);
                          setReviewStatus(finding.reviewStatus);
                          setReviewNotes(finding.reviewNotes || '');
                        }}
                        className="rounded px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-slate-800"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Evidence Explorer */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Extracted Landing Page Canonical Content & Structured Sections
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Every section parsed from DOM with character offsets, semantic position, and DOM selector mapping.
            </p>

            <div className="mt-4 space-y-3">
              {audit.extractedPage?.sections.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      #{sec.readingOrder} — {sec.sectionName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Offsets: [{sec.characterOffsetStart} - {sec.characterOffsetEnd}]
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Position: <strong>{sec.positionCategory}</strong></span>
                    {sec.domSelector && <span>· Selector: <code className="font-mono">{sec.domSelector}</code></span>}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-white p-2.5 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-900 font-mono text-[11px] leading-relaxed">
                    {sec.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Side-by-Side Comparison */}
      {activeTab === 'sideBySide' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: What the ad promises */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                <span>What the Advertisement Promises</span>
              </div>

              <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-950 dark:bg-sky-950/20 space-y-2">
                <div className="text-xs text-slate-500">Google Ads / Meta Ad Preview:</div>
                <div className="text-sm font-semibold text-sky-800 dark:text-sky-300">
                  {audit.adInput.headlines.join(' | ')}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {audit.adInput.descriptions.join(' ')}
                </div>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">CTA: <strong>{audit.adInput.cta}</strong></span>
                  <span className="text-sky-600 dark:text-sky-400">{audit.adInput.displayUrl || 'advertised.com'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Extracted Ad Claims ({audit.findings.length})
                </h4>
                {audit.findings.map((f, i) => (
                  <div key={i} className="text-xs border-l-2 border-slate-300 pl-2.5 py-1 text-slate-700 dark:text-slate-300">
                    <strong>[{f.claimType.toUpperCase()}]:</strong> {f.adClaim}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: What the landing page actually says */}
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>What the Landing Page Actually Contains</span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2 text-xs">
                <div><strong>Page Title:</strong> {audit.extractedPage?.title || '(None)'}</div>
                <div><strong>Hero Section Copy:</strong> "{audit.extractedPage?.heroText?.slice(0, 150) || 'None'}..."</div>
                <div><strong>Primary CTA Button:</strong> {audit.extractedPage?.ctaButtons[0]?.text || '(None)'}</div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Grounding Findings
                </h4>
                {audit.findings.map((f, i) => (
                  <div
                    key={i}
                    className={`text-xs p-2.5 rounded border ${
                      f.classification === 'Contradicted'
                        ? 'border-rose-200 bg-rose-50/50 text-rose-800 dark:border-rose-950 dark:bg-rose-950/20 dark:text-rose-300'
                        : f.classification === 'Not Found'
                        ? 'border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-950 dark:bg-amber-950/20 dark:text-amber-300'
                        : 'border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-300'
                    }`}
                  >
                    <div className="font-semibold">{f.classification}</div>
                    <div className="mt-1">{f.explanation}</div>
                    {f.evidenceQuote && (
                      <div className="mt-1 italic text-[11px]">Verified Quote: "{f.evidenceQuote}"</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Fix Plan & Rewritten Grounded Ad */}
      {activeTab === 'fixPlan' && (
        <div className="space-y-6">
          {/* Grounded Rewritten Ad Preview */}
          {audit.rewrittenAd && (
            <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-5 dark:border-sky-900 dark:bg-sky-950/20 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                  Rewritten Advertisement (Strictly Grounded in Verified Page Content)
                </h3>
              </div>
              <p className="text-xs text-sky-700 dark:text-sky-300">
                This alternative creative eliminates broken promises and matches verified page copy:
              </p>

              <div className="rounded-lg bg-white p-4 border border-sky-100 shadow-sm dark:bg-slate-900 dark:border-sky-950 space-y-2">
                <div className="text-xs text-slate-400">Suggested Google Ads Creative:</div>
                <div className="text-sm font-bold text-sky-700 dark:text-sky-400">
                  {audit.rewrittenAd.suggestedHeadlines.join(' | ')}
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  {audit.rewrittenAd.suggestedDescriptions.join(' ')}
                </div>
                <div className="pt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Recommended CTA: "{audit.rewrittenAd.suggestedCta}"
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <strong>Rationale:</strong> {audit.rewrittenAd.rationale}
                </div>
              </div>
            </div>
          )}

          {/* Action-Oriented Prioritized Remediation Checklist */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Prioritized Remediation Checklist
            </h3>

            <div className="space-y-3">
              {audit.findings
                .filter((f) => f.classification !== 'Explicitly Supported')
                .map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            f.priority === 'Critical' ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          [{f.priority.toUpperCase()}]
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Target: {f.fixTarget === 'ad' ? 'Fix Advertisement' : f.fixTarget === 'landing_page' ? 'Fix Landing Page' : 'Fix Both Ad & Page'}
                        </span>
                        <span className="text-slate-400">· Effort: {f.estimatedEffort}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{f.recommendedFix}</p>
                      <div className="text-[11px] text-slate-500">
                        Affected Claim: "{f.adClaim}" ({f.classification})
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingFinding(f);
                        setReviewStatus(f.reviewStatus);
                        setReviewNotes(f.reviewNotes || '');
                      }}
                      className="px-2.5 py-1 text-xs rounded border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 whitespace-nowrap"
                    >
                      {f.reviewStatus}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Compliance & Claim Risk Flags */}
      {activeTab === 'compliance' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-600" />
                <span>Marketing Compliance & Regulatory Claim Risk Flags</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Notice: These flags represent marketing and regulatory risk indicators (FTC, CFPB, SEC guidelines), not formal legal determinations. Recommended for human compliance review.
              </p>
            </div>

            {audit.complianceRisks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500 mb-1" />
                No high-risk compliance or regulated claims detected in this ad copy.
              </div>
            ) : (
              <div className="space-y-3">
                {audit.complianceRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900 dark:text-amber-200">
                        {risk.title}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                        Severity: {risk.severity}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{risk.description}</p>
                    <div className="rounded bg-white p-2 border border-amber-200/60 dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-400">
                      <strong>Flagged Copy:</strong> "{risk.adClaimExcerpt}"
                    </div>
                    <div className="text-[11px] text-slate-800 dark:text-slate-200">
                      <strong>Recommended Compliance Action:</strong> {risk.recommendedComplianceAction}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Version Comparison */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-sky-600" />
                  <span>Audit Version & Iteration Comparison</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare this audit against another version to evaluate score deltas, resolved mismatches, and regressions.
                </p>
              </div>

              {otherAudits.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Compare With:</label>
                  <select
                    value={compareTargetId}
                    onChange={(e) => setCompareTargetId(e.target.value)}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    {otherAudits.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.adInput.name} (Score: {a.messageMatchScore})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {compareTarget ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Base Audit (Current)</div>
                  <div className="text-lg font-bold">{audit.adInput.name}</div>
                  <div className="text-2xl font-extrabold">{audit.messageMatchScore} / 100</div>
                  <div>Critical Mismatches: {audit.findings.filter((f) => f.priority === 'Critical').length}</div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Comparison Target</div>
                  <div className="text-lg font-bold">{compareTarget.adInput.name}</div>
                  <div className="text-2xl font-extrabold">{compareTarget.messageMatchScore} / 100</div>
                  <div>Critical Mismatches: {compareTarget.findings.filter((f) => f.priority === 'Critical').length}</div>
                  <div className="pt-2 text-sm font-semibold">
                    Score Delta:{' '}
                    <span
                      className={
                        audit.messageMatchScore >= compareTarget.messageMatchScore
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }
                    >
                      {audit.messageMatchScore - compareTarget.messageMatchScore > 0 ? '+' : ''}
                      {audit.messageMatchScore - compareTarget.messageMatchScore} points
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Create or load at least one more audit to compare versions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {editingFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-slate-900 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Human Reviewer Decision
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Claim: <strong>"{editingFinding.adClaim}"</strong>
            </p>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Resolution Status
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full rounded border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reviewer Notes
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Record decision rationale, copy change tickets, or legal approval..."
                className="w-full rounded border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingFinding(null)}
                className="rounded px-3 py-1.5 border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingReview}
                onClick={handleSaveReview}
                className="rounded bg-sky-600 px-3.5 py-1.5 font-semibold text-white hover:bg-sky-500"
              >
                {isUpdatingReview ? 'Saving...' : 'Save Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
