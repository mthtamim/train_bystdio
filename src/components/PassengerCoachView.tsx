/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TrainState, StationData } from '../types/game';
import { PASSENGER_VOICES_BN } from '../data/routeData';
import { Coffee, Wind, Eye, Sparkles } from 'lucide-react';

interface PassengerCoachViewProps {
  state: TrainState;
  currentStation: StationData;
  onOrderChai: () => void;
  onSwitchView: (view: 'EXTERIOR' | 'CAB_HUD') => void;
}

export const PassengerCoachView: React.FC<PassengerCoachViewProps> = ({
  state,
  currentStation,
  onOrderChai,
  onSwitchView,
}) => {
  const [currentDialogue, setCurrentDialogue] = useState<string>(PASSENGER_VOICES_BN[0]);
  const [chaiOrdered, setChaiOrdered] = useState<boolean>(false);
  const [windowBreeze, setWindowBreeze] = useState<boolean>(true);

  // Periodically cycle authentic Bengali co-passenger remarks
  useEffect(() => {
    const timer = setInterval(() => {
      const idx = Math.floor(Math.random() * PASSENGER_VOICES_BN.length);
      setCurrentDialogue(PASSENGER_VOICES_BN[idx]);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleOrderTea = () => {
    setChaiOrdered(true);
    onOrderChai();
    setTimeout(() => setChaiOrdered(false), 4000);
  };

  const isNight = state.timeOfDayHours < 6 || state.timeOfDayHours > 19;
  const isMeghna = state.distanceKm >= 84 && state.distanceKm <= 92;

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between">
      {/* Compartment Ceiling with Rotating Fan & Luggage Rack */}
      <div className="relative z-10 w-full bg-stone-800/90 border-b border-stone-700/80 px-6 py-2.5 flex items-center justify-between text-stone-200">
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="text-amber-400 font-bold tracking-wide">
            শোভন চেয়ার · COACH 'GA'
          </span>
          <span className="hidden sm:inline text-stone-400">·</span>
          <span className="hidden sm:inline text-stone-300">
            {state.passengersOnboard} Passengers Onboard
          </span>
          <span className="hidden sm:inline text-stone-400">·</span>
          <span className="hidden sm:inline text-emerald-400 font-mono">
            {state.speedKmh.toFixed(0)} km/h
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setWindowBreeze(!windowBreeze)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
              windowBreeze
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-stone-700 text-stone-400'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{windowBreeze ? 'Window Open' : 'Window Closed'}</span>
          </button>

          <button
            onClick={() => onSwitchView('EXTERIOR')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-stone-700 hover:bg-stone-600 text-stone-100 rounded transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Exterior Track</span>
          </button>
        </div>
      </div>

      {/* Main Picture Window Framing the Passing Countryside */}
      <div className="relative flex-1 mx-4 sm:mx-10 my-2 rounded-lg border-8 border-stone-800 bg-sky-950/40 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Animated Window Background Scenery */}
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isNight
              ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-emerald-950'
              : isMeghna
              ? 'bg-gradient-to-b from-sky-400 via-sky-200 to-blue-800'
              : 'bg-gradient-to-b from-sky-400 via-sky-100 to-emerald-800'
          }`}
        >
          {/* Distant river / fields passing by */}
          <div className="absolute bottom-0 w-full h-24 bg-emerald-700/80 backdrop-blur-xs flex items-end">
            {/* Parallax trees & telegraph poles */}
            <div className="w-full flex justify-around opacity-70">
              <div className="w-2 h-14 bg-emerald-900 rounded-t" />
              <div className="w-3 h-18 bg-emerald-950 rounded-t" />
              <div className="w-2 h-12 bg-emerald-900 rounded-t" />
              <div className="w-3 h-20 bg-emerald-950 rounded-t" />
            </div>
          </div>

          {/* Rain streaks on the glass */}
          {(state.weather === 'DRIZZLE' || state.weather === 'MONSOON_RAIN') && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px] opacity-40 animate-pulse" />
          )}

          {/* Bhairab Meghna River notification overlay */}
          {isMeghna && (
            <div className="absolute top-4 left-6 bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-cyan-200 px-3 py-1.5 rounded text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Crossing the Mighty Meghna River (ভৈরব সেতু)</span>
            </div>
          )}
        </div>

        {/* Co-passenger Chat Bubble */}
        <div className="absolute top-4 right-6 max-w-xs bg-stone-900/90 backdrop-blur-md border border-amber-500/30 text-amber-200 px-3.5 py-2 rounded-lg text-xs shadow-lg animate-fade-in">
          <p className="font-serif italic">"{currentDialogue}"</p>
          <span className="block mt-1 text-[10px] text-stone-400 text-right">
            — সহযাত্রী (Co-passenger, Seat 24)
          </span>
        </div>

        {/* Steaming Clay Cup of Tea (Matir Bhar) on Window Sill */}
        <div className="absolute bottom-2 right-12 flex flex-col items-center">
          {/* Steam animation */}
          <div className="w-1.5 h-3 bg-white/40 rounded-full blur-[1px] animate-bounce" />
          <div className="w-6 h-6 bg-amber-700 rounded-b-md border-t-2 border-amber-600 shadow-md flex items-center justify-center">
            <span className="text-[8px] text-amber-200 font-bold">চা</span>
          </div>
          <span className="text-[9px] text-amber-300 font-medium mt-1">মাটির ভাঁড়</span>
        </div>
      </div>

      {/* Interior Coach Lower Deck: Seats, Wooden Table, and Tea Vendor Interaction */}
      <div className="relative z-10 w-full bg-stone-800 border-t-4 border-stone-700 p-3 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-100">
              প্ল্যাটফর্ম ও ট্রেনের স্পেশাল মালাই চা
            </div>
            <div className="text-[11px] text-stone-400">
              Authentic spiced milk tea served in traditional clay pottery
            </div>
          </div>
        </div>

        <button
          onClick={handleOrderTea}
          disabled={chaiOrdered}
          className={`px-4 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-all ${
            chaiOrdered
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold active:scale-95 shadow-md'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>{chaiOrdered ? 'চা পরিবেশন হচ্ছে... ✓' : 'চা অর্ডার করুন (Order Cha)'}</span>
        </button>
      </div>
    </div>
  );
};
