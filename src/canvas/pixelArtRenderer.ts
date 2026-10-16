/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrainState, StationData, PassengerSprite } from '../types/game';

export class PixelArtRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Particle systems
  private smokeParticles: Array<{
    x: number;
    y: number;
    radius: number;
    opacity: number;
    vx: number;
    vy: number;
  }> = [];

  private rainParticles: Array<{
    x: number;
    y: number;
    speed: number;
    length: number;
  }> = [];

  private wheelAngle: number = 0;
  private wiperAngle: number = 0;
  private wiperDirection: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2D rendering context');
    this.ctx = ctx;
    this.initRainParticles();
  }

  private initRainParticles() {
    this.rainParticles = [];
    for (let i = 0; i < 220; i++) {
      this.rainParticles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        speed: 8 + Math.random() * 8,
        length: 8 + Math.random() * 12,
      });
    }
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.initRainParticles();
  }

  public render(
    state: TrainState,
    currentStation: StationData,
    passengers: PassengerSprite[]
  ) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.save();
    ctx.imageSmoothingEnabled = false; // Crisp pixel art appearance

    // 1. Sky & Celestial Lighting
    this.drawSky(state, width, height);

    // 2. Parallax Background Hills / Trees
    this.drawFarBackground(state, width, height);

    // 3. Midground Landscape (Paddy fields, huts, Meghna River, level crossing)
    this.drawMidground(state, currentStation, width, height);

    // 4. Track Bed & Ground Ballast
    const trackY = height * 0.72;
    this.drawTracksAndGround(state, width, height, trackY);

    // 5. Station Platform (if near station)
    this.drawStationPlatform(state, currentStation, width, height, trackY, passengers);

    // 6. Train (Locomotive Class 2900 + Coaches)
    this.drawTrain(state, width, height, trackY);

    // 7. Foreground Overhead Bridge / Kamalapur Roof (if applicable)
    this.drawForeScenery(state, currentStation, width, height, trackY);

    // 8. Dynamic Weather Overlays (Rain, Mist, Lightning)
    this.drawWeather(state, width, height);

    // 9. Day / Night Atmospheric Tint Scrim
    this.drawAtmosphereTint(state, width, height);

    ctx.restore();
  }

  private drawSky(state: TrainState, width: number, height: number) {
    const ctx = this.ctx;
    const hour = state.timeOfDayHours;

    // Determine sky colors based on 24-hr cycle
    let topColor = '#1e3c72';
    let bottomColor = '#2a5298';

    if (hour >= 5 && hour < 7.5) {
      // Golden Sunrise / Dawn (Shokal)
      const t = (hour - 5) / 2.5;
      topColor = this.lerpColor('#131a36', '#ff7e5f', t);
      bottomColor = this.lerpColor('#2b1055', '#feb47b', t);
    } else if (hour >= 7.5 && hour < 16.5) {
      // Tropical Daylight (Dupur)
      if (state.weather === 'MONSOON_RAIN' || state.weather === 'CLOUDY') {
        topColor = '#4a5d6e';
        bottomColor = '#738a9c';
      } else {
        topColor = '#3a88e9';
        bottomColor = '#a1c4fd';
      }
    } else if (hour >= 16.5 && hour < 19.5) {
      // Godhuli / Sunset (Twilight)
      const t = (hour - 16.5) / 3;
      topColor = this.lerpColor('#e96443', '#1f1c2c', t);
      bottomColor = this.lerpColor('#904e95', '#0f2027', t);
    } else {
      // Midnight / Night (Raat)
      topColor = '#050b14';
      bottomColor = '#0f172a';
    }

    const grad = ctx.createLinearGradient(0, 0, 0, height * 0.72);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Sun or Moon position
    const isDay = hour >= 6 && hour < 18;
    const celestialT = isDay ? (hour - 6) / 12 : ((hour + 6) % 24) / 12;
    const celestialX = width * 0.15 + celestialT * (width * 0.7);
    const celestialY = height * 0.38 - Math.sin(celestialT * Math.PI) * (height * 0.22);

    if (isDay && state.weather !== 'MONSOON_RAIN') {
      // Glowing Sun
      ctx.fillStyle = 'rgba(255, 235, 140, 0.25)';
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff9d2';
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (!isDay) {
      // Pixel Moon
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(celestialX, celestialY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.arc(celestialX + 4, celestialY - 2, 10, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 45; i++) {
        const starX = ((i * 137.5) % width);
        const starY = ((i * 73.1) % (height * 0.45));
        const size = (i % 3 === 0) ? 2 : 1;
        ctx.fillRect(starX, starY, size, size);
      }
    }

    // Drifting clouds
    const cloudOffset = (state.distanceKm * 200 + performance.now() * 0.008) % (width + 200);
    this.drawPixelClouds(width, height, cloudOffset, state.weather);
  }

  private drawPixelClouds(width: number, height: number, offset: number, weather: string) {
    const ctx = this.ctx;
    const isDark = weather === 'MONSOON_RAIN' || weather === 'CLOUDY';
    ctx.fillStyle = isDark ? 'rgba(75, 85, 99, 0.75)' : 'rgba(255, 255, 255, 0.7)';

    for (let i = 0; i < 5; i++) {
      const cx = (width - ((offset + i * 280) % (width + 300)));
      const cy = height * 0.12 + (i % 3) * 28;
      // Cloud cluster
      ctx.fillRect(cx, cy + 10, 85, 16);
      ctx.fillRect(cx + 12, cy, 55, 26);
      ctx.fillRect(cx + 28, cy - 8, 30, 16);
    }
  }

  private drawFarBackground(state: TrainState, width: number, height: number) {
    const ctx = this.ctx;
    const scrollX = (state.distanceKm * 400) % width;
    const horizonY = height * 0.62;

    // Distant tree-line & gentle undulating hills (Sitakunda / Feni ridge)
    ctx.fillStyle = state.timeOfDayHours < 6 || state.timeOfDayHours > 19 ? '#0a1d1e' : '#1b4332';

    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= width; x += 30) {
      const hillH =
        Math.sin((x + scrollX) * 0.005) * 24 +
        Math.cos((x + scrollX) * 0.015) * 12;
      ctx.lineTo(x, horizonY - 18 - hillH);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Silhouettes of distant coconut / betel nut palms
    ctx.fillStyle = state.timeOfDayHours < 6 || state.timeOfDayHours > 19 ? '#071617' : '#143828';
    for (let i = 0; i < width + 100; i += 75) {
      const palmX = (i - (scrollX * 0.4) % (width + 100));
      const palmBaseY = horizonY - 12;
      this.drawPalmTree(palmX, palmBaseY, 26);
    }
  }

  private drawPalmTree(x: number, y: number, h: number) {
    const ctx = this.ctx;
    // Trunk
    ctx.fillRect(x, y - h, 2, h);
    // Fronds
    ctx.fillRect(x - 12, y - h - 3, 12, 2);
    ctx.fillRect(x - 10, y - h - 1, 10, 2);
    ctx.fillRect(x, y - h - 4, 14, 2);
    ctx.fillRect(x + 2, y - h - 2, 12, 2);
    ctx.fillRect(x - 6, y - h - 6, 12, 2);
  }

  private drawMidground(
    state: TrainState,
    currentStation: StationData,
    width: number,
    height: number
  ) {
    const ctx = this.ctx;
    const scrollX = (state.distanceKm * 1200) % (width * 2);
    const groundY = height * 0.72;

    // Check if we are traversing the Bhairab Meghna River
    const isAtMeghnaRiver =
      state.distanceKm >= 84 && state.distanceKm <= 92;

    if (isAtMeghnaRiver) {
      this.drawMeghnaRiverAndBoats(scrollX, groundY, width, height, state);
    } else {
      // Emerald / Golden Bangladeshi Paddy Field
      this.drawPaddyFields(scrollX, groundY, width, height, state);
      // Traditional tin-roof huts & banana trees
      this.drawRuralHuts(scrollX, groundY, width, state);
      // Rural Level Crossing with green CNGs
      this.drawLevelCrossing(scrollX, groundY, width, state);
    }
  }

  private drawPaddyFields(
    scrollX: number,
    groundY: number,
    width: number,
    height: number,
    state: TrainState
  ) {
    const ctx = this.ctx;
    const isNight = state.timeOfDayHours < 6 || state.timeOfDayHours > 19;
    const fieldColor = isNight ? '#0d2818' : '#2d6a4f';
    const stalkColor = isNight ? '#1b4332' : '#52b788';

    ctx.fillStyle = fieldColor;
    ctx.fillRect(0, groundY - 45, width, 55);

    // Rice paddy stalks in rows
    ctx.fillStyle = stalkColor;
    for (let x = 0; x < width; x += 8) {
      const stalkH = 6 + ((x + Math.floor(scrollX)) % 5);
      ctx.fillRect(x, groundY - 40 - stalkH, 2, stalkH);
    }

    // Small pond canal with national flower Shapla (Water Lily)
    const canalX = (width * 1.5 - (scrollX % (width * 2)));
    if (canalX > -150 && canalX < width + 150) {
      ctx.fillStyle = isNight ? '#081c24' : '#1e607a';
      ctx.fillRect(canalX, groundY - 32, 120, 18);
      // Water lilies
      ctx.fillStyle = '#ff6b81';
      ctx.fillRect(canalX + 25, groundY - 26, 4, 3);
      ctx.fillRect(canalX + 75, groundY - 22, 5, 3);
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(canalX + 20, groundY - 24, 12, 2);
      ctx.fillRect(canalX + 70, groundY - 20, 14, 2);
    }
  }

  private drawRuralHuts(scrollX: number, groundY: number, width: number, state: TrainState) {
    const ctx = this.ctx;
    const isNight = state.timeOfDayHours < 6 || state.timeOfDayHours > 19;
    const hutInterval = 480;

    for (let i = -1; i < 4; i++) {
      const hutX = (i * hutInterval - (scrollX * 0.8) % (width + hutInterval));
      if (hutX < -80 || hutX > width + 80) continue;

      const hy = groundY - 48;
      // Clay walls
      ctx.fillStyle = isNight ? '#3b2518' : '#8d6e63';
      ctx.fillRect(hutX, hy, 44, 22);

      // Corrugated Tin Roof (Chaal)
      ctx.fillStyle = isNight ? '#475569' : '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(hutX - 4, hy);
      ctx.lineTo(hutX + 22, hy - 14);
      ctx.lineTo(hutX + 48, hy);
      ctx.closePath();
      ctx.fill();

      // Door & Window with warm lantern glow at night
      ctx.fillStyle = isNight ? '#f59e0b' : '#3e2723';
      ctx.fillRect(hutX + 8, hy + 6, 10, 16);
      ctx.fillRect(hutX + 26, hy + 6, 8, 8);

      // Clay veranda step
      ctx.fillStyle = isNight ? '#26170d' : '#6d4c41';
      ctx.fillRect(hutX - 2, hy + 20, 48, 4);

      // Banana plant next to hut
      ctx.fillStyle = isNight ? '#0d2818' : '#2d6a4f';
      ctx.fillRect(hutX + 49, hy - 8, 2, 28);
      ctx.fillRect(hutX + 46, hy - 12, 12, 4);
      ctx.fillRect(hutX + 42, hy - 6, 14, 4);
    }
  }

  private drawLevelCrossing(
    scrollX: number,
    groundY: number,
    width: number,
    state: TrainState
  ) {
    const ctx = this.ctx;
    const isNight = state.timeOfDayHours < 6 || state.timeOfDayHours > 19;
    const crossingX = (width * 1.8 - (scrollX % (width * 2.8)));

    if (crossingX < -150 || crossingX > width + 150) return;

    // Crossing barrier post & down-gate (striped red & white)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(crossingX, groundY - 45, 6, 35);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(crossingX + 1, groundY - 40, 4, 6);
    ctx.fillRect(crossingX + 1, groundY - 26, 4, 6);

    // Flashing red warning light
    const isLightOn = Math.floor(performance.now() / 400) % 2 === 0;
    ctx.fillStyle = isLightOn ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(crossingX + 3, groundY - 48, 4, 0, Math.PI * 2);
    ctx.fill();

    // Iconic Bangladesh Green CNG Auto-Rickshaw waiting at gate!
    const cngX = crossingX + 22;
    const cngY = groundY - 32;

    // CNG Body (Emerald Green with wire mesh)
    ctx.fillStyle = '#059669';
    ctx.fillRect(cngX, cngY, 28, 16);
    ctx.fillRect(cngX + 4, cngY - 8, 20, 10);
    // Black fabric roof
    ctx.fillStyle = '#111827';
    ctx.fillRect(cngX + 2, cngY - 10, 24, 3);
    // Yellow commercial license stripe
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cngX + 2, cngY + 8, 24, 3);
    // Wheels
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(cngX + 4, cngY + 14, 6, 6);
    ctx.fillRect(cngX + 18, cngY + 14, 6, 6);

    // Colorful Bangladeshi Cycle Rickshaw with decorated hood
    const rX = crossingX + 58;
    const rY = groundY - 28;
    ctx.fillStyle = '#e11d48'; // Bright red/pink hood
    ctx.fillRect(rX, rY - 12, 14, 14);
    ctx.fillStyle = '#3b82f6'; // Blue seat
    ctx.fillRect(rX + 2, rY + 2, 12, 6);
    // Rickshaw puller silhouette
    ctx.fillStyle = isNight ? '#1e293b' : '#334155';
    ctx.fillRect(rX + 14, rY - 8, 6, 12);
    // Wheels
    ctx.fillStyle = '#475569';
    ctx.fillRect(rX + 1, rY + 8, 6, 6);
    ctx.fillRect(rX + 16, rY + 8, 6, 6);
  }

  private drawMeghnaRiverAndBoats(
    scrollX: number,
    groundY: number,
    width: number,
    height: number,
    state: TrainState
  ) {
    const ctx = this.ctx;
    const isNight = state.timeOfDayHours < 6 || state.timeOfDayHours > 19;

    // Wide Meghna River Water
    const riverY = groundY - 50;
    const waterGrad = ctx.createLinearGradient(0, riverY, 0, groundY);
    waterGrad.addColorStop(0, isNight ? '#0b2027' : '#1e485e');
    waterGrad.addColorStop(1, isNight ? '#07161b' : '#133547');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, riverY, width, 55);

    // Water ripple highlights
    ctx.fillStyle = isNight ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.28)';
    for (let x = 0; x < width; x += 40) {
      const rx = (x + (scrollX * 0.2) + performance.now() * 0.02) % width;
      ctx.fillRect(rx, riverY + 14 + (x % 20), 24, 2);
    }

    // Wooden Country Boats (Nouka) sailing on the river
    for (let i = 0; i < 3; i++) {
      const bx = ((i * 320 - (scrollX * 0.3) + width * 2) % (width + 300)) - 100;
      const by = riverY + 20 + i * 8;

      // Curved wooden hull
      ctx.fillStyle = isNight ? '#1f130b' : '#451a03';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + 18, by + 8, bx + 36, by);
      ctx.lineTo(bx + 32, by - 2);
      ctx.quadraticCurveTo(bx + 18, by + 4, bx + 4, by - 2);
      ctx.closePath();
      ctx.fill();

      // Triangular boat sail (Pataal/Taal Nouka)
      ctx.fillStyle = isNight ? '#64748b' : '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(bx + 16, by - 22);
      ctx.lineTo(bx + 28, by - 4);
      ctx.lineTo(bx + 16, by - 4);
      ctx.closePath();
      ctx.fill();

      // Boatman silhouette
      ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
      ctx.fillRect(bx + 6, by - 7, 4, 6);
    }

    // Massive steel bridge foundation pillars
    ctx.fillStyle = '#334155';
    for (let px = 0; px < width + 200; px += 180) {
      const pillarX = px - (scrollX % 180);
      ctx.fillRect(pillarX, riverY, 24, 60);
      ctx.fillStyle = '#475569';
      ctx.fillRect(pillarX + 2, riverY, 20, 4);
      ctx.fillStyle = '#334155';
    }
  }

  private drawTracksAndGround(
    state: TrainState,
    width: number,
    height: number,
    trackY: number
  ) {
    const ctx = this.ctx;
    const isNight = state.timeOfDayHours < 6 || state.timeOfDayHours > 19;

    // Embankment Ballast (Crushed granite gravel)
    ctx.fillStyle = isNight ? '#181b22' : '#374151';
    ctx.fillRect(0, trackY - 4, width, height - trackY + 4);

    // Track ballast texture speckles
    ctx.fillStyle = isNight ? '#0f1217' : '#4b5563';
    for (let x = 0; x < width; x += 12) {
      ctx.fillRect(x + (x % 5), trackY + 8 + (x % 7), 3, 2);
    }

    // Wooden / Concrete Sleepers
    const sleeperOffset = (state.distanceKm * 2800) % 18;
    ctx.fillStyle = '#1e1b18';
    for (let x = -20; x < width + 20; x += 18) {
      ctx.fillRect(x - sleeperOffset, trackY - 2, 8, 12);
    }

    // Dual Steel Rails
    // Lower Rail
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, trackY, width, 4);
    // Steel specular shine
    ctx.fillStyle = isNight ? '#94a3b8' : '#e2e8f0';
    ctx.fillRect(0, trackY, width, 1);

    // Telegraph / Signal Poles along line
    const poleSpacing = 260;
    const poleOffset = (state.distanceKm * 1800) % poleSpacing;
    ctx.fillStyle = '#1f2937';
    for (let px = -50; px < width + 50; px += poleSpacing) {
      const x = px - poleOffset;
      // Pole
      ctx.fillRect(x, trackY - 60, 4, 60);
      // Crossbars
      ctx.fillRect(x - 8, trackY - 55, 20, 2);
      ctx.fillRect(x - 6, trackY - 45, 16, 2);
      // Ceramic insulators
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 8, trackY - 57, 2, 2);
      ctx.fillRect(x + 10, trackY - 57, 2, 2);
      ctx.fillStyle = '#1f2937';
    }

    // Trackside Railway Signal (Aspect indicator)
    const signalX = width * 0.88;
    ctx.fillStyle = '#111827';
    ctx.fillRect(signalX, trackY - 72, 8, 72);
    ctx.fillRect(signalX - 4, trackY - 80, 16, 22);

    // Signal lights
    const signal = state.signal;
    ctx.fillStyle = signal === 'RED' ? '#ef4444' : '#374151';
    ctx.fillRect(signalX - 1, trackY - 77, 6, 4);
    ctx.fillStyle = signal === 'YELLOW' ? '#f59e0b' : '#374151';
    ctx.fillRect(signalX - 1, trackY - 71, 6, 4);
    ctx.fillStyle = signal === 'GREEN' ? '#10b981' : '#374151';
    ctx.fillRect(signalX - 1, trackY - 65, 6, 4);
  }

  private drawStationPlatform(
    state: TrainState,
    currentStation: StationData,
    width: number,
    height: number,
    trackY: number,
    passengers: PassengerSprite[]
  ) {
    const ctx = this.ctx;
    const isAtStation =
      state.stationState === 'AT_PLATFORM' ||
      state.stationState === 'BOARDING' ||
      state.stationState === 'READY_DEPART' ||
      state.stationState === 'APPROACHING';

    if (!isAtStation) return;

    const isNight = state.timeOfDayHours < 6 || state.timeOfDayHours > 19;
    const platformY = trackY - 8;

    // Platform Surface
    ctx.fillStyle = isNight ? '#262930' : '#6b7280';
    ctx.fillRect(0, platformY, width, 14);

    // Yellow tactile safety line
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, platformY + 1, width, 2);

    // Brick edge coping
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, platformY + 11, width, 3);

    // Station Signboard (Authentic Bangladesh Railway bilingual sign)
    const signX = width * 0.42;
    const signY = platformY - 55;

    // Wooden / Steel mounting posts
    ctx.fillStyle = '#111827';
    ctx.fillRect(signX + 15, signY + 22, 4, 33);
    ctx.fillRect(signX + 145, signY + 22, 4, 33);

    // Signboard panel (Green background with White border & letters)
    ctx.fillStyle = '#065f46';
    ctx.fillRect(signX, signY, 165, 24);
    ctx.fillStyle = '#ffffff';
    ctx.strokeRect(signX + 1, signY + 1, 163, 22);

    // Text rendering on signboard
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${currentStation.nameBn}`, signX + 82, signY + 10);
    ctx.font = '8px monospace';
    ctx.fillText(`${currentStation.nameEn.toUpperCase()}`, signX + 82, signY + 20);

    // Platform Tea Stall (Cha er Tong)
    this.drawTeaStall(width * 0.18, platformY, isNight);

    // Draw Animated Passenger Sprites on Platform
    passengers.forEach((p) => {
      this.drawPassengerSprite(p, platformY, isNight);
    });
  }

  private drawTeaStall(x: number, platformY: number, isNight: boolean) {
    const ctx = this.ctx;
    const ty = platformY - 32;

    // Stall Counter
    ctx.fillStyle = isNight ? '#3e2723' : '#795548';
    ctx.fillRect(x, ty + 12, 42, 20);

    // Overhead bamboo / fabric canopy
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x - 4, ty, 50, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 2, ty + 4, 46, 2);

    // Steaming Tea Samovar / Kettle
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 6, ty + 4, 10, 8);
    // Steam puff
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const steamY = ty + 1 - (Math.floor(performance.now() / 250) % 6);
    ctx.fillRect(x + 10, steamY, 3, 3);

    // Clay cups (Matir Bhar)
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(x + 22, ty + 8, 4, 4);
    ctx.fillRect(x + 28, ty + 8, 4, 4);

    // Glass biscuit jar
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(x + 34, ty + 6, 6, 6);
  }

  private drawPassengerSprite(p: PassengerSprite, platformY: number, isNight: boolean) {
    const ctx = this.ctx;
    const px = p.x;
    const py = platformY - 18;
    const walkBob = Math.sin(p.animFrame * 0.5) * 2;

    // Head
    ctx.fillStyle = '#d4a373';
    ctx.fillRect(px + 2, py - 4 + walkBob, 4, 4);

    if (p.type === 'coolie') {
      // Coolie in red shirt carrying a trunk on head!
      ctx.fillStyle = '#dc2626'; // Red uniform
      ctx.fillRect(px, py + walkBob, 8, 10);
      // Luggage trunk balanced on head
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(px - 3, py - 10 + walkBob, 14, 6);
    } else if (p.type === 'commuter') {
      // Commuter in white / blue panjabi
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py + walkBob, 8, 11);
      // Travel bag
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + (p.dir === 1 ? 8 : -3), py + 5 + walkBob, 4, 5);
    } else {
      // Family / student in saree or casual clothes
      ctx.fillStyle = p.color;
      ctx.fillRect(px, py + walkBob, 7, 10);
    }

    // Legs
    ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
    ctx.fillRect(px + 1, py + 11, 2, 6);
    ctx.fillRect(px + 5, py + 11, 2, 6);
  }

  private drawTrain(state: TrainState, width: number, height: number, trackY: number) {
    const ctx = this.ctx;
    const isNight = state.timeOfDayHours < 6 || state.timeOfDayHours > 19;

    // Train anchor position (center-right of viewport for side-view perspective)
    const trainFrontX = width * 0.68;
    const coachLength = 110;
    const locoLength = 125;
    const trainY = trackY - 34;

    // Update wheel animation angle
    this.wheelAngle += (state.speedKmh / 100) * 0.45;

    // 1. Draw Locomotive Headlight Volumetric Beam
    if (state.headlights || isNight) {
      this.drawHeadlightBeam(trainFrontX + locoLength - 4, trainY + 14, width, height, isNight);
    }

    // 2. Locomotive Diesel Smoke Exhaust Particles
    this.updateAndDrawSmoke(trainFrontX + 85, trainY + 2, state);

    // 3. Bangladesh Railway Class 2900 / 3000 Diesel Locomotive
    this.drawLocomotive(trainFrontX, trainY, locoLength, state, isNight);

    // 4. Passenger Coaches (4 connected carriages trailing behind)
    for (let c = 0; c < 3; c++) {
      const coachX = trainFrontX - (c + 1) * (coachLength + 10);
      this.drawPassengerCoach(coachX, trainY, coachLength, c, isNight);

      // Articulated gangway bellow between coaches
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(coachX + coachLength, trainY + 8, 10, 20);
    }
  }

  private drawHeadlightBeam(
    hx: number,
    hy: number,
    width: number,
    height: number,
    isNight: boolean
  ) {
    const ctx = this.ctx;
    const beamLength = width * 0.45;
    const beamEndH = height * 0.35;

    const beamGrad = ctx.createRadialGradient(
      hx,
      hy,
      5,
      hx + beamLength * 0.6,
      hy,
      beamLength
    );
    beamGrad.addColorStop(0, 'rgba(255, 245, 180, 0.85)');
    beamGrad.addColorStop(0.3, 'rgba(255, 245, 180, 0.45)');
    beamGrad.addColorStop(1, 'rgba(255, 245, 180, 0)');

    ctx.save();
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(hx, hy - 4);
    ctx.lineTo(hx + beamLength, hy - beamEndH * 0.5);
    ctx.lineTo(hx + beamLength, hy + beamEndH * 0.7);
    ctx.lineTo(hx, hy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private updateAndDrawSmoke(exX: number, exY: number, state: TrainState) {
    const ctx = this.ctx;
    // Spawn smoke puff proportional to throttle notch
    if (state.throttleNotch > 0 || Math.random() < 0.25) {
      const isHighThrottle = state.throttleNotch >= 5;
      this.smokeParticles.push({
        x: exX,
        y: exY,
        radius: 3 + Math.random() * 3,
        opacity: isHighThrottle ? 0.65 : 0.4,
        vx: -1.5 - (state.speedKmh / 100) * 4.5,
        vy: -0.6 - Math.random() * 0.5,
      });
    }

    // Update & draw smoke
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.radius += 0.25;
      p.opacity -= 0.015;

      if (p.opacity <= 0) {
        this.smokeParticles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(180, 185, 195, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawLocomotive(
    x: number,
    y: number,
    len: number,
    state: TrainState,
    isNight: boolean
  ) {
    const ctx = this.ctx;

    // Body: Bangladesh Railway Iconic Dark Green (#165B33)
    ctx.fillStyle = '#165b33';
    ctx.fillRect(x, y + 4, len, 24);

    // Cab Raised Roof
    ctx.fillRect(x + len - 42, y, 40, 6);

    // Crimson Red Central Livery Stripe
    ctx.fillStyle = '#d90429';
    ctx.fillRect(x, y + 14, len, 5);

    // Yellow Lining Trim
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x, y + 13, len, 1);
    ctx.fillRect(x, y + 19, len, 1);

    // Cab Windshield Windows
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + len - 26, y + 5, 12, 8);
    ctx.fillRect(x + len - 38, y + 5, 10, 8);

    // Driver silhouette inside cab
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(x + len - 22, y + 7, 5, 5);

    // Cowcatcher (Pilot) with Yellow & Black Hazard Stripes
    const cowX = x + len - 6;
    const cowY = y + 25;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cowX, cowY, 12, 8);
    ctx.fillStyle = '#111827';
    ctx.fillRect(cowX + 2, cowY, 2, 8);
    ctx.fillRect(cowX + 6, cowY, 2, 8);
    ctx.fillRect(cowX + 10, cowY, 2, 8);

    // Dual High-Intensity Headlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + len - 2, y + 12, 3, 0, Math.PI * 2);
    ctx.arc(x + len - 2, y + 18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Bangladesh Railway Logo Plate & Locomotive Serial ("2924")
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('BR 2924', x + 15, y + 18);

    // Bogie Wheels (2 axles per bogie, 2 bogies)
    this.drawBogie(x + 18, y + 28);
    this.drawBogie(x + len - 36, y + 28);
  }

  private drawPassengerCoach(
    x: number,
    y: number,
    len: number,
    index: number,
    isNight: boolean
  ) {
    const ctx = this.ctx;

    // Carriage Body: BR Forest Green (#165B33)
    ctx.fillStyle = '#165b33';
    ctx.fillRect(x, y + 4, len, 24);

    // White / Metallic Arched Roof
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x, y + 2, len, 3);

    // Crimson Red Central Stripe
    ctx.fillStyle = '#d90429';
    ctx.fillRect(x, y + 14, len, 5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x, y + 13, len, 1);
    ctx.fillRect(x, y + 19, len, 1);

    // Passenger Windows (Illuminated warm golden yellow at night)
    const windowColor = isNight ? '#fef08a' : '#bae6fd';
    ctx.fillStyle = windowColor;

    for (let w = 0; w < 6; w++) {
      const wx = x + 14 + w * 14;
      ctx.fillRect(wx, y + 7, 9, 6);

      // Passenger silhouettes inside window
      if ((index + w) % 2 === 0) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(wx + 2, y + 9, 4, 4);
        ctx.fillStyle = windowColor;
      }
    }

    // Carriage Doors at each end
    ctx.fillStyle = '#0f3d23';
    ctx.fillRect(x + 2, y + 5, 8, 22);
    ctx.fillRect(x + len - 10, y + 5, 8, 22);

    // Coach bogies
    this.drawBogie(x + 16, y + 28);
    this.drawBogie(x + len - 26, y + 28);
  }

  private drawBogie(bx: number, by: number) {
    const ctx = this.ctx;
    // Bogie frame
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(bx - 12, by - 2, 28, 4);

    // 2 Spoked Wheels
    [-8, 12].forEach((offset) => {
      const wx = bx + offset;
      const wy = by + 3;
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(wx, wy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Rotating axle spokes
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(this.wheelAngle) * 4, wy + Math.sin(this.wheelAngle) * 4);
      ctx.lineTo(wx - Math.cos(this.wheelAngle) * 4, wy - Math.sin(this.wheelAngle) * 4);
      ctx.stroke();
    });
  }

  private drawForeScenery(
    state: TrainState,
    currentStation: StationData,
    width: number,
    height: number,
    trackY: number
  ) {
    const ctx = this.ctx;

    // 1. Dhaka Kamalapur Vaulted Arched Umbrella Canopy
    if (currentStation.id === 'dhaka' && state.distanceKm <= 4) {
      ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      for (let archX = -40; archX < width + 60; archX += 130) {
        ctx.beginPath();
        ctx.moveTo(archX, 0);
        ctx.quadraticCurveTo(archX + 65, height * 0.42, archX + 130, 0);
        ctx.lineTo(archX + 120, 0);
        ctx.quadraticCurveTo(archX + 65, height * 0.38, archX + 10, 0);
        ctx.closePath();
        ctx.fill();

        // Concrete support pillars
        ctx.fillStyle = '#64748b';
        ctx.fillRect(archX + 63, 0, 4, trackY - 12);
        ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
      }
    }

    // 2. Bhairab Meghna River Steel Truss Bridge Structure
    if (state.distanceKm >= 84 && state.distanceKm <= 92) {
      const trussOffset = (state.distanceKm * 3200) % 140;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;

      // Overhead top chord
      ctx.beginPath();
      ctx.moveTo(0, height * 0.32);
      ctx.lineTo(width, height * 0.32);
      ctx.stroke();

      // Diagonal cross-truss steel beams framing the foreground
      ctx.lineWidth = 3;
      for (let tx = -140; tx < width + 140; tx += 140) {
        const x = tx - trussOffset;
        ctx.beginPath();
        ctx.moveTo(x, trackY);
        ctx.lineTo(x + 70, height * 0.32);
        ctx.lineTo(x + 140, trackY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 70, trackY);
        ctx.lineTo(x + 70, height * 0.32);
        ctx.stroke();
      }
    }
  }

  private drawWeather(state: TrainState, width: number, height: number) {
    const ctx = this.ctx;

    // Lightning Flash
    if (state.isLightningActive) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Rain Particle Simulation
    if (state.weather === 'DRIZZLE' || state.weather === 'MONSOON_RAIN') {
      const isHeavy = state.weather === 'MONSOON_RAIN';
      const speedAngle = (state.speedKmh / 100) * 12;

      ctx.strokeStyle = isHeavy ? 'rgba(224, 242, 254, 0.65)' : 'rgba(224, 242, 254, 0.35)';
      ctx.lineWidth = isHeavy ? 1.5 : 1;

      ctx.beginPath();
      this.rainParticles.forEach((p) => {
        p.x -= speedAngle;
        p.y += p.speed * (isHeavy ? 1.4 : 1);

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * (width + 100);
        }
        if (p.x < -20) {
          p.x = width + 20;
        }

        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - speedAngle * 0.6, p.y + p.length);
      });
      ctx.stroke();
    }
  }

  private drawAtmosphereTint(state: TrainState, width: number, height: number) {
    const ctx = this.ctx;
    const hour = state.timeOfDayHours;

    // Dark/Night scrim
    if (hour < 5.5 || hour > 19.5) {
      const nightAlpha = hour >= 21 || hour <= 4 ? 0.45 : 0.28;
      ctx.fillStyle = `rgba(10, 15, 30, ${nightAlpha})`;
      ctx.fillRect(0, 0, width, height);
    } else if (hour >= 17 && hour <= 19) {
      // Golden Hour / Sunset Amber Glow
      ctx.fillStyle = 'rgba(251, 146, 60, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }
  }

  private lerpColor(c1: string, c2: string, t: number): string {
    const parse = (hex: string) => {
      const num = parseInt(hex.slice(1), 16);
      return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
    };
    const [r1, g1, b1] = parse(c1);
    const [r2, g2, b2] = parse(c2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
