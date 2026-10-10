import React from 'react';
import {
  Sliders,
  ShieldCheck,
  Code,
  Flame,
  CheckCircle2,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { Language, translations } from '../lib/i18n.js';

interface SettingsViewProps {
  benchmarks: any[];
  onLoadBenchmark: (benchmarkName: string) => void;
  lang: Language;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  benchmarks,
  onLoadBenchmark,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
          <Sliders className="h-6 w-6 text-sky-600 dark:text-sky-400" />
          <span>{t.settings}</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Transparent scoring rubric, anti-SSRF security specifications, and full 60-benchmark test library.
        </p>
      </div>

      {/* 1. Transparent Rubric Calculation Documentation */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-sky-600" />
          <span>Transparent Mathematical Scoring Rubric (Section 9)</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          The message-match score is calculated deterministically in backend application code from verified findings. Category scores are weighted as follows:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs pt-2">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
            <div className="font-bold text-sky-700 dark:text-sky-400">30% Weight</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">Promise Alignment</div>
            <div className="text-[11px] text-slate-500 mt-1">Headlines & Core Guarantees</div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
            <div className="font-bold text-sky-700 dark:text-sky-400">25% Weight</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">Offer & Price</div>
            <div className="text-[11px] text-slate-500 mt-1">Discounts, Free Trials, Terms</div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
            <div className="font-bold text-sky-700 dark:text-sky-400">20% Weight</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">Claim Support</div>
            <div className="text-[11px] text-slate-500 mt-1">Ad Descriptions & Features</div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
            <div className="font-bold text-sky-700 dark:text-sky-400">15% Weight</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">CTA Consistency</div>
            <div className="text-[11px] text-slate-500 mt-1">Ad CTA vs Page Button Action</div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
            <div className="font-bold text-sky-700 dark:text-sky-400">10% Weight</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-1">Content Prominence</div>
            <div className="text-[11px] text-slate-500 mt-1">Hero vs Primary vs Footer</div>
          </div>
        </div>

        <div className="pt-2 text-[11px] text-slate-500 space-y-1">
          <p>• Contradicted claims penalize heavily (-40 to -70 in category score).</p>
          <p>• Not Found important promises are penalized (-30 to -50 in category score).</p>
          <p>• Core promises discovered only in footer text receive a prominence penalty (-35).</p>
        </div>
      </div>

      {/* 2. SSRF & Security Architecture */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Security Architecture & SSRF Defense</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded bg-slate-50 p-3 dark:bg-slate-800/60 space-y-1">
            <strong>Network Restrictions:</strong>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Blocks localhost, 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, link-local 169.254.169.254, and Google/AWS cloud metadata hostnames.
            </p>
          </div>
          <div className="rounded bg-slate-50 p-3 dark:bg-slate-800/60 space-y-1">
            <strong>Sanitization & Zero Script Execution:</strong>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Uploaded HTML snapshots are parsed statically via Cheerio with script/style/iframe tags stripped immediately. No user-supplied JavaScript is ever executed.
            </p>
          </div>
        </div>
      </div>

      {/* 3. 60 Benchmark Library Browser */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500" />
          <span>Benchmark Pairs Explorer ({benchmarks.length} Total)</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Click "Load & Audit" on any benchmark pair to inspect its message match evaluation:
        </p>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {benchmarks.slice(0, 30).map((b, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {b.auditName}
                </div>
                <div className="text-[11px] text-slate-500">
                  [{b.category.toUpperCase()}] Ad: "{b.headline}"
                </div>
              </div>
              <button
                onClick={() => onLoadBenchmark(b.auditName)}
                className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
              >
                Load & Audit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
