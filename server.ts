import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { AdInput } from './src/types.js';
import { runAllAcceptanceTests } from './server/acceptance-tests.js';
import { extractLandingPageContent } from './server/services/extractor.js';
import { analyzeAdMessageMatch } from './server/services/gemini-service.js';
import { safeFetchHtml, validateUrlForSsrf } from './server/services/ssrf-guard.js';
import { BENCHMARK_PAIRS, seedInitialAudits, StorageService } from './server/services/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Seed demo benchmark data on startup
seedInitialAudits().catch((err) => {
  console.error('Failed to seed benchmark audits:', err);
});

// API Routes

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Get Benchmark Suite (60 pairs)
app.get('/api/benchmarks', (req: Request, res: Response) => {
  res.json({
    total: BENCHMARK_PAIRS.length,
    benchmarks: BENCHMARK_PAIRS,
  });
});

// Run Acceptance Tests Suite (12 Tests)
app.all('/api/run-tests', async (req: Request, res: Response) => {
  try {
    const testSuiteResult = await runAllAcceptanceTests();
    res.json(testSuiteResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to run acceptance tests', details: err.message });
  }
});

// Preview content extraction before submitting audit
app.post('/api/extract-preview', async (req: Request, res: Response) => {
  try {
    const { sourceMode, rawHtml, url, filename } = req.body;

    let htmlContent = rawHtml || '';

    if (sourceMode === 'live_url') {
      if (!url) {
        return res.status(400).json({ error: 'A landing page URL is required for live extraction.' });
      }
      const fetched = await safeFetchHtml(url);
      htmlContent = fetched.html;
    }

    if (!htmlContent) {
      return res.status(400).json({ error: 'No HTML content or accessible URL was provided.' });
    }

    const extracted = extractLandingPageContent(htmlContent, {
      sourceMode: sourceMode || 'html_snapshot',
      sourceUrl: url,
      sourceFilename: filename,
    });

    res.json(extracted);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Content extraction failed' });
  }
});

// Safe live URL fetcher
app.post('/api/safe-fetch', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing target URL' });
    }

    const validation = await validateUrlForSsrf(url);
    if (!validation.allowed) {
      return res.status(400).json({ error: validation.reason });
    }

    const result = await safeFetchHtml(url);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Network fetch error' });
  }
});

// List Audits
app.get('/api/audits', (req: Request, res: Response) => {
  try {
    const audits = StorageService.getAllAudits();
    res.json(audits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Audit by ID
app.get('/api/audits/:id', (req: Request, res: Response) => {
  const audit = StorageService.getAuditById(req.params.id);
  if (!audit) {
    return res.status(404).json({ error: 'Audit record not found' });
  }
  res.json(audit);
});

// Delete Audit
app.delete('/api/audits/:id', (req: Request, res: Response) => {
  const deleted = StorageService.deleteAudit(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Audit record not found or already deleted' });
  }
  res.json({ success: true, message: 'Audit deleted successfully' });
});

// Create and Run a New Audit
app.post('/api/audits', async (req: Request, res: Response) => {
  try {
    const { adInput, sourceMode, rawHtml, liveUrl, filename } = req.body;

    if (!adInput || !adInput.headlines || adInput.headlines.length === 0) {
      return res.status(400).json({ error: 'Ad headline is required.' });
    }

    let htmlToAnalyze = rawHtml || '';

    // If live URL requested, safely fetch
    if (sourceMode === 'live_url') {
      const targetUrl = liveUrl || adInput.finalUrl;
      if (!targetUrl) {
        return res.status(400).json({ error: 'A landing page URL is required for live fetch.' });
      }
      const fetched = await safeFetchHtml(targetUrl);
      htmlToAnalyze = fetched.html;
    }

    // Extract page content
    const extractedPage = extractLandingPageContent(htmlToAnalyze, {
      sourceMode: sourceMode || 'html_snapshot',
      sourceUrl: liveUrl || adInput.finalUrl,
      sourceFilename: filename,
    });

    // Run core analysis
    const auditReport = await analyzeAdMessageMatch(adInput, extractedPage);

    // Save to storage
    StorageService.saveAudit(auditReport);

    res.status(201).json(auditReport);
  } catch (err: any) {
    console.error('Audit creation error:', err);
    res.status(500).json({ error: err.message || 'Audit execution failed' });
  }
});

// Update finding review status (human-in-the-loop audit trail)
app.patch('/api/audits/:id/findings/:finding_id', (req: Request, res: Response) => {
  try {
    const { status, notes, reviewedBy } = req.body;
    const updated = StorageService.updateFindingReview(req.params.id, req.params.finding_id, {
      reviewStatus: status,
      reviewNotes: notes,
      reviewedBy: reviewedBy || 'Current Reviewer',
      reviewedAt: new Date().toISOString(),
    });

    if (!updated) {
      return res.status(404).json({ error: 'Finding or audit not found' });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Compare two audit versions
app.get('/api/audits/compare/:id1/:id2', (req: Request, res: Response) => {
  const audit1 = StorageService.getAuditById(req.params.id1);
  const audit2 = StorageService.getAuditById(req.params.id2);

  if (!audit1 || !audit2) {
    return res.status(404).json({ error: 'One or both audits could not be found for comparison.' });
  }

  const scoreDiff = audit2.messageMatchScore - audit1.messageMatchScore;
  const criticalDiff =
    audit2.findings.filter((f) => f.priority === 'Critical').length -
    audit1.findings.filter((f) => f.priority === 'Critical').length;

  res.json({
    baseAudit: audit1,
    comparisonAudit: audit2,
    scoreDiff,
    criticalDiff,
    improved: scoreDiff > 0,
    regressed: scoreDiff < 0,
  });
});

// Batch Auditing
app.post('/api/batches', async (req: Request, res: Response) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'An array of rows is required for batch auditing.' });
    }

    if (rows.length > 60) {
      return res.status(400).json({ error: 'Batch size exceeds maximum limit of 60 rows.' });
    }

    const job = await StorageService.processBatch(rows);
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/batches/:id', (req: Request, res: Response) => {
  const job = StorageService.getBatchJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Batch job not found' });
  }
  res.json(job);
});

// Vite Middlewares in Dev / Static files in Production
async function setupServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AdMatch AI Auditor server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});
