// Modo historia: cinco noches de reparto. Cada noche suma una mecánica nueva y
// empieza con el teléfono mostrando el pedido, las noticias y los controles.
// Para cambiar textos o distancias basta con editar NIGHTS.
R67.story = {
  STORAGE_KEY: "route67.night",
  COMPLETED_KEY: "route67.completed", // ya se terminó la historia: se puede elegir noche
  MAIN: 5, // noches de la historia; las que siguen son aparte y se desbloquean al terminarla

  // Modo infinito: todas las mecánicas activas
  ALL_RULES: { lights: true, radio: true, rain: true, ghost: true },

  // rules: qué mecánicas cuentan esa noche (la gasolina cuenta siempre).
  //   lights: los faros fallan solos   radio: la radio se corta y llega la niebla
  //   rain: lluvia en el parabrisas    ghost: el fantasma
  // house: color de la casa de la entrega (o de las franjas del faro).
  // place: sprite del lugar de la entrega; si falta, una casa.
  // speedStart / speedMax: velocidad inicial y tope (px/s), un poco más altas cada noche.
  // shade: cuánto más oscura se ve la noche (0 normal, 1 negro).
  // controls: los que se estrenan esa noche; el teléfono muestra también los de las
  //   noches anteriores, o solo los de inherit (índices) si la noche lo indica.
  // Solo noche 6: bonus (va aparte), storm (llueve todo el nivel y caen rayos),
  //   escapeMiles y escapeSpeed (la huida tras despertar a la casa).
  // news: la precaución, contada como noticia. done: lo que dice la app al entregar.
  NIGHTS: [
    {
      miles: 8,
      house: "#4a90c2",
      speedStart: 260,
      speedMax: 620,
      shade: 0,
      clock: "23:47",
      address: "MOTEL LUNA AZUL, HAB. 6, MILLA 12",
      news:
        "LA GASOLINERA LAST STOP CIERRA TEMPRANO Y NO HAY OTRA EN LA RUTA 67. RECOGE LOS BIDONES QUE VEAS EN EL CAMINO O TE QUEDARAS TIRADO.",
      ticker: "BACHES Y OBRAS EN TODO EL TRAMO NORTE",
      controls: [
        ["FLECHAS/WASD", "MOVER"],
        ["P", "MOTOR (PAUSA)"],
      ],
      rules: { lights: false, radio: false, rain: false, ghost: false },
      done: "EL ENCARGADO DEL MOTEL TE DIO LAS GRACIAS SIN ABRIR LA PUERTA. PROPINA: $2.",
    },
    {
      miles: 10,
      house: "#c0392b",
      place: "barn",
      speedStart: 280,
      speedMax: 650,
      shade: 0.15,
      clock: "00:13",
      address: "GRANJA HOLLOWAY, BUZON 23",
      news:
        "VECINOS REPORTAN FALLAS ELECTRICAS EN LOS CARROS QUE CRUZAN LA RUTA DE NOCHE. SI TUS FAROS SE APAGAN, VUELVE A PRENDERLOS DE INMEDIATO.",
      ticker: "SE RECOMIENDA NO VIAJAR SOLO",
      controls: [["L", "LUCES"]],
      rules: { lights: true, radio: false, rain: false, ghost: false },
      done: "DEJASTE LA CAJA EN EL BUZON. ALGO ADENTRO SE MOVIO. PROPINA: $5.",
    },
    {
      miles: 12,
      house: "#e8d8a0",
      place: "church",
      speedStart: 300,
      speedMax: 680,
      shade: 0.28,
      clock: "01:06",
      address: "IGLESIA SAN JUDAS, PUERTA TRASERA",
      news:
        "UNA NIEBLA EXTRANA CUBRE LA RUTA CUANDO HAY SILENCIO. TESTIGOS DICEN QUE LA MUSICA LA ALEJA. SI LA RADIO SE CORTA, PRENDELA OTRA VEZ.",
      ticker: "SOMBRAS VISTAS JUNTO AL CAMINO",
      controls: [["M", "RADIO"]],
      rules: { lights: true, radio: true, rain: false, ghost: false },
      done: "EL SACERDOTE RECIBIO EL PAQUETE Y TE PIDIO QUE NO VUELVAS DE NOCHE. PROPINA: $10.",
    },
    {
      miles: 14,
      house: "#c0392b",
      place: "lighthouse",
      speedStart: 320,
      speedMax: 710,
      shade: 0.52,
      clock: "02:21",
      address: "FARO VIEJO, MUELLE 4",
      news:
        "SE ESPERAN TORMENTAS REPENTINAS. EL AGUA EN EL PARABRISAS TE DEJARA SIN VISTA: PASA EL LIMPIAPARABRISAS CADA VEZ QUE LLUEVA.",
      ticker: "LA ESTACION 67.0 SIGUE AL AIRE",
      controls: [["E", "LIMPIA"]],
      rules: { lights: true, radio: true, rain: true, ghost: false },
      done: "NADIE CUIDA EL FARO DESDE HACE MUCHO. AUN ASI, SU LUZ SE PRENDIO CUANDO LLEGASTE. PROPINA: ???",
    },
    {
      miles: 16,
      house: "#6b5a7a",
      speedStart: 340,
      speedMax: 740,
      shade: 0.66,
      clock: "03:00",
      address: "LA CASA AL FINAL DE LA RUTA 67",
      news:
        "ULTIMA HORA: CONDUCTORES VEN UNA FIGURA PALIDA QUE SE LANZA SOBRE LOS CARROS. CUANDO TU CARRIL SE PONGA LILA, CAMBIATE DE CARRIL YA.",
      ticker: "NADIE HA FIRMADO ESTE PEDIDO",
      controls: [["CARRIL LILA", "CAMBIATE"]],
      rules: { lights: true, radio: true, rain: true, ghost: true },
      done: "EL CLIENTE NO FIRMO. LA APP DICE: ENTREGADO A LAS 03:00. ESA CASA ESTA VACIA DESDE 1967. GRACIAS POR MANEJAR CON RUTA EXPRESS.",
    },
    {
      miles: 10,
      house: "#3a3040",
      bonus: true,
      storm: true,
      escapeMiles: 6,
      escapeSpeed: [400, 760],
      speedStart: 340,
      speedMax: 760,
      shade: 0.85,
      clock: "03:33",
      address: "???",
      news:
        "ALERTA DE TORMENTA ELECTRICA EN TODA LA RUTA 67. LOS RAYOS DEJAN CIEGOS A LOS CONDUCTORES. ALGO SE MUEVE DEBAJO DE LA CASA DEL FINAL. SI DESPIERTA, NO TE DETENGAS.",
      ticker: "ESTE PEDIDO NO DEBIO EXISTIR",
      inherit: [0, 1, 2, 3],
      controls: [["CARRIL ROJO", "CAMBIATE"]],
      rules: { lights: true, radio: true, rain: true, ghost: false },
      done: "LO DEJASTE ATRAS. AL AMANECER LA CASA YA NO ESTABA. LA APP SOLO DICE: PEDIDO DEVUELTO AL REMITENTE.",
    },
  ],

  // Índice de la próxima noche a jugar
  load() {
    try {
      const n = Number(localStorage.getItem(this.STORAGE_KEY)) || 0;
      return Math.max(0, Math.min(this.MAIN - 1, n));
    } catch (e) {
      return 0;
    }
  },

  isCompleted() {
    try {
      return localStorage.getItem(this.COMPLETED_KEY) === "1";
    } catch (e) {
      return false;
    }
  },

  setCompleted(done) {
    try {
      localStorage.setItem(this.COMPLETED_KEY, done ? "1" : "0");
    } catch (e) {
      // Sin almacenamiento: solo dura esta sesión
    }
  },

  save(n) {
    try {
      localStorage.setItem(this.STORAGE_KEY, String(n));
    } catch (e) {
      // Sin almacenamiento: el progreso solo dura esta sesión
    }
  },
};
