import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { NewAuditView } from './components/NewAuditView.js';
import { AuditDetailView } from './components/AuditDetailView.js';
import { BatchAuditView } from './components/BatchAuditView.js';
import { EvidenceExplorerView } from './components/EvidenceExplorerView.js';
import { AcceptanceTestsView } from './components/AcceptanceTestsView.js';
import { ReportsView } from './components/ReportsView.js';
import { SettingsView } from './components/SettingsView.js';
import { AuditReport, SourceMode } from './types.js';
import { Language } from './lib/i18n.js';
import {
  createAudit,
  deleteAuditById,
  fetchAudits,
  fetchBenchmarks,
  runAcceptanceTestsSuite,
} from './lib/api.js';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedAudit, setSelectedAudit] = useState<AuditReport | null>(null);
  const [lang, setLang] = useState<Language>('en');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load audits and benchmark pairs on mount
  const loadData = async () => {
    try {
      const [auditsData, benchmarksData] = await Promise.all([
        fetchAudits(),
        fetchBenchmarks(),
      ]);
      setAudits(auditsData);
      setBenchmarks(benchmarksData.benchmarks || []);
    } catch (err: any) {
      console.error('Failed to load audits:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Create New Audit Handler
  const handleCreateAudit = async (payload: {
    adInput: any;
    sourceMode: SourceMode;
    rawHtml?: string;
    liveUrl?: string;
    filename?: string;
  }) => {
    const report = await createAudit(payload);
    setAudits((prev) => [report, ...prev]);
    setSelectedAudit(report);
    setCurrentTab('audit-detail');
    showToast(`Audit "${report.adInput.name}" completed with score ${report.messageMatchScore}/100.`);
  };

  // Delete Audit Handler
  const handleDeleteAudit = async (id: string) => {
    try {
      await deleteAuditById(id);
      setAudits((prev) => prev.filter((a) => a.id !== id));
      if (selectedAudit?.id === id) {
        setSelectedAudit(null);
        setCurrentTab('dashboard');
      }
      showToast('Audit deleted successfully.');
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  // 1-Click Load Benchmark Pair
  const handleLoadBenchmark = async (benchmarkIdentifier: string) => {
    const b = benchmarks.find(
      (item) =>
        item.auditName === benchmarkIdentifier ||
        item.pairId === benchmarkIdentifier ||
        item.auditName.toLowerCase().includes(benchmarkIdentifier.toLowerCase())
    );
    if (!b) return;

    try {
      showToast(`Running message match audit on "${b.auditName}"...`);
      const report = await createAudit({
        adInput: {
          name: b.auditName,
          category: b.category,
          platform: 'google_ads',
          headlines: b.headlines || [b.headline],
          descriptions: b.descriptions || [b.description],
          finalUrl: b.landingPageUrl,
          cta: b.cta,
        },
        sourceMode: 'html_snapshot',
        rawHtml: b.sampleHtml,
        filename: b.snapshotFile || `${b.auditName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`,
      });

      setAudits((prev) => [report, ...prev.filter((a) => a.id !== report.id)]);
      setSelectedAudit(report);
      setCurrentTab('audit-detail');
      showToast(`Audit complete: Score ${report.messageMatchScore}/100.`);
    } catch (err: any) {
      showToast(`Benchmark audit failed: ${err.message}`, 'error');
    }
  };

  // Quick Run Acceptance Tests
  const handleRunQuickTests = async () => {
    setIsTesting(true);
    setCurrentTab('acceptance-tests');
    try {
      await runAcceptanceTestsSuite();
      showToast('Acceptance tests executed successfully.');
    } catch (err: any) {
      showToast(`Acceptance tests failed: ${err.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Filtered audits based on search
  const filteredAudits = audits.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = a.adInput.name.toLowerCase().includes(q);
    const hlMatch = a.adInput.headlines.some((h) => h.toLowerCase().includes(q));
    const urlMatch = a.adInput.finalUrl.toLowerCase().includes(q);
    return nameMatch || hlMatch || urlMatch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium shadow-lg transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 rounded p-0.5 hover:bg-white/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            if (tab !== 'audit-detail') setSelectedAudit(null);
          }}
          lang={lang}
          setLang={setLang}
          isDark={isDark}
          setIsDark={setIsDark}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRunQuickTests={handleRunQuickTests}
          isTesting={isTesting}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={(tab) => {
              setCurrentTab(tab);
              if (tab !== 'audit-detail') setSelectedAudit(null);
            }}
            auditCount={audits.length}
            lang={lang}
          />

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {/* Dashboard View */}
            {currentTab === 'dashboard' && (
              <DashboardView
                audits={filteredAudits}
                onSelectAudit={(audit) => {
                  setSelectedAudit(audit);
                  setCurrentTab('audit-detail');
                }}
                onNewAudit={() => setCurrentTab('new-audit')}
                onLoadBenchmark={handleLoadBenchmark}
                lang={lang}
              />
            )}

            {/* New Audit View */}
            {currentTab === 'new-audit' && (
              <NewAuditView
                onSubmitAudit={handleCreateAudit}
                benchmarks={benchmarks}
                lang={lang}
              />
            )}

            {/* Audit Detail View */}
            {currentTab === 'audit-detail' && selectedAudit && (
              <AuditDetailView
                audit={selectedAudit}
                allAudits={audits}
                onBack={() => {
                  setSelectedAudit(null);
                  setCurrentTab('dashboard');
                }}
                onDelete={handleDeleteAudit}
                onAuditUpdated={(updated) => {
                  setSelectedAudit(updated);
                  setAudits((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
                }}
                lang={lang}
              />
            )}

            {/* Audit History Tab */}
            {currentTab === 'history' && (
              <DashboardView
                audits={filteredAudits}
                onSelectAudit={(audit) => {
                  setSelectedAudit(audit);
                  setCurrentTab('audit-detail');
                }}
                onNewAudit={() => setCurrentTab('new-audit')}
                onLoadBenchmark={handleLoadBenchmark}
                lang={lang}
              />
            )}

            {/* Batch Audit View */}
            {currentTab === 'batch' && (
              <BatchAuditView
                benchmarks={benchmarks}
                onBatchAuditCompleted={loadData}
                lang={lang}
              />
            )}

            {/* Evidence Explorer View */}
            {currentTab === 'evidence' && (
              <EvidenceExplorerView
                audits={audits}
                onSelectAudit={(audit) => {
                  setSelectedAudit(audit);
                  setCurrentTab('audit-detail');
                }}
                lang={lang}
              />
            )}

            {/* Acceptance Tests View */}
            {currentTab === 'acceptance-tests' && (
              <AcceptanceTestsView lang={lang} />
            )}

            {/* Reports View */}
            {currentTab === 'reports' && (
              <ReportsView
                audits={audits}
                onSelectAudit={(audit) => {
                  setSelectedAudit(audit);
                  setCurrentTab('audit-detail');
                }}
                lang={lang}
              />
            )}

            {/* Settings & Benchmarks View */}
            {currentTab === 'settings' && (
              <SettingsView
                benchmarks={benchmarks}
                onLoadBenchmark={handleLoadBenchmark}
                lang={lang}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
