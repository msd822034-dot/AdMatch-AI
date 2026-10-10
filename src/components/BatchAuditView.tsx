import React, { useState } from 'react';
import Papa from 'papaparse';
import {
  Layers,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  RefreshCw,
  Play,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { BatchItemResult, BatchJob, BatchRowInput } from '../types.js';
import { Language, translations } from '../lib/i18n.js';
import { submitBatchJob } from '../lib/api.js';

interface BatchAuditViewProps {
  benchmarks: any[];
  onBatchAuditCompleted: () => void;
  lang: Language;
}

export const BatchAuditView: React.FC<BatchAuditViewProps> = ({
  benchmarks,
  onBatchAuditCompleted,
  lang,
}) => {
  const t = translations[lang];

  const [csvRawText, setCsvRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<BatchRowInput[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBatchJob, setActiveBatchJob] = useState<BatchJob | null>(null);

  // Validate and parse CSV text
  const parseAndValidateCsv = (text: string) => {
    setParseError(null);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    try {
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        setParseError(`CSV Parsing error: ${parsed.errors[0].message}`);
        return;
      }

      const rows: BatchRowInput[] = (parsed.data as any[]).map((row, idx) => ({
        rowId: idx + 1,
        audit_name: row.audit_name || `Batch Item #${idx + 1}`,
        category: (['financial_services', 'saas', 'ecommerce', 'other'].includes(row.category)
          ? row.category
          : 'other') as any,
        headline: row.headline || '',
        description: row.description || '',
        landing_page_url: row.landing_page_url || '',
        cta: row.cta || 'Learn More',
        snapshot_filename: row.snapshot_filename || undefined,
        raw_html: row.raw_html || undefined,
      }));

      if (rows.length === 0) {
        setParseError('CSV contains no valid rows.');
        return;
      }

      if (rows.length > 60) {
        setParseError(`Maximum batch size is 60 pairs. Found ${rows.length} rows.`);
        return;
      }

      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV');
    }
  };

  // Load 60 Benchmark CSV
  const handleLoadBenchmarkCsv = () => {
    const csvData = benchmarks.slice(0, 60).map((b) => ({
      audit_name: b.auditName,
      category: b.category,
      headline: b.headline,
      description: b.description,
      landing_page_url: b.landingPageUrl,
      cta: b.cta,
      snapshot_filename: `${b.auditName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`,
      raw_html: b.sampleHtml,
    }));

    const csvString = Papa.unparse(csvData);
    setCsvRawText(csvString);
    parseAndValidateCsv(csvString);
  };

  // Upload CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvRawText(text);
      parseAndValidateCsv(text);
    };
    reader.readAsText(file);
  };

  // Start Batch Execution
  const handleRunBatch = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const job = await submitBatchJob(parsedRows);
      setActiveBatchJob(job);
      onBatchAuditCompleted();
    } catch (err: any) {
      alert(`Batch processing error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const template = [
      {
        audit_name: 'QuickLoan Approval Check',
        category: 'financial_services',
        headline: 'Get approved the same day.',
        description: 'Fast online loans up to $10,000.',
        landing_page_url: 'https://example-loans.com',
        cta: 'Apply Now',
        snapshot_filename: 'loan-landing.html',
        raw_html: '<html><body><h1>Apply online today.</h1><p>Our team will review your application within 3-5 business days.</p><button>Apply Now</button></body></html>',
      },
      {
        audit_name: 'FlowDesk Trial Check',
        category: 'saas',
        headline: 'Enjoy a free 30-day trial.',
        description: 'Collaborate with your team seamlessly.',
        landing_page_url: 'https://flowdesk.example',
        cta: 'Start Free Trial',
        snapshot_filename: 'flowdesk.html',
        raw_html: '<html><body><h1>Cloud Workspace</h1><p>Try all features free for 7 days.</p><button>Start Free Trial</button></body></html>',
      },
    ];
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'admatch-batch-template.csv';
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t.batchAudit}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Import up to 60 ad-copy and landing-page pairs via CSV for bulk message-match analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Download CSV Template</span>
          </button>

          <button
            onClick={handleLoadBenchmarkCsv}
            className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Load 60 Benchmark Pairs</span>
          </button>
        </div>
      </div>

      {/* CSV Input Panel */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            1. Upload or Paste CSV
          </h2>
          <label className="cursor-pointer text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload .csv file</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <textarea
          rows={6}
          value={csvRawText}
          onChange={(e) => {
            setCsvRawText(e.target.value);
            parseAndValidateCsv(e.target.value);
          }}
          placeholder="audit_name,category,headline,description,landing_page_url,cta,snapshot_filename,raw_html&#10;QuickLoan Test,financial_services,Get approved same day,Personal loans,$10000,Apply Now,loans.html,..."
          className="w-full rounded-md border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />

        {parseError && (
          <div className="rounded-md bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
            {parseError}
          </div>
        )}

        {parsedRows.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Validated {parsedRows.length} audit pairs ready for execution.</span>
            </span>

            <button
              onClick={handleRunBatch}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isProcessing ? 'Processing Batch...' : `Run Batch (${parsedRows.length} Audits)`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Batch Results View */}
      {activeBatchJob && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Batch Job Execution Results: {activeBatchJob.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Completed: {activeBatchJob.completedRows} of {activeBatchJob.totalRows} (Failed/Missing: {activeBatchJob.failedRows})
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Audit Name</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Match Score</th>
                  <th className="px-3 py-2">Critical Issues</th>
                  <th className="px-3 py-2">Details / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeBatchJob.items.map((item) => (
                  <tr key={item.rowId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-mono text-slate-400">#{item.rowId}</td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">
                      {item.auditName}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : item.status === 'needs_content'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold">
                      {item.score !== undefined ? `${item.score}/100` : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {item.criticalIssuesCount > 0 ? (
                        <span className="text-rose-600 font-semibold">{item.criticalIssuesCount} critical</span>
                      ) : (
                        <span className="text-emerald-600">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-500 text-[11px]">
                      {item.error || 'Audited successfully with ground truth.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
