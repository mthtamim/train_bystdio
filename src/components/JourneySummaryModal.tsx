/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrainState } from '../types/game';
import { Trophy, RotateCcw, MapPin, Users, Gauge, CloudRain } from 'lucide-react';

interface JourneySummaryModalProps {
  state: TrainState;
  onRestartJourney: () => void;
}

export const JourneySummaryModal: React.FC<JourneySummaryModalProps> = ({
  state,
  onRestartJourney,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/60 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100 text-center animate-fade-in">
        {/* Victory Trophy Badge */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white">
          যাত্রা সফলভাবে সম্পন্ন হয়েছে!
        </h2>
        <p className="text-sm text-emerald-400 font-semibold mt-1">
          Welcome to Chattogram Railway Station (চট্টগ্রাম রেলওয়ে স্টেশন)
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          You navigated the iconic 321 km route across the Meghna River bridge, lush rural
          Brahmanbaria, Feni junctions, and delivered your passengers safely to the coastal port!
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-6 text-left">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Distance</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mt-1">
              321.0 KM
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Passengers Transported</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mt-1">
              {state.passengersBoardedTotal}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Locomotive Class</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mt-1">
              BR Class 2900
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>Final Weather</span>
            </div>
            <div className="text-lg font-mono font-bold text-white mt-1 capitalize">
              {state.weather.toLowerCase()}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestartJourney}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>পুনরায় শুরু করুন (Start New Journey from Dhaka)</span>
        </button>
      </div>
    </div>
  );
};
