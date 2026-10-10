import React from 'react';
import {
  FileText,
  Download,
  Share2,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AuditReport } from '../types.js';
import { Language, translations } from '../lib/i18n.js';
import { exportAuditAsCsv, exportAuditAsJson, printAuditPdfReport } from '../lib/export.js';

interface ReportsViewProps {
  audits: AuditReport[];
  onSelectAudit: (audit: AuditReport) => void;
  lang: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  audits,
  onSelectAudit,
  lang,
}) => {
  const t = translations[lang];

  // Bulk Export All Findings as CSV
  const handleBulkExportCsv = () => {
    const allRows = audits.flatMap((a) =>
      a.findings.map((f) => [
        `"${a.id}"`,
        `"${(a.adInput.name || '').replace(/"/g, '""')}"`,
        `"${a.adInput.category}"`,
        `"${f.id}"`,
        `"${f.claimType}"`,
        `"${(f.adClaim || '').replace(/"/g, '""')}"`,
        `"${f.classification}"`,
        `"${(f.evidenceQuote || '').replace(/"/g, '""')}"`,
        `"${f.positionCategory}"`,
        `"${f.priority}"`,
        `"${(f.explanation || '').replace(/"/g, '""')}"`,
        `"${(f.recommendedFix || '').replace(/"/g, '""')}"`,
        `"${f.reviewStatus}"`,
      ])
    );

    const headers = [
      'Audit ID',
      'Audit Name',
      'Category',
      'Finding ID',
      'Claim Type',
      'Ad Claim',
      'Classification',
      'Evidence Quote',
      'Position',
      'Priority',
      'Explanation',
      'Recommended Fix',
      'Review Status',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...allRows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `admatch-all-findings-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            <span>{t.reports}</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Generate and export PDF audit documents, CSV finding logs, and structured JSON files.
          </p>
        </div>

        <button
          onClick={handleBulkExportCsv}
          disabled={audits.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Export All Findings (CSV)</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2.5">Audit Title</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Score</th>
              <th className="px-4 py-2.5">Findings</th>
              <th className="px-4 py-2.5">Compliance Flags</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5 text-right">Export Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {audits.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  <button onClick={() => onSelectAudit(a)} className="hover:underline text-left">
                    {a.adInput.name}
                  </button>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">
                  {a.adInput.category.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                  {a.messageMatchScore} / 100
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {a.findings.length} findings ({a.findings.filter((f) => f.priority === 'Critical').length} critical)
                </td>
                <td className="px-4 py-3">
                  {a.complianceRisks.length > 0 ? (
                    <span className="text-rose-600 font-semibold">{a.complianceRisks.length} flags</span>
                  ) : (
                    <span className="text-emerald-600">0 flags</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => printAuditPdfReport(a)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => exportAuditAsCsv(a)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportAuditAsJson(a)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      JSON
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
