// Espacio de nombres global del juego. Cada archivo cuelga su parte de aquí.
const R67 = (window.R67 = window.R67 || {});

R67.config = {
  WIDTH: 360, // ancho de la zona de juego (carretera)
  HEIGHT: 640,
  PANEL_W: 160, // tablero a la derecha; el canvas mide WIDTH + PANEL_W

  // Tablero
  MPH_PER_PX: 0.2, // convierte la velocidad interna (px/s) a mph mostradas
  MPH_BOOST: 8, // mph que suma o resta moverse adelante o atrás
  MPH_GAUGE_MAX: 140,
  MILE_PX: 2600, // px de carretera que cuentan como una milla (odómetro y letreros)
  RADIO_FREQ: "67.0",
  MUSIC_TITLE: "SMASHING WINDSHIELDS",

  // Carretera
  LANES: 5,
  ROAD_X: 50,
  ROAD_W: 260,
  DASH_PERIOD: 80,

  // Escala de cada sprite respecto a su dibujo base (ver sprites.js)
  SPRITE_SCALE: { car: 0.7, cone: 0.8, barrier: 0.7, pothole: 0.9, sign: 0.85, ghost: 0.9, fuel: 0.9, house: 4, lighthouse: 4, barn: 4, church: 4 },

  // Cajas de choque, más chicas que los dibujos para que los roces no cuenten
  HITBOX: {
    OBSTACLE_SHRINK_X: 0.18, // fracción del ancho que se recorta de cada lado
    OBSTACLE_SHRINK_Y: 0.12, // fracción del alto que se recorta arriba y abajo
    PLAYER_PAD_X: 5, // px recortados a cada lado del carro
    PLAYER_PAD_Y: 4,
  },

  // Gasolina: se gasta según la distancia recorrida y se recarga con bidones en la carretera
  FUEL: {
    MAX: 100,
    DRAIN_PER_PX: 0.0085, // gasto por px de carretera (a más velocidad, más gasto por segundo)
    PICKUP: 30, // lo que recarga cada bidón
    LOW: 0.25, // fracción a partir de la cual el indicador avisa
    MIN_ROWS: 7, // filas de obstáculos mínimas entre bidones
    MAX_ROWS: 12, // a esta cantidad de filas el bidón sale seguro
    CHANCE: 0.3, // probabilidad por fila una vez pasado el mínimo
  },

  // Oscuridad: con las luces apagadas la carretera se va quedando a oscuras
  DARKNESS: {
    FADE_IN: 6, // segundos hasta no ver nada
    FADE_OUT: 0.5, // segundos en volver a verse al prender las luces
    MAX_ALPHA: 0.97,
  },

  // Niebla: con la radio apagada la carretera se llena de niebla y salen sombras
  FOG: {
    FADE_IN: 8, // segundos hasta la niebla máxima
    FADE_OUT: 1.2, // segundos en disiparse al prender la radio
    TOP_ALPHA: 1, // espesor arriba (lo que viene): 1 = no se ve nada
    THICK_UNTIL: 0.6, // fracción del tramo hasta el carro que queda totalmente tapada
    BOTTOM_ALPHA: 0.35, // espesor cerca del carro
    COLOR: "150, 140, 180", // RGB
    SHADOW_FROM: 0.3, // nivel de niebla desde el que salen sombras
  },

  // Lluvia: el parabrisas se moja y la vista se pone borrosa hasta limpiarlo
  RAIN: {
    MIN: 20, // segundos mínimos sin lluvia
    MAX: 45, // segundos máximos sin lluvia
    DURATION_MIN: 10, // segundos que dura cada lluvia
    DURATION_MAX: 20,
    WET_TIME: 6, // segundos de lluvia hasta quedar empapado
    DRY_TIME: 15, // segundos en secarse solo cuando para
    BLUR_MAX: 6, // px de desenfoque con el parabrisas empapado
    WIPE_TIME: 0.6, // segundos de una pasada del limpiaparabrisas
  },

  // Fallas: cada tanto las luces o la radio se apagan solas, cada una por su cuenta.
  // Segundos mínimos y máximos entre fallas de cada una.
  BLACKOUT: {
    LIGHTS_MIN: 12,
    LIGHTS_MAX: 26,
    RADIO_MIN: 15,
    RADIO_MAX: 35,
  },

  // Fantasma: aparece en tu carril, flota un momento y se lanza hacia abajo
  GHOST: {
    FIRST_DELAY: 6, // segundos antes del primero
    INTERVAL_START: 10, // segundos entre fantasmas con puntaje 0
    INTERVAL_MIN: 2.5, // segundos entre fantasmas con puntaje alto
    SCORE_FULL: 6000, // puntaje al que se llega al intervalo mínimo
    HOVER_TIME: 1, // segundos flotando antes de lanzarse
    HOVER_Y: 80,
    DIVE_SPEED: 1100, // px/s
  },

  // Llegada a la casa en el modo historia: la calle se acaba frente a la casa,
  // el carro frena hasta quedar ante ella y toca el claxon
  ARRIVAL: {
    BRAKE_TIME: 1.6, // segundos frenando hasta parar frente a la casa
    END_GAP: 60, // px entre donde se para el carro y el fin de la calle
    HOLD: 3.4, // segundos desde que empieza a frenar hasta que sale el teléfono
    CLEAR: 800, // px antes de frenar en los que ya no salen obstáculos ni fantasmas
  },

  // Noche 6. Rayos: de vez en cuando un destello blanco y luego negro total un momento
  LIGHTNING: {
    MIN: 5, // segundos mínimos entre rayos
    MAX: 11,
    FLASH: 0.15, // segundos de destello blanco
    BLACK: 0.5, // segundos sin ver nada
    FADE: 0.3, // segundos en volver a verse
  },

  // La casa despierta: le salen tentáculos y el carro da la vuelta
  AWAKENING: {
    GROW: 2.2, // segundos que tardan en crecer los tentáculos
    TURN_AT: 2.3, // segundo en que el carro empieza a dar la vuelta
    TURN: 0.6, // segundos que tarda en dar la vuelta
    STRIKE_AT: 3.1, // segundo en que cae el rayo que tapa el cambio a la huida
    ESCAPE_AT: 3.35, // segundo en que empieza la huida (con la pantalla en negro)
    OUTRUN: 2.5, // segundos que tarda la criatura en quedarse atrás al final
  },

  // La criatura que te persigue en la huida, pegada a la parte de abajo
  MONSTER: {
    Y: 596, // borde de arriba de la masa en reposo
    SURGE: 26, // px que se estira hacia adelante en cada arremetida
    RISE: 1.2, // segundos que tarda en aparecer al empezar la huida
    VSPEED: 560, // px/s adelante/atrás del carro en la huida, para esquivar los barridos
  },

  // Ataques de tentáculo en la huida (reemplazan al fantasma): azote por carril
  // y barrido de lado a lado por la fila donde estás
  TENTACLE: {
    FIRST_DELAY: 3, // segundos antes del primero
    INTERVAL_MIN: 2.2, // segundos entre ataques
    INTERVAL_MAX: 4.5,
    WARN: 0.9, // segundos de aviso con el carril en rojo
    LASH: 0.12, // segundos que tarda en llegar hasta arriba
    HOLD: 0.25, // segundos estirado
    RETRACT: 0.35, // segundos en recogerse
    WIDTH: 26, // grosor en la base del azote por carril
    SWEEP_CHANCE: 0.5, // probabilidad de que el ataque sea un barrido
    BAND: 60, // alto de la fila que barre
  },

  // Jugador
  PLAYER_Y: 530, // posición inicial
  PLAYER_Y_MIN: 140, // límite hacia adelante
  PLAYER_Y_MAX: 600, // límite hacia atrás
  PLAYER_SLIDE_SPEED: 900, // px/s al cambiar de carril
  PLAYER_VSPEED: 260, // px/s hacia adelante/atrás

  // Música
  MUSIC_SRC: "assets/audio/music.mp3",
  MUSIC_VOLUME: 0.5,

  // Efectos de sonido
  CRASH_SRC: "assets/audio/bom08.wav",
  GHOST_SRC: "assets/audio/byoro02.wav",
  BLACKOUT_SRC: "assets/audio/clock01.wav",
  PICKUP_SRC: "assets/audio/coin03.wav",
  BRAKE_SRC: "assets/audio/brake_horn.mp3", // frenón y claxon al llegar a la casa
  GROWL_SRC: "assets/audio/growl.mp3", // la casa despierta (noche 6)
  SLAM_SRC: "assets/audio/bom20_c.wav", // golpe de un tentáculo

  // Persecución de la noche 6: la radio se queda pegada en esta canción
  CHASE_SRC: "assets/audio/black_knife.mp3",
  CHASE_TITLE: "BLACK KNIFE",
  CHASE_FREQ: "66.6",

  // Lo que se oye mientras la radio está apagada: Siren Head, en bucle
  AMBIENT_SRC: "assets/audio/sirenhead.mp3",
  AMBIENT_VOLUME: 0.6,
  SFX_VOLUME: 0.8,

  // Dificultad
  SPEED_START: 260, // px/s
  SPEED_MAX: 620,
  SPEED_ACCEL: 2.5, // px/s ganados por segundo (llega al máximo en ~2.4 min, ~6300 pts)
  GAP_START: 360, // distancia entre filas de obstáculos
  GAP_MIN: 250,
  EXTRA_CHANCE_START: 0.3, // probabilidad de cada obstáculo extra en una fila
  EXTRA_CHANCE_MAX: 0.45,

  SCORE_PER_PX: 0.1,
  STORAGE_KEY: "route67.best",

  FONT: '"Press Start 2P", "Courier New", monospace',

  COLORS: {
    // Paleta nocturna: pasto azulado, asfalto casi negro, neón verde y ámbar
    grass: "#11343d",
    grassDark: "#0d2a33",
    road: "#1c1c28",
    curbA: "#7a1f2b",
    curbB: "#8a8a9a",
    dash: "#b89a2e",
    player: "#e63946",
    text: "#39ff14", // verde neón
    accent: "#ffb000", // ámbar
    danger: "#ff3355",
    overlay: "5, 5, 12", // RGB del velo de las pantallas
  },
};

R67.config.LANE_W = R67.config.ROAD_W / R67.config.LANES;

// Centro en X del carril (0 = izquierda)
R67.laneCenter = function (lane) {
  const c = R67.config;
  return c.ROAD_X + c.LANE_W * (lane + 0.5);
};
