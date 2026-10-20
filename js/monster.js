// La criatura de la noche 6: una masa de carne roja llena de dientes y tentáculos,
// sin ojos, que vive debajo de la casa del final. Primero le salen tentáculos a la
// casa (drawAwakening) y en la huida te persigue pegada a la parte de abajo (draw).
// Se dibuja con círculos en capas para que se vea orgánica y viva.
R67.monster = {
  t: 0, // segundos desde que empezó la huida
  retreating: 0, // segundos quedándose atrás al final de la huida; 0 si persigue

  FLESH: { dark: "#3a0510", base: "#a3122a", light: "#e0435a", tooth: "#f0e6d8" },

  reset() {
    this.t = 0;
    this.retreating = 0;
  },

  update(dt) {
    this.t += dt;
    if (this.retreating > 0) this.retreating += dt;
  },

  retreat() {
    if (this.retreating === 0) this.retreating = 0.0001;
  },

  // Borde de arriba de la masa: sube al aparecer, arremete de vez en cuando
  // hacia el carro y al final se va quedando atrás
  edge() {
    const m = R67.config.MONSTER;
    const rise = Math.max(0, 1 - this.t / m.RISE);
    const surge = Math.pow(Math.max(0, Math.sin(this.t * 1.6)), 2) * m.SURGE;
    return m.Y + rise * 160 - surge + this.retreating * 140;
  },

  // Te atrapa si la parte de atrás del carro se mete en la masa
  catches(box) {
    return this.retreating === 0 && box.y + box.h > this.edge() + 6;
  },

  // Un tentáculo de (x0, y0) a (x1, y1) que se mece y se afina hacia la punta.
  // w: grosor en la base. seed: desfase para que cada uno se mueva distinto.
  drawTentacle(ctx, x0, y0, x1, y1, w, time, seed) {
    const f = this.FLESH;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const n = Math.max(6, Math.floor(len / 7));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const wave = Math.sin(time * 6 + seed + k * 5) * Math.min(14, len * 0.12) * k;
      pts.push({ x: x0 + dx * k + nx * wave, y: y0 + dy * k + ny * wave, r: (w * (1 - k * 0.75)) / 2 });
    }
    // Contorno, carne y brillo, en tres pasadas
    const passes = [
      [f.dark, 2, 0],
      [f.base, 0, 0],
      [f.light, -0.6, -0.25],
    ];
    for (const [color, grow, shift] of passes) {
      ctx.fillStyle = color;
      for (const p of pts) {
        const r = grow < 0 ? p.r * 0.35 : p.r + grow;
        ctx.beginPath();
        ctx.arc(p.x + shift * p.r, p.y + shift * p.r, Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Ventosas con dientes a lo largo
    ctx.fillStyle = f.tooth;
    for (let i = 2; i < pts.length - 1; i += 3) {
      ctx.fillRect(Math.round(pts[i].x - 1), Math.round(pts[i].y - 1), 2, 2);
    }
    // Punta con una boquita abierta
    const tip = pts[pts.length - 1];
    ctx.fillStyle = f.dark;
    ctx.fillRect(Math.round(tip.x - 3), Math.round(tip.y - 2), 6, 4);
    ctx.fillStyle = f.tooth;
    ctx.fillRect(Math.round(tip.x - 3), Math.round(tip.y - 2), 1, 2);
    ctx.fillRect(Math.round(tip.x + 2), Math.round(tip.y - 2), 1, 2);
  },

  // Bolas de carne que laten. blobs: [{ x, y, r }]
  drawFlesh(ctx, blobs) {
    const f = this.FLESH;
    for (const [color, grow] of [
      [f.dark, 3],
      [f.base, 0],
    ]) {
      ctx.fillStyle = color;
      for (const b of blobs) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + grow, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = f.light;
    for (const b of blobs) {
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // Fauces con dientes que se abren y cierran
  drawMaw(ctx, x, y, w, open) {
    const f = this.FLESH;
    const h = 6 + open * 22;
    ctx.fillStyle = "#12020a";
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = f.tooth;
    const teeth = Math.floor(w / 9);
    for (let i = 0; i < teeth; i++) {
      const tx = x - w / 2 + 5 + i * ((w - 10) / (teeth - 1));
      const edge = Math.sqrt(Math.max(0, 1 - Math.pow((tx - x) / (w / 2), 2))) * (h / 2);
      ctx.beginPath();
      ctx.moveTo(tx - 3, y - edge);
      ctx.lineTo(tx + 3, y - edge);
      ctx.lineTo(tx, y - edge + 7);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx - 3, y + edge);
      ctx.lineTo(tx + 3, y + edge);
      ctx.lineTo(tx, y + edge - 7);
      ctx.fill();
    }
  },

  // La criatura persiguiéndote desde abajo, con tentáculos que se estiran hacia el carro
  draw(ctx, time) {
    const c = R67.config;
    const top = this.edge();
    if (top > c.HEIGHT + 40) return;

    // Resplandor rojo para que se distinga aun en la oscuridad
    const glow = ctx.createLinearGradient(0, top - 90, 0, top + 20);
    glow.addColorStop(0, "rgba(163, 18, 42, 0)");
    glow.addColorStop(1, "rgba(163, 18, 42, 0.45)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, top - 90, c.WIDTH, 110);

    for (let i = 0; i < 6; i++) {
      const bx = 30 + i * 60;
      // Cortos, para que no parezca que alcanzan al carro sin atraparlo
      const reach = 25 + 20 * Math.sin(time * 2 + i * 1.7);
      this.drawTentacle(ctx, bx, top + 30, bx + Math.sin(time * 1.3 + i) * 30, top - reach, 18, time, i * 2.1);
    }

    const blobs = [];
    for (let i = 0; i < 16; i++) {
      const r = 26 + 7 * Math.sin(time * 3 + i * 1.3);
      blobs.push({ x: -10 + i * 25, y: top + r * 0.8 + (i % 3) * 10, r });
      blobs.push({ x: 2 + i * 25, y: top + 50 + (i % 2) * 14, r: r + 6 });
    }
    this.drawFlesh(ctx, blobs);
    this.drawMaw(ctx, c.WIDTH / 2, top + 38, 90, 0.5 + 0.5 * Math.sin(time * 4));
    this.drawMaw(ctx, 70, top + 52, 44, 0.5 + 0.5 * Math.sin(time * 5 + 1));
    this.drawMaw(ctx, c.WIDTH - 70, top + 48, 44, 0.5 + 0.5 * Math.sin(time * 4.5 + 2));
  },

  // La casa despertando: le salen tentáculos por ventanas, puerta, chimenea y aleros.
  // (cx, cy): centro de la casa; k: 0 a 1 según lo despierta que esté.
  drawAwakening(ctx, cx, cy, sprite, k, time) {
    if (k <= 0) return;
    const w = sprite.w;
    const h = sprite.h;
    const l = cx - w / 2;
    const t = cy - h / 2;

    // Las ventanas se ponen rojas
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w);
    glow.addColorStop(0, "rgba(255, 30, 60, " + 0.35 * k + ")");
    glow.addColorStop(1, "rgba(255, 30, 60, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - w, cy - w, w * 2, w * 2);

    // [x, y] relativos al dibujo, dirección y largo máximo
    const origins = [
      [0.275, 0.66, -1, 0.6, 110],
      [0.725, 0.66, 1, 0.6, 110],
      [0.5, 0.86, 0, 1, 150],
      [0.76, 0.12, 0.4, -1, 90],
      [0.05, 0.43, -1, 0.2, 100],
      [0.95, 0.43, 1, 0.2, 100],
    ];
    origins.forEach(([fx, fy, dx, dy, len], i) => {
      const grow = Math.max(0, Math.min(1, k * 1.4 - i * 0.08));
      if (grow <= 0) return;
      const x0 = l + fx * w;
      const y0 = t + fy * h;
      const n = Math.hypot(dx, dy);
      const reach = len * grow;
      this.drawTentacle(ctx, x0, y0, x0 + (dx / n) * reach, y0 + (dy / n) * reach, 16 * grow + 4, time, i * 1.9);
    });

  },
};
