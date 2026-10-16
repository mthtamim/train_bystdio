/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StationData, Landmark } from '../types/game';

export const TOTAL_ROUTE_KM = 321;

export const ROUTE_STATIONS: StationData[] = [
  {
    id: 'dhaka',
    nameEn: 'Dhaka (Kamalapur)',
    nameBn: 'ঢাকা (কমলাপুর)',
    km: 0,
    platformLengthMeters: 450,
    sceneryType: 'kamalapur_canopy',
    tagline: 'The Gateway to Bangladesh Railway',
    description:
      'The iconic terminal opened in 1968, renowned for its architectural concrete folded-plate umbrella canopies designed by Robert Boughey.',
    iconicFeatures: [
      'Sculptural vaulted canopies',
      'Steaming platform tea samovars',
      'Coolies in signature red uniforms',
      'Bustling departure platforms',
    ],
    announcementEn:
      'Attention please. The 702 Suborno Express to Chattogram is stationed at Platform 1 and preparing for departure.',
    announcementBn:
      'যাত্রী সাধারণের দৃষ্টি আকর্ষণ করা হচ্ছে। ৭২নং সুবর্ণ এক্সপ্রেস চট্টগ্রাম অভিমুখে ১নং প্ল্যাটফর্মে প্রস্তুত আছে।',
    scheduledArrivalMin: 0,
  },
  {
    id: 'biman_bandar',
    nameEn: 'Dhaka Biman Bandar (Airport)',
    nameBn: 'ঢাকা বিমান বন্দর',
    km: 21,
    platformLengthMeters: 380,
    sceneryType: 'airport_overpass',
    tagline: 'Northern Capital Hub',
    description:
      'Serving Hazrat Shahjalal International Airport and northern commuters, connected via pedestrian footbridges and surrounded by highway flyovers.',
    iconicFeatures: [
      'Pedestrian footbridges over tracks',
      'Airport approach flight path',
      'Dense commuter crowd exchange',
      'Suburban greenery & road overpasses',
    ],
    announcementEn:
      'Suborno Express arriving at Dhaka Airport station. Please mind the platform gap when alighting.',
    announcementBn:
      'সুবর্ণ এক্সপ্রেস ঢাকা বিমান বন্দর স্টেশনে প্রবেশ করছে। সাবধানে প্ল্যাটফর্মে নামুন।',
    scheduledArrivalMin: 22,
  },
  {
    id: 'bhairab_bazar',
    nameEn: 'Bhairab Bazar Junction',
    nameBn: 'ভৈরব বাজার জংশন',
    km: 88,
    platformLengthMeters: 400,
    sceneryType: 'meghna_bridge',
    tagline: 'Crossing the Mighty Meghna River',
    description:
      'Famous railway town at the crossing of the mighty Meghna River, traversed via the historic 984m steel truss Syed Nazrul Islam Bridge.',
    iconicFeatures: [
      'Iconic Meghna River steel girder bridge',
      'Country boats (nouka) with triangular sails',
      'Vast glistening river waters & sandbars',
      'Famous local Bhairab river sweets & tea',
    ],
    announcementEn:
      'We are approaching Bhairab Bazar Junction and the historic Meghna Railway Bridge.',
    announcementBn:
      'আমরা ভৈরব বাজার জংশন এবং ঐতিহাসিক মেঘনা রেল সেতুর কাছাকাছি পৌছাচ্ছি।',
    scheduledArrivalMin: 85,
  },
  {
    id: 'brahmanbaria',
    nameEn: 'Brahmanbaria',
    nameBn: 'ব্রাহ্মণবাড়িয়া',
    km: 126,
    platformLengthMeters: 360,
    sceneryType: 'rural_crossings',
    tagline: 'Lush Paddypad & Cultural Heart',
    description:
      'Surrounded by emerald rice paddies and the Titas River basin. Known for level crossings filled with green CNG auto-rickshaws and rural bazaars.',
    iconicFeatures: [
      'Vast green paddy fields & banana groves',
      'Level crossing with green CNG auto-rickshaws',
      'Tin-roofed homesteads & coconut palms',
      'Titas river canals & water lilies',
    ],
    announcementEn:
      'Arriving at Brahmanbaria station. Suborno Express will halt for passenger exchange.',
    announcementBn:
      'ব্রাহ্মণবাড়িয়া স্টেশনে ট্রেন পৌঁছাচ্ছে। সম্মানিত যাত্রীদের দৃষ্টি আকর্ষণ করছি।',
    scheduledArrivalMin: 125,
  },
  {
    id: 'feni',
    nameEn: 'Feni Junction',
    nameBn: 'ফেনী জংশন',
    km: 238,
    platformLengthMeters: 370,
    sceneryType: 'feni_hills',
    tagline: 'Gateway to the Port and Chittagong Hills',
    description:
      'Key junction situated on the coastal plains, with the distant contours of the Chittagong Hill Tracts visible on the eastern horizon.',
    iconicFeatures: [
      'Lush betel nut & date palm forests',
      'Distant silhouette of eastern foothills',
      'Evening station lamps and lantern glow',
      'Junction crossover signal gantries',
    ],
    announcementEn:
      'Suborno Express now arriving at Feni Junction. Next stop: final destination Chattogram.',
    announcementBn:
      'ট্রেন ফেনী জংশনে এসে পৌঁছেছে। পরবর্তী এবং শেষ গন্তব্য চট্টগ্রাম রেলওয়ে স্টেশন।',
    scheduledArrivalMin: 220,
  },
  {
    id: 'chattogram',
    nameEn: 'Chattogram (Chittagong)',
    nameBn: 'চট্টগ্রাম রেলওয়ে স্টেশন',
    km: 321,
    platformLengthMeters: 500,
    sceneryType: 'chattogram_terminus',
    tagline: 'The Commercial Capital & Port Terminus',
    description:
      'The historic terminal of the southeastern rail line, greeting travelers with coastal air, rolling green hills, and bustling maritime vitality.',
    iconicFeatures: [
      'Grand port-city arched terminal roof',
      'Southeastern coastal breeze & palm trees',
      'Port cranes visible against coastal skyline',
      'End-of-line buffer stops & celebration',
    ],
    announcementEn:
      'Ladies and gentlemen, we have reached our final destination, Chattogram. Bangladesh Railway thanks you for traveling with us.',
    announcementBn:
      'সুধী যাত্রীসাধারণ, আমরা আমাদের শেষ গন্তব্য চট্টগ্রাম স্টেশনে এসে পৌঁছেছি। বাংলাদেশ রেলওয়ের সাথে থাকার জন্য ধন্যবাদ।',
    scheduledArrivalMin: 300,
  },
];

export const ROUTE_LANDMARKS: Landmark[] = [
  { km: 12, nameEn: 'Tongi Junction Flyover', nameBn: 'টঙ্গী জংশন ফ্লাইওভার', type: 'village_market' },
  { km: 54, nameEn: 'Narsingdi Textile Belt', nameBn: 'নরসিংদী তাঁত অঞ্চল', type: 'village_market' },
  { km: 86, nameEn: 'Meghna River Railway Bridge', nameBn: 'মেঘনা নদী রেল সেতু', type: 'meghna_bridge' },
  { km: 155, nameEn: 'Akhaura Border Junction', nameBn: 'আখাউড়া জংশন', type: 'village_market' },
  { km: 195, nameEn: 'Cumilla Green Fields', nameBn: 'কুমিল্লা সবুজ প্রান্তর', type: 'paddy_expanse' },
  { km: 285, nameEn: 'Sitakunda Mountain Ridge', nameBn: 'সীতাকুণ্ড পাহাড় শ্রেণি', type: 'titas_river' },
];

export const PASSENGER_VOICES_BN = [
  'চা লাগবে, গরম চা?',
  'জানালাটা একটু তুলে দিন না ভাই, বাতাস আসবে।',
  'মেঘনা ব্রিজে এসে গেছি মনে হয়!',
  'চট্টগ্রাম পৌঁছাতে আর কতক্ষণ লাগবে?',
  'আজকের আবহাওয়াটা একদম বর্ষার মতো মনোরম।',
  'মাটির ভাঁড়ের চা-টা দারুণ ছিল।',
];
