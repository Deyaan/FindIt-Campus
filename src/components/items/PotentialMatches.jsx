import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Tag, 
  Info, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { getPotentialMatches } from '../../lib/matching';
import { batchGetSignedUrls } from '../../lib/storage';

export default function PotentialMatches({ targetItem }) {
  const [matches, setMatches] = useState([]);
  const [signedUrls, setSignedUrls] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchMatches = async () => {
    if (!targetItem?.id || !targetItem?.type) return;

    setIsLoading(true);
    setErrorMsg(null);

    const { matches: candidates, error } = await getPotentialMatches(targetItem, 30, 5);

    if (error) {
      setErrorMsg(error);
      setIsLoading(false);
      return;
    }

    setMatches(candidates);

    // Resolve thumbnails in batch
    if (candidates.length > 0) {
      const itemsWithPhotos = candidates.map((c) => c.item);
      const urlMap = await batchGetSignedUrls(itemsWithPhotos);
      setSignedUrls(urlMap);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, [targetItem?.id, targetItem?.type]);

  // Color code based on score
  const getScoreBadge = (score) => {
    if (score >= 70) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        bar: 'bg-emerald-500',
        label: 'Strong Match',
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        bar: 'bg-indigo-600',
        label: 'Moderate Match',
      };
    }
    return {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      bar: 'bg-amber-500',
      label: 'Possible Match',
    };
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Cpu className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Potential Matches
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic ranking against active counter-reports (Max: 100 points)
            </p>
          </div>
        </div>

        <button
          onClick={fetchMatches}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors self-start sm:self-auto"
          title="Refresh matching calculations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Recalculate
        </button>
      </div>

      {/* Mandatory Algorithmic Disclaimer */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/80 text-xs text-indigo-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-semibold text-indigo-950">
            Automated Heuristic Suggestions — Verification Required
          </p>
          <p className="text-indigo-800/90">
            Scores are computed algorithmically from Category (30 pts), Description Keywords Jaccard Similarity (30 pts), Location Proximity (25 pts), and Incident Date (15 pts). These are potential candidate correlations only and never constitute confirmed ownership or physical identification.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
          <p className="text-xs font-medium">Scanning counter-reports &amp; computing similarity...</p>
        </div>
      ) : errorMsg ? (
        /* Error State (Reported transparently) */
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider">Matching Query Failed</p>
              <p className="text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <button
            onClick={fetchMatches}
            className="text-xs font-bold text-rose-700 underline shrink-0 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      ) : matches.length === 0 ? (
        /* Empty State */
        <div className="py-8 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Potential Matches Above Threshold</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No active {targetItem.type === 'lost' ? 'found' : 'lost'} items met the minimum match threshold (score &ge; 30). As new reports are filed, matching candidates will update automatically.
          </p>
        </div>
      ) : (
        /* Candidates List */
        <div className="space-y-4">
          {matches.map(({ item: candidate, score, breakdown, details }) => {
            const badge = getScoreBadge(score);
            const isCandidateLost = candidate.type === 'lost';
            const candidatePhoto = signedUrls[candidate.photo_path] || null;

            return (
              <div
                key={candidate.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-5 group"
              >
                {/* Left: Thumbnail + Basic Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Photo or Fallback Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {candidatePhoto ? (
                      <img
                        src={candidatePhoto}
                        alt={candidate.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCandidateLost
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {isCandidateLost ? 'Lost Item' : 'Found Item'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Tag className="w-3 h-3" />
                        {candidate.category}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {candidate.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {candidate.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {candidate.date_incident}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score Breakdown Meter & Action Link */}
                <div className="w-full md:w-64 flex flex-col md:items-end space-y-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Score Pill */}
                  <div className="flex items-center justify-between md:justify-end gap-2 w-full">
                    <span className="text-xs text-slate-500 font-medium">{badge.label}</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}
                    >
                      {score} / 100 pts
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${badge.bar}`}
                      style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                    ></div>
                  </div>

                  {/* Metric Points Breakdown */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-400 w-full pt-1 text-center font-mono">
                    <span title="Category Score">Cat: +{breakdown.category}</span>
                    <span title="Keywords Jaccard Similarity">Desc: +{breakdown.description}</span>
                    <span title="Campus Location Match">Loc: +{breakdown.location}</span>
                    <span title="Incident Date Proximity">Date: +{breakdown.date}</span>
                  </div>

                  {/* Link to Candidate Item */}
                  <Link
                    to={`/items/${candidate.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors mt-1"
                  >
                    View Potential Match
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
