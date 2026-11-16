/* Sistema de agendamento para salões: app da cliente + painel do salão.
   A marca (nome, logo, cores, contato) vem de marca.js. Ver README.md e CLAUDE.md. */
"use strict";
const LOGO = MARCA.logo;
const SALAO = MARCA.salao;
const MODO = window.FAV_MODO || "demo";   /* "cliente", "salao" ou "demo" (os dois, com o botão Ver como) */
const fmt = v => "R$ " + v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const fmt0 = v => fmt(v).replace(",00", "");
const dur = m => m >= 60 ? (Math.floor(m / 60) + "h" + (m % 60 ? String(m % 60).padStart(2, "0") : "")) : m + " min";
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hhmm = (d = new Date()) => String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const dayKey = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const dOf = k => new Date(k + "T12:00");
const dayLabel = k => { const d = dOf(k); return WD[d.getDay()] + ", " + String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); };
const dayShort = k => { const d = dOf(k); return WD[d.getDay()] + ", " + d.getDate() + " " + MES[d.getMonth()].slice(0, 3); };
const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);
const toHM = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
const HOJE = dayKey(new Date());
const addDays = (k, n) => { const d = dOf(k); d.setDate(d.getDate() + n); return dayKey(d); };

/* ===== dados de exemplo (trocar pelos reais do salão) ===== */
let CATS = ["Cabelo", "Unhas", "Sobrancelha e cílios", "Estética"];
const SERVICES = [
  { id: 1, cat: "Cabelo", nome: "Corte feminino", desc: "Lavagem, corte e finalização", min: 60, preco: 80 },
  { id: 2, cat: "Cabelo", nome: "Escova", desc: "Escova modelada com finalização", min: 45, preco: 50 },
  { id: 3, cat: "Cabelo", nome: "Hidratação", desc: "Máscara de tratamento e escova", min: 60, preco: 70 },
  { id: 4, cat: "Cabelo", nome: "Selagem", desc: "Redução de volume e frizz", min: 150, preco: 220, opcoes: [{ nome: "curto", preco: 180, min: 120 }, { nome: "médio", preco: 220, min: 150 }, { nome: "longo", preco: 280, min: 180 }] },
  { id: 5, cat: "Cabelo", nome: "Coloração", desc: "Tintura da raiz às pontas", min: 120, preco: 180 },
  { id: 13, cat: "Cabelo", nome: "Corte", desc: "Só o corte, sem finalização", min: 30, preco: 45 },
  { id: 6, cat: "Unhas", nome: "Manicure", desc: "Cutícula e esmaltação", min: 45, preco: 30 },
  { id: 7, cat: "Unhas", nome: "Pedicure", desc: "Cutícula, lixa e esmaltação", min: 45, preco: 35 },
  { id: 8, cat: "Unhas", nome: "Unha em gel", desc: "Alongamento com gel", min: 120, preco: 150 },
  { id: 9, cat: "Sobrancelha e cílios", nome: "Design de sobrancelha", desc: "Medição, pinça e acabamento", min: 30, preco: 40 },
  { id: 10, cat: "Sobrancelha e cílios", nome: "Design com henna", desc: "Design e henna para preencher", min: 45, preco: 55 },
  { id: 11, cat: "Estética", nome: "Limpeza de pele", desc: "Extração, máscara e hidratação", min: 60, preco: 110 },
  { id: 12, cat: "Estética", nome: "Maquiagem", desc: "Maquiagem para evento", min: 60, preco: 120 }
].map(s => ({ disp: "disponivel", foto: "", opcoes: [], ...s }));
const CORES = ["#C99A87", "#8FA58C", "#C9A86A", "#A8909F", "#8E9DB0", "#B9876F"];
const PROS = [
  { id: "ana", nome: "Ana", faz: "Corte, coloração e selagem", cats: ["Cabelo"], ini: "09:00", fim: "18:00", cor: "#C99A87" },
  { id: "bia", nome: "Bia", faz: "Manicure, pedicure e gel", cats: ["Unhas"], ini: "08:00", fim: "17:00", cor: "#A8909F" },
  { id: "carla", nome: "Carla", faz: "Sobrancelha e estética", cats: ["Sobrancelha e cílios", "Estética"], ini: "09:00", fim: "18:00", cor: "#C9A86A" },
  { id: "duda", nome: "Duda", faz: "Cabelo e unhas", cats: ["Cabelo", "Unhas"], ini: "10:00", fim: "19:00", cor: "#8FA58C" }
].map(p => ({ foto: "", ...p }));

/* primeiro dia de atendimento: hoje, ou amanhã se o expediente já acabou; domingo fechado */
const D0 = (() => { const d = new Date(); if (d.getHours() >= 18) d.setDate(d.getDate() + 1); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return dayKey(d); })();
const D1 = (() => { let k = addDays(D0, 1); if (dOf(k).getDay() === 0) k = addDays(k, 1); return k; })();
const HORIZONTE = addDays(D0, 27);
const aberto = k => dOf(k).getDay() !== 0 && k >= D0 && k <= HORIZONTE;

let seq = 100;
const S = {
  as: MODO === "salao" ? "salao" : "cliente", view: "catalogo", tab: "pedidos", detail: null, zoom: null, sheet: null,
  cat: "Cabelo", cart: [], pro: "qualquer", day: D0, time: null, turno: "manha", week: 0, obs: "",
  pay: "pix", payIn: "cartao", pixFor: null, meusTab: "prox",
  perfil: { nome: "", fone: "", end: "", foto: "" },
  aDay: D0, aPro: "todas", finDay: HOJE, finF: "todos", caixas: {},
  bookings: [
    { id: 1, nome: "Mariana Costa", fone: "(94) 99111-2233", end: "Rua das Flores, 210, Centro", foto: "", itens: ["4:1"], pro: "ana", day: D0, time: "10:00", obs: "Cabelo muito seco e fino nas pontas. Quero tirar o volume sem perder o movimento.", pay: "pix", paid: true, status: "aguardando", ex: true,
      hist: [["09:12", "Cliente", "Pedido criado"], ["09:13", "Sistema", "Pix confirmado pelo Mercado Pago"]] },
    { id: 2, nome: "Juliana Alves", fone: "(94) 99222-3344", end: "Av. Brasil, 88, Jardim Paraíso", foto: "", itens: [9, 10], pro: "carla", day: D1, time: "14:00", obs: "", pay: "salao", payIn: "dinheiro", paid: false, status: "aguardando", ex: true,
      hist: [["10:40", "Cliente", "Pedido criado"]] },
    { id: 3, nome: "Renata Lima", fone: "(94) 99333-4455", end: "Rua Bahia, 122, Novo Horizonte", foto: "", itens: [9], pro: "carla", day: D0, time: "14:00", obs: "", pay: "salao", payIn: "cartao", paid: false, status: "aprovado", ex: true,
      hist: [["08:02", "Cliente", "Pedido criado"], ["08:20", "Dona", "Aprovou o agendamento"]] },
    { id: 4, nome: "Paula Reis", fone: "(94) 99444-5566", end: "", foto: "", itens: [1], pro: "duda", day: D0, time: "15:00", obs: "Só pontas.", pay: "salao", payIn: "dinheiro", paid: false, status: "aprovado", ex: true,
      hist: [["Ontem", "Cliente", "Pedido criado"], ["Ontem", "Dona", "Aprovou o agendamento"]] }
  ],
  lanc: [
    { id: 1, forma: "cartao", valor: 80, nome: "Paula Reis", itens: [1], at: "10:40", day: HOJE, ex: true },
    { id: 2, forma: "dinheiro", valor: 65, nome: "Juliana Alves", itens: [9, 10], at: "11:05", day: HOJE, ex: true },
    { id: 3, forma: "cartao", valor: 45, nome: "Renata Lima", itens: [9], at: "13:20", day: HOJE, ex: true },
    { id: 4, forma: "dinheiro", valor: 25, nome: "Carol Mendes", itens: [6], at: "14:10", day: HOJE, ex: true }
  ]
};

const svc = id => SERVICES.find(s => s.id === id && s.disp !== "arquivado") || SERVICES.find(s => s.id === id);
const pro = id => PROS.find(p => p.id === id) || { id, nome: "Profissional removida", faz: "", cats: [], ini: "00:00", fim: "00:00", foto: "", cor: "#BDB3AA" };
const bk = id => S.bookings.find(b => b.id === id);
/* item da sacola = "id" ou "id:opção" (ex.: "4:2" = Selagem longo) */
function it(k) {
  const [i, o] = String(k).split(":"), s = svc(+i);
  if (!s) return { sid: +i, nome: "Serviço removido", base: "Serviço removido", op: "", preco: 0, min: 0, cat: "" };
  if (o == null || !s.opcoes[+o]) return { sid: s.id, nome: s.nome, base: s.nome, op: "", preco: s.preco, min: s.min, cat: s.cat };
  const v = s.opcoes[+o];
  return { sid: s.id, nome: s.nome + " (" + v.nome + ")", base: s.nome, op: v.nome, preco: v.preco, min: v.min, cat: s.cat };
}
const sum = ks => ks.reduce((a, k) => a + it(k).preco, 0);
const mins = ks => ks.reduce((a, k) => a + it(k).min, 0);
const nomes = ks => ks.map(k => it(k).base).join(" + ");
const prosFor = ks => PROS.filter(p => ks.every(k => p.cats.includes(it(k).cat)));
const desde = s => s.opcoes.length ? Math.min(...s.opcoes.map(o => o.preco)) : s.preco;
const minDur = s => s.opcoes.length ? Math.min(...s.opcoes.map(o => o.min)) : s.min;
const skills = p => SERVICES.filter(s => p.cats.includes(s.cat) && s.disp === "disponivel").map(s => s.nome.split(" ")[0]).filter((v, i, a) => a.indexOf(v) === i);
const pending = () => S.bookings.filter(b => b.status === "aguardando").length;
const ini = n => (n || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
const fotoDe = b => (b.mine && S.perfil.foto) || b.foto;
const ava = (foto, nome, size, extra = "") => `<span class="ava ${size} ${extra}">${foto ? `<img src="${foto}" alt="">` : esc(ini(nome))}</span>`;
const payWord = b => b.pay === "pix" ? "pix" : (b.payIn === "dinheiro" ? "dinheiro" : "cartão");

function slotsFor(proId, dk, need) {
  const p = pro(proId), out = [];
  if (!aberto(dk)) return out;
  const busy = S.bookings.filter(b => b.pro === proId && b.day === dk && b.status !== "reprovado" && b.status !== "pix")
    .map(b => [toMin(b.time), toMin(b.time) + mins(b.itens)]);
  const now = new Date(), isToday = dk === HOJE;
  for (let t = toMin(p.ini); t + need <= toMin(p.fim); t += 30) {
    const clash = busy.some(([a, z]) => t < z && t + need > a);
    const past = isToday && t <= now.getHours() * 60 + now.getMinutes();
    out.push({ t: toHM(t), free: !clash && !past, pro: proId });
  }
  return out;
}
function slotsAny(dk, need) {
  const all = {};
  prosFor(S.cart).forEach(p => slotsFor(p.id, dk, need).forEach(s => { if (s.free) all[s.t] = all[s.t] || p.id; else if (!(s.t in all)) all[s.t] = null; }));
  return Object.keys(all).sort().map(t => ({ t, free: !!all[t], pro: all[t] }));
}
const slots = dk => { const need = mins(S.cart); return S.pro === "qualquer" ? slotsAny(dk, need) : slotsFor(S.pro, dk, need); };

/* comprovante do Pix: no sistema real sai dos dados do pagamento no Mercado Pago */
function receipt(b) {
  if (b.receipt) return b.receipt;
  const c = document.createElement("canvas"); c.width = 600; c.height = 940;
  const x = c.getContext("2d");
  x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, 600, 940);
  x.fillStyle = "#009EE3"; x.fillRect(0, 0, 600, 96);
  x.fillStyle = "#FFFFFF"; x.font = "bold 30px Montserrat, Arial"; x.fillText("Comprovante de Pix", 36, 60);
  x.fillStyle = "#555"; x.font = "500 22px Montserrat, Arial"; x.fillText("Valor", 36, 150);
  x.fillStyle = "#111"; x.font = "bold 54px Montserrat, Arial"; x.fillText(fmt(sum(b.itens)), 36, 212);
  const pago = (b.hist.find(h => h[2].startsWith("Pix confirmado")) || ["--"])[0];
  const rows = [["Data", dayLabel(HOJE) + " · " + pago], ["De", b.nome], ["CPF", "***.482.***-**"], ["Para", MARCA.nomeCompleto], ["Instituição", "Mercado Pago"], ["Tipo", "Pix"], ["ID da transação", "E1835200" + (20261113000 + b.id) + "x7k"]];
  let y = 290;
  rows.forEach(([k, v]) => { x.fillStyle = "#777"; x.font = "500 20px Montserrat, Arial"; x.fillText(k, 36, y); x.fillStyle = "#111"; x.font = "600 23px Montserrat, Arial"; x.fillText(v, 36, y + 32); x.fillStyle = "#EEE"; x.fillRect(36, y + 52, 528, 2); y += 84; });
  x.fillStyle = "#B5453A"; x.font = "bold 20px Montserrat, Arial"; x.fillText("EXEMPLO · protótipo", 36, 905);
  b.receipt = c.toDataURL("image/png");
  return b.receipt;
}

/* ===== ícones (traço 1.8, estilo Lucide) ===== */
const sv = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  bag: sv('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
  cal: sv('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  user: sv('<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>'),
  inbox: sv('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>'),
  wallet: sv('<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'),
  list: sv('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  users: sv('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  lock: sv('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  back: sv('<path d="m15 18-6-6 6-6"/>'),
  card: sv('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
  check: sv('<path d="M20 6 9 17l-5-5"/>')
};
function tabs(items, cur) {
  return `<nav class="tabs"><div class="in" style="--n:${items.length}">${items.map(([k, label, ic, cnt]) => `<button type="button" data-tab="${k}" ${k === cur ? 'aria-current="page"' : ""}>${IC[ic]}${label}${cnt ? `<span class="count">${cnt}</span>` : ""}</button>`).join("")}</div></nav>`;
}
const navBack = (go, title, right = "") => `<div class="nav"><button class="circ" type="button" ${go} aria-label="Voltar">${IC.back}</button><h2>${title}</h2>${right}</div>`;
function stepper(n) {
  const st = (i, label) => `<span class="st ${i < n ? "done" : i === n ? "cur" : ""}"><i>${i < n ? "✓" : i}</i>${label}</span>`;
  return `<div class="steps">${st(1, "Serviços")}<hr class="${n > 1 ? "done" : ""}">${st(2, "Horário")}<hr class="${n > 2 ? "done" : ""}">${st(3, "Confirmar")}</div>`;
}

/* ===== APP DA CLIENTE ===== */
function vCatalogo() {
  if (!CATS.includes(S.cat)) S.cat = CATS[0];
  const list = SERVICES.filter(s => (s.disp === "disponivel" || s.disp === "pausado") && s.cat === S.cat).sort((a, b) => a.disp.localeCompare(b.disp));
  const P = S.perfil, nome = P.nome ? P.nome.split(" ")[0] : "";
  return `<section class="view">
    <div class="top"><img src="${LOGO}" alt="${esc(MARCA.nomeCompleto)}"><button class="ava me ring" type="button" data-tab="perfil" aria-label="Meu perfil">${P.foto ? `<img src="${P.foto}" alt="">` : esc(ini(P.nome || "?"))}</button></div>
    <div class="pad-x" style="margin-top:6px"><p class="muted" style="font-size:14px">${nome ? "Olá, " + esc(nome) : "Olá! Seja bem-vinda"}</p><h1 style="margin-top:2px">O que vamos fazer hoje?</h1></div>
    <div class="chips" role="group" aria-label="Categorias">${CATS.map(c => `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="${c === S.cat}">${esc(c)}</button>`).join("")}</div>
    <div class="row pad-x" style="margin-top:4px"><span class="eyebrow">${esc(S.cat)}</span><span class="meta">${list.length} ${list.length === 1 ? "serviço" : "serviços"}</span></div>
    ${list.length ? list.map(s => {
      const k = S.cart.find(x => it(x).sid === s.id), on = !!k, off = s.disp === "pausado", I = on ? it(k) : null;
      return `<button class="card scard ${on ? "on" : ""}" type="button" data-svc="${s.id}" aria-pressed="${on}" ${off ? "disabled" : ""}>
        <div style="min-width:0"><h3>${esc(s.nome)}${on && I.op ? `<span class="optag">${esc(I.op)}</span>` : ""}${off ? `<span class="tag-off">Indisponível hoje</span>` : ""}</h3><p>${esc(s.desc)}</p>
          <div class="smeta"><span class="ttag">${on ? dur(I.min) : (s.opcoes.length ? "a partir de " + dur(minDur(s)) : dur(s.min))}</span><b>${on ? fmt(I.preco) : (s.opcoes.length ? "a partir de " + fmt(desde(s)) : fmt(s.preco))}</b></div></div>
        <span class="addc" aria-hidden="true">${on ? "✓" : "+"}</span></button>`;
    }).join("") : `<div class="empty">Nenhum serviço nesta categoria por enquanto.</div>`}
    <p class="meta pad-x">Serviços, preços e profissionais de exemplo <span class="tag-ex">Exemplo</span></p>
  </section>`;
}
function fCatalogo() {
  if (!S.cart.length) return "";
  const n = S.cart.length;
  return `<div class="float"><div class="float-in"><span class="bagic">${IC.bag}<span>${n}</span></span><div><small>${n} ${n > 1 ? "serviços" : "serviço"} · ${dur(mins(S.cart))}</small><b>${fmt(sum(S.cart))}</b></div><button class="btn-w" type="button" id="go-agendar">Escolher horário</button></div></div>`;
}

function weekDays(w) {
  const start = dOf(D0); start.setDate(start.getDate() + 7 * w);   /* 7 dias a partir do primeiro dia disponível */
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return dayKey(d); });
}
function vAgendar() {
  const cands = prosFor(S.cart), need = mins(S.cart);
  if (S.pro !== "qualquer" && !cands.find(p => p.id === S.pro)) S.pro = "qualquer";
  const dias = weekDays(S.week), mes = MES[dOf(dias.find(aberto) || dias[3]).getMonth()];
  const sl = slots(S.day).filter(s => S.turno === "manha" ? toMin(s.t) < 720 : toMin(s.t) >= 720);
  return `<section class="view">
    ${navBack('data-go="catalogo"', "Agendar horário")}
    ${stepper(2)}
    <div class="strip">${IC.bag}<span><b>${esc(nomes(S.cart))}</b> · ${dur(need)}</span><button class="link" type="button" data-go="catalogo">Editar</button></div>
    <div class="card sec"><span class="eyebrow">Profissional</span>
      ${cands.length ? `<div class="hs" role="group" aria-label="Profissional">
        <button class="pcard" type="button" data-pro="qualquer" aria-pressed="${S.pro === "qualquer"}"><span class="ck">✓</span><span class="anyico">✦</span><b>Qualquer uma</b><span class="meta">1ª livre</span><div class="skills"><span class="n">Mais rápido</span></div></button>
        ${cands.map(p => `<button class="pcard" type="button" data-pro="${p.id}" aria-pressed="${S.pro === p.id}"><span class="ck">✓</span>${ava(p.foto, p.nome, "lg")}<b>${esc(p.nome)}</b><span class="hr">${p.ini.slice(0, 2)}h–${p.fim.slice(0, 2)}h</span><div class="skills">${skills(p).slice(0, 3).map(x => `<span>${esc(x)}</span>`).join("")}</div></button>`).join("")}
      </div>` : `<div class="empty">Nenhuma profissional faz todos esses serviços juntos. Separe em dois agendamentos.</div>`}
    </div>
    <div class="card sec"><div class="row"><span class="eyebrow">Dia</span><div class="monthnav"><button type="button" data-wk="-1" ${S.week <= 0 ? "disabled" : ""} aria-label="Semana anterior">‹</button>${mes[0].toUpperCase() + mes.slice(1)}<button type="button" data-wk="1" ${S.week >= 3 ? "disabled" : ""} aria-label="Próxima semana">›</button></div></div>
      <div class="week" role="group">${dias.map(k => { const d = dOf(k), ok = aberto(k), tem = ok && cands.length && slots(k).some(s => s.free);
        return `<button class="wd" type="button" data-day="${k}" ${ok ? "" : "disabled"} aria-pressed="${k === S.day}">${WD[d.getDay()]}<b>${d.getDate()}</b><i class="${tem ? "on" : ""}"></i></button>`; }).join("")}</div>
    </div>
    <div class="card sec"><div class="row"><span class="eyebrow">Horário</span><div class="segm mini" role="group"><button type="button" data-turno="manha" aria-pressed="${S.turno === "manha"}">Manhã</button><button type="button" data-turno="tarde" aria-pressed="${S.turno === "tarde"}">Tarde</button></div></div>
      ${cands.length ? (sl.some(s => s.free) ? `<div class="times" role="group">${sl.map(s => `<button class="time" type="button" data-time="${s.t}" ${s.free ? "" : "disabled"} aria-pressed="${S.time === s.t}">${s.t}</button>`).join("")}</div>` : `<div class="empty" style="padding:18px">Sem horário livre ${S.turno === "manha" ? "de manhã" : "à tarde"} nesse dia. Tente o outro turno ou outro dia.</div>`) : ""}
    </div>
  </section>`;
}
function quemNoHorario() {
  if (S.pro !== "qualquer") return S.pro;
  return (slotsAny(S.day, mins(S.cart)).find(s => s.t === S.time) || {}).pro || (prosFor(S.cart)[0] || {}).id;
}
function bAgendar() {
  const q = S.time ? pro(quemNoHorario()).nome : "";
  return `<div class="bar"><div class="bar-in"><div><small>${S.time ? dayLabel(S.day) + " · " + S.time + " · " + esc(q) : "Escolha dia e horário"}</small><b>${fmt(sum(S.cart))}</b></div>
  <button class="btn" type="button" id="go-pagar" ${S.time ? "" : "disabled"}>Continuar →</button></div></div>`;
}

function vPagar() {
  const P = S.perfil, ok = P.nome && P.fone, d = dOf(S.day), q = pro(quemNoHorario());
  return `<section class="view">
    ${navBack('data-go="agendar"', "Confirmar")}
    ${stepper(3)}
    <div class="card rcard"><div class="rhead"><span class="dblock"><small>${WD[d.getDay()]}</small><b>${d.getDate()}</b></span><span class="hh"><b>${S.time} às ${toHM(toMin(S.time) + mins(S.cart))}</b><span>com ${esc(S.pro === "qualquer" ? q.nome + " (1ª livre)" : q.nome)} · ${MES[d.getMonth()]}</span></span></div>
      <div class="rbody">${S.cart.map(k => { const I = it(k); return `<div class="kv"><span>${esc(I.base)}${I.op ? ` <span class="muted">· ${esc(I.op)}</span>` : ""}</span><span>${fmt(I.preco)}</span></div>`; }).join("")}
        <div class="kv total"><span>Total</span><span>${fmt(sum(S.cart))}</span></div></div></div>
    <div class="card sec"><span class="eyebrow" style="display:flex;align-items:center;gap:8px"><span style="width:16px;height:16px;display:inline-grid">${IC.card}</span>Pagamento</span>
      <button class="payopt" type="button" data-pay="pix" aria-pressed="${S.pay === "pix"}"><span class="pixtile"><i></i></span><span><h3>Pix agora</h3><p>Devolvido se não aprovar</p></span><span class="radio"></span></button>
      <button class="payopt" type="button" data-pay="salao" aria-pressed="${S.pay === "salao"}"><span class="minicard"></span><span><h3>No salão</h3><p>Cartão de crédito ou dinheiro</p></span><span class="radio"></span></button>
      ${S.pay === "salao" ? `<div class="payin" role="group" aria-label="Como vai pagar no salão"><button class="chip" type="button" data-payin="cartao" aria-pressed="${S.payIn === "cartao"}">Cartão de crédito</button><button class="chip" type="button" data-payin="dinheiro" aria-pressed="${S.payIn === "dinheiro"}">Dinheiro</button></div>` : ""}
    </div>
    ${ok ? `<div class="card row" style="justify-content:flex-start;padding:12px 16px">${ava(P.foto, P.nome, "sm")}<div style="flex:1;min-width:0"><h3 style="font-size:14px">${esc(P.nome)}</h3><p class="meta">${esc(P.fone)}</p></div><button class="link" type="button" data-tab="perfil">Editar</button></div>`
      : `<div class="card sec"><span class="eyebrow">Seus dados</span>
          <label class="field">Nome completo<input type="text" id="f-nome" autocomplete="name" value="${esc(S.fNome || "")}" placeholder="Como está no seu documento"></label>
          <label class="field">WhatsApp<input type="tel" id="f-fone" autocomplete="tel" value="${esc(S.fFone || "")}" placeholder="(94) 9 0000-0000"></label>
          <p class="meta">Fica salvo no seu perfil para as próximas vezes.</p></div>`}
    <label class="card field obsbox">Observação (opcional)<textarea id="f-obs" placeholder="Ex.: tenho alergia a amônia">${esc(S.obs)}</textarea></label>
  </section>`;
}
function bPagar() {
  return `<div class="bar"><div class="bar-col"><button class="btn full" type="button" id="enviar">${S.pay === "pix" ? "Pagar " + fmt(sum(S.cart)) + " com Pix" : "Enviar pedido"}</button><small>O salão confirma seu horário em seguida</small></div></div>`;
}

function vPix() {
  const b = bk(S.pixFor);
  const code = "00020126580014BR.GOV.BCB.PIX0136salao-exemplo-" + b.id + "5204000053039865406" + sum(b.itens).toFixed(2) + "5802BR5907EXEMPLO6006CIDADE62070503***6304EX" + b.id;
  return `<section class="view">
    ${navBack('data-tab="meus"', "Pagamento Pix")}
    <div class="card sec" style="align-items:center;text-align:center;gap:14px">
      <span class="pixtile" style="width:52px;height:52px"><i></i></span>
      <div><p class="meta">Pague para enviar seu pedido ao salão</p><p style="font-size:28px;font-weight:700;letter-spacing:-.02em">${fmt(sum(b.itens))}</p></div>
      <div class="qr"><canvas id="qr" width="29" height="29" aria-label="QR Code do Pix (exemplo)"></canvas></div>
      <div class="waiting"><span class="spin"></span>Aguardando o pagamento</div>
    </div>
    <div class="card sec"><span class="eyebrow">Pix copia e cola</span><div class="code" id="pix-code">${code}</div><button class="btn ghost full" type="button" id="copiar">Copiar código</button></div>
    <div class="card sec flat"><p class="meta">Protótipo: no sistema de verdade o Mercado Pago avisa o servidor quando o Pix cai e esta tela muda sozinha. Aqui, simule:</p><button class="btn full" style="background:var(--ok)" type="button" id="simular-pix">Simular Pix pago</button></div>
  </section>`;
}

function statusPill(b) {
  if (b.status === "pix") return `<span class="pill warn dotted">Aguardando Pix</span>`;
  if (b.status === "aguardando") return `<span class="pill warn dotted">Aguardando salão</span>`;
  if (b.status === "aprovado") return `<span class="pill ok dotted">Confirmado</span>`;
  return `<span class="pill bad dotted">Não aprovado</span>`;
}
function payText(b) {
  if (b.pay === "pix") return b.refund ? "Pix devolvido" : (b.paid ? "Pix pago" : "Pix pendente");
  return "No salão · " + (b.payIn === "dinheiro" ? "dinheiro" : "cartão");
}
function vMeus() {
  const mine = S.bookings.filter(b => b.mine);
  const prox = mine.filter(b => b.day >= HOJE).sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
  const hist = mine.filter(b => b.day < HOJE);
  const list = S.meusTab === "prox" ? prox : hist;
  const wa = "https://wa.me/55" + SALAO.fone;
  return `<section class="view">
    <h1 class="pad-x" style="margin-top:12px">Meus horários</h1>
    <div class="segm" role="group"><button type="button" data-meus="prox" aria-pressed="${S.meusTab === "prox"}">Próximos · ${prox.length}</button><button type="button" data-meus="hist" aria-pressed="${S.meusTab === "hist"}">Histórico</button></div>
    ${list.length ? list.map(b => {
      const d = dOf(b.day), p = pro(b.pro), off = b.status === "reprovado";
      return `<article class="card bcard"><div class="row">${statusPill(b)}<span class="meta">${payText(b)}</span></div>
        <div class="bline"><span class="dbox ${off ? "dim" : ""}"><small>${WD[d.getDay()]}</small><b>${d.getDate()}</b><em>${MES[d.getMonth()].slice(0, 3)}</em></span>
          <div style="min-width:0"><h3>${esc(nomes(b.itens))}</h3><p class="meta">${b.time} – ${toHM(toMin(b.time) + mins(b.itens))}</p><div class="who">${ava(p.foto, p.nome, "xs")}com ${esc(p.nome)} · ${fmt(sum(b.itens))}</div></div></div>
        ${b.status === "aprovado" ? `<div class="acts"><a class="btn soft" href="${SALAO.mapa}" target="_blank" rel="noopener">Como chegar</a><a class="btn soft" href="${wa}" target="_blank" rel="noopener">Falar no WhatsApp</a></div>` : ""}
        ${off ? `<div class="why"><i>!</i><span><b>${esc(b.motivo || "Não aprovado")}.</b> ${b.refund ? "Seu Pix de " + fmt(sum(b.itens)) + " foi devolvido." : "Escolha outro, sem custo."}</span></div>
          <button class="btn-gold" type="button" data-go="agendar" data-refaz="${b.id}"><span style="width:17px;height:17px;display:inline-grid">${IC.cal}</span>Escolher outro horário</button>` : ""}
        ${b.status === "pix" ? `<button class="btn full" type="button" data-pagar="${b.id}">Pagar Pix</button>` : ""}
        ${b.status === "aguardando" ? `<p class="meta">O salão vai conferir a agenda e responder por aqui.</p>` : ""}
      </article>`;
    }).join("") : `<div class="empty">${S.meusTab === "prox" ? "Você ainda não tem horários marcados." : "Seus atendimentos já feitos aparecem aqui."}<button class="btn" type="button" data-tab="catalogo">Agendar agora</button></div>`}
  </section>`;
}
function vPerfil() {
  const P = S.perfil;
  return `<section class="view">
    <h1 class="pad-x" style="margin-top:12px">Meu perfil</h1>
    <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:22px">
      ${ava(P.foto, P.nome || "?", "xl", "ring")}
      <button class="btn ghost" type="button" id="trocar-foto">${P.foto ? "Trocar foto" : "Adicionar foto"}</button>
      <p class="meta" style="text-align:center">A foto ajuda o salão a te reconhecer na chegada.</p>
    </div>
    <div class="card sec">
      <label class="field">Nome completo<input type="text" id="p-nome" autocomplete="name" value="${esc(P.nome)}"></label>
      <label class="field">WhatsApp<input type="tel" id="p-fone" autocomplete="tel" value="${esc(P.fone)}" placeholder="(94) 9 0000-0000"></label>
      <label class="field">Endereço<input type="text" id="p-end" autocomplete="street-address" value="${esc(P.end)}" placeholder="Rua, número e bairro"></label>
    </div>
    <button class="btn full" type="button" id="salvar-perfil">Salvar perfil</button>
  </section>`;
}

/* ===== PAINEL DO SALÃO ===== */
function topSalao() {
  return `<div class="top"><img src="${LOGO}" alt="${esc(MARCA.nome)}"><div class="top-r"><span class="eyebrow">Painel</span><b>${dayShort(HOJE)}</b></div></div>`;
}
function vPedidos() {
  const list = S.bookings.filter(b => b.status === "aguardando").sort((a, b) => a.id - b.id);
  const conf = S.bookings.filter(b => b.status === "aprovado" && b.day === HOJE);
  return `<section class="view">
    ${topSalao()}
    <div class="ink-stats"><div><b class="g">${list.length}</b><span>para aprovar</span></div><div><b>${conf.length}</b><span>confirmados hoje</span></div><div><b>${fmt0(conf.reduce((a, b) => a + sum(b.itens), 0))}</b><span>previsto hoje</span></div></div>
    <div class="row pad-x" style="margin-top:6px;align-items:baseline"><h1 style="font-size:24px">Para aprovar</h1><span class="meta">mais antigos primeiro</span></div>
    ${list.length ? list.map(b => {
      const pago = b.pay === "pix" && b.paid;
      return `<article class="card ocard">
        <button class="ohead" type="button" data-open="${b.id}">${ava(fotoDe(b), b.nome, "md")}<span style="min-width:0"><h3>${esc(b.nome)}${b.ex ? ` <span class="tag-ex">Ex.</span>` : ""}</h3><p>${esc(nomes(b.itens))} · ${esc(pro(b.pro).nome)}</p></span><span class="pill ${pago ? "ok" : "n"}">${pago ? "Pix pago" : "No salão"}</span></button>
        <div class="ostrip"><span>${dayLabel(b.day)} · ${b.time}</span><span>${fmt(sum(b.itens))}${b.pay === "salao" ? " · " + payWord(b) : ""}</span></div>
        <div class="obtns"><button class="btn bad" type="button" data-rej="${b.id}">Reprovar</button><button class="btn" type="button" data-apr="${b.id}">Aprovar</button></div>
      </article>`;
    }).join("") : `<div class="empty">Nenhum pedido esperando. Os novos aparecem aqui.</div>`}
  </section>`;
}
function vDetalhe() {
  const b = bk(S.detail), wa = "https://wa.me/55" + b.fone.replace(/\D/g, ""), nome1 = b.nome.split(" ")[0];
  const m = t => wa + "?text=" + encodeURIComponent(t);
  const status = b.status === "aprovado" ? `<div class="status-box ok">✓ Agendamento confirmado</div>`
    : b.status === "reprovado" ? `<div class="status-box bad">Não aprovado${b.motivo ? ": " + esc(b.motivo) : ""}.${b.refund ? " Pix devolvido à cliente." : ""}</div>`
    : `<div class="status-box warn">Esperando a sua aprovação</div>`;
  return `<section class="view">
    ${navBack('data-fechar="1"', "Pedido #" + b.id)}
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding-top:6px">${ava(fotoDe(b), b.nome, "xl", "ring")}<h1 style="font-size:24px">${esc(b.nome)}</h1>${b.ex ? `<span class="tag-ex">Exemplo</span>` : ""}</div>
    ${status}
    <div class="card sec"><span class="eyebrow">Cliente</span>
      <div class="kv dim"><span>Nome</span><span>${esc(b.nome)}</span></div>
      <div class="kv dim"><span>WhatsApp</span><span>${esc(b.fone)}</span></div>
      <div class="kv dim"><span>Endereço</span><span>${esc(b.end || "Não informado")}</span></div></div>
    <div class="card sec"><span class="eyebrow">Serviço</span>
      ${b.itens.map(k => `<div class="kv"><span>${esc(it(k).nome)} · ${dur(it(k).min)}</span><span>${fmt(it(k).preco)}</span></div>`).join("")}
      <div class="kv dim"><span>Quando</span><span>${dayLabel(b.day)} · ${b.time} às ${toHM(toMin(b.time) + mins(b.itens))}</span></div>
      <div class="kv dim"><span>Profissional</span><span>${esc(pro(b.pro).nome)}</span></div>
      ${b.obs ? `<div class="obs"><b>Observação da cliente</b>${esc(b.obs)}</div>` : ""}</div>
    <div class="card sec"><span class="eyebrow">Pagamento</span>
      <div class="kv dim"><span>Forma</span><span>${b.pay === "pix" ? "Pix (pago no app)" : "No salão · " + (b.payIn === "dinheiro" ? "dinheiro" : "cartão de crédito")}</span></div>
      <div class="kv dim"><span>Situação</span><span>${b.pay === "pix" ? (b.refund ? "Pix devolvido" : "Pix confirmado") : "Paga no dia"}</span></div>
      <div class="kv total"><span>Total</span><span>${fmt(sum(b.itens))}</span></div>
      ${b.pay === "pix" && b.paid ? `<button class="receipt-thumb" type="button" data-zoom="${b.id}"><img src="${receipt(b)}" alt="Comprovante do Pix"><span>Ver comprovante<small>Toque para abrir e dar zoom</small></span></button>` : ""}</div>
    <div class="card sec"><span class="eyebrow">Mensagem à cliente</span>
      <div class="msgs">
        <a href="${m("Oi, " + nome1 + "! Seu horário no " + MARCA.nome + " está confirmado para " + dayLabel(b.day) + " às " + b.time + ". Te esperamos!")}" target="_blank" rel="noopener">Confirmar horário</a>
        <a href="${m("Oi, " + nome1 + "! Passando para lembrar do seu horário às " + b.time + " no " + MARCA.nome + ".")}" target="_blank" rel="noopener">Lembrete</a>
        <a href="${m("Oi, " + nome1 + "! Precisamos remarcar o seu horário. Qual outro dia fica bom para você?")}" target="_blank" rel="noopener">Remarcar</a>
        <a href="${m("Oi, " + nome1 + "! Vamos atrasar uns minutinhos, já te chamamos.")}" target="_blank" rel="noopener">Vai atrasar</a>
        <a class="wide" href="${wa}" target="_blank" rel="noopener">Escrever mensagem livre</a></div>
      <p class="meta">Abre o WhatsApp com a mensagem pronta para ${esc(b.fone)}.</p></div>
    <div class="card sec hist"><span class="eyebrow">Histórico</span>${b.hist.slice().reverse().map(h => `<div class="kv"><span>${h[0]} · ${h[1]}</span><span>${esc(h[2])}</span></div>`).join("")}</div>
    ${b.status === "aguardando" ? `<div class="obtns"><button class="btn bad" type="button" data-rej="${b.id}">Reprovar</button><button class="btn" type="button" data-apr="${b.id}">Aprovar</button></div>` : ""}
  </section>`;
}
function livreMin(day, proId) {
  const ps = proId === "todas" ? PROS : [pro(proId)];
  if (!aberto(day) && day !== HOJE) return 0;
  return ps.reduce((acc, p) => {
    const ocup = S.bookings.filter(b => b.pro === p.id && b.day === day && (b.status === "aprovado" || b.status === "aguardando")).reduce((a, b) => a + mins(b.itens), 0);
    return acc + Math.max(0, toMin(p.fim) - toMin(p.ini) - ocup);
  }, 0);
}
function vAgenda() {
  const dias = weekDays(0);
  const day = S.aDay;
  let list = S.bookings.filter(b => b.status === "aprovado" && b.day === day);
  if (S.aPro !== "todas") list = list.filter(b => b.pro === S.aPro);
  list.sort((a, b) => a.time.localeCompare(b.time));
  const rows = []; list.forEach((b, i) => {
    rows.push(b);
    const fim = toMin(b.time) + mins(b.itens), prox = list[i + 1];
    if (prox && toMin(prox.time) - fim >= 30) rows.push({ gap: true, de: toHM(fim), ate: prox.time });
  });
  return `<section class="view">
    <div class="row pad-x" style="margin-top:12px;align-items:baseline"><h1>Agenda</h1><span class="meta">${MES[dOf(day).getMonth()][0].toUpperCase() + MES[dOf(day).getMonth()].slice(1)}</span></div>
    <div class="card" style="padding:10px"><div class="week" role="group">${dias.map(k => { const d = dOf(k), tem = S.bookings.some(b => b.day === k && b.status === "aprovado");
      return `<button class="wd" type="button" data-aday="${k}" ${aberto(k) ? "" : "disabled"} aria-pressed="${k === day}">${WD[d.getDay()]}<b>${d.getDate()}</b><i class="${tem ? "on" : ""}"></i></button>`; }).join("")}</div></div>
    <div class="gmini"><div><span>Atendimentos</span><b>${list.length}</b></div><div><span>Previsto</span><b>${fmt0(list.reduce((a, b) => a + sum(b.itens), 0))}</b></div><div><span>${S.aPro === "todas" ? "Livre / prof." : "Livre"}</span><b>${dur(Math.round(livreMin(day, S.aPro) / (S.aPro === "todas" ? Math.max(1, PROS.length) : 1) / 15) * 15).replace(" min", "min")}</b></div></div>
    <div class="chips" role="group" aria-label="Filtrar por profissional"><button class="chip" type="button" data-apro="todas" aria-pressed="${S.aPro === "todas"}">Todas</button>${PROS.map(p => `<button class="chip" type="button" data-apro="${p.id}" aria-pressed="${S.aPro === p.id}"><span class="dot" style="background:${p.cor}"></span>${esc(p.nome)}</button>`).join("")}</div>
    ${rows.length ? rows.map(r => r.gap
      ? `<div class="tl"><time>${r.de}</time><div class="gap"><span>Livre até ${r.ate}</span><button class="link" type="button" data-encaixe="${r.de}">+ Encaixe</button></div></div>`
      : `<div class="tl"><time>${r.time}<small>${toHM(toMin(r.time) + mins(r.itens))}</small></time><button class="card acard" type="button" data-open="${r.id}"><span class="bar3" style="background:${pro(r.pro).cor}"></span><span style="min-width:0"><h3>${esc(r.nome)}</h3><p>${esc(nomes(r.itens))} · ${esc(pro(r.pro).nome)}</p><span class="pill ${r.pay === "pix" ? "ok" : "n"}">${r.pay === "pix" ? "Pix pago" : payWord(r)} · ${fmt0(sum(r.itens))}</span></span>${ava(pro(r.pro).foto, pro(r.pro).nome, "sm")}</button></div>`).join("")
      : `<div class="empty">Nenhum atendimento confirmado nesse dia${S.aPro !== "todas" ? " para " + esc(pro(S.aPro).nome) : ""}.</div>`}
  </section>`;
}
const FORMAS = { pix: ["Pix", "#4FC1B3"], cartao: ["Cartão", "#D9B56F"], dinheiro: ["Dinheiro", "#9DBF92"] };
const ltile = f => f === "pix" ? `<span class="ltile pix"><i></i></span>` : f === "cartao" ? `<span class="ltile cartao"><span class="minicard"></span></span>` : `<span class="ltile dinheiro">R$</span>`;
function vFinanceiro() {
  const dia = S.lanc.filter(l => l.day === S.finDay), tot = dia.reduce((a, l) => a + l.valor, 0);
  const porForma = f => dia.filter(l => l.forma === f).reduce((a, l) => a + l.valor, 0);
  const list = (S.finF === "todos" ? dia : dia.filter(l => l.forma === S.finF)).slice().sort((a, b) => a.at.localeCompare(b.at));
  const opts = Array.from({ length: 7 }, (_, i) => addDays(HOJE, -i));
  const cx = S.caixas[S.finDay];
  return `<section class="view">
    <div class="row pad-x" style="margin-top:12px"><h1>Financeiro</h1><select class="datesel" id="fin-dia" aria-label="Dia">${opts.map((k, i) => `<option value="${k}" ${k === S.finDay ? "selected" : ""}>${i === 0 ? "Hoje, " + dOf(k).getDate() + " " + MES[dOf(k).getMonth()].slice(0, 3) : dayShort(k)}</option>`).join("")}</select></div>
    <div class="fin"><span class="eyebrow">Faturamento do dia</span><span class="big">${fmt(tot)}</span><small>${dia.length} ${dia.length === 1 ? "lançamento" : "lançamentos"} · atualizado ao aprovar</small>
      ${Object.keys(FORMAS).map(f => { const v = porForma(f); return `<div class="fbar"><div class="row"><span>${FORMAS[f][0]}</span><b>${fmt(v)}</b></div><div class="track"><i style="width:${tot ? Math.round(v / tot * 100) : 0}%;background:${FORMAS[f][1]}"></i></div></div>`; }).join("")}
    </div>
    <div class="chips" role="group" aria-label="Filtrar por forma"><button class="chip" type="button" data-finf="todos" aria-pressed="${S.finF === "todos"}">Todos</button>${Object.keys(FORMAS).map(f => `<button class="chip" type="button" data-finf="${f}" aria-pressed="${S.finF === f}">${FORMAS[f][0]}</button>`).join("")}</div>
    ${cx ? `<div class="closed">${IC.lock}Caixa fechado às ${cx.at} · ${fmt(cx.total)}</div>` : ""}
    ${list.length ? `<div class="card" style="padding:4px 16px">${list.map(l => `<div class="lanc">${ltile(l.forma)}<span style="min-width:0"><h3>${esc(l.nome)}${l.ex ? ` <span class="tag-ex">Ex.</span>` : ""}</h3><p>${esc(nomes(l.itens))} · aprovado ${l.at}</p></span><b>+ ${fmt(l.valor)}</b></div>`).join("")}</div>`
      : `<div class="empty">Nenhum pagamento ${S.finF === "todos" ? "" : "em " + FORMAS[S.finF][0].toLowerCase() + " "}nesse dia.</div>`}
  </section>`;
}
function fFinanceiro() {
  const cx = S.caixas[S.finDay], tem = S.lanc.some(l => l.day === S.finDay);
  if (cx) return `<div class="goldcta"><button type="button" disabled>${IC.lock}Caixa do dia fechado</button></div>`;
  return `<div class="goldcta"><button type="button" id="fechar-caixa" ${tem ? "" : "disabled"}>${IC.lock}Fechar caixa do dia</button></div>`;
}

const CAT_IC = {};
const thumb = s => `<span class="thumb">${s.foto ? `<img src="${s.foto}" alt="">` : esc((s.cat || "✦")[0])}</span>`;
function vServicos() {
  const vis = SERVICES.filter(s => s.disp !== "arquivado"), ativos = vis.filter(s => s.disp === "disponivel").length;
  return `<section class="view">
    <div class="pad-x" style="margin-top:12px"><h1>Serviços</h1><p class="meta" style="margin-top:4px">${ativos} ativos · toque num serviço para editar</p></div>
    <div class="obtns" style="grid-template-columns:2fr 1fr"><button class="btn" type="button" data-svcedit="novo">+ Novo serviço</button><button class="btn ghost" type="button" id="abrir-cats">Categorias</button></div>
    ${CATS.map(c => { const l = vis.filter(s => s.cat === c); return `<div class="sec"><span class="eyebrow pad-x">${esc(c)} (${l.length})</span>${l.length ? l.map(s => `<div class="card svc-adm">
      <button class="svc-open" type="button" data-svcedit="${s.id}">${thumb(s)}<span><b>${esc(s.nome)}${s.disp === "pausado" ? `<span class="tag-off">Pausado</span>` : s.disp === "oculto" ? `<span class="tag-off">Oculto</span>` : ""}</b><small>${s.opcoes.length ? "a partir de " + fmt(desde(s)) + " · " + s.opcoes.length + " opções" : fmt(s.preco) + " · " + dur(s.min)}</small></span></button>
      <button class="toggle" type="button" data-tog="${s.id}" aria-pressed="${s.disp === "disponivel"}" aria-label="${esc(s.nome)} disponível hoje"></button></div>`).join("") : `<div class="empty" style="padding:16px">Nenhum serviço em ${esc(c)}.</div>`}</div>`; }).join("")}
  </section>`;
}
const MINS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300];
function vSvcEdit() {
  const e = S.sdraft, novo = e.id === "novo";
  return `<section class="view">
    ${navBack('data-svcfechar="1"', novo ? "Novo serviço" : "Editar serviço")}
    <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:10px">
      <span class="thumb big">${e.foto ? `<img src="${e.foto}" alt="">` : esc((e.cat || "✦")[0])}</span>
      <div class="row" style="gap:8px"><button class="btn ghost" type="button" id="svc-foto">${e.foto ? "Trocar foto" : "Adicionar foto"}</button>${e.foto ? `<button class="btn bad" type="button" id="svc-rmfoto">Remover</button>` : ""}</div>
      <p class="meta">Sem foto, aparece a inicial da categoria.</p></div>
    <div class="card sec">
      <label class="field">Nome<input type="text" id="e-nome" value="${esc(e.nome)}" placeholder="Ex.: Progressiva"></label>
      <label class="field">Descrição<textarea id="e-desc" placeholder="O que está incluso">${esc(e.desc)}</textarea></label>
      <div class="row" style="gap:10px;align-items:flex-start"><label class="field" style="flex:1">Preço (R$)<input type="number" min="0" step="5" id="e-preco" value="${e.preco}"></label>
        <label class="field" style="flex:1">Duração<select id="e-min">${MINS.map(m => `<option value="${m}" ${+e.min === m ? "selected" : ""}>${dur(m)}</option>`).join("")}</select></label></div>
      <div class="row" style="gap:10px;align-items:flex-start"><label class="field" style="flex:1">Categoria<select id="e-cat">${CATS.map(c => `<option ${e.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
        <label class="field" style="flex:1">Disponibilidade<select id="e-disp"><option value="disponivel" ${e.disp === "disponivel" ? "selected" : ""}>Disponível</option><option value="pausado" ${e.disp === "pausado" ? "selected" : ""}>Pausado hoje</option><option value="oculto" ${e.disp === "oculto" ? "selected" : ""}>Oculto (rascunho)</option></select></label></div>
      <p class="meta">Quem faz: ${PROS.filter(p => p.cats.includes(e.cat)).map(p => esc(p.nome)).join(", ") || "ninguém da equipe atende essa categoria ainda"}.</p></div>
    <div class="card sec"><span class="eyebrow">Opções com preço e tempo próprios</span><p class="meta">Ex.: cabelo curto, médio e longo. Sem opções, vale o preço e a duração acima.</p>
      ${e.opcoes.map((o, i) => `<div class="optrow"><span>${esc(o.nome)}<small>${dur(o.min)}</small></span><b>${fmt(o.preco)}</b><button class="xbtn" type="button" data-rmopt="${i}" aria-label="Remover ${esc(o.nome)}">✕</button></div>`).join("")}
      ${S.novaOpt ? `<div class="sec" style="border-top:1px solid var(--line-2);padding-top:10px"><label class="field">Nome da opção<input type="text" id="o-nome" placeholder="Ex.: longo"></label>
          <div class="row" style="gap:10px"><label class="field" style="flex:1">Preço (R$)<input type="number" min="0" step="5" id="o-preco" value="${e.preco}"></label><label class="field" style="flex:1">Duração<select id="o-min">${MINS.map(m => `<option value="${m}" ${+e.min === m ? "selected" : ""}>${dur(m)}</option>`).join("")}</select></label></div>
          <div class="obtns" style="grid-template-columns:1fr 1fr"><button class="btn ghost" type="button" data-optcancel="1">Cancelar</button><button class="btn" type="button" id="opt-ok">Adicionar opção</button></div></div>`
        : `<button class="btn ghost full" type="button" id="opt-add">+ Opção</button>`}</div>
    <button class="btn full" type="button" id="svc-salvar">${novo ? "Publicar serviço" : "Salvar alterações"}</button>
    ${novo ? "" : `<div class="obtns" style="grid-template-columns:1fr 1fr"><button class="btn ghost" type="button" id="svc-dup">Duplicar</button><button class="btn bad" type="button" id="svc-arq">Arquivar</button></div><p class="meta">Arquivar tira o serviço do app, mas mantém o histórico dos agendamentos antigos.</p>`}
  </section>`;
}
function vCats() {
  return `<section class="view">
    ${navBack('data-catsfechar="1"', "Categorias")}
    <p class="meta pad-x">São as abas que a cliente vê no app e as especialidades da equipe.</p>
    ${CATS.map((c, i) => { const n = SERVICES.filter(s => s.cat === c && s.disp !== "arquivado").length; return `<div class="card row" style="padding:10px 12px">
      <input type="text" id="cat-${i}" data-catidx="${i}" value="${esc(c)}" aria-label="Nome da categoria" style="flex:1"><span class="meta" style="white-space:nowrap">${n} serv.</span><button class="xbtn" type="button" data-rmcat="${i}" aria-label="Excluir ${esc(c)}">✕</button></div>`; }).join("")}
    <div class="card row" style="padding:10px 12px"><input type="text" id="cat-nova" placeholder="Nova categoria (ex.: Depilação)" style="flex:1"><button class="btn" type="button" id="cat-add">Adicionar</button></div>
  </section>`;
}
function vEquipe() {
  return `<section class="view">
    <div class="row pad-x" style="margin-top:12px;align-items:baseline"><h1>Equipe</h1><span class="meta">${PROS.length} profissionais</span></div>
    <p class="meta pad-x">Cada uma só recebe os serviços da especialidade dela, dentro do horário dela. Toque para editar.</p>
    <button class="btn full" type="button" data-proedit="novo">+ Adicionar profissional</button>
    ${PROS.length ? `<div class="tgrid">${PROS.map(p => { const n = S.bookings.filter(b => b.pro === p.id && b.status === "aprovado" && b.day === HOJE).length;
      return `<button class="card tcard" type="button" data-proedit="${p.id}">${ava(p.foto, p.nome, "lg")}<b><span class="dot" style="background:${p.cor};margin-right:6px"></span>${esc(p.nome)}</b><small>${esc(p.faz || p.cats.join(", "))}</small><span class="meta" style="color:var(--gold);font-weight:600">${p.ini.slice(0, 2)}h–${p.fim.slice(0, 2)}h · ${n} hoje</span></button>`; }).join("")}</div>`
      : `<div class="empty">Nenhuma profissional cadastrada. Adicione a primeira para abrir a agenda.</div>`}
  </section>`;
}
function vProEdit() {
  const d = S.draft, novo = d.id === "novo";
  const ativos = novo ? 0 : S.bookings.filter(b => b.pro === d.id && (b.status === "aguardando" || b.status === "aprovado")).length;
  return `<section class="view">
    ${navBack('data-profechar="1"', novo ? "Nova profissional" : "Editar " + esc(d.nome))}
    <div class="card" style="display:flex;flex-direction:column;align-items:center;gap:10px">${ava(d.foto, d.nome || "+", "xl", "ring")}<button class="btn ghost" type="button" id="pro-foto">${d.foto ? "Trocar foto" : "Adicionar foto"}</button></div>
    <div class="card sec">
      <label class="field">Nome<input type="text" id="d-nome" value="${esc(d.nome)}" placeholder="Ex.: Ana Paula"></label>
      <div class="field">Especialidades (o que ela atende)<div class="chips" style="flex-wrap:wrap;margin:0;padding:0" role="group" aria-label="Especialidades">${CATS.map(c => `<button class="chip" type="button" data-dcat="${esc(c)}" aria-pressed="${d.cats.includes(c)}">${esc(c)}</button>`).join("")}</div></div>
      <label class="field">Descrição curta (aparece para a cliente)<input type="text" id="d-faz" value="${esc(d.faz)}" placeholder="Ex.: Manicure, pedicure e unha em gel"></label>
      <div class="row" style="gap:10px"><label class="field" style="flex:1">Começa às<input type="time" id="d-ini" value="${d.ini}" step="1800"></label><label class="field" style="flex:1">Termina às<input type="time" id="d-fim" value="${d.fim}" step="1800"></label></div>
      <div class="field">Cor na agenda<div class="cores" role="group">${CORES.map(c => `<button type="button" data-cor="${c}" aria-pressed="${d.cor === c}" style="background:${c}" aria-label="Cor ${c}"></button>`).join("")}</div></div>
    </div>
    <button class="btn full" type="button" id="pro-salvar">${novo ? "Adicionar à equipe" : "Salvar alterações"}</button>
    ${novo ? "" : (S.confirmDel
      ? `<div class="card sec" style="border-color:var(--bad)">${ativos
          ? `<p style="font-size:13.5px;color:var(--bad)">${esc(d.nome)} tem ${ativos} agendamento${ativos > 1 ? "s" : ""} em aberto ou confirmado${ativos > 1 ? "s" : ""}. Remarque ou reprove antes de excluir.</p><button class="link" type="button" data-delcancel="1">Entendi</button>`
          : `<p style="font-size:13.5px">Excluir ${esc(d.nome)} da equipe? Ela some da agenda e as clientes não podem mais escolher ela.</p><div class="obtns" style="grid-template-columns:1fr 1fr"><button class="btn ghost" type="button" data-delcancel="1">Cancelar</button><button class="btn bad" type="button" id="pro-excluir">Excluir</button></div>`}</div>`
      : `<button class="btn bad full" type="button" data-delask="1">Excluir profissional</button>`)}
  </section>`;
}

/* ===== folhas, zoom e render ===== */
function sheet() {
  const sh = S.sheet; if (!sh) return "";
  let body = "";
  if (sh.t === "opt") {
    const s = svc(sh.sid);
    body = `<h2>${esc(s.nome)}</h2><p class="meta">Escolha uma opção. O preço e o tempo mudam conforme a escolha.</p>
      ${s.opcoes.map((o, i) => `<button class="opt" type="button" data-addopt="${s.id}:${i}"><span>${esc(o.nome[0].toUpperCase() + o.nome.slice(1))}<small>${dur(o.min)}</small></span><b>${fmt(o.preco)}</b></button>`).join("")}`;
  }
  if (sh.t === "rej") {
    const b = bk(sh.id);
    body = `<h2>Reprovar pedido</h2><p class="meta">${esc(b.nome)} · ${esc(nomes(b.itens))}. A cliente vê o motivo.${b.pay === "pix" && b.paid ? " O Pix de " + fmt(sum(b.itens)) + " volta automático para ela." : ""}</p>
      ${["Horário indisponível", "Profissional ausente", "Salão fechado nesse dia"].map(r => `<button class="opt" type="button" data-motivo="${r}"><span>${r}</span><b style="color:var(--bad)">→</b></button>`).join("")}`;
  }
  if (sh.t === "caixa") {
    const dia = S.lanc.filter(l => l.day === S.finDay), tot = dia.reduce((a, l) => a + l.valor, 0);
    body = `<h2>Fechar caixa</h2><p class="meta">${dayShort(S.finDay)} · ${dia.length} lançamentos. Depois de fechar, os lançamentos do dia ficam travados.</p>
      <div class="card flat sec">${Object.keys(FORMAS).map(f => `<div class="kv"><span>${FORMAS[f][0]}</span><span>${fmt(dia.filter(l => l.forma === f).reduce((a, l) => a + l.valor, 0))}</span></div>`).join("")}<div class="kv total"><span>Total</span><span>${fmt(tot)}</span></div></div>
      <button class="btn-gold" type="button" id="caixa-ok">${IC.lock}Confirmar fechamento</button>`;
  }
  return `<div class="scrim" data-sheetclose="1"><div class="sheet" role="dialog" aria-modal="true"><span class="grab"></span>${body}<button class="btn ghost full" type="button" data-sheetclose="1">Cancelar</button></div></div>`;
}
function lightbox() {
  if (!S.zoom) return "";
  const b = bk(S.zoom.id), w = Math.round(S.zoom.k * 100);
  return `<div class="lightbox" role="dialog" aria-label="Comprovante do Pix"><div class="lb-bar"><button type="button" data-zclose="1">✕ Fechar</button><span style="font-size:13px">${w}%</span><div style="display:flex;gap:6px"><button type="button" data-z="-1" aria-label="Diminuir">−</button><button type="button" data-z="1" aria-label="Aumentar">+</button></div></div>
    <div class="lb-view"><img src="${receipt(b)}" alt="Comprovante do Pix de ${esc(b.nome)}" style="width:${w}%"></div></div>`;
}
function render() {
  const root = document.getElementById("root"), bottom = document.getElementById("bottom"), app = document.getElementById("app");
  const bc = document.getElementById("as-cliente"), bs = document.getElementById("as-salao");
  if (bc) { bc.setAttribute("aria-pressed", S.as === "cliente"); bs.setAttribute("aria-pressed", S.as === "salao"); bs.innerHTML = "Salão (dona)" + (pending() && S.as === "cliente" ? '<span class="pip"></span>' : ""); }
  let tall = false;
  if (S.as === "cliente") {
    const v = S.view;
    root.innerHTML = { catalogo: vCatalogo, agendar: vAgendar, pagar: vPagar, pix: vPix, meus: vMeus, perfil: vPerfil }[v]();
    const nav = tabs([["catalogo", "Serviços", "bag"], ["meus", "Horários", "cal"], ["perfil", "Perfil", "user"]], ["meus", "perfil"].includes(v) ? v : "catalogo");
    if (v === "agendar") bottom.innerHTML = bAgendar();
    else if (v === "pagar") bottom.innerHTML = bPagar();
    else if (v === "pix") bottom.innerHTML = nav;
    else { bottom.innerHTML = (v === "catalogo" ? fCatalogo() : "") + nav; tall = v === "catalogo" && S.cart.length > 0; }
    if (v === "pix") drawQR();
  } else if (S.detail) { root.innerHTML = vDetalhe(); bottom.innerHTML = ""; }
  else if (S.draft) { root.innerHTML = vProEdit(); bottom.innerHTML = ""; }
  else if (S.sdraft) { root.innerHTML = vSvcEdit(); bottom.innerHTML = ""; }
  else if (S.cats) { root.innerHTML = vCats(); bottom.innerHTML = ""; }
  else {
    root.innerHTML = { pedidos: vPedidos, agenda: vAgenda, financeiro: vFinanceiro, servicos: vServicos, equipe: vEquipe }[S.tab]();
    bottom.innerHTML = (S.tab === "financeiro" ? fFinanceiro() : "") + tabs([["pedidos", "Pedidos", "inbox", pending()], ["agenda", "Agenda", "cal"], ["financeiro", "Financeiro", "wallet"], ["servicos", "Serviços", "list"], ["equipe", "Equipe", "users"]], S.tab);
    tall = S.tab === "financeiro";
  }
  app.classList.toggle("tall", tall);
  document.getElementById("layer").innerHTML = sheet() + lightbox();
  salvar();
}

/* ===== dados da demonstração: ficam salvos neste aparelho e as abas da cliente e do salão conversam entre si.
   No sistema de verdade isso sai daqui e vai para o servidor. ===== */
const CHAVE = "agenda-" + MARCA.chave + "-demo-v1";
let ultimoSalvo = "";
function salvar() {
  try {
    const dados = JSON.stringify({ bookings: S.bookings, lanc: S.lanc, perfil: S.perfil, caixas: S.caixas, seq, services: SERVICES, pros: PROS, cats: CATS },
      (k, v) => k === "receipt" ? undefined : v);
    if (dados !== ultimoSalvo) { localStorage.setItem(CHAVE, dados); ultimoSalvo = dados; }
  } catch (_) { /* sem armazenamento: a demonstração funciona, só não guarda */ }
}
function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE); if (!raw) return false;
    const d = JSON.parse(raw);
    S.bookings = d.bookings; S.lanc = d.lanc; S.perfil = d.perfil; S.caixas = d.caixas || {}; seq = d.seq;
    SERVICES.splice(0, SERVICES.length, ...d.services); PROS.splice(0, PROS.length, ...d.pros); CATS = d.cats;
    ultimoSalvo = raw; return true;
  } catch (_) { return false; }
}
window.addEventListener("storage", e => {
  if (e.key !== CHAVE) return;
  if (!e.newValue) { location.reload(); return; }
  const ativo = document.activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
  if (carregar() && !ativo) render();
});
window.zerarDemo = () => { try { localStorage.removeItem(CHAVE); } catch (_) {} location.reload(); };
let tt;
function toast(m) { const t = document.getElementById("toast"); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2600); }
function go(v) { S.view = v; S.sheet = null; render(); window.scrollTo(0, 0); }
function drawQR() {
  const c = document.getElementById("qr"); if (!c) return;
  const x = c.getContext("2d"), n = 29; let h = 2166136261 ^ S.pixFor;
  x.fillStyle = "#fff"; x.fillRect(0, 0, n, n); x.fillStyle = "#211B18";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { h = Math.imul(h ^ (i * 31 + j), 16777619); if ((h >>> 7) & 1) x.fillRect(i, j, 1, 1); }
  [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([a, b]) => { x.fillStyle = "#211B18"; x.fillRect(a, b, 7, 7); x.fillStyle = "#fff"; x.fillRect(a + 1, b + 1, 5, 5); x.fillStyle = "#211B18"; x.fillRect(a + 2, b + 2, 3, 3); });
}
function readPerfilFields() {
  const el = document.getElementById("p-nome");
  if (el) { S.perfil.nome = el.value.trim(); S.perfil.fone = document.getElementById("p-fone").value.trim(); S.perfil.end = document.getElementById("p-end").value.trim(); }
}
function lerSvc() {
  const g = id => document.getElementById(id);
  if (!S.sdraft || !g("e-nome")) return;
  Object.assign(S.sdraft, { nome: g("e-nome").value, desc: g("e-desc").value, preco: g("e-preco").value, min: +g("e-min").value, cat: g("e-cat").value, disp: g("e-disp").value });
}
function aprovar(b) {
  b.status = "aprovado"; b.hist.push([hhmm(), "Dona", "Aprovou o agendamento"]);
  S.lanc.push({ id: ++seq, bid: b.id, forma: b.pay === "pix" ? "pix" : b.payIn, valor: sum(b.itens), nome: b.nome, itens: b.itens, at: hhmm(), day: HOJE });
  toast("Aprovado. Lançado no Financeiro e a cliente já vê confirmado.");
}
function fimSemana() { const k = weekDays(S.week).find(x => aberto(x)); if (k && !weekDays(S.week).includes(S.day)) { S.day = k; S.time = null; } }
let detailFrom = null;

document.addEventListener("click", e => {
  const t = e.target.closest("button, .scrim");
  if (!t) return;
  const d = t.dataset;
  if (d.sheetclose && (t.tagName === "BUTTON" || e.target === t)) { S.sheet = null; render(); return; }
  if (t.classList.contains("scrim")) return;
  if (t.id === "as-cliente") { S.as = "cliente"; S.zoom = null; S.sheet = null; render(); return; }
  if (t.id === "as-salao") { readPerfilFields(); S.as = "salao"; S.sheet = null; render(); window.scrollTo(0, 0); return; }
  if (d.tab) {
    if (S.as === "cliente") { readPerfilFields(); go(d.tab); }
    else { S.tab = d.tab; S.detail = null; S.draft = null; S.sdraft = null; S.cats = false; S.sheet = null; render(); window.scrollTo(0, 0); }
    return;
  }
  /* cliente */
  if (d.cat) { S.cat = d.cat; render(); return; }
  if (d.svc) {
    const s = svc(+d.svc);
    if (S.cart.some(k => it(k).sid === s.id)) S.cart = S.cart.filter(k => it(k).sid !== s.id);
    else if (s.opcoes.length) S.sheet = { t: "opt", sid: s.id };
    else S.cart = [...S.cart, String(s.id)];
    S.time = null; render(); return;
  }
  if (d.addopt) { S.cart = [...S.cart, d.addopt]; S.sheet = null; S.time = null; render(); return; }
  if (t.id === "go-agendar") { go("agendar"); return; }
  if (d.go) { if (d.refaz) { S.cart = bk(+d.refaz).itens.map(String); S.time = null; } go(d.go); return; }
  if (d.pro) { S.pro = d.pro; S.time = null; render(); return; }
  if (d.wk) { S.week = Math.max(0, Math.min(3, S.week + +d.wk)); fimSemana(); render(); return; }
  if (d.day) { S.day = d.day; S.time = null; render(); return; }
  if (d.turno) { S.turno = d.turno; S.time = null; render(); return; }
  if (d.time) { S.time = d.time; render(); return; }
  if (t.id === "go-pagar") { go("pagar"); return; }
  if (d.pay) { S.pay = d.pay; render(); return; }
  if (d.payin) { S.payIn = d.payin; render(); return; }
  if (t.id === "enviar") {
    const fn = document.getElementById("f-nome");
    if (fn) { S.perfil.nome = fn.value.trim(); S.perfil.fone = document.getElementById("f-fone").value.trim(); }
    S.obs = document.getElementById("f-obs").value.trim();
    if (!S.perfil.nome || S.perfil.fone.replace(/\D/g, "").length < 10) { toast("Preencha seu nome e um WhatsApp com DDD."); return; }
    const P = S.perfil;
    const b = { id: ++seq, nome: P.nome, fone: P.fone, end: P.end, foto: P.foto, itens: [...S.cart], pro: quemNoHorario(), day: S.day, time: S.time, obs: S.obs, pay: S.pay, payIn: S.payIn, paid: false, status: S.pay === "pix" ? "pix" : "aguardando", mine: true, hist: [[hhmm(), "Cliente", "Pedido criado"]] };
    S.bookings.push(b); S.cart = []; S.time = null; S.obs = ""; S.meusTab = "prox";
    if (b.pay === "pix") { S.pixFor = b.id; go("pix"); } else { toast("Pedido enviado! Aguarde a aprovação do salão."); go("meus"); }
    return;
  }
  if (d.pagar) { S.pixFor = +d.pagar; go("pix"); return; }
  if (t.id === "copiar") {
    const el = document.getElementById("pix-code");
    const sel = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Código selecionado. Copie e cole no app do banco."); };
    try { navigator.clipboard.writeText(el.textContent).then(() => toast("Código Pix copiado."), sel); } catch (_) { sel(); }
    return;
  }
  if (t.id === "simular-pix") { const b = bk(S.pixFor); b.paid = true; b.status = "aguardando"; b.hist.push([hhmm(), "Sistema", "Pix confirmado pelo Mercado Pago"]); toast("Pix confirmado! Pedido enviado ao salão."); go("meus"); return; }
  if (d.meus) { S.meusTab = d.meus; render(); return; }
  if (t.id === "trocar-foto") { readPerfilFields(); document.getElementById("foto-input").click(); return; }
  if (t.id === "salvar-perfil") { readPerfilFields(); toast("Perfil salvo."); render(); return; }
  /* salão: pedidos */
  if (d.open) { detailFrom = window.scrollY; S.detail = +d.open; render(); window.scrollTo(0, 0); return; }
  if (d.fechar) { S.detail = null; render(); window.scrollTo(0, detailFrom || 0); return; }
  if (d.apr) { aprovar(bk(+d.apr)); render(); return; }
  if (d.rej) { S.sheet = { t: "rej", id: +d.rej }; render(); return; }
  if (d.motivo) {
    const b = bk(S.sheet.id); b.status = "reprovado"; b.motivo = d.motivo; b.hist.push([hhmm(), "Dona", "Reprovou: " + d.motivo]);
    if (b.pay === "pix" && b.paid) { b.refund = true; b.hist.push([hhmm(), "Sistema", "Pix devolvido pelo Mercado Pago"]); }
    S.sheet = null; toast(b.refund ? "Reprovado. Pix devolvido à cliente." : "Reprovado. A cliente foi avisada."); render(); return;
  }
  if (d.zoom) { S.zoom = { id: +d.zoom, k: 1 }; render(); return; }
  if (d.zclose) { S.zoom = null; render(); return; }
  if (d.z) { S.zoom.k = Math.min(3, Math.max(0.5, S.zoom.k + 0.5 * +d.z)); render(); return; }
  /* agenda e financeiro */
  if (d.aday) { S.aDay = d.aday; render(); return; }
  if (d.apro) { S.aPro = d.apro; render(); return; }
  if (d.encaixe) { toast("Encaixe: no sistema real a dona marca um horário direto pelo painel a partir de " + d.encaixe + "."); return; }
  if (d.finf) { S.finF = d.finf; render(); return; }
  if (t.id === "fechar-caixa") { S.sheet = { t: "caixa" }; render(); return; }
  if (t.id === "caixa-ok") { const dia = S.lanc.filter(l => l.day === S.finDay); S.caixas[S.finDay] = { at: hhmm(), total: dia.reduce((a, l) => a + l.valor, 0) }; S.sheet = null; toast("Caixa do dia fechado."); render(); return; }
  /* serviços */
  if (d.tog) { const s = svc(+d.tog); s.disp = s.disp === "disponivel" ? "pausado" : "disponivel"; toast(s.nome + (s.disp === "disponivel" ? " disponível para as clientes." : " pausado hoje.")); render(); return; }
  if (d.svcedit) {
    const s = d.svcedit === "novo" ? { id: "novo", nome: "", desc: "", preco: 50, min: 60, cat: CATS[0], disp: "disponivel", foto: "", opcoes: [] } : svc(+d.svcedit);
    S.sdraft = { ...s, opcoes: s.opcoes.map(o => ({ ...o })) }; S.novaOpt = false; render(); window.scrollTo(0, 0); return;
  }
  if (d.svcfechar) { S.sdraft = null; render(); window.scrollTo(0, 0); return; }
  if (t.id === "svc-foto") { lerSvc(); document.getElementById("foto-input").click(); return; }
  if (t.id === "svc-rmfoto") { lerSvc(); S.sdraft.foto = ""; render(); return; }
  if (t.id === "opt-add") { lerSvc(); S.novaOpt = true; render(); return; }
  if (d.optcancel) { S.novaOpt = false; render(); return; }
  if (t.id === "opt-ok") {
    const n = document.getElementById("o-nome").value.trim();
    if (!n) { toast("Coloque o nome da opção."); return; }
    lerSvc(); S.sdraft.opcoes.push({ nome: n, preco: Math.max(0, +document.getElementById("o-preco").value || 0), min: +document.getElementById("o-min").value });
    S.novaOpt = false; render(); return;
  }
  if (d.rmopt) { lerSvc(); S.sdraft.opcoes.splice(+d.rmopt, 1); render(); return; }
  if (t.id === "svc-salvar") {
    lerSvc(); const e2 = S.sdraft;
    if (!e2.nome.trim()) { toast("Coloque o nome do serviço."); return; }
    const dados = { nome: e2.nome.trim(), desc: e2.desc.trim(), preco: Math.max(0, +e2.preco || 0), min: +e2.min, cat: e2.cat, disp: e2.disp, foto: e2.foto, opcoes: e2.opcoes };
    if (e2.id === "novo") { SERVICES.push({ id: ++seq, ...dados }); toast(dados.nome + " publicado."); }
    else { Object.assign(SERVICES.find(s => s.id === e2.id), dados); toast("Alterações em " + dados.nome + " salvas."); }
    S.sdraft = null; render(); window.scrollTo(0, 0); return;
  }
  if (t.id === "svc-dup") { lerSvc(); S.sdraft = { ...S.sdraft, id: "novo", nome: S.sdraft.nome + " (cópia)", opcoes: S.sdraft.opcoes.map(o => ({ ...o })) }; toast("Cópia criada. Ajuste e publique."); render(); window.scrollTo(0, 0); return; }
  if (t.id === "svc-arq") { const s = SERVICES.find(x => x.id === S.sdraft.id); s.disp = "arquivado"; S.cart = S.cart.filter(k => it(k).sid !== s.id); S.sdraft = null; toast(s.nome + " arquivado."); render(); return; }
  if (t.id === "abrir-cats") { S.cats = true; render(); window.scrollTo(0, 0); return; }
  if (d.catsfechar) { S.cats = false; render(); return; }
  if (t.id === "cat-add") {
    const n = document.getElementById("cat-nova").value.trim();
    if (!n) { toast("Escreva o nome da categoria."); return; }
    if (CATS.some(c => c.toLowerCase() === n.toLowerCase())) { toast("Essa categoria já existe."); return; }
    CATS.push(n); toast("Categoria " + n + " criada."); render(); return;
  }
  if (d.rmcat) {
    const c = CATS[+d.rmcat];
    if (SERVICES.some(s => s.cat === c && s.disp !== "arquivado")) { toast("Mova ou arquive os serviços de " + c + " antes de excluir."); return; }
    if (CATS.length === 1) { toast("Precisa ter pelo menos uma categoria."); return; }
    CATS.splice(+d.rmcat, 1); PROS.forEach(p => p.cats = p.cats.filter(x => x !== c)); toast("Categoria " + c + " excluída."); render(); return;
  }
  /* equipe */
  if (d.proedit) {
    const p = d.proedit === "novo" ? { id: "novo", nome: "", foto: "", cats: [], faz: "", ini: "09:00", fim: "18:00", cor: CORES[PROS.length % CORES.length] } : pro(d.proedit);
    S.draft = { ...p, cats: [...p.cats] }; S.confirmDel = false; render(); window.scrollTo(0, 0); return;
  }
  if (d.profechar) { S.draft = null; render(); window.scrollTo(0, 0); return; }
  if (d.dcat) { const c = S.draft.cats; S.draft.cats = c.includes(d.dcat) ? c.filter(x => x !== d.dcat) : [...c, d.dcat]; render(); return; }
  if (d.cor) { S.draft.cor = d.cor; render(); return; }
  if (t.id === "pro-foto") { document.getElementById("foto-input").click(); return; }
  if (t.id === "pro-salvar") {
    const dr = S.draft;
    if (!dr.nome.trim()) { toast("Coloque o nome da profissional."); return; }
    if (!dr.cats.length) { toast("Escolha pelo menos uma especialidade."); return; }
    if (toMin(dr.fim) - toMin(dr.ini) < 60) { toast("O expediente precisa ter pelo menos 1 hora."); return; }
    const dados = { nome: dr.nome.trim(), foto: dr.foto, cats: dr.cats, faz: dr.faz.trim() || dr.cats.join(", "), ini: dr.ini, fim: dr.fim, cor: dr.cor };
    if (dr.id === "novo") { PROS.push({ id: "p" + (++seq), ...dados }); toast(dados.nome + " entrou na equipe."); }
    else { Object.assign(PROS.find(p => p.id === dr.id), dados); toast("Dados de " + dados.nome + " salvos."); }
    S.draft = null; render(); window.scrollTo(0, 0); return;
  }
  if (d.delask) { S.confirmDel = true; render(); return; }
  if (d.delcancel) { S.confirmDel = false; render(); return; }
  if (t.id === "pro-excluir") { const i = PROS.findIndex(p => p.id === S.draft.id), n = PROS[i].nome; PROS.splice(i, 1); S.draft = null; S.confirmDel = false; toast(n + " saiu da equipe."); render(); window.scrollTo(0, 0); return; }
});
document.addEventListener("change", e => {
  if (e.target.id === "fin-dia") { S.finDay = e.target.value; render(); return; }
  if (e.target.id === "e-cat" || e.target.id === "e-disp") { lerSvc(); render(); return; }
  if (e.target.dataset.catidx) {
    const i = +e.target.dataset.catidx, velho = CATS[i], novo = e.target.value.trim();
    if (!novo || novo === velho) { e.target.value = velho; return; }
    if (CATS.includes(novo)) { toast("Essa categoria já existe."); e.target.value = velho; return; }
    CATS[i] = novo; SERVICES.forEach(s => { if (s.cat === velho) s.cat = novo; }); PROS.forEach(p => p.cats = p.cats.map(x => x === velho ? novo : x));
    if (S.cat === velho) S.cat = novo;
    toast("Categoria renomeada para " + novo + "."); render(); return;
  }
  if (e.target.id === "foto-input" && e.target.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"), s = 320, k = Math.min(img.width, img.height); c.width = c.height = s;
        c.getContext("2d").drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, s, s);
        const url = c.toDataURL("image/jpeg", 0.85);
        if (S.as === "salao" && S.sdraft) S.sdraft.foto = url; else if (S.as === "salao" && S.draft) S.draft.foto = url; else S.perfil.foto = url;
        toast("Foto adicionada."); render();
      };
      img.src = r.result;
    };
    r.readAsDataURL(e.target.files[0]); e.target.value = "";
  }
});
document.addEventListener("input", e => {
  const k = { "p-nome": "nome", "p-fone": "fone", "p-end": "end" }[e.target.id];
  if (k) S.perfil[k] = e.target.value;
  if (e.target.id === "f-nome") S.fNome = e.target.value;
  if (e.target.id === "f-fone") S.fFone = e.target.value;
  if (e.target.id === "f-obs") S.obs = e.target.value;
  const dk = { "d-nome": "nome", "d-faz": "faz", "d-ini": "ini", "d-fim": "fim" }[e.target.id];
  if (dk && S.draft) S.draft[dk] = e.target.value;
});
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (S.zoom) S.zoom = null; else if (S.sheet) S.sheet = null; else return; render(); } });
carregar();
render();
