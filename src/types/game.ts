/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WeatherType = 'CLEAR' | 'CLOUDY' | 'DRIZZLE' | 'MONSOON_RAIN';

export type SignalAspect = 'GREEN' | 'YELLOW' | 'RED';

export type StationId =
  | 'dhaka'
  | 'biman_bandar'
  | 'bhairab_bazar'
  | 'brahmanbaria'
  | 'feni'
  | 'chattogram';

export interface StationData {
  id: StationId;
  nameEn: string;
  nameBn: string;
  km: number;
  platformLengthMeters: number;
  sceneryType:
    | 'kamalapur_canopy'
    | 'airport_overpass'
    | 'meghna_bridge'
    | 'rural_crossings'
    | 'feni_hills'
    | 'chattogram_terminus';
  tagline: string;
  description: string;
  iconicFeatures: string[];
  announcementEn: string;
  announcementBn: string;
  scheduledArrivalMin: number;
}

export interface PassengerSprite {
  id: number;
  x: number; // position relative to platform
  targetX: number;
  y: number;
  dir: 1 | -1;
  type: 'commuter' | 'coolie' | 'family' | 'chai_seller' | 'student';
  color: string;
  action: 'waiting' | 'boarding' | 'alighting';
  coachTargetIndex: number;
  animFrame: number;
}

export interface LevelCrossing {
  km: number;
  name: string;
  gateDown: boolean;
  vehicles: Array<{
    type: 'cng' | 'rickshaw' | 'bus';
    color: string;
    side: 'left' | 'right';
  }>;
}

export interface Landmark {
  km: number;
  nameEn: string;
  nameBn: string;
  type: 'meghna_bridge' | 'titas_river' | 'village_market' | 'paddy_expanse';
}

export type ViewMode = 'EXTERIOR' | 'COACH_INTERIOR' | 'CAB_HUD';

export interface TrainState {
  // Movement & physics
  speedKmh: number;
  targetSpeedKmh: number;
  throttleNotch: number; // 0 to 8
  brakePercent: number; // 0 to 100
  emergencyBrake: boolean;
  reverser: 'FORWARD' | 'NEUTRAL';
  headlights: boolean;
  wipers: boolean;
  distanceKm: number; // 0 to 321
  currentStationIndex: number;

  // Station dwell & passenger exchange
  stationState: 'APPROACHING' | 'AT_PLATFORM' | 'BOARDING' | 'READY_DEPART' | 'CRUISING';
  dwellTimerSec: number;
  maxDwellSec: number;
  passengersOnboard: number;
  passengersBoardedTotal: number;
  passengersAlightedTotal: number;

  // Environment
  timeOfDayHours: number; // 0.0 to 24.0
  weather: WeatherType;
  lightningTimer: number;
  isLightningActive: boolean;

  // Signalling
  signal: SignalAspect;
  signalDistanceMeters: number;
}
