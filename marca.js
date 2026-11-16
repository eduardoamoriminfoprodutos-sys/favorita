/* ============================================================
   MARCA DO SALÃO
   Para usar o sistema em outro salão, troque só este arquivo
   e o logo.png (logo escura, fundo transparente). Ver README.md.
   ============================================================ */
window.MARCA = (() => {
  const pasta = new URL(".", document.currentScript.src).href;
  return {
    chave: "favorita",                          // identificador curto, sem espaço (separa os dados de cada salão)
    nome: "Favorita",                           // nome curto, usado em mensagens ("seu horário no Favorita")
    nomeCompleto: "Favorita Beleza e Bem-Estar",
    logo: pasta + "logo.png",                   // logo escura, para fundo claro
    api: "https://api-favorita.lecomigo.tech",  // servidor do salão (na VPS). O app da cliente e o painel falam com ele; a demo/ não usa
    salao: {
      fone: "94991616209",                      // WhatsApp do salão com DDD, só números: (94) 99161-6209
      mapa: "https://maps.google.com/?q=Favorita+Beleza+e+Bem-Estar+Tucurui"   // link do "Como chegar" (EXEMPLO: trocar)
    },
    /* Cores: só coloque aqui as que mudam em relação ao padrão (bege e dourado da Favorita).
       Exemplo para uma marca rosa:
       "--gold": "#B04A6F", "--gold-mid": "#C25A80", "--gold-line": "#D98AA6", "--gold-light": "#F2C4D4",
       "--gold-tint": "#FBEAF0", "--gold-tint-2": "#FDF4F7", "--gold-grad": "linear-gradient(135deg,#D9739A,#A9445F)" */
    cores: {}
  };
})();

/* aplica as cores da marca por cima do padrão */
(() => {
  const r = document.documentElement.style;
  Object.entries(window.MARCA.cores || {}).forEach(([k, v]) => r.setProperty(k, v));
  const fundo = (window.MARCA.cores || {})["--bg"], meta = document.querySelector('meta[name="theme-color"]');
  if (fundo && meta) meta.setAttribute("content", fundo);   /* cor da barra do navegador no celular */
})();
