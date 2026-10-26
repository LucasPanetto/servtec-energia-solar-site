/* =====================================================================
   Métricas da landing page — Google Analytics 4 + Pixel da Meta
   ---------------------------------------------------------------------
   GA4: Admin → Fluxos de dados → Web → "ID da métrica" (G-XXXXXXXXXX).
   Pixel da Meta: Gerenciador de Eventos → Fontes de dados → ID do pixel (15–16 dígitos).
   Com os IDs vazios, nada é carregado e o aviso de cookies não aparece.
   No modo PRÉVIA (data-preview no <html>) a medição fica sempre desligada.

   Carregam assim que a página abre (pedido do Lucas, 19/10/2026). O aviso de cookies continua:
   "Recusar" desliga GA4 e Pixel dali em diante (e nas próximas visitas); "Aceitar" só fecha o aviso.

   Eventos padrão do Pixel (pedido da Servtec, 26/10/2026):
   - Contact → clique em qualquer botão/link de WhatsApp
   - Lead    → envio do formulário de orçamento (topo) e do orçamento pelo simulador
   ===================================================================== */
(() => {
  const CONFIG = {
    GA4_ID: 'G-GE0T0Q3RQ0', // propriedade "Site Servtec Energia Solar" (19/10/2026)
    META_PIXEL_ID: '2131489540735596', // Pixel da Servtec (26/10/2026)
  };
  const KEY = 'servtec-consent';
  const enabled = (CONFIG.GA4_ID || CONFIG.META_PIXEL_ID) && !document.documentElement.hasAttribute('data-preview');

  // Evento da página → evento padrão do Pixel
  const PIXEL_EVENTS = {
    whatsapp_clique: 'Contact',
    lead_enviado: 'Lead',
    simulacao_orcamento: 'Lead',
  };

  // Eventos: a página chama LPtrack('nome', {...}). Sem consentimento ou sem IDs, vira no-op.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  let active = false;
  window.LPtrack = (name, params = {}) => {
    if (!active) return false;
    if (CONFIG.GA4_ID) gtag('event', name, { ...params, transport_type: 'beacon' });
    if (CONFIG.META_PIXEL_ID && window.fbq && PIXEL_EVENTS[name]) {
      window.fbq('track', PIXEL_EVENTS[name], { content_name: name, ...(params.origem ? { origem: params.origem } : {}) });
    }
    return true;
  };
  // Tempo para o evento sair antes de a página trocar para o WhatsApp (usado pelo page.js)
  window.LPnavDelay = () => (active && CONFIG.META_PIXEL_ID ? 350 : 0);
  if (!enabled) return;

  const read = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, v); } catch (e) { /* sem armazenamento: pergunta de novo na próxima visita */ } };

  function loadGA() {
    if (active) return;
    active = true;
    if (CONFIG.GA4_ID) {
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`;
      document.head.appendChild(s);
      gtag('js', new Date());
      gtag('config', CONFIG.GA4_ID);
    }
    if (CONFIG.META_PIXEL_ID) loadPixel();
  }

  // Código base oficial do Pixel da Meta (fbevents.js) + PageView
  function loadPixel() {
    if (window.fbq) return;
    const n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    window.fbq('init', CONFIG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // ---- Aviso de cookies (só aparece enquanto a pessoa não escolheu) ----
  function banner() {
    const css = `
      .lp-consent { position: fixed; z-index: 9998; left: 16px; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px));
        max-width: 560px; margin: 0 auto; padding: 16px 18px; border-radius: 18px; background: #061638; color: #dbe3f5;
        box-shadow: 0 20px 50px -20px rgba(0,0,0,.6); font: 400 14px/1.5 Rubik, system-ui, sans-serif;
        display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
      .lp-consent p { margin: 0; flex: 1 1 260px; }
      .lp-consent div { display: flex; gap: 8px; }
      .lp-consent button { min-height: 44px; padding: 0 18px; border-radius: 999px; border: 0; font: 600 14px Outfit, system-ui, sans-serif; cursor: pointer; }
      .lp-consent .ok { background: #f5b800; color: #061638; }
      .lp-consent .no { background: transparent; color: #fff; box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); }
      .lp-consent button:focus-visible { outline: 3px solid #ffcb2e; outline-offset: 2px; }
      @media (max-width: 760px) { .lp-consent { bottom: calc(84px + env(safe-area-inset-bottom, 0px)); } }`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const el = document.createElement('div');
    el.className = 'lp-consent';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Aviso de cookies');
    el.innerHTML = '<p>Usamos cookies para medir as visitas e os resultados dos nossos anúncios e melhorar o site.</p>'
      + '<div><button type="button" class="no">Recusar</button><button type="button" class="ok">Aceitar</button></div>';
    el.querySelector('.ok').addEventListener('click', () => { save('yes'); el.remove(); });
    el.querySelector('.no').addEventListener('click', () => { save('no'); el.remove(); optOut(); });
    document.body.appendChild(el);
  }

  // Recusar: GA4 e Pixel param de coletar (bloqueios oficiais do Google e da Meta) e a página não envia mais eventos
  function optOut() {
    if (CONFIG.GA4_ID) window[`ga-disable-${CONFIG.GA4_ID}`] = true;
    if (window.fbq) window.fbq('consent', 'revoke');
    active = false;
  }

  const choice = read();
  if (choice === 'no') optOut();
  else {
    loadGA();
    if (choice !== 'yes') document.addEventListener('DOMContentLoaded', banner);
  }

  // ---- Cliques medidos sem mexer em cada botão ----
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (/wa\.me|whatsapp\.com/.test(a.href)) {
      window.LPtrack('whatsapp_clique', { botao: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 60) });
    } else if (a.classList.contains('js-to-form')) {
      window.LPtrack('cta_orcamento', { origem: a.dataset.origin || '' });
    } else if (a.href.startsWith('tel:')) {
      window.LPtrack('telefone_clique');
    } else if (a.hostname && a.hostname !== location.hostname) {
      window.LPtrack('link_externo', { destino: a.hostname });
    }
  }, true);
  document.addEventListener('play', (e) => {
    if (e.target.tagName === 'VIDEO') window.LPtrack('video_play', { video: (e.target.getAttribute('src') || '').split('/').pop().split('#')[0] });
  }, true);
})();
