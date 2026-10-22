// Pantalla del teléfono del repartidor: la app RUTA EXPRESS. Al inicio de cada
// noche muestra el pedido (dirección y distancia), las noticias con las
// precauciones y los controles; al llegar, la casa de la entrega.
// El marco es el sprite "phone". La app es clara (fondo blanco, letra negra)
// para que se lea bien, así que dibuja sus propias opciones en vez de las de neón.
R67.phone = {
  CY: 320, // centro vertical del teléfono
  SLIDE_TIME: 0.35, // segundos que tarda en subir a la vista
  TYPE_SPEED: 45, // letras por segundo del texto que se va escribiendo
  LINE_H: 12,
  PAD: 8, // margen interior de la pantalla

  COLORS: {
    ink: "#14141f", // texto principal
    muted: "#5a5a6e", // texto secundario
    rule: "#c8c8d0", // separadores
    accent: "#b35a00", // ámbar oscuro, legible sobre blanco
    danger: "#c8102e",
    ok: "#1a8a3a",
    header: "#ffb000",
  },

  // Rectángulo de la pantalla en coordenadas del canvas
  screen() {
    const s = R67.sprites.phone;
    return {
      x: R67.config.WIDTH / 2 - s.w / 2 + s.SCREEN.x,
      y: this.CY - s.h / 2 + s.SCREEN.y,
      w: s.SCREEN.w,
      h: s.SCREEN.h,
    };
  },

  // Desplazamiento vertical mientras sube; 0 cuando ya está en su lugar
  slide(t) {
    const k = Math.min(1, t / this.SLIDE_TIME);
    return Math.pow(1 - k, 3) * R67.config.HEIGHT;
  },

  // Texto que se escribe letra por letra en cada pantalla
  message(mode, night) {
    return mode === "briefing" ? night.news : night.done;
  },

  typed(t) {
    return Math.floor(Math.max(0, t - this.SLIDE_TIME) * this.TYPE_SPEED);
  },

  done(str, t) {
    return this.typed(t) >= str.length;
  },

  label(ctx, str, x, y, size, color, align) {
    R67.dashboard.label(ctx, str, x, y, size, color, align);
  },

  // nights: todas las noches; i: la que empieza
  drawBriefing(ctx, nights, i, t) {
    const col = this.COLORS;
    const night = nights[i];
    const s = this.screen();
    const x = s.x + this.PAD;
    const right = s.x + s.w - this.PAD;
    const width = s.w - this.PAD * 2;

    this.drawFrame(ctx, night, i, t);

    // Pedido
    let y = s.y + 62;
    this.label(ctx, R67.i18n.t("ORDER") + String(6701 + i).padStart(5, "0"), x, y, 7, col.muted, "left");
    this.label(ctx, night.miles.toFixed(1) + " MI", right, y, 7, col.accent, "right");
    this.label(ctx, R67.i18n.t("DELIVER_TO"), x, (y += 18), 7, col.accent, "left");
    y += 2;
    for (const line of this.wrap(ctx, night.address, 8, width)) {
      this.label(ctx, line, x, (y += 14), 8, col.ink, "left");
    }

    // Noticiero
    y = s.y + 124;
    ctx.fillStyle = col.rule;
    ctx.fillRect(x, y, width, 2);
    y += 14;
    ctx.fillStyle = col.danger;
    ctx.fillRect(x, y - 7, 56, 14);
    this.label(ctx, R67.i18n.t("LIVE"), x + 28, y + 1, 6, "#fff");
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = col.danger;
      ctx.fillRect(x + 62, y - 2, 4, 4);
    }
    this.label(ctx, R67.i18n.t("NEWS"), x + 72, y, 7, col.ink, "left");
    this.drawTyped(ctx, night.news, x, s.y + 156, width, col.ink, t);
    this.drawTicker(ctx, night.ticker, s.x, s.y + 246, s.w, t);

    // Controles: los de noches anteriores (o los que indique inherit) y,
    // resaltados, los que se estrenan hoy
    y = s.y + 270;
    this.label(ctx, R67.i18n.t("CONTROLS"), x, y, 7, col.accent, "left");
    const shown = (night.inherit || [...Array(i).keys()]).concat([i]);
    for (const n of shown) {
      const fresh = n === i;
      for (const [key, action] of nights[n].controls) {
        y += 13;
        this.label(ctx, key, x, y, 7, fresh ? col.accent : col.ink, "left");
        this.label(ctx, action, x + 100, y, 7, fresh ? col.accent : col.muted, "left");
        if (fresh && i > 0 && Math.floor(t * 3) % 2 === 0) {
          this.label(ctx, R67.i18n.t("NEW"), right, y, 6, col.danger, "right");
        }
      }
    }
  },

  // La casa de la entrega, del color de esa noche, con una palomita de confirmación.
  // En la noche 6 la foto muestra la casa ya despierta y el título cambia.
  drawDelivered(ctx, nights, i, t) {
    const col = this.COLORS;
    const night = nights[i];
    const bonus = !!night.bonus;
    const last = bonus || i === R67.story.MAIN - 1;
    const s = this.screen();
    const cx = s.x + s.w / 2;
    const color = last ? col.danger : col.ok;

    this.drawFrame(ctx, night, i, t);

    // La casa (o el faro) sobre un cielo nocturno, como la foto de la entrega
    const py = s.y + 54;
    ctx.fillStyle = "#1a1430";
    ctx.fillRect(s.x + 40, py, s.w - 80, 104);
    ctx.fillStyle = "#11343d";
    ctx.fillRect(s.x + 40, py + 88, s.w - 80, 16);
    ctx.save();
    ctx.beginPath();
    ctx.rect(s.x + 40, py, s.w - 80, 104);
    ctx.clip();
    ctx.translate(cx, py + 50);
    const place = R67.sprites[night.place || "house"];
    const k = 88 / place.h;
    ctx.scale(k, k);
    place.draw(ctx, 0, 0, night.house);
    if (bonus) R67.monster.drawAwakening(ctx, 0, 0, place, 1, t);
    ctx.restore();

    // Palomita en la esquina de la foto
    const bx = s.x + s.w - 52;
    const by = py + 10;
    ctx.fillStyle = color;
    ctx.fillRect(bx - 10, by - 10, 20, 20);
    ctx.fillStyle = "#fff";
    ctx.fillRect(bx - 6, by, 3, 3);
    ctx.fillRect(bx - 3, by + 3, 3, 3);
    ctx.fillRect(bx, by, 3, 3);
    ctx.fillRect(bx + 3, by - 3, 3, 3);

    const title = R67.i18n.t(bonus ? "ESCAPED" : last ? "LAST_DELIVERY" : "DELIVERED");
    this.label(ctx, title[0], cx, s.y + 180, 14, color);
    this.label(ctx, title[1], cx, s.y + 200, 14, color);
    this.label(ctx, last ? "? ? ? ? ?" : "* * * * *", cx, s.y + 222, 12, col.accent);
    this.drawTyped(ctx, night.done, s.x + this.PAD, s.y + 246, s.w - this.PAD * 2, col.ink, t);
  },

  // Opciones como botones: la elegida en negro con letra blanca.
  // Usa la misma separación que R67.menu para que los toques caigan donde se ven.
  drawOptions(ctx, options, selected, y0) {
    const col = this.COLORS;
    const s = this.screen();
    const cx = s.x + s.w / 2;
    const rowH = R67.menu.ROW_H;
    options.forEach((o, i) => {
      const y = y0 + i * rowH;
      const isSelected = i === selected;
      ctx.fillStyle = isSelected ? col.ink : col.rule;
      ctx.fillRect(s.x + 20, y - 13, s.w - 40, 26);
      if (!isSelected) {
        ctx.fillStyle = "#f4f4ee";
        ctx.fillRect(s.x + 22, y - 11, s.w - 44, 22);
      }
      this.label(ctx, o.label, cx, y + 1, 10, isSelected ? "#fff" : col.ink);
    });
    this.label(ctx, R67.i18n.t("HINT"), cx, y0 + options.length * rowH - 4, 7, col.muted);
  },

  // Fondo de la app: barra de estado y encabezado con el logo.
  // Las noches aparte (la 6) no dicen "/5" y tienen el encabezado en rojo.
  drawFrame(ctx, night, i, t) {
    const col = this.COLORS;
    const s = this.screen();
    const x = s.x + this.PAD;
    const right = s.x + s.w - this.PAD;
    const total = R67.story.MAIN;

    R67.sprites.phone.draw(ctx, R67.config.WIDTH / 2, this.CY);

    // Barra de estado: hora, noche, señal y una batería que se agota noche a noche
    const y = s.y + 10;
    this.label(ctx, night.clock, x, y, 7, col.ink, "left");
    const which = R67.i18n.t("NIGHT") + " " + (i + 1) + (night.bonus ? "" : "/" + total);
    this.label(ctx, which, s.x + s.w / 2, y, 6, night.bonus ? col.danger : col.muted);
    const charge = Math.max(0, 1 - i / total);
    const low = charge < 0.3;
    ctx.strokeStyle = low ? col.danger : col.ink;
    ctx.lineWidth = 1;
    ctx.strokeRect(right - 17.5, y - 3.5, 16, 8);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(right - 1, y - 1, 2, 4);
    if (!low || Math.floor(t * 2) % 2 === 0) ctx.fillRect(right - 16, y - 2, Math.max(2, 13 * charge), 5);
    for (let b = 0; b < 4; b++) {
      ctx.fillStyle = b < 4 - i * 0.6 ? col.ink : col.rule;
      ctx.fillRect(right - 42 + b * 5, y + 3 - b * 2, 3, 2 + b * 2);
    }

    // Encabezado de la app con una cajita de paquete
    const hy = s.y + 20;
    ctx.fillStyle = night.bonus ? col.danger : col.header;
    ctx.fillRect(s.x, hy, s.w, 22);
    ctx.fillStyle = "#7a4a12";
    ctx.fillRect(x, hy + 5, 14, 12);
    ctx.fillStyle = "#c98b3a";
    ctx.fillRect(x + 1, hy + 6, 12, 10);
    ctx.fillStyle = "#7a4a12";
    ctx.fillRect(x + 6, hy + 6, 2, 10);
    this.label(ctx, "RUTA EXPRESS", s.x + s.w / 2 + 8, hy + 12, 9, night.bonus ? "#fff" : col.ink);
  },

  // Texto que se va escribiendo con un cursor parpadeante al final
  drawTyped(ctx, str, x, y, width, color, t) {
    let left = this.typed(t);
    const lines = this.wrap(ctx, str, 7, width);
    for (const line of lines) {
      if (left <= 0) break;
      const shown = line.slice(0, left);
      this.label(ctx, shown, x, y, 7, color, "left");
      left -= line.length + 1;
      if (left < 0 && Math.floor(t * 4) % 2 === 0) {
        ctx.fillStyle = color;
        ctx.fillRect(x + ctx.measureText(shown).width + 1, y - 4, 6, 8);
      }
      y += this.LINE_H;
    }
  },

  // Cintillo de última hora que corre de derecha a izquierda
  drawTicker(ctx, str, x, y, w, t) {
    ctx.fillStyle = this.COLORS.danger;
    ctx.fillRect(x, y - 7, w, 14);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y - 7, w, 14);
    ctx.clip();
    ctx.font = "7px " + R67.config.FONT;
    const msg = R67.i18n.t("BREAKING") + str + "  ///  ";
    const loop = ctx.measureText(msg).width;
    const shift = (t * 40) % loop;
    for (let k = 0; k * loop < w + loop; k++) {
      this.label(ctx, msg, x + k * loop - shift, y + 1, 7, "#fff", "left");
    }
    ctx.restore();
  },

  // Parte el texto en renglones que quepan en width
  wrap(ctx, str, size, width) {
    ctx.font = size + "px " + R67.config.FONT;
    const lines = [];
    let line = "";
    for (const word of str.split(" ")) {
      const next = line ? line + " " + word : word;
      if (line && ctx.measureText(next).width > width) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  },
};
