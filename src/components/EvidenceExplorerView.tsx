import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { AuditReport, PositionCategory } from '../types.js';
import { Language, translations } from '../lib/i18n.js';

interface EvidenceExplorerViewProps {
  audits: AuditReport[];
  onSelectAudit: (audit: AuditReport) => void;
  lang: Language;
}

export const EvidenceExplorerView: React.FC<EvidenceExplorerViewProps> = ({
  audits,
  onSelectAudit,
  lang,
}) => {
  const t = translations[lang];

  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [relevanceFilter, setRelevanceFilter] = useState('all');
  const [selectedAuditId, setSelectedAuditId] = useState('all');

  // Flatten all findings across audits
  const allFindings = audits.flatMap((a) =>
    a.findings.map((f) => ({
      ...f,
      auditId: a.id,
      auditName: a.adInput.name,
      auditUrl: a.adInput.finalUrl,
      auditObj: a,
    }))
  );

  const filtered = allFindings.filter((item) => {
    if (selectedAuditId !== 'all' && item.auditId !== selectedAuditId) return false;
    if (positionFilter !== 'all' && item.positionCategory !== positionFilter) return false;
    if (sourceFilter !== 'all') {
      const src = item.evidenceSource || item.verifiedEvidence?.evidenceSource;
      if (src !== sourceFilter) return false;
    }
    if (relevanceFilter !== 'all') {
      const rel = item.verifiedEvidence?.semanticRelevance || 'none';
      if (rel !== relevanceFilter) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const quote = (item.evidenceQuote || '').toLowerCase();
      const claim = item.adClaim.toLowerCase();
      const expl = item.explanation.toLowerCase();
      if (!quote.includes(q) && !claim.includes(q) && !expl.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
          <FileSearch className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          <span>{t.evidenceExplorer}</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Search and verify page evidence quotes, DOM locations, evidence sources, and semantic relevance across all audits.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Search Quote / Text:</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search quotes or claims..."
              className="w-full rounded border border-slate-200 bg-white py-1.5 pl-8 pr-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Filter by Audit:</label>
          <select
            value={selectedAuditId}
            onChange={(e) => setSelectedAuditId(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">All Audits ({audits.length})</option>
            {audits.map((a) => (
              <option key={a.id} value={a.id}>
                {a.adInput.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Evidence Source:</label>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">All Sources</option>
            <option value="hero_section">Hero Section</option>
            <option value="main_body">Main Body</option>
            <option value="faq">FAQ</option>
            <option value="footer">Footer</option>
            <option value="page_title">Page Title (Metadata)</option>
            <option value="meta_description">Meta Description (Metadata)</option>
            <option value="cta_button">CTA Button</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Semantic Relevance:</label>
          <select
            value={relevanceFilter}
            onChange={(e) => setRelevanceFilter(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">All Relevance</option>
            <option value="supports">Supports Claim</option>
            <option value="irrelevant">Irrelevant to Claim</option>
            <option value="contradicts">Contradicts Claim</option>
            <option value="none">No Quote Found</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Page Position:</label>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">All Positions</option>
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
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            No evidence records matched your search filters.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={`${item.auditId}-${item.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onSelectAudit(item.auditObj)}
                    className="font-semibold text-sky-600 dark:text-sky-400 hover:underline text-left"
                  >
                    {item.auditName}
                  </button>
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Source: {item.evidenceSource || item.verifiedEvidence?.evidenceSource || 'other'}
                  </span>
                  <span className="text-slate-400">· Position: <strong>{item.positionCategory}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {item.verifiedEvidence?.isVerified ? (
                    item.verifiedEvidence.isSemanticallyRelevant ? (
                      item.verifiedEvidence.semanticRelevance === 'supports' ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified & Supports Claim
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> Verified Contradiction
                        </span>
                      )
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="h-3.5 w-3.5" /> Verified Quote (Irrelevant to Claim)
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 font-medium">
                      No Verified Quote
                    </span>
                  )}
                  {item.verifiedEvidence?.characterOffset !== undefined && (
                    <span className="text-slate-400 font-mono text-[10px]">
                      Offset: #{item.verifiedEvidence.characterOffset}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Ad Claim:</span> <strong>{item.adClaim}</strong> ({item.classification})
              </div>

              {item.evidenceQuote ? (
                <div className="rounded bg-slate-50 p-2.5 dark:bg-slate-800/60 font-mono text-[11px] text-slate-800 dark:text-slate-200 border-l-2 border-sky-500 space-y-1">
                  <div>"{item.evidenceQuote}"</div>
                  {item.verifiedEvidence && !item.verifiedEvidence.isSemanticallyRelevant && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 italic font-sans">
                      ⚠️ {item.verifiedEvidence.relevanceExplanation || 'Quote exists on page but does not substantiate the claim'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 italic">
                  (No evidence found on landing page content)
                </div>
              )}

              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                {item.explanation}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
