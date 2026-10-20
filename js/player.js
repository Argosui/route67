// Carro del jugador: cambia de carril y se desliza hacia el centro del carril destino.
R67.player = {
  lane: 1,
  x: 0,
  y: 0,
  lightsOn: true,
  braking: false, // luces de freno encendidas
  angle: 0, // giro en radianes (al dar la vuelta en la noche 6)
  vspeed: 0, // px/s adelante/atrás; más rápido en la huida de la noche 6

  reset() {
    this.lane = Math.floor(R67.config.LANES / 2);
    this.x = R67.laneCenter(this.lane);
    this.y = R67.config.PLAYER_Y;
    this.lightsOn = true;
    this.braking = false;
    this.angle = 0;
    this.vspeed = R67.config.PLAYER_VSPEED;
  },

  move(dir) {
    const next = this.lane + dir;
    if (next < 0 || next >= R67.config.LANES) return;
    this.lane = next;
  },

  // axisY: -1 adelante, 1 atrás, 0 quieto
  update(dt, axisY) {
    const c = R67.config;
    const target = R67.laneCenter(this.lane);
    const step = c.PLAYER_SLIDE_SPEED * dt;
    const diff = target - this.x;
    this.x = Math.abs(diff) <= step ? target : this.x + Math.sign(diff) * step;

    this.y += axisY * this.vspeed * dt;
    this.y = Math.max(c.PLAYER_Y_MIN, Math.min(c.PLAYER_Y_MAX, this.y));
  },

  // Caja de colisión un poco más chica que el sprite para que los roces no cuenten
  hitbox() {
    const s = R67.sprites.car;
    const h = R67.config.HITBOX;
    return {
      x: this.x - s.w / 2 + h.PLAYER_PAD_X,
      y: this.y - s.h / 2 + h.PLAYER_PAD_Y,
      w: s.w - h.PLAYER_PAD_X * 2,
      h: s.h - h.PLAYER_PAD_Y * 2,
    };
  },

  toggleLights() {
    this.lightsOn = !this.lightsOn;
  },

  draw(ctx) {
    ctx.save();
    if (this.angle) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.translate(-this.x, -this.y);
    }
    if (this.lightsOn) this.drawBeam(ctx);
    if (this.braking) this.drawBrakeGlow(ctx);
    R67.sprites.car.draw(ctx, this.x, this.y, R67.config.COLORS.player);
    ctx.restore();
  },

  // Resplandor rojo de las luces de freno sobre el asfalto
  drawBrakeGlow(ctx) {
    const rear = this.y + R67.sprites.car.h / 2;
    const r = 40;
    const glow = ctx.createRadialGradient(this.x, rear, 0, this.x, rear, r);
    glow.addColorStop(0, "rgba(255, 0, 51, 0.55)");
    glow.addColorStop(1, "rgba(255, 0, 51, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(this.x - r, rear - r, r * 2, r * 2);
  },

  // Haz de los faros hacia adelante
  drawBeam(ctx) {
    const front = this.y - R67.sprites.car.h / 2;
    const reach = 130;
    const beam = ctx.createLinearGradient(0, front - reach, 0, front);
    beam.addColorStop(0, "rgba(255, 243, 176, 0)");
    beam.addColorStop(1, "rgba(255, 243, 176, 0.3)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(this.x - 12, front);
    ctx.lineTo(this.x + 12, front);
    ctx.lineTo(this.x + 38, front - reach);
    ctx.lineTo(this.x - 38, front - reach);
    ctx.closePath();
    ctx.fill();
  },
};
