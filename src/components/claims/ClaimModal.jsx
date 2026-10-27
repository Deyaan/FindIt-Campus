import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  FileText,
  Phone,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

/**
 * ClaimModal — lets authenticated students submit a private ownership claim
 * against a "found" item. Claim details are protected by RLS (only claimant
 * and admins can read them).
 *
 * Props:
 *  item        – The found-item record being claimed (must include id, title, user_id)
 *  onClose     – Callback to close/unmount the modal
 *  onClaimed   – Callback fired after a successful submission
 */
export default function ClaimModal({ item, onClose, onClaimed }) {
  const { user } = useAuth();

  const [proofDescription, setProofDescription] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Guard: user must not be able to claim their own reported item
  const isOwnItem = item?.user_id && user?.id && item.user_id === user.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('You must be signed in to submit a claim.');
      return;
    }

    if (isOwnItem) {
      setErrorMsg('You cannot claim an item you reported yourself.');
      return;
    }

    const trimmedProof = proofDescription.trim();
    const trimmedContact = contactDetails.trim();

    if (trimmedProof.length < 20) {
      setErrorMsg('Please provide at least 20 characters of proof description.');
      return;
    }
    if (!trimmedContact) {
      setErrorMsg('Contact details are required so the finder can reach you.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('claims').insert({
        item_id: item.id,
        claimant_id: user.id,
        proof_description: trimmedProof,
        contact_details: trimmedContact,
        status: 'pending',
      });

      if (error) {
        // Unique constraint: duplicate claim by same user
        if (error.code === '23505') {
          setErrorMsg('You have already submitted a claim for this item.');
        } else {
          setErrorMsg(error.message || 'Failed to submit claim. Please try again.');
        }
        return;
      }

      setSuccessMsg('Your claim has been submitted and is pending review by the admin team.');
      if (typeof onClaimed === 'function') {
        onClaimed();
      }
    } catch (err) {
      console.error('[FindIt ClaimModal Error]:', err);
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="claim-modal-title"
    >
      {/* Modal Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="claim-modal-title" className="text-lg font-bold text-slate-900 leading-tight">
                Submit Ownership Claim
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[260px]">
                {item?.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
            aria-label="Close claim modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-800">
            <Lock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your claim details are <strong>private</strong>. Only you and site administrators can
              view this submission. Claims are reviewed within 1-2 business days.
            </p>
          </div>
        </div>

        {/* Success Screen */}
        {successMsg ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Claim Submitted!</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{successMsg}</p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Claim Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5" id="claim-form">
            {/* Own Item Warning */}
            {isOwnItem && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>You cannot claim an item that you reported. Claims may only be submitted by other campus members.</p>
              </div>
            )}

            {/* Proof of Ownership */}
            <div className="space-y-1.5">
              <label
                htmlFor="claim-proof"
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                Proof of Ownership
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="claim-proof"
                name="proof_description"
                rows={4}
                value={proofDescription}
                onChange={(e) => setProofDescription(e.target.value)}
                placeholder="Describe unique identifying features of this item - color, brand, serial number, what was inside it, where you last saw it, etc. The more specific, the better."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 resize-none leading-relaxed transition"
                disabled={isSubmitting || isOwnItem}
                required
                minLength={20}
              />
              <p className="text-xs text-slate-400">
                Minimum 20 characters &middot; {proofDescription.length} typed
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-1.5">
              <label
                htmlFor="claim-contact"
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
              >
                <Phone className="w-4 h-4 text-slate-400" />
                Contact Details
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="claim-contact"
                name="contact_details"
                type="text"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                placeholder="Phone number, student email, or campus room number"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition"
                disabled={isSubmitting || isOwnItem}
                required
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="claim-form"
                disabled={isSubmitting || isOwnItem}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Submit Claim
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
