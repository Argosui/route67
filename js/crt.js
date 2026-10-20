// Efecto de pantalla CRT sobre todo el canvas: líneas de escaneo y esquinas oscurecidas.
R67.crt = {
  SCANLINE_GAP: 3,
  SCANLINE_ALPHA: 0.22,

  draw(ctx) {
    const c = R67.config;
    const w = c.WIDTH + c.PANEL_W;
    const h = c.HEIGHT;

    ctx.fillStyle = "rgba(0, 0, 0, " + this.SCANLINE_ALPHA + ")";
    for (let y = 0; y < h; y += this.SCANLINE_GAP) {
      ctx.fillRect(0, y, w, 1);
    }

    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.75);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  },
};
