// Tablero del carro, a la derecha de la carretera: velocímetro, marcha,
// odómetro, indicador de carril y radio (la música de fondo).
R67.dashboard = {
  shownSpeed: 0,

  reset() {
    this.shownSpeed = 0;
  },

  // La aguja persigue a la velocidad real para que suba y baje con suavidad
  update(dt, mph) {
    this.shownSpeed += (mph - this.shownSpeed) * Math.min(1, dt * 6);
  },

  // info: { driving, difficulty, distance, lane, lights, raining, wiping, time }
  draw(ctx, info) {
    const c = R67.config;
    const x0 = c.WIDTH;
    const w = c.PANEL_W;
    const cx = x0 + w / 2;

    ctx.fillStyle = "#07070f";
    ctx.fillRect(x0, 0, w, c.HEIGHT);
    ctx.fillStyle = "#221c44";
    ctx.fillRect(x0, 0, 4, c.HEIGHT);

    this.label(ctx, "ROUTE 67", cx, 22, 10, c.COLORS.accent);

    this.drawSpeedometer(ctx, cx, 116, 58);

    const gear = info.driving ? String(Math.min(5, 1 + Math.floor(info.difficulty * 5))) : "N";
    this.drawBox(ctx, x0 + 12, 200, 66, 54, "MARCHA", gear, 20);
    const miles = (info.distance / c.MILE_PX).toFixed(1).padStart(5, "0");
    this.drawBox(ctx, x0 + 86, 200, 66, 54, "MILLAS", miles, 9);

    this.drawLanes(ctx, cx, 272, info.lane, info.lights);
    this.drawRadio(ctx, x0 + 12, this.RADIO.y, w - 20, info.time);

    this.drawEngineButton(ctx, info.driving);
    this.drawWiperButton(ctx, info.raining, info.wiping, info.time);

    this.label(ctx, "FLECHAS / WASD", cx, 568, 7, "#b37a00");
    this.label(ctx, "M:RADIO  P:MOTOR", cx, 586, 7, "#b37a00");
    this.label(ctx, "L:LUCES  E:LIMPIA", cx, 604, 7, "#b37a00");
  },

  // Zona de la radio dentro del tablero (también sirve para saber si la tocaron)
  RADIO: { y: 322, h: 150 },

  hitsRadio(x, y) {
    return y >= this.RADIO.y - 10 && y <= this.RADIO.y + this.RADIO.h;
  },

  // Barra vertical de gasolina, sobre el arcén izquierdo de la carretera.
  // Se llena de abajo hacia arriba; con poca gasolina se pone roja y parpadea.
  FUEL_BAR: { x: 6, y: 140, w: 24, h: 360 },

  drawFuel(ctx, frac, time) {
    const c = R67.config;
    const b = this.FUEL_BAR;
    const cx = b.x + b.w / 2;
    const low = frac <= c.FUEL.LOW;
    const color = low ? c.COLORS.danger : frac <= 0.5 ? c.COLORS.accent : c.COLORS.text;

    this.label(ctx, "GAS", cx, b.y - 12, 7, color);
    this.label(ctx, "E", cx, b.y + b.h + 12, 7, c.COLORS.danger);

    ctx.fillStyle = "rgba(10, 10, 18, 0.85)";
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);

    if (low && Math.floor(time * 4) % 2 === 0) return;
    const blocks = 20;
    const bh = (b.h - 6) / blocks;
    const filled = Math.ceil(Math.max(0, Math.min(1, frac)) * blocks);
    ctx.fillStyle = color;
    for (let i = 0; i < filled; i++) {
      const y = b.y + b.h - 3 - (i + 1) * bh;
      ctx.fillRect(b.x + 4, Math.round(y) + 1, b.w - 8, Math.round(bh) - 2);
    }
  },

  // Botones redondos lado a lado: motor (apagarlo pausa) y limpiaparabrisas.
  // dx es el desplazamiento desde el centro del tablero.
  ENGINE: { y: 518, r: 24, dx: -36 },
  WIPER: { y: 518, r: 24, dx: 36 },

  buttonCenterX(button) {
    return R67.config.WIDTH + R67.config.PANEL_W / 2 + button.dx;
  },

  hitsButton(button, x, y) {
    const dx = x - this.buttonCenterX(button);
    const dy = y - button.y;
    const reach = button.r + 6;
    return dx * dx + dy * dy <= reach * reach;
  },

  hitsEngine(x, y) {
    return this.hitsButton(this.ENGINE, x, y);
  },

  hitsWiper(x, y) {
    return this.hitsButton(this.WIPER, x, y);
  },

  drawEngineButton(ctx, on) {
    const light = on ? "#39ff14" : R67.config.COLORS.danger;
    this.drawRoundButton(ctx, this.ENGINE, "MOTOR", on ? "ON" : "OFF", light);
  },

  // Con lluvia el aro parpadea en celeste para avisar que hay que limpiar
  drawWiperButton(ctx, raining, wiping, time) {
    const blink = raining && Math.floor(time * 3) % 2 === 0;
    const light = wiping ? "#7fdbff" : blink ? "#7fdbff" : raining ? "#2a6f8f" : "#221c44";
    this.drawRoundButton(ctx, this.WIPER, "LIMPIA", wiping ? "<>" : "||", light);
  },

  drawRoundButton(ctx, button, title, text, light) {
    const cx = this.buttonCenterX(button);
    const cy = button.y;
    const r = button.r;

    this.label(ctx, title, cx, cy - r - 10, 7, "#b37a00");

    ctx.fillStyle = "#221c44";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0a0a12";
    ctx.beginPath();
    ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = light;
    ctx.lineWidth = 2;
    ctx.stroke();

    this.label(ctx, text, cx, cy + 1, 9, light);
  },

  label(ctx, str, x, y, size, color, align) {
    ctx.font = size + "px " + R67.config.FONT;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  },

  drawSpeedometer(ctx, cx, cy, r) {
    const col = R67.config.COLORS;
    const maxSpeed = R67.config.MPH_GAUGE_MAX;
    const start = Math.PI * 0.75;
    const sweep = Math.PI * 1.5;

    ctx.fillStyle = "#0a0a12";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#221c44";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Marcas: las del último tramo van en rojo
    const ticks = 11;
    for (let i = 0; i <= ticks; i++) {
      const a = start + (sweep * i) / ticks;
      const inner = i % 2 === 0 ? r - 12 : r - 8;
      ctx.strokeStyle = i >= ticks - 2 ? col.danger : col.text;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
      ctx.stroke();
    }

    this.label(ctx, String(Math.round(this.shownSpeed)).padStart(3, "0"), cx, cy + 26, 12, col.accent);
    this.label(ctx, "MPH", cx, cy + 42, 6, col.text);

    // Aguja
    const frac = Math.max(0, Math.min(1, this.shownSpeed / maxSpeed));
    const a = start + sweep * frac;
    ctx.strokeStyle = col.danger;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (r - 16), cy + Math.sin(a) * (r - 16));
    ctx.stroke();
    ctx.fillStyle = col.text;
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
  },

  drawBox(ctx, x, y, w, h, title, value, valueSize) {
    const col = R67.config.COLORS;
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#221c44";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    this.label(ctx, title, x + w / 2, y + 12, 7, "#b37a00");
    this.label(ctx, value, x + w / 2, y + 34, valueSize, col.accent);
  },

  drawLanes(ctx, cx, y, lane, lightsOn) {
    const c = R67.config;
    const bw = 20;
    const gap = 6;
    const total = c.LANES * bw + (c.LANES - 1) * gap;
    this.label(ctx, "CARRIL", cx - total / 2, y, 7, "#b37a00", "left");
    // Testigo de las luces
    this.label(ctx, "LUZ", cx + total / 2 - 12, y, 7, "#b37a00", "right");
    ctx.fillStyle = lightsOn ? "#ffd27a" : "#221c44";
    ctx.fillRect(cx + total / 2 - 8, y - 4, 8, 8);
    for (let i = 0; i < c.LANES; i++) {
      ctx.fillStyle = i === lane ? c.COLORS.player : "#221c44";
      ctx.fillRect(cx - total / 2 + i * (bw + gap), y + 12, bw, 12);
    }
  },

  drawRadio(ctx, x, y, w, time) {
    const c = R67.config;
    const audio = R67.audio;
    const on = audio.isPlaying() && !audio.isMuted();
    // En la persecución la radio se queda pegada en otra canción y todo se pone rojo
    const chase = audio.chasing;
    const lcdOn = chase ? "#ff3355" : "#39ff14";
    const lcdOff = chase ? "#5a1a24" : "#3a5a1a";
    const ink = on ? lcdOn : lcdOff;

    this.label(ctx, "RADIO", x + w / 2, y, 7, "#b37a00");

    // Pantalla
    const sy = y + 12;
    const sh = 46;
    ctx.fillStyle = chase ? "#1f0d10" : "#0d1f0d";
    ctx.fillRect(x, sy, w, sh);
    ctx.strokeStyle = "#221c44";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, sy, w, sh);

    this.label(ctx, "FM " + audio.trackFreq(), x + 6, sy + 13, 8, ink, "left");
    this.label(ctx, audio.isMuted() ? "MUTE" : on ? "ON" : "OFF", x + w - 6, sy + 13, 8, ink, "right");

    // Título de la canción desplazándose dentro de la pantalla
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 4, sy + 22, w - 8, 20);
    ctx.clip();
    ctx.font = "8px " + c.FONT;
    const title = audio.trackTitle();
    const loop = ctx.measureText(title).width + w;
    const shift = on ? (time * 30) % loop : 0;
    this.label(ctx, title, x + (on ? w : 6) - shift, sy + 33, 8, ink, "left");
    ctx.restore();

    // Ecualizador: barras animadas mientras suena, planas si no
    const bars = 10;
    const bw = 9;
    const gap = (w - bars * bw) / (bars - 1);
    const base = y + 112;
    for (let i = 0; i < bars; i++) {
      const wave = 0.5 + 0.5 * Math.sin(time * (6 + i * 1.7) + i * 2);
      const blocks = on ? 1 + Math.round(wave * 8) : 1;
      for (let b = 0; b < blocks; b++) {
        ctx.fillStyle = chase
          ? b >= 5 ? "#ff8095" : lcdOn
          : b >= 7 ? c.COLORS.danger : b >= 5 ? c.COLORS.accent : lcdOn;
        if (!on) ctx.fillStyle = lcdOff;
        ctx.fillRect(Math.round(x + i * (bw + gap)), base - b * 5, bw, 4);
      }
    }

    // Progreso de la canción
    const cur = audio.musicTime();
    const dur = audio.musicDuration();
    const py = y + 124;
    ctx.fillStyle = "#221c44";
    ctx.fillRect(x, py, w, 4);
    if (dur > 0) {
      ctx.fillStyle = ink;
      ctx.fillRect(x, py, Math.round(w * Math.min(1, cur / dur)), 4);
    }
    this.label(ctx, this.clock(cur), x, py + 16, 7, "#b37a00", "left");
    this.label(ctx, this.clock(dur), x + w, py + 16, 7, "#b37a00", "right");
  },

  clock(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  },
};
