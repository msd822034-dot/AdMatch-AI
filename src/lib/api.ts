import { AuditReport, BatchJob, BatchRowInput, ExtractedPageContent, MismatchFinding } from '../types.js';

export async function fetchHealth(): Promise<{ status: string; geminiConfigured: boolean }> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchAudits(): Promise<AuditReport[]> {
  const res = await fetch('/api/audits');
  if (!res.ok) throw new Error('Failed to fetch audits');
  return res.json();
}

export async function fetchAuditById(id: string): Promise<AuditReport> {
  const res = await fetch(`/api/audits/${id}`);
  if (!res.ok) throw new Error('Failed to fetch audit details');
  return res.json();
}

export async function createAudit(payload: {
  adInput: any;
  sourceMode: string;
  rawHtml?: string;
  liveUrl?: string;
  filename?: string;
}): Promise<AuditReport> {
  const res = await fetch('/api/audits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create audit' }));
    throw new Error(err.error || 'Failed to create audit');
  }
  return res.json();
}

export async function deleteAuditById(id: string): Promise<boolean> {
  const res = await fetch(`/api/audits/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete audit');
  return true;
}

export async function previewExtraction(payload: {
  sourceMode: string;
  rawHtml?: string;
  url?: string;
  filename?: string;
}): Promise<ExtractedPageContent> {
  const res = await fetch('/api/extract-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Extraction failed' }));
    throw new Error(err.error || 'Extraction failed');
  }
  return res.json();
}

export async function updateFindingReview(
  auditId: string,
  findingId: string,
  data: { status: string; notes?: string; reviewedBy?: string }
): Promise<MismatchFinding> {
  const res = await fetch(`/api/audits/${auditId}/findings/${findingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update finding status');
  return res.json();
}

export async function compareAuditVersions(id1: string, id2: string): Promise<any> {
  const res = await fetch(`/api/audits/compare/${id1}/${id2}`);
  if (!res.ok) throw new Error('Failed to compare audits');
  return res.json();
}

export async function fetchBenchmarks(): Promise<{ total: number; benchmarks: any[] }> {
  const res = await fetch('/api/benchmarks');
  if (!res.ok) throw new Error('Failed to load benchmarks');
  return res.json();
}

export async function runAcceptanceTestsSuite(): Promise<any> {
  const res = await fetch('/api/run-tests');
  if (!res.ok) throw new Error('Failed to execute acceptance tests');
  return res.json();
}

export async function submitBatchJob(rows: BatchRowInput[]): Promise<BatchJob> {
  const res = await fetch('/api/batches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) throw new Error('Batch submission failed');
  return res.json();
}

export async function fetchBatchJob(id: string): Promise<BatchJob> {
  const res = await fetch(`/api/batches/${id}`);
  if (!res.ok) throw new Error('Failed to fetch batch job');
  return res.json();
}
