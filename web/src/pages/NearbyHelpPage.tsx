// ============================================================
// d:\ABHAYA\web\src\pages\NearbyHelpPage.tsx
// Smart Public Network & Verified Emergency Facilities
// Clean Modern UI: Inter Typography, 16px Radius, Subtle Borders
// ============================================================

import React, { useState, useEffect } from 'react';
import { PhoneCall, Shield, Phone, Navigation, MapPin, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { NearbyFacility } from '../types';
import { fetchFacilities } from '../services/api';
import { MapComponent } from '../components/MapComponent';

export const NearbyHelpPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [facilities, setFacilities] = useState<NearbyFacility[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFacility, setSelectedFacility] = useState<NearbyFacility | null>(null);

  useEffect(() => {
    loadFacilities();
  }, [selectedType]);

  const loadFacilities = async () => {
    const list = await fetchFacilities(selectedType);
    setFacilities(list);
    if (list.length > 0) {
      setSelectedFacility(list[0]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <PhoneCall className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#252238]">
                {t('nearbyTitle')}
              </h1>
              <p className="text-xs text-[#777487] mt-0.5">
                Verified police stations, emergency hospitals, 24x7 pharmacies and metro safe-havens.
              </p>
            </div>
          </div>
        </div>

        {/* National Hotlines Bar */}
        <div className="flex items-center gap-2">
          <a
            href="tel:112"
            className="px-4 py-2.5 rounded-xl bg-gray-900 text-white font-extrabold text-xs flex items-center gap-2 hover:bg-black transition-colors shadow-sm"
          >
            <Phone className="w-3.5 h-3.5 text-red-400" />
            <span>PCR: 112</span>
          </a>

          <a
            href="tel:1091"
            className="px-4 py-2.5 rounded-xl bg-[#673AB7] text-white font-extrabold text-xs flex items-center gap-2 hover:bg-purple-800 transition-colors shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-pink-300" />
            <span>Women: 1091</span>
          </a>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: t('allFacilities') },
          { key: 'police', label: `👮 ${t('policeStations')}` },
          { key: 'hospital', label: `🏥 ${t('hospitals')}` },
          { key: 'pharmacy', label: `💊 ${t('pharmacies')}` },
          { key: 'metro', label: `🚇 ${t('metroStations')}` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setSelectedType(f.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedType === f.key
                ? 'bg-[#673AB7] text-white shadow-sm'
                : 'bg-white border border-gray-200/80 text-[#777487] hover:border-[#673AB7]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid: Map & Facility Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Facilities List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {facilities.map((fac) => {
            const isSelected = selectedFacility?.id === fac.id;
            return (
              <div
                key={fac.id}
                onClick={() => setSelectedFacility(fac)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#673AB7] bg-white shadow-md ring-2 ring-purple-100'
                    : 'border-gray-200/80 bg-white hover:bg-gray-50/80 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">
                      {fac.facility_type === 'police' ? '👮' : fac.facility_type === 'hospital' ? '🏥' : fac.facility_type === 'metro' ? '🚇' : '💊'}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-[#252238]">{fac.name}</h3>
                      <p className="text-[11px] text-[#777487] mt-0.5">{fac.address}</p>
                    </div>
                  </div>

                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-gray-100 text-[#252238] flex-shrink-0">
                    {fac.distance_km} km
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-[#777487]">
                    {fac.is_verified && (
                      <span className="text-[#16A34A] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-[#16A34A]" />
                        Verified
                      </span>
                    )}
                    {fac.is_24_hours && (
                      <span className="text-blue-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        24x7 Open
                      </span>
                    )}
                  </div>

                  {fac.phone && (
                    <a
                      href={`tel:${fac.phone.replace(/[^0-9+]/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#673AB7] font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{t('callNow')}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Map (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/80">
            <MapComponent
              center={selectedFacility ? [selectedFacility.lat, selectedFacility.lng] : [28.623, 77.065]}
              zoom={14}
              height="460px"
              markers={[
                {
                  lat: 28.6186,
                  lng: 77.0545,
                  title: `Your Location (${user?.profile?.display_name || user?.profile?.full_name || 'You'})`,
                  type: 'user',
                },
                ...facilities.map((f) => ({
                  lat: f.lat,
                  lng: f.lng,
                  title: f.name,
                  type: f.facility_type as any,
                  description: `${f.address} • ${f.phone || ''}`,
                })),
              ]}
            />
          </div>
        </div>

      </div>

    </div>
  );
};
