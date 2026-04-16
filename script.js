/* =============================================
   UPDATE HTML — use correct CSS class names
   This script runs before DOM-ready, we wait
   ============================================= */

// ── Smooth Scroll (Lenis ONLY via rAF — no GSAP ticker conflict) ─────────────
const lenis = new Lenis({
    duration: 1.3,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
});

function lenisRaf(time) {
    lenis.raf(time);
    requestAnimationFrame(lenisRaf);
}
requestAnimationFrame(lenisRaf);

// ── GSAP RegisterPlugin (no lenis integration to avoid double-tick) ──────────
gsap.registerPlugin(ScrollTrigger);

// ── Custom Cursor ─────────────────────────────────────────────────────────────
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    gsap.set(cursor, { x: mx, y: my });
});

(function followLoop() {
    fx += (mx - fx) * 0.09;
    fy += (my - fy) * 0.09;
    gsap.set(follower, { x: fx, y: fy });
    requestAnimationFrame(followLoop);
})();

document.querySelectorAll('a, button, .model-card').forEach(el => {
    el.addEventListener('mouseenter', () => follower.classList.add('hovered'));
    el.addEventListener('mouseleave', () => follower.classList.remove('hovered'));
});

// ── LOADER — Precision Reveal ────────────────────────────────────────────────
window.addEventListener('load', () => {

    const heroKicker = document.querySelector('.hero-kicker');
    const heroLines  = document.querySelectorAll('.hero-headline .line');
    const heroSub    = document.querySelector('.hero-sub');
    const heroCta    = document.querySelector('.hero-cta-wrap');
    const heroScroll = document.querySelector('.hero-scroll-hint');
    const nav        = document.getElementById('navHeader');

    gsap.set([heroKicker, heroLines, heroSub, heroCta, heroScroll], { opacity: 0, y: 32 });
    gsap.set(nav, { opacity: 0, y: -30 });
    gsap.set('.hero-img', { scale: 1.18 });

    // ── Live counter ──────────────────────────────────────────────────────
    let counterVal = 0;
    const counterEl = document.getElementById('ldCounter');
    const counterInterval = setInterval(() => {
        counterVal = Math.min(counterVal + Math.ceil(Math.random() * 7), 100);
        counterEl.textContent = String(counterVal).padStart(3, '0');
        if (counterVal >= 100) clearInterval(counterInterval);
    }, 40);

    const m = gsap.timeline();

    // Phase 1: Corner brackets snap in (staggered, crisp)
    m.to(['.ld-corner--tl', '.ld-corner--tr', '.ld-corner--bl', '.ld-corner--br'], {
        opacity: 1, duration: 0.25, stagger: 0.08, ease: 'power3.out'
    }, 0.2)

    // Phase 2: Counter appears
    .to('#ldCounter', { opacity: 1, duration: 0.3 }, 0.3)

    // Phase 3: Badge scales in + ring draws
    .to('#ldBadge', {
        opacity: 1, scale: 1, duration: 1.0, ease: 'expo.out'
    }, 0.5)
    .to('#ring2', {
        strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut'
    }, 0.55)

    // Phase 4: AM text fades into center of badge
    .to('#amText', { opacity: 1, duration: 0.6, ease: 'power3.out' }, 1.6)

    // Phase 5: Shimmer wordmark
    .to('#ldWordmark', { opacity: 1, duration: 0.01 }, 2.0)
    .to('#ldShimmer', {
        x: '200%', duration: 1.0, ease: 'power2.inOut'
    }, 2.05)

    // Phase 6: Tagline fades in
    .to('#ldTagline', { opacity: 1, duration: 0.5 }, 2.8)

    // Wait, then flash → curtain split
    .to('#ldFlash', { opacity: 0.6, duration: 0.12, ease: 'power4.in' }, 3.4)
    .to('#ldFlash', { opacity: 0, duration: 0.4, ease: 'power3.out' }, 3.52)

    // Phase 7: Curtains split top and bottom
    .set(['#ldCurtainT', '#ldCurtainB'], { scaleY: 1 }, 3.45)
    .to('#ldStage', { opacity: 0, duration: 0.2 }, 3.45)
    .to('.ld-corner', { opacity: 0, duration: 0.2 }, 3.45)
    .to('#ldCurtainT', { scaleY: 0, duration: 1.0, ease: 'expo.inOut' }, 3.55)
    .to('#ldCurtainB', { scaleY: 0, duration: 1.0, ease: 'expo.inOut' }, 3.55)
    .set('#loader', { display: 'none' }, 4.6)

    // Hero entrance fires during curtain opening
    .to('.hero-img', { scale: 1, duration: 2.0, ease: 'power3.out' }, 3.6)
    .to(nav, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 4.0)
    .to(heroKicker, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 4.15)
    .to(heroLines, { opacity: 1, y: 0, duration: 1.0, stagger: 0.1, ease: 'power4.out' }, 4.3)
    .to(heroSub,   { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 4.9)
    .to(heroCta,   { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 5.1)
    .to(heroScroll,{ opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 5.25)
    .call(initScrollFeatures, [], 4.5);
});

// ── Scroll Features (IntersectionObserver, parallax, nav, counters) ───────────
function initScrollFeatures() {

    // 1. Nav glass on scroll
    window.addEventListener('scroll', () => {
        document.getElementById('navHeader')
            .classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    // 2. CSS-transition reveals via IntersectionObserver (smooth, no GSAP conflict)
    const revealEls = document.querySelectorAll('.js-reveal, .js-reveal-scale');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));

    // 3. Hero parallax (GSAP only for smooth perf)
    gsap.to('.hero-img', {
        yPercent: 25,
        ease: 'none',
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5
        }
    });

    // 4. F1 image slow parallax
    gsap.to('#f1Img', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
            trigger: '.f1-banner',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 2
        }
    });

    // 5. Animated stat counters
    document.querySelectorAll('.stat-num').forEach(el => {
        const target = +el.dataset.target;
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                gsap.to(el, {
                    innerHTML: target,
                    duration: 2,
                    ease: 'power2.out',
                    snap: { innerHTML: 1 }
                });
                obs.unobserve(el);
            }
        }, { threshold: 0.5 });
        obs.observe(el);
    });
}

// ── Mobile Menu ───────────────────────────────────────────────────────────────
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');

hamburger.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    lenis.stop();
});
mobileClose.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    lenis.start();
});
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    lenis.start();
}));

// ══════════════════════════════════════════════════════════════════════════════
//  VANTAGE SPOTLIGHT — "Sync & Serve" Data Consumer
//  Fetches ./src/data/vantage-data.json (the static "Source of Truth")
//  Falls back to hardcoded values if the fetch fails.
// ══════════════════════════════════════════════════════════════════════════════

const VANTAGE_JSON_URL = './src/data/vantage-data.json';

const VANTAGE_FALLBACK = {
    model:      'Vantage',
    tagline:    'The most thrilling sports car in the world.',
    year:       2025,
    lastSynced: null,
    specs: {
        topSpeed:    { value: '202',  unit: 'mph', label: 'Top Speed'  },
        zeroToSixty: { value: '3.5',  unit: 'sec', label: '0–60 mph'   },
        power:       { value: '665',  unit: 'bhp', label: 'Peak Power' },
        torque:      { value: '800',  unit: 'Nm',  label: 'Max Torque' },
        engine:      { value: '4.0L Twin-Turbo V8', unit: '', label: 'Engine' },
    },
    images: [
        { url: 'model_vantage.png', alt: 'Aston Martin Vantage' },
        { url: 'img1.png',          alt: 'Aston Martin – Gallery 1' },
        { url: 'img3.png',          alt: 'Aston Martin – Gallery 2' },
        { url: 'interior.png',      alt: 'Aston Martin – Interior'  },
        { url: 'profile.png',       alt: 'Aston Martin – Profile'   },
    ],
    configuratorUrl: 'https://configurator.astonmartin.com/',
    isFallback: true,
};

// ── 1. Fetch JSON ─────────────────────────────────────────────────────────────
async function loadVantageData() {
    try {
        const res = await fetch(VANTAGE_JSON_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('[Vantage] JSON fetch failed, using fallback:', e.message);
        return VANTAGE_FALLBACK;
    }
}

// ── 2. Render spec items with animated counter ────────────────────────────────
function renderSpecs(specs) {
    const specItems = document.querySelectorAll('.vs-spec-item');
    const keyOrder  = ['topSpeed', 'zeroToSixty', 'power', 'torque', 'engine'];

    specItems.forEach((item, i) => {
        const key  = keyOrder[i];
        const spec = specs[key];
        if (!spec) return;

        const valEl   = item.querySelector('.vs-spec-value');
        const unitEl  = item.querySelector('.vs-spec-unit');
        const labelEl = item.querySelector('.vs-spec-label');

        item.classList.remove('skeleton');
        unitEl.textContent  = spec.unit;
        labelEl.textContent = spec.label;

        // Animate numeric values; leave strings (like engine name) static
        const isNumeric = !isNaN(parseFloat(spec.value));
        if (isNumeric) {
            valEl.textContent = '0';
            const targetNum = parseFloat(spec.value);

            const obs = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    gsap.to({ val: 0 }, {
                        val: targetNum,
                        duration: 1.8,
                        ease: 'power3.out',
                        onUpdate: function () {
                            const v = this.targets()[0].val;
                            valEl.textContent = Number.isInteger(targetNum)
                                ? Math.round(v)
                                : v.toFixed(1);
                        },
                    });
                    obs.unobserve(item);
                }
            }, { threshold: 0.4 });
            obs.observe(item);
        } else {
            valEl.textContent = spec.value;
        }
    });
}

// ── 3. Render gallery + thumbnails ────────────────────────────────────────────
function renderGallery(images) {
    const mainImg  = document.getElementById('vsMainImg');
    const thumbsEl = document.getElementById('vsGalleryThumbs');
    if (!mainImg || !thumbsEl) return;

    // Set first image as hero
    if (images[0]) {
        mainImg.src = images[0].url;
        mainImg.alt = images[0].alt;
    }

    thumbsEl.innerHTML = '';

    images.forEach((img, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'vs-thumb' + (i === 0 ? ' active' : '');
        thumb.innerHTML = `<img src="${img.url}" alt="${img.alt}" loading="lazy">`;
        thumb.addEventListener('click', () => {
            // Swap main image with GSAP crossfade
            gsap.to(mainImg, {
                opacity: 0, scale: 1.04, duration: 0.25,
                onComplete: () => {
                    mainImg.src = img.url;
                    mainImg.alt = img.alt;
                    gsap.to(mainImg, { opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' });
                }
            });
            document.querySelectorAll('.vs-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
        thumbsEl.appendChild(thumb);
    });
}

// ── 4. Populate text fields ───────────────────────────────────────────────────
function populateText(data) {
    const taglineEl = document.getElementById('vsTagline');
    const modelEl   = document.getElementById('vsModelName');
    const yearEl    = document.getElementById('vsYear');
    const badgeEl   = document.getElementById('vsBadgeText');

    if (taglineEl) taglineEl.textContent = data.tagline;
    if (modelEl)   modelEl.textContent   = data.model;
    if (yearEl)    yearEl.textContent    = data.year;

    if (badgeEl && data.lastSynced) {
        const d = new Date(data.lastSynced);
        const dateStr = d.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        badgeEl.textContent = data.isFallback ? 'CACHED DATA' : `SYNCED ${dateStr}`;
    }
}

// ── 5. Magnetic Button Physics ────────────────────────────────────────────────
function initMagneticButton() {
    const btn  = document.getElementById('btnBuildYours');
    const inner = btn?.querySelector('.btn-cfg-inner');
    if (!btn || !inner) return;

    const STRENGTH = 0.48;

    btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) * STRENGTH;
        const dy   = (e.clientY - cy) * STRENGTH;
        gsap.to(btn,   { x: dx * 0.6, y: dy * 0.6, duration: 0.4, ease: 'power2.out' });
        gsap.to(inner, { x: dx, y: dy, duration: 0.5, ease: 'power2.out' });
    });

    btn.addEventListener('mouseleave', () => {
        gsap.to([btn, inner], { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
}

// ── 6. GSAP Configurator Exit Animation ───────────────────────────────────────
function initConfiguratorExit(configuratorUrl) {
    const btn     = document.getElementById('btnBuildYours');
    const overlay = document.getElementById('cfgExit');
    const ring    = document.getElementById('cfgRing');
    if (!btn || !overlay) return;

    btn.addEventListener('click', e => {
        e.preventDefault();

        overlay.classList.add('active');

        // Ripple effect on click position
        const ripple = btn.querySelector('.btn-cfg-ripple');
        if (ripple) {
            gsap.fromTo(ripple,
                { width: 0, height: 0, opacity: 0.6 },
                { width: 300, height: 300, opacity: 0, duration: 0.7, ease: 'power2.out' }
            );
        }

        // Main exit timeline
        const tl = gsap.timeline({
            onComplete: () => {
                window.location.href = configuratorUrl;
            }
        });

        tl
          // 1. Screen fades to black (glass-wipe feel)
          .to(overlay, { opacity: 1, duration: 0.55, ease: 'power3.inOut' })

          // 2. Ring draws in
          .to(ring, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, '-=0.1')

          // 3. Subtle ring rotate
          .to('.cfg-exit-logo svg', {
              rotation: 5, scale: 1.05,
              duration: 0.8, ease: 'power1.inOut', transformOrigin: '50% 50%'
          }, '-=0.6')

          // 4. Text fades in
          .to('.cfg-exit-text', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.4')

          // 5. Hold briefly then navigate
          .to({}, { duration: 0.6 });
    });
}

// ── 7. Bootstrap ──────────────────────────────────────────────────────────────
(async function initVantageSpotlight() {
    // Pre-set cfg-exit-text opacity to 0 for animation
    const exitText = document.querySelector('.cfg-exit-text');
    if (exitText) exitText.style.opacity = '0';

    const data = await loadVantageData();

    populateText(data);
    renderSpecs(data.specs);
    renderGallery(data.images);
    initMagneticButton();
    initConfiguratorExit(data.configuratorUrl);

    console.log(
        `%c[Vantage Spotlight]%c Data loaded ${data.isFallback ? '(fallback)' : '✓ from JSON'} — Last synced: ${data.lastSynced ?? 'N/A'}`,
        'color:#00A850;font-weight:bold',
        'color:inherit'
    );
})();

