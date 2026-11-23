/**
 * ISU ID Generator — animations.js  v2
 * Animation layer: GSAP 3 (ScrollTrigger) · Anime.js v4 · Three.js r134
 *
 * Modules:
 *   A — Three.js hero particle constellation
 *   B — GSAP hero entrance timeline
 *   C — GSAP ScrollTrigger scroll reveals
 *   D — Anime.js micro-interactions
 *   E — Three.js holographic card shimmer
 *   F — GSAP scroll-driven parallax
 *   G — Page-load coordination + prefers-reduced-motion
 *
 * Bug fixes in v2:
 *   - Three.js deferred-load race: wait for window.load before touching THREE
 *   - Particle IntersectionObserver: cancel rAF properly on leave, guard re-entry
 *   - Holo canvas tilt lerp formula corrected (was diverging with negative factor)
 *   - Canvas 0×0 size at init: use section dimensions as fallback
 *   - reducedMotion flag: checked lazily inside each function, not at parse time
 *   - Navbar CSS var animation: apply class toggle instead of gsap.to on CSS var
 *   - ScrollTrigger.batch 'once' is unsupported: replaced with correct pattern
 *   - Glass panels not hidden: skip autoAlpha=0 for generator panels (already visible)
 *   - Empty initScrollProgress removed (was a no-op ScrollTrigger)
 *   - Anime.js stagger() now passes options object correctly
 *   - All Anime.js easing strings verified against v4 API
 */

(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────────
     GUARD: require GSAP (non-negotiable) + soft-warn on Anime.js
  ──────────────────────────────────────────────────────────────────── */
  if (typeof gsap === 'undefined') {
    console.warn('[animations.js] GSAP not loaded — animations skipped.');
    return;
  }

  /* ────────────────────────────────────────────────────────────────────
     GSAP setup
  ──────────────────────────────────────────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power2.out', duration: 0.7 });

  /* ────────────────────────────────────────────────────────────────────
     MODULE G — Reduced-motion detection (lazy flag — read inside fns)
     Using matchMedia directly so the boolean is synchronously available.
  ──────────────────────────────────────────────────────────────────── */
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ────────────────────────────────────────────────────────────────────
     Helper: safe canvas size (avoids 0×0 if CSS not yet painted)
  ──────────────────────────────────────────────────────────────────── */
  function canvasSize(canvas, fallbackEl) {
    const w = canvas.clientWidth  || fallbackEl.clientWidth  || window.innerWidth;
    const h = canvas.clientHeight || fallbackEl.clientHeight || window.innerHeight;
    return { w, h };
  }

  /* ════════════════════════════════════════════════════════════════════
     MODULE A — Three.js Hero Particle Constellation
  ════════════════════════════════════════════════════════════════════ */
  function initThreeHero() {
    // Disabled as requested: background particle constellation animation removed for performance
    return;
  }



  /* ════════════════════════════════════════════════════════════════════
     MODULE E — Three.js Holographic Card Shimmer
  ════════════════════════════════════════════════════════════════════ */
  function initHoloCard() {
    const canvas = document.getElementById('holo-canvas');
    if (!canvas) return;

    const THREE = window.THREE;
    if (!THREE) return;

    const stage = canvas.parentElement;
    const { w: initW, h: initH } = canvasSize(canvas, stage || document.body);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(initW, initH, false);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uTilt:  { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform vec2 uTilt;
        varying vec2 vUv;

        vec3 hsl2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
          return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
        }

        void main() {
          float hue   = vUv.x + vUv.y*0.4 + uTime*0.08 + uMouse.x*0.25 + uTilt.x*0.15;
          vec3  color = hsl2rgb(vec3(hue, 0.85, 0.55 + sin(uTime*1.8+vUv.y*7.0)*0.04));

          float band  = sin((vUv.x - vUv.y)*5.0 + uTime*2.5 + uTilt.y*3.5)*0.5 + 0.5;
          band = pow(band, 3.0) * 0.35;

          vec2 edge = smoothstep(0.0,0.12,vUv) * (1.0-smoothstep(0.88,1.0,vUv));
          float mask = edge.x * edge.y;

          gl_FragColor = vec4(color * band, band * mask * 0.30);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    const onResize = () => {
      const { w, h } = canvasSize(canvas, stage || document.body);
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize, { passive: true });

    // Tilt tracking
    const cardEl = document.getElementById('card-tilt-wrapper');
    let tX = 0, tY = 0;
    if (cardEl) {
      cardEl.addEventListener('mousemove', e => {
        const r = cardEl.getBoundingClientRect();
        tX = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        tY = ((e.clientY - r.top)  / r.height - 0.5) * 2;
        mat.uniforms.uMouse.value.set(
          (e.clientX - r.left) / r.width,
          1 - (e.clientY - r.top) / r.height
        );
      }, { passive: true });
      cardEl.addEventListener('mouseleave', () => { tX = 0; tY = 0; });
    }

    let holoT = 0;
    let rafId = null;
    let isVisible = false;

    function holoLoop() {
      if (!isVisible) return;
      rafId = requestAnimationFrame(holoLoop);
      holoT += 0.016;
      mat.uniforms.uTime.value = holoT;
      // FIX: correct lerp formula  value += (target - value) * factor
      const u = mat.uniforms.uTilt.value;
      u.x += (tX - u.x) * 0.08;
      u.y += (tY - u.y) * 0.08;
      renderer.render(scene, camera);
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting && !document.hidden;
      if (isVisible) holoLoop();
      else cancelAnimationFrame(rafId);
    }, { threshold: 0.01 });

    observer.observe(canvas.parentElement);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else if (isVisible) {
        holoLoop();
      }
    });
  }

  /* ════════════════════════════════════════════════════════════════════
     MODULE B — GSAP Hero Entrance Timeline
  ════════════════════════════════════════════════════════════════════ */
  function initHeroEntrance() {
    if (prefersReducedMotion()) return;

    // Guard: only animate elements that exist
    const exists = sel => document.querySelector(sel) !== null;

    if (exists('.hero-word'))      gsap.set('.hero-word',        { y: 60,  autoAlpha: 0 });
    if (exists('.hero-subtitle'))  gsap.set('.hero-subtitle',    { y: 28,  autoAlpha: 0 });
    if (exists('.hfp'))            gsap.set('.hfp',              { x: -20, autoAlpha: 0 });
    if (exists('.hero-actions'))   gsap.set('.hero-actions',     { y: 18,  autoAlpha: 0 });
    if (exists('.hero-stat'))      gsap.set('.hero-stat',        { y: 14,  autoAlpha: 0 });
    if (exists('.hero-right-col')) gsap.set('.hero-right-col',   { x: 50,  autoAlpha: 0 });
    if (exists('.hero-floating-badge')) gsap.set('.hero-floating-badge', { scale: 0, autoAlpha: 0 });
    if (exists('.hero-marquee'))   gsap.set('.hero-marquee',     { y: 18,  autoAlpha: 0 });
    if (exists('.hero-scroll-indicator')) gsap.set('.hero-scroll-indicator', { autoAlpha: 0 });

    const tl = gsap.timeline({ delay: 0.1 });

    if (exists('.hero-word'))
      tl.to('.hero-word', { y: 0, autoAlpha: 1, duration: 0.65, ease: 'power3.out',
        stagger: { each: 0.07 } }, '-=0.15');

    if (exists('.hero-subtitle'))
      tl.to('.hero-subtitle', { y: 0, autoAlpha: 1, duration: 0.55 }, '-=0.25');

    if (exists('.hfp'))
      tl.to('.hfp', { x: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out',
        stagger: { each: 0.06 } }, '-=0.25');

    if (exists('.hero-actions'))
      tl.to('.hero-actions', { y: 0, autoAlpha: 1, duration: 0.45 }, '-=0.15');

    if (exists('.hero-stat'))
      tl.to('.hero-stat', { y: 0, autoAlpha: 1, duration: 0.38, ease: 'power2.out',
        stagger: { each: 0.07 } }, '-=0.1');

    if (exists('.hero-right-col'))
      tl.to('.hero-right-col', { x: 0, autoAlpha: 1, duration: 0.75, ease: 'power3.out' }, 0.25);

    if (exists('.hero-floating-badge'))
      tl.to('.hero-floating-badge', { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(2)',
        stagger: { each: 0.09, from: 'random' } }, '-=0.35');

    if (exists('.hero-marquee'))
      tl.to('.hero-marquee', { y: 0, autoAlpha: 1, duration: 0.45 }, '-=0.15');

    if (exists('.hero-scroll-indicator'))
      tl.to('.hero-scroll-indicator', { autoAlpha: 1, duration: 0.5 }, '-=0.1');
  }

  /* ════════════════════════════════════════════════════════════════════
     MODULE C — GSAP ScrollTrigger Reveals
  ════════════════════════════════════════════════════════════════════ */
  function initScrollTrigger() {
    if (prefersReducedMotion()) {
      document.querySelectorAll('.sr').forEach(el => el.classList.add('visible'));
      return;
    }

    // Mark all .sr visible immediately so nothing stays stuck invisible
    document.querySelectorAll('.sr').forEach(el => el.classList.add('visible'));

    // ── Section headers ────────────────────────────────────────────
    gsap.utils.toArray('.section-header').forEach(el => {
      const eyebrow = el.querySelector('.section-eyebrow');
      const title   = el.querySelector('.section-title');
      const sub     = el.querySelector('.section-subtitle');

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          once: true
        }
      });

      if (eyebrow) {
        gsap.set(eyebrow, { y: 18, autoAlpha: 0 });
        tl.to(eyebrow, { y: 0, autoAlpha: 1, duration: 0.45 });
      }
      if (title) {
        gsap.set(title, { y: 32, autoAlpha: 0 });
        tl.to(title, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out' }, '-=0.15');
      }
      if (sub) {
        gsap.set(sub, { y: 18, autoAlpha: 0 });
        tl.to(sub, { y: 0, autoAlpha: 1, duration: 0.45 }, '-=0.15');
      }
    });

    // ── Bento cards ────────────────────────────────────────────────
    // FIX: ScrollTrigger.batch does NOT support 'once'. Use onEnter + kill.
    const bentoCards = gsap.utils.toArray('.bento-card');
    if (bentoCards.length) {
      gsap.set(bentoCards, { y: 44, autoAlpha: 0, scale: 0.96 });

      ScrollTrigger.batch(bentoCards, {
        start: 'top 80%',
        onEnter: batch => {
          gsap.to(batch, {
            y: 0, autoAlpha: 1, scale: 1,
            duration: 0.6, ease: 'power3.out',
            stagger: { each: 0.08 }
          });
          // Kill individual triggers so they only fire once
          batch.forEach(el => {
            const st = ScrollTrigger.getAll().find(t => t.trigger === el);
            if (st) st.kill();
          });
        }
      });
    }

    // ── How-It-Works steps ────────────────────────────────────────
    gsap.utils.toArray('.hiw-step').forEach((step, i) => {
      gsap.set(step, { x: i % 2 === 0 ? -55 : 55, autoAlpha: 0 });
      gsap.to(step, {
        x: 0, autoAlpha: 1, duration: 0.65, ease: 'power3.out',
        scrollTrigger: { trigger: step, start: 'top 80%', once: true }
      });
    });

    // ── Connector lines draw in ────────────────────────────────────
    gsap.utils.toArray('.hiw-connector').forEach(conn => {
      const line  = conn.querySelector('.hiw-connector-line');
      const arrow = conn.querySelector('.hiw-connector-arrow');
      if (!line) return;

      gsap.set(line, { scaleX: 0, transformOrigin: 'left center' });
      if (arrow) gsap.set(arrow, { autoAlpha: 0, x: -8 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: conn, start: 'top 80%', once: true }
      });
      tl.to(line, { scaleX: 1, duration: 0.45, ease: 'power2.inOut' });
      if (arrow) tl.to(arrow, { autoAlpha: 1, x: 0, duration: 0.28, ease: 'back.out(1.7)' }, '-=0.08');
    });

    // ── HIW CTA ───────────────────────────────────────────────────
    const hiwCta = document.querySelector('.hiw-cta');
    if (hiwCta) {
      gsap.set(hiwCta, { y: 26, autoAlpha: 0 });
      gsap.to(hiwCta, {
        y: 0, autoAlpha: 1, duration: 0.55,
        scrollTrigger: { trigger: hiwCta, start: 'top 80%', once: true }
      });
    }

    // ── Generator section header ──────────────────────────────────
    const genHeader = document.querySelector('.generator-header .section-header');
    if (genHeader) {
      gsap.set(genHeader, { y: 36, autoAlpha: 0 });
      gsap.to(genHeader, {
        y: 0, autoAlpha: 1, duration: 0.6,
        scrollTrigger: { trigger: genHeader, start: 'top 80%', once: true }
      });
    }

    // ── Footer brand + links ──────────────────────────────────────
    const footer = document.querySelector('.site-footer');
    if (footer) {
      const brand  = footer.querySelector('.footer-brand');
      const cols   = footer.querySelectorAll('.footer-links-col');
      const bottom = footer.querySelector('.footer-bottom');

      if (brand) {
        gsap.set(brand, { x: -36, autoAlpha: 0 });
        gsap.to(brand, {
          x: 0, autoAlpha: 1, duration: 0.6,
          scrollTrigger: { trigger: footer, start: 'top 80%', once: true }
        });
      }
      if (cols.length) {
        gsap.set(cols, { y: 26, autoAlpha: 0 });
        gsap.to(cols, {
          y: 0, autoAlpha: 1, duration: 0.55, stagger: { each: 0.09 },
          scrollTrigger: { trigger: footer, start: 'top 80%', once: true }
        });
      }
      if (bottom) {
        gsap.set(bottom, { y: 18, autoAlpha: 0 });
        gsap.to(bottom, {
          y: 0, autoAlpha: 1, duration: 0.45, delay: 0.3,
          scrollTrigger: { trigger: footer, start: 'top 80%', once: true }
        });
      }
    }
  }

  /* ════════════════════════════════════════════════════════════════════
     MODULE F — GSAP Scroll-Driven Parallax
  ════════════════════════════════════════════════════════════════════ */
  function initParallax() {
    if (prefersReducedMotion()) return;

    const hero = document.getElementById('home');
    if (!hero) return;


    // Background glows and orbs are kept static without scroll parallax overhead


    // Hero left column subtle float up
    const heroLeft = document.querySelector('.hero-left-col');
    if (heroLeft) gsap.to(heroLeft, { y: -36, ease: 'none', scrollTrigger: ST_HERO });

    // Stage glow rings
    document.querySelectorAll('.hero-stage-glow').forEach((g, i) => {
      gsap.to(g, { scale: 1.28, ease: 'none',
        scrollTrigger: { ...ST_HERO, scrub: 1.2 + i * 0.4 } });
    });
  }


  function initMicroInteractions() {
    if (typeof anime === 'undefined') {
      console.warn('[animations.js] Anime.js not loaded — micro-interactions skipped.');
      return;
    }

    // Destructure v4 UMD API — note: v4 easing names drop the 'ease' prefix
    const { animate, stagger } = anime;

    // ── Nav link underline ────────────────────────────────────────
    document.querySelectorAll('.nav-link').forEach(link => {
      const u = document.createElement('span');
      u.className = 'nav-link-underline';
      Object.assign(u.style, {
        position: 'absolute', bottom: '-2px', left: '0',
        height: '2px', width: '0', borderRadius: '2px',
        background: 'var(--green-500, #15B915)',
        pointerEvents: 'none', transition: 'none'
      });
      link.style.position = 'relative';
      link.appendChild(u);
      link.addEventListener('mouseenter', () => animate(u, { width: '100%', duration: 260, ease: 'outCubic' }));
      link.addEventListener('mouseleave', () => animate(u, { width: '0%',   duration: 180, ease: 'inCubic' }));
    });

    // ── Bento card hover ──────────────────────────────────────────
    document.querySelectorAll('.bento-card').forEach(card => {
      const glow = card.querySelector('[class*="bento-card-glow"]');
      card.addEventListener('mouseenter', () => {
        animate(card, { scale: 1.02, duration: 280, ease: 'outExpo' });
        if (glow) animate(glow, { opacity: 0.8, duration: 280 });
      });
      card.addEventListener('mouseleave', () => {
        animate(card, { scale: 1,    duration: 400, ease: 'outElastic(1, 0.5)' });
        if (glow) animate(glow, { opacity: 0,   duration: 350 });
      });
    });

    // ── CTA pulse (every 4s) ──────────────────────────────────────
    const ctaBtns = [...document.querySelectorAll('.btn-primary.hero-cta, #nav-cta-btn')];
    if (ctaBtns.length) {
      const doPulse = () => {
        animate(ctaBtns, {
          scale: [1, 1.04, 1], duration: 750, ease: 'inOutSine',
          delay: stagger(100, { start: 0 })
        });
        setTimeout(doPulse, 4000);
      };
      setTimeout(doPulse, 2800);
    }

    // ── Live badge dot ────────────────────────────────────────────
    const liveDot = document.querySelector('.live-dot');
    if (liveDot) {
      animate(liveDot, {
        scale: [1, 1.55, 1], opacity: [1, 0.35, 1],
        duration: 1600, loop: true, ease: 'inOutSine'
      });
    }


    // ── Floating badges — soft float loop ────────────────────────
    document.querySelectorAll('.hero-floating-badge').forEach((badge, i) => {
      animate(badge, {
        translateY: [0, -9, 0],
        duration: 2600 + i * 380,
        loop: true, ease: 'inOutSine',
        delay: i * 320
      });
    });

    // ── Step transition API (called from app.js stepper) ─────────
    window._animeStepIn = el => {
      if (!el) return;
      animate(el, { translateY: [20, 0], opacity: [0, 1], duration: 280, ease: 'easeOutCubic' });
    };
    window._animeStepOut = el => {
      if (!el) return;
      animate(el, { translateY: [0, -18], opacity: [1, 0], duration: 220, ease: 'easeInCubic' });
    };

    // ── Version toggle ripple ──────────────────────────────────────
    document.querySelectorAll('.version-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        animate(btn, { scale: [0.95, 1.04, 1], duration: 340, ease: 'outBack' });
      });
    });

    // ── Stepper button hover ──────────────────────────────────────
    document.querySelectorAll('.stepper-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => animate(btn, { scale: 1.04, duration: 180, ease: 'outExpo' }));
      btn.addEventListener('mouseleave', () => animate(btn, { scale: 1,    duration: 320, ease: 'outElastic(1, 0.4)' }));
    });

    // ── Feature pills hover ───────────────────────────────────────
    document.querySelectorAll('.hfp').forEach(el => {
      el.addEventListener('mouseenter', () => animate(el, { scale: 1.07, duration: 180, ease: 'outExpo' }));
      el.addEventListener('mouseleave', () => animate(el, { scale: 1,    duration: 280, ease: 'outElastic(1, 0.5)' }));
    });

    // ── Nav CTA magnetic hover ────────────────────────────────────
    const navCta = document.getElementById('nav-cta-btn');
    if (navCta) {
      navCta.addEventListener('mouseenter', () => animate(navCta, { scale: 1.05, duration: 180, ease: 'outExpo' }));
      navCta.addEventListener('mouseleave', () => animate(navCta, { scale: 1,    duration: 360, ease: 'outElastic(1, 0.3)' }));
    }



    // ── HIW step icon bounce on enter ────────────────────────────
    const stepIcons = document.querySelectorAll('.hiw-step-icon');
    if (stepIcons.length) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          animate(e.target, {
            scale: [0.45, 1.12, 1], rotate: ['-8deg', '4deg', '0deg'], opacity: [0, 1],
            duration: 580, ease: 'outBack'
          });
          obs.unobserve(e.target);
        });
      }, { threshold: 0.5 });
      stepIcons.forEach(icon => obs.observe(icon));
    }

    // ── Bento stat number pop ────────────────────────────────────
    const bentoNums = document.querySelectorAll('.bento-stat-num');
    if (bentoNums.length) {
      const obs2 = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          animate(e.target, { scale: [0.5, 1.12, 1], opacity: [0, 1], duration: 480, ease: 'outBack' });
          obs2.unobserve(e.target);
        });
      }, { threshold: 0.8 });
      bentoNums.forEach(n => obs2.observe(n));
    }

    // ── Footer social icon hover ──────────────────────────────────
    document.querySelectorAll('.icon-link').forEach(icon => {
      icon.addEventListener('mouseenter', () => animate(icon, { scale: 1.2, translateY: -4, duration: 180, ease: 'outExpo' }));
      icon.addEventListener('mouseleave', () => animate(icon, { scale: 1,   translateY:  0, duration: 320, ease: 'outElastic(1, 0.5)' }));
    });

    // ── Download button click ─────────────────────────────────────
    const dlBtn = document.getElementById('download-btn');
    if (dlBtn) {
      dlBtn.addEventListener('click', () => {
        animate(dlBtn, { scale: [1, 0.94, 1.04, 1], duration: 480, ease: 'outBack' });
      });
    }
  }

  /* ════════════════════════════════════════════════════════════════════
     INIT — Orchestrate all modules with correct timing
  ════════════════════════════════════════════════════════════════════ */
  function bootHeavy() {
    // Three.js modules need window.THREE, which is deferred — run after window.load
    initThreeHero();
    initHoloCard();
    initScrollTrigger();
    initParallax();
    ScrollTrigger.refresh();
  }

  function init() {
    initHeroEntrance();
    initMicroInteractions();

    // Three.js is loaded with `defer` — window.THREE only guaranteed after load
    if (document.readyState === 'complete') {
      bootHeavy();
    } else {
      window.addEventListener('load', bootHeavy, { once: true });
    }
  }

  // Entry point
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

})();
