// Lluvia: de la nada empieza a llover, el parabrisas se va mojando y la vista
// se pone borrosa hasta que pasas el limpiaparabrisas. Al parar de llover
// el agua se seca sola, pero despacio.
R67.weather = {
  raining: false,
  rainIn: 0, // segundos hasta que empiece a llover
  rainLeft: 0, // segundos que le quedan a la lluvia actual
  wet: 0, // 0 parabrisas limpio, 1 empapado
  wipeT: -1, // tiempo dentro de la pasada del limpiaparabrisas; -1 si está quieto
  dropSeed: 0, // cambia en cada pasada para que las gotas nuevas caigan en otro lado
  buffer: null, // canvas auxiliar para desenfocar la carretera
  storm: false, // llueve fuerte y sin parar (noche 6)

  reset() {
    const r = R67.config.RAIN;
    this.storm = false;
    this.raining = false;
    this.rainIn = r.MIN + Math.random() * (r.MAX - r.MIN);
    this.rainLeft = 0;
    this.wet = 0;
    this.wipeT = -1;
  },

  // Tormenta: empieza a llover ya y no para hasta el siguiente reset
  startStorm() {
    this.storm = true;
    this.raining = true;
    this.rainLeft = Infinity;
  },

  isWiping() {
    return this.wipeT >= 0;
  },

  // Una pulsación = una pasada. Si ya está pasando, no hace nada.
  wipe() {
    if (this.isWiping()) return;
    this.wipeT = 0;
  },

  // canRain: false en las noches sin lluvia (el limpiaparabrisas sigue funcionando)
  update(dt, canRain) {
    const r = R67.config.RAIN;

    if (this.raining) {
      this.rainLeft -= dt;
      this.wet = Math.min(1, this.wet + dt / r.WET_TIME);
      if (this.rainLeft <= 0) {
        this.raining = false;
        this.rainIn = r.MIN + Math.random() * (r.MAX - r.MIN);
      }
    } else {
      this.wet = Math.max(0, this.wet - dt / r.DRY_TIME);
      if (canRain) this.rainIn -= dt;
      if (this.rainIn <= 0) {
        this.raining = true;
        this.rainLeft = r.DURATION_MIN + Math.random() * (r.DURATION_MAX - r.DURATION_MIN);
      }
    }

    if (this.isWiping()) {
      const half = r.WIPE_TIME / 2;
      const before = this.wipeT;
      this.wipeT += dt;
      // A mitad de la pasada la hoja ya barrió el parabrisas
      if (before < half && this.wipeT >= half) {
        this.wet = 0;
        this.dropSeed++;
      }
      if (this.wipeT >= r.WIPE_TIME) this.wipeT = -1;
    }
  },

  // Gotas de lluvia cayendo sobre la carretera
  drawRain(ctx, time) {
    if (!this.raining) return;
    const c = R67.config;
    // Con tormenta cae el doble, más rápido y más inclinada
    const drops = this.storm ? 200 : 90;
    const slant = this.storm ? 7 : 3;
    const fall = this.storm ? 1300 : 900;
    ctx.strokeStyle = "rgba(180, 200, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < drops; i++) {
      const x = (i * 47.3 + time * 60 * slant) % c.WIDTH;
      const y = (i * 91.7 + time * fall) % c.HEIGHT;
      ctx.moveTo(x, y);
      ctx.lineTo(x - slant, y + 14);
    }
    ctx.stroke();
  },

  // Desenfoca lo que ya está dibujado de la carretera según lo mojado del parabrisas
  blurPlayfield(ctx, canvas) {
    const c = R67.config;
    if (this.wet < 0.02) return;
    if (!this.buffer) {
      this.buffer = document.createElement("canvas");
      this.buffer.width = c.WIDTH;
      this.buffer.height = c.HEIGHT;
    }
    const b = this.buffer.getContext("2d");
    b.clearRect(0, 0, c.WIDTH, c.HEIGHT);
    b.drawImage(canvas, 0, 0, c.WIDTH, c.HEIGHT, 0, 0, c.WIDTH, c.HEIGHT);

    ctx.save();
    ctx.filter = "blur(" + (this.wet * c.RAIN.BLUR_MAX).toFixed(1) + "px)";
    ctx.drawImage(this.buffer, 0, 0);
    ctx.restore();
  },

  // Número pseudoaleatorio estable entre 0 y 1 para la gota i
  rand(i, k) {
    const n = Math.sin((i + this.dropSeed * 131) * 12.9898 + k * 78.233) * 43758.5453;
    return n - Math.floor(n);
  },

  // Gotas pegadas al parabrisas (más cuanto más mojado) y la hoja del limpiaparabrisas
  drawWindshield(ctx) {
    const c = R67.config;
    const total = 45;
    const visible = Math.floor(this.wet * total);
    for (let i = 0; i < visible; i++) {
      const x = this.rand(i, 1) * c.WIDTH;
      const y = this.rand(i, 2) * c.HEIGHT;
      const r = 3 + this.rand(i, 3) * 7;
      ctx.fillStyle = "rgba(200, 220, 255, 0.16)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fillRect(Math.round(x - r / 3), Math.round(y - r / 2), 2, 2);
    }

    if (!this.isWiping()) return;
    // La hoja gira desde abajo al centro, de izquierda a derecha
    const k = this.wipeT / c.RAIN.WIPE_TIME;
    const angle = Math.PI + Math.PI * k;
    const px = c.WIDTH / 2;
    const py = c.HEIGHT + 10;
    const len = 720;
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#08080d";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len);
    ctx.stroke();
    ctx.strokeStyle = "#3a3a4a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  },
};
