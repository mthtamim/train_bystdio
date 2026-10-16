/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrainState } from '../types/game';
import {
  Volume2,
  Lightbulb,
  Gauge,
  OctagonAlert,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface DriverControlsProps {
  state: TrainState;
  onSetThrottle: (notch: number) => void;
  onSetBrake: (percent: number) => void;
  onTriggerEmergencyBrake: () => void;
  onToggleHeadlights: () => void;
  onToggleWipers: () => void;
  onHornDown: () => void;
  onHornUp: () => void;
  onToggleReverser: () => void;
}

export const DriverControls: React.FC<DriverControlsProps> = ({
  state,
  onSetThrottle,
  onSetBrake,
  onTriggerEmergencyBrake,
  onToggleHeadlights,
  onToggleWipers,
  onHornDown,
  onHornUp,
  onToggleReverser,
}) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl text-slate-100 select-none">
      {/* Top Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">CLASS 2900 LOCOMOTIVE CAB</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono tabular-nums text-slate-300">
            ODOMETER: {state.distanceKm.toFixed(1)} / 321.0 KM
          </span>
        </div>

        {/* Signal Aspect Display */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">TRACK SIGNAL:</span>
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                state.signal === 'RED'
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                  : 'bg-red-950'
              }`}
            />
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                state.signal === 'YELLOW'
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                  : 'bg-amber-950'
              }`}
            />
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                state.signal === 'GREEN'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'bg-emerald-950'
              }`}
            />
            <span className="font-mono font-bold text-[11px] ml-1 text-slate-300">
              {state.signal}
            </span>
          </div>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Speedometer Dial & Digital readout */}
        <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
            SPEEDOMETER (গতিবেগ)
          </span>
          <div className="my-2 flex items-baseline gap-1">
            <span className="text-4xl font-mono font-black tabular-nums text-emerald-400">
              {state.speedKmh.toFixed(0)}
            </span>
            <span className="text-xs font-mono text-slate-400">KM/H</span>
          </div>
          {/* Visual Speed Bar Gauge */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                state.speedKmh > 85 ? 'bg-red-500' : state.speedKmh > 65 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (state.speedKmh / 100) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between w-full text-[10px] text-slate-500 mt-1 font-mono">
            <span>0</span>
            <span>50</span>
            <span>100 MAX</span>
          </div>
        </div>

        {/* Throttle Notches (0 to 8) */}
        <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400">THROTTLE LEVER (এক্সিলারেটর)</span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {state.throttleNotch === 0 ? 'IDLE' : `NOTCH ${state.throttleNotch}`}
            </span>
          </div>

          {/* Notch Step Buttons */}
          <div className="flex items-center gap-1.5 mb-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((notch) => (
              <button
                key={notch}
                onClick={() => onSetThrottle(notch)}
                className={`flex-1 py-1.5 text-[11px] font-mono font-bold rounded transition-colors ${
                  state.throttleNotch === notch
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {notch}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSetThrottle(Math.max(0, state.throttleNotch - 1))}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Decel (S)</span>
            </button>
            <button
              onClick={() => onSetThrottle(Math.min(8, state.throttleNotch + 1))}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Accel (W)</span>
            </button>
          </div>
        </div>

        {/* Train Air Brake Control */}
        <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400">AIR BRAKE (ট্রেন ব্রেক)</span>
            <span
              className={`text-xs font-mono font-bold ${
                state.brakePercent > 50 ? 'text-red-400' : 'text-slate-300'
              }`}
            >
              {state.brakePercent}% {state.brakePercent === 0 ? 'RELEASE' : 'APPLIED'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <button
              onClick={() => onSetBrake(0)}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                state.brakePercent === 0
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Release
            </button>
            <button
              onClick={() => onSetBrake(45)}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                state.brakePercent === 45
                  ? 'bg-amber-600 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Service
            </button>
            <button
              onClick={() => onSetBrake(80)}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                state.brakePercent === 80
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Full
            </button>
          </div>

          <button
            onClick={onTriggerEmergencyBrake}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs bg-red-700 hover:bg-red-600 active:scale-98 text-white font-bold rounded transition-colors shadow-sm"
          >
            <OctagonAlert className="w-4 h-4 text-white" />
            <span>EMERGENCY BRAKE (জরুরি ব্রেক)</span>
          </button>
        </div>

        {/* Auxiliary Controls (Horn, Headlights, Wipers, Reverser) */}
        <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 mb-2">
            AUXILIARY SWITCHES
          </span>

          {/* Big Brass Horn Button */}
          <button
            onMouseDown={onHornDown}
            onMouseUp={onHornUp}
            onTouchStart={(e) => {
              e.preventDefault();
              onHornDown();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onHornUp();
            }}
            className="w-full py-2.5 mb-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 active:scale-95 text-slate-950 font-black rounded-lg flex items-center justify-center gap-2 shadow-lg transition-transform"
          >
            <Volume2 className="w-4 h-4" />
            <span>HORN (হর্ন বাজান - SPACE)</span>
          </button>

          {/* Headlights & Wipers */}
          <div className="flex gap-2">
            <button
              onClick={onToggleHeadlights}
              className={`flex-1 py-1.5 text-xs rounded flex items-center justify-center gap-1 transition-colors ${
                state.headlights
                  ? 'bg-yellow-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Light (L)</span>
            </button>

            <button
              onClick={onToggleWipers}
              className={`flex-1 py-1.5 text-xs rounded flex items-center justify-center gap-1 transition-colors ${
                state.wipers
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Wipers (R)</span>
            </button>

            <button
              onClick={onToggleReverser}
              className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono"
              title="Toggle Forward/Neutral"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
