import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  Loader2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ─── Status Badge Helpers ────────────────────────────────────────────────────

function ItemStatusBadge({ status }) {
  const map = {
    active:    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    claimed:   'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    returned:  'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    moderated: 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${map[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
      {status}
    </span>
  );
}

function ClaimStatusBadge({ status }) {
  const map = {
    pending:  { cls: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',  icon: Clock },
    approved: { cls: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60', icon: CheckCircle2 },
    rejected: { cls: 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50',    icon: XCircle },
  };
  const cfg = map[status] || { cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

// ─── My Reports Section ──────────────────────────────────────────────────────

function MyReports({ userId }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('items')
      .select('id, type, title, category, location, date_incident, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (err) {
      setError(err.message);
    } else {
      setReports(data || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
        <span className="text-sm">Loading your reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</span>
        <button onClick={fetchReports} className="text-xs font-bold underline">Retry</button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="py-10 text-center space-y-3 rounded-2xl bg-slate-50 dark:bg-[#11121d] border border-dashed border-slate-200 dark:border-slate-800">
        <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No reports yet</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Reports you submit will appear here.</p>
        <Link
          to="/report"
          id="btn-new-report-empty"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Submit a Report
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((item) => (
        <Link
          key={item.id}
          to={`/items/${item.id}`}
          className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-sm bg-white dark:bg-[#181a28] transition-all group"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span
              className={`mt-0.5 shrink-0 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                item.type === 'lost'
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                  : 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
              }`}
            >
              {item.type}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {item.title}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.category}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.date_incident}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <ItemStatusBadge status={item.status} />
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── My Claims Section ───────────────────────────────────────────────────────

function MyClaims({ userId }) {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('claims')
      .select(`
        id,
        status,
        admin_notes,
        created_at,
        items:item_id ( id, title, type, category, location )
      `)
      .eq('claimant_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (err) {
      setError(err.message);
    } else {
      setClaims(data || []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
        <span className="text-sm">Loading your claims...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-800 dark:text-rose-300 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</span>
        <button onClick={fetchClaims} className="text-xs font-bold underline">Retry</button>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="py-10 text-center space-y-3 rounded-2xl bg-slate-50 dark:bg-[#11121d] border border-dashed border-slate-200 dark:border-slate-800">
        <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No claims submitted yet</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          When you claim ownership of a found item, it will appear here.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-sm transition-colors"
        >
          Browse Found Items
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {claims.map((claim) => {
        const linkedItem = claim.items;
        return (
          <div
            key={claim.id}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181a28] space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {linkedItem ? (
                  <Link
                    to={`/items/${linkedItem.id}`}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors truncate block"
                  >
                    {linkedItem.title}
                  </Link>
                ) : (
                  <p className="text-sm font-bold text-slate-400 italic">Item no longer available</p>
                )}
                {linkedItem && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{linkedItem.category}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{linkedItem.location}</span>
                  </div>
                )}
              </div>
              <ClaimStatusBadge status={claim.status} />
            </div>

            {claim.admin_notes && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">Admin Note: </span>{claim.admin_notes}
              </div>
            )}

            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Submitted: {new Date(claim.created_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'claims'

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        <span className="text-sm font-medium">Loading your dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-slate-600 dark:text-slate-300 font-semibold">You must be signed in to view your dashboard.</p>
        <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 transition-colors duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">My Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-200">{profile?.full_name || user.email}</span>
          </p>
        </div>
        <Link
          to="/report"
          id="btn-new-report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-colors shadow-sm shadow-purple-600/25"
        >
          <Plus className="w-4 h-4" />
          New Report
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-[#1a1c2b] w-fit border border-slate-200/80 dark:border-slate-800">
        <button
          id="tab-my-reports"
          onClick={() => setActiveTab('reports')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-[#25283b] text-purple-700 dark:text-purple-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Reports
        </button>
        <button
          id="tab-my-claims"
          onClick={() => setActiveTab('claims')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'claims'
              ? 'bg-white dark:bg-[#25283b] text-purple-700 dark:text-purple-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          My Claims
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-[#151724] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors duration-200">
        {activeTab === 'reports' ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                My Submitted Reports
              </h2>
              <Link to="/report" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> New
              </Link>
            </div>
            <MyReports userId={user.id} />
          </>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-500" />
                My Ownership Claims
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Track the review status of your submitted ownership claims here.
              </p>
            </div>
            <MyClaims userId={user.id} />
          </>
        )}
      </div>
    </div>
  );
}
