// Sprites dibujados con rectángulos (sin imágenes). Todos reciben el centro (x, y).
// Cada sprite se pinta en su tamaño base y se escala con config.SPRITE_SCALE;
// w y h son el tamaño final, que también usan las colisiones.
(function () {
  // paint(ctx, l, t, w, h, color) dibuja en medidas base, con (l, t) la esquina superior izquierda
  function make(name, baseW, baseH, paint) {
    const scale = R67.config.SPRITE_SCALE[name] || 1;
    return {
      w: baseW * scale,
      h: baseH * scale,
      draw(ctx, x, y, color) {
        ctx.save();
        ctx.translate(Math.round(x), Math.round(y));
        ctx.scale(scale, scale);
        paint(ctx, -baseW / 2, -baseH / 2, baseW, baseH, color);
        ctx.restore();
      },
    };
  }

  // Pantalla del teléfono dentro de su dibujo base
  const PHONE_SCREEN = { x: 12, y: 36, w: 256, h: 516 };

  R67.sprites = {
    // Teléfono del repartidor: carcasa, bocina, cámara y botón de inicio.
    // La pantalla queda apagada; R67.phone dibuja encima lo que muestra.
    phone: make("phone", 280, 592, function (ctx, l, t, w, h) {
      const cx = l + w / 2;
      const s = PHONE_SCREEN;

      // Botones laterales: volumen a la izquierda, encendido a la derecha
      ctx.fillStyle = "#2b2b3d";
      ctx.fillRect(l - 3, t + 110, 3, 40);
      ctx.fillRect(l - 3, t + 158, 3, 40);
      ctx.fillRect(l + w, t + 140, 3, 56);

      // Carcasa con las esquinas recortadas
      ctx.fillStyle = "#2b2b3d";
      ctx.fillRect(l + 8, t, w - 16, h);
      ctx.fillRect(l, t + 8, w, h - 16);
      ctx.fillRect(l + 3, t + 3, w - 6, h - 6);
      ctx.fillStyle = "#14141f";
      ctx.fillRect(l + 9, t + 3, w - 18, h - 6);
      ctx.fillRect(l + 3, t + 9, w - 6, h - 18);
      ctx.fillRect(l + 5, t + 5, w - 10, h - 10);

      // Bocina y cámara
      ctx.fillStyle = "#050508";
      ctx.fillRect(cx - 24, t + 16, 48, 4);
      ctx.fillRect(cx + 34, t + 14, 8, 8);
      ctx.fillStyle = "#3a3a6a";
      ctx.fillRect(cx + 36, t + 16, 3, 3);

      // Pantalla con su marco
      ctx.fillStyle = "#050508";
      ctx.fillRect(l + s.x - 2, t + s.y - 2, s.w + 4, s.h + 4);
      ctx.fillStyle = "#f4f4ee";
      ctx.fillRect(l + s.x, t + s.y, s.w, s.h);

      // Botón de inicio
      ctx.fillStyle = "#050508";
      ctx.fillRect(cx - 12, t + h - 30, 24, 20);
      ctx.fillRect(cx - 10, t + h - 32, 20, 24);
      ctx.fillStyle = "#2b2b3d";
      ctx.fillRect(cx - 6, t + h - 26, 12, 12);
      ctx.fillStyle = "#050508";
      ctx.fillRect(cx - 4, t + h - 24, 8, 8);
    }),

    car: make("car", 44, 72, function (ctx, l, t, w, h, color) {
      // Llantas
      ctx.fillStyle = "#111";
      ctx.fillRect(l - 3, t + 10, 6, 14);
      ctx.fillRect(l + w - 3, t + 10, 6, 14);
      ctx.fillRect(l - 3, t + h - 24, 6, 14);
      ctx.fillRect(l + w - 3, t + h - 24, 6, 14);

      // Carrocería
      ctx.fillStyle = color;
      ctx.fillRect(l, t + 4, w, h - 8);
      ctx.fillRect(l + 4, t, w - 8, h);

      // Franja central
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(l + w / 2 - 3, t, 6, h);

      // Parabrisas y ventana trasera
      ctx.fillStyle = "#1b263b";
      ctx.fillRect(l + 6, t + 16, w - 12, 12);
      ctx.fillRect(l + 6, t + h - 24, w - 12, 8);

      // Techo
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(l + 6, t + 28, w - 12, h - 52);

      // Faros
      ctx.fillStyle = "#fff3b0";
      ctx.fillRect(l + 4, t, 8, 4);
      ctx.fillRect(l + w - 12, t, 8, 4);

      // Luces traseras
      ctx.fillStyle = "#ff0033";
      ctx.fillRect(l + 4, t + h - 4, 8, 4);
      ctx.fillRect(l + w - 12, t + h - 4, 8, 4);
    }),

    // Casa de la entrega, vista de frente: color es el de las paredes
    house: make("house", 40, 44, function (ctx, l, t, w, h, color) {
      const cx = l + w / 2;

      // Chimenea y techo escalonado
      ctx.fillStyle = "#2a1f2e";
      ctx.fillRect(l + 28, t + 2, 5, 10);
      for (let i = 0; i < 6; i++) {
        const half = 5 + i * 3;
        ctx.fillRect(cx - half, t + i * 3, half * 2, 3);
      }
      ctx.fillStyle = "#4a3a50";
      ctx.fillRect(l, t + 18, w, 2);

      // Paredes con sombra del lado derecho
      ctx.fillStyle = color;
      ctx.fillRect(l + 3, t + 20, w - 6, h - 20);
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(l + w - 9, t + 20, 6, h - 20);

      // Ventanas encendidas con su cruz
      ctx.fillStyle = "#ffd27a";
      ctx.fillRect(l + 7, t + 25, 8, 8);
      ctx.fillRect(l + 25, t + 25, 8, 8);
      ctx.fillStyle = "#2a1f2e";
      ctx.fillRect(l + 10, t + 25, 2, 8);
      ctx.fillRect(l + 7, t + 28, 8, 2);
      ctx.fillRect(l + 28, t + 25, 2, 8);
      ctx.fillRect(l + 25, t + 28, 8, 2);

      // Puerta con perilla
      ctx.fillStyle = "#3a2414";
      ctx.fillRect(cx - 4, t + 32, 8, 12);
      ctx.fillStyle = "#ffb000";
      ctx.fillRect(cx + 1, t + 38, 2, 2);
    }),

    // Faro de franjas, visto de frente: color es el de las franjas.
    // La lámpara queda a LAMP_Y px (en medidas base) de arriba; ahí nace el haz.
    lighthouse: make("lighthouse", 30, 64, function (ctx, l, t, w, h, color) {
      const cx = l + w / 2;

      // Cúpula
      ctx.fillStyle = "#8a1f2b";
      ctx.fillRect(cx - 2, t, 4, 2);
      ctx.fillRect(cx - 5, t + 2, 10, 2);
      ctx.fillRect(cx - 8, t + 4, 16, 3);

      // Cuarto de la lámpara con sus barrotes
      ctx.fillStyle = "#2a1f2e";
      ctx.fillRect(cx - 8, t + 7, 16, 10);
      ctx.fillStyle = "#fff3b0";
      ctx.fillRect(cx - 6, t + 8, 12, 8);
      ctx.fillStyle = "#2a1f2e";
      ctx.fillRect(cx - 1, t + 8, 2, 8);

      // Balcón con barandal
      ctx.fillStyle = "#2a1f2e";
      ctx.fillRect(cx - 12, t + 17, 24, 3);
      for (let x = cx - 12; x <= cx + 10; x += 4) ctx.fillRect(x, t + 15, 2, 2);

      // Torre que se ensancha hacia abajo, con franjas
      for (let y = 20; y < 60; y++) {
        const half = Math.round(7 + ((y - 20) / 40) * 4);
        ctx.fillStyle = Math.floor((y - 20) / 8) % 2 === 0 ? color : "#f0f0f0";
        ctx.fillRect(cx - half, t + y, half * 2, 1);
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(cx + half - 3, t + y, 3, 1);
      }

      // Ventanita y puerta
      ctx.fillStyle = "#1b263b";
      ctx.fillRect(cx - 2, t + 30, 4, 5);
      ctx.fillStyle = "#3a2414";
      ctx.fillRect(cx - 3, t + 51, 6, 9);

      // Base de piedra
      ctx.fillStyle = "#5a5a6a";
      ctx.fillRect(l + 1, t + 60, w - 2, 4);
    }),

    // Granja: silo a la izquierda y granero de techo quebrado; color es el de las paredes
    barn: make("barn", 52, 44, function (ctx, l, t, w, h, color) {
      // Silo con franjas y cúpula
      ctx.fillStyle = "#5a5a6a";
      ctx.fillRect(l + 2, t + 2, 8, 2);
      ctx.fillRect(l + 1, t + 4, 10, 2);
      ctx.fillStyle = "#9a9aa8";
      ctx.fillRect(l, t + 6, 12, h - 6);
      ctx.fillStyle = "#7a7a88";
      for (let y = t + 10; y < t + h; y += 6) ctx.fillRect(l, y, 12, 1);
      ctx.fillRect(l + 9, t + 6, 3, h - 6);

      // Techo quebrado del granero
      const cx = l + 33;
      ctx.fillStyle = "#3a2a2a";
      for (let k = 0; k < 6; k++) {
        const half = 9 + k * 2;
        ctx.fillRect(cx - half, t + 4 + k * 3, half * 2, 3);
      }

      // Paredes con moldura blanca y sombra
      ctx.fillStyle = color;
      ctx.fillRect(cx - 17, t + 22, 34, h - 22);
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(cx + 12, t + 22, 5, h - 22);
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(cx - 17, t + 22, 34, 2);

      // Ventana del pajar, encendida
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(cx - 4, t + 11, 8, 7);
      ctx.fillStyle = "#ffd27a";
      ctx.fillRect(cx - 3, t + 12, 6, 5);

      // Portón con su cruz blanca
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(cx - 8, t + 29, 16, 15);
      ctx.fillStyle = "#5a1414";
      ctx.fillRect(cx - 7, t + 30, 14, 14);
      ctx.fillStyle = "#f0f0f0";
      for (let i = 0; i < 14; i++) {
        ctx.fillRect(cx - 7 + i, t + 30 + i, 1, 1);
        ctx.fillRect(cx + 6 - i, t + 30 + i, 1, 1);
      }
      ctx.fillRect(cx, t + 30, 1, 14);
    }),

    // Iglesia: campanario con cruz, rosetón y vitrales; color es el de las paredes
    church: make("church", 36, 64, function (ctx, l, t, w, h, color) {
      const cx = l + w / 2;

      // Cruz
      ctx.fillStyle = "#ffd27a";
      ctx.fillRect(cx - 1, t, 2, 8);
      ctx.fillRect(cx - 3, t + 2, 6, 2);

      // Aguja del campanario
      ctx.fillStyle = "#2a1f2e";
      for (let k = 0; k < 7; k++) {
        const half = 1 + k;
        ctx.fillRect(cx - half, t + 8 + k * 2, half * 2, 2);
      }

      // Campanario con la campana
      ctx.fillStyle = color;
      ctx.fillRect(cx - 6, t + 22, 12, 14);
      ctx.fillStyle = "#1a1430";
      ctx.fillRect(cx - 3, t + 25, 6, 7);
      ctx.fillStyle = "#ffb000";
      ctx.fillRect(cx - 2, t + 27, 4, 4);

      // Techo de la nave
      ctx.fillStyle = "#2a1f2e";
      for (let k = 0; k < 5; k++) {
        const half = 10 + k * 2;
        ctx.fillRect(cx - half, t + 34 + k * 2, half * 2, 2);
      }

      // Nave con sombra
      ctx.fillStyle = color;
      ctx.fillRect(cx - 16, t + 44, 32, h - 44);
      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fillRect(cx + 11, t + 44, 5, h - 44);

      // Rosetón de colores
      ctx.fillStyle = "#2a1f2e";
      ctx.fillRect(cx - 4, t + 45, 8, 6);
      ctx.fillStyle = "#e63946";
      ctx.fillRect(cx - 3, t + 46, 3, 2);
      ctx.fillStyle = "#7fdbff";
      ctx.fillRect(cx, t + 46, 3, 2);
      ctx.fillStyle = "#ffd27a";
      ctx.fillRect(cx - 3, t + 48, 3, 2);
      ctx.fillStyle = "#b388ff";
      ctx.fillRect(cx, t + 48, 3, 2);

      // Vitrales a los lados
      ctx.fillStyle = "#7fdbff";
      ctx.fillRect(cx - 13, t + 52, 3, 8);
      ctx.fillStyle = "#ffd27a";
      ctx.fillRect(cx + 10, t + 52, 3, 8);

      // Puerta en arco
      ctx.fillStyle = "#3a2414";
      ctx.fillRect(cx - 3, t + 53, 6, 1);
      ctx.fillRect(cx - 4, t + 54, 8, h - 54);
      ctx.fillStyle = "#ffb000";
      ctx.fillRect(cx + 1, t + 59, 1, 2);
    }),

    cone: make("cone", 28, 28, function (ctx, l, t) {
      ctx.fillStyle = "#222";
      ctx.fillRect(l, t + 22, 28, 6);
      ctx.fillStyle = "#fb5607";
      ctx.fillRect(l + 4, t + 14, 20, 8);
      ctx.fillRect(l + 8, t + 6, 12, 8);
      ctx.fillRect(l + 11, t, 6, 6);
      ctx.fillStyle = "#f4f4f4";
      ctx.fillRect(l + 6, t + 12, 16, 4);
    }),

    // Bache: agujero oscuro con borde de asfalto roto
    pothole: make("pothole", 44, 34, function (ctx, l, t) {
      ctx.fillStyle = "#34344a";
      ctx.fillRect(l + 6, t + 2, 32, 30);
      ctx.fillRect(l + 2, t + 8, 40, 18);
      ctx.fillStyle = "#050508";
      ctx.fillRect(l + 9, t + 5, 26, 24);
      ctx.fillRect(l + 5, t + 11, 34, 12);
      ctx.fillRect(l, t + 16, 4, 2);
      ctx.fillRect(l + 40, t + 14, 4, 2);
      ctx.fillStyle = "#4a4a5c";
      ctx.fillRect(l + 10, t + 29, 22, 2);
    }),

    // Cartel de obra: rombo ámbar con signo de advertencia
    sign: make("sign", 36, 40, function (ctx, l, t) {
      ctx.fillStyle = "#444";
      ctx.fillRect(l + 6, t + 34, 4, 6);
      ctx.fillRect(l + 26, t + 34, 4, 6);
      ctx.save();
      ctx.translate(l + 18, t + 17);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#000";
      ctx.fillRect(-13, -13, 26, 26);
      ctx.fillStyle = "#ffb000";
      ctx.fillRect(-11, -11, 22, 22);
      ctx.restore();
      ctx.fillStyle = "#000";
      ctx.fillRect(l + 16, t + 9, 4, 10);
      ctx.fillRect(l + 16, t + 22, 4, 4);
    }),

    // Bidón de gasolina (se recoge, no es obstáculo)
    fuel: make("fuel", 28, 34, function (ctx, l, t) {
      // Asa y boquilla
      ctx.fillStyle = "#8a8a9a";
      ctx.fillRect(l + 4, t, 12, 4);
      ctx.fillRect(l + 4, t, 3, 8);
      ctx.fillRect(l + 20, t + 2, 6, 6);
      // Cuerpo
      ctx.fillStyle = "#d62839";
      ctx.fillRect(l, t + 6, 28, 28);
      ctx.fillStyle = "#8f1b27";
      ctx.fillRect(l + 24, t + 6, 4, 28);
      // Franja y gota
      ctx.fillStyle = "#ffb000";
      ctx.fillRect(l, t + 16, 28, 10);
      ctx.fillStyle = "#1a0b2e";
      ctx.fillRect(l + 12, t + 17, 4, 3);
      ctx.fillRect(l + 10, t + 20, 8, 4);
    }),

    // Fantasma: cuerpo pálido con flecos abajo y ojos huecos
    ghost: make("ghost", 40, 48, function (ctx, l, t) {
      ctx.fillStyle = "#c8f7ff";
      ctx.fillRect(l + 8, t, 24, 6);
      ctx.fillRect(l + 4, t + 4, 32, 8);
      ctx.fillRect(l, t + 10, 40, 26);
      ctx.fillRect(l, t + 36, 10, 8);
      ctx.fillRect(l + 15, t + 36, 10, 10);
      ctx.fillRect(l + 30, t + 36, 10, 8);
      ctx.fillRect(l + 2, t + 44, 6, 4);
      ctx.fillRect(l + 32, t + 44, 6, 4);
      // Sombra morada en un costado
      ctx.fillStyle = "rgba(120, 60, 255, 0.25)";
      ctx.fillRect(l + 32, t + 10, 8, 26);
      // Ojos y boca
      ctx.fillStyle = "#1a0b2e";
      ctx.fillRect(l + 9, t + 14, 7, 11);
      ctx.fillRect(l + 24, t + 14, 7, 11);
      ctx.fillRect(l + 16, t + 29, 8, 5);
      ctx.fillStyle = "#b388ff";
      ctx.fillRect(l + 11, t + 18, 3, 4);
      ctx.fillRect(l + 26, t + 18, 3, 4);
    }),

    barrier: make("barrier", 64, 24, function (ctx, l, t) {
      // Luces de advertencia
      ctx.fillStyle = "#ffb000";
      ctx.fillRect(l + 2, t - 4, 6, 4);
      ctx.fillRect(l + 56, t - 4, 6, 4);
      // Patas
      ctx.fillStyle = "#222";
      ctx.fillRect(l + 4, t + 16, 6, 8);
      ctx.fillRect(l + 54, t + 16, 6, 8);
      // Tablón a rayas
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#e63946" : "#f4f4f4";
        ctx.fillRect(l + i * 8, t, 8, 16);
      }
    }),
  };

  R67.sprites.phone.SCREEN = PHONE_SCREEN;
  R67.sprites.lighthouse.LAMP_Y = 12;
})();
