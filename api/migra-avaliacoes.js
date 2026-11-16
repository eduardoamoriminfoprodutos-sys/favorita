/* Acrescenta ao banco que já está no ar: tabelas de avaliações e PDI + avaliações de EXEMPLO (Ana 4,8 com elogios; Duda com reclamações).
   Uso (na pasta da API, com o .env):   node migra-avaliacoes.js [--dry]
   Não apaga nada. Se já houver avaliação de exemplo, não repete. */
try { require('dotenv').config({ path: __dirname + '/.env' }); } catch (e) {}
const fs = require('fs');
const { Pool } = require('pg');
const EX = require('./exemplos-avaliacoes');
const DRY = process.argv.includes('--dry');
const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Belem', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
const HOJE = p.year + '-' + p.month + '-' + p.day;
const menosDias = n => { const d = new Date(HOJE + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
async function inserirExemplos(c) {
  const pros = (await c.query('select id from profissionais')).rows.map(r => r.id);
  let n = 0;
  for (const [pro, nota, dias, nome, tags, texto, itens] of EX) {
    if (!pros.includes(pro)) continue;   // profissional de exemplo que não existe mais: pula
    await c.query('insert into avaliacoes (profissional_id, nome, nota, tags, texto, itens, dia, exemplo) values ($1,$2,$3,$4,$5,$6,$7,true)', [pro, nome, nota, tags, texto, JSON.stringify(itens), menosDias(dias)]);
    n++;
  }
  return n;
}
module.exports = { inserirExemplos };
if (require.main === module) (async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query(fs.readFileSync(__dirname + '/schema.sql', 'utf8'));
    const ja = (await c.query('select count(*)::int as n from avaliacoes where exemplo')).rows[0].n;
    const n = ja ? 0 : await inserirExemplos(c);
    const resumo = (await c.query("select profissional_id as pro, count(*)::int as n, round(avg(nota)::numeric, 1) as media from avaliacoes group by 1 order by 1")).rows;
    console.log(ja ? 'já havia avaliações de exemplo: nada inserido' : n + ' avaliações de exemplo inseridas');
    resumo.forEach(r => console.log('  ' + r.pro + ': ' + r.n + ' avaliações, média ' + String(r.media).replace('.', ',')));
    if (DRY) { await c.query('rollback'); console.log('** SIMULAÇÃO (--dry): nada foi gravado **'); } else { await c.query('commit'); console.log('GRAVADO.'); }
  } catch (e) { try { await c.query('rollback'); } catch (x) {} console.error('ERRO, nada gravado:', e.message); process.exitCode = 1; }
  finally { c.release(); await pool.end(); }
})();
