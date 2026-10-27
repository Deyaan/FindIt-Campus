import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Users,
  Package,
  BarChart2,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Tag,
  MapPin,
  Calendar,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        {value === null ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400 mt-1" />
        ) : (
          <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Claim Status Badge ───────────────────────────────────────────────────────

function ClaimStatusBadge({ status }) {
  const map = {
    pending:  { cls: 'bg-amber-100 text-amber-800 border-amber-200',   icon: Clock },
    approved: { cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
    rejected: { cls: 'bg-rose-100 text-rose-800 border-rose-200',     icon: XCircle },
  };
  const cfg = map[status] || { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

// ─── Item Status Badge ────────────────────────────────────────────────────────

function ItemStatusBadge({ status }) {
  const map = {
    active:    'bg-emerald-100 text-emerald-800 border-emerald-200',
    claimed:   'bg-amber-100 text-amber-800 border-amber-200',
    returned:  'bg-blue-100 text-blue-800 border-blue-200',
    moderated: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
}

// ─── Claims Review Panel ──────────────────────────────────────────────────────

function ClaimsPanel() {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNoteInputs, setAdminNoteInputs] = useState({});
  const [filterStatus, setFilterStatus] = useState('pending');

  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let query = supabase
      .from('claims')
      .select(`
        id,
        status,
        proof_description,
        contact_details,
        admin_notes,
        created_at,
        claimant_id,
        items:item_id ( id, title, type, category, location, status ),
        claimant:claimant_id ( full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setClaims(data || []);
    setIsLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleAction = async (claimId, newStatus, itemId) => {
    setActionLoading(claimId + newStatus);
    const note = adminNoteInputs[claimId]?.trim() || null;

    const { error: claimErr } = await supabase
      .from('claims')
      .update({ status: newStatus, admin_notes: note })
      .eq('id', claimId);

    if (claimErr) {
      alert('Failed to update claim: ' + claimErr.message);
      setActionLoading(null);
      return;
    }

    // If approving, update item status to 'claimed'
    if (newStatus === 'approved' && itemId) {
      await supabase.from('items').update({ status: 'claimed' }).eq('id', itemId);
    }

    setActionLoading(null);
    fetchClaims();
  };

  const STATUS_FILTERS = ['pending', 'approved', 'rejected', 'all'];

  return (
    <div className="space-y-4">
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            id={`filter-claims-${s}`}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              filterStatus === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={fetchClaims}
          disabled={isLoading}
          className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="text-sm">Loading claims...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 inline mr-2" />{error}
        </div>
      ) : claims.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
          <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">No {filterStatus} claims found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const isExpanded = expandedId === claim.id;
            const linkedItem = claim.items;
            const claimant = claim.claimant;

            return (
              <div key={claim.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Claim Row Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                  className="w-full flex items-start sm:items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors gap-3"
                  id={`claim-row-${claim.id}`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClaimStatusBadge status={claim.status} />
                      {linkedItem && (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          linkedItem.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {linkedItem.type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {linkedItem?.title || 'Item Unavailable'}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                      <span>Claimant: <strong className="text-slate-700">{claimant?.full_name || 'Unknown'}</strong></span>
                      <span>{new Date(claim.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                </button>

                {/* Expanded Claim Detail */}
                {isExpanded && (
                  <div className="px-4 pb-5 space-y-4 border-t border-slate-100">
                    {/* Proof Description */}
                    <div className="pt-4 space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Proof of Ownership
                      </p>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
                        {claim.proof_description}
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> Contact Details
                      </p>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800">
                        {claim.contact_details}
                      </div>
                    </div>

                    {/* Linked Item Info */}
                    {linkedItem && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{linkedItem.category}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{linkedItem.location}</span>
                        <ItemStatusBadge status={linkedItem.status} />
                        <Link to={`/items/${linkedItem.id}`} className="ml-auto text-indigo-600 font-semibold flex items-center gap-1 hover:underline text-xs">
                          View Item <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Admin Notes Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                        Admin Note (optional)
                      </label>
                      <textarea
                        rows={2}
                        value={adminNoteInputs[claim.id] || claim.admin_notes || ''}
                        onChange={(e) => setAdminNoteInputs((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                        placeholder="Reason for approval/rejection or additional instructions..."
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition"
                      />
                    </div>

                    {/* Action Buttons */}
                    {claim.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          id={`btn-approve-${claim.id}`}
                          onClick={() => handleAction(claim.id, 'approved', linkedItem?.id)}
                          disabled={!!actionLoading}
                          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === claim.id + 'approved' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          Approve Claim
                        </button>
                        <button
                          id={`btn-reject-${claim.id}`}
                          onClick={() => handleAction(claim.id, 'rejected', linkedItem?.id)}
                          disabled={!!actionLoading}
                          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === claim.id + 'rejected' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Reject Claim
                        </button>
                      </div>
                    )}

                    {/* Mark as Returned (only for approved claims) */}
                    {claim.status === 'approved' && linkedItem?.status !== 'returned' && (
                      <button
                        id={`btn-returned-${claim.id}`}
                        onClick={async () => {
                          if (!linkedItem?.id) return;
                          setActionLoading(claim.id + 'returned');
                          await supabase.from('items').update({ status: 'returned' }).eq('id', linkedItem.id);
                          setActionLoading(null);
                          fetchClaims();
                        }}
                        disabled={!!actionLoading}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === claim.id + 'returned' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Mark Item as Physically Returned
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Item Moderation Panel ────────────────────────────────────────────────────

function ItemsPanel() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let query = supabase
      .from('items')
      .select(`
        id, type, title, category, location, status, created_at,
        profiles:user_id ( full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setItems(data || []);
    setIsLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const updateStatus = async (itemId, newStatus) => {
    setActionLoading(itemId);
    const { error: err } = await supabase.from('items').update({ status: newStatus }).eq('id', itemId);
    if (err) alert('Update failed: ' + err.message);
    setActionLoading(null);
    fetchItems();
  };

  const STATUS_FILTERS = ['active', 'claimed', 'returned', 'moderated', 'all'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            id={`filter-items-${s}`}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              filterStatus === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600">No {filterStatus} items</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className={`mt-0.5 shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  item.type === 'lost' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {item.type}
                </span>
                <div className="min-w-0">
                  <Link to={`/items/${item.id}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors block truncate">
                    {item.title}
                  </Link>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                    <span>{item.profiles?.full_name || 'Unknown'}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</span>
                    <span>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <ItemStatusBadge status={item.status} />
                {item.status === 'active' && (
                  <button
                    id={`btn-moderate-${item.id}`}
                    onClick={() => updateStatus(item.id, 'moderated')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === item.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : 'Moderate'}
                  </button>
                )}
                {item.status === 'moderated' && (
                  <button
                    id={`btn-restore-${item.id}`}
                    onClick={() => updateStatus(item.id, 'active')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function Admin() {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('claims');
  const [metrics, setMetrics] = useState({
    totalItems: null,
    activeItems: null,
    pendingClaims: null,
  });

  const fetchMetrics = useCallback(async () => {
    const [itemsRes, activeRes, claimsRes] = await Promise.all([
      supabase.from('items').select('id', { count: 'exact', head: true }),
      supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setMetrics({
      totalItems: itemsRes.count ?? 0,
      activeItems: activeRes.count ?? 0,
      pendingClaims: claimsRes.count ?? 0,
    });
  }, []);

  useEffect(() => {
    if (role === 'admin') fetchMetrics();
  }, [role, fetchMetrics]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading admin portal...</span>
      </div>
    );
  }

  // Non-admin fallback (route guard covers most cases but belt-and-suspenders)
  if (!user || role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-400 mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-slate-500 text-sm">Administrator privileges are required to access this portal.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
          Admin &amp; Moderation Portal
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Review claims, moderate reports, and track campus item returns.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={Package}
          label="Total Items"
          value={metrics.totalItems}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <MetricCard
          icon={BarChart2}
          label="Active Items"
          value={metrics.activeItems}
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          icon={Clock}
          label="Pending Claims"
          value={metrics.pendingClaims}
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 w-fit">
        <button
          id="tab-admin-claims"
          onClick={() => setActiveTab('claims')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'claims'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Claims Review
        </button>
        <button
          id="tab-admin-items"
          onClick={() => setActiveTab('items')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'items'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Item Moderation
        </button>
      </div>

      {/* Panel Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        {activeTab === 'claims' ? (
          <>
            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Ownership Claims
            </h2>
            <ClaimsPanel />
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Item Moderation
            </h2>
            <ItemsPanel />
          </>
        )}
      </div>
    </div>
  );
}
