// Obstáculos: aparecen arriba por filas y bajan a la velocidad de la carretera.
// Para agregar un tipo nuevo: crea su sprite en sprites.js y añádelo a TYPES.
R67.obstacles = {
  TYPES: [
    { sprite: "pothole", weight: 4 },
    { sprite: "cone", weight: 2 },
    { sprite: "barrier", weight: 2.5 },
    { sprite: "sign", weight: 2 },
  ],

  list: [],
  sinceSpawn: 0,
  rowsSinceFuel: 0,

  reset() {
    this.list = [];
    this.sinceSpawn = 0;
    this.rowsSinceFuel = 0;
  },

  // difficulty: 0 (inicio) a 1 (velocidad máxima)
  // spawn: false para que no salgan filas nuevas (al llegar a la casa)
  update(dt, speed, difficulty, spawn) {
    const c = R67.config;
    const dist = speed * dt;

    for (const o of this.list) o.y += dist;
    this.list = this.list.filter((o) => o.y < c.HEIGHT + 80);

    if (!spawn) return;
    this.sinceSpawn += dist;
    const gap = c.GAP_START + (c.GAP_MIN - c.GAP_START) * difficulty;
    if (this.sinceSpawn >= gap) {
      this.sinceSpawn = 0;
      this.spawnRow(difficulty);
    }
  },

  // Bloquea de 1 a LANES-2 carriles: siempre quedan al menos dos salidas.
  spawnRow(difficulty) {
    const c = R67.config;
    const extraChance =
      c.EXTRA_CHANCE_START + (c.EXTRA_CHANCE_MAX - c.EXTRA_CHANCE_START) * difficulty;
    let count = 1;
    for (let i = 0; i < c.LANES - 3; i++) {
      if (Math.random() < extraChance) count++;
    }

    const lanes = [];
    for (let i = 0; i < c.LANES; i++) lanes.push(i);
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }

    for (let i = 0; i < count; i++) {
      this.list.push({
        sprite: this.pickType().sprite,
        x: R67.laneCenter(lanes[i]),
        y: -60,
      });
    }

    // Bidón de gasolina en uno de los carriles que quedaron libres
    const f = c.FUEL;
    this.rowsSinceFuel++;
    const due = this.rowsSinceFuel >= f.MAX_ROWS;
    const lucky = this.rowsSinceFuel >= f.MIN_ROWS && Math.random() < f.CHANCE;
    if (due || lucky) {
      this.rowsSinceFuel = 0;
      this.list.push({ sprite: "fuel", pickup: true, x: R67.laneCenter(lanes[count]), y: -60 });
    }
  },

  pickType() {
    const total = this.TYPES.reduce((sum, t) => sum + t.weight, 0);
    let r = Math.random() * total;
    for (const t of this.TYPES) {
      r -= t.weight;
      if (r <= 0) return t;
    }
    return this.TYPES[0];
  },

  // padX / padY > 0 encogen la caja del objeto por cada lado; < 0 la agrandan
  overlaps(o, box, padX, padY) {
    const s = R67.sprites[o.sprite];
    const ox = o.x - s.w / 2 + padX;
    const oy = o.y - s.h / 2 + padY;
    const ow = s.w - padX * 2;
    const oh = s.h - padY * 2;
    return box.x < ox + ow && box.x + box.w > ox && box.y < oy + oh && box.y + box.h > oy;
  },

  // La caja de choque se recorta más a los lados que arriba/abajo,
  // para que rozar un obstáculo al cambiar de carril no cuente
  hits(box) {
    const h = R67.config.HITBOX;
    return this.list.some((o) => {
      if (o.pickup) return false;
      const s = R67.sprites[o.sprite];
      return this.overlaps(o, box, s.w * h.OBSTACLE_SHRINK_X, s.h * h.OBSTACLE_SHRINK_Y);
    });
  },

  // Quita los bidones que toca el jugador y devuelve cuántos recogió.
  // La caja se agranda un poco para que recogerlos sea generoso.
  collect(box) {
    const before = this.list.length;
    this.list = this.list.filter((o) => !(o.pickup && this.overlaps(o, box, -4, -4)));
    return before - this.list.length;
  },

  draw(ctx) {
    for (const o of this.list) {
      if (o.pickup) {
        // Resplandor para distinguir lo que se recoge de lo que se esquiva
        ctx.save();
        ctx.shadowColor = R67.config.COLORS.text;
        ctx.shadowBlur = 12;
        R67.sprites[o.sprite].draw(ctx, o.x, o.y);
        ctx.restore();
      } else {
        R67.sprites[o.sprite].draw(ctx, o.x, o.y);
      }
    }
  },
};
