/* JanPulse — motion layer.
   Lenis for scroll feel, GSAP + ScrollTrigger for the few moments that carry meaning.
   Every effect is off under prefers-reduced-motion, and nothing here is required to read the page. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- smooth scroll (Lenis). Native scroll underneath, so anchors and a11y still work. ---- */
  if (!reduce && window.Lenis) {
    var lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.1 });
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  /* ---- hero: one entrance, top to bottom, once ---- */
  var hero = document.querySelector('.hero');
  if (hero) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.75 } });
    var bits = hero.querySelectorAll('.badge, h1, p, .hero-actions .btn, .researcher-card');
    if (bits.length) tl.from(bits, { y: 18, opacity: 0, stagger: 0.07, clearProps: 'all' });
  }

  /* ---- stats: the numbers resolve rather than sit there (ReactBits "count up", ported to vanilla) ---- */
  document.querySelectorAll('.stat-card .num').forEach(function (el) {
    var final = el.textContent.trim();
    var m = final.match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
    if (!m) return;
    var pre = m[1], raw = m[2], post = m[3];
    var target = parseFloat(raw.replace(/,/g, ''));
    if (!isFinite(target)) return;
    var dec = (raw.split('.')[1] || '').length;
    el.textContent = pre + (dec ? (0).toFixed(dec) : '0') + post;
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () {
        var o = { v: 0 };
        gsap.to(o, {
          v: target, duration: 1.5, ease: 'power2.out',
          onUpdate: function () {
            var v = dec ? o.v.toFixed(dec) : Math.round(o.v);
            el.textContent = pre + (dec ? v : Number(v).toLocaleString('en-IN')) + post;
          },
          onComplete: function () { el.textContent = final; }
        });
      }
    });
  });

  /* ---- the loop: a line that draws as the four steps are read ---- */
  var loopGrid = document.querySelector('#how .card-grid-4');
  if (loopGrid) {
    var spine = document.createElement('div');
    spine.className = 'loop-spine';
    spine.setAttribute('aria-hidden', 'true');
    loopGrid.appendChild(spine);
    gsap.fromTo(spine, { scaleX: 0 }, {
      scaleX: 1, ease: 'none', transformOrigin: 'left center',
      scrollTrigger: { trigger: loopGrid, start: 'top 78%', end: 'bottom 62%', scrub: 0.4 }
    });
    gsap.utils.toArray('#how .card').forEach(function (c) {
      gsap.from(c, {
        y: 26, opacity: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: c, start: 'top 90%', once: true }
      });
    });
  }

  /* ---- spotlight follow (ReactBits "spotlight card", ported; pointer devices only) ---- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.card-grid-4 .card, .section-dark .stat-card').forEach(function (card) {
      card.classList.add('spotlight');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      });
    });
  }
})();
