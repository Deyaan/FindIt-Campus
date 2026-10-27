import React from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, CheckCircle2, ShieldCheck, Cpu, ArrowRight, AlertTriangle, Sparkles, Compass } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Home() {
  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50/60 via-white to-slate-50 dark:from-purple-950/20 dark:via-[#11121c] dark:to-[#0d0e15] pt-14 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] bg-gradient-to-tr from-purple-600/15 to-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100/80 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-semibold tracking-wide border border-purple-200 dark:border-purple-800/60 shadow-xs">
            <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Deterministic Algorithm Matching Engine
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Lost something on campus? <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400">
              Find it faster with FindIt.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The modern campus lost and found platform with deterministic item matching, secure ownership claims, and transparent administrative resolution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <Link
              to="/browse"
              id="hero-browse-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02]"
            >
              <Search className="w-5 h-5" />
              Browse Lost &amp; Found
            </Link>
            <Link
              to="/report"
              id="hero-report-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl text-slate-800 dark:text-slate-200 bg-white dark:bg-[#161825] hover:bg-slate-50 dark:hover:bg-[#1f2233] border border-slate-300 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Report Lost or Found
            </Link>
          </div>
        </div>
      </section>

      {/* Supabase Status Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
            isSupabaseConfigured
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <h3 className="font-semibold text-sm">
                {isSupabaseConfigured
                  ? 'Supabase Backend Connected'
                  : 'Supabase Client Initialized (Awaiting Project Credentials)'}
              </h3>
              <p className="text-xs opacity-85 mt-0.5 text-emerald-700 dark:text-emerald-400">
                {isSupabaseConfigured
                  ? 'Authentication, database tables, and Row Level Security are live and operational.'
                  : 'Add your project URL and Anon key to .env to connect to your live database.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-current/20 shrink-0">
            {isSupabaseConfigured ? 'CONNECTED' : 'ENV PENDING'}
          </span>
        </div>
      </section>

      {/* Core Workflow Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#151724] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 border border-purple-100 dark:border-purple-900/50 group-hover:scale-105 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1. Browse &amp; Search</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Filter by campus zones, item category, incident date, and status. Real-time listings keep you up to date.
            </p>
          </div>

          <div className="bg-white dark:bg-[#151724] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/50 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">2. Smart Matching</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Transparent Jaccard text similarity and location-date proximity ranking surfaces high-confidence matches automatically.
            </p>
          </div>

          <div className="bg-white dark:bg-[#151724] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/50 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">3. Verified Claims</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Private ownership proofs protected by Row Level Security ensure items only return to their rightful owners.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
