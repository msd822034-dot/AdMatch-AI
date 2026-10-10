import {
  AuditReport,
  BatchJob,
  BatchRowInput,
  MismatchFinding,
} from '../../src/types.js';
import { getFullBenchmarkDataset } from '../dataset/benchmark_dataset.js';
import { extractLandingPageContent } from './extractor.js';
import { analyzeAdMessageMatch } from './gemini-service.js';

// In-memory persistent storage
const auditsStore = new Map<string, AuditReport>();
const batchJobsStore = new Map<string, BatchJob>();

// 60 Real Benchmark Ad-Copy & Landing Page Pairs from PS-03 Dataset
export const BENCHMARK_PAIRS = getFullBenchmarkDataset().map((item) => {
  const categoryMap: Record<string, 'financial_services' | 'saas' | 'ecommerce'> = {
    'financial services': 'financial_services',
    'SaaS': 'saas',
    'consumer e-commerce': 'ecommerce',
  };

  return {
    pairId: item.pairId,
    advertiser: item.advertiser,
    category: categoryMap[item.vertical] || 'other',
    auditName: `[${item.pairId}] ${item.advertiser} — ${item.headline_1}`,
    headline: item.headline_1,
    headlines: [item.headline_1, item.headline_2, item.headline_3].filter(Boolean),
    description: `${item.description_1} ${item.description_2}`,
    descriptions: [item.description_1, item.description_2].filter(Boolean),
    cta: item.headline_1.includes('Apply') ? 'Apply Now' : item.description_2.includes('Demo') ? 'Book a Demo' : item.description_2.includes('Shop') ? 'Shop Now' : 'Start Free Trial',
    landingPageUrl: item.finalUrl,
    snapshotFile: item.snapshotFile,
    sampleHtml: item.landingPageHtml,
  };
});

let hasSeeded = false;

// Seed the store with initial real benchmark audits so the app is immediately rich with data
export async function seedInitialAudits(): Promise<void> {
  if (hasSeeded) return;
  hasSeeded = true;

  // Seed the first 6 representative pairs across Finance, SaaS, and E-commerce
  const initialToSeed = [
    BENCHMARK_PAIRS[0],  // P01: Kestrel Business Funding
    BENCHMARK_PAIRS[4],  // P05: Harborline Equipment Finance
    BENCHMARK_PAIRS[8],  // P09: Cobalt Line of Credit
    BENCHMARK_PAIRS[16], // P17: Pinecrest SBA Lending
    BENCHMARK_PAIRS[20], // P21: Quillstack (SaaS)
    BENCHMARK_PAIRS[40], // P41: Halcyon Bottles (E-commerce)
  ];

  for (const pair of initialToSeed) {
    const extracted = extractLandingPageContent(pair.sampleHtml, {
      sourceMode: 'html_snapshot',
      sourceUrl: pair.landingPageUrl,
      sourceFilename: pair.snapshotFile,
    });

    const report = await analyzeAdMessageMatch(
      {
        name: pair.auditName,
        category: pair.category as any,
        platform: 'google_ads',
        headlines: pair.headlines,
        descriptions: pair.descriptions,
        finalUrl: pair.landingPageUrl,
        cta: pair.cta,
      },
      extracted
    );

    auditsStore.set(report.id, report);
  }
}

export const StorageService = {
  getAllAudits(): AuditReport[] {
    return Array.from(auditsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getAuditById(id: string): AuditReport | undefined {
    return auditsStore.get(id);
  },

  saveAudit(audit: AuditReport): void {
    auditsStore.set(audit.id, audit);
  },

  deleteAudit(id: string): boolean {
    return auditsStore.delete(id);
  },

  updateFindingReview(
    auditId: string,
    findingId: string,
    update: Partial<MismatchFinding>
  ): MismatchFinding | null {
    const audit = auditsStore.get(auditId);
    if (!audit) return null;

    const finding = audit.findings.find((f) => f.id === findingId);
    if (!finding) return null;

    Object.assign(finding, update);
    audit.updatedAt = new Date().toISOString();
    auditsStore.set(auditId, audit);
    return finding;
  },

  getBatchJob(id: string): BatchJob | undefined {
    return batchJobsStore.get(id);
  },

  saveBatchJob(job: BatchJob): void {
    batchJobsStore.set(job.id, job);
  },

  async processBatch(rows: BatchRowInput[]): Promise<BatchJob> {
    const jobId = `batch-${Date.now()}`;
    const job: BatchJob = {
      id: jobId,
      name: `Batch Audit Job (${rows.length} pairs)`,
      createdAt: new Date().toISOString(),
      totalRows: rows.length,
      completedRows: 0,
      failedRows: 0,
      items: [],
      status: 'processing',
    };
    batchJobsStore.set(jobId, job);

    // Process rows independently
    for (const row of rows) {
      try {
        if (!row.raw_html && !row.landing_page_url) {
          job.items.push({
            rowId: row.rowId,
            auditName: row.audit_name || `Row ${row.rowId}`,
            status: 'needs_content',
            criticalIssuesCount: 0,
            error: 'Missing landing page content: no HTML snapshot or accessible URL provided.',
          });
          job.failedRows++;
          continue;
        }

        const htmlToUse = row.raw_html || `<!DOCTYPE html><html><body><h1>${row.headline}</h1><button>${row.cta}</button></body></html>`;
        const extracted = extractLandingPageContent(htmlToUse, {
          sourceMode: row.raw_html ? 'html_snapshot' : 'live_url',
          sourceUrl: row.landing_page_url,
          sourceFilename: row.snapshot_filename,
        });

        const report = await analyzeAdMessageMatch(
          {
            name: row.audit_name || `Batch Audit Row #${row.rowId}`,
            category: row.category || 'other',
            platform: 'google_ads',
            headlines: [row.headline],
            descriptions: [row.description],
            finalUrl: row.landing_page_url,
            cta: row.cta || 'Learn More',
          },
          extracted
        );

        auditsStore.set(report.id, report);

        const criticalCount = report.findings.filter((f) => f.priority === 'Critical').length;
        job.items.push({
          rowId: row.rowId,
          auditId: report.id,
          auditName: report.adInput.name,
          status: 'completed',
          score: report.messageMatchScore,
          criticalIssuesCount: criticalCount,
        });
        job.completedRows++;
      } catch (err: any) {
        job.items.push({
          rowId: row.rowId,
          auditName: row.audit_name || `Row ${row.rowId}`,
          status: 'failed',
          criticalIssuesCount: 0,
          error: err.message || 'Processing failed',
        });
        job.failedRows++;
      }
    }

    job.status = job.failedRows === 0 ? 'completed' : 'partial';
    batchJobsStore.set(jobId, job);
    return job;
  },
};
