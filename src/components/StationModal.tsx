/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StationData, TrainState } from '../types/game';
import { Volume2, Users, Clock, MapPin, Play } from 'lucide-react';

interface StationModalProps {
  station: StationData;
  state: TrainState;
  onDepartStation: () => void;
  onPlayAnnouncement: () => void;
}

export const StationModal: React.FC<StationModalProps> = ({
  station,
  state,
  onDepartStation,
  onPlayAnnouncement,
}) => {
  const isBoarding = state.stationState === 'BOARDING';
  const isReady = state.stationState === 'READY_DEPART';

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-xl p-4 sm:p-5 shadow-2xl text-slate-100 animate-fade-in">
      {/* Station Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Platform 1 · Km {station.km.toFixed(1)}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
            {station.nameBn}
          </h2>
          <div className="text-xs text-slate-400 font-medium">
            {station.nameEn} · {station.tagline}
          </div>
        </div>

        <button
          onClick={onPlayAnnouncement}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-medium transition-colors shrink-0"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>ঘোষণা শুনুন (Announcement)</span>
        </button>
      </div>

      {/* Passenger Exchange Progress Bar */}
      <div className="my-3.5 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isBoarding
                ? 'যাত্রী ওঠানামা চলছে (Boarding / Alighting)...'
                : 'বোর্ডিং সম্পন্ন হয়েছে (Boarding Complete)'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.ceil(state.dwellTimerSec)}s</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${Math.min(
                100,
                ((state.maxDwellSec - state.dwellTimerSec) / state.maxDwellSec) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Station Landmark Facts */}
      <div className="text-xs text-slate-300 space-y-1 mb-4 bg-slate-800/40 p-2.5 rounded border border-slate-700/50">
        <p className="line-clamp-2">{station.description}</p>
        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-emerald-300">
          {station.iconicFeatures.map((feat, idx) => (
            <span key={idx}>✓ {feat}</span>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">
          Onboard: <strong className="text-white">{state.passengersOnboard}</strong> passengers
        </span>

        <button
          onClick={onDepartStation}
          disabled={isBoarding && state.dwellTimerSec > 0}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
            isReady || state.dwellTimerSec <= 0
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>
            {isReady || state.dwellTimerSec <= 0
              ? 'ট্রেন ছাড়ুন (Depart Platform)'
              : 'অপেক্ষা করুন (Please Wait)'}
          </span>
        </button>
      </div>
    </div>
  );
};
