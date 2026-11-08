class Component extends DCLogic {
  constructor(...args) {
    super(...args);
    this.state = { form: 0, mode: 'seed', kept: 0 };
    this.FORMS = [
      { id: 'house', label: 'a house of glass' },
      { id: 'tree', label: 'a tree in winter' },
      { id: 'whale', label: 'a whale over the canal' },
      { id: 'city', label: 'a city that breathes' },
      { id: 'galaxy', label: 'a galaxy, slowly' }
    ];
    this.canvasRef = (el) => {
      this.canvas = el || null;
      if (el && this.mounted && !this.running) this.safeStart();
    };
    this.onDown = (e) => this.pointerDown(e);
    this.onMove = (e) => this.pointerMove(e);
    this.onUp = () => { this.drag = null; };
    this.keep = () => this.keepForm();
    this.picks = this.FORMS.map((f, i) => () => this.conjure(i, true));
    this.loop = (ms) => this.frame(ms);
    this.clock = 0;
    this.lastUser = -100;
    this.lastConjure = -100;
    this.keptAt = -100;
  }

  componentDidMount() {
    this.mounted = true;
    this.safeStart();
  }

  componentWillUnmount() {
    this.mounted = false;
    this.stop();
  }

  renderVals() {
    const s = this.state;
    const chips = this.FORMS.map((f, i) => ({
      label: f.label,
      pick: this.picks[i],
      pressed: s.mode === 'show' && s.form === i ? 'true' : 'false'
    }));
    let caption = 'Listening.';
    if (s.mode === 'show') caption = '“' + this.FORMS[s.form].label + '”';
    else if (s.mode === 'kept') caption = 'Kept.';
    return {
      chips: chips,
      caption: caption,
      kept: s.kept,
      keep: this.keep,
      keepDisabled: s.mode !== 'show',
      canvasRef: this.canvasRef,
      onDown: this.onDown,
      onMove: this.onMove,
      onUp: this.onUp
    };
  }

  safeStart() {
    try {
      if (!this.canvas && typeof document !== 'undefined') this.canvas = document.querySelector('canvas[data-codex-stage]');
      if (!this.canvas) {
        this.tries = (this.tries || 0) + 1;
        if (this.mounted && this.tries < 40) requestAnimationFrame(() => this.safeStart());
        return;
      }
      this.start();
    } catch (err) {
      this.running = false;
    }
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.io) this.io.disconnect();
    this.raf = 0;
    this.io = null;
  }

  start() {
    if (this.running || !this.canvas || !this.canvas.getContext) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const N = (this.N = 1600);
    const R = this.rng(7);
    this.forms = [this.makeHouse(N), this.makeTree(N), this.makeWhale(N), this.makeCity(N), this.makeGalaxy(N)];
    this.seedForm = this.makeSeed(N);
    this.pos = new Float32Array(N * 3);
    this.gate = new Float32Array(N);
    this.apx = new Float32Array(N);
    this.apz = new Float32Array(N);
    this.tone = new Uint8Array(N);
    this.mag = new Float32Array(N);
    for (let k = 0; k < N; k++) {
      const a = R() * Math.PI * 2;
      const r = Math.sqrt(R()) * 0.3;
      this.apx[k] = Math.cos(a) * r;
      this.apz[k] = Math.sin(a) * r;
      this.pos[k * 3] = this.apx[k];
      this.pos[k * 3 + 1] = -0.03;
      this.pos[k * 3 + 2] = this.apz[k];
      this.tone[k] = R() < 0.17 ? 1 : 0;
      this.mag[k] = 0.55 + R() * 0.9;
    }
    this.M = 40;
    this.mote = new Float32Array(this.M * 4);
    for (let m = 0; m < this.M; m++) this.resetMote(m, R, true);
    this.sprites = [this.sprite(255, 196, 132), this.sprite(170, 186, 255)];
    this.target = this.seedForm;
    this.autoRot = 0.5;
    this.userRot = 0;
    this.rotY = 0.5;
    this.vel = 0;
    this.drag = null;
    this.glow = 0.4;
    this.flash = 0.5;
    this.keptSettled = true;
    this.firstAt = 0.8;
    this.visible = true;
    this.lastMs = 0;
    this.resize();
    if (window.IntersectionObserver) {
      this.io = new IntersectionObserver((entries) => {
        const e = entries[entries.length - 1];
        this.visible = e ? e.isIntersecting : true;
      });
      this.io.observe(this.canvas);
    }
    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  resize() {
    const c = this.canvas;
    if (!c) return;
    const w = c.clientWidth || 600;
    const h = c.clientHeight || 480;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (c.width !== bw || c.height !== bh) {
      c.width = bw;
      c.height = bh;
    }
    this.W = w;
    this.H = h;
    this.dpr = dpr;
    this.S = Math.min(w * 0.4, h * 0.355);
    this.cx = w / 2;
    this.oy = h * 0.79;
  }

  frame(ms) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const prev = this.lastMs || ms;
    this.lastMs = ms;
    const dt = Math.min(0.05, Math.max(0, (ms - prev) / 1000));
    if (!this.visible) return;
    try {
      if (this.canvas.clientWidth !== this.W || this.canvas.clientHeight !== this.H) this.resize();
      this.step(dt);
      this.draw();
    } catch (err) {
      this.stop();
    }
  }

  conjure(i, byUser) {
    const t = this.clock;
    if (byUser) this.lastUser = t;
    this.lastConjure = t;
    if (this.running) {
      this.target = this.forms[i];
      for (let k = 0; k < this.N; k++) this.gate[k] = t + 0.25 + Math.random() * 0.95;
      this.flash = 1;
    }
    this.setState({ form: i, mode: 'show' });
  }

  keepForm() {
    if (this.state.mode !== 'show') return;
    const t = this.clock;
    this.lastUser = t;
    this.keptAt = t;
    this.keptSettled = false;
    if (this.running) {
      this.target = this.seedForm;
      for (let k = 0; k < this.N; k++) this.gate[k] = t + 1.1 + Math.random() * 0.8;
      this.flash = 1.6;
    }
    this.setState({ mode: 'kept', kept: this.state.kept + 1 });
  }

  pointerDown(e) {
    this.lastUser = this.clock;
    this.drag = { x: e.clientX, id: e.pointerId };
    this.vel = 0;
    try {
      if (e.currentTarget && e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      /* capture is optional */
    }
  }

  pointerMove(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const dx = e.clientX - this.drag.x;
    this.drag.x = e.clientX;
    this.userRot += dx * 0.009;
    this.vel = dx * 0.5;
    this.lastUser = this.clock;
  }

  step(dt) {
    const t = (this.clock += dt);
    const mode = this.state.mode;
    const idle = t - this.lastUser;
    const next = (this.state.form + 1) % this.FORMS.length;
    if (this.firstAt !== null) {
      if (t >= this.firstAt) {
        this.firstAt = null;
        this.conjure(0, false);
      }
    } else if (!this.reduce && t - this.lastConjure > 1) {
      if (mode === 'show' && t - this.lastConjure > 9 && idle > 12) this.conjure(next, false);
      else if (mode === 'seed' && t - this.keptAt > 6 && idle > 5) this.conjure(next, false);
    }
    if (mode === 'kept' && !this.keptSettled && t - this.keptAt > 1.9) {
      this.keptSettled = true;
      this.setState({ mode: 'seed' });
    }
    if (!this.drag) {
      this.userRot += this.vel * dt;
      this.vel *= Math.exp(-3 * dt);
    }
    this.autoRot += (this.reduce ? 0.04 : 0.16) * dt;
    this.rotY = this.autoRot + this.userRot;

    const N = this.N;
    const P = this.pos;
    const G = this.gate;
    const T = this.target;
    const B = T.base;
    const mod = T.mod;
    const out = this.tmp || (this.tmp = new Float32Array(3));
    const kSink = 1 - Math.exp(-6 * dt);
    const kRise = 1 - Math.exp(-2.6 * dt);
    for (let k = 0; k < N; k++) {
      const i3 = k * 3;
      let tx, ty, tz, kk;
      if (t < G[k]) {
        tx = this.apx[k];
        ty = -0.03;
        tz = this.apz[k];
        kk = kSink;
      } else {
        if (mod) {
          mod(k, t, out);
          tx = out[0];
          ty = out[1];
          tz = out[2];
        } else {
          tx = B[i3];
          ty = B[i3 + 1];
          tz = B[i3 + 2];
        }
        kk = kRise;
      }
      P[i3] += (tx - P[i3]) * kk;
      P[i3 + 1] += (ty - P[i3 + 1]) * kk;
      P[i3 + 2] += (tz - P[i3 + 2]) * kk;
    }
    for (let m = 0; m < this.M; m++) {
      const j = m * 4;
      this.mote[j + 1] += this.mote[j + 3] * dt * (0.4 + this.glow);
      if (this.mote[j + 1] > 1.9) this.resetMote(m, Math.random, false);
    }
    this.flash *= Math.exp(-2.4 * dt);
    const want = mode === 'show' ? 1 : mode === 'kept' ? 0.2 : 0.45;
    this.glow += (want - this.glow) * (1 - Math.exp(-2.2 * dt));
  }

  resetMote(m, R, spread) {
    const j = m * 4;
    const a = R() * Math.PI * 2;
    const r = Math.sqrt(R()) * 0.28;
    this.mote[j] = Math.cos(a) * r;
    this.mote[j + 1] = spread ? R() * 1.9 : 0;
    this.mote[j + 2] = Math.sin(a) * r;
    this.mote[j + 3] = 0.18 + R() * 0.3;
  }

  draw() {
    const ctx = this.ctx;
    const W = this.W;
    const H = this.H;
    const S = this.S;
    const cx = this.cx;
    const oy = this.oy;
    const t = this.clock;
    const cp = Math.cos(0.25);
    const sp = Math.sin(0.25);
    const Rp = 0.58 * S;
    const ry = Rp * sp;
    const hgt = 0.28 * S * cp;
    const Ra = Rp * 0.6;
    const rya = Ra * sp;
    const g = this.glow;
    const fl = this.flash;
    let gr;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    // pool of light on the table
    ctx.globalCompositeOperation = 'lighter';
    ctx.save();
    ctx.translate(cx, oy + hgt);
    ctx.scale(1, 0.24);
    gr = ctx.createRadialGradient(0, 0, 0, 0, 0, Rp * 3);
    gr.addColorStop(0, 'rgba(240,180,106,' + (0.03 + 0.11 * g + 0.06 * fl).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(240,180,106,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 0, Rp * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // contact shadow
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.translate(cx, oy + hgt + ry * 0.15);
    ctx.scale(1, 0.24);
    gr = ctx.createRadialGradient(0, 0, Rp * 0.7, 0, 0, Rp * 1.3);
    gr.addColorStop(0, 'rgba(0,0,0,0.6)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 0, Rp * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // body
    gr = ctx.createLinearGradient(cx - Rp, 0, cx + Rp, 0);
    gr.addColorStop(0, '#0b0907');
    gr.addColorStop(0.2, '#29231d');
    gr.addColorStop(0.38, '#3a332b');
    gr.addColorStop(0.6, '#211c17');
    gr.addColorStop(1, '#090706');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(cx - Rp, oy);
    ctx.lineTo(cx - Rp, oy + hgt);
    ctx.ellipse(cx, oy + hgt, Rp, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + Rp, oy);
    ctx.ellipse(cx, oy, Rp, ry, 0, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();

    // top face
    gr = ctx.createRadialGradient(cx - Rp * 0.3, oy - ry * 0.9, Rp * 0.05, cx, oy, Rp * 1.05);
    gr.addColorStop(0, '#302a24');
    gr.addColorStop(1, '#14110e');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.ellipse(cx, oy, Rp, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // brass chamfer
    gr = ctx.createLinearGradient(cx - Rp, 0, cx + Rp, 0);
    gr.addColorStop(0, '#5e4a2f');
    gr.addColorStop(0.3, '#e4c38c');
    gr.addColorStop(0.5, '#a3824d');
    gr.addColorStop(0.8, '#cfae78');
    gr.addColorStop(1, '#4f3e27');
    ctx.strokeStyle = gr;
    ctx.lineWidth = Math.max(1.4, S * 0.011);
    ctx.beginPath();
    ctx.ellipse(cx, oy, Rp * 0.99, ry * 0.99, 0, 0, Math.PI * 2);
    ctx.stroke();

    // haptic ring
    ctx.fillStyle = 'rgba(169,184,255,0.32)';
    const hr = Ra * 1.3;
    const dotR = Math.max(0.9, S * 0.0055);
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(a) * hr, oy + Math.sin(a) * hr * sp, dotR, Math.max(0.5, dotR * sp * 2), 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // aperture glass
    gr = ctx.createRadialGradient(cx, oy, 0, cx, oy, Ra);
    gr.addColorStop(0, '#08070a');
    gr.addColorStop(1, '#1c1b21');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.ellipse(cx, oy, Ra, rya, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, oy, Ra * 0.97, rya * 0.97, 0, Math.PI * 1.08, Math.PI * 1.62);
    ctx.stroke();

    // light inside the glass
    ctx.globalCompositeOperation = 'lighter';
    ctx.save();
    ctx.translate(cx, oy);
    ctx.scale(1, sp);
    gr = ctx.createRadialGradient(0, 0, 0, 0, 0, Ra);
    gr.addColorStop(0, 'rgba(255,206,150,' + Math.min(0.9, 0.28 * g + 0.4 * fl).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(255,206,150,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 0, Ra, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // status ring
    const br = 0.5 + 0.5 * Math.sin(t * 1.7);
    ctx.strokeStyle = 'rgba(240,180,106,' + Math.min(1, 0.18 + 0.22 * br * g + 0.7 * fl).toFixed(3) + ')';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(cx, oy, Ra * 1.07, rya * 1.07, 0, 0, Math.PI * 2);
    ctx.stroke();

    // column of light
    const colH = 1.3 * S * cp;
    gr = ctx.createLinearGradient(0, oy, 0, oy - colH);
    gr.addColorStop(0, 'rgba(255,206,150,' + (0.07 * g + 0.08 * fl).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(255,206,150,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(cx - Ra * 0.9, oy);
    ctx.lineTo(cx - Ra * 1.6, oy - colH);
    ctx.lineTo(cx + Ra * 1.6, oy - colH);
    ctx.lineTo(cx + Ra * 0.9, oy);
    ctx.closePath();
    ctx.fill();

    // particles
    const cr = Math.cos(this.rotY);
    const sr = Math.sin(this.rotY);
    const D = 6;
    const P = this.pos;
    const SP = this.sprites;
    const base = 0.9 + S * 0.0048;
    for (let k = 0; k < this.N; k++) {
      const i3 = k * 3;
      const x = P[i3];
      const y = P[i3 + 1];
      const z = P[i3 + 2];
      if (y <= 0) continue;
      const xr = x * cr + z * sr;
      const zr = z * cr - x * sr;
      const yc = y * cp - zr * sp;
      const zc = zr * cp + y * sp;
      const s = D / (D - zc);
      const px = cx + xr * s * S;
      const py = oy - yc * s * S;
      let a = y < 0.2 ? y / 0.2 : 1;
      a *= 0.42 + 0.3 * Math.min(1, Math.max(0, (zc + 1.2) / 2.4));
      a *= (0.85 + 0.15 * Math.sin(t * 2.3 + k * 1.7)) * (0.5 + 0.5 * g);
      const r = base * this.mag[k] * s;
      ctx.globalAlpha = a;
      ctx.drawImage(SP[this.tone[k]], px - r * 2, py - r * 2, r * 4, r * 4);
    }

    // rising motes
    const mb = base * 0.8;
    for (let m = 0; m < this.M; m++) {
      const j = m * 4;
      const x = this.mote[j];
      const y = this.mote[j + 1];
      const z = this.mote[j + 2];
      const xr = x * cr + z * sr;
      const zr = z * cr - x * sr;
      const yc = y * cp - zr * sp;
      const zc = zr * cp + y * sp;
      const s = D / (D - zc);
      const r = mb * s;
      ctx.globalAlpha = Math.max(0, 0.5 * g * (1 - y / 1.9)) * Math.min(1, y / 0.15);
      ctx.drawImage(SP[0], cx + xr * s * S - r * 2, oy - yc * s * S - r * 2, r * 4, r * 4);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  sprite(r, g, b) {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 48;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, 'rgba(255,250,240,1)');
    gr.addColorStop(0.14, 'rgba(' + r + ',' + g + ',' + b + ',0.9)');
    gr.addColorStop(0.38, 'rgba(' + r + ',' + g + ',' + b + ',0.22)');
    gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 48, 48);
    return c;
  }

  rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let q = s;
      q = Math.imul(q ^ (q >>> 15), q | 1);
      q ^= q + Math.imul(q ^ (q >>> 7), q | 61);
      return ((q ^ (q >>> 14)) >>> 0) / 4294967296;
    };
  }

  len3(a, b) {
    return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }

  seg(L, a, b, n, jit, R, aux) {
    for (let i = 0; i < n; i++) {
      const u = (i + R()) / Math.max(1, n);
      L.push([
        a[0] + (b[0] - a[0]) * u + (R() - 0.5) * jit,
        a[1] + (b[1] - a[1]) * u + (R() - 0.5) * jit,
        a[2] + (b[2] - a[2]) * u + (R() - 0.5) * jit,
        aux || 0
      ]);
    }
  }

  face(L, a, b, c, n, R, tri) {
    for (let i = 0; i < n; i++) {
      let u = R();
      let v = R();
      if (tri && u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      L.push([
        a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
        a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
        a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v,
        0
      ]);
    }
  }

  fit(L, half, y0, y1) {
    let x0 = 1e9, x1 = -1e9, ya = 1e9, yb = -1e9, z0 = 1e9, z1 = -1e9;
    for (const p of L) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < ya) ya = p[1];
      if (p[1] > yb) yb = p[1];
      if (p[2] < z0) z0 = p[2];
      if (p[2] > z1) z1 = p[2];
    }
    const s = Math.min((2 * half) / Math.max(1e-6, x1 - x0), (2 * half) / Math.max(1e-6, z1 - z0), (y1 - y0) / Math.max(1e-6, yb - ya));
    const mx = (x0 + x1) / 2;
    const mz = (z0 + z1) / 2;
    for (const p of L) {
      p[0] = (p[0] - mx) * s;
      p[2] = (p[2] - mz) * s;
      p[1] = y0 + (p[1] - ya) * s;
    }
    return L;
  }

  pack(L, N, R, modFactory) {
    const base = new Float32Array(N * 3);
    const aux = new Float32Array(N);
    const n = L.length;
    const idx = new Array(N);
    for (let k = 0; k < N; k++) idx[k] = n >= N ? Math.floor((k * n) / N) : k < n ? k : Math.floor(R() * n);
    for (let k = N - 1; k > 0; k--) {
      const m = Math.floor(R() * (k + 1));
      const tmp = idx[k];
      idx[k] = idx[m];
      idx[m] = tmp;
    }
    for (let k = 0; k < N; k++) {
      const p = L[idx[k]];
      base[k * 3] = p[0];
      base[k * 3 + 1] = p[1];
      base[k * 3 + 2] = p[2];
      aux[k] = p[3] || 0;
    }
    return { base: base, aux: aux, mod: modFactory ? modFactory(base, aux) : null };
  }

  makeHouse(N) {
    const R = this.rng(11);
    const L = [];
    const W = 0.8, D = 0.62, H = 0.84, RH = 1.42;
    const a = [-W, 0, -D], b = [W, 0, -D], c = [W, 0, D], d = [-W, 0, D];
    const e = [-W, H, -D], f = [W, H, -D], g = [W, H, D], h = [-W, H, D];
    const r1 = [-W, RH, 0], r2 = [W, RH, 0];
    const edges = [[a, b], [b, c], [c, d], [d, a], [e, f], [f, g], [g, h], [h, e], [a, e], [b, f], [c, g], [d, h], [r1, r2], [e, r1], [h, r1], [f, r2], [g, r2]];
    const rect = (x0, x1, y0, y1, zf) => [
      [[x0, y0, zf], [x1, y0, zf]], [[x1, y0, zf], [x1, y1, zf]], [[x1, y1, zf], [x0, y1, zf]], [[x0, y1, zf], [x0, y0, zf]]
    ];
    const opens = [
      [[-0.15, 0, D], [-0.15, 0.5, D]], [[-0.15, 0.5, D], [0.15, 0.5, D]], [[0.15, 0.5, D], [0.15, 0, D]]
    ].concat(rect(0.32, 0.6, 0.34, 0.62, D), rect(-0.6, -0.32, 0.34, 0.62, D));
    opens.push([[W, 0.34, -0.2], [W, 0.34, 0.2]], [[W, 0.34, 0.2], [W, 0.62, 0.2]], [[W, 0.62, 0.2], [W, 0.62, -0.2]], [[W, 0.62, -0.2], [W, 0.34, -0.2]]);
    let el = 0;
    for (const s of edges) el += this.len3(s[0], s[1]);
    let ol = 0;
    for (const s of opens) ol += this.len3(s[0], s[1]);
    const M = Math.round(N * 1.25);
    const nE = M * 0.56, nO = M * 0.14, nF = M * 0.3;
    for (const s of edges) this.seg(L, s[0], s[1], Math.round((nE * this.len3(s[0], s[1])) / el), 0.012, R);
    for (const s of opens) this.seg(L, s[0], s[1], Math.round((nO * this.len3(s[0], s[1])) / ol), 0.008, R);
    const faces = [
      [a, b, e, 1.6 * H, false], [d, c, h, 1.6 * H, false], [a, d, e, 1.24 * H, false], [b, c, f, 1.24 * H, false],
      [e, f, r1, 1.36, false], [h, g, r1, 1.36, false], [e, h, r1, 0.36, true], [f, g, r2, 0.36, true]
    ];
    let fa = 0;
    for (const q of faces) fa += q[3];
    for (const q of faces) this.face(L, q[0], q[1], q[2], Math.round((nF * q[3]) / fa), R, q[4]);
    this.fit(L, 0.84, 0.18, 1.78);
    return this.pack(L, N, R, null);
  }

  makeTree(N) {
    const R = this.rng(23);
    const segs = [];
    const grow = (p, d, len, depth) => {
      const q = [p[0] + d[0] * len, p[1] + d[1] * len, p[2] + d[2] * len];
      segs.push([p, q, depth]);
      if (depth >= 6) return;
      const kids = depth === 0 ? 3 : R() < 0.3 ? 3 : 2;
      let u = Math.abs(d[1]) < 0.9 ? [-d[2], 0, d[0]] : [0, d[2], -d[1]];
      const ul = Math.hypot(u[0], u[1], u[2]) || 1;
      u = [u[0] / ul, u[1] / ul, u[2] / ul];
      const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
      const az0 = R() * Math.PI * 2;
      for (let i = 0; i < kids; i++) {
        const tilt = 0.4 + R() * 0.4;
        const az = az0 + (i * Math.PI * 2) / kids + (R() - 0.5) * 0.7;
        const ca = Math.cos(az), sa = Math.sin(az), ct = Math.cos(tilt), st = Math.sin(tilt);
        let nd = [
          d[0] * ct + (u[0] * ca + v[0] * sa) * st,
          d[1] * ct + (u[1] * ca + v[1] * sa) * st + 0.16,
          d[2] * ct + (u[2] * ca + v[2] * sa) * st
        ];
        const nl = Math.hypot(nd[0], nd[1], nd[2]) || 1;
        nd = [nd[0] / nl, nd[1] / nl, nd[2] / nl];
        grow(q, nd, len * (0.68 + R() * 0.1), depth + 1);
      }
    };
    grow([0, 0, 0], [0, 1, 0], 0.66, 0);
    const L = [];
    const M = Math.round(N * 1.3);
    const wt = (depth) => 2.8 * Math.pow(0.7, depth);
    let tw = 0;
    for (const s of segs) tw += this.len3(s[0], s[1]) * wt(s[2]);
    for (const s of segs) {
      const n = Math.max(1, Math.round((M * 0.9 * this.len3(s[0], s[1]) * wt(s[2])) / tw));
      const jit = 0.088 * Math.pow(0.6, s[2]) + 0.006;
      this.seg(L, s[0], s[1], n, jit, R);
      if (s[2] === 6) {
        for (let j = 0; j < 2; j++) L.push([s[1][0] + (R() - 0.5) * 0.04, s[1][1] + (R() - 0.5) * 0.04, s[1][2] + (R() - 0.5) * 0.04, 0]);
      }
    }
    this.fit(L, 0.98, 0.14, 2.05);
    return this.pack(L, N, R, (B) => (k, t, out) => {
      const y = B[k * 3 + 1];
      const sway = 0.035 * y * y * Math.sin(t * 0.8 + y * 0.6);
      out[0] = B[k * 3] + sway;
      out[1] = y;
      out[2] = B[k * 3 + 2] + sway * 0.4;
    });
  }

  makeWhale(N) {
    const R = this.rng(37);
    const L = [];
    const M = Math.round(N * 1.3);
    const yc = (u) => 1.0 - 0.1 * u * u;
    const rad = (u) => 0.27 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, u / 0.93))), 0.55) * (1 - 0.6 * u) + 0.012;
    const bx = (u) => -1 + 1.72 * u;
    for (let i = 0; i < M * 0.6; i++) {
      const u = R(), th = R() * Math.PI * 2, r = rad(u);
      L.push([bx(u), yc(u) + r * 0.8 * Math.cos(th), r * Math.sin(th), 0]);
    }
    for (let p = -2; p <= 2; p++) {
      const th = Math.PI + p * 0.16;
      for (let i = 0; i < M * 0.016; i++) {
        const u = 0.04 + R() * 0.42, r = rad(u) * 1.01;
        L.push([bx(u), yc(u) + r * 0.8 * Math.cos(th), r * Math.sin(th), 0]);
      }
    }
    for (let i = 0; i < M * 0.14; i++) {
      const s = Math.sqrt(R());
      const side = R() < 0.5 ? -1 : 1;
      const chord = 0.17 * Math.pow(1 - s, 0.6) + 0.015;
      const xle = 0.7 + 0.12 * s;
      const pick = R();
      const fr = pick < 0.35 ? 0 : pick < 0.6 ? 1 : R();
      L.push([xle + chord * fr, yc(1) + (R() - 0.5) * 0.015, side * (0.03 + s * 0.52), 0]);
    }
    for (let side = -1; side <= 1; side += 2) {
      const root = [-0.5, yc(0.29) - 0.12, side * 0.2];
      const tip = [-0.16, yc(0.29) - 0.4, side * 0.64];
      for (let i = 0; i < M * 0.07; i++) {
        const v = R();
        const w = (R() - 0.5) * 0.17 * (1 - 0.6 * v);
        L.push([root[0] + (tip[0] - root[0]) * v + w, root[1] + (tip[1] - root[1]) * v + (R() - 0.5) * 0.01, root[2] + (tip[2] - root[2]) * v, 0]);
      }
    }
    for (let i = 0; i < M * 0.02; i++) {
      const v = R();
      const u = 0.64 + v * 0.08;
      const r = rad(u);
      L.push([bx(u), yc(u) + r * 0.8 + 0.06 * (1 - Math.abs(v - 0.4) * 2) * R(), (R() - 0.5) * 0.02, 0]);
    }
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 8; i++) {
        const r = rad(0.1);
        L.push([bx(0.1) + (R() - 0.5) * 0.02, yc(0.1) - 0.02 + (R() - 0.5) * 0.02, side * r * 0.98, 0]);
      }
    }
    this.fit(L, 1.0, 0.62, 1.9);
    const self = this;
    return this.pack(L, N, R, (B) => (k, t, out) => {
      const x = B[k * 3];
      const z = B[k * 3 + 2];
      const u = Math.max(0, (x + 0.15) / 1.15);
      // keep the whale near profile while the Drive turns, with a slow three-quarter sway
      const yaw = -(self.autoRot || 0) + 0.35 * Math.sin(t * 0.3) - 0.3;
      const c = Math.cos(yaw), s = Math.sin(yaw);
      out[0] = x * c + z * s;
      out[1] = B[k * 3 + 1] + 0.085 * u * u * Math.sin(t * 1.6 - x * 2.4) + 0.03 * Math.sin(t * 0.7);
      out[2] = z * c - x * s;
    });
  }

  makeCity(N) {
    const R = this.rng(41);
    const L = [];
    const M = Math.round(N * 1.3);
    const cs = 0.27;
    const towers = [];
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        const x = i * cs + (R() - 0.5) * 0.03;
        const z = j * cs + (R() - 0.5) * 0.03;
        const dd = Math.hypot(x, z);
        if (dd > 0.95 || R() < 0.1) continue;
        const b = 0.065 + R() * 0.04;
        const h = Math.max(0.1, (0.12 + 1.3 * Math.pow(R(), 1.8)) * (1.25 - 0.8 * dd));
        towers.push([x, z, b, h, R() * Math.PI * 2]);
      }
    }
    let tw = 0;
    for (const T of towers) tw += T[3] + 0.25;
    for (const T of towers) {
      const x = T[0], z = T[1], b = T[2], h = T[3], ph = T[4];
      const n = Math.round((M * 0.82 * (h + 0.25)) / tw);
      const c4 = [[x - b, z - b], [x + b, z - b], [x + b, z + b], [x - b, z + b]];
      const nv = Math.round(n * 0.55), nr = Math.round(n * 0.25), nw = n - nv - nr;
      for (let q = 0; q < 4; q++) this.seg(L, [c4[q][0], 0, c4[q][1]], [c4[q][0], h, c4[q][1]], Math.round(nv / 4), 0.006, R, ph);
      for (let q = 0; q < 4; q++) {
        const A = c4[q], Bq = c4[(q + 1) % 4];
        this.seg(L, [A[0], h, A[1]], [Bq[0], h, Bq[1]], Math.round(nr / 4), 0.006, R, ph);
      }
      for (let w = 0; w < nw; w++) {
        const q = Math.floor(R() * 4), A = c4[q], Bq = c4[(q + 1) % 4];
        const u = 0.2 + Math.floor(R() * 3) * 0.3;
        const yy = Math.min(h - 0.03, 0.05 + Math.floor(R() * Math.max(1, h / 0.07)) * 0.07);
        L.push([A[0] + (Bq[0] - A[0]) * u, Math.max(0.02, yy), A[1] + (Bq[1] - A[1]) * u, ph]);
      }
    }
    const ng = M * 0.18;
    for (let i = 0; i < ng * 0.35; i++) {
      const a = R() * Math.PI * 2;
      L.push([Math.cos(a) * 1.02, 0, Math.sin(a) * 1.02, -1]);
    }
    for (let i = 0; i < ng * 0.65; i++) {
      const lane = (Math.floor(R() * 8) - 3.5) * cs;
      const lim = Math.sqrt(Math.max(0, 1.02 * 1.02 - lane * lane));
      const o = (R() * 2 - 1) * lim;
      if (R() < 0.5) L.push([lane, 0, o, -1]);
      else L.push([o, 0, lane, -1]);
    }
    this.fit(L, 0.98, 0.14, 1.95);
    return this.pack(L, N, R, (B, A) => (k, t, out) => {
      const y = B[k * 3 + 1];
      const ph = A[k];
      out[0] = B[k * 3];
      out[2] = B[k * 3 + 2];
      out[1] = ph < 0 ? y : 0.14 + (y - 0.14) * (1 + 0.1 * Math.sin(t * 0.9 + ph));
    });
  }

  makeGalaxy(N) {
    const R = this.rng(53);
    const L = [];
    const M = Math.round(N * 1.2);
    const gs = () => (R() + R() + R() + R() - 2) / 0.577;
    for (let i = 0; i < M * 0.16; i++) L.push([gs() * 0.08, gs() * 0.045, gs() * 0.08, 0]);
    for (let i = 0; i < M * 0.78; i++) {
      const arm = i % 2;
      const r = 0.1 + 0.9 * Math.pow(R(), 0.85);
      const th = arm * Math.PI + r * 4.6 + gs() * 0.14 * (1.15 - 0.5 * r);
      const rr = r + gs() * 0.03;
      L.push([Math.cos(th) * rr, gs() * 0.022 * (1.2 - r), Math.sin(th) * rr, 0]);
    }
    for (let i = 0; i < M * 0.06; i++) {
      const a = R() * Math.PI * 2, r = 0.2 + R() * 0.85, hh = (R() - 0.5) * 0.5;
      L.push([Math.cos(a) * r, hh * (1 - r * 0.5), Math.sin(a) * r, 0]);
    }
    const self = this;
    return this.pack(L, N, R, (B) => (k, t, out) => {
      const x = B[k * 3], yl = B[k * 3 + 1], z = B[k * 3 + 2];
      const a = t * 0.22, ca = Math.cos(a), sa = Math.sin(a);
      const xr = x * ca - z * sa, zr = x * sa + z * ca;
      const cl = Math.cos(0.62), sl = Math.sin(0.62);
      const y2 = yl * cl - zr * sl, z2 = yl * sl + zr * cl;
      const ar = self.autoRot || 0, cr = Math.cos(ar), sr = Math.sin(ar);
      out[0] = xr * cr - z2 * sr;
      out[1] = 1.08 + y2 * 0.92;
      out[2] = xr * sr + z2 * cr;
    });
  }

  makeSeed(N) {
    const R = this.rng(61);
    const L = [];
    for (let i = 0; i < N; i++) {
      const r = 0.05 + 0.3 * Math.pow(R(), 0.7), a = R() * Math.PI * 2;
      const y = 0.16 + R() * 0.7 * (1 - r);
      L.push([Math.cos(a) * r, y, Math.sin(a) * r, 0.5 + 0.9 / (r + 0.2)]);
    }
    return this.pack(L, N, R, (B, A) => (k, t, out) => {
      const x = B[k * 3], y = B[k * 3 + 1], z = B[k * 3 + 2], w = A[k] * t * 0.6;
      const c = Math.cos(w), s = Math.sin(w);
      out[0] = x * c - z * s;
      out[1] = y + 0.03 * Math.sin(t * 1.4 + k);
      out[2] = x * s + z * c;
    });
  }
}
