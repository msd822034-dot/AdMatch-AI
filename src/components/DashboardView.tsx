import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Flame,
  PlusCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { AuditReport } from '../types.js';
import { Language, translations } from '../lib/i18n.js';
import { printAuditPdfReport } from '../lib/export.js';

interface DashboardViewProps {
  audits: AuditReport[];
  onSelectAudit: (audit: AuditReport) => void;
  onNewAudit: () => void;
  onLoadBenchmark: (benchmarkName: string) => void;
  lang: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  audits,
  onSelectAudit,
  onNewAudit,
  onLoadBenchmark,
  lang,
}) => {
  const t = translations[lang];

  // Calculate Aggregated Metrics
  const totalAudits = audits.length;
  const avgScore =
    totalAudits > 0
      ? Math.round(audits.reduce((acc, a) => acc + a.messageMatchScore, 0) / totalAudits)
      : 0;

  const totalCriticalMismatches = audits.reduce(
    (acc, a) => acc + a.findings.filter((f) => f.priority === 'Critical').length,
    0
  );

  const totalUnsupportedClaims = audits.reduce(
    (acc, a) => acc + a.findings.filter((f) => f.classification === 'Not Found').length,
    0
  );

  const auditsRequiringReview = audits.filter(
    (a) =>
      a.messageMatchScore < 70 ||
      a.findings.some((f) => f.reviewStatus === 'Open' && f.priority === 'Critical')
  ).length;

  // Score distribution brackets
  const scoreDistribution = {
    critical: audits.filter((a) => a.messageMatchScore < 50).length,
    moderate: audits.filter((a) => a.messageMatchScore >= 50 && a.messageMatchScore < 80).length,
    high: audits.filter((a) => a.messageMatchScore >= 80).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t.dashboard}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time audit overview across ad copy promises and landing page evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewAudit}
            className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{t.newAudit}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t.totalAudits}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {totalAudits}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Active audit records
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t.avgScore}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold tracking-tight ${
                avgScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : avgScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {avgScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Across all categories
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            {t.highPriorityIssues}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {totalCriticalMismatches}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Contradictions & broken promises
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            {t.unsupportedClaims}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
            {totalUnsupportedClaims}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Not found on landing page
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t.needsReview}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {auditsRequiringReview}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Score &lt; 70 or open critical fixes
          </div>
        </div>
      </div>

      {/* Benchmark 1-Click Launchers Bar */}
      <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-950 dark:bg-sky-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>PS-03 Benchmark Scenarios (60 Pairs Available)</span>
            </h2>
            <p className="mt-0.5 text-xs text-sky-700/80 dark:text-sky-300/80">
              Instant load standard test cases with known message mismatches:
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onLoadBenchmark('P01')}
              className="rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-900 shadow-sm hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
            >
              P01: Kestrel (Same-Day Approval)
            </button>
            <button
              onClick={() => onLoadBenchmark('P09')}
              className="rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-900 shadow-sm hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
            >
              P09: Cobalt (Guaranteed Approval)
            </button>
            <button
              onClick={() => onLoadBenchmark('P21')}
              className="rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-900 shadow-sm hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
            >
              P21: Quillstack (14-Day Trial)
            </button>
            <button
              onClick={() => onLoadBenchmark('P25')}
              className="rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-900 shadow-sm hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
            >
              P25: Tallyroute (GPS Tracking)
            </button>
            <button
              onClick={() => onLoadBenchmark('P45')}
              className="rounded-md border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-medium text-sky-900 shadow-sm hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
            >
              P45: Fernway (BOGO Serum)
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Grid: Score Distribution & Category Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score Distribution Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Score Distribution
          </h2>
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-emerald-700 dark:text-emerald-400">Strong Match (80 - 100)</span>
                <span className="text-slate-600 dark:text-slate-300">{scoreDistribution.high} audits</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${totalAudits > 0 ? (scoreDistribution.high / totalAudits) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-700 dark:text-amber-400">Moderate Match (50 - 79)</span>
                <span className="text-slate-600 dark:text-slate-300">{scoreDistribution.moderate} audits</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${totalAudits > 0 ? (scoreDistribution.moderate / totalAudits) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-rose-700 dark:text-rose-400">Critical Mismatch (0 - 49)</span>
                <span className="text-slate-600 dark:text-slate-300">{scoreDistribution.critical} audits</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${totalAudits > 0 ? (scoreDistribution.critical / totalAudits) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Evidence Verification Integrity Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            System Integrity & Hallucination Defense
          </h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Deterministic Quote Matching</span>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                Exact Substring + Normalized DOM
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Every quote verified against extracted text</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Position Awareness</span>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                Hero vs Main vs Footer
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Footer-buried promises penalize prominence</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Security Architecture</span>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                Strict SSRF Guard + Script Stripping
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Localhost and internal metadata strictly blocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audits Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Audits</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any audit to view detailed findings, verified quotes, and fix plan.
            </p>
          </div>
        </div>

        {audits.length === 0 ? (
          <div className="p-8 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No audits yet</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Start by creating your first audit or loading a benchmark pair above.
            </p>
            <button
              onClick={onNewAudit}
              className="mt-4 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
            >
              Start New Audit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Audit Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Message Match Score</th>
                  <th className="px-4 py-2.5">Critical Mismatches</th>
                  <th className="px-4 py-2.5">Evidence Verified</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {audits.map((audit) => {
                  const criticalCount = audit.findings.filter((f) => f.priority === 'Critical').length;
                  const verifiedPct = audit.evidenceIntegrity.evidenceVerificationPercentage;

                  return (
                    <tr
                      key={audit.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        <button
                          onClick={() => onSelectAudit(audit)}
                          className="hover:underline text-left"
                        >
                          {audit.adInput.name}
                        </button>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {audit.adInput.headlines[0]}
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                        {audit.adInput.category.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              audit.messageMatchScore >= 80
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : audit.messageMatchScore >= 50
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {audit.messageMatchScore}/100
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {audit.messageMatchScore >= 80 ? 'Aligned' : audit.messageMatchScore >= 50 ? 'Moderate' : 'Critical Mismatch'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {criticalCount > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            {criticalCount} critical
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">0 critical</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {verifiedPct}% verified
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(audit.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectAudit(audit)}
                            className="rounded px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-slate-800"
                          >
                            View
                          </button>
                          <button
                            onClick={() => printAuditPdfReport(audit)}
                            className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            title="Export PDF"
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
