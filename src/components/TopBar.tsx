/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ViewMode, WeatherType } from '../types/game';
import { Volume2, VolumeX, Eye, Armchair, Calendar, Cloud, Sun, CloudRain } from 'lucide-react';

interface TopBarProps {
  currentView: ViewMode;
  onSetView: (v: ViewMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  weather: WeatherType;
  onChangeWeather: (w: WeatherType) => void;
  onToggleSchedule: () => void;
  timeOfDayHours: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onSetView,
  isMuted,
  onToggleMute,
  weather,
  onChangeWeather,
  onToggleSchedule,
  timeOfDayHours,
}) => {
  const hours = Math.floor(timeOfDayHours);
  const minutes = Math.floor((timeOfDayHours % 1) * 60);
  const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;

  const nextWeather: Record<WeatherType, WeatherType> = {
    CLEAR: 'CLOUDY',
    CLOUDY: 'DRIZZLE',
    DRIZZLE: 'MONSOON_RAIN',
    MONSOON_RAIN: 'CLEAR',
  };

  return (
    <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 text-slate-100 shrink-0">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-base sm:text-lg font-black tracking-tight text-white whitespace-nowrap">
          সুবর্ণ এক্সপ্রেস · Suborno Express
        </span>
        <span className="hidden lg:inline text-xs font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
          TIME: {timeFormatted}
        </span>
      </div>

      {/* Zone 2: Navigation Links / View Controls */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
        <button
          onClick={() => onSetView('EXTERIOR')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'EXTERIOR'
              ? 'text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5'
              : 'hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Exterior Track</span>
        </button>

        <button
          onClick={() => onSetView('COACH_INTERIOR')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            currentView === 'COACH_INTERIOR'
              ? 'text-emerald-400 font-bold border-b-2 border-emerald-400 pb-0.5'
              : 'hover:text-white'
          }`}
        >
          <Armchair className="w-3.5 h-3.5" />
          <span>Passenger Coach</span>
        </button>

        <button
          onClick={onToggleSchedule}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Route Timetable</span>
        </button>

        <button
          onClick={() => onChangeWeather(nextWeather[weather])}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 text-slate-300"
          title="Click to cycle weather"
        >
          {weather === 'CLEAR' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : weather === 'MONSOON_RAIN' ? (
            <CloudRain className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Cloud className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="capitalize">{weather.toLowerCase()}</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile quick view toggle */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() =>
              onSetView(currentView === 'EXTERIOR' ? 'COACH_INTERIOR' : 'EXTERIOR')
            }
            className="px-2.5 py-1 text-xs bg-slate-800 text-slate-200 rounded font-medium"
          >
            {currentView === 'EXTERIOR' ? 'Coach' : 'Track'}
          </button>
        </div>

        <button
          onClick={onToggleMute}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          title={isMuted ? 'Unmute Web Audio' : 'Mute Audio'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
              <span>Unmute</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio On</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
