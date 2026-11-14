# Favorita Beleza e Bem-Estar · Sistema de agendamento

Protótipo do app de agendamento do salão Favorita (app da cliente + painel da dona), já no **redesign feito no Claude Design**, e prints de todas as telas.

> Serviços, preços, profissionais, clientes, lançamentos e o comprovante do Pix são **dados de exemplo**.

## Pastas

- `prototipo/index.html`: o protótipo clicável (abre no navegador; botão no topo alterna Cliente e Salão). `prototipo/testar.js` roda 29 testes de ponta a ponta.
- `prints/cliente/` e `prints/salao/`: cada tela em dois arquivos, `NN-nome.png` (tela do celular, 390 × 844, alta resolução) e `NN-nome-pagina-inteira.png`. `prints/gerar-prints.js` refaz todos.
- `Mobile app design project.zip`: o pacote do redesign exportado do Claude Design (handoff com README de tokens).
- `redesign-claude-design/`: as 7 telas do redesign, para comparar com o protótipo.
- `design-original-stitch/`: as 4 telas do primeiro rascunho, no Google Stitch.

A versão anterior dos prints (antes do redesign) continua no histórico do Git.

## App da cliente (13 telas)

| Arquivo | Tela |
|---|---|
| `01-perfil-vazio.png` | Perfil sem dados |
| `02-perfil-com-foto.png` | Perfil com foto e dados |
| `03-catalogo.png` | Catálogo: saudação, categorias, serviços |
| `04-escolher-opcao.png` | Folha para escolher a opção (Selagem curto/médio/longo) |
| `05-sacola-flutuante.png` | Sacola flutuante dourada com 2 serviços |
| `06-catalogo-unhas.png` | Catálogo, categoria Unhas |
| `07-agendar.png` | Agendar: stepper, sacola, profissional, dia, horário |
| `08-agendar-escolhido.png` | Agendar com Ana, dia e horário escolhidos |
| `09-confirmar-pix.png` | Confirmar: resumo, pagamento Pix, observação |
| `10-confirmar-no-salao.png` | Confirmar: no salão, cartão ou dinheiro |
| `11-pix.png` | Pix: valor, QR, copia e cola |
| `12-meus-horarios-aguardando.png` | Meus horários: aguardando salão |
| `13-meus-horarios-respostas.png` | Meus horários: confirmado e não aprovado |

## Painel do salão (14 telas)

| Arquivo | Tela |
|---|---|
| `01-pedidos.png` | Pedidos: números do dia e pedidos para aprovar |
| `02-resumo-do-pedido.png` | Resumo do pedido: cliente, serviço, observação, pagamento, comprovante, mensagens, histórico |
| `03-comprovante-zoom.png` | Comprovante do Pix com zoom |
| `04-reprovar-motivo.png` | Reprovar: folha com motivos |
| `05-pedido-aprovado.png` | Pedido aprovado |
| `06-agenda.png` | Agenda: dias, números, filtro por profissional, linha do tempo |
| `07-financeiro.png` | Financeiro: faturamento do dia, formas, lançamentos |
| `08-fechar-caixa.png` | Fechar caixa: resumo por forma |
| `09-caixa-fechado.png` | Caixa fechado |
| `10-servicos.png` | Serviços por categoria |
| `11-editar-servico.png` | Editar serviço com opções |
| `12-categorias.png` | Categorias |
| `13-equipe.png` | Equipe |
| `14-editar-profissional.png` | Editar profissional: foto, especialidades, horário, cor na agenda |

## Regras do fluxo

- Pagamento: **Pix no app** (Mercado Pago, valor calculado no servidor pela sacola) ou **no salão** (cartão de crédito ou dinheiro).
- **Todo agendamento passa pela aprovação da dona.** Pix só chega para ela depois de pago; se reprovar, o Pix volta para a cliente.
- **Ao aprovar, o pedido vira um lançamento no Financeiro.** A dona fecha o caixa do dia por lá.
- A cliente tem perfil (foto, nome, WhatsApp, endereço) e pode deixar observação no agendamento.
- A confirmar com a dona: cartão e dinheiro entram no Financeiro na aprovação ou só quando o atendimento for concluído.
