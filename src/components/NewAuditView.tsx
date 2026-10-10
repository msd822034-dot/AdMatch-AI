import React, { useState } from 'react';
import {
  Upload,
  Link as LinkIcon,
  FileCode,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Eye,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  FolderArchive,
} from 'lucide-react';
import { AdInput, BusinessCategory, AdPlatform, SourceMode, ExtractedPageContent } from '../types.js';
import { Language, translations } from '../lib/i18n.js';
import { previewExtraction } from '../lib/api.js';

interface NewAuditViewProps {
  onSubmitAudit: (payload: {
    adInput: AdInput;
    sourceMode: SourceMode;
    rawHtml?: string;
    liveUrl?: string;
    filename?: string;
  }) => Promise<void>;
  benchmarks: any[];
  lang: Language;
}

export const NewAuditView: React.FC<NewAuditViewProps> = ({
  onSubmitAudit,
  benchmarks,
  lang,
}) => {
  const t = translations[lang];

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BusinessCategory>('financial_services');
  const [platform, setPlatform] = useState<AdPlatform>('google_ads');
  const [headlines, setHeadlines] = useState<string[]>(['']);
  const [descriptions, setDescriptions] = useState<string[]>(['']);
  const [displayUrl, setDisplayUrl] = useState('');
  const [finalUrl, setFinalUrl] = useState('https://example.com/offer');
  const [cta, setCta] = useState('Apply Now');
  const [offerDetails, setOfferDetails] = useState('');
  const [priceOrDiscount, setPriceOrDiscount] = useState('');
  const [eligibilityConditions, setEligibilityConditions] = useState('');
  const [campaignNotes, setCampaignNotes] = useState('');

  // Source options
  const [sourceMode, setSourceMode] = useState<SourceMode>('html_snapshot');
  const [rawHtml, setRawHtml] = useState('');
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

  // Extraction Preview state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<ExtractedPageContent | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper to add/remove headlines
  const addHeadline = () => setHeadlines([...headlines, '']);
  const updateHeadline = (index: number, val: string) => {
    const updated = [...headlines];
    updated[index] = val;
    setHeadlines(updated);
  };
  const removeHeadline = (index: number) => {
    if (headlines.length > 1) {
      setHeadlines(headlines.filter((_, i) => i !== index));
    }
  };

  // Helper to add/remove descriptions
  const addDescription = () => setDescriptions([...descriptions, '']);
  const updateDescription = (index: number, val: string) => {
    const updated = [...descriptions];
    updated[index] = val;
    setDescriptions(updated);
  };
  const removeDescription = (index: number) => {
    if (descriptions.length > 1) {
      setDescriptions(descriptions.filter((_, i) => i !== index));
    }
  };

  // Handle HTML File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawHtml(content);
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  // Pre-fill from Benchmark Scenario
  const handleSelectBenchmark = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTitle = e.target.value;
    if (!selectedTitle) return;

    const b = benchmarks.find((item) => item.auditName === selectedTitle);
    if (!b) return;

    setName(b.auditName);
    setCategory(b.category);
    setHeadlines(b.headlines && b.headlines.length > 0 ? b.headlines : [b.headline]);
    setDescriptions(b.descriptions && b.descriptions.length > 0 ? b.descriptions : [b.description]);
    setCta(b.cta);
    setFinalUrl(b.landingPageUrl);
    setSourceMode('html_snapshot');
    setRawHtml(b.sampleHtml);
    setUploadedFilename(b.snapshotFile || `${b.auditName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`);
    setExtractedPreview(null);
  };

  // Preview content extraction before submission
  const handlePreview = async () => {
    setPreviewError(null);
    setIsPreviewing(true);
    try {
      const result = await previewExtraction({
        sourceMode,
        rawHtml,
        url: sourceMode === 'live_url' ? (liveUrl || finalUrl) : undefined,
        filename: uploadedFilename,
      });
      setExtractedPreview(result);
    } catch (err: any) {
      setPreviewError(err.message || 'Extraction preview failed');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Final submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validHeadlines = headlines.filter((h) => h.trim().length > 0);
    const validDescriptions = descriptions.filter((d) => d.trim().length > 0);

    if (validHeadlines.length === 0) {
      setFormError('At least one ad headline is required.');
      return;
    }

    if (sourceMode === 'html_snapshot' && !rawHtml.trim()) {
      setFormError('Please upload an HTML snapshot file or paste content.');
      return;
    }

    if (sourceMode === 'raw_paste' && !rawHtml.trim()) {
      setFormError('Please paste the HTML or rendered page text.');
      return;
    }

    if (sourceMode === 'live_url' && !liveUrl.trim() && !finalUrl.trim()) {
      setFormError('A publicly accessible URL is required for live extraction.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitAudit({
        adInput: {
          name: name.trim() || validHeadlines[0].slice(0, 40),
          category,
          platform,
          headlines: validHeadlines,
          descriptions: validDescriptions,
          displayUrl: displayUrl.trim() || undefined,
          finalUrl: finalUrl.trim() || 'https://example.com',
          cta: cta.trim() || 'Learn More',
          offerDetails: offerDetails.trim() || undefined,
          priceOrDiscount: priceOrDiscount.trim() || undefined,
          eligibilityConditions: eligibilityConditions.trim() || undefined,
          campaignNotes: campaignNotes.trim() || undefined,
        },
        sourceMode,
        rawHtml: rawHtml.trim() || undefined,
        liveUrl: sourceMode === 'live_url' ? (liveUrl || finalUrl).trim() : undefined,
        filename: uploadedFilename || undefined,
      });
    } catch (err: any) {
      setFormError(err.message || 'Audit execution failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t.newAudit}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Submit advertisement creative and pair it with an HTML snapshot or live page to verify message match.
          </p>
        </div>

        {/* Benchmark Quick-Fill Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Load Preset:</label>
          <select
            onChange={handleSelectBenchmark}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">Select benchmark pair (60 available)...</option>
            {benchmarks.map((b) => (
              <option key={b.auditName} value={b.auditName}>
                [{b.pairId || 'P'}] {b.auditName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center gap-2.5 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Campaign Metadata */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            1. Campaign & Ad Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Audit Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q4 Personal Loans - Search"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Business Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="financial_services">Financial Services (Regulated)</option>
                <option value="saas">SaaS & B2B Software</option>
                <option value="ecommerce">Consumer E-Commerce</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Ad Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as AdPlatform)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="google_ads">Google Ads (Search / PMax)</option>
                <option value="meta_ads">Meta Ads (Facebook / Instagram)</option>
                <option value="other">Other Network</option>
              </select>
            </div>
          </div>

          {/* Ad Headlines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Ad Headlines (Promised Benefits & Value Props)
              </label>
              <button
                type="button"
                onClick={addHeadline}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Headline
              </button>
            </div>
            {headlines.map((hl, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={hl}
                  onChange={(e) => updateHeadline(idx, e.target.value)}
                  placeholder={`Headline ${idx + 1} (e.g. Get Approved Same Day)`}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {headlines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHeadline(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500"
                    title="Remove headline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Ad Descriptions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Ad Descriptions (Detailed Claims & Offers)
              </label>
              <button
                type="button"
                onClick={addDescription}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Description
              </button>
            </div>
            {descriptions.map((desc, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => updateDescription(idx, e.target.value)}
                  placeholder={`Description ${idx + 1} (e.g. Fast approval with no credit check impact. Loans up to $10,000.)`}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {descriptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDescription(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500"
                    title="Remove description"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* URLs & Call-to-Action */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Display URL (Optional)
              </label>
              <input
                type="text"
                value={displayUrl}
                onChange={(e) => setDisplayUrl(e.target.value)}
                placeholder="example.com/loans"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Final Landing-Page URL
              </label>
              <input
                type="url"
                value={finalUrl}
                onChange={(e) => setFinalUrl(e.target.value)}
                placeholder="https://example.com/apply"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Call-to-Action Label
              </label>
              <input
                type="text"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="Apply Now / Start Free Trial"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Landing Page Source */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                2. Landing Page Content Source
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Offline snapshots are fully functional without external web access.
              </p>
            </div>

            {/* Source Mode Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs">
              <button
                type="button"
                onClick={() => setSourceMode('html_snapshot')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sourceMode === 'html_snapshot'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Upload Snapshot
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('raw_paste')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sourceMode === 'raw_paste'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Paste HTML / Text
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('live_url')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  sourceMode === 'live_url'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Live URL Fetch
              </button>
            </div>
          </div>

          {/* Source Mode: Upload HTML */}
          {sourceMode === 'html_snapshot' && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center hover:border-sky-400 transition-colors">
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                    Click to upload HTML snapshot
                  </span>
                  <input
                    type="file"
                    accept=".html,.htm,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">
                  Accepts .html, .htm, or pre-rendered text files. Scripts are stripped safely.
                </p>
                {uploadedFilename && (
                  <div className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Loaded: {uploadedFilename} ({Math.round(rawHtml.length / 1024)} KB)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source Mode: Raw Paste */}
          {sourceMode === 'raw_paste' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Paste HTML Markup or Rendered DOM Text
              </label>
              <textarea
                rows={6}
                value={rawHtml}
                onChange={(e) => setRawHtml(e.target.value)}
                placeholder="<html><body><h1>Your Landing Page Headline</h1><p>Body copy, offers, and terms...</p></body></html>"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Source Mode: Live URL */}
          {sourceMode === 'live_url' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Public URL to Fetch (Backend SSRF Guard Active)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={liveUrl || finalUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder="https://example.com/landing"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Protected against SSRF, internal metadata queries, loopback IPs, and script execution.</span>
              </p>
            </div>
          )}

          {/* Preview Extracted Text Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>{isPreviewing ? 'Extracting Preview...' : 'Preview Extracted Content'}</span>
            </button>

            {extractedPreview && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Extracted: {extractedPreview.canonicalText.length} chars, {extractedPreview.sections.length} sections
              </span>
            )}
          </div>

          {/* Preview Error */}
          {previewError && (
            <div className="rounded-md bg-rose-50 p-2.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
              {previewError}
            </div>
          )}

          {/* Preview Inspection Box */}
          {extractedPreview && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs space-y-2 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                <span>Extracted Structure Review</span>
                <span className="text-slate-500">Hash: {extractedPreview.contentHash.slice(0, 12)}...</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <div><strong>Page Title:</strong> {extractedPreview.title || '(none)'}</div>
                <div><strong>Meta Description:</strong> {extractedPreview.metaDescription ? 'Present' : 'None'}</div>
                <div><strong>Headings Found:</strong> {extractedPreview.headings.length}</div>
                <div><strong>CTA Buttons:</strong> {extractedPreview.ctaButtons.map((b) => b.text).join(', ') || 'None'}</div>
              </div>
              <div>
                <strong className="text-[11px] text-slate-700 dark:text-slate-300">Hero Excerpt:</strong>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                  "{extractedPreview.heroText || extractedPreview.canonicalText.slice(0, 160)}..."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            <Sparkles className="h-4 w-4" />
            <span>{isSubmitting ? 'Auditing Against Landing Page...' : 'Run Message Match Audit'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
