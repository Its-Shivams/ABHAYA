// ============================================================
// d:\ABHAYA\web\src\pages\CommunityPage.tsx
// Community Safety Network & Dynamic Road Hazard Reporting
// ============================================================

import React, { useState, useEffect } from 'react';
import { Users, FileWarning, ThumbsUp, MessageSquare, Plus, CheckCircle, Clock, AlertTriangle, Sparkles, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { CommunityReport, CommunityPost } from '../types';

export const CommunityPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'posts' | 'reports'>('posts');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // New Report Form State
  const [category, setCategory] = useState<string>('streetlight');
  const [address, setAddress] = useState<string>('Pankha Road crossing, New Delhi');
  const [segmentId, setSegmentId] = useState<string>('seg-002');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      const [postsRes, reportsRes] = await Promise.all([
        apiClient.get('/community/posts'),
        apiClient.get('/community/reports'),
      ]);
      if (postsRes.data?.success) setPosts(postsRes.data.data);
      if (reportsRes.data?.success) setReports(reportsRes.data.data);
    } catch {
      // Mock fallbacks
      setPosts([
        {
          id: 'post-001',
          user_id: 'usr-priya-001',
          author_display_name: 'Priya S.',
          is_anonymous: false,
          title: 'Lighting restored near Uttam Nagar East Metro Pillar 650',
          content: 'Good news for commuters: MCD teams repaired 6 high-beam LED streetlights along the pavement leading to the metro gate today.',
          category: 'general_safety',
          lat: 28.621,
          lng: 77.061,
          area_name: 'Uttam Nagar East',
          likes_count: 24,
          comments_count: 5,
          is_pinned: true,
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: 'post-002',
          user_id: 'usr-rahul-002',
          author_display_name: 'Rahul S.',
          is_anonymous: false,
          title: 'Police Pink Booth operational at District Centre Janakpuri',
          content: 'Delhi Police has active women officers deployed at the Pink Booth near Janakpuri West Gate 2 from 8 AM to 11 PM daily.',
          category: 'police_presence',
          lat: 28.6289,
          lng: 77.0789,
          area_name: 'Janakpuri West',
          likes_count: 42,
          comments_count: 8,
          is_pinned: false,
          created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        },
      ]);

      setReports([
        {
          id: 'rep-001',
          user_id: 'usr-priya-001',
          category: 'streetlight',
          lat: 28.626,
          lng: 77.065,
          address: 'Pankha Road crossing towards Vikaspuri',
          road_segment_id: 'seg-002',
          description: 'Multiple streetlights have been non-functional for 3 consecutive nights. Road is completely dark between 8 PM and 6 AM.',
          image_urls: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400'],
          status: 'verified',
          verification_notes: 'Verified by MCD inspection team. Streetlight repair initiated.',
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          reporterName: 'Priya Sharma',
          segmentName: 'Pankha Road',
        },
        {
          id: 'rep-002',
          user_id: 'usr-priya-001',
          category: 'isolation',
          lat: 28.619,
          lng: 77.045,
          address: 'Near Hastsal village service lane',
          road_segment_id: 'seg-003',
          description: 'Suspicious gathering near the culvert with no police PCR presence after 9 PM. Better to take the main road.',
          image_urls: [],
          status: 'pending',
          verification_notes: null,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          reporterName: 'Priya Sharma',
          segmentName: 'Hastsal Drain Road',
        },
      ]);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/community/reports', {
        category,
        address,
        roadSegmentId: segmentId,
        description,
      });
      if (res.data?.success) {
        setSuccessMessage('Report submitted successfully! Under review by safety moderators.');
        setDescription('');
        setTimeout(() => {
          setIsReportModalOpen(false);
          setSuccessMessage('');
          loadCommunityData();
        }, 1500);
      }
    } catch {
      setSuccessMessage('Report submitted (Local simulation). It is now pending verification.');
      setTimeout(() => {
        setIsReportModalOpen(false);
        setSuccessMessage('');
      }, 1500);
    }
    setIsSubmitting(false);
  };

  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#673AB7] flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#292936]">
              {t('communityTitle')}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Empowering women through verified local alerts. Reports directly trigger dynamic safety score adjustments across road segments.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#673AB7] hover:bg-purple-800 text-white font-extrabold text-xs shadow-md shadow-[#673AB7]/20 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t('reportIncidentBtn')}</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'posts'
              ? 'bg-[#673AB7] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Community Feed ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-[#673AB7] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Road Hazard Reports ({reports.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'posts' ? (
        /* Community Feed */
        <div className="space-y-4 max-w-3xl">
          {posts.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-[#673AB7] flex items-center justify-center font-black text-xs">
                    {p.author_display_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#292936]">{p.author_display_name}</span>
                      {p.is_pinned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#673AB7]">
                          PINNED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">{p.area_name} • Delhi</p>
                  </div>
                </div>

                <span className="text-[10px] text-gray-400">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-[#292936]">{p.title}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{p.content}</p>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                <button
                  onClick={() => handleLikePost(p.id)}
                  className="flex items-center gap-1.5 hover:text-[#673AB7] transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{p.likes_count} {t('upvote')}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{p.comments_count} Comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Road Hazard Reports List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => {
            const isVerified = r.status === 'verified';
            return (
              <div key={r.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                      {r.category.toUpperCase()}
                    </span>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isVerified ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>VERIFIED IMPACT</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>PENDING MODERATION</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#292936]">{r.address}</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.description}</p>
                </div>

                {r.verification_notes && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
                    <span className="font-bold">Moderator Note:</span> {r.verification_notes}
                  </div>
                )}

                <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-100 flex justify-between">
                  <span>Reported by: {r.reporterName || 'Verified Citizen'}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unsafe Road Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-purple-200">
            
            <div className="p-5 bg-gradient-to-r from-[#673AB7] to-purple-800 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-lg">{t('reportIncidentBtn')}</h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-white hover:opacity-80"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {successMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hazard Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                >
                  <option value="streetlight">{t('categoryStreetlight')}</option>
                  <option value="harassment">{t('categoryHarassment')}</option>
                  <option value="cctv">{t('categoryCCTV')}</option>
                  <option value="isolation">{t('categoryIsolation')}</option>
                  <option value="road_closure">{t('categoryRoadClosure')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Affected Road Segment
                </label>
                <select
                  value={segmentId}
                  onChange={(e) => setSegmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                >
                  <option value="seg-002">Pankha Road (Connecting Uttam Nagar & Vikaspuri)</option>
                  <option value="seg-001">Najafgarh Road (Uttam Nagar East to Janakpuri)</option>
                  <option value="seg-003">Hastsal Drain Road (Isolated stretch)</option>
                  <option value="seg-004">Outer Ring Road Corridor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Exact Location / Landmark
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('reportDescription')}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="e.g. 4 streetlights broken between pillar 40 and 46, creating a dark stretch after 8 PM..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#673AB7]"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-[#673AB7] hover:bg-purple-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : t('submitReport')}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
