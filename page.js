// Servtec Energia Solar — comportamento da página (utilitários comuns em core.js → window.LP)
const NUMBER = '5527996307031';
const track = (name, params) => !!(window.LPtrack && window.LPtrack(name, params));

// ---------- Links de WhatsApp ----------
const ext = (a) => { a.target = '_blank'; a.rel = 'noopener noreferrer'; };
document.querySelectorAll('.js-wa').forEach((a) => {
  a.href = LP.whatsapp(NUMBER, 'Olá! Vim pelo site da Servtec e quero um orçamento de energia solar.');
  ext(a);
});
document.querySelectorAll('.js-wa-fin').forEach((a) => {
  a.href = LP.whatsapp(NUMBER, 'Olá! Vim pelo site da Servtec e quero saber sobre as opções de financiamento da energia solar.');
  ext(a);
});
document.querySelectorAll('.js-wa-camp').forEach((a) => {
  a.href = LP.whatsapp(NUMBER, 'Olá! Vim pelo site da Servtec e quero saber as condições da campanha do mês para energia solar.');
  ext(a);
});
document.querySelectorAll('.js-wa-own').forEach((a) => {
  a.href = LP.whatsapp(NUMBER, 'Olá! Vim pelo site da Servtec. Já tenho usina solar e quero falar sobre manutenção/limpeza/regularização.');
  ext(a);
});

// ---------- Formulário de qualificação → WhatsApp ----------
// Nada é gravado: as respostas viram a mensagem que abre no WhatsApp da Servtec.
const lead = document.getElementById('orcamento');
const origin = document.getElementById('leadOrigin');
const billBox = document.getElementById('leadBillBox');
const bill = document.getElementById('leadBill');
const billPhoto = document.getElementById('leadBillPhoto');
const billMode = () => (lead.querySelector('[name=conta]:checked') || {}).value;

// Gasto com luz: valor em R$, consumo em kWh ou foto da conta (enviada depois, já na conversa)
lead.querySelectorAll('[name=conta]').forEach((r) => r.addEventListener('change', () => {
  const m = billMode();
  billBox.hidden = m === 'foto';
  billPhoto.hidden = m !== 'foto';
  document.getElementById('leadBillLabel').textContent = m === 'kWh' ? 'Consumo médio' : 'Valor médio da conta';
  document.getElementById('leadBillPre').hidden = m === 'kWh';
  document.getElementById('leadBillSuf').hidden = m !== 'kWh';
  bill.placeholder = m === 'kWh' ? 'Ex.: 600' : 'Ex.: 450';
  if (m !== 'foto') bill.focus();
}));
bill.addEventListener('input', () => { bill.value = bill.value.replace(/[^\d.,]/g, ''); });

// [campo, regra, etapa]
const RULES = [
  ['leadName', () => lead.nome.value.trim().length >= 2, 1],
  ['leadAddress', () => lead.endereco.value.trim().length >= 5, 1],
  ['leadBillErr', () => !!billMode(), 1],
  ['leadBillValErr', () => billMode() === 'foto' || !billMode() || /\d/.test(bill.value), 1],
  ['leadTypeErr', () => !!lead.querySelector('[name=imovel]:checked'), 2],
  ['leadRoofErr', () => !!lead.querySelector('[name=estrutura]:checked'), 2],
  ['leadUrgErr', () => !!lead.querySelector('[name=urgencia]:checked'), 2],
];

// Formulário em 2 etapas: menos altura na tela e começa pelo mais fácil
let step = 1;
function goStep(n) {
  step = n;
  if (n === 2) track('formulario_etapa2');
  document.getElementById('leadStep1').hidden = n !== 1;
  document.getElementById('leadStep2').hidden = n !== 2;
  document.getElementById('leadBar').style.width = n === 1 ? '50%' : '100%';
  document.querySelector(`#leadStep${n} .lead__steplabel`).focus({ preventScroll: true });
  const top = lead.getBoundingClientRect().top;
  if (top < 0) lead.scrollIntoView({ behavior: LP.reduceMotion ? 'auto' : 'smooth', block: 'start' });
}
document.getElementById('leadBack').addEventListener('click', () => goStep(1));

function check(showAll, only) {
  let firstBad = null;
  RULES.forEach(([id, ok, st]) => {
    if (only && st !== only) return;
    const el = document.getElementById(id);
    const field = el.closest('.field');
    const valid = ok();
    if (!showAll && !field.classList.contains('is-error')) return;
    field.classList.toggle('is-error', !valid);
    field.querySelector('.field__err').hidden = valid;
    const input = field.querySelector('input:not([type=radio])');
    if (input) input.setAttribute('aria-invalid', String(!valid));
    if (!valid && !firstBad) firstBad = field.querySelector('input');
  });
  return firstBad;
}

lead.addEventListener('submit', (e) => {
  e.preventDefault();
  const firstBad = check(true, step);
  if (firstBad) { firstBad.focus(); return; }
  if (step === 1) { goStep(2); return; }
  const d = new FormData(lead);
  const m = billMode();
  const gasto = m === 'foto' ? 'vou enviar a foto da conta aqui na conversa.'
    : m === 'kWh' ? `consumo médio de ${bill.value.trim()} kWh/mês.`
    : `conta média de R$ ${bill.value.trim()} por mês.`;
  const msg = `Olá! Me chamo ${d.get('nome').trim()} e vim pelo site da Servtec.\n`
    + `Tenho interesse em energia solar para um imóvel ${d.get('imovel').toLowerCase()}, `
    + `com instalação em: ${d.get('estrutura').toLowerCase()}.\n`
    + `Endereço: ${d.get('endereco').trim()}\n`
    + `Conta de luz: ${gasto}\n`
    + `Prazo: ${d.get('urgencia')}`
    + (d.get('origem') ? `\n(Vim pelo botão: ${d.get('origem')})` : '');
  // Mesma aba: nova aba é bloqueada em vários navegadores (apps do Instagram/Facebook, alguns celulares)
  // e às vezes sem aviso. No celular, o link wa.me passa direto para o app do WhatsApp.
  track('lead_enviado', { formulario: 'topo', origem: d.get('origem') || 'formulario', conta: billMode() });
  const go = () => { window.location.href = LP.whatsapp(NUMBER, msg); };
  const wait = window.LPnavDelay ? window.LPnavDelay() : 0;
  wait ? setTimeout(go, wait) : go();
});
lead.addEventListener('input', () => check(false));
lead.addEventListener('change', () => check(false));

// Botões de orçamento da página levam ao formulário (e marcam de onde o cliente veio)
document.querySelectorAll('.js-to-form').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  origin.value = a.dataset.origin || '';
  if (step !== 1) goStep(1);
  lead.scrollIntoView({ behavior: LP.reduceMotion ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('leadName').focus({ preventScroll: true }), LP.reduceMotion ? 0 : 500);
}));

// ---------- Simulador solar (barra deslizante) ----------
// Premissas — conferir com a Servtec:
//  - Irradiação (GHI, kWh/m²/dia): ponto médio da tabela oficial da Servtec por zona do ES.
//  - Rendimento do sistema (PR) de 80%: perdas de inversor, cabos, temperatura e sujeira.
//  - Tabela de tarifas da Servtec (18/10/2026):
//      conta em R$ → kWh = conta ÷ valor do kWh da faixa (até 400: 1,40 | até 1.000: 1,30 | até 2.000: 1,05 | acima: 0,90);
//      consumo em kWh → conta = kWh × preço da faixa (até 400: 1,35 | até 1.000: 1,15 | até 2.000: 1,00 | acima: 0,92).
//  - Economia (regra da Servtec, áudio de 17/10/2026): 90% da conta − R$ 120 da taxa mínima da EDP (valor confirmado pelo cliente).
//    Ex.: conta de R$ 400 → 360 − 120 = R$ 240/mês; R$ 1.000 → 900 − 120 = R$ 780/mês. Por isso a barra começa em R$ 250 (ou 250 kWh).
//    5 anos = economia mensal × 60, sem reajuste de tarifa (conservador).
const SIM = {
  zones: {
    1: { name: 'Norte e Noroeste', ghi: 5.35 },
    2: { name: 'Sul e Litoral Sul', ghi: 5.05 },
    3: { name: 'Metropolitana e Litoral Centro', ghi: 4.85 },
    4: { name: 'Serrana', ghi: 4.35 },
    5: { name: 'Caparaó e Sudoeste', ghi: 4.6 },
  },
  pr: 0.8,
  // [limite da faixa, valor] — a primeira faixa cujo limite comporta o valor é a usada
  tarifaPorConta: [[400, 1.40], [1000, 1.30], [2000, 1.05], [Infinity, 0.90]],
  precoPorKwh: [[400, 1.35], [1000, 1.15], [2000, 1.00], [Infinity, 0.92]],
  maxSave: 0.9,
  taxaMin: 120,
  minConta: 250,
  panelWp: 620,
};
const simRange = document.getElementById('simRange');
const simValue = document.getElementById('simValue');
const simZone = document.getElementById('simZone');
const fmt = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const faixa = (tabela, v) => tabela.find(([lim]) => v <= lim)[1];
const simMode = () => document.querySelector('[name=simMode]:checked').value;
let sim = {};

function simulate() {
  const v = Math.max(0, parseInt(simValue.value.replace(/\D/g, ''), 10) || 0);
  const rs = simMode() === 'rs';
  const kwh = rs ? v / faixa(SIM.tarifaPorConta, v) : v;
  const conta = rs ? v : v * faixa(SIM.precoPorKwh, v);
  const z = SIM.zones[simZone.value];
  const perKwp = z.ghi * 30 * SIM.pr; // kWh/mês gerados por 1 kWp
  const panels = Math.max(1, Math.ceil((kwh / perKwp) * 1000 / SIM.panelWp));
  const kwp = panels * SIM.panelWp / 1000;
  const gen = kwp * perKwp;
  const saveM = Math.max(0, conta * SIM.maxSave - SIM.taxaMin);
  sim = { v, kwh, conta, kwp, panels, gen, zone: z.name, saveM };
  document.getElementById('simKwp').textContent = `~${fmt(kwp, 1)}`;
  document.getElementById('simPanels').textContent = panels;
  document.getElementById('simGen').textContent = `~${fmt(Math.round(sim.gen / 10) * 10)} kWh/mês`;
  document.getElementById('simCons').textContent = `${fmt(Math.round(kwh))} kWh/mês`;
  document.getElementById('simSave').textContent = `~R$ ${fmt(Math.round(saveM))}`;
  document.getElementById('simSave5').textContent = `~R$ ${fmt(Math.round(saveM * 60 / 100) * 100)}`;
  const pct = (Math.min(Math.max(v, simRange.min), simRange.max) - simRange.min) / (simRange.max - simRange.min) * 100;
  simRange.style.setProperty('--fill', `${pct}%`);
}
let simUsed = false;
const simTouched = () => { if (!simUsed) simUsed = track('simulacao_usada'); };
simRange.addEventListener('input', () => { simValue.value = simRange.value; simulate(); simTouched(); });
simValue.addEventListener('input', () => {
  simValue.value = simValue.value.replace(/\D/g, '').slice(0, 6);
  if (simValue.value) simRange.value = simValue.value;
  simulate();
});
simValue.addEventListener('change', () => {
  if ((parseInt(simValue.value, 10) || 0) < SIM.minConta) { simValue.value = SIM.minConta; simRange.value = SIM.minConta; simulate(); }
});
simZone.addEventListener('change', () => { simulate(); simTouched(); });
document.querySelectorAll('[name=simMode]').forEach((r) => r.addEventListener('change', () => {
  const rs = simMode() === 'rs';
  document.getElementById('simPre').hidden = !rs;
  document.getElementById('simSuf').hidden = rs;
  document.getElementById('simLabel').textContent = rs ? 'Quanto você paga de luz por mês?' : 'Quanto você consome por mês?';
  document.getElementById('simMin').textContent = rs ? 'R$ 250' : '250 kWh';
  document.getElementById('simMax').textContent = rs ? 'R$ 5.000+' : '5.000+ kWh';
  simulate();
}));
simulate();

// ---------- Pedido de orçamento com a simulação ----------
const simModal = document.getElementById('simModal');
const simForm = document.getElementById('simForm');
const simConta = () => (simMode() === 'rs' ? `conta de R$ ${fmt(sim.v)}/mês` : `consumo de ${fmt(sim.v)} kWh/mês`);
document.getElementById('simCta').addEventListener('click', () => {
  track('simulacao_abriu_orcamento', { kwp: Number(sim.kwp.toFixed(1)) });
  document.getElementById('smKwp').textContent = `~${fmt(sim.kwp, 1)}`;
  document.getElementById('smSummary').textContent = `${sim.panels} placas · ${simConta()} · ${sim.zone}`;
  simModal.showModal();
  document.getElementById('sfName').focus();
});
document.getElementById('smClose').addEventListener('click', () => simModal.close());
simModal.addEventListener('click', (e) => { if (e.target === simModal) simModal.close(); });

const SIM_RULES = [
  ['sfName', () => simForm.nome.value.trim().length >= 2],
  ['sfAddress', () => simForm.endereco.value.trim().length >= 5],
  ['sfRoofErr', () => !!simForm.querySelector('[name=estrutura]:checked')],
];
function checkSim(showAll) {
  let firstBad = null;
  SIM_RULES.forEach(([id, ok]) => {
    const field = document.getElementById(id).closest('.field');
    const valid = ok();
    if (!showAll && !field.classList.contains('is-error')) return;
    field.classList.toggle('is-error', !valid);
    field.querySelector('.field__err').hidden = valid;
    if (!valid && !firstBad) firstBad = field.querySelector('input');
  });
  return firstBad;
}
simForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const firstBad = checkSim(true);
  if (firstBad) { firstBad.focus(); return; }
  const d = new FormData(simForm);
  const msg = `Olá! Me chamo ${d.get('nome').trim()} e fiz a simulação no site da Servtec.\n`
    + `Simulação: ${simConta()}, região ${sim.zone}.\n`
    + `Sistema sugerido: ~${fmt(sim.kwp, 1)} kWp (${sim.panels} placas de ${SIM.panelWp} Wp).\n`
    + `Economia estimada: ~R$ ${fmt(Math.round(sim.saveM))}/mês.\n`
    + `Endereço: ${d.get('endereco').trim()}\n`
    + `Instalação em: ${d.get('estrutura').toLowerCase()}.\n`
    + 'Quero o orçamento exato.';
  track('simulacao_orcamento', { kwp: Number(sim.kwp.toFixed(1)), regiao: sim.zone, modo: simMode() });
  const go = () => { window.location.href = LP.whatsapp(NUMBER, msg); };
  const wait = window.LPnavDelay ? window.LPnavDelay() : 0;
  wait ? setTimeout(go, wait) : go();
});
simForm.addEventListener('input', () => checkSim(false));
simForm.addEventListener('change', () => checkSim(false));

// ---------- Avaliações: trilho com setas ----------
const rTrack = document.getElementById('rcards');
const rPrev = document.getElementById('rPrev');
const rNext = document.getElementById('rNext');
const rStep = () => rTrack.querySelector('.rcard').getBoundingClientRect().width + 18;
rPrev.addEventListener('click', () => rTrack.scrollBy({ left: -rStep(), behavior: LP.reduceMotion ? 'auto' : 'smooth' }));
rNext.addEventListener('click', () => rTrack.scrollBy({ left: rStep(), behavior: LP.reduceMotion ? 'auto' : 'smooth' }));
function rArrows() {
  rPrev.disabled = rTrack.scrollLeft < 8;
  rNext.disabled = rTrack.scrollLeft + rTrack.clientWidth > rTrack.scrollWidth - 8;
}
rTrack.addEventListener('scroll', rArrows, { passive: true });
window.addEventListener('resize', rArrows);
rArrows();
// Textos longos ficam com o mesmo tamanho dos outros, com "Ler mais"
document.querySelectorAll('.rcard p').forEach((p) => {
  if (p.scrollHeight <= p.clientHeight + 2) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'rcard__more';
  b.textContent = 'Ler mais';
  b.addEventListener('click', () => { const open = p.classList.toggle('is-open'); b.textContent = open ? 'Ler menos' : 'Ler mais'; });
  p.after(b);
});
