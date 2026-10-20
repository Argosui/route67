// Traduce teclado y toques a acciones: izquierda/derecha (por pulsación),
// adelante/atrás (mantenido, y por pulsación para los menús) y acción (elegir).
// game.js asigna los manejadores.
R67.input = {
  onLeft: null,
  onRight: null,
  onUp: null,
  onDown: null,
  onAction: null,
  onPlayfieldTap: null, // toque en la carretera; devuelve true si lo usó
  onMute: null,
  onPause: null,
  onLights: null,
  onWipe: null,
  onPanelTap: null, // toque en el tablero, en coordenadas del canvas

  up: false,
  down: false,
  touchAxisY: 0, // -1 (adelante) a 1 (atrás) mientras se arrastra el dedo

  // Eje vertical combinado: -1 adelante, 1 atrás
  axisY() {
    const keys = (this.down ? 1 : 0) - (this.up ? 1 : 0);
    return keys !== 0 ? keys : this.touchAxisY;
  },

  init(canvas) {
    window.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          this.up = true;
          if (!e.repeat) this.onUp && this.onUp();
          return;
        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          this.down = true;
          if (!e.repeat) this.onDown && this.onDown();
          return;
      }
      if (e.repeat) return;
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          e.preventDefault();
          this.onLeft && this.onLeft();
          break;
        case "ArrowRight":
        case "KeyD":
          e.preventDefault();
          this.onRight && this.onRight();
          break;
        case "Space":
        case "Enter":
          e.preventDefault();
          this.onAction && this.onAction();
          break;
        case "KeyM":
          this.onMute && this.onMute();
          break;
        case "KeyL":
        case "KeyF":
          this.onLights && this.onLights();
          break;
        case "KeyE":
          this.onWipe && this.onWipe();
          break;
        case "KeyP":
        case "Escape":
          this.onPause && this.onPause();
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") this.up = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") this.down = false;
    });

    // Si la ventana pierde el foco no llega el keyup: se sueltan las teclas
    window.addEventListener("blur", () => {
      this.up = false;
      this.down = false;
      this.touchAxisY = 0;
    });

    // Toque / clic: mitad izquierda o derecha cambia de carril;
    // arrastrar hacia arriba o abajo mueve el carro adelante o atrás.
    const DRAG_DEADZONE = 12;
    const DRAG_FULL = 50;
    let startY = null;

    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startY = e.clientY;
      const c = R67.config;
      const rect = canvas.getBoundingClientRect();
      // Posición del toque en coordenadas del canvas
      const x = ((e.clientX - rect.left) / rect.width) * (c.WIDTH + c.PANEL_W);
      const y = ((e.clientY - rect.top) / rect.height) * c.HEIGHT;
      // Los toques en el tablero los resuelve game.js (botón de motor, radio)
      if (x >= c.WIDTH) {
        startY = null;
        this.onPanelTap && this.onPanelTap(x, y);
        return;
      }
      const isLeft = x < c.WIDTH / 2;
      // Si el toque fue en un menú, no cuenta además como movimiento
      if (this.onPlayfieldTap && this.onPlayfieldTap(x, y)) return;
      if (isLeft) this.onLeft && this.onLeft();
      else this.onRight && this.onRight();
    });

    window.addEventListener("pointermove", (e) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      this.touchAxisY =
        Math.abs(dy) < DRAG_DEADZONE ? 0 : Math.max(-1, Math.min(1, dy / DRAG_FULL));
    });

    const release = () => {
      startY = null;
      this.touchAxisY = 0;
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  },
};
