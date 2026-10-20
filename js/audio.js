// Música de fondo en loop y efectos de sonido. El navegador solo deja reproducir
// tras una interacción del usuario, así que game.js arranca la música al iniciar la partida.
R67.audio = {
  music: null,
  crash: null,
  ghost: null,
  blackout: null,
  pickup: null,
  ambient: null,
  brake: null,
  growl: null,
  slam: null,
  chase: null,
  chasing: false, // suena la canción de la persecución (noche 6)
  ac: null, // contexto de Web Audio, ver synth()

  init() {
    const c = R67.config;
    this.music = new Audio(c.MUSIC_SRC);
    this.music.loop = true;
    this.music.volume = c.MUSIC_VOLUME;

    this.crash = new Audio(c.CRASH_SRC);
    this.crash.volume = c.SFX_VOLUME;

    this.ghost = new Audio(c.GHOST_SRC);
    this.ghost.volume = c.SFX_VOLUME;

    this.blackout = new Audio(c.BLACKOUT_SRC);
    this.blackout.volume = c.SFX_VOLUME;

    this.pickup = new Audio(c.PICKUP_SRC);
    this.pickup.volume = c.SFX_VOLUME;

    this.brake = new Audio(c.BRAKE_SRC);
    this.brake.volume = c.SFX_VOLUME;

    this.growl = new Audio(c.GROWL_SRC);
    this.growl.volume = c.SFX_VOLUME;

    this.slam = new Audio(c.SLAM_SRC);
    this.slam.volume = c.SFX_VOLUME;

    this.chase = new Audio(c.CHASE_SRC);
    this.chase.loop = true;
    this.chase.volume = c.MUSIC_VOLUME;

    this.ambient = new Audio(c.AMBIENT_SRC);
    this.ambient.loop = true;
    this.ambient.volume = c.AMBIENT_VOLUME;
  },

  playBlackout() {
    if (!this.blackout) return;
    this.blackout.currentTime = 0;
    this.blackout.play().catch(() => {});
  },

  // Frenón y, un momento después, el claxon (vienen en el mismo archivo)
  playBrake() {
    if (!this.brake) return;
    this.brake.currentTime = 0;
    this.brake.play().catch(() => {});
  },

  // Contexto de Web Audio para los sonidos que se generan sin archivo.
  // Se crea al primer uso, que siempre es después de una tecla o un toque.
  synth() {
    if (!this.ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ac = new AC();
    }
    return this.ac;
  },

  // Ruido grave filtrado con una caída larga: suena como un trueno lejano
  playThunder() {
    const ac = this.synth();
    if (!ac) return;
    const len = 2.6;
    const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      // Ruido café: cada muestra se arrastra de la anterior, así queda retumbante
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    const gain = ac.createGain();
    const now = ac.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(R67.config.SFX_VOLUME, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + len);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start();
  },

  playGrowl() {
    if (!this.growl) return;
    this.growl.currentTime = 0;
    this.growl.play().catch(() => {});
  },

  playSlam() {
    if (!this.slam) return;
    this.slam.currentTime = 0;
    this.slam.play().catch(() => {});
  },

  // Persecución: la música normal y Siren Head se cortan y la radio se queda
  // pegada en Black Knife, sin poder apagarla
  startChase() {
    if (!this.chase) return;
    this.music.pause();
    this.music.muted = false;
    this.ambient.pause();
    this.chasing = true;
    this.chase.currentTime = 0;
    this.chase.play().catch(() => {});
  },

  stopChase() {
    this.chasing = false;
    if (this.chase) this.chase.pause();
  },

  // Lo que suena en la radio: la música normal o la de la persecución
  track() {
    return this.chasing ? this.chase : this.music;
  },

  trackTitle() {
    return this.chasing ? R67.config.CHASE_TITLE : R67.config.MUSIC_TITLE;
  },

  trackFreq() {
    return this.chasing ? R67.config.CHASE_FREQ : R67.config.RADIO_FREQ;
  },

  playPickup() {
    if (!this.pickup) return;
    this.pickup.currentTime = 0;
    this.pickup.play().catch(() => {});
  },

  playGhost() {
    if (!this.ghost) return;
    this.ghost.currentTime = 0;
    this.ghost.play().catch(() => {});
  },

  // Arranca la música desde el principio
  restartMusic() {
    if (!this.music) return;
    this.stopChase();
    this.music.currentTime = 0;
    if (this.ambient && this.isMuted()) this.ambient.play().catch(() => {});
    // play() devuelve una promesa que falla si el navegador bloquea el audio o falta el archivo
    this.music.play().catch(() => {});
  },

  // Pausa la música y también el sonido del fantasma si iba a medias
  pauseMusic() {
    if (this.music) this.music.pause();
    if (this.chase) this.chase.pause();
    if (this.ghost) this.ghost.pause();
    if (this.ambient) this.ambient.pause();
  },

  // Sigue desde donde se pausó
  resumeMusic() {
    if (this.chasing) this.chase.play().catch(() => {});
    else if (this.music) this.music.play().catch(() => {});
    if (this.ambient && this.isMuted()) this.ambient.play().catch(() => {});
    if (this.ghost && this.ghost.currentTime > 0 && !this.ghost.ended) {
      this.ghost.play().catch(() => {});
    }
  },

  playCrash() {
    if (!this.crash) return;
    this.crash.currentTime = 0;
    this.crash.play().catch(() => {});
  },

  // Apagar la radio: la música sigue corriendo en silencio y entra Siren Head
  // (desde el principio) hasta que se vuelva a prender.
  setMuted(muted) {
    if (!this.music || this.music.muted === muted) return;
    this.music.muted = muted;
    if (muted) {
      // El ambiente solo acompaña si el motor está en marcha
      this.ambient.currentTime = 0;
      if (!this.music.paused) this.ambient.play().catch(() => {});
    } else {
      this.ambient.pause();
    }
  },

  // En la persecución la radio no se puede apagar
  toggleMute() {
    if (this.music && !this.chasing) this.setMuted(!this.music.muted);
  },

  isPlaying() {
    const t = this.track();
    return !!t && !t.paused;
  },

  musicTime() {
    const t = this.track();
    return t ? t.currentTime : 0;
  },

  // 0 mientras el archivo no haya cargado
  musicDuration() {
    const t = this.track();
    return t && isFinite(t.duration) ? t.duration : 0;
  },

  isMuted() {
    return !this.chasing && !!this.music && this.music.muted;
  },
};
