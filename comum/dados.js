/* Sistema de agendamento para salões. A marca vem de marca.js. Ver README.md e CLAUDE.md. */
"use strict";
/* ============================================================
   CAMADA DE DADOS. É O ÚNICO ARQUIVO QUE CONVERSA COM O ARMAZENAMENTO.
   Hoje (demonstração): grava tudo no localStorage deste navegador, e o evento "storage"
   faz as abas da cliente e do salão conversarem no mesmo aparelho.
   No sistema de verdade (VPS): trocar salvar() e carregar() por chamadas à API
   do servidor, seguindo docs/ENTREGA-VPS.md. O resto do app não precisa mudar.
   ============================================================ */
const CHAVE = "agenda-" + MARCA.chave + "-demo-v1";
let ultimoSalvo = "";
function salvar() {
  try {
    const dados = JSON.stringify({ bookings: S.bookings, lanc: S.lanc, perfil: S.perfil, caixas: S.caixas, avaliacoes: S.avaliacoes, pdi: S.pdi, seq, services: SERVICES, pros: PROS, cats: CATS },
      (k, v) => k === "receipt" ? undefined : v);
    if (dados !== ultimoSalvo) { localStorage.setItem(CHAVE, dados); ultimoSalvo = dados; }
  } catch (_) { /* sem armazenamento: a demonstração funciona, só não guarda */ }
}
function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE); if (!raw) return false;
    const d = JSON.parse(raw);
    S.bookings = d.bookings; S.lanc = d.lanc; S.perfil = d.perfil; S.caixas = d.caixas || {}; S.avaliacoes = d.avaliacoes || S.avaliacoes; S.pdi = d.pdi || []; seq = d.seq;
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
/* Demonstração: libera "Avaliar atendimento" logo depois da confirmação, para apresentar.
   No sistema de verdade (false), o botão só aparece depois do horário do atendimento. */
const DEMONSTRACAO = true;

/* chamado pela página depois de carregar as partes (cliente, salão ou as duas) */
function iniciar() { carregar(); render(); }
