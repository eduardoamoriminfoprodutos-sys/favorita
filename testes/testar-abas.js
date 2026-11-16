// Testa o sistema de verdade: capa, app da cliente e painel do salão em abas separadas, conversando PELO SERVIDOR
// (o pedido da cliente aparece no painel sozinho e a resposta da dona aparece para a cliente sozinha).
// Uso: SALAO_LOGIN=... SALAO_SENHA=... node testar-abas.js <URL base, ex.: http://127.0.0.1:8090/> <pasta para prints>
// Pix (só com o servidor em modo teste): defina também API=<endereço do servidor> e TESTE_KEY=<chave de teste do .env>.
// Os pedidos de teste ficam na cliente "Cliente Teste", WhatsApp (94) 98888-0099.
const { chromium } = require('playwright');
(async () => {
  const [BASE, OUT] = process.argv.slice(2);
  const { SALAO_LOGIN, SALAO_SENHA, API, TESTE_KEY } = process.env;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = [];
  const nova = async url => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ': ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push(url + ': ' + m.text())); await p.goto(BASE + url); await p.waitForTimeout(1500); return p; };
  const ok = (c, m) => console.log((c ? 'OK   ' : 'FALHA') + ' ' + m);
  const ate = async (p, fn, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(fn).catch(() => false)) return true; await p.waitForTimeout(500); } return false; };
  const escolherHorario = async p => {
    for (const d of await p.$$('.wd:not([disabled])')) { await d.click(); let f = await p.$$('.time:not([disabled])'); if (!f.length) { await p.click('[data-turno="tarde"]'); f = await p.$$('.time:not([disabled])'); } if (f.length) { await f[0].click(); return true; } await p.click('[data-turno="manha"]'); }
    return false;
  };

  const capa = await nova('');
  const nomeMarca = await capa.evaluate(() => MARCA.nome);
  ok((await capa.title()).includes(nomeMarca), 'capa com o nome da marca: ' + await capa.title());
  ok(await capa.$eval('#logo', i => i.naturalWidth > 0), 'logo carrega na capa');
  await capa.screenshot({ path: OUT + '/capa.png', fullPage: true });

  const cli = await nova('cliente/');
  await cli.evaluate(() => localStorage.clear()); await cli.reload(); await cli.waitForTimeout(1500);
  ok(await cli.evaluate(() => DADOS.servidor), 'app da cliente fala com o servidor');
  ok(!(await cli.$('.demo')), 'app da cliente sem o botão Ver como');
  ok(await ate(cli, () => !!document.querySelector('.top img') && document.querySelector('.top img').naturalWidth > 0), 'logo carrega no app');
  ok(await cli.evaluate(() => SERVICES.length > 0 && PROS.length > 0), 'catálogo veio do servidor');
  await cli.screenshot({ path: OUT + '/cliente.png' });

  const sal = await nova('salao/');
  ok(!!(await sal.$('#lg-entrar')), 'painel pede login');
  await sal.fill('#lg-login', 'quem-nao-existe'); await sal.fill('#lg-senha', 'senha-errada-123'); await sal.click('#lg-entrar');
  ok(await ate(sal, () => document.getElementById('toast').textContent.includes('incorretos'), 5000), 'senha errada é recusada');
  await sal.fill('#lg-login', SALAO_LOGIN || ''); await sal.fill('#lg-senha', SALAO_SENHA || ''); await sal.click('#lg-entrar');
  ok(await ate(sal, () => !!document.querySelector('[data-tab="financeiro"]')), 'dona entra no painel');
  await sal.screenshot({ path: OUT + '/salao.png' });
  const antes = await sal.evaluate(() => S.bookings.filter(b => b.status === 'aguardando').length);

  // cliente faz pedido pagando no salão
  await cli.click('[data-cat="Unhas"]'); await cli.click('[data-svc="6"]'); await cli.click('#go-agendar');
  ok(await escolherHorario(cli), 'achou horário livre');
  await cli.click('#go-pagar'); await cli.fill('#f-nome', 'Cliente Teste'); await cli.fill('#f-fone', '(94) 98888-0099');
  await cli.click('[data-pay="salao"]'); await cli.click('#enviar');
  ok(await ate(cli, () => S.view === 'acomp' && S.bookings.some(b => b.mine && b.status === 'aguardando') && document.getElementById('root').textContent.includes('Aguardando a confirmação do salão')), 'pedido enviado: tela de acompanhamento "aguardando a confirmação do salão"');
  await cli.screenshot({ path: OUT + '/acompanhar-aguardando.png', fullPage: true });
  const id = await cli.evaluate(() => Math.max(...S.bookings.filter(b => b.mine).map(b => b.id)));
  const chegou = await ate(sal, `S.bookings.some(b => b.id === ${id}) && !!document.querySelector('[data-apr="${id}"]')`);
  ok(chegou, `pedido da cliente chegou no painel sem recarregar (${antes} → ${await sal.evaluate(() => S.bookings.filter(b => b.status === 'aguardando').length)})`);

  // salão aprova e a cliente vê sozinha
  await sal.click(`[data-apr="${id}"]`);
  ok(await ate(sal, `S.lanc.some(l => l.bid === ${id})`), 'aprovar cria o lançamento no Financeiro');
  ok(await ate(cli, () => S.view === 'acomp' && document.getElementById('root').textContent.includes('Agendamento confirmado')), 'a tela de acompanhamento muda sozinha para "Agendamento confirmado"');
  await cli.screenshot({ path: OUT + '/acompanhar-confirmado.png', fullPage: true });
  await cli.click('[data-tab="meus"]');
  ok(await ate(cli, () => document.getElementById('root').textContent.includes('Confirmado')), 'cliente vê o pedido confirmado sem recarregar');
  await cli.reload(); await cli.waitForTimeout(1500); await cli.click('[data-tab="meus"]');
  ok(await ate(cli, () => document.getElementById('root').textContent.includes('Confirmado'), 8000), 'dados continuam depois de recarregar (estão no servidor)');

  // avaliações de exemplo e "concluir atendimento" -> convite para avaliar na volta da cliente
  ok(await cli.evaluate(() => nota1(media(avalDe('ana')))) === '4,8', 'Ana aparece com nota 4,8 no app da cliente: ' + await cli.evaluate(() => nota1(media(avalDe('ana')))));
  ok(await sal.evaluate(() => PROS.some(p => desempenho(p).alerta)), 'painel mostra o alerta de atenção (profissional com avaliações ruins)');
  await sal.evaluate(id => { S.detail = id; render(); }, id);
  ok(!!(await sal.$(`[data-concluir="${id}"]`)), 'resumo do pedido confirmado tem "Concluir atendimento"');
  await sal.click(`[data-concluir="${id}"]`);
  ok(await ate(sal, `S.bookings.some(b => b.id === ${id} && b.status === 'concluido')`), 'dona concluiu o atendimento');
  await sal.evaluate(() => { S.detail = null; render(); });
  ok(await ate(cli, () => !!document.getElementById('av-enviar') && document.querySelector('.sheet').textContent.includes('Como foi com')), 'cliente recebe sozinha o convite para avaliar');
  await cli.screenshot({ path: OUT + '/avaliar.png' });
  await cli.click('[data-nota="5"]'); await cli.click('[data-avtag="Caprichosa"]'); await cli.fill('#av-texto', 'Atendimento de teste: tudo ótimo.');
  await cli.click('#av-enviar');
  ok(await ate(cli, `S.bookings.some(b => b.id === ${id} && b.avaliacao)`), 'avaliação enviada e gravada no servidor');
  ok(await ate(sal, () => S.avaliacoes.some(a => a.texto === 'Atendimento de teste: tudo ótimo.')), 'a avaliação chega no painel da dona');
  await cli.reload(); await cli.waitForTimeout(2000);
  ok(!(await cli.$('#av-enviar')), 'depois de avaliar, o convite não aparece de novo');

  // Pix (modo teste): paga, chega para a dona com comprovante, dona reprova e o Pix volta
  await cli.click('[data-tab="catalogo"]'); await cli.click('[data-cat="Cabelo"]'); await cli.click('[data-svc="2"]'); await cli.click('#go-agendar');
  await escolherHorario(cli); await cli.click('#go-pagar'); await cli.click('[data-pay="pix"]'); await cli.click('#enviar');
  ok(await ate(cli, () => S.view === 'pix' && !!S.pix && document.getElementById('pix-code').textContent.length > 10), 'tela do Pix com o código gerado pelo servidor');
  await cli.screenshot({ path: OUT + '/pix.png', fullPage: true });
  const pixTeste = await cli.evaluate(() => !!(S.pix && S.pix.teste));
  ok(pixTeste ? !!(await cli.$('#simular-pix')) : !(await cli.$('#simular-pix')), pixTeste ? 'Pix em modo teste: botão verde "Simular pagamento Pix"' : 'Pix de verdade: sem botão de simular');
  if (pixTeste) {
    const pid = await cli.evaluate(() => S.pix.bid);
    await cli.click('#simular-pix');
    ok(await ate(cli, `S.view === 'acomp' && S.bookings.some(b => b.id === ${pid} && b.status === 'aguardando' && b.paid)`, 15000), 'simular o Pix: pago e a tela vai para "aguardando a confirmação do salão"');
    ok(await ate(sal, `S.bookings.some(b => b.id === ${pid} && b.paid) && !!document.querySelector('[data-open="${pid}"]')`), 'pedido pago aparece para a dona como Pix pago');
    await sal.click(`[data-open="${pid}"]`); ok(await ate(sal, () => !!document.querySelector('.receipt-thumb')), 'resumo do pedido com o comprovante do Pix');
    await sal.click(`[data-zoom="${pid}"]`); ok(!!(await sal.$('.lightbox')), 'zoom do comprovante'); await sal.screenshot({ path: OUT + '/comprovante.png' }); await sal.click('[data-zclose="1"]');
    await sal.click(`[data-rej="${pid}"]`); await sal.click('[data-motivo="Profissional ausente"]');
    ok(await ate(sal, () => document.querySelector('.status-box') && document.querySelector('.status-box').textContent.includes('Pix devolvido')), 'reprovar devolve o Pix');
    await sal.click('[data-fechar="1"]');
    await cli.click('[data-tab="meus"]');
    ok(await ate(cli, () => document.getElementById('root').textContent.includes('foi devolvido')), 'cliente vê "Não aprovado" e o Pix devolvido');
  } else console.log('-     Pix de verdade: pagamento não simulado');
  for (const p of [capa, cli, sal]) ok(await p.evaluate(() => document.documentElement.scrollWidth) <= 390, 'sem rolagem lateral em ' + p.url());
  console.log('erros:', errs);
  await b.close();
})();
