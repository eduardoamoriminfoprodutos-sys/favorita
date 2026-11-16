/* Sistema de agendamento para salões. A marca vem de marca.js. Ver README.md e CLAUDE.md. */
"use strict";
/* ============================================================
   CAMADA DE DADOS. É O ÚNICO ARQUIVO QUE CONVERSA COM O ARMAZENAMENTO.
   Demonstração:
   - sempre grava no localStorage deste navegador (abas do mesmo aparelho conversam pelo evento "storage");
   - quando a página abre no link de apresentação do claude.ai (artefato com o banco "db"),
     também grava num documento compartilhado, e celular e computador conversam ao vivo.
   No sistema de verdade (VPS): trocar salvar() e carregar() por chamadas à API
   do servidor, seguindo docs/ENTREGA-VPS.md. O resto do app não precisa mudar.
   ============================================================ */
const CHAVE = "agenda-" + MARCA.chave + "-demo-v1";
let ultimoSalvo = "";
const estadoJSON = () => JSON.stringify({ bookings: S.bookings, lanc: S.lanc, perfil: S.perfil, caixas: S.caixas, avaliacoes: S.avaliacoes, pdi: S.pdi, seq, services: SERVICES, pros: PROS, cats: CATS },
  (k, v) => k === "receipt" ? undefined : v);
function aplicarEstado(d) {
  S.bookings = d.bookings; S.lanc = d.lanc; S.perfil = d.perfil; S.caixas = d.caixas || {}; S.avaliacoes = d.avaliacoes || S.avaliacoes; S.pdi = d.pdi || []; seq = d.seq;
  SERVICES.splice(0, SERVICES.length, ...d.services); PROS.splice(0, PROS.length, ...d.pros); CATS = d.cats;
}
const campoAtivo = () => document.activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);

function salvar() {
  let dados;
  try { dados = estadoJSON(); } catch (_) { return; }
  if (dados === ultimoSalvo) return;
  ultimoSalvo = dados;
  try { localStorage.setItem(CHAVE, dados); } catch (_) { /* sem armazenamento: a demonstração funciona, só não guarda */ }
  agendarRemoto(dados);
}
function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE); if (!raw) return false;
    aplicarEstado(JSON.parse(raw)); ultimoSalvo = raw; return true;
  } catch (_) { return false; }
}
window.addEventListener("storage", e => {
  if (e.key !== CHAVE) return;
  if (!e.newValue) { location.reload(); return; }
  if (carregar() && !campoAtivo()) render();
});

/* ===== modo compartilhado (link de apresentação no claude.ai) ===== */
let docRemoto = null, ultimoRemoto = "", gravando = false, pendente = null, timerRemoto = null;
function agendarRemoto(dados) {
  if (!docRemoto) return;
  pendente = dados; clearTimeout(timerRemoto);
  timerRemoto = setTimeout(gravarRemoto, 400);   /* junta cliques seguidos numa gravação só */
}
async function gravarRemoto() {
  if (!docRemoto || gravando || pendente === null || pendente === ultimoRemoto) return;
  const dados = pendente; pendente = null;
  if (dados.length > 240000) { toast("Dados grandes demais para sincronizar (muitas fotos). Zere a demonstração."); return; }
  gravando = true;
  try { await docRemoto.set({ json: dados, em: new Date().toISOString() }); ultimoRemoto = dados; }
  catch (_) { /* sem permissão de escrita (ex.: link aberto por visitante): segue só neste aparelho */ }
  gravando = false;
  if (pendente !== null) gravarRemoto();
}
async function ligarCompartilhado() {
  if (!window.claude || typeof window.claude.use !== "function") return;
  let db = null;
  try { db = await window.claude.use("db"); } catch (_) { db = null; }
  if (!db) return;
  docRemoto = db.doc("demo/estado");
  docRemoto.onSnapshot(snap => {
    if (!snap.exists) {
      if (ultimoRemoto) { try { localStorage.removeItem(CHAVE); } catch (_) {} location.reload(); return; }   /* outro aparelho zerou: volta ao início também */
      pendente = estadoJSON(); gravarRemoto(); return;   /* primeiro aparelho: semeia */
    }
    const j = (snap.data() || {}).json;
    if (typeof j !== "string" || j === ultimoRemoto || j === ultimoSalvo) { ultimoRemoto = j || ultimoRemoto; return; }
    ultimoRemoto = j;
    try { aplicarEstado(JSON.parse(j)); ultimoSalvo = j; localStorage.setItem(CHAVE, j); } catch (_) { return; }
    if (!campoAtivo()) render();
  }, () => { docRemoto = null; });
}
window.zerarDemo = async () => {
  try { localStorage.removeItem(CHAVE); } catch (_) {}
  if (docRemoto) { try { await docRemoto.delete(); } catch (_) {} }
  location.reload();
};

/* chamado pela página depois de carregar as partes (cliente, salão ou as duas) */
function iniciar() { carregar(); render(); ligarCompartilhado(); }
