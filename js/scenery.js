// Ambientación al borde de la carretera: la estación Last Stop en la salida,
// postes de luz, letreros de millas y, en el modo historia, el fin de la calle con
// la casa de la entrega. Todo se coloca según la distancia recorrida,
// así que no guarda estado: basta con pasarle la distancia actual.
R67.scenery = {
  LIGHT_GAP: 320, // px entre postes (alternan de lado)
  STATION_GATE: 150, // distancia a la que está el arco de la estación

  // Convierte una posición de carretera (px desde la salida) a Y en pantalla
  screenY(d, dist) {
    return R67.config.PLAYER_Y - (d - dist);
  },

  // Rango de índices k (posición = k * gap) que caen en pantalla o cerca
  visibleRange(dist, gap) {
    const c = R67.config;
    return {
      from: Math.max(1, Math.ceil((dist - (c.HEIGHT - c.PLAYER_Y) - 120) / gap)),
      to: Math.floor((dist + c.PLAYER_Y + 120) / gap),
    };
  },

  // Lo que queda por debajo de obstáculos y carro.
  // house: { d, color, sprite, awake } con la distancia de la entrega, el sprite del
  // lugar (casa, granja, iglesia o faro) y, en la noche 6, lo despierta que está la
  // casa (0 a 1). null en modo infinito.
  drawUnder(ctx, dist, time, house) {
    this.drawStation(ctx, dist);
    this.drawLightPools(ctx, dist, time);
    this.drawMileSigns(ctx, dist, house);
    if (house) this.drawRoadEnd(ctx, dist, house, time);
  },

  // Lo que pasa por encima del carro
  drawOver(ctx, dist, time, house) {
    this.drawLampPosts(ctx, dist, time, house);
    this.drawGate(ctx, dist);
  },

  // Distancia donde se acaba la calle, o Infinity si no hay entrega
  roadEnd(house) {
    return house ? house.d + R67.config.ARRIVAL.END_GAP : Infinity;
  },

  // Uno de cada FLICKER_EVERY postes está fallando y parpadea.
  // Devuelve el brillo del poste k en este instante (de 0 a 1).
  FLICKER_EVERY: 3,

  brightness(k, time) {
    if (k % this.FLICKER_EVERY !== 0) return 1;
    const n = Math.sin(time * 23 + k * 7) + Math.sin(time * 37 + k * 3);
    return n > 0.2 ? 1 : 0.12;
  },

  drawLightPools(ctx, dist, time) {
    const c = R67.config;
    const r = this.visibleRange(dist, this.LIGHT_GAP);
    const radius = 90;
    for (let k = r.from; k <= r.to; k++) {
      const y = this.screenY(k * this.LIGHT_GAP, dist);
      const x = k % 2 === 0 ? c.ROAD_X + 40 : c.ROAD_X + c.ROAD_W - 40;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, "rgba(255, 176, 0, " + 0.24 * this.brightness(k, time) + ")");
      glow.addColorStop(1, "rgba(255, 176, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  },

  drawLampPosts(ctx, dist, time, house) {
    const c = R67.config;
    const r = this.visibleRange(dist, this.LIGHT_GAP);
    const end = this.roadEnd(house);
    for (let k = r.from; k <= r.to; k++) {
      if (k * this.LIGHT_GAP >= end - 20) break;
      const y = Math.round(this.screenY(k * this.LIGHT_GAP, dist));
      const left = k % 2 === 0;
      const poleX = left ? c.ROAD_X - 16 : c.ROAD_X + c.ROAD_W + 12;
      const dir = left ? 1 : -1;

      // Brazo y poste vistos desde arriba
      ctx.fillStyle = "#2b2b3a";
      ctx.fillRect(left ? poleX : poleX - 28, y - 1, 32, 2);
      ctx.fillStyle = "#555566";
      ctx.fillRect(poleX, y - 2, 4, 4);

      // Lámpara
      const lit = this.brightness(k, time) > 0.5;
      ctx.save();
      ctx.shadowColor = "#ffb000";
      ctx.shadowBlur = lit ? 10 : 0;
      ctx.fillStyle = lit ? "#ffd27a" : "#5a4a2a";
      ctx.fillRect(poleX + dir * 28 - (left ? 0 : 4), y - 3, 8, 6);
      ctx.restore();
    }
  },

  // Desde la milla de la entrega ya no hay letreros: ahí se acaba la calle
  drawMileSigns(ctx, dist, house) {
    const c = R67.config;
    const r = this.visibleRange(dist, c.MILE_PX);
    const cx = this.shoulderCenter();
    for (let k = r.from; k <= r.to; k++) {
      if (house && k * c.MILE_PX >= house.d) break;
      const y = Math.round(this.screenY(k * c.MILE_PX, dist));
      ctx.fillStyle = "#444";
      ctx.fillRect(cx - 1, y + 8, 2, 8);
      ctx.fillStyle = "#0b3d1e";
      ctx.fillRect(cx - 18, y - 9, 36, 18);
      ctx.strokeStyle = c.COLORS.text;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 17.5, y - 8.5, 35, 17);
      ctx.font = "6px " + c.FONT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = c.COLORS.text;
      ctx.fillText("MI" + k, cx, y + 1);
    }
  },

  // Centro en X del arcén derecho
  shoulderCenter() {
    const c = R67.config;
    const shoulderX = c.ROAD_X + c.ROAD_W + 8;
    return shoulderX + (c.WIDTH - shoulderX) / 2;
  },

  WALK_H: 12, // alto de la banqueta al fin de la calle
  YARD: 30, // pasto entre la banqueta y el lugar de la entrega

  // Posición en pantalla del fin de la calle y del lugar de la entrega
  placeLayout(dist, house) {
    const c = R67.config;
    const sprite = R67.sprites[house.sprite];
    const endY = Math.round(this.screenY(this.roadEnd(house), dist));
    const bottom = endY - this.WALK_H - this.YARD;
    return { endY, bottom, cx: c.ROAD_X + c.ROAD_W / 2, cy: bottom - sprite.h / 2, sprite };
  },

  // Fin de la calle: después de la entrega ya no hay carretera sino una banqueta
  // y pasto, y de frente el lugar con su decoración: la casa con arbustos y buzón,
  // la granja con cerca y pacas, la iglesia con lápidas o el faro entre rocas.
  // Tapa todo lo que haya más allá (bordillos, líneas, luces de los postes).
  drawRoadEnd(ctx, dist, house, time) {
    const c = R67.config;
    const { endY, bottom: houseBottom, cx, cy: hy, sprite } = this.placeLayout(dist, house);
    if (endY <= 0) return;
    const walkH = this.WALK_H;

    // Pasto con bandas que bajan junto con el camino
    const period = c.DASH_PERIOD;
    ctx.fillStyle = "#1f5a2c";
    ctx.fillRect(0, 0, c.WIDTH, endY);
    ctx.fillStyle = "#1a4d26";
    for (let y = endY - walkH - period; y > -period; y -= period) {
      ctx.fillRect(0, y, c.WIDTH, period / 2);
    }

    // Banqueta con su borde
    ctx.fillStyle = "#5a5a6a";
    ctx.fillRect(0, endY - walkH, c.WIDTH, walkH);
    ctx.fillStyle = "#8a8a9a";
    ctx.fillRect(0, endY - 2, c.WIDTH, 2);
    ctx.fillStyle = "#4a4a58";
    for (let x = 20; x < c.WIDTH; x += 40) ctx.fillRect(x, endY - walkH, 2, walkH - 2);

    if (houseBottom < -10) return;

    // Luz de las ventanas sobre el pasto
    const glow = ctx.createRadialGradient(cx, hy, 0, cx, hy, 170);
    glow.addColorStop(0, "rgba(255, 210, 122, 0.25)");
    glow.addColorStop(1, "rgba(255, 210, 122, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 170, hy - 170, 340, 340);

    // Caminito de piedras de la banqueta a la puerta
    ctx.fillStyle = "#7a7a88";
    for (let y = endY - walkH - 10, i = 0; y > houseBottom - 4; y -= 10, i++) {
      ctx.fillRect(cx - 10 + (i % 2) * 4, y, 16, 7);
    }

    sprite.draw(ctx, cx, hy, house.color);
    if (house.awake) R67.monster.drawAwakening(ctx, cx, hy, sprite, house.awake, time);

    const deco = {
      house: this.drawYardHouse,
      barn: this.drawYardBarn,
      church: this.drawYardChurch,
      lighthouse: this.drawYardLighthouse,
    }[house.sprite];
    deco.call(this, ctx, cx, houseBottom, endY - walkH, house.color);
  },

  // Decoración de cada lugar. bottom: pie del edificio; walkTop: borde de la banqueta.
  drawYardHouse(ctx, cx, bottom, walkTop, color) {
    // Arbustos a los lados de la puerta
    ctx.fillStyle = "#123d1c";
    for (const dx of [-56, 40]) {
      ctx.fillRect(cx + dx, bottom - 14, 16, 14);
      ctx.fillRect(cx + dx - 4, bottom - 10, 24, 10);
    }

    // Buzón del color de la casa junto a la banqueta
    const mx = cx + 52;
    const my = walkTop - 20;
    ctx.fillStyle = "#3a2414";
    ctx.fillRect(mx, my, 3, 18);
    ctx.fillStyle = color;
    ctx.fillRect(mx - 6, my - 8, 15, 10);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(mx - 6, my - 1, 15, 3);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(mx + 9, my - 10, 2, 6);
  },

  drawYardBarn(ctx, cx, bottom) {
    const c = R67.config;
    // Cerca de madera a los dos lados
    ctx.fillStyle = "#6b4a2a";
    for (const [from, to] of [[4, cx - 108], [cx + 108, c.WIDTH - 4]]) {
      ctx.fillRect(from, bottom - 14, to - from, 3);
      ctx.fillRect(from, bottom - 7, to - from, 3);
      for (let x = from; x <= to - 4; x += 16) ctx.fillRect(x, bottom - 18, 4, 18);
    }
    // Pacas de heno frente al granero
    for (const [dx, dy] of [[46, 0], [66, 0], [56, -10]]) {
      ctx.fillStyle = "#d9b44a";
      ctx.fillRect(cx + dx, bottom - 10 + dy, 18, 10);
      ctx.fillStyle = "#a8862e";
      ctx.fillRect(cx + dx + 5, bottom - 10 + dy, 2, 10);
      ctx.fillRect(cx + dx + 11, bottom - 10 + dy, 2, 10);
    }
  },

  drawYardChurch(ctx, cx, bottom) {
    // Lápidas en el pasto, unas más adelante que otras
    for (const [dx, dy] of [[-150, -6], [-118, 4], [-96, -30], [86, -26], [108, 2], [140, -8]]) {
      const x = cx + dx;
      const y = bottom + dy;
      ctx.fillStyle = "#6a6a7a";
      ctx.fillRect(x, y - 14, 12, 14);
      ctx.fillRect(x + 2, y - 16, 8, 2);
      ctx.fillStyle = "#4a4a58";
      ctx.fillRect(x + 5, y - 12, 2, 7);
      ctx.fillRect(x + 3, y - 10, 6, 2);
      ctx.fillStyle = "#123d1c";
      ctx.fillRect(x - 2, y - 2, 16, 2);
    }
  },

  drawYardLighthouse(ctx, cx, bottom) {
    // Rocas al pie del faro
    ctx.fillStyle = "#4a4a58";
    for (const [dx, rw, rh] of [[-70, 22, 12], [-50, 14, 8], [44, 26, 14], [70, 12, 8]]) {
      ctx.fillRect(cx + dx, bottom - rh, rw, rh);
    }
    ctx.fillStyle = "#6a6a7a";
    ctx.fillRect(cx - 68, bottom - 12, 8, 3);
    ctx.fillRect(cx + 47, bottom - 14, 10, 3);
  },

  // Haz giratorio del faro. Se dibuja después de la oscuridad de la noche:
  // el faro se ve aunque todo lo demás esté a oscuras.
  drawBeacon(ctx, dist, time, house) {
    if (!house || house.sprite !== "lighthouse") return;
    const { endY, cx, cy, sprite } = this.placeLayout(dist, house);
    if (endY <= 0) return;
    const scale = R67.config.SPRITE_SCALE.lighthouse;
    const y = cy - sprite.h / 2 + sprite.LAMP_Y * scale;

    // Al girar, el haz barre de un lado a otro: es largo cuando apunta de lado
    // y se acorta cuando apunta hacia ti, y entonces la lámpara destella
    const sweep = Math.cos(time * 1.3);
    const dir = sweep >= 0 ? 1 : -1;
    const len = 40 + 380 * Math.abs(sweep);
    const spread = 10 + 24 * Math.abs(sweep);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const beam = ctx.createLinearGradient(cx, y, cx + dir * len, y);
    beam.addColorStop(0, "rgba(255, 243, 176, 0.6)");
    beam.addColorStop(1, "rgba(255, 243, 176, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(cx, y - 4);
    ctx.lineTo(cx + dir * len, y - spread);
    ctx.lineTo(cx + dir * len, y + spread);
    ctx.lineTo(cx, y + 4);
    ctx.closePath();
    ctx.fill();

    const r = 30 + 50 * (1 - Math.abs(sweep));
    const flash = ctx.createRadialGradient(cx, y, 0, cx, y, r);
    flash.addColorStop(0, "rgba(255, 243, 176, " + (0.4 + 0.5 * (1 - Math.abs(sweep))) + ")");
    flash.addColorStop(1, "rgba(255, 243, 176, 0)");
    ctx.fillStyle = flash;
    ctx.fillRect(cx - r, y - r, r * 2, r * 2);
    ctx.restore();
  },

  // Edificio de la estación y surtidores, a los lados de la salida
  drawStation(ctx, dist) {
    const c = R67.config;
    const top = this.screenY(170, dist);
    if (top > c.HEIGHT) return;
    const bottom = this.screenY(-110, dist);
    const w = c.ROAD_X - 10;

    // Techo del edificio (arcén izquierdo)
    ctx.fillStyle = "#1a1430";
    ctx.fillRect(0, top, w, bottom - top);
    ctx.strokeStyle = "#3a2a6a";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, top + 1, w - 2, bottom - top - 2);

    // Ventanas encendidas hacia la carretera
    ctx.fillStyle = c.COLORS.accent;
    for (let y = top + 16; y < bottom - 16; y += 28) {
      ctx.fillRect(w - 8, y, 4, 14);
    }

    // Luz que sale de la estación sobre el asfalto
    const spill = ctx.createLinearGradient(c.ROAD_X, 0, c.ROAD_X + 110, 0);
    spill.addColorStop(0, "rgba(255, 176, 0, 0.2)");
    spill.addColorStop(1, "rgba(255, 176, 0, 0)");
    ctx.fillStyle = spill;
    ctx.fillRect(c.ROAD_X, top, 110, bottom - top);

    // Surtidores (arcén derecho)
    const px = c.ROAD_X + c.ROAD_W + 18;
    for (let i = 0; i < 2; i++) {
      const y = this.screenY(40 - i * 70, dist);
      ctx.fillStyle = "#2b2b3a";
      ctx.fillRect(px, y - 12, 14, 24);
      ctx.fillStyle = c.COLORS.text;
      ctx.fillRect(px + 3, y - 8, 8, 6);
    }
  },

  // Arco con el rótulo de neón que cruza la carretera
  drawGate(ctx, dist) {
    const c = R67.config;
    const y = Math.round(this.screenY(this.STATION_GATE, dist));
    if (y > c.HEIGHT + 40) return;
    const cx = c.ROAD_X + c.ROAD_W / 2;

    ctx.fillStyle = "#15122a";
    ctx.fillRect(c.ROAD_X - 10, y - 4, c.ROAD_W + 20, 8);
    ctx.fillStyle = "#555566";
    ctx.fillRect(c.ROAD_X - 12, y - 6, 6, 12);
    ctx.fillRect(c.ROAD_X + c.ROAD_W + 6, y - 6, 6, 12);

    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(cx - 78, y - 15, 156, 30);
    ctx.save();
    ctx.shadowColor = c.COLORS.text;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = c.COLORS.text;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 77, y - 14, 154, 28);
    ctx.shadowColor = c.COLORS.accent;
    ctx.font = "12px " + c.FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = c.COLORS.accent;
    ctx.fillText("LAST STOP", cx, y + 1);
    ctx.restore();
  },
};
