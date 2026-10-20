// Niebla y sombras: mientras la radio está apagada la carretera se va llenando
// de niebla (más espesa adelante, para tapar los obstáculos) y a los lados
// empiezan a asomarse sombras negras. Al prender la radio todo se disipa.
// Las sombras son solo ambientación: no chocan.
R67.fog = {
  level: 0, // 0 sin niebla, 1 niebla máxima
  shadows: [], // { x, y, t, life, flip }
  shadowIn: 0, // segundos hasta la próxima sombra

  reset() {
    this.level = 0;
    this.shadows = [];
    this.shadowIn = 0;
  },

  update(dt, radioOff, speed) {
    const c = R67.config;
    const f = c.FOG;
    this.level = radioOff
      ? Math.min(1, this.level + dt / f.FADE_IN)
      : Math.max(0, this.level - dt / f.FADE_OUT);

    // Las sombras están paradas al borde de la carretera: bajan con ella
    for (const s of this.shadows) {
      s.t += dt;
      s.y += speed * dt;
    }
    this.shadows = this.shadows.filter((s) => s.t < s.life && s.y < c.HEIGHT + 60);

    if (this.level < f.SHADOW_FROM) return;
    this.shadowIn -= dt;
    if (this.shadowIn <= 0) {
      // Cuanto más espesa la niebla, más seguido salen
      this.shadowIn = (0.5 + Math.random() * 1.2) / this.level;
      this.spawnShadow();
    }
  },

  spawnShadow() {
    const c = R67.config;
    const left = Math.random() < 0.5;
    const x = left
      ? c.ROAD_X - 4 + Math.random() * 10
      : c.ROAD_X + c.ROAD_W + 4 - Math.random() * 10;
    this.shadows.push({
      x,
      y: 60 + Math.random() * 300,
      t: 0,
      life: 2.5 + Math.random() * 1.5,
      flip: left ? 1 : -1, // se inclinan hacia la carretera
    });
  },

  draw(ctx, dist, time) {
    if (this.level <= 0 && this.shadows.length === 0) return;
    this.drawHaze(ctx, dist, time);
    for (const s of this.shadows) this.drawShadow(ctx, s, time);
  },

  drawHaze(ctx, dist, time) {
    const c = R67.config;
    const f = c.FOG;
    const lv = this.level;
    if (lv <= 0) return;
    const rgb = f.COLOR;

    // Velo: una pared sólida adelante que se abre recién cerca del carro
    const haze = ctx.createLinearGradient(0, 0, 0, c.PLAYER_Y);
    const top = "rgba(" + rgb + ", " + f.TOP_ALPHA * lv + ")";
    haze.addColorStop(0, top);
    haze.addColorStop(f.THICK_UNTIL, top);
    haze.addColorStop(1, "rgba(" + rgb + ", " + f.BOTTOM_ALPHA * lv + ")");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, c.WIDTH, c.HEIGHT);

    // Bancos de niebla que bajan con la carretera y se mecen de lado
    const span = c.HEIGHT + 240;
    for (let i = 0; i < 12; i++) {
      const r = 70 + ((i * 29) % 50);
      const x = ((i * 83.7 + time * (8 + (i % 3) * 5)) % (c.WIDTH + 200)) - 100;
      const y = ((i * 137.3 + dist * 0.8) % span) - 120;
      const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
      blob.addColorStop(0, "rgba(" + rgb + ", " + 0.35 * lv + ")");
      blob.addColorStop(1, "rgba(" + rgb + ", 0)");
      ctx.fillStyle = blob;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  },

  // Silueta negra alta, con brazos largos y ojos apenas visibles
  drawShadow(ctx, s, time) {
    const fadeIn = Math.min(1, s.t / 0.6);
    const fadeOut = Math.min(1, (s.life - s.t) / 0.8);
    const alpha = Math.min(fadeIn, fadeOut) * Math.max(this.level, 0.0001);
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(s.x), Math.round(s.y));
    ctx.scale(s.flip, 1);
    ctx.rotate(0.12 + Math.sin(time * 2 + s.y) * 0.05);
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#020205";

    ctx.fillRect(-5, -30, 10, 10); // cabeza
    ctx.fillRect(-8, -20, 16, 18); // torso
    ctx.fillRect(-6, -2, 12, 22); // piernas, unidas como una mancha
    ctx.fillRect(-11, -18, 3, 28); // brazo
    ctx.fillRect(8, -18, 3, 22); // brazo que se estira hacia la carretera
    ctx.fillRect(11, 2, 6, 3); // dedos

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(230, 230, 255, 0.7)";
    ctx.fillRect(-3, -26, 2, 2);
    ctx.fillRect(1, -26, 2, 2);
    ctx.restore();
  },
};
