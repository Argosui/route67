// Bucle principal, estados del juego (inicio / jugando / game over) y HUD.
(function () {
  const c = R67.config;
  const canvas = document.getElementById("game");
  canvas.width = c.WIDTH + c.PANEL_W;
  canvas.height = c.HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const story = R67.story;

  const state = {
    // "menu" | "playing" | "paused" | "over", "arriving" (frenando junto a la casa),
    // en la noche 6 "awakening" (la casa despierta) y "outrun" (la criatura se queda atrás),
    // "levels" (elegir noche, tras terminar la historia) y con el teléfono en mano
    // "briefing" (pedido de la noche), "delivered" (entregado) | "ending" (última noche)
    mode: "menu",
    selected: 1, // opción resaltada en las pantallas con opciones
    night: null, // índice de la noche del modo historia; null en modo infinito
    nextNight: story.load(), // la que ofrece el menú
    confirmReset: false, // se pidió reiniciar las noches y falta confirmar
    completed: story.isCompleted(), // ya terminó la historia: puede elegir cualquier noche
    rules: story.ALL_RULES, // mecánicas activas en la partida
    phoneT: 0, // segundos desde que se abrió la pantalla actual
    speedStart: c.SPEED_START, // velocidad inicial y tope de la partida
    speedMax: c.SPEED_MAX,
    arrival: null, // { t, from, length, v } mientras frena junto a la casa
    phase: null, // noche 6: "approach" (hacia la casa) | "escape" (la huida); null en las demás
    awake: null, // { t, struck } mientras la casa despierta
    outrunT: 0, // segundos desde que la criatura empezó a quedarse atrás
    caught: false, // la última partida terminó porque te atrapó la criatura
    speed: c.SPEED_START,
    distance: 0,
    best: loadBest(),
    newBest: false,
    fuel: c.FUEL.MAX,
    outOfFuel: false, // la última partida terminó por quedarse sin gasolina
    darkness: 0, // 0 se ve todo, 1 no se ve nada
    lightsOutIn: 0, // segundos hasta que fallen las luces
    radioOutIn: 0, // segundos hasta que falle la radio
    radioKilled: false, // la radio la apagó un apagón, no el jugador
    time: 0,
    shake: 0,
  };

  function loadBest() {
    try {
      return Number(localStorage.getItem(c.STORAGE_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      localStorage.setItem(c.STORAGE_KEY, String(value));
    } catch (e) {
      // Sin almacenamiento (modo privado, etc.): el récord solo dura esta sesión
    }
  }

  function score() {
    return Math.floor(state.distance * c.SCORE_PER_PX);
  }

  function nightData() {
    return state.night === null ? null : story.NIGHTS[state.night];
  }

  function isStorm() {
    const night = nightData();
    return !!(night && night.storm);
  }

  // Distancia en px de la entrega de esta noche
  function deliveryDistance() {
    return nightData().miles * c.MILE_PX;
  }

  // Meta de lo que se está manejando: la entrega o, en la huida, el final de la huida
  function goalDistance() {
    return state.phase === "escape" ? nightData().escapeMiles * c.MILE_PX : deliveryDistance();
  }

  function milesLeft() {
    return Math.max(0, goalDistance() - state.distance) / c.MILE_PX;
  }

  // Lugar de la entrega para la ambientación; en modo infinito y en la huida no hay.
  // Mientras despierta, a la casa le salen tentáculos.
  function deliveryHouse() {
    if (state.night === null || state.phase === "escape") return null;
    const night = nightData();
    const house = { d: deliveryDistance(), color: night.house, sprite: night.place || "house" };
    if (state.mode === "awakening") house.awake = Math.min(1, state.awake.t / c.AWAKENING.GROW);
    return house;
  }

  // 0 al arrancar, 1 a la velocidad tope
  function difficulty() {
    const k = (state.speed - state.speedStart) / (state.speedMax - state.speedStart);
    return Math.max(0, Math.min(1, k));
  }

  // Distancia que recorre el carro frenando desde la velocidad actual
  function brakeLength() {
    return (state.speed * c.ARRIVAL.BRAKE_TIME) / 2;
  }

  function isPhone() {
    return state.mode === "briefing" || state.mode === "delivered" || state.mode === "ending";
  }

  // Deja la carretera como al principio: carro estacionado en la estación
  function resetWorld() {
    state.speed = state.speedStart;
    state.arrival = null;
    state.awake = null;
    state.phase = null;
    state.distance = 0;
    state.fuel = c.FUEL.MAX;
    state.darkness = 0;
    state.shake = 0;
    R67.road.reset();
    R67.player.reset();
    R67.obstacles.reset();
    R67.ghost.reset();
    R67.fog.reset();
    R67.weather.reset();
    R67.tentacles.reset();
    R67.monster.reset();
    R67.audio.stopChase();
  }

  // Arranca a manejar con las reglas y la noche que ya estén puestas
  function beginRun() {
    resetWorld();
    setMode("playing", 0);
    const night = nightData();
    state.phase = night && night.bonus ? "approach" : null;
    R67.lightning.reset();
    if (isStorm()) R67.weather.startStorm();
    state.newBest = false;
    state.outOfFuel = false;
    state.caught = false;
    scheduleLightsOut();
    scheduleRadioOut();
    // Si la radio quedó apagada por un apagón, vuelve al empezar de nuevo
    if (state.radioKilled) {
      R67.audio.setMuted(false);
      state.radioKilled = false;
    }
    R67.audio.restartMusic();
  }

  function startGame() {
    state.night = null;
    state.rules = story.ALL_RULES;
    state.speedStart = c.SPEED_START;
    state.speedMax = c.SPEED_MAX;
    beginRun();
  }

  // Modo historia: el carro espera en la estación mientras el teléfono muestra el pedido
  function openNight(i) {
    const night = story.NIGHTS[i];
    state.night = i;
    state.rules = night.rules;
    state.speedStart = night.speedStart;
    state.speedMax = night.speedMax;
    R67.audio.pauseMusic();
    resetWorld();
    R67.lightning.reset();
    setMode("briefing", 0);
    R67.audio.playPickup();
  }

  function startStory() {
    openNight(state.nextNight);
  }

  // Selector de noches: el carro vuelve a la estación detrás del menú
  function openLevels() {
    R67.audio.pauseMusic();
    resetWorld();
    R67.lightning.reset();
    state.night = null;
    setMode("levels", 0);
  }

  function nextNight() {
    openNight(state.night + 1);
  }

  // Tras perder se repite la misma noche, sin volver a leer el pedido.
  // Si te atraparon en la huida, se repite solo la huida.
  function retry() {
    if (state.night === null) startGame();
    else if (state.phase === "escape") {
      R67.lightning.reset();
      beginEscape();
    } else beginRun();
  }

  // Llegando a la casa: la calle se acaba, el carro se centra y frena hasta quedar
  // frente a ella, suenan el frenón y el claxon, y luego sale el teléfono
  function arrive() {
    const length = deliveryDistance() - state.distance;
    state.arrival = { t: 0, from: state.distance, length, v: (2 * length) / c.ARRIVAL.BRAKE_TIME };
    R67.ghost.reset();
    R67.player.lane = Math.floor(c.LANES / 2);
    R67.player.braking = true;
    setMode("arriving", 0);
    R67.audio.playBrake();
  }

  // Frenado parejo: la velocidad baja en línea recta hasta 0 justo en la casa
  function updateArrival(dt) {
    const a = state.arrival;
    a.t += dt;
    const k = Math.min(1, a.t / c.ARRIVAL.BRAKE_TIME);
    state.speed = a.v * (1 - k);
    state.distance = a.from + a.length * (1 - (1 - k) * (1 - k));

    R67.road.update(dt, state.speed);
    R67.obstacles.update(dt, state.speed, difficulty(), false);
    R67.fog.update(dt, state.rules.radio && R67.audio.isMuted(), state.speed);
    R67.weather.update(dt, false);
    R67.player.update(dt, 0);
    R67.player.y += (c.PLAYER_Y - R67.player.y) * Math.min(1, dt * 4);

    if (a.t >= c.ARRIVAL.HOLD) {
      if (state.phase === "approach") startAwakening();
      else deliver();
    }
  }

  // Noche 6: tras el claxon la música se corta, la casa gruñe y le salen tentáculos;
  // el carro da la vuelta y un rayo deja todo en negro justo cuando empieza la huida
  function startAwakening() {
    state.awake = { t: 0, struck: false };
    R67.player.braking = false;
    // El limpiaparabrisas pasa solo para que se vea bien lo que viene
    R67.weather.wipe();
    setMode("awakening", 0);
    R67.audio.pauseMusic();
    R67.audio.playGrowl();
  }

  function updateAwakening(dt) {
    const a = state.awake;
    const w = c.AWAKENING;
    a.t += dt;
    state.shake = Math.max(state.shake, 0.08); // la tierra tiembla
    R67.fog.update(dt, state.rules.radio && R67.audio.isMuted(), 0);
    // Durante la escena el parabrisas no se vuelve a mojar
    const wet = R67.weather.wet;
    R67.weather.update(dt, false);
    R67.weather.wet = Math.min(wet, R67.weather.wet);
    if (a.t >= w.TURN_AT) R67.player.angle = Math.PI * Math.min(1, (a.t - w.TURN_AT) / w.TURN);
    if (!a.struck && a.t >= w.STRIKE_AT) {
      a.struck = true;
      R67.lightning.strike();
    }
    if (a.t >= w.ESCAPE_AT) beginEscape();
  }

  // La huida: carretera nueva en sentido contrario, la criatura detrás y sus
  // tentáculos atacando. El rayo que cayó sigue tapando la pantalla. La radio se
  // queda pegada en Black Knife (no falla ni se apaga) y el carro avanza y
  // retrocede más rápido para esquivar los barridos.
  function beginEscape() {
    const night = nightData();
    state.speedStart = night.escapeSpeed[0];
    state.speedMax = night.escapeSpeed[1];
    resetWorld();
    state.phase = "escape";
    state.caught = false;
    state.rules = Object.assign({}, night.rules, { radio: false });
    state.radioKilled = false;
    R67.player.vspeed = c.MONSTER.VSPEED;
    R67.audio.startChase();
    R67.weather.startStorm();
    scheduleLightsOut();
    scheduleRadioOut();
    setMode("playing", 0);
  }

  // Llegaste al final de la huida: la criatura se va quedando atrás
  function outrun() {
    state.outrunT = 0;
    R67.monster.retreat();
    R67.tentacles.reset();
    setMode("outrun", 0);
  }

  function updateOutrun(dt) {
    state.outrunT += dt;
    state.distance += state.speed * dt;
    R67.road.update(dt, state.speed);
    R67.obstacles.update(dt, state.speed, difficulty(), false);
    R67.fog.update(dt, state.rules.radio && R67.audio.isMuted(), state.speed);
    R67.weather.update(dt, false);
    R67.monster.update(dt);
    R67.player.update(dt, 0);
    R67.player.y += (c.PLAYER_Y - R67.player.y) * Math.min(1, dt * 2);
    if (state.outrunT >= c.AWAKENING.OUTRUN) {
      R67.audio.pauseMusic();
      R67.audio.playPickup();
      setEndingOptions(false);
      setMode("ending", 0);
    }
  }

  // Al terminar la noche 5 el teléfono ofrece además la noche 6, recién desbloqueada
  function setEndingOptions(offerBonus) {
    const options = [
      { label: "ELEGIR NOCHE", action: openLevels },
      { label: "MENU", action: goToMenu },
    ];
    if (offerBonus) options.unshift({ label: "NOCHE 6", action: () => openNight(story.MAIN) });
    SCREENS.ending.options = options;
    SCREENS.ending.y = options.length > 2 ? 450 : 480;
  }

  // Llegaste a la dirección: se guarda el avance y el teléfono confirma la entrega.
  // Al terminar la última noche la historia vuelve a empezar desde la primera.
  function deliver() {
    const last = state.night === story.MAIN - 1;
    state.nextNight = last ? 0 : state.night + 1;
    story.save(state.nextNight);
    if (last) {
      state.completed = true;
      story.setCompleted(true);
    }
    refreshMenu();
    R67.player.braking = false;
    R67.audio.pauseMusic();
    R67.audio.playPickup();
    if (last) setEndingOptions(true);
    setMode(last ? "ending" : "delivered", 0);
  }

  // Opciones del menú principal. Con la historia terminada, MODO HISTORIA abre el
  // selector de noches. Reiniciar solo aparece si ya hay avance, y pide confirmación
  // para no perderlo por accidente.
  function refreshMenu() {
    state.confirmReset = false;
    const options = [
      state.completed
        ? { label: "MODO HISTORIA", action: openLevels, note: "ELEGIR NOCHE" }
        : { label: "MODO HISTORIA", action: startStory, note: "NOCHE " + (state.nextNight + 1) },
      { label: "MODO INFINITO", action: startGame },
    ];
    if (state.nextNight > 0 || state.completed) {
      options.push({ label: "REINICIAR NOCHES", action: resetStory });
    }
    SCREENS.menu.options = options;
  }

  function resetStory() {
    if (!state.confirmReset) {
      const option = SCREENS.menu.options[2];
      option.label = "SEGURO?";
      option.note = "ENTER DE NUEVO PARA BORRAR";
      state.confirmReset = true;
      return;
    }
    state.nextNight = 0;
    story.save(0);
    state.completed = false;
    story.setCompleted(false);
    refreshMenu();
    state.selected = 0;
  }

  function goToMenu() {
    R67.audio.pauseMusic();
    resetWorld();
    R67.lightning.reset();
    state.night = null;
    refreshMenu();
    setMode("menu", 1);
  }

  function setMode(mode, selected) {
    state.mode = mode;
    state.selected = selected;
    state.phoneT = 0;
  }

  // Pantallas con opciones: altura de la primera opción y lista de opciones
  const SCREENS = {
    menu: { y: 214, options: [] }, // las llena refreshMenu
    // Las del teléfono quedan dentro de su pantalla
    briefing: {
      y: 480,
      options: [
        { label: "ACEPTAR PEDIDO", action: beginRun },
        { label: "MENU", action: goToMenu },
      ],
    },
    delivered: {
      y: 480,
      options: [
        { label: "SIGUIENTE NOCHE", action: nextNight },
        { label: "MENU", action: goToMenu },
      ],
    },
    ending: { y: 480, options: [] }, // las llena setEndingOptions
    // Una opción por noche, con su dirección debajo (la 6 incluida)
    levels: {
      y: 110,
      options: story.NIGHTS.map((night, i) => ({
        label: "NOCHE " + (i + 1),
        note: night.address,
        action: () => openNight(i),
      })).concat([{ label: "VOLVER", action: goToMenu }]),
    },
    paused: {
      y: 340,
      options: [
        { label: "CONTINUAR", action: resumeGame },
        { label: "MENU", action: goToMenu },
      ],
    },
    over: {
      y: 440,
      options: [
        { label: "REINTENTAR", action: retry },
        { label: "MENU", action: goToMenu },
      ],
    },
  };

  // Pantalla de opciones activa, o null si se está jugando.
  // Tras chocar se espera a que termine la sacudida para no elegir por accidente.
  function currentScreen() {
    if (state.mode === "over" && state.shake > 0) return null;
    return SCREENS[state.mode] || null;
  }

  function moveSelection(dir) {
    const screen = currentScreen();
    if (!screen) return;
    // Moverse cancela la confirmación de reiniciar las noches
    if (state.confirmReset) refreshMenu();
    const n = screen.options.length;
    state.selected = (state.selected + dir + n) % n;
  }

  function activate(i) {
    const screen = currentScreen();
    const option = screen && screen.options[i];
    if (!option || option.disabled) return;
    // Mientras el teléfono escribe, la primera pulsación solo termina el texto
    if (isPhone()) {
      const msg = R67.phone.message(state.mode, story.NIGHTS[state.night]);
      if (!R67.phone.done(msg, state.phoneT)) {
        state.phoneT = R67.phone.SLIDE_TIME + msg.length / R67.phone.TYPE_SPEED;
        return;
      }
    }
    option.action();
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  // Las luces y la radio fallan por separado, cada una con su propio reloj
  function scheduleLightsOut() {
    state.lightsOutIn = randomBetween(c.BLACKOUT.LIGHTS_MIN, c.BLACKOUT.LIGHTS_MAX);
  }

  function scheduleRadioOut() {
    state.radioOutIn = randomBetween(c.BLACKOUT.RADIO_MIN, c.BLACKOUT.RADIO_MAX);
  }

  // Suena el clic del interruptor tanto si las cambia el jugador como si fallan solas
  function setLights(on) {
    if (R67.player.lightsOn === on) return;
    R67.player.lightsOn = on;
    R67.audio.playBlackout();
  }

  function toggleLights() {
    setLights(!R67.player.lightsOn);
  }

  function lightsOut() {
    setLights(false);
    scheduleLightsOut();
  }

  function radioOut() {
    if (!R67.audio.isMuted()) {
      R67.audio.setMuted(true);
      state.radioKilled = true;
    }
    scheduleRadioOut();
  }

  // El limpiaparabrisas solo funciona con el motor en marcha
  function wipe() {
    if (state.mode === "playing") R67.weather.wipe();
  }

  // En la persecución la radio está pegada y no responde
  function toggleRadio() {
    if (R67.audio.chasing) return;
    R67.audio.toggleMute();
    state.radioKilled = false;
  }

  // Apagar el motor: la partida y la música se congelan
  function pauseGame() {
    if (state.mode !== "playing") return;
    setMode("paused", 0);
    R67.audio.pauseMusic();
  }

  function resumeGame() {
    if (state.mode !== "paused") return;
    setMode("playing", 0);
    R67.audio.resumeMusic();
  }

  // Botón de motor: apaga si está en marcha, enciende si está apagado.
  // En el menú arranca el modo infinito; en las demás pantallas elige la primera opción
  // (tras chocar no hay pantalla hasta que termina la sacudida).
  function toggleEngine() {
    if (state.mode === "playing") pauseGame();
    else if (state.mode === "paused") resumeGame();
    else if (state.mode === "menu") startGame();
    else if (state.mode === "levels") goToMenu();
    else if (currentScreen()) activate(0);
  }

  // crashed: true si fue un choque; false si se acabó la gasolina
  function endGame(crashed) {
    setMode("over", 0);
    state.outOfFuel = !crashed;
    if (crashed) {
      state.shake = 0.35;
      R67.audio.playCrash();
    }
    if (state.night === null && score() > state.best) {
      state.best = score();
      state.newBest = true;
      saveBest(state.best);
    }
  }

  function update(dt) {
    state.time += dt;
    state.phoneT += dt;
    state.shake = Math.max(0, state.shake - dt);

    let mph = 0;
    if (state.mode === "playing") mph = state.speed * c.MPH_PER_PX - R67.input.axisY() * c.MPH_BOOST;
    else if (state.mode === "arriving" || state.mode === "outrun") mph = state.speed * c.MPH_PER_PX;
    R67.dashboard.update(dt, mph);

    // Con el motor apagado el rayo se congela; si no, termina aunque ya no se maneje
    if (state.mode !== "paused") R67.lightning.update(dt, state.mode === "playing" && isStorm());

    if (state.mode === "arriving") updateArrival(dt);
    else if (state.mode === "awakening") updateAwakening(dt);
    else if (state.mode === "outrun") updateOutrun(dt);
    if (state.mode !== "playing") return;

    state.speed = Math.min(state.speedMax, state.speed + c.SPEED_ACCEL * dt);
    state.distance += state.speed * dt;

    // En el último tramo ya no salen obstáculos ni fantasmas: se llega con la carretera libre
    const escaping = state.phase === "escape";
    const remaining = state.night === null ? Infinity : goalDistance() - state.distance;
    const quiet = remaining < (escaping ? 0 : brakeLength()) + c.ARRIVAL.CLEAR;

    R67.road.update(dt, state.speed);
    R67.player.update(dt, R67.input.axisY());
    R67.obstacles.update(dt, state.speed, difficulty(), !quiet);

    // Cada mecánica solo corre si la noche la incluye
    const rules = state.rules;
    if (rules.ghost && (!quiet || R67.ghost.active)) R67.ghost.update(dt, score(), R67.player.lane);
    if (escaping) {
      R67.tentacles.update(dt, R67.player, !quiet);
      R67.monster.update(dt);
    }
    R67.fog.update(dt, rules.radio && R67.audio.isMuted(), state.speed);
    R67.weather.update(dt, rules.rain);

    if (rules.lights) {
      state.lightsOutIn -= dt;
      if (state.lightsOutIn <= 0) lightsOut();
    }
    if (rules.radio) {
      state.radioOutIn -= dt;
      if (state.radioOutIn <= 0) radioOut();
    }

    const d = c.DARKNESS;
    state.darkness = R67.player.lightsOn
      ? Math.max(0, state.darkness - dt / d.FADE_OUT)
      : Math.min(1, state.darkness + dt / d.FADE_IN);

    const box = R67.player.hitbox();
    const f = c.FUEL;
    state.fuel -= f.DRAIN_PER_PX * state.speed * dt;
    const cans = R67.obstacles.collect(box);
    if (cans > 0) {
      state.fuel = Math.min(f.MAX, state.fuel + cans * f.PICKUP);
      R67.audio.playPickup();
    }

    // La criatura te atrapa con la masa o con un tentáculo
    const caught = escaping && (R67.monster.catches(box) || R67.tentacles.hits(box));
    if (caught || R67.obstacles.hits(box) || R67.ghost.hits(box)) {
      state.caught = caught;
      endGame(true);
    } else if (state.fuel <= 0) {
      state.fuel = 0;
      endGame(false);
    } else if (escaping && remaining <= 0) outrun();
    else if (!escaping && remaining <= brakeLength()) arrive();
  }

  function text(str, x, y, size, color, align) {
    ctx.font = size + "px " + c.FONT;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText(str, x + 2, y + 2);
    // Resplandor de neón
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function drawHud() {
    R67.dashboard.drawFuel(ctx, state.fuel / c.FUEL.MAX, state.time);
    if (state.night === null) {
      text(String(score()).padStart(5, "0"), 12, 22, 14, c.COLORS.text, "left");
      text("MAX " + String(state.best).padStart(5, "0"), c.WIDTH - 12, 22, 10, c.COLORS.accent, "right");
    } else {
      let left = (state.phase === "escape" ? "ESCAPA " : "FALTAN ") + milesLeft().toFixed(1) + " MI";
      if (state.mode === "arriving") left = "DESTINO";
      else if (state.mode === "awakening") left = "CORRE";
      else if (state.mode === "outrun") left = "LO PERDISTE";
      const danger = state.phase === "escape" || state.mode === "awakening";
      text(left, 12, 22, 10, danger ? c.COLORS.danger : c.COLORS.text, "left");
      text("NOCHE " + (state.night + 1), c.WIDTH - 12, 22, 10, c.COLORS.accent, "right");
    }
  }

  function drawOverlay(alpha) {
    ctx.fillStyle = "rgba(" + c.COLORS.overlay + ", " + (alpha || 0.7) + ")";
    ctx.fillRect(0, 0, c.WIDTH, c.HEIGHT);
  }

  function blink() {
    return Math.floor(state.time * 2) % 2 === 0;
  }

  // Opciones de la pantalla actual y, debajo, cómo elegir
  function drawOptions(screen) {
    R67.menu.draw(ctx, text, screen.options, state.selected, screen.y);
    const hintY = screen.y + screen.options.length * R67.menu.ROW_H - 4;
    text("W/S: ELEGIR  ENTER: OK", c.WIDTH / 2, hintY, 7, "#b37a00");
  }

  function drawMenu() {
    // Velo suave para que se vea el carro estacionado en la estación
    drawOverlay(0.4);
    const cx = c.WIDTH / 2;
    text("ROUTE", cx, 100, 36, c.COLORS.accent);
    text("67", cx, 150, 48, c.COLORS.danger);
    drawOptions(SCREENS.menu);
    // Debajo del arco de la estación, para dejar lugar a una tercera opción
    text("FLECHAS O WASD: MOVER", cx, 432, 8, c.COLORS.text);
    text("M: MUSICA   P: PAUSA", cx, 448, 8, c.COLORS.text);
    text("L: LUCES   E: LIMPIA", cx, 464, 8, c.COLORS.text);
    text("MAX " + String(state.best).padStart(5, "0"), cx, 606, 10, c.COLORS.accent);
  }

  function drawGameOver() {
    drawOverlay();
    const cx = c.WIDTH / 2;
    text("GAME", cx, 210, 36, c.COLORS.danger);
    text("OVER", cx, 256, 36, c.COLORS.danger);
    if (state.outOfFuel) text("SIN GASOLINA", cx, 296, 12, c.COLORS.accent);
    else if (state.caught) text("TE ATRAPO", cx, 296, 12, c.COLORS.danger);
    if (state.night === null) {
      text("PUNTOS " + String(score()).padStart(5, "0"), cx, 330, 12, c.COLORS.text);
      text("MAX    " + String(state.best).padStart(5, "0"), cx, 358, 12, c.COLORS.accent);
      if (state.newBest && blink()) text("NUEVO RECORD!", cx, 394, 12, c.COLORS.accent);
    } else {
      text("NOCHE " + (state.night + 1), cx, 330, 12, c.COLORS.accent);
      text("FALTABAN " + milesLeft().toFixed(1) + " MI", cx, 358, 12, c.COLORS.text);
    }
    drawOptions(SCREENS.over);
  }

  // El teléfono sube desde abajo con la pantalla de la app y sus opciones
  function drawPhone() {
    drawOverlay(0.55);
    ctx.save();
    ctx.translate(0, Math.round(R67.phone.slide(state.phoneT)));
    if (state.mode === "briefing") R67.phone.drawBriefing(ctx, story.NIGHTS, state.night, state.phoneT);
    else R67.phone.drawDelivered(ctx, story.NIGHTS, state.night, state.phoneT);
    const screen = SCREENS[state.mode];
    R67.phone.drawOptions(ctx, screen.options, state.selected, screen.y);
    ctx.restore();
  }

  // Cada noche del modo historia se ve más oscura. Con los faros prendidos
  // queda un claro adelante del carro para que se alcance a ver el camino.
  function drawNightShade() {
    const a = state.night === null ? 0 : nightData().shade;
    if (!a) return;
    const p = R67.player;
    if (p.lightsOn) {
      const x = p.x;
      const y = p.y - 90;
      const shade = ctx.createRadialGradient(x, y, 40, x, y, 260);
      shade.addColorStop(0, "rgba(0, 0, 0, " + a * 0.2 + ")");
      shade.addColorStop(1, "rgba(0, 0, 0, " + a + ")");
      ctx.fillStyle = shade;
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, " + a + ")";
    }
    ctx.fillRect(0, 0, c.WIDTH, c.HEIGHT);
  }

  function drawLevels() {
    drawOverlay(0.95);
    text("ELEGIR NOCHE", c.WIDTH / 2, 60, 18, c.COLORS.accent);
    drawOptions(SCREENS.levels);
  }

  function drawPaused() {
    drawOverlay();
    const cx = c.WIDTH / 2;
    text("MOTOR", cx, 230, 30, c.COLORS.accent);
    text("APAGADO", cx, 272, 30, c.COLORS.accent);
    drawOptions(SCREENS.paused);
  }

  function draw() {
    ctx.save();
    if (state.shake > 0) {
      const m = state.shake * 20;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }

    R67.road.draw(ctx);
    R67.scenery.drawUnder(ctx, state.distance, state.time, deliveryHouse());
    R67.obstacles.draw(ctx);
    R67.player.draw(ctx);
    R67.scenery.drawOver(ctx, state.distance, state.time, deliveryHouse());
    R67.fog.draw(ctx, state.distance, state.time);
    // El fantasma va encima de la niebla para que su aviso siempre se vea
    R67.ghost.draw(ctx);
    R67.weather.drawRain(ctx, state.time);
    ctx.restore();

    // Oscuridad sobre la carretera; el HUD se dibuja después y sigue visible
    drawNightShade();
    if (state.darkness > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, " + state.darkness * c.DARKNESS.MAX_ALPHA + ")";
      ctx.fillRect(0, 0, c.WIDTH, c.HEIGHT);
    }

    // Parabrisas mojado: se desenfoca todo lo de la carretera y encima van las gotas
    R67.weather.blurPlayfield(ctx, canvas);
    R67.weather.drawWindshield(ctx);

    // El haz del faro brilla por encima de la oscuridad
    R67.scenery.drawBeacon(ctx, state.distance, state.time, deliveryHouse());

    // La criatura y sus tentáculos también se distinguen en la oscuridad
    if (state.phase === "escape") {
      R67.monster.draw(ctx, state.time);
      R67.tentacles.draw(ctx, state.time);
    }

    // Rayo: destello blanco y luego todo negro un momento
    R67.lightning.draw(ctx);

    if (state.mode === "menu") drawMenu();
    else if (state.mode === "levels") drawLevels();
    else if (isPhone()) drawPhone();
    else {
      drawHud();
      if (state.mode === "over" && state.shake === 0) drawGameOver();
      if (state.mode === "paused") drawPaused();
    }

    // El tablero va al final para tapar lo que la sacudida empuje fuera de la carretera
    R67.dashboard.draw(ctx, {
      driving: ["playing", "arriving", "awakening", "outrun"].includes(state.mode),
      difficulty: difficulty(),
      distance: state.distance,
      lane: R67.player.lane,
      lights: R67.player.lightsOn,
      raining: R67.weather.raining,
      wiping: R67.weather.isWiping(),
      time: state.time,
    });

    R67.crt.draw(ctx);
  }

  let last = performance.now();
  function frame(now) {
    // Límite de dt para que al volver de otra pestaña no haya un salto enorme
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  R67.input.onLeft = function () {
    if (state.mode === "playing") R67.player.move(-1);
  };
  R67.input.onRight = function () {
    if (state.mode === "playing") R67.player.move(1);
  };
  R67.input.onUp = function () {
    moveSelection(-1);
  };
  R67.input.onDown = function () {
    moveSelection(1);
  };
  R67.input.onAction = function () {
    if (currentScreen()) activate(state.selected);
  };
  // Toque en la carretera: en pantallas con opciones elige la tocada.
  // Devuelve true si lo usó, para que no cuente además como cambio de carril.
  R67.input.onPlayfieldTap = function (x, y) {
    const screen = currentScreen();
    if (!screen) return false;
    const i = R67.menu.hit(screen.options, screen.y, y);
    if (i >= 0) {
      state.selected = i;
      activate(i);
    }
    return true;
  };
  R67.input.onPause = toggleEngine;
  R67.input.onLights = toggleLights;
  R67.input.onWipe = wipe;
  R67.input.onPanelTap = function (x, y) {
    // Motor y radio tienen su zona; el resto del tablero prende o apaga las luces
    if (R67.dashboard.hitsEngine(x, y)) toggleEngine();
    else if (R67.dashboard.hitsWiper(x, y)) wipe();
    else if (R67.dashboard.hitsRadio(x, y)) toggleRadio();
    else toggleLights();
  };

  // Al cambiar de ventana o pestaña el motor se apaga solo
  window.addEventListener("blur", pauseGame);

  R67.input.onMute = toggleRadio;

  refreshMenu();
  R67.audio.init();
  R67.input.init(canvas);
  R67.player.reset();
  requestAnimationFrame(frame);
})();
