import React from 'react';
import { Search, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900">FindIt</span>
            <span className="text-sm text-slate-500">— Smart Campus Lost &amp; Found Platform</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Secure Campus Claims
            </span>
            <span>•</span>
            <span>Phase 1 Foundation</span>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} FindIt Campus. Built with React &amp; Supabase.
          </p>
        </div>
      </div>
    </footer>
  );
}
