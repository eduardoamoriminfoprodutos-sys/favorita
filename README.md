# Sistema de agendamento para salões · Favorita

App da cliente + painel do salão, na marca **Favorita Beleza e Bem-Estar**. Hoje é uma **demonstração que roda só no navegador** (sem servidor): serve para apresentar à dona e validar o fluxo. O mesmo sistema vai ser usado em outros salões trocando só a marca.

> Serviços, preços, profissionais, clientes, lançamentos e o comprovante do Pix são **dados de exemplo**.

## Links (GitHub Pages)

Depois de ligar o GitHub Pages (ver abaixo):

| Página | Endereço |
|---|---|
| Capa da apresentação | `https://eduardoamoriminfoprodutos-sys.github.io/favorita/` |
| App da cliente | `https://eduardoamoriminfoprodutos-sys.github.io/favorita/cliente/` |
| Painel do salão | `https://eduardoamoriminfoprodutos-sys.github.io/favorita/salao/` |
| Os dois na mesma tela | `https://eduardoamoriminfoprodutos-sys.github.io/favorita/demo/` |

**Como apresentar:** abra o app da cliente e o painel do salão em duas abas do mesmo aparelho. O pedido feito no app aparece no painel na hora, e a resposta do salão aparece para a cliente. Os dados ficam guardados no próprio navegador; "Zerar demonstração", na capa, volta tudo ao início.

### Ligar o GitHub Pages

1. No repositório: **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**; em **Branch**, `main` e pasta `/ (root)`; **Save**.
3. Em 1 ou 2 minutos o endereço aparece no topo da mesma página.

**Atenção:** em conta gratuita do GitHub, o Pages só funciona com repositório **público**. Este repositório é privado, então para publicar é preciso **ou** deixar o repositório público (não há senha nem chave aqui, só o protótipo, a marca e os prints) **ou** ter o plano GitHub Pro.

## Como o código está organizado

| Arquivo | O que é |
|---|---|
| `marca.js` | **A marca do salão**: nome, logo, cores, WhatsApp e endereço. É o único arquivo que muda de um salão para outro (junto com o `logo.png`). |
| `logo.png` | Logo escura, fundo transparente (usada no app). `logo-clara.png` é a versão branca. |
| `app/app.js` | Toda a lógica: catálogo e sacola, agendamento, Pix ou pagamento no salão, aprovação, agenda, financeiro, serviços, categorias e equipe. |
| `app/app.css` | Todo o visual (redesign do Claude Design). As cores são variáveis em `:root`. |
| `index.html` | Capa da apresentação. |
| `cliente/`, `salao/`, `demo/` | As três entradas. Cada uma só carrega `marca.js` + `app/` e diz qual modo abrir. |
| `testes/testar.js` | 29 verificações de ponta a ponta na `demo/`. |
| `testes/testar-abas.js` | Verifica capa, app e painel em abas separadas conversando entre si. |
| `prints/` | Prints de todas as telas (`prints/gerar-prints.js` refaz). |
| `redesign-claude-design/`, `Mobile app design project.zip` | O redesign original do Claude Design (referência visual). |
| `design-original-stitch/` | O primeiro rascunho, feito no Google Stitch. |

## Usar em outro salão

1. Copie este repositório para um novo (ex.: `salao-nome-da-marca`).
2. Troque o `logo.png` pela logo do salão (escura, fundo transparente, ~640 px de largura).
3. Em `marca.js`, troque `chave`, `nome`, `nomeCompleto`, `salao.fone`, `salao.mapa` e as `cores` (tirando da paleta da logo; o próprio arquivo traz um exemplo).
4. Troque os serviços, profissionais e categorias de exemplo no começo de `app/app.js` pelos do salão.
5. Ligue o GitHub Pages do repositório novo.

## Rodar os testes

```bash
python3 -m http.server 8000          # na raiz do repositório
npx playwright install chromium      # uma vez
node testes/testar.js http://localhost:8000/demo/ caminho/para/uma-foto.jpg
node testes/testar-abas.js http://localhost:8000/ pasta-para-prints
node prints/gerar-prints.js http://localhost:8000/demo/ caminho/para/uma-foto.jpg prints
```

## Regras do fluxo

- Pagamento: **Pix no app** (Mercado Pago, valor calculado no servidor pela sacola) ou **no salão** (cartão de crédito ou dinheiro).
- **Todo agendamento passa pela aprovação da dona.** Pix só chega para ela depois de pago; se reprovar, o Pix volta para a cliente.
- **Ao aprovar, o pedido vira um lançamento no Financeiro.** A dona fecha o caixa do dia por lá.
- A cliente tem perfil (foto, nome, WhatsApp, endereço) e pode deixar observação no agendamento.
- A confirmar com a dona: cartão e dinheiro entram no Financeiro na aprovação ou só quando o atendimento for concluído.

## O que falta para virar sistema de verdade

Hoje tudo fica no navegador de quem abre. Para uso real: servidor com banco de dados (clientes, agendamentos, serviços, equipe, lançamentos), login da dona, Pix pelo Mercado Pago **na conta do salão** (criar cobrança, webhook, estorno), envio de avisos e hospedagem. O modelo de servidor que já funciona é o do DM Espetinho (mesma lógica de Pix e webhook).
