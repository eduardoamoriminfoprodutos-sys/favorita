// Testa as páginas publicadas: capa, app da cliente e painel do salão em abas separadas que conversam entre si.
// Uso: node testar-abas.js <URL base, ex.: http://localhost:8000/> <pasta para prints>
const { chromium } = require('playwright');
(async () => {
  const [BASE, OUT] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  const nova = async url => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ': ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(url + ': ' + m.text())); await p.goto(BASE + url); await p.waitForTimeout(1200); return p; };
  const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA') + ' ' + m);

  const capa = await nova('');
  const nomeMarca = await capa.evaluate(() => MARCA.nome);
  ok((await capa.title()).includes(nomeMarca), 'capa com o nome da marca: ' + await capa.title());
  ok(await capa.$eval('#logo', i => i.naturalWidth > 0), 'logo carrega na capa');
  await capa.screenshot({ path: OUT + '/capa.png', fullPage: true });

  const cli = await nova('cliente/');
  ok(!(await cli.$('.demo')), 'app da cliente sem o botão Ver como');
  ok(await cli.$eval('.top img', i => i.naturalWidth > 0), 'logo carrega no app');
  await cli.screenshot({ path: OUT + '/cliente.png' });
  const sal = await nova('salao/');
  ok(!!(await sal.$('[data-tab="financeiro"]')), 'painel do salão abre direto no painel');
  const antes = await sal.evaluate(() => S.bookings.filter(b => b.status === 'aguardando').length);

  // cliente faz pedido pagando no salão
  await cli.click('[data-cat="Unhas"]'); await cli.click('[data-svc="6"]'); await cli.click('#go-agendar');
  for (const d of await cli.$$('.wd:not([disabled])')) { await d.click(); let f = await cli.$$('.time:not([disabled])'); if (!f.length) { await cli.click('[data-turno="tarde"]'); f = await cli.$$('.time:not([disabled])'); } if (f.length) { await f[0].click(); break; } await cli.click('[data-turno="manha"]'); }
  await cli.click('#go-pagar'); await cli.fill('#f-nome', 'Cliente Teste'); await cli.fill('#f-fone', '(94) 99999-0000');
  await cli.click('[data-pay="salao"]'); await cli.click('#enviar'); await cli.waitForTimeout(500);
  const depois = await sal.evaluate(() => S.bookings.filter(b => b.status === 'aguardando').length);
  ok(depois === antes + 1, `pedido da cliente chegou no painel sem recarregar (${antes} → ${depois})`);
  await sal.screenshot({ path: OUT + '/salao.png' });

  // salão aprova e a cliente vê
  const id = await sal.evaluate(() => S.bookings.find(b => b.nome === 'Cliente Teste').id);
  await sal.click(`[data-apr="${id}"]`); await sal.waitForTimeout(500);
  await cli.click('[data-tab="meus"]');
  ok((await cli.textContent('#root')).includes('Confirmado'), 'cliente vê o pedido confirmado');
  // recarregar mantém os dados
  await cli.reload(); await cli.waitForTimeout(800); await cli.click('[data-tab="meus"]');
  ok((await cli.textContent('#root')).includes('Confirmado'), 'dados continuam depois de recarregar');
  // zerar pela capa
  await capa.click('#zerar'); await sal.waitForTimeout(1500);   // as abas abertas recarregam sozinhas ao zerar
  ok(!(await sal.evaluate(() => S.bookings.some(b => b.nome === 'Cliente Teste'))), 'zerar demonstração limpa os dados');
  for (const p of [capa, cli, sal]) ok(await p.evaluate(() => document.documentElement.scrollWidth) <= 390, 'sem rolagem lateral em ' + p.url());
  console.log('erros:', errs);
  await b.close();
})();
