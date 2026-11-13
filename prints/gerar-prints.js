// Tira print de todas as telas do protótipo Favorita (celular 400x860, retina 2x).
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const S = process.argv[2], OUT = process.argv[3];
  fs.mkdirSync(OUT + '/cliente', { recursive: true }); fs.mkdirSync(OUT + '/salao', { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + S + '/fav-render.html'); await p.waitForTimeout(1500);
  const list = [];
  const hideToast = () => p.evaluate(() => { const t = document.getElementById('toast'); if (t) t.hidden = true; });
  const shot = async (dir, name, desc) => {
    await hideToast(); await p.waitForTimeout(150);
    await p.screenshot({ path: `${OUT}/${dir}/${name}.png` });
    await p.screenshot({ path: `${OUT}/${dir}/${name}-pagina-inteira.png`, fullPage: true });
    list.push([dir, name, desc]);
  };
  const top = () => p.evaluate(() => window.scrollTo(0, 0));

  /* ===== CLIENTE ===== */
  await shot('cliente', '01-catalogo-cabelo', 'Catálogo inicial (sem perfil), categoria Cabelo');
  for (const [c, n] of [['Unhas', '02-catalogo-unhas'], ['Sobrancelha e cílios', '03-catalogo-sobrancelha'], ['Estética', '04-catalogo-estetica']]) {
    await p.click(`[data-cat="${c}"]`); await shot('cliente', n, 'Catálogo, categoria ' + c);
  }
  await p.click('[data-cat="Cabelo"]');
  await p.click('[data-svc="4"]'); await p.evaluate(() => document.querySelector('.opts').scrollIntoView({ block: 'center' }));
  await shot('cliente', '05-catalogo-escolher-opcao', 'Serviço com opções (Selagem): escolher curto, médio ou longo');
  await p.click('[data-addopt="4:1"]'); await p.click('[data-svc="2"]'); await top();
  await shot('cliente', '06-sacola-com-servicos', 'Sacola com 2 serviços: barra inferior com total e tempo');
  await p.click('#go-agendar'); await top();
  await shot('cliente', '07-agendar-profissional', 'Passo 2: cards grandes de profissional (Qualquer uma selecionada)');
  await p.click('[data-pro="ana"]'); const dias = await p.$$('.day'); await dias[2].click();
  const free = await p.$$('.time:not([disabled])'); await free[1].click();
  await p.evaluate(() => document.querySelector('.times').scrollIntoView({ block: 'center' }));
  await shot('cliente', '08-agendar-dia-e-horario', 'Passo 2: profissional, dia e horário escolhidos');
  await p.click('#go-pagar'); await top();
  await shot('cliente', '09-confirmar-sem-perfil', 'Passo 3: resumo + dados (sem perfil ainda) + observação + Pix');
  await p.fill('#f-nome', 'Elika de Brito'); await p.fill('#f-fone', '(94) 99240-9089');
  await p.fill('#f-obs', 'Quero fazer selagem, meu cabelo é muito seco e fino.');
  await p.click('[data-pay="salao"]'); await p.evaluate(() => document.querySelector('.sub').scrollIntoView({ block: 'center' }));
  await shot('cliente', '10-confirmar-pagar-no-salao', 'Passo 3: pagar no salão (cartão de crédito ou dinheiro)');
  await p.click('[data-pay="pix"]');
  await p.click('#enviar'); await top();
  await shot('cliente', '11-pix-qr-e-copia-e-cola', 'Pix: QR, copia e cola, aguardando pagamento');
  await p.click('#simular-pix'); await top();
  await shot('cliente', '12-meus-horarios-aguardando', 'Meus horários: aguardando aprovação do salão');
  await p.click('[data-tab="perfil"]'); await top();
  await shot('cliente', '13-perfil-sem-foto', 'Perfil: nome, WhatsApp, endereço (sem foto)');
  await p.fill('#p-end', 'Rua Bahia, 122, Novo Horizonte');
  await p.setInputFiles('#foto-input', S + '/foto-teste.jpg'); await p.waitForTimeout(500);
  await p.click('#salvar-perfil'); await top();
  await shot('cliente', '14-perfil-com-foto', 'Perfil com foto');
  await p.click('[data-tab="catalogo"]'); await top();
  await shot('cliente', '15-catalogo-com-perfil', 'Catálogo com saudação pelo nome');
  // segundo pedido, pago no salão, para mostrar aprovado e reprovado
  await p.click('[data-cat="Unhas"]'); await p.click('[data-svc="6"]'); await p.click('#go-agendar');
  const d2 = await p.$$('.day'); await d2[3].click(); const f2 = await p.$$('.time:not([disabled])'); await f2[2].click();
  await p.click('#go-pagar'); await top();
  await shot('cliente', '16-confirmar-com-perfil', 'Passo 3 com perfil salvo (foto e dados prontos)');
  await p.click('[data-pay="salao"]'); await p.click('[data-payin="dinheiro"]'); await p.click('#enviar');

  /* ===== SALÃO ===== */
  await p.click('#as-salao'); await top();
  await shot('salao', '01-pedidos-para-aprovar', 'Pedidos: números do dia + pedidos esperando aprovação');
  const id1 = await p.evaluate(() => S.bookings.find(b => b.mine && b.pay === 'pix').id);
  const id2 = await p.evaluate(() => S.bookings.find(b => b.mine && b.pay === 'salao').id);
  await p.click(`[data-open="${id1}"]`); await top();
  await shot('salao', '02-pedido-resumo-pix', 'Resumo do pedido (Pix): cliente com foto, serviço, observação, pagamento, comprovante, mensagens, histórico');
  await p.click(`[data-zoom="${id1}"]`);
  await shot('salao', '03-comprovante-pix', 'Comprovante do Pix em tela cheia');
  await p.click('[data-z="1"]'); await p.click('[data-z="1"]');
  await shot('salao', '04-comprovante-zoom', 'Comprovante com zoom');
  await p.click('[data-zclose="1"]');
  await p.click('[data-apr="1"]'); await top();
  await shot('salao', '05-pedido-aprovado', 'Pedido aprovado');
  await p.click('[data-fechar="1"]'); await p.click(`[data-open="${id2}"]`);
  await p.click('[data-rej="1"]'); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('salao', '06-reprovar-escolher-motivo', 'Reprovar: escolher motivo');
  await p.click('[data-motivo="Horário indisponível"]'); await top();
  await shot('salao', '07-pedido-reprovado', 'Pedido reprovado');
  await p.click('[data-fechar="1"]');
  await p.click('[data-tab="agenda"]'); await top();
  await shot('salao', '08-agenda-do-dia', 'Agenda: atendimentos confirmados por dia');
  await p.click('[data-tab="servicos"]'); await top();
  await shot('salao', '09-servicos-lista', 'Serviços: lista por categoria com chave disponível/pausado');
  await p.click('[data-svcedit="4"]'); await top();
  await shot('salao', '10-servico-editar-com-opcoes', 'Editar serviço (Selagem) com opções de preço e tempo');
  await p.click('#opt-add'); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('salao', '11-servico-nova-opcao', 'Adicionar opção ao serviço');
  await p.click('[data-svcfechar="1"]');
  await p.click('[data-svcedit="novo"]'); await top();
  await shot('salao', '12-servico-novo', 'Novo serviço (em branco)');
  await p.click('[data-svcfechar="1"]');
  await p.click('#abrir-cats'); await top();
  await shot('salao', '13-categorias', 'Categorias: renomear, excluir, adicionar');
  await p.click('[data-catsfechar="1"]');
  await p.click('[data-tab="equipe"]'); await top();
  await shot('salao', '14-equipe', 'Equipe: profissionais com especialidade e expediente');
  await p.click('[data-proedit="novo"]'); await top();
  await shot('salao', '15-profissional-nova', 'Nova profissional: foto, nome, especialidades, descrição, expediente');
  await p.click('[data-profechar="1"]');
  await p.click('[data-proedit="bia"]'); await top();
  await shot('salao', '16-profissional-editar', 'Editar profissional');
  await p.click('[data-delask="1"]'); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('salao', '17-profissional-excluir', 'Excluir profissional (bloqueia se tiver agendamento)');
  await p.click('[data-delcancel="1"]'); await p.click('[data-profechar="1"]');

  /* ===== CLIENTE vê as respostas ===== */
  await p.click('#as-cliente'); await p.click('[data-tab="meus"]'); await top();
  await shot('cliente', '17-meus-horarios-respostas', 'Meus horários: confirmado e não aprovado (com motivo)');

  fs.writeFileSync(OUT + '/lista.json', JSON.stringify(list, null, 1));
  console.log('prints:', list.length, 'erros:', errs);
  await b.close();
})();
