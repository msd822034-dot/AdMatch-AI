import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Layers,
  FileSearch,
  FileText,
  Sliders,
  CheckCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Language, translations } from '../lib/i18n.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  auditCount: number;
  lang: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  auditCount,
  lang,
}) => {
  const t = translations[lang];

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'new-audit', label: t.newAudit, icon: PlusCircle, isPrimary: true },
    { id: 'history', label: t.auditHistory, icon: History, count: auditCount },
    { id: 'batch', label: t.batchAudit, icon: Layers },
    { id: 'evidence', label: t.evidenceExplorer, icon: FileSearch },
    { id: 'reports', label: t.reports, icon: FileText },
    { id: 'acceptance-tests', label: t.acceptanceTests, icon: CheckCircle },
    { id: 'settings', label: t.settings, icon: Sliders },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
      <div className="p-4 space-y-6">
        {/* Quick Launch CTA */}
        <button
          onClick={() => setCurrentTab('new-audit')}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all dark:bg-sky-500 dark:hover:bg-sky-400"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{t.newAudit}</span>
        </button>

        {/* Primary Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-sky-400'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Strict Evidence Grounding</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Zero hallucinated quotes. Deterministic position-aware scoring.
          </p>
        </div>
      </div>
    </aside>
  );
};
