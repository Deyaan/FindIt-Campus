import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  ShieldCheck, 
  AlertCircle, 
  Image as ImageIcon,
  Loader2,
  Cpu,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getItemSignedUrl } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import PotentialMatches from '../components/items/PotentialMatches';
import ClaimModal from '../components/claims/ClaimModal';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadItemDetail() {
      setIsLoading(true);
      setErrorMsg(null);
      setNotFound(false);

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !uuidRegex.test(id)) {
        if (isMounted) {
          setNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('items')
          .select(`
            id,
            user_id,
            type,
            title,
            category,
            description,
            location,
            date_incident,
            photo_path,
            status,
            created_at,
            updated_at,
            profiles:user_id ( full_name )
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          if (isMounted) setNotFound(true);
          return;
        }

        if (isMounted) {
          setItem(data);
        }

        // Fetch signed URL if photo_path exists
        if (data.photo_path) {
          const photoUrl = await getItemSignedUrl(data.photo_path);
          if (isMounted) {
            setSignedPhotoUrl(photoUrl);
          }
        }
      } catch (err) {
        console.error('[FindIt ItemDetail Error]:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load item details.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadItemDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading item record from campus registry...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 dark:bg-[#1a1c2b] text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Item Not Found</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            This item report does not exist, has been removed, or is no longer available in the public directory.
          </p>
        </div>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse Feed
        </Link>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Unable to Display Item</h1>
          <p className="text-sm text-rose-700 dark:text-rose-400">{errorMsg}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1a1c2b] border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#202234] transition-all"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const formattedIncidentDate = item.date_incident
    ? new Date(item.date_incident + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown Date';

  const formattedCreatedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Back Navigation Button */}
      <div>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse Feed
        </Link>
      </div>

      {/* Main Item Container */}
      <div className="bg-white dark:bg-[#151724] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
        {/* Header Badges & Title */}
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isLost
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                  : 'bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLost ? 'bg-rose-500' : 'bg-purple-600'
                }`}
              ></span>
              {isLost ? 'Lost Item Report' : 'Found Item Report'}
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-[#1a1c2c] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {item.category}
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 capitalize">
              Status: {item.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            {item.title}
          </h1>
        </div>

        {/* Photo Section (if photo exists) */}
        {signedPhotoUrl && (
          <div className="relative w-full max-h-[460px] bg-slate-900 dark:bg-[#0c0d14] flex items-center justify-center overflow-hidden">
            <img
              src={signedPhotoUrl}
              alt={item.title}
              className="w-full max-h-[460px] object-contain"
            />
          </div>
        )}

        {/* Item Details Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#11121d] border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Campus Location
              </span>
              <div className="flex items-start gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span>{item.location}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Incident Date
              </span>
              <div className="flex items-start gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <span>{formattedIncidentDate}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Reported By
              </span>
              <div className="flex items-start gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <span>{item.profiles?.full_name || 'Campus Member'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Reported On
              </span>
              <div className="flex items-start gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <span>{formattedCreatedDate}</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Detailed Description
            </h2>
            <div className="p-6 rounded-2xl bg-white dark:bg-[#181a28] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line shadow-xs">
              {item.description}
            </div>
          </div>

          {/* Claims Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {item.type === 'found' ? (
              hasClaimed ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Claim Submitted</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Your ownership claim is pending admin review. Track its status in your Dashboard.
                    </p>
                  </div>
                </div>
              ) : user ? (
                <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">Is This Your Item?</h4>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                        Submit a private ownership claim with proof. Admins will verify and contact you.
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-submit-claim"
                    onClick={() => setShowClaimModal(true)}
                    className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-sm shadow-purple-600/30 transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Submit Claim
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">Is This Your Item?</h4>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">
                      <Link to="/login" className="underline font-semibold text-purple-600 dark:text-purple-400">Sign in</Link> to submit a private ownership claim.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#11121d] border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Lost Item Report</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    If you find this item, you can report it as found via the Report page.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Potential Matches Section */}
      <PotentialMatches targetItem={item} />

      {/* Claim Modal */}
      {showClaimModal && (
        <ClaimModal
          item={item}
          onClose={() => setShowClaimModal(false)}
          onClaimed={() => {
            setHasClaimed(true);
            setShowClaimModal(false);
          }}
        />
      )}
    </div>
  );
}
