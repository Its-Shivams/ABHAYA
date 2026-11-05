// ============================================================
// d:\ABHAYA\web\src\pages\ProfilePage.tsx
// User Profile, ABHAYA ID & Privacy Settings
// ============================================================

import React, { useState } from 'react';
import { User, Shield, Globe, Lock, Phone, Mail, HeartHandshake, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [emergencyMessage, setEmergencyMessage] = useState<string>(
    user?.profile?.emergency_message || 'Please help! I have activated emergency SOS via ABHAYA.'
  );
  const [saveNotice, setSaveNotice] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice('Settings updated successfully!');
    setTimeout(() => setSaveNotice(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-5">
        <img
          src={user?.profile?.profile_picture_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover border-4 border-purple-100 shadow-md"
        />

        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-black text-[#292936]">
              {user?.profile?.full_name || 'User Profile'}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#673AB7]">
              {user?.role === 'primary_user' ? 'Primary User' : user?.role === 'trusted_contact' ? 'Trusted Contact' : 'Admin'}
            </span>
          </div>

          <p className="text-xs font-bold text-[#673AB7] bg-purple-50 inline-block px-2.5 py-1 rounded-lg border border-purple-200">
            {user?.abhayaId || 'ABHAYA-USER-1001'}
          </p>
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
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              1 Active
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80"
                alt="Rahul"
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-gray-900">Rahul Sharma (Brother)</p>
                <p className="text-[10px] text-gray-500">rahul@abhaya.demo • ABHAYA-USER-1002</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600">Connected</span>
          </div>

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

    </div>
  );
};
