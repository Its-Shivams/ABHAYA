// ============================================================
// d:\ABHAYA\web\src\pages\AuthPage.tsx
// Sign-In, Registration, Role Selection & 1-Click Demo Accounts
// ============================================================

import React, { useState } from 'react';
import { Shield, User, HeartHandshake, ShieldAlert, ArrowRight, Lock, Mail, Phone, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const { login, demoLogin, register } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [emailOrPhone, setEmailOrPhone] = useState<string>('priya@abhaya.demo');
  const [password, setPassword] = useState<string>('Priya@123');

  // Registration state
  const [selectedRole, setSelectedRole] = useState<UserRole>('primary_user');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    const ok = await login(emailOrPhone, password);
    setIsLoading(false);
    if (!ok) {
      setErrorMessage('Invalid credentials. You can use the quick demo login buttons below.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPhone || !regPassword) {
      setErrorMessage('Please fill in all registration fields.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);
    const ok = await register({
      full_name: regFullName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      role: selectedRole,
      preferred_language: language,
    });
    setIsLoading(false);
    if (!ok) {
      setErrorMessage('Registration failed. Try demo accounts instead.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] via-purple-50/40 to-pink-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Language Switcher Top Right */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleLanguage}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white shadow-sm border border-gray-200 text-[#673AB7] hover:border-[#673AB7] transition-all flex items-center gap-1.5"
        >
          <span>🌐</span>
          <span>{language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Shield Logo */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#673AB7] to-purple-600 items-center justify-center text-white shadow-xl shadow-[#673AB7]/30 mb-4 animate-bounce">
          <Shield className="w-10 h-10 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#292936]">
          {t('appName')}
        </h1>
        <p className="mt-1 text-sm font-semibold text-[#673AB7]">
          {t('appTagline')}
        </p>
        <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
          {t('taglineSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 sm:px-10">
          
          {/* Demo Account Pills (Top Recommendation) */}
          <div className="mb-6 p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-4 h-4 text-[#673AB7]" />
              <span className="text-xs font-bold text-[#673AB7] uppercase tracking-wider">
                {t('tryDemoAccounts')}
              </span>
            </div>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => demoLogin('primary_user')}
                className="w-full py-2.5 px-3 rounded-xl bg-white border border-purple-200 hover:border-[#673AB7] hover:bg-purple-100/50 text-xs font-bold text-[#292936] flex items-center justify-between transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">
                    P
                  </div>
                  <div>
                    <p className="font-bold">Priya Sharma</p>
                    <p className="text-[10px] text-gray-500">priya@abhaya.demo • Primary User</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#673AB7]" />
              </button>

              <button
                type="button"
                onClick={() => demoLogin('trusted_contact')}
                className="w-full py-2.5 px-3 rounded-xl bg-white border border-purple-200 hover:border-[#673AB7] hover:bg-purple-100/50 text-xs font-bold text-[#292936] flex items-center justify-between transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px] font-black">
                    R
                  </div>
                  <div>
                    <p className="font-bold">Rahul Sharma</p>
                    <p className="text-[10px] text-gray-500">rahul@abhaya.demo • Trusted Contact</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#673AB7]" />
              </button>

              <button
                type="button"
                onClick={() => demoLogin('admin')}
                className="w-full py-2 px-3 rounded-xl bg-white/70 hover:bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 flex items-center justify-between transition-all"
              >
                <span>Login as Safety Moderator (Admin)</span>
                <ShieldAlert className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase font-bold tracking-wider">
              <span className="bg-white px-2 text-gray-400">Or use credentials</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          {!isRegistering ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('emailOrPhone')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    required
                    placeholder="priya@abhaya.demo"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7] focus:ring-1 focus:ring-[#673AB7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7] focus:ring-1 focus:ring-[#673AB7]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-sm shadow-md shadow-[#673AB7]/30 transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Signing In...' : t('signIn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-xs font-bold text-[#673AB7] hover:underline"
                >
                  {t('noAccount')}
                </button>
              </div>
            </form>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-4">
              
              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  {t('accountType')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setSelectedRole('primary_user')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedRole === 'primary_user'
                        ? 'border-[#673AB7] bg-purple-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-5 h-5 text-[#673AB7] mb-1" />
                    <p className="font-bold text-xs text-[#292936]">{t('primaryUser')}</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Women navigation & SOS</p>
                  </div>

                  <div
                    onClick={() => setSelectedRole('trusted_contact')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedRole === 'trusted_contact'
                        ? 'border-[#673AB7] bg-purple-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <HeartHandshake className="w-5 h-5 text-pink-600 mb-1" />
                    <p className="font-bold text-xs text-[#292936]">{t('trustedContact')}</p>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Family / Guardian</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  placeholder="priya@example.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  required
                  placeholder="+91 9000000001"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#673AB7] hover:bg-purple-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoading ? 'Creating Account...' : t('register')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs font-bold text-[#673AB7] hover:underline"
                >
                  {t('haveAccount')}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
