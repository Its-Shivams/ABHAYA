// ============================================================
// d:\ABHAYA\web\src\components\ConnectContactModal.tsx
// Connect Trusted Contacts / Guardians via ABHAYA ID, Email or Phone
// ============================================================

import React, { useState } from 'react';
import { UserPlus, Copy, Check, X, ShieldCheck, HeartHandshake, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/api';

interface ConnectContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConnectContactModal: React.FC<ConnectContactModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [targetId, setTargetId] = useState('');
  const [nickname, setNickname] = useState('Family / Friend');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (user?.abhayaId) {
      navigator.clipboard.writeText(user.abhayaId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!targetId.trim()) {
      setErrorMsg('Please enter an ABHAYA ID, email or phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/contacts/request', {
        targetAbhayaId: targetId.trim(),
        nickname: nickname.trim() || 'Trusted Contact',
      });

      if (res.data?.success) {
        setSuccessMsg('Successfully connected! Live tracking & SOS alerts are now linked.');
        setTargetId('');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.data?.error || 'Could not connect contact.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'User not found. Check the ABHAYA ID, email or phone.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#673AB7] to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base">Connect Trusted Guardian</h2>
              <p className="text-[11px] text-purple-200">Share SOS alerts & live journey safety</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Your ABHAYA ID Box */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Your ABHAYA Safety ID</p>
              <p className="text-sm font-black text-[#292936] font-mono tracking-wide">{user?.abhayaId || 'ABHAYA-ID'}</p>
            </div>
            <button
              onClick={handleCopyId}
              className="px-3 py-1.5 rounded-xl bg-white text-[#673AB7] text-xs font-bold shadow-sm hover:bg-purple-100/50 flex items-center gap-1.5 transition-all border border-purple-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy ID'}</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Target User ABHAYA ID / Email / Phone
              </label>
              <input
                type="text"
                placeholder="e.g. ABHAYA-USER-1002 or rahul@abhaya.demo"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#673AB7] focus:ring-2 focus:ring-purple-200 transition-all"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Enter the ABHAYA ID, email or registered phone number of your trusted contact.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Relationship / Nickname
              </label>
              <select
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-[#673AB7] focus:ring-2 focus:ring-purple-200 transition-all bg-white"
              >
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Partner / Spouse">Partner / Spouse</option>
                <option value="Best Friend">Best Friend</option>
                <option value="Colleague">Colleague</option>
                <option value="Guardian">Guardian</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#673AB7] hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>{isSubmitting ? 'Connecting...' : 'Authorize & Connect Contact'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
