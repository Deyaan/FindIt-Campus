import React from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, CheckCircle2, ShieldCheck, Cpu, ArrowRight, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export default function Home() {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-slate-50 pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100/80 text-indigo-700 text-xs font-semibold tracking-wide border border-indigo-200/60">
            <Cpu className="w-3.5 h-3.5" />
            Deterministic Algorithm Matching Engine
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Lost something on campus? <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Find it faster with FindIt.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The modern campus lost and found platform with deterministic item matching, secure ownership claims, and transparent administrative resolution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/browse"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all hover:scale-[1.02]"
            >
              <Search className="w-5 h-5" />
              Browse Lost &amp; Found
            </Link>
            <Link
              to="/report"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Report Lost or Found
            </Link>
          </div>
        </div>
      </section>

      {/* Supabase Status Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isSupabaseConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {isSupabaseConfigured ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            )}
            <div>
              <h3 className="font-semibold text-sm">
                {isSupabaseConfigured
                  ? 'Supabase Backend Connected'
                  : 'Supabase Client Initialized (Awaiting Project Credentials)'}
              </h3>
              <p className="text-xs opacity-85 mt-0.5">
                {isSupabaseConfigured
                  ? 'Authentication, database tables, and Row Level Security are live and operational.'
                  : 'Add your project URL and Anon key to .env to connect to your live database.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-white/70 border border-current/20 shrink-0">
            {isSupabaseConfigured ? 'CONNECTED' : 'ENV PENDING'}
          </span>
        </div>
      </section>

      {/* Core Workflow Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Browse &amp; Search</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Filter by campus zones, item category, incident date, and status. Real-time listings keep you up to date.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Smart Matching</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Transparent Jaccard text similarity and location-date proximity ranking surfaces high-confidence matches automatically.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Verified Claims</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Private ownership proofs protected by Row Level Security ensure items only return to their rightful owners.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
