// Fondo: pasto, asfalto, bordes y líneas de carril que se desplazan.
R67.road = {
  offset: 0,

  reset() {
    this.offset = 0;
  },

  update(dt, speed) {
    this.offset = (this.offset + speed * dt) % R67.config.DASH_PERIOD;
  },

  draw(ctx) {
    const c = R67.config;
    const col = c.COLORS;
    const period = c.DASH_PERIOD;

    // Pasto con bandas para dar sensación de movimiento
    ctx.fillStyle = col.grass;
    ctx.fillRect(0, 0, c.WIDTH, c.HEIGHT);
    ctx.fillStyle = col.grassDark;
    for (let y = -period + this.offset; y < c.HEIGHT; y += period) {
      ctx.fillRect(0, Math.round(y), c.WIDTH, period / 2);
    }

    // Asfalto
    ctx.fillStyle = col.road;
    ctx.fillRect(c.ROAD_X, 0, c.ROAD_W, c.HEIGHT);

    // Bordillos rojo/blanco
    const curbW = 8;
    const curbH = period / 4;
    for (let y = -period + this.offset, i = 0; y < c.HEIGHT; y += curbH, i++) {
      ctx.fillStyle = i % 2 === 0 ? col.curbA : col.curbB;
      ctx.fillRect(c.ROAD_X - curbW, Math.round(y), curbW, curbH);
      ctx.fillRect(c.ROAD_X + c.ROAD_W, Math.round(y), curbW, curbH);
    }

    // Líneas punteadas entre carriles
    ctx.fillStyle = col.dash;
    for (let lane = 1; lane < c.LANES; lane++) {
      const x = c.ROAD_X + lane * c.LANE_W - 3;
      for (let y = -period + this.offset; y < c.HEIGHT; y += period) {
        ctx.fillRect(x, Math.round(y), 6, period / 2);
      }
    }
  },
};
