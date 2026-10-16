/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TrainState,
  ViewMode,
  WeatherType,
  PassengerSprite,
} from './types/game';
import { ROUTE_STATIONS } from './data/routeData';
import { PixelArtRenderer } from './canvas/pixelArtRenderer';
import { trainAudio } from './audio/trainAudio';
import { TopBar } from './components/TopBar';
import { DriverControls } from './components/DriverControls';
import { PassengerCoachView } from './components/PassengerCoachView';
import { StationModal } from './components/StationModal';
import { JourneySummaryModal } from './components/JourneySummaryModal';
import { RouteTimetableDrawer } from './components/RouteTimetableDrawer';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PixelArtRenderer | null>(null);

  // Core Simulation State
  const [trainState, setTrainState] = useState<TrainState>({
    speedKmh: 0,
    targetSpeedKmh: 0,
    throttleNotch: 0,
    brakePercent: 100, // Starts parked at Dhaka Kamalapur with brakes applied
    emergencyBrake: false,
    reverser: 'FORWARD',
    headlights: true,
    wipers: false,
    distanceKm: 0.0,
    currentStationIndex: 0,
    stationState: 'AT_PLATFORM',
    dwellTimerSec: 15,
    maxDwellSec: 15,
    passengersOnboard: 180,
    passengersBoardedTotal: 180,
    passengersAlightedTotal: 0,
    timeOfDayHours: 6.75, // 6:45 AM Golden Morning Departure
    weather: 'CLEAR',
    lightningTimer: 0,
    isLightningActive: false,
    signal: 'RED',
    signalDistanceMeters: 0,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('EXTERIOR');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [showJourneyComplete, setShowJourneyComplete] = useState<boolean>(false);

  // Animated passenger sprites on platform
  const [passengers, setPassengers] = useState<PassengerSprite[]>([]);

  // Reference for stable loop access
  const stateRef = useRef<TrainState>(trainState);
  stateRef.current = trainState;

  // Initialize Canvas Renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    rendererRef.current = new PixelArtRenderer(canvas);

    const handleResize = () => {
      if (!canvas || !rendererRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rendererRef.current.resize(rect.width * dpr, rect.height * dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate passenger sprites when arriving at a station
  const spawnStationPassengers = useCallback((isFirstStation = false) => {
    const sprites: PassengerSprite[] = [];
    const types: PassengerSprite['type'][] = [
      'commuter',
      'coolie',
      'family',
      'student',
      'chai_seller',
    ];
    const colors = ['#ffffff', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    for (let i = 0; i < 18; i++) {
      const isBoarding = Math.random() > 0.4 || isFirstStation;
      const startX = isBoarding ? 50 + Math.random() * 200 : 400 + Math.random() * 150;
      const targetX = isBoarding ? 350 + (i % 3) * 110 : 80 + Math.random() * 100;

      sprites.push({
        id: i,
        x: startX,
        targetX,
        y: 0,
        dir: targetX > startX ? 1 : -1,
        type: types[i % types.length],
        color: colors[i % colors.length],
        action: isBoarding ? 'boarding' : 'alighting',
        coachTargetIndex: i % 3,
        animFrame: Math.random() * 10,
      });
    }
    setPassengers(sprites);
  }, []);

  // Spawn initial passengers at Dhaka
  useEffect(() => {
    spawnStationPassengers(true);
  }, [spawnStationPassengers]);

  // Main 60FPS Physics & Rendering Loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dtSec = Math.min(0.1, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      setTrainState((prev) => {
        const next = { ...prev };
        const currentStation = ROUTE_STATIONS[next.currentStationIndex];
        const nextStation = ROUTE_STATIONS[Math.min(ROUTE_STATIONS.length - 1, next.currentStationIndex + 1)];

        // 1. Time Progression (1 real minute = ~20 in-game minutes)
        next.timeOfDayHours = (next.timeOfDayHours + dtSec * 0.05) % 24;

        // 2. Weather Shifts based on landmarks
        if (next.distanceKm >= 80 && next.distanceKm <= 100) {
          // Monsoon clouds & rain at Meghna River
          if (next.weather === 'CLEAR') next.weather = 'MONSOON_RAIN';
        } else if (next.distanceKm >= 120 && next.distanceKm <= 140) {
          if (next.weather === 'MONSOON_RAIN') next.weather = 'DRIZZLE';
        }

        // Lightning in Monsoon
        if (next.weather === 'MONSOON_RAIN') {
          next.lightningTimer += dtSec;
          if (next.lightningTimer > 7 + Math.random() * 8) {
            next.isLightningActive = true;
            next.lightningTimer = 0;
            trainAudio.triggerThunder();
            setTimeout(() => {
              setTrainState((s) => ({ ...s, isLightningActive: false }));
            }, 120);
          }
        } else {
          next.isLightningActive = false;
        }

        // 3. Train Physics Simulation
        // Max theoretical speed per throttle notch (0 to 8)
        const notchMaxSpeed = [0, 18, 32, 48, 62, 75, 88, 96, 100];
        const maxNotchSpeed = notchMaxSpeed[next.throttleNotch];

        let targetSpeed = maxNotchSpeed;
        if (next.brakePercent > 0) {
          // Braking decelerates target speed towards 0
          targetSpeed = Math.max(0, targetSpeed * (1 - next.brakePercent / 100));
        }

        if (next.speedKmh < targetSpeed) {
          // Accelerate: rate depends on notch
          const accelRate = (0.5 + next.throttleNotch * 0.4) * (1 - next.brakePercent / 100);
          next.speedKmh = Math.min(targetSpeed, next.speedKmh + accelRate * dtSec * 14);
        } else if (next.speedKmh > targetSpeed) {
          // Decelerate / Braking
          const decelRate = 1.2 + (next.brakePercent / 100) * 8.5;
          next.speedKmh = Math.max(0, next.speedKmh - decelRate * dtSec * 14);
        }

        // Distance integration (Simulated scale: 1 km takes around 15–20s at 100 km/h)
        const distDelta = (next.speedKmh / 3600) * dtSec * 6.0;
        next.distanceKm = Math.min(321, next.distanceKm + distDelta);

        // 4. Station Detection & Dwell State
        const distToCurrent = Math.abs(next.distanceKm - currentStation.km);
        const distToNext = nextStation.km - next.distanceKm;

        if (distToNext > 0 && distToNext <= 1.5) {
          next.signal = 'YELLOW';
        } else if (distToCurrent <= 0.4 && next.speedKmh < 2) {
          next.signal = next.stationState === 'READY_DEPART' ? 'GREEN' : 'RED';
        } else {
          next.signal = 'GREEN';
        }

        // Check if stopped at platform
        if (distToCurrent <= 0.5 && next.speedKmh <= 0.1) {
          if (next.stationState === 'CRUISING' || next.stationState === 'APPROACHING') {
            next.stationState = 'BOARDING';
            next.dwellTimerSec = next.maxDwellSec;
            spawnStationPassengers();
            trainAudio.speakAnnouncement(currentStation.announcementBn, currentStation.announcementEn);
          } else if (next.stationState === 'BOARDING') {
            next.dwellTimerSec = Math.max(0, next.dwellTimerSec - dtSec);
            if (next.dwellTimerSec <= 0) {
              next.stationState = 'READY_DEPART';
              next.signal = 'GREEN';
              trainAudio.playStationBell();
            }
          }
        } else if (next.speedKmh > 3 && next.stationState !== 'CRUISING') {
          next.stationState = 'CRUISING';
          // Check if passed to next station index
          if (next.distanceKm > currentStation.km + 2 && next.currentStationIndex < ROUTE_STATIONS.length - 1) {
            next.currentStationIndex += 1;
          }
        }

        // End of route at Chattogram
        if (next.distanceKm >= 320.8 && next.speedKmh === 0) {
          setShowJourneyComplete(true);
        }

        // Update Web Audio Physics
        trainAudio.updateTrainPhysicsAudio(next.speedKmh, next.throttleNotch);
        trainAudio.updateWeatherAudio(next.weather);

        return next;
      });

      // Update Passenger walking animation
      setPassengers((prev) =>
        prev.map((p) => {
          const dx = p.targetX - p.x;
          if (Math.abs(dx) > 2) {
            return {
              ...p,
              x: p.x + (dx > 0 ? 1 : -1) * 0.8,
              animFrame: p.animFrame + 0.3,
            };
          }
          return p;
        })
      );

      // Render Canvas
      if (rendererRef.current) {
        const curSt = ROUTE_STATIONS[stateRef.current.currentStationIndex];
        rendererRef.current.render(stateRef.current, curSt, passengers);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [spawnStationPassengers, passengers]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      trainAudio.resumeContext();

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          e.preventDefault();
          setTrainState((s) => ({
            ...s,
            throttleNotch: Math.min(8, s.throttleNotch + 1),
            brakePercent: s.throttleNotch + 1 > 0 ? 0 : s.brakePercent,
          }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          e.preventDefault();
          setTrainState((s) => ({
            ...s,
            throttleNotch: Math.max(0, s.throttleNotch - 1),
          }));
          break;
        case 'KeyB':
          e.preventDefault();
          setTrainState((s) => ({
            ...s,
            brakePercent: s.brakePercent === 0 ? 60 : 0,
            throttleNotch: s.brakePercent === 0 ? 0 : s.throttleNotch,
          }));
          trainAudio.playAirBrakeHiss();
          break;
        case 'Space':
          e.preventDefault();
          setTrainState((s) => ({ ...s, hornActive: true }));
          trainAudio.setHorn(true);
          break;
        case 'KeyL':
          setTrainState((s) => ({ ...s, headlights: !s.headlights }));
          break;
        case 'KeyR':
          setTrainState((s) => ({ ...s, wipers: !s.wipers }));
          break;
        case 'KeyV':
          setViewMode((v) => (v === 'EXTERIOR' ? 'COACH_INTERIOR' : 'EXTERIOR'));
          break;
        case 'KeyM':
          setIsMuted(trainAudio.toggleMute());
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setTrainState((s) => ({ ...s, hornActive: false }));
        trainAudio.setHorn(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handlers for UI Buttons
  const handleSetThrottle = (notch: number) => {
    trainAudio.resumeContext();
    setTrainState((s) => ({
      ...s,
      throttleNotch: notch,
      brakePercent: notch > 0 ? 0 : s.brakePercent,
    }));
  };

  const handleSetBrake = (percent: number) => {
    trainAudio.resumeContext();
    setTrainState((s) => ({
      ...s,
      brakePercent: percent,
      throttleNotch: percent > 0 ? 0 : s.throttleNotch,
    }));
    trainAudio.playAirBrakeHiss();
  };

  const handleEmergencyBrake = () => {
    trainAudio.resumeContext();
    setTrainState((s) => ({
      ...s,
      brakePercent: 100,
      throttleNotch: 0,
      emergencyBrake: true,
    }));
    trainAudio.playAirBrakeHiss();
  };

  const handleHornDown = () => {
    trainAudio.resumeContext();
    setTrainState((s) => ({ ...s, hornActive: true }));
    trainAudio.setHorn(true);
  };

  const handleHornUp = () => {
    setTrainState((s) => ({ ...s, hornActive: false }));
    trainAudio.setHorn(false);
  };

  const handleDepartStation = () => {
    trainAudio.resumeContext();
    trainAudio.playStationBell();
    setTrainState((s) => ({
      ...s,
      stationState: 'READY_DEPART',
      signal: 'GREEN',
      brakePercent: 0,
      throttleNotch: 2,
    }));
  };

  const handleRestartJourney = () => {
    setShowJourneyComplete(false);
    setTrainState({
      speedKmh: 0,
      targetSpeedKmh: 0,
      throttleNotch: 0,
      brakePercent: 100,
      emergencyBrake: false,
      reverser: 'FORWARD',
      headlights: true,
      wipers: false,
      distanceKm: 0.0,
      currentStationIndex: 0,
      stationState: 'AT_PLATFORM',
      dwellTimerSec: 15,
      maxDwellSec: 15,
      passengersOnboard: 180,
      passengersBoardedTotal: 180,
      passengersAlightedTotal: 0,
      timeOfDayHours: 6.75,
      weather: 'CLEAR',
      lightningTimer: 0,
      isLightningActive: false,
      signal: 'RED',
      signalDistanceMeters: 0,
    });
    spawnStationPassengers(true);
  };

  const currentStation = ROUTE_STATIONS[trainState.currentStationIndex];
  const isStoppedAtPlatform =
    (trainState.stationState === 'BOARDING' ||
      trainState.stationState === 'READY_DEPART' ||
      trainState.stationState === 'AT_PLATFORM') &&
    trainState.speedKmh < 1.0;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 font-sans antialiased overflow-hidden select-none">
      {/* 1. Universal Top Navigation Bar */}
      <TopBar
        currentView={viewMode}
        onSetView={setViewMode}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(trainAudio.toggleMute())}
        weather={trainState.weather}
        onChangeWeather={(w) => setTrainState((s) => ({ ...s, weather: w }))}
        onToggleSchedule={() => setShowSchedule(!showSchedule)}
        timeOfDayHours={trainState.timeOfDayHours}
      />

      {/* 2. Main Viewport Container */}
      <main className="relative flex-1 w-full bg-slate-950 flex flex-col justify-between overflow-hidden p-2 sm:p-4">
        {/* Visual Scene Area */}
        <div className="relative flex-1 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center">
          {/* 2D Pixel Art Canvas */}
          <canvas
            ref={canvasRef}
            className={`w-full h-full block cursor-pointer transition-opacity duration-300 ${
              viewMode === 'EXTERIOR' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
            }`}
            onClick={() => trainAudio.resumeContext()}
          />

          {/* Passenger Coach Interior View */}
          {viewMode === 'COACH_INTERIOR' && (
            <div className="w-full h-full p-2 flex items-center justify-center">
              <PassengerCoachView
                state={trainState}
                currentStation={currentStation}
                onOrderChai={() => {
                  trainAudio.resumeContext();
                  setTrainState((s) => ({ ...s, passengersOnboard: s.passengersOnboard + 1 }));
                }}
                onSwitchView={(v) => setViewMode(v)}
              />
            </div>
          )}

          {/* Station Docking Modal / Banner */}
          {isStoppedAtPlatform && viewMode === 'EXTERIOR' && (
            <StationModal
              station={currentStation}
              state={trainState}
              onDepartStation={handleDepartStation}
              onPlayAnnouncement={() =>
                trainAudio.speakAnnouncement(
                  currentStation.announcementBn,
                  currentStation.announcementEn
                )
              }
            />
          )}

          {/* Quick HUD Overlay on Canvas: Next Station Distance & Shortcuts Pill */}
          {viewMode === 'EXTERIOR' && (
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2.5 text-slate-300 shadow-md">
              <span className="font-semibold text-white">
                {currentStation.nameBn}
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-emerald-400">
                {trainState.distanceKm.toFixed(1)} / 321 km
              </span>
              <span className="hidden sm:inline text-slate-600">·</span>
              <span className="hidden sm:inline text-[11px] text-slate-400">
                W/S Accel · Space Horn · B Brake
              </span>
            </div>
          )}
        </div>

        {/* 3. Driver Locomotive Control Console */}
        <div className="mt-2 shrink-0">
          <DriverControls
            state={trainState}
            onSetThrottle={handleSetThrottle}
            onSetBrake={handleSetBrake}
            onTriggerEmergencyBrake={handleEmergencyBrake}
            onToggleHeadlights={() =>
              setTrainState((s) => ({ ...s, headlights: !s.headlights }))
            }
            onToggleWipers={() =>
              setTrainState((s) => ({ ...s, wipers: !s.wipers }))
            }
            onHornDown={handleHornDown}
            onHornUp={handleHornUp}
            onToggleReverser={() =>
              setTrainState((s) => ({
                ...s,
                reverser: s.reverser === 'FORWARD' ? 'NEUTRAL' : 'FORWARD',
              }))
            }
          />
        </div>
      </main>

      {/* Route Timetable Drawer */}
      {showSchedule && (
        <RouteTimetableDrawer
          currentDistanceKm={trainState.distanceKm}
          currentStationIndex={trainState.currentStationIndex}
          onClose={() => setShowSchedule(false)}
        />
      )}

      {/* Chattogram Terminal Arrival Victory Modal */}
      {showJourneyComplete && (
        <JourneySummaryModal
          state={trainState}
          onRestartJourney={handleRestartJourney}
        />
      )}
    </div>
  );
}
