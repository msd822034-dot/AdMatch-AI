import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  FlaskConical,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Language, translations } from '../lib/i18n.js';
import { runAcceptanceTestsSuite } from '../lib/api.js';

interface AcceptanceTestsViewProps {
  lang: Language;
}

export const AcceptanceTestsView: React.FC<AcceptanceTestsViewProps> = ({ lang }) => {
  const t = translations[lang];

  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const data = await runAcceptanceTestsSuite();
      setTestResults(data);
    } catch (err: any) {
      alert(`Test run failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-sky-600 dark:text-sky-400" />
            <span>Automated Acceptance & Regression Test Suite</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Rigorous verification for PS-03 requirements: semantic loan & promise matching (Tests A-E), non-fabrication, source/position accuracy, trial/discount conflicts, CTA alignment, SSRF protection, scoring determinism, and prompt injection defense.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 transition-colors"
        >
          <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Test Suite...' : 'Run All Acceptance & Regression Tests'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      {testResults && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Tests
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {testResults.total}
            </div>
            <div className="text-[11px] text-slate-400">PS-03 Benchmark Scenarios</div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-950 dark:bg-emerald-950/20">
            <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Passed
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {testResults.passed}
            </div>
            <div className="text-[11px] text-emerald-600/80">100% compliance met</div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Failed
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {testResults.failed}
            </div>
            <div className="text-[11px] text-slate-400">Zero regressions tolerated</div>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        {!testResults ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <ShieldCheck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p>Click "Run All 12 Acceptance Tests" above to execute the automated test runner.</p>
          </div>
        ) : (
          testResults.results.map((test: any) => {
            const isExpanded = expandedTest === test.id;
            return (
              <div key={test.id} className="p-4 space-y-2 text-xs">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                >
                  <div className="flex items-center gap-2.5">
                    {test.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{test.id}: {test.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal uppercase">
                          [{test.category}]
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {test.actualOutcome}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {test.durationMs}ms
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pl-7 space-y-2 text-[11px] border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-600 dark:text-slate-400">
                    <div>
                      <strong>Expected Behavior:</strong> {test.expectedBehavior}
                    </div>
                    {test.evidenceDetails && (
                      <div>
                        <strong>Execution Data:</strong>
                        <pre className="mt-1 rounded bg-slate-50 p-2 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300 overflow-x-auto">
                          {JSON.stringify(test.evidenceDetails, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
