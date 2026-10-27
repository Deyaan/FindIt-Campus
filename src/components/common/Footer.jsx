import React from 'react';
import { Search, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-white dark:bg-[#11121c] border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Search className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">FindIt</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">— Smart Campus Lost &amp; Found Platform</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Verified Campus Recovery
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Fast &amp; Private</span>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} FindIt Campus. Built for students.
          </p>
        </div>
      </div>
    </footer>
  );
}
