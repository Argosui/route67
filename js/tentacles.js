// Ataques de tentáculo (noche 6, en la huida): reemplazan al fantasma. Hay dos:
//  - "lane": asoma detrás de ti en tu carril, el carril se pone rojo y azota hacia
//    adelante a lo largo de todo el carril. Se esquiva cambiando de carril.
//  - "sweep": la fila donde estás se pone roja y un tentáculo la barre de lado a
//    lado. Se esquiva avanzando o retrocediendo.
// Al golpear suena el impacto; hacen daño mientras están estirados o recogiéndose.
R67.tentacles = {
  active: null, // { kind, x, y, t, fromLeft, struck }
  nextIn: 0, // segundos hasta el siguiente

  reset() {
    this.active = null;
    this.nextIn = R67.config.TENTACLE.FIRST_DELAY;
  },

  interval() {
    const g = R67.config.TENTACLE;
    return g.INTERVAL_MIN + Math.random() * (g.INTERVAL_MAX - g.INTERVAL_MIN);
  },

  // player: para apuntar a su carril o a su fila. spawn: false para que no empiece
  // otro (al final de la huida)
  update(dt, player, spawn) {
    const g = R67.config.TENTACLE;
    const a = this.active;
    if (!a) {
      if (!spawn) return;
      this.nextIn -= dt;
      if (this.nextIn <= 0) {
        this.active = {
          kind: Math.random() < g.SWEEP_CHANCE ? "sweep" : "lane",
          x: R67.laneCenter(player.lane),
          y: player.y,
          t: 0,
          fromLeft: Math.random() < 0.5,
          struck: false,
        };
      }
      return;
    }
    a.t += dt;
    if (!a.struck && a.t >= g.WARN) {
      a.struck = true;
      R67.audio.playSlam();
    }
    if (a.t >= g.WARN + g.LASH + g.HOLD + g.RETRACT) {
      this.active = null;
      this.nextIn = this.interval();
    }
  },

  // Qué tan estirado está: -1 durante el aviso, de 0 (recogido) a 1 (estirado)
  reach(a) {
    const g = R67.config.TENTACLE;
    let t = a.t - g.WARN;
    if (t < 0) return -1;
    if (t < g.LASH) return t / g.LASH;
    t -= g.LASH;
    if (t < g.HOLD) return 1;
    t -= g.HOLD;
    return 1 - Math.min(1, t / g.RETRACT);
  },

  // Azote por carril: altura de la punta (asoma abajo y sube de golpe)
  tipY(a) {
    const c = R67.config;
    const low = c.HEIGHT - 40;
    const r = this.reach(a);
    if (r < 0) return low + Math.sin(a.t * 12) * 6;
    return low + (-20 - low) * r;
  },

  // Barrido: X de la punta (asoma por un lado y cruza hasta el otro)
  tipX(a) {
    const w = R67.config.WIDTH;
    const from = a.fromLeft ? -30 : w + 30;
    const to = a.fromLeft ? w + 30 : -30;
    const dir = a.fromLeft ? 1 : -1;
    const r = this.reach(a);
    if (r < 0) return from + dir * (40 + Math.sin(a.t * 12) * 6);
    return from + (to - from) * r;
  },

  hits(box) {
    const a = this.active;
    if (!a || this.reach(a) < 0) return false;
    const g = R67.config.TENTACLE;
    if (a.kind === "lane") {
      const half = g.WIDTH / 2 - 4;
      return box.x < a.x + half && box.x + box.w > a.x - half && this.tipY(a) < box.y + box.h;
    }
    const half = g.BAND / 2 - 4;
    if (box.y >= a.y + half || box.y + box.h <= a.y - half) return false;
    const x = this.tipX(a);
    return a.fromLeft ? x > box.x : x < box.x + box.w;
  },

  draw(ctx, time) {
    const a = this.active;
    if (!a) return;
    const c = R67.config;
    const g = c.TENTACLE;

    // Aviso: el carril o la fila parpadea en rojo, más rápido justo antes del golpe
    if (a.t < g.WARN) {
      const rate = g.WARN - a.t < 0.35 ? 24 : 12;
      if (Math.floor(a.t * rate) % 2 === 0) {
        ctx.fillStyle = "rgba(255, 30, 60, 0.2)";
        if (a.kind === "lane") ctx.fillRect(a.x - c.LANE_W / 2, 0, c.LANE_W, c.HEIGHT);
        else ctx.fillRect(0, a.y - g.BAND / 2, c.WIDTH, g.BAND);
      }
    }
    if (a.kind === "lane") {
      R67.monster.drawTentacle(ctx, a.x, c.HEIGHT + 30, a.x, this.tipY(a), g.WIDTH, time, a.x);
    } else {
      const from = a.fromLeft ? -40 : c.WIDTH + 40;
      R67.monster.drawTentacle(ctx, from, a.y, this.tipX(a), a.y, g.BAND * 0.7, time, a.y);
    }
  },
};
