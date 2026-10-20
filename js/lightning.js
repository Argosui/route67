// Rayos de la tormenta (noche 6): de vez en cuando cae uno, la carretera se pone
// blanca un instante, luego negra por medio segundo y poco a poco vuelve a verse.
// Mientras tanto el jugador maneja a ciegas.
R67.lightning = {
  t: -1, // segundos dentro del rayo actual; -1 si no hay
  nextIn: 0, // segundos hasta el siguiente
  boltX: 0, // dónde cae el relámpago dibujado
  seed: 0,

  reset() {
    this.t = -1;
    this.schedule();
  },

  schedule() {
    const l = R67.config.LIGHTNING;
    this.nextIn = l.MIN + Math.random() * (l.MAX - l.MIN);
  },

  strike() {
    this.t = 0;
    this.boltX = 60 + Math.random() * (R67.config.WIDTH - 120);
    this.seed = Math.random() * 1000;
    R67.audio.playThunder();
  },

  // active: si pueden caer rayos nuevos (el que ya cayó termina igual)
  update(dt, active) {
    const l = R67.config.LIGHTNING;
    if (this.t >= 0) {
      this.t += dt;
      if (this.t > l.FLASH + l.BLACK + l.FADE) this.t = -1;
    }
    if (!active) return;
    this.nextIn -= dt;
    if (this.nextIn <= 0) {
      this.strike();
      this.schedule();
    }
  },

  draw(ctx) {
    if (this.t < 0) return;
    const c = R67.config;
    const l = c.LIGHTNING;
    const t = this.t;

    if (t < l.FLASH) {
      // Destello que parpadea dos veces, con el relámpago en zigzag
      const alpha = t < 0.05 || t > 0.08 ? 0.9 : 0.45;
      ctx.fillStyle = "rgba(235, 240, 255, " + alpha + ")";
      ctx.fillRect(0, 0, c.WIDTH, c.HEIGHT);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      let x = this.boltX;
      ctx.moveTo(x, 0);
      for (let y = 30, i = 0; y < c.HEIGHT * 0.7; y += 30, i++) {
        x += Math.sin(this.seed + i * 2.3) * 22;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      return;
    }
    const k = t < l.FLASH + l.BLACK ? 1 : 1 - (t - l.FLASH - l.BLACK) / l.FADE;
    ctx.fillStyle = "rgba(0, 0, 0, " + Math.max(0, k) + ")";
    ctx.fillRect(0, 0, c.WIDTH, c.HEIGHT);
  },
};
