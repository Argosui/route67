// Lista de opciones navegable, usada por el menú principal, la pausa y el game over.
// Cada opción: { label, action, disabled?, note? }
R67.menu = {
  ROW_H: 40,
  DISABLED_COLOR: "#5a5a6e",

  // text: la función de texto de game.js, para usar el mismo estilo de neón
  draw(ctx, text, options, selected, y0) {
    const c = R67.config;
    const cx = c.WIDTH / 2;
    options.forEach((o, i) => {
      const y = y0 + i * this.ROW_H;
      const isSelected = i === selected;
      const color = o.disabled ? this.DISABLED_COLOR : isSelected ? c.COLORS.accent : c.COLORS.text;
      text(isSelected ? "> " + o.label + " <" : o.label, cx, y, 12, color);
      if (o.note) text(o.note, cx, y + 16, 7, this.DISABLED_COLOR);
    });
  },

  // Índice de la opción en la altura y, o -1 si no toca ninguna
  hit(options, y0, y) {
    const i = Math.round((y - y0) / this.ROW_H);
    return i >= 0 && i < options.length ? i : -1;
  },
};
