# Favorita Beleza e Bem-Estar · Sistema de agendamento

Protótipo do app de agendamento do salão Favorita (app da cliente + painel da dona) e **prints de todas as telas**, para servir de base ao redesign.

> Serviços, preços, profissionais, clientes e o comprovante do Pix são **dados de exemplo**.

## Pastas

- `prints/cliente/` e `prints/salao/`: cada tela em dois arquivos. `NN-nome.png` é o que aparece na tela do celular; `NN-nome-pagina-inteira.png` é a tela rolada até o fim. Tamanho de celular (400 × 860, em alta resolução 2x).
- `prototipo/index.html`: o protótipo clicável (abre no navegador; botão no topo alterna Cliente e Salão). Logos da marca na mesma pasta.
- `design-original-stitch/`: as 4 telas que o Google Stitch gerou no começo, antes de adaptar para a Favorita.
- `prints/gerar-prints.js`: roteiro que refaz todos os prints automaticamente (Playwright).

## App da cliente (17 telas)

| Arquivo | Tela |
|---|---|
| `01-catalogo-cabelo.png` | Catálogo inicial (sem perfil), categoria Cabelo |
| `02-catalogo-unhas.png` | Catálogo, categoria Unhas |
| `03-catalogo-sobrancelha.png` | Catálogo, categoria Sobrancelha e cílios |
| `04-catalogo-estetica.png` | Catálogo, categoria Estética |
| `05-catalogo-escolher-opcao.png` | Serviço com opções (Selagem): escolher curto, médio ou longo |
| `06-sacola-com-servicos.png` | Sacola com 2 serviços: barra inferior com total e tempo |
| `07-agendar-profissional.png` | Passo 2: cards grandes de profissional (Qualquer uma selecionada) |
| `08-agendar-dia-e-horario.png` | Passo 2: profissional, dia e horário escolhidos |
| `09-confirmar-sem-perfil.png` | Passo 3: resumo + dados (sem perfil ainda) + observação + Pix |
| `10-confirmar-pagar-no-salao.png` | Passo 3: pagar no salão (cartão de crédito ou dinheiro) |
| `11-pix-qr-e-copia-e-cola.png` | Pix: QR, copia e cola, aguardando pagamento |
| `12-meus-horarios-aguardando.png` | Meus horários: aguardando aprovação do salão |
| `13-perfil-sem-foto.png` | Perfil: nome, WhatsApp, endereço (sem foto) |
| `14-perfil-com-foto.png` | Perfil com foto |
| `15-catalogo-com-perfil.png` | Catálogo com saudação pelo nome |
| `16-confirmar-com-perfil.png` | Passo 3 com perfil salvo (foto e dados prontos) |
| `17-meus-horarios-respostas.png` | Meus horários: confirmado e não aprovado (com motivo) |

## Painel do salão (17 telas)

| Arquivo | Tela |
|---|---|
| `01-pedidos-para-aprovar.png` | Pedidos: números do dia + pedidos esperando aprovação |
| `02-pedido-resumo-pix.png` | Resumo do pedido (Pix): cliente com foto, serviço, observação, pagamento, comprovante, mensagens, histórico |
| `03-comprovante-pix.png` | Comprovante do Pix em tela cheia |
| `04-comprovante-zoom.png` | Comprovante com zoom |
| `05-pedido-aprovado.png` | Pedido aprovado |
| `06-reprovar-escolher-motivo.png` | Reprovar: escolher motivo |
| `07-pedido-reprovado.png` | Pedido reprovado |
| `08-agenda-do-dia.png` | Agenda: atendimentos confirmados por dia |
| `09-servicos-lista.png` | Serviços: lista por categoria com chave disponível/pausado |
| `10-servico-editar-com-opcoes.png` | Editar serviço (Selagem) com opções de preço e tempo |
| `11-servico-nova-opcao.png` | Adicionar opção ao serviço |
| `12-servico-novo.png` | Novo serviço (em branco) |
| `13-categorias.png` | Categorias: renomear, excluir, adicionar |
| `14-equipe.png` | Equipe: profissionais com especialidade e expediente |
| `15-profissional-nova.png` | Nova profissional: foto, nome, especialidades, descrição, expediente |
| `16-profissional-editar.png` | Editar profissional |
| `17-profissional-excluir.png` | Excluir profissional (bloqueia se tiver agendamento) |

## Regras do fluxo (já decididas)

- Pagamento: **Pix no app** (Mercado Pago, valor calculado no servidor pela sacola) ou **no salão** (cartão de crédito ou dinheiro).
- **Todo agendamento passa pela aprovação da dona.** Pix só chega para ela depois de pago; se reprovar, o Pix volta para a cliente.
- A cliente tem perfil (foto, nome, WhatsApp, endereço) e pode deixar observação no agendamento.
