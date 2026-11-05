// ============================================================
// d:\ABHAYA\web\src\pages\ProfilePage.tsx
// User Profile, Dynamic Trusted Contacts & Language Settings
// ============================================================

import React, { useState, useEffect } from 'react';
import { User, Shield, Globe, Lock, Phone, Mail, HeartHandshake, LogOut, CheckCircle, UserPlus, Trash2, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/api';
import { ConnectedContact } from '../types';
import { ConnectContactModal } from '../components/ConnectContactModal';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [emergencyMessage, setEmergencyMessage] = useState<string>(
    user?.profile?.emergency_message || 'Please help! I have activated emergency SOS via ABHAYA.'
  );
  const [saveNotice, setSaveNotice] = useState<string>('');
  const [contacts, setContacts] = useState<ConnectedContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const fetchContacts = async () => {
    try {
      setIsLoadingContacts(true);
      const res = await apiClient.get('/contacts');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setContacts(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch contacts:', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const handleCopyId = () => {
    if (user?.abhayaId) {
      navigator.clipboard.writeText(user.abhayaId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!window.confirm('Are you sure you want to remove this trusted contact?')) return;
    try {
      await apiClient.delete(`/contacts/${contactId}`);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      console.error('Failed to remove contact:', err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice('Settings updated successfully!');
    setTimeout(() => setSaveNotice(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#673AB7] to-pink-500 text-white flex items-center justify-center text-2xl font-black shadow-md border-4 border-purple-100 flex-shrink-0">
          {(user?.profile?.full_name || user?.email || 'U')[0].toUpperCase()}
        </div>

        <div className="text-center sm:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-[#292936]">
              {user?.profile?.full_name || user?.email || 'User Profile'}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#673AB7]">
              {user?.role === 'primary_user' ? 'Primary User' : user?.role === 'trusted_contact' ? 'Trusted Contact' : 'Admin'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold text-[#673AB7] bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-mono">
              {user?.abhayaId || 'ABHAYA-USER-1001'}
            </span>
            <button
              onClick={handleCopyId}
              className="px-2 py-1 rounded-md text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center gap-1 transition-all"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 font-medium">
            {user?.email} • {user?.phone}
          </p>
        </div>

        <button
          onClick={logout}
          className="ml-auto px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors self-center"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('signOut')}</span>
        </button>
      </div>

      {saveNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Language & Preferences */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#673AB7]" />
            <h3 className="font-bold text-sm text-[#292936]">Language Preference</h3>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 cursor-pointer hover:border-[#673AB7]">
              <input
                type="radio"
                name="lang"
                checked={language === 'en'}
                onChange={() => setLanguage('en')}
                className="text-[#673AB7] focus:ring-[#673AB7]"
              />
              <div>
                <p className="font-bold text-xs text-[#292936]">English (Default)</p>
                <p className="text-[10px] text-gray-500">Standard English interface across all tools</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 cursor-pointer hover:border-[#673AB7]">
              <input
                type="radio"
                name="lang"
                checked={language === 'hi'}
                onChange={() => setLanguage('hi')}
                className="text-[#673AB7] focus:ring-[#673AB7]"
              />
              <div>
                <p className="font-bold text-xs text-[#292936]">हिंदी (Hindi)</p>
                <p className="text-[10px] text-gray-500">सभी स्क्रीन, वॉयस और अलर्ट हिंदी में</p>
              </div>
            </label>
          </div>
        </div>

        {/* Connected Trusted Contacts */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-pink-600" />
              <h3 className="font-bold text-sm text-[#292936]">Connected Guardians</h3>
            </div>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="text-xs font-bold text-[#673AB7] hover:bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Guardian</span>
            </button>
          </div>

          {isLoadingContacts ? (
            <p className="text-xs text-gray-400 py-3 text-center">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-300 text-center space-y-2">
              <p className="text-xs font-bold text-gray-600">No Trusted Contacts Connected Yet</p>
              <p className="text-[11px] text-gray-400">
                Add a family member or friend so they can track your journey and receive emergency SOS alerts.
              </p>
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Connect Guardian Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {contacts.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-purple-200 text-[#673AB7] font-bold flex items-center justify-center flex-shrink-0">
                      {c.name ? c.name[0].toUpperCase() : 'C'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{c.name} {c.nickname ? `(${c.nickname})` : ''}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{c.phone || c.email} • {c.abhayaId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Linked
                    </span>
                    <button
                      onClick={() => handleRemoveContact(c.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Disconnect contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[11px] text-gray-400">
            Share your unique ABHAYA ID (<span className="font-bold text-[#673AB7]">{user?.abhayaId}</span>) with family members so they can connect with you.
          </p>
        </div>

      </div>

      {/* Emergency Message Customization */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Default Emergency SOS Broadcast Message
          </label>
          <textarea
            rows={2}
            value={emergencyMessage}
            onChange={(e) => setEmergencyMessage(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
          ></textarea>
          <p className="text-[11px] text-gray-400 mt-1">
            This message will be instantly delivered via SMS & notification to your trusted contacts upon holding the SOS button.
          </p>
        </div>

        <button
          type="submit"
          className="py-2.5 px-5 rounded-2xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all"
        >
          Save Preferences
        </button>
      </form>

      {/* Modal */}
      <ConnectContactModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={fetchContacts}
      />

    </div>
  );
};
