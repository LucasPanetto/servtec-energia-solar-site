/* Núcleo comum das landing pages (copiado para cada pasta por sync.py).
   Expõe window.LP com utilitários usados pelos page.js. */
window.LP = (() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const year = document.getElementById('ano');
  if (year) year.textContent = new Date().getFullYear();

  // Menu mobile
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('nav--open');
      navToggle.setAttribute('aria-expanded', open);
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      navToggle.setAttribute('aria-expanded', false);
    }));
  }

  // Cascata: índice de cada filho
  document.querySelectorAll('.stagger').forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty('--i', i));
  });

  // Entrada ao rolar (também dispara callbacks registrados com LP.onVisible)
  const visibleCallbacks = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      const cb = visibleCallbacks.get(entry.target);
      if (cb) cb(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.18 });
  document.querySelectorAll('.reveal, .stagger').forEach((el) => io.observe(el));

  function onVisible(el, cb) {
    if (!el) return;
    visibleCallbacks.set(el, cb);
    io.observe(el);
  }

  // Contadores: <span data-count="43">43</span> (o HTML já traz o valor final)
  function countUp(el) {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    if (reduceMotion) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1500, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals).replace('.', ',');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  document.querySelectorAll('[data-count]').forEach((el) => onVisible(el, countUp));

  // Barra de ação do celular aparece depois do hero
  const ctaBar = document.getElementById('ctaBar');
  const hero = document.getElementById('topo');
  if (ctaBar && hero) {
    new IntersectionObserver(([e]) => ctaBar.classList.toggle('is-visible', !e.isIntersecting)).observe(hero);
  }

  const whatsapp = (number, message) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

  // "Aberto agora": hours = { 1: ['08:00','20:00'], ... } (0 = domingo)
  function openStatus(hours, now = new Date()) {
    const today = hours[now.getDay()];
    const minutes = now.getHours() * 60 + now.getMinutes();
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    if (today && minutes >= toMin(today[0]) && minutes < toMin(today[1])) {
      return { open: true, text: `Aberto agora · fecha às ${today[1].replace(':00', 'h').replace(':', 'h')}` };
    }
    for (let i = 0; i < 7; i++) {
      const d = (now.getDay() + i) % 7;
      const h = hours[d];
      if (!h) continue;
      if (i === 0 && minutes >= toMin(h[0])) continue;
      const day = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][d];
      return { open: false, text: `Fechado agora · abre ${day} às ${h[0].replace(':00', 'h').replace(':', 'h')}` };
    }
    return { open: false, text: 'Fechado' };
  }

  return { reduceMotion, onVisible, countUp, whatsapp, openStatus };
})();
