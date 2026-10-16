/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ROUTE_STATIONS } from '../data/routeData';
import { X, MapPin, CheckCircle2 } from 'lucide-react';

interface RouteTimetableDrawerProps {
  currentDistanceKm: number;
  currentStationIndex: number;
  onClose: () => void;
}

export const RouteTimetableDrawer: React.FC<RouteTimetableDrawerProps> = ({
  currentDistanceKm,
  currentStationIndex,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-5 flex flex-col justify-between text-slate-100 shadow-2xl animate-slide-left">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">
                সময়সূচি ও রুট ম্যাপ (Timetable & Route)
              </h3>
              <p className="text-xs text-slate-400">
                Dhaka Kamalapur to Chattogram Central (321.0 km)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Station List */}
          <div className="mt-4 space-y-3 overflow-y-auto max-h-[70vh] pr-1">
            {ROUTE_STATIONS.map((st, idx) => {
              const isPast = currentDistanceKm > st.km + 2;
              const isCurrent =
                Math.abs(currentDistanceKm - st.km) <= 3 || currentStationIndex === idx;

              return (
                <div
                  key={st.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-md'
                      : isPast
                      ? 'bg-slate-950/50 border-slate-800 opacity-60'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <MapPin
                          className={`w-4 h-4 shrink-0 ${
                            isCurrent ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        />
                      )}
                      <div>
                        <div className="text-sm font-bold text-white">
                          {st.nameBn}
                        </div>
                        <div className="text-xs text-slate-400">{st.nameEn}</div>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono">
                      <span className="text-emerald-400 font-bold">{st.km.toFixed(0)} KM</span>
                      <div className="text-[10px] text-slate-500">
                        {isPast ? 'Passed' : isCurrent ? 'Active Stop' : 'Upcoming'}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                    {st.tagline} · {st.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400">
          Suborno Express 702 · Class 2900 Meter Gauge Locomotive
        </div>
      </div>
    </div>
  );
};
