// Enemigo fantasma: de vez en cuando aparece adelante, en el carril del jugador,
// flota un momento como aviso y luego se lanza hacia abajo por ese carril.
// Cuanto más puntaje, más seguido aparece. Solo hace daño mientras se lanza.
R67.ghost = {
  active: null, // { x, y, t, diving }
  nextIn: 0, // segundos hasta el siguiente

  reset() {
    this.active = null;
    this.nextIn = R67.config.GHOST.FIRST_DELAY;
  },

  // Segundos de espera según el puntaje, con algo de azar para que no sea predecible
  interval(score) {
    const g = R67.config.GHOST;
    const k = Math.min(1, score / g.SCORE_FULL);
    const base = g.INTERVAL_START + (g.INTERVAL_MIN - g.INTERVAL_START) * k;
    return base * (0.7 + Math.random() * 0.6);
  },

  update(dt, score, playerLane) {
    const c = R67.config;
    const g = c.GHOST;
    const a = this.active;

    if (!a) {
      this.nextIn -= dt;
      if (this.nextIn <= 0) {
        this.active = { x: R67.laneCenter(playerLane), y: g.HOVER_Y, t: 0, diving: false };
        R67.audio.playGhost();
      }
      return;
    }

    a.t += dt;
    if (!a.diving) {
      if (a.t >= g.HOVER_TIME) a.diving = true;
      return;
    }

    a.y += g.DIVE_SPEED * dt;
    if (a.y > c.HEIGHT + 80) {
      this.active = null;
      this.nextIn = this.interval(score);
    }
  },

  hits(box) {
    const a = this.active;
    if (!a || !a.diving) return false;
    const s = R67.sprites.ghost;
    const pad = 4;
    const gx = a.x - s.w / 2 + pad;
    const gy = a.y - s.h / 2 + pad;
    const gw = s.w - pad * 2;
    const gh = s.h - pad * 2;
    return box.x < gx + gw && box.x + box.w > gx && box.y < gy + gh && box.y + box.h > gy;
  },

  draw(ctx) {
    const a = this.active;
    if (!a) return;
    const c = R67.config;
    const g = c.GHOST;
    const sprite = R67.sprites.ghost;

    ctx.save();
    ctx.shadowColor = "#b388ff";
    ctx.shadowBlur = 14;

    if (!a.diving) {
      // Aviso: el carril amenazado parpadea, cada vez más rápido
      const left = g.HOVER_TIME - a.t;
      const rate = left < 0.4 ? 24 : 12;
      if (Math.floor(a.t * rate) % 2 === 0) {
        ctx.fillStyle = "rgba(179, 136, 255, 0.14)";
        ctx.fillRect(a.x - c.LANE_W / 2, 0, c.LANE_W, c.HEIGHT);
      }
      // Aparece desvaneciéndose y flota; tiembla justo antes de lanzarse
      ctx.globalAlpha = Math.min(1, a.t / 0.3) * 0.85;
      const bob = Math.sin(a.t * 8) * 4;
      const jitter = left < 0.25 ? (Math.random() - 0.5) * 4 : 0;
      sprite.draw(ctx, a.x + jitter, a.y + bob);
    } else {
      // Estela al caer
      for (let i = 3; i >= 1; i--) {
        ctx.globalAlpha = 0.18 * (4 - i);
        sprite.draw(ctx, a.x, a.y - i * 22);
      }
      ctx.globalAlpha = 1;
      sprite.draw(ctx, a.x, a.y);
    }
    ctx.restore();
  },
};
