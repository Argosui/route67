// Idiomas: español e inglés. t(clave) da el texto en el idioma elegido.
// Los textos de cada noche (pedido, noticias, controles) están en story.js:
// los de inglés van en el campo "en" de cada noche.
R67.i18n = {
  STORAGE_KEY: "route67.lang",
  LANGS: ["es", "en"],
  lang: "es",

  STRINGS: {
    es: {
      LANGUAGE: "IDIOMA: ESPANOL",
      STORY: "MODO HISTORIA",
      ENDLESS: "MODO INFINITO",
      RESET: "REINICIAR NOCHES",
      SURE: "SEGURO?",
      SURE_NOTE: "ENTER DE NUEVO PARA BORRAR",
      PICK_NIGHT: "ELEGIR NOCHE",
      NIGHT: "NOCHE",
      MENU: "MENU",
      BACK: "VOLVER",
      ACCEPT: "ACEPTAR PEDIDO",
      NEXT_NIGHT: "SIGUIENTE NOCHE",
      CONTINUE: "CONTINUAR",
      RETRY: "REINTENTAR",
      HINT: "W/S: ELEGIR  ENTER: OK",
      HELP_1: "FLECHAS O WASD: MOVER",
      HELP_2: "M: MUSICA   P: PAUSA",
      HELP_3: "L: LUCES   E: LIMPIA",
      OUT_OF_FUEL: "SIN GASOLINA",
      CAUGHT: "TE ATRAPO",
      POINTS: "PUNTOS ",
      NEW_RECORD: "NUEVO RECORD!",
      MISSED_BY: "FALTABAN ",
      LEFT: "FALTAN ",
      ESCAPE: "ESCAPA ",
      DESTINATION: "DESTINO",
      RUN: "CORRE",
      LOST_IT: "LO PERDISTE",
      ENGINE: "MOTOR",
      ENGINE_OFF: "APAGADO",
      // Tablero
      GEAR: "MARCHA",
      MILES: "MILLAS",
      LANE: "CARRIL",
      LIGHT: "LUZ",
      WIPER: "LIMPIA",
      PANEL_1: "FLECHAS / WASD",
      PANEL_2: "M:RADIO  P:MOTOR",
      PANEL_3: "L:LUCES  E:LIMPIA",
      // Teléfono
      ORDER: "PEDIDO #",
      DELIVER_TO: "ENTREGAR EN:",
      LIVE: "EN VIVO",
      NEWS: "NOTICIAS 67",
      CONTROLS: "CONTROLES",
      NEW: "NUEVO",
      BREAKING: "ULTIMA HORA: ",
      ESCAPED: ["ESCAPASTE", "CON VIDA"],
      LAST_DELIVERY: ["ULTIMA", "ENTREGA"],
      DELIVERED: ["PAQUETE", "ENTREGADO"],
    },
    en: {
      LANGUAGE: "LANGUAGE: ENGLISH",
      STORY: "STORY MODE",
      ENDLESS: "ENDLESS MODE",
      RESET: "RESET NIGHTS",
      SURE: "ARE YOU SURE?",
      SURE_NOTE: "PRESS ENTER AGAIN TO ERASE",
      PICK_NIGHT: "CHOOSE NIGHT",
      NIGHT: "NIGHT",
      MENU: "MENU",
      BACK: "BACK",
      ACCEPT: "ACCEPT ORDER",
      NEXT_NIGHT: "NEXT NIGHT",
      CONTINUE: "CONTINUE",
      RETRY: "RETRY",
      HINT: "W/S: SELECT  ENTER: OK",
      HELP_1: "ARROWS OR WASD: MOVE",
      HELP_2: "M: MUSIC   P: PAUSE",
      HELP_3: "L: LIGHTS   E: WIPE",
      OUT_OF_FUEL: "OUT OF GAS",
      CAUGHT: "IT GOT YOU",
      POINTS: "SCORE  ",
      NEW_RECORD: "NEW RECORD!",
      MISSED_BY: "MISSED BY ",
      LEFT: "LEFT ",
      ESCAPE: "ESCAPE ",
      DESTINATION: "DESTINATION",
      RUN: "RUN",
      LOST_IT: "YOU LOST IT",
      ENGINE: "ENGINE",
      ENGINE_OFF: "OFF",
      GEAR: "GEAR",
      MILES: "MILES",
      LANE: "LANE",
      LIGHT: "LIGHT",
      WIPER: "WIPER",
      PANEL_1: "ARROWS / WASD",
      PANEL_2: "M:RADIO  P:ENGINE",
      PANEL_3: "L:LIGHTS  E:WIPE",
      ORDER: "ORDER #",
      DELIVER_TO: "DELIVER TO:",
      LIVE: "LIVE",
      NEWS: "NEWS 67",
      CONTROLS: "CONTROLS",
      NEW: "NEW",
      BREAKING: "BREAKING: ",
      ESCAPED: ["YOU MADE", "IT OUT"],
      LAST_DELIVERY: ["FINAL", "DELIVERY"],
      DELIVERED: ["PACKAGE", "DELIVERED"],
    },
  },

  t(key) {
    return this.STRINGS[this.lang][key];
  },

  // La noche con sus textos en el idioma elegido
  night(night) {
    return this.lang === "es" || !night[this.lang] ? night : Object.assign({}, night, night[this.lang]);
  },

  load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (this.LANGS.includes(saved)) this.lang = saved;
    } catch (e) {
      // Sin almacenamiento: queda en español
    }
  },

  // Pasa al siguiente idioma y lo recuerda
  toggle() {
    const i = this.LANGS.indexOf(this.lang);
    this.lang = this.LANGS[(i + 1) % this.LANGS.length];
    document.documentElement.lang = this.lang;
    try {
      localStorage.setItem(this.STORAGE_KEY, this.lang);
    } catch (e) {
      // Sin almacenamiento: el idioma solo dura esta sesión
    }
  },
};

R67.i18n.load();
document.documentElement.lang = R67.i18n.lang;
