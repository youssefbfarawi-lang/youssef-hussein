(() => {
  "use strict";
  const doc = document.documentElement;
  doc.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- mobile menu ---------- */
  const menuBtn = $(".menu-btn"), links = $(".links");
  if (menuBtn && links) {
    const setMenu = open => {
      links.classList.toggle("show", open);
      menuBtn.setAttribute("aria-expanded", open);
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    menuBtn.addEventListener("click", e => { e.stopPropagation(); setMenu(!links.classList.contains("show")); });
    links.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("click", e => { if (links.classList.contains("show") && !e.target.closest(".nav")) setMenu(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && links.classList.contains("show")) { setMenu(false); menuBtn.focus(); } });
    addEventListener("resize", () => { if (innerWidth > 980) setMenu(false); });
  }

  /* ---------- text splitting (letters / words) ---------- */
  const splitText = (el, mode) => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            if (mode === "words") {
              const s = document.createElement("span"); s.className = "w"; s.style.setProperty("--i", i++); s.textContent = p; frag.appendChild(s); return;
            }
            const wd = document.createElement("span"); wd.className = "wd";
            [...p].forEach(c => { const s = document.createElement("span"); s.className = "ch"; s.style.setProperty("--i", i++); s.textContent = c; wd.appendChild(s); });
            frag.appendChild(wd);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.matches("br")) walk(n);
      });
    };
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
    $$(".wd,.w", el).forEach(s => s.setAttribute("aria-hidden", "true"));
  };
  $$("[data-split]").forEach(el => { el.classList.add("split"); splitText(el, "chars"); });
  $$("[data-words]").forEach(el => { el.classList.add("words"); splitText(el, "words"); });

  /* ---------- reveal on load + on scroll ---------- */
  const heroSel = ".hero .rv,.hero .pop,.hero .split,.hero .words,.hero .tag,.a-hero .rv,.a-hero .split,.a-hero .words";
  const startHero = () => requestAnimationFrame(() => requestAnimationFrame(() => $$(heroSel).forEach(el => el.classList.add("in"))));
  const introEl = $("#intro");
  const hasIntro = introEl && doc.classList.contains("intro-on");
  if (introEl && !hasIntro) introEl.remove();
  if (hasIntro) addEventListener("intro:open", startHero, { once: true }); else startHero();

  /* ---------- intro: warp stars, logo drawn as outline, name, doors (about 3.8s) ---------- */
  if (hasIntro) {
    try { sessionStorage.setItem("yh-intro", "1"); } catch (e) {}
    /* lockup: name and tagline take exactly the logo's width */
    const lock = $(".in-lock", introEl), nm = $(".in-name span", introEl), tg = $(".in-tag", introEl);
    const fit = () => {
      const L = lock.getBoundingClientRect().width;
      const probe = document.createElement("span");
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-family:"Clash Display","Satoshi",sans-serif;font-weight:500;font-size:100px;letter-spacing:.06em;text-transform:uppercase';
      probe.textContent = nm.textContent; introEl.appendChild(probe);
      const w = probe.getBoundingClientRect().width - 6; probe.remove();
      lock.style.setProperty("--nf", (100 * L / w).toFixed(2) + "px");
      const tf = Math.max(10, Math.min(14, L / 32));
      lock.style.setProperty("--tf", tf + "px");
      const t2 = document.createElement("span");
      t2.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:Satoshi,sans-serif;font-size:${tf}px;letter-spacing:0;text-transform:uppercase`;
      t2.textContent = "AI Ads CreatorGraphic Designer"; introEl.appendChild(t2);
      const tw = t2.getBoundingClientRect().width; t2.remove();
      const chars = 30, room = L - tw - 5 - 28;
      lock.style.setProperty("--ts", Math.max(0, room / chars).toFixed(2) + "px");
    };
    fit(); addEventListener("resize", fit);
    if (document.fonts) document.fonts.ready.then(fit);
    const cv = $(".in-warp", introEl), cx = cv.getContext("2d");
    let W, H, dpr, raf, warp = .2, done = false;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; };
    size(); addEventListener("resize", size);
    const N = innerWidth < 700 ? 150 : 300;
    const cols = ["255,255,255", "170,188,255", "120,140,255", "190,150,255", "120,255,140"];
    const mk = s => ({ x: (Math.random() - .5) * 2.2, y: (Math.random() - .5) * 2.2, z: s ? .15 + Math.random() * .85 : 1, pz: 1, c: cols[Math.random() < .72 ? (Math.random() * 3 | 0) : 3 + (Math.random() * 2 | 0)] });
    const stars = Array.from({ length: N }, () => mk(true));
    stars.forEach(st => st.tw = Math.random() * 6.28);
    let mx = 0, my = 0, tmx = 0, tmy = 0;
    const onMove = e => { tmx = (e.clientX / innerWidth - .5) * 2; tmy = (e.clientY / innerHeight - .5) * 2; };
    addEventListener("pointermove", onMove);
    const sparks = [];
    const burst = () => {
      const r = $(".in-mark", introEl).getBoundingClientRect();
      for (let i = 0; i < (innerWidth < 700 ? 70 : 140); i++) {
        const edge = Math.random() * 4 | 0;
        const x = (edge === 1 ? r.right : edge === 3 ? r.left : r.left + Math.random() * r.width) * dpr;
        const y = (edge === 0 ? r.top : edge === 2 ? r.bottom : r.top + Math.random() * r.height) * dpr;
        const cxp = (r.left + r.width / 2) * dpr, cyp = (r.top + r.height / 2) * dpr;
        const a = Math.atan2(y - cyp, x - cxp) + (Math.random() - .5) * .6, v = (120 + Math.random() * 420) * dpr;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, d: .6 + Math.random() * .7, c: Math.random() < .25 ? "49,238,51" : Math.random() < .5 ? "170,188,255" : "255,255,255" });
      }
    };
    stars.forEach(st => st.pz = st.z);
    let lt = performance.now();
    const draw = t => {
      const dt = Math.min(.05, (t - lt) / 1000); lt = t;
      cx.clearRect(0, 0, W, H);
      mx += (tmx - mx) * Math.min(1, dt * 3); my += (tmy - my) * Math.min(1, dt * 3);
      const f = Math.min(W, H) * .5, ox = W / 2 - mx * 40 * dpr, oy = H / 2 - my * 30 * dpr;
      cx.lineCap = "round";
      for (const st of stars) {
        st.pz = st.z; st.z -= dt * warp * .5;
        if (st.z <= .03) { Object.assign(st, mk(false)); continue; }
        const sx = ox + st.x / st.z * f, sy = oy + st.y / st.z * f;
        const px = ox + st.x / st.pz * f, py = oy + st.y / st.pz * f;
        if (sx < -60 || sx > W + 60 || sy < -60 || sy > H + 60) { Object.assign(st, mk(false)); continue; }
        st.tw += dt * 4;
        const tw = warp < .6 ? .55 + .45 * Math.sin(st.tw) : 1;
        cx.strokeStyle = `rgba(${st.c},${Math.min(1, (1 - st.z) * 1.5) * tw})`;
        cx.lineWidth = Math.max(.6, (1 - st.z) * 2.4) * dpr;
        cx.beginPath(); cx.moveTo(px, py); cx.lineTo(sx + .1, sy + .1); cx.stroke();
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= dt / p.d; if (p.life <= 0) { sparks.splice(i, 1); continue; }
        const px = p.x, py = p.y;
        p.vx *= 1 - dt * 2.2; p.vy *= 1 - dt * 2.2; p.x += p.vx * dt; p.y += p.vy * dt;
        cx.strokeStyle = `rgba(${p.c},${p.life})`; cx.lineWidth = 1.6 * dpr * p.life + .4;
        cx.beginPath(); cx.moveTo(px, py); cx.lineTo(p.x, p.y); cx.stroke();
      }
      if (!done) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const OUT = reduce ? 500 : 2450, OPEN = reduce ? 40 : 430, END = reduce ? 300 : 1250;
    const t0 = performance.now();
    const ramp = t => { if (done) return; const p = Math.min(1, (t - t0) / OUT); warp = .08 + Math.pow(p, 3) * 2.6; if (p < 1) requestAnimationFrame(ramp); };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      introEl.classList.add("s1");
      requestAnimationFrame(ramp);
      setTimeout(() => introEl.classList.add("s2"), 1550);
      if (!reduce) setTimeout(burst, 1180);
      setTimeout(() => {
        introEl.classList.add("s-out"); warp = reduce ? .2 : 10;
        setTimeout(() => {
          introEl.classList.add("s-open"); doc.classList.add("intro-open");
          dispatchEvent(new Event("intro:open"));
          setTimeout(() => {
            done = true; cancelAnimationFrame(raf); removeEventListener("pointermove", onMove);
            doc.classList.remove("intro-on"); introEl.classList.add("gone");
            setTimeout(() => { introEl.remove(); doc.classList.remove("intro-open"); }, 1500);
          }, END);
        }, OPEN);
      }, OUT);
    }));
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  $$(".rv,.pop,.split,.words,.hint,.tag").filter(el => !el.closest(".hero,.a-hero")).forEach(el => io.observe(el));
  setTimeout(() => $$(".rv,.pop,.split,.words,.hint,.tag").forEach(el => el.classList.add("in")), 9000);

  /* ---------- statement chips: staggered shine ---------- */
  $$(".chip").forEach((c, k) => {
    c.style.setProperty("--sh", (k * .32) + "s");
    if (!$(".txt", c)) { const t = document.createElement("span"); t.className = "txt"; t.textContent = c.textContent; c.textContent = ""; c.appendChild(t); }
  });

  /* ---------- typewriter (type 90ms, delete 55ms, pause 950ms) ---------- */
  $$("[data-type]").forEach(el => {
    const words = el.dataset.type.split("|");
    el.setAttribute("aria-label", words.join(", "));
    if (reduce) { el.textContent = words[0]; return; }
    let w = 0, i = words[0].length, dir = -1;
    const tick = () => {
      const word = words[w];
      i += dir; el.textContent = word.slice(0, i) || "\u200b";
      let wait = dir > 0 ? 90 : 55;
      if (dir > 0 && i >= word.length) { dir = -1; wait = 1600; }
      else if (dir < 0 && i <= 0) { dir = 1; w = (w + 1) % words.length; wait = 380; }
      setTimeout(tick, wait);
    };
    if (hasIntro) addEventListener("intro:open", () => setTimeout(tick, 2200), { once: true }); else setTimeout(tick, 2200);
  });

  /* ---------- programs ticker: 40px/s, half speed on hover ---------- */
  const APPS = [
    ["higgsfield", "Higgsfield", "For AI video, UGC-style ads and cinematic camera moves"],
    ["flow", "Google Flow", "For generating cinematic AI video shots with Veo"],
    ["magnific", "Magnific", "All-in-one AI studio for image and video generation, editing and upscaling"],
    ["premiere", "Adobe Premiere Pro", "For editing ads, cutting, sound and final export"],
    ["aftereffects", "Adobe After Effects", "For motion graphics and animated content"],
    ["photoshop", "Adobe Photoshop", "For visual design, image editing, and mockups"],
    ["illustrator", "Adobe Illustrator", "For logo design, icons, and vector illustrations"],
    ["indesign", "Adobe InDesign", "Used for layout and print design"],
    ["word", "Microsoft Word", "Used for document writing and formatting"],
    ["powerpoint", "Microsoft PowerPoint", "Used for presentation design and slideshows"]
  ];
  $$("[data-ticker]").forEach(box => {
    const track = $(".track", box);
    const one = (hidden) => APPS.map(([k, n, d]) =>
      `<div class="app" ${hidden ? 'aria-hidden="true"' : 'tabindex="0"'}><img src="assets/img/icon-${k}.png" alt="${hidden ? "" : n}" width="58" height="58" loading="lazy"><div class="tip"><strong>${n}</strong><span>${d}</span></div></div>`).join("");
    track.innerHTML = one(false) + one(true) + one(true);
    let x = 0, last = performance.now(), speed = 1, target = 1;
    box.addEventListener("mouseenter", () => target = .5);
    box.addEventListener("mouseleave", () => target = 1);
    const step = t => {
      const dt = Math.min(.05, (t - last) / 1000); last = t;
      speed += (target - speed) * Math.min(1, dt * 6);
      if (!reduce) {
        x -= 40 * speed * dt;
        const third = track.scrollWidth / 3;
        if (third && -x >= third) x += third;
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, n = +el.dataset.count, suf = el.dataset.suffix || "";
    if (reduce) return;
    const t0 = performance.now(), dur = 1600;
    const f = t => {
      const p = clamp((t - t0) / dur, 0, 1), v = Math.round(n * (1 - Math.pow(1 - p, 3)));
      el.innerHTML = `${v}<em>${suf}</em>`;
      if (p < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }), { threshold: .5 });
  $$("[data-count]").forEach(el => cio.observe(el));

  /* ---------- FAQ ---------- */
  $$(".faq").forEach(list => list.addEventListener("click", e => {
    const c = e.target.closest(".copy");
    if (c) {
      const orig = c.textContent, done = () => { c.textContent = "Copied"; setTimeout(() => c.textContent = orig, 1300); };
      const sel = () => { const r = document.createRange(); r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
      try { navigator.clipboard.writeText(c.dataset.copy).then(done, sel); } catch (_) { sel(); }
      return;
    }
    const b = e.target.closest(".q > button"); if (!b) return;
    const q = b.parentElement, open = q.classList.toggle("open");
    b.setAttribute("aria-expanded", open);
  }));

  /* ---------- scroll-linked: blur on exit at the top, steps rail ---------- */
  const sbEls = $$("[data-sb]"), rails = $$(".step .rail i");
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const vh = innerHeight, zone = Math.min(130, vh * .18);
    sbEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh) return;
      const t = clamp((zone - r.top) / zone, 0, 1);
      if (t > 0) { el.style.filter = `blur(${(t * 9).toFixed(2)}px)`; el.style.opacity = (1 - t * .85).toFixed(3); }
      else if (el.style.filter) { el.style.filter = ""; el.style.opacity = ""; }
    });
    rails.forEach(i => {
      const r = i.parentElement.getBoundingClientRect();
      i.style.setProperty("--p", clamp((vh * .55 - r.top) / r.height, 0, 1).toFixed(3));
    });
  };
  if (!reduce) { addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll(); }
  else rails.forEach(i => i.style.setProperty("--p", 1));

  /* ---------- background light (Framer "Particles" colours, drifting) ---------- */
  const PALETTES = {
    home: [[64, 94, 227, .9], [78, 8, 191, .85], [23, 135, 209, .35], [18, 82, 201, .7], [12, 176, 18, .3], [40, 30, 180, .6]],
    about: [[12, 176, 18, .62], [23, 135, 209, .55], [40, 110, 130, .6], [18, 82, 201, .7], [12, 150, 60, .45], [30, 70, 170, .55]],
    video: [[18, 82, 201, .85], [64, 94, 227, .8], [78, 8, 191, .55], [23, 135, 209, .6], [30, 50, 160, .7], [40, 60, 200, .6]]
  };
  const cv = $(".stage canvas");
  if (cv) {
    const g = cv.getContext("2d"), pal = PALETTES[document.body.dataset.palette] || PALETTES.home, S = 1 / 6;
    let W = 0, H = 0;
    const fit = () => { W = Math.max(1, Math.round(innerWidth * S)); H = Math.max(1, Math.round(innerHeight * S)); cv.width = W; cv.height = H; };
    fit(); addEventListener("resize", fit);
    const blobs = pal.map((c, k) => ({
      c, px: .5 + (Math.random() - .5) * .5, py: .5 + (Math.random() - .5) * .45,
      ax: .14 + Math.random() * .16, ay: .1 + Math.random() * .14,
      fx: (.035 + Math.random() * .04) * (k % 2 ? 1 : -1), fy: .03 + Math.random() * .04,
      ph: Math.random() * 6.28, r: .26 + Math.random() * .16
    }));
    let last = 0;
    const draw = t => {
      if (t - last > 33 || !last) {
        last = t; const s = t / 1000;
        g.globalCompositeOperation = "source-over";
        g.fillStyle = "rgb(12,12,12)"; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = "lighter";
        const m = Math.max(W, H);
        blobs.forEach(b => {
          const x = (b.px + Math.sin(s * b.fx * 6.28 + b.ph) * b.ax) * W;
          const y = (b.py + Math.cos(s * b.fy * 6.28 + b.ph * 1.3) * b.ay) * H;
          const r = b.r * m * (1 + .08 * Math.sin(s * .3 + b.ph));
          const gr = g.createRadialGradient(x, y, 0, x, y, r);
          const [R, G, B, A] = b.c;
          gr.addColorStop(0, `rgba(${R},${G},${B},${A * .5})`);
          gr.addColorStop(.4, `rgba(${R},${G},${B},${A * .24})`);
          gr.addColorStop(1, `rgba(${R},${G},${B},0)`);
          g.fillStyle = gr; g.fillRect(0, 0, W, H);
        });
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  /* ---------- shooting stars (travel 780 x 325, Framer loop timings) ---------- */
  const starBox = $(".stars");
  if (starBox && !reduce) {
    const cfg = [[1, 6, 5.4, 18, 4], [2, 6, 4.5, 33, 13], [.6, 7, 1.7, 12, 26], [3.4, 6.5, 3.2, 44, 2], [4.8, 7, 2.6, 26, 34]];
    const ang = Math.atan2(325, 780) * 180 / Math.PI;
    cfg.forEach(([wait, dur, rep, left, top]) => {
      const st = document.createElement("i");
      st.className = "star"; st.style.left = left + "%"; st.style.top = top + "%";
      starBox.appendChild(st);
      const sc = .5 + Math.random() * .4;
      const run = () => {
        const a = st.animate([
          { opacity: 0, transform: `translate(0,0) rotate(${ang}deg) scaleX(${sc})` },
          { opacity: 1, offset: .2 },
          { opacity: .9, offset: .6 },
          { opacity: 0, transform: `translate(780px,325px) rotate(${ang}deg) scaleX(1)` }
        ], { duration: dur * 1000, easing: "cubic-bezier(.12,.23,.5,1)", fill: "both" });
        a.onfinish = () => setTimeout(run, rep * 1000);
      };
      setTimeout(run, wait * 1000);
    });
  }

  /* ---------- contact card: flowing white ribbons (WebGL) ---------- */
  $$(".cta canvas").forEach(cvs => {
    const gl = cvs.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) { cvs.remove(); return; }
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `precision highp float;uniform vec2 r;uniform float t;
float h1(float x){return fract(sin(x*127.1)*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n1(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h1(i),h1(i+1.),f);}
float fb(float x){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*n1(x);x=x*2.03+1.7;a*=.5;}return v;}
float ctr(float x,float sd,float s,float off){return (fb(x*.62+sd*7.1+s)-.45)*1.55+sin(x*1.55+sd*3.3+s*1.6)*.24+off;}
float ribbon(vec2 p,float sd,float s,float off,float dir){
  float c=ctr(p.x,sd,s,off), c2=ctr(p.x+.01,sd,s,off), sl=(c2-c)/.01;
  float d=(p.y-c)/sqrt(1.+sl*sl), dd=d*dir;
  float along=fb(p.x*.75+sd*13.-s*.7);
  float w=mix(.04,.2,along);
  float mist=dd>0.?exp(-pow(dd/w,1.25)):exp(-dd*dd/.0004);
  mist*=smoothstep(.28,.7,along)*.95;
  mist+=exp(-abs(d)/.3)*.07*along;
  mist*=.72+.56*h2(floor(gl_FragCoord.xy)+.37);
  float core=exp(-d*d/.0000045)*smoothstep(.28,.62,fb(p.x*1.05+sd*5.+s*.5))*.95;
  return mist+core;
}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*r)/r.y;
  float an=-.32; p=mat2(cos(an),-sin(an),sin(an),cos(an))*p;
  float s=t*.045;
  float v=ribbon(p,1.,s,-.42,1.)+ribbon(p,2.,s*1.15,.06,-1.)+ribbon(p,3.,s*.9,.47,1.);
  gl_FragColor=vec4(vec3(clamp(v,0.,1.)),1.);
}`;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cvs.remove(); return; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const lp = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
    const ur = gl.getUniformLocation(pr, "r"), ut = gl.getUniformLocation(pr, "t");
    const fitGL = () => { const d = Math.min(devicePixelRatio || 1, 2); cvs.width = Math.round(cvs.clientWidth * d); cvs.height = Math.round(cvs.clientHeight * d); gl.viewport(0, 0, cvs.width, cvs.height); };
    fitGL(); addEventListener("resize", fitGL);
    let visible = false;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) cvs.classList.add("on"); }).observe(cvs);
    const t0 = performance.now() - 20000;
    const frame = now => {
      if (visible || reduce) { gl.uniform2f(ur, cvs.width, cvs.height); gl.uniform1f(ut, (now - t0) / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); }
      if (!reduce) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });

  /* ---------- light that follows the cursor ---------- */
  const orb = $(".orb");
  if (orb && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    let mx = -100, my = -100, ox = -100, oy = -100, live = false;
    addEventListener("pointermove", e => {
      mx = e.clientX; my = e.clientY;
      if (!live) { ox = mx; oy = my; live = true; orb.classList.add("on"); }
      orb.classList.toggle("big", !!e.target.closest("a,button,.app,.q"));
    }, { passive: true });
    document.addEventListener("pointerleave", () => orb.classList.remove("on"));
    document.addEventListener("pointerenter", () => { if (live) orb.classList.add("on"); });
    const follow = () => {
      const k = reduce ? 1 : .32;
      ox += (mx - ox) * k; oy += (my - oy) * k;
      orb.style.transform = `translate3d(${ox.toFixed(1)}px,${oy.toFixed(1)}px,0)`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  } else if (orb) orb.hidden = true;

  /* ---------- CV overlay ---------- */
  const cvBox = $("#cv");
  if (cvBox) {
    let lastFocus = null;
    const panel = $(".cv-panel", cvBox);
    const openCV = () => {
      if (!cvBox.hidden) return;
      lastFocus = document.activeElement;
      cvBox.hidden = false; cvBox.scrollTop = 0;
      doc.classList.add("cv-lock");
      requestAnimationFrame(() => requestAnimationFrame(() => cvBox.classList.add("open")));
      setTimeout(() => panel.focus({ preventScroll: true }), 60);
    };
    const closeCV = () => {
      if (cvBox.hidden) return;
      cvBox.classList.remove("open");
      doc.classList.remove("cv-lock");
      setTimeout(() => { cvBox.hidden = true; }, reduce ? 0 : 420);
      if (location.hash === "#cv") history.replaceState(null, "", location.pathname + location.search);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    $$("[data-cv]").forEach(b => b.addEventListener("click", openCV));
    $$("[data-cv-close]", cvBox).forEach(b => b.addEventListener("click", closeCV));
    cvBox.addEventListener("click", e => {
      const c = e.target.closest(".copy"); if (!c) return;
      const orig = c.textContent;
      try { navigator.clipboard.writeText(c.dataset.copy).then(() => { c.textContent = "Copied"; setTimeout(() => c.textContent = orig, 1300); }, () => {}); } catch (_) {}
    });
    document.addEventListener("keydown", e => {
      if (cvBox.hidden) return;
      if (e.key === "Escape") closeCV();
      if (e.key === "Tab") {
        const f = $$("button,a[href]", cvBox).filter(el => el.offsetParent);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    if (location.hash === "#cv") openCV();
    addEventListener("hashchange", () => { if (location.hash === "#cv") openCV(); });
  }

  /* ---------- nav shade on scroll, card spotlight, back to top ---------- */
  const navEl = $(".nav");
  if (navEl) { const sh = () => navEl.classList.toggle("scrolled", scrollY > 30); sh(); addEventListener("scroll", sh, { passive: true }); }
  $$(".card").forEach(c => c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px");
  }));
  $$(".totop").forEach(b => b.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })));

  /* ---------- footer year ---------- */
  $$("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();
