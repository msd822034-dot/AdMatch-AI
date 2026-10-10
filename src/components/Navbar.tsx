import React from 'react';
import {
  ShieldAlert,
  Moon,
  Sun,
  Globe,
  Bell,
  Search,
  FlaskConical,
  CheckCircle2,
} from 'lucide-react';
import { Language, translations } from '../lib/i18n.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRunQuickTests: () => void;
  isTesting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  setCurrentTab,
  lang,
  setLang,
  isDark,
  setIsDark,
  searchQuery,
  setSearchQuery,
  onRunQuickTests,
  isTesting,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-sky-500 dark:text-slate-950">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold tracking-tight text-slate-900 dark:text-white">
              <span>{t.appTitle}</span>
              <span className="text-[10px] uppercase font-semibold text-sky-700 dark:text-sky-300">PS-03</span>
            </div>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{t.tagline}</p>
          </div>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mx-4 hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search audits by name, claim, URL, or headline..."
          className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-900 transition-colors focus:border-sky-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400"
        />
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Run Acceptance Tests */}
        <button
          onClick={onRunQuickTests}
          disabled={isTesting}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Run 12 Automated Acceptance Tests"
        >
          <FlaskConical className={`h-3.5 w-3.5 text-sky-600 dark:text-sky-400 ${isTesting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isTesting ? 'Testing...' : 'Acceptance Tests'}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
          className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Toggle Language (English / Tamil)"
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification Indicator */}
        <div className="relative">
          <button
            onClick={() => setCurrentTab('reports')}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Reports and notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white dark:ring-slate-900" />
        </div>
      </div>
    </header>
  );
};
