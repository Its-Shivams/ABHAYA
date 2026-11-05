// ============================================================
// d:\ABHAYA\web\src\pages\AdminModerationPage.tsx
// Admin & Moderation Panel: Dynamic Safety Reclassification Engine
// ============================================================

import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Clock, Activity, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/api';
import { CommunityReport, SafetyHistoryItem } from '../types';

export const AdminModerationPage: React.FC = () => {
  const { t } = useLanguage();

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [history, setHistory] = useState<SafetyHistoryItem[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'segments' | 'audit'>('reports');
  const [actionNotice, setActionNotice] = useState<string>('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [repRes, histRes, segRes] = await Promise.all([
        apiClient.get('/admin/reports'),
        apiClient.get('/admin/safety-history'),
        apiClient.get('/admin/segments'),
      ]);
      if (repRes.data?.success) setReports(repRes.data.data);
      if (histRes.data?.success) setHistory(histRes.data.data);
      if (segRes.data?.success) setSegments(segRes.data.data);
    } catch {
      // Mock fallbacks
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
          image_urls: [],
          status: 'verified',
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
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          reporterName: 'Priya Sharma',
          segmentName: 'Hastsal Drain Road',
        },
      ]);

      setSegments([
        { id: 'seg-001', name: 'Najafgarh Road (Metro Corridor)', score: 86.5, zone: 'A', city: 'New Delhi' },
        { id: 'seg-002', name: 'Pankha Road (Connecting Corridor)', score: 61.2, zone: 'B', city: 'New Delhi' },
        { id: 'seg-003', name: 'Hastsal Drain Road', score: 31.8, zone: 'C', city: 'New Delhi' },
        { id: 'seg-004', name: 'Outer Ring Road Vikaspuri Corridor', score: 87.0, zone: 'A', city: 'New Delhi' },
      ]);

      setHistory([
        {
          id: 'hist-001',
          segmentId: 'seg-002',
          segmentName: 'Pankha Road',
          oldScore: 68.5,
          newScore: 61.2,
          oldZone: 'B',
          newZone: 'B',
          reason: 'Verified citizen report rep-001: streetlights non-functional',
          changedBy: 'Admin Moderator',
          changedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
      ]);
    }
  };

  const handleVerify = async (reportId: string) => {
    try {
      const res = await apiClient.post(`/admin/reports/${reportId}/verify`, {
        notes: 'Field team verified hazard. Road safety score dynamically downgraded.',
      });
      if (res.data?.success) {
        setActionNotice('Report verified! Road segment safety score dynamically recalculated and logged.');
      }
    } catch {
      setActionNotice('Report verified (Simulated). Segment safety score recalculated and Zone updated.');
    }

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'verified' } : r))
    );

    setTimeout(() => {
      loadAdminData();
      setActionNotice('');
    }, 2000);
  };

  const handleReject = async (reportId: string) => {
    try {
      await apiClient.post(`/admin/reports/${reportId}/reject`, {
        notes: 'Duplicate / unverified claim.',
      });
    } catch {}

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'rejected' } : r))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#673AB7] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#292936]">
              {t('adminTitle')}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#673AB7]">
              Moderator View
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Audit citizen-reported safety hazards. When you verify a report, the safety intelligence algorithm automatically adjusts road parameters and updates Zone classifications.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#673AB7]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-[#673AB7] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Citizen Reports Queue ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('segments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'segments'
              ? 'bg-[#673AB7] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Monitored Road Segments ({segments.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-[#673AB7] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Safety Reclassification Audit Log ({history.length})
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'reports' ? (
        /* Citizen Reports Moderation Queue */
        <div className="space-y-3">
          {reports.map((r) => {
            const isPending = r.status === 'pending';
            return (
              <div
                key={r.id}
                className={`p-5 rounded-3xl border bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isPending ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'
                }`}
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                      {r.category}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        r.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      Segment: {r.segmentName || 'Assigned Segment'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-[#292936]">{r.address}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{r.description}</p>
                  <p className="text-[10px] text-gray-400">
                    Reported by {r.reporterName || 'Verified Citizen'} • {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Moderation Action Buttons */}
                {isPending ? (
                  <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                    <button
                      onClick={() => handleVerify(r.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{t('verifyReportBtn')}</span>
                    </button>

                    <button
                      onClick={() => handleReject(r.id)}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{t('rejectReportBtn')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-gray-400 self-end md:self-auto">
                    Status Locked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : activeTab === 'segments' ? (
        /* Road Segments Table */
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                  Road Segment Name
                </th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                  Safety Score
                </th>
                <th className="px-6 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">
                  Zone Class
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {segments.map((seg) => (
                <tr key={seg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-[#292936]">{seg.name}</td>
                  <td className="px-6 py-4 text-gray-500">{seg.city}</td>
                  <td className="px-6 py-4 font-black text-[#673AB7]">{seg.score}/100</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-white font-black text-xs ${
                        seg.zone === 'A'
                          ? 'bg-emerald-600'
                          : seg.zone === 'B'
                          ? 'bg-amber-500'
                          : 'bg-red-600'
                      }`}
                    >
                      ZONE {seg.zone}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Safety Audit Log */
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="p-4 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#673AB7] flex items-center justify-center font-bold text-xs flex-shrink-0">
                Δ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-[#292936]">{h.segmentName}</span>
                  <span className="text-xs text-gray-400">
                    Score: {h.oldScore} → <span className="font-bold text-[#673AB7]">{h.newScore}</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                    Zone {h.oldZone} → Zone {h.newZone}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{h.reason}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Logged at {new Date(h.changedAt).toLocaleString()} by {h.changedBy}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
