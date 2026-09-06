import { useState, useMemo, useEffect, useRef } from "react";

if (typeof document !== "undefined" && !document.getElementById("tdv-font")) {
  const l = document.createElement("link"); l.id = "tdv-font";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&display=swap";
  document.head.appendChild(l);
}

const SEU_WHATSAPP  = "16478634945";
const TAXA_ENTREGA  = 8.0;
const PRECO_100G    = 4.0;
const TEMPO_ENT     = 45;
const TEMPO_RET     = 25;
const GORJETAS      = [0,5,10,15];
const DIAS_ENVIO    = [6,1,3];
const HORA_PRAZO    = 10;

const PRATOS_BASE = [
  {id:"p1",nome:"Frango grelhado",desc:"Arroz, feijão, salada e frango grelhado ao molho.",preco:35,icon:"frango"},
  {id:"p2",nome:"Bife acebolado", desc:"Arroz, feijão, salada e bife acebolado.",          preco:35,icon:"carne"},
];

const CARDAPIO = {
  carne:[
    {id:"bife_aceb",       nome:"Bife acebolado",                         icon:"carne"},
    {id:"frango_temp",     nome:"Frango temperado / carne da panela",     icon:"frango"},
    {id:"peito_grelhado",  nome:"Peito de frango grelhado",               icon:"frango"},
    {id:"bife_vermelho",   nome:"Bife ao molho vermelho / legumes",       icon:"carne"},
    {id:"figado",          nome:"Bife de fígado ao boi",                  icon:"carne"},
    {id:"frango_batata",   nome:"Frango ao molho c/ batata e cenoura",    icon:"frango"},
    {id:"porco_aceb",      nome:"Básica de porco acebolado",              icon:"costela"},
    {id:"strog_carne",     nome:"Strogonoff de carne / batata palha",     icon:"carne"},
    {id:"strog_frango",    nome:"Strogonoff de frango / batata palha",    icon:"frango"},
    {id:"almondega",       nome:"Almôndega ao molho vermelho acebolado",  icon:"carne"},
    {id:"picadinho",       nome:"Picadinho de bife c/ pimentões",         icon:"carne"},
    {id:"costelinha",      nome:"Costelinha de porco acebolada ao molho", icon:"costela"},
    {id:"costela_mand",    nome:"Costela de boi c/ mandioca",             icon:"costela"},
    {id:"carne_moida",     nome:"Carne moída ao molho vermelho",          icon:"carne"},
    {id:"carne_panela",    nome:"Carne da panela c/ batata e cenoura",    icon:"carne"},
    {id:"frango_quiabo",   nome:"Coxas de frango com quiabo",             icon:"frango"},
    {id:"linguicinha",     nome:"Linguicinha acebolada",                  icon:"linguica"},
    {id:"arroz_temp",      nome:"Arroz temperado c/ bacon e calabresa",   icon:"linguica"},
    {id:"frango_assado",   nome:"Frango assado",                          icon:"frango"},
    {id:"lombo",           nome:"Lombo de porco acebolado",               icon:"costela"},
    {id:"bife_empanado",   nome:"Bife / frango empanado",                 icon:"carne"},
    {id:"rocambole",       nome:"Rocambole de carne moída",               icon:"carne"},
    {id:"carne_abobora",   nome:"Carne moída c/ abóbora cabotiã",         icon:"carne"},
    {id:"galinhada",       nome:"Galinhada",                              icon:"frango"},
    {id:"escond_carne",    nome:"Escondidinho de mandioca c/ carne",      icon:"carne"},
    {id:"escond_frango",   nome:"Escondidinho de mandioca c/ frango",     icon:"frango"},
    {id:"mac_carne",       nome:"Macarronada carne moída",                icon:"carne"},
    {id:"lasanha_bol",     nome:"Lasanha à bolonhesa",                    icon:"carne"},
    {id:"mac_almondega",   nome:"Macarronado c/ almôndegas acebolado",    icon:"carne"},
  ],
  veg:[
    {id:"berinjela",       nome:"Berinjela acebolada",                    icon:"veg"},
    {id:"lasanha_branco",  nome:"Lasanha presunto e queijo",              icon:"veg"},
    {id:"mac_alfredo",     nome:"Macarronada ao molho alfredo",           icon:"veg"},
    {id:"pure_molho",      nome:"Purê ao molho",                          icon:"veg"},
    {id:"pure_empanado",   nome:"Purê empanado",                          icon:"veg"},
    {id:"caldo_mandioca",  nome:"Caldo de mandioca",                      icon:"veg"},
    {id:"caldo_abobora",   nome:"Caldo de abóbora cabotiã",               icon:"veg"},
  ],
};

const T = {
  pt:{
    langBtn:"EN",langOther:"en",
    nav:["Cardápio","Carrinho","Pedidos","Especial","Feedback","Cozinha","Caixa"],
    sub:"COMIDA CASEIRA · GI TORRES",
    heroTit:"Marmita do dia",heroBase:"Base inclusa em todas as marmitas:",
    arroz:"Arroz",feijao:"Feijão",salada:"Salada / Legumes",
    pratosDia:"🥩 Pratos do dia",
    prazoLabel:"para escolher",prazoOff:"🔒 Prazo encerrado",
    prazoMsg:"Prazo encerrado. Prato definido pela cozinha:",
    segunda:"2ª opção",
    extra:"🥩 Carne extra",extraPor:"por 100g",extraInfo:"a mais",
    obsPh:"Observações (sem cebola, pouco sal...)",obsSave:"Salvar",obsCancel:"Cancelar",
    votTit:"Escolha o prato da próxima semana",votOff:"🔒 Escolha encerrada",
    votSub:"Vote em um dos pratos disponíveis para a próxima semana",
    votPrazo:"Prazo:",votado:"✓ Votado",
    votObrig:"Obrigada pelo voto! A cozinha vai adorar saber 💛",
    votMsg:"O prazo encerrou. A cozinha definiu o prato com base na votação:",
    vazio:"Carrinho vazio",vazioPh:"Escolha no cardápio.",
    pedir:"Pedir pelo WhatsApp 💬",
    subtotal:"Subtotal",freteLabel:"Taxa de entrega",gorjetaLabel:"💛 Gorjeta",
    semGorjeta:"Nenhuma",totalLabel:"Total",gratis:"Grátis",
    confirmarTit:"Confirmar pedido",nomeLabel:"Seu nome",nomePh:"Ex: Maria",
    telLabel:"Telefone",telPh:"(647) 000-0000",
    pagLabel:"Pagamento",tipoLabel:"Tipo de entrega",endLabel:"Endereço",endPh:"123 Main St, Apt 4, Toronto, ON M5V 1A1",
    pEt:"e-Transfer",pDin:"Dinheiro",pCart:"Cartão",
    tEnt:"🛵 Entrega",tRet:"🏠 Retirada",
    confirmarBtn:"Confirmar e enviar pedido ✓",
    eNome:"Preencha nome e telefone.",eEnd:"Preencha o endereço completo (rua, cidade, província e CEP).",
    eCart:"Carrinho vazio.",eAl:"⚠️ Responda a pergunta sobre alergias para continuar.",
    eAlDesc:"Descreva a alergia para continuar.",
    alTit:"⚠️ Você tem alergia a algum ingrediente ou tempero?",
    alSub:"Resposta obrigatória para sua segurança.",
    alNao:"✅ Não tenho alergias",alSim:"🚨 Tenho alergia",
    alDescLabel:"Descreva sua alergia (obrigatório):",
    alPh:"Ex: alérgico a amendoim, intolerante a lactose...",
    alAviso:"ALERGIA — ATENÇÃO ANTES DE PREPARAR",
    pedRec:"Pedidos recebidos",nenhumPed:"Nenhum pedido ainda",
    prevLabel:"⏱ Previsão:",
    badEnt:"✅ Entregue",badPago:"💳 Pago",badPend:"⏳ Pagamento pendente",badComent:"💬 Comentário",
    ciente:"🚨 Confirmar: ciente da alergia — pode preparar",
    cienteOk:"✅ Ciente da alergia — pedido pode ser preparado",
    marcarEnt:"✅ Marcar entregue",confirmarPag:"💳 Confirmar pagamento",naoPago:"⏳ Ainda não pago",
    pedConf:"Pedido confirmado!",envConf:"Enviar confirmação ao cliente 💬",fechar:"Fechar",
    espTit:"⭐ Prato Especial",
    espDesc:"Nenhuma das opções do dia te agrada? Solicite um prato especial! Descreva o que você gostaria e a cozinha vai verificar a disponibilidade e enviar o valor.",
    espAviso:"⏱ Sujeito à disponibilidade. A cozinha responderá pelo WhatsApp.",
    espFazer:"Fazer solicitação",espNome:"Seu nome",espTel:"Telefone (para retorno)",
    espPed:"O que você gostaria? 🍽️",espPedPh:"Ex: Arroz, feijão e tilápia grelhada...",
    espObs:"Observações (opcional)",espObsPh:"Ex: sem sal, porção maior...",
    espEnviar:"⭐ Enviar solicitação pelo WhatsApp",espHist:"Suas solicitações",
    espAg:"⏳ Aguardando resposta da cozinha...",espAcei:"✅ Aceito pela cozinha!",
    espRec:"❌ Não disponível hoje",espENome:"Preencha nome e telefone.",espEDesc:"Descreva o que você gostaria.",
    fbTit:"Comentários e sugestões",fbVazio:"Nenhum pedido ainda",
    fbVazioPh:"Faça um pedido para deixar seu comentário.",
    fbSeu:"Seu comentário:",fbEdit:"✏️ Editar",
    fbPh:"Conte como foi sua experiência, sugestões de pratos, etc...",
    fbEnv:"Enviar",fbCancel:"Cancelar",fbBtn:"💬 Deixar comentário ou sugestão",
    caixaTit:"💰 Relatório financeiro do dia",
    cBruto:"Total bruto",cReceb:"Recebido",cAReceb:"A receber",cGorj:"Gorjetas",
    cComp:"Composição do dia",cPratos:"Pratos",cFrete:"Taxa de entrega",cTotal:"Total",
    cNaoPag:"⏳ Entregues mas não pagos",cNaoEnt:"🛵 Pedidos ainda não entregues",
    cMarcarPago:"Marcar pago",cNenhum:"Nenhum pedido hoje",
    cozTit:"⚙️ Menu do dia",cozPratos:"Pratos de hoje",cozSub:"Toque editar para trocar",
    cozEdit:"✏️ Editar",prazoTit:"Prazo de escolha",prazoEnc:"Encerrado — prato definido pela votação",
    calc:"Calculando...",votosLabel:"Votos",rankTit:"🗳️ Votos por prato",
    rankVazio:"Nenhum voto ainda.\nOs clientes votam no cardápio.",pratoFixo:"PRATO FIXO",
    espCozTit:"⭐ Solicitações de prato especial",espCozVazio:"Nenhuma solicitação ainda.",
    espResp:"Responder ao cliente:",espValor:"Valor do prato (CA$)",
    espMsgOpc:"Mensagem (opcional — ex: pronto às 12h)",
    espAceitarBtn:"✅ Aceitar e notificar",espRecusarBtn:"❌ Recusar",
    avisoAtivo:"Aviso ativo",
    lembrTit:"🔔 Hora de enviar o menu aos clientes!",
    lembrSub:"Hoje é dia de notificar os clientes com os 2 pratos disponíveis. Eles têm até amanhã às 10h para escolher.",
    lembrBtn:"📤 Enviar menu do dia agora",
    cliTit:"📲 Enviar menu aos clientes",cliVazio:"Nenhum cliente ainda",
    cliVazioPh:"Aparecem automaticamente após o 1º pedido.",cliEnvTodos:"📤 Enviar menu para todos",
    cliEnvBtn:"Enviar ↗",cliEnviando:"Enviando para",cliToque:"toque em \"Enviar ↗\"",
    cliTodos:"✅ Todos receberam o menu!",cliFechar:"Fechar",
    editTit:"Menu do dia",editDef:"Defina os 2 pratos de hoje:",editPrato:"Prato",
    editDesc:"Descrição",editPreco:"Preço CA$",editSalvar:"Salvar menu do dia ✓",
    avisoTit:"⚠️ Aviso do dia (opcional)",
    avisoSub:"Use para informar clientes sobre ingredientes alternativos, substituições ou mudanças especiais desta semana.",
    avisoPh:"Ex: Esta semana o frango virá com molho de maracujá em vez do tradicional.",
    avisoLimpar:"✕ Limpar aviso",
    cardapioBtn:"📋 Cardápio completo",
    cComCarne:"🥩 Com carne",cSemCarne:"🥦 Sem carne",
    cBase:"🍱 Base de todas as marmitas",cPag:"💳 Pagamento",cEnt:"🛵 Entrega",
  },
  en:{
    langBtn:"PT",langOther:"pt",
    nav:["Menu","Cart","Orders","Special","Reviews","Kitchen","Finance"],
    sub:"HOME COOKING · GI TORRES",
    heroTit:"Meal of the day",heroBase:"Included in every meal:",
    arroz:"Rice",feijao:"Beans",salada:"Salad / Veggies",
    pratosDia:"🥩 Today's dishes",
    prazoLabel:"left to choose",prazoOff:"🔒 Deadline passed",
    prazoMsg:"Deadline passed. Today's dish set by the kitchen:",
    segunda:"2nd option",
    extra:"🥩 Extra meat",extraPor:"per 100g",extraInfo:"extra",
    obsPh:"Notes (no onion, less salt...)",obsSave:"Save",obsCancel:"Cancel",
    votTit:"Choose next week's dish",votOff:"🔒 Voting closed",
    votSub:"Vote for one of the available dishes for next week",
    votPrazo:"Deadline:",votado:"✓ Voted",
    votObrig:"Thanks for voting! The kitchen will love to know 💛",
    votMsg:"Voting closed. The kitchen set the dish based on votes:",
    vazio:"Cart is empty",vazioPh:"Choose from the menu.",
    pedir:"Order via WhatsApp 💬",
    subtotal:"Subtotal",freteLabel:"Delivery fee",gorjetaLabel:"💛 Tip",
    semGorjeta:"No tip",totalLabel:"Total",gratis:"Free",
    confirmarTit:"Confirm order",nomeLabel:"Your name",nomePh:"Ex: Maria",
    telLabel:"Phone",telPh:"(647) 999-9999",
    pagLabel:"Payment",tipoLabel:"Delivery type",endLabel:"Address",endPh:"123 Main St, Apt 4, Toronto, ON M5V 1A1",
    pEt:"e-Transfer",pDin:"Cash",pCart:"Card",
    tEnt:"🛵 Delivery",tRet:"🏠 Pick up",
    confirmarBtn:"Confirm and send order ✓",
    eNome:"Fill in name and phone.",eEnd:"Please fill in the complete address (street, city, province and postal code).",
    eCart:"Cart is empty.",eAl:"⚠️ Answer the allergy question to continue.",
    eAlDesc:"Describe your allergy to continue.",
    alTit:"⚠️ Do you have any food allergies or sensitivities?",
    alSub:"Required for your safety.",
    alNao:"✅ No allergies",alSim:"🚨 I have an allergy",
    alDescLabel:"Describe your allergy (required):",
    alPh:"Ex: peanut allergy, lactose intolerant, gluten allergy...",
    alAviso:"ALLERGY — READ BEFORE PREPARING",
    pedRec:"Orders received",nenhumPed:"No orders yet",
    prevLabel:"⏱ ETA:",
    badEnt:"✅ Delivered",badPago:"💳 Paid",badPend:"⏳ Payment pending",badComent:"💬 Review",
    ciente:"🚨 Confirm: allergy noted — can prepare",
    cienteOk:"✅ Allergy noted — order can be prepared",
    marcarEnt:"✅ Mark as delivered",confirmarPag:"💳 Confirm payment",naoPago:"⏳ Not paid yet",
    pedConf:"Order confirmed!",envConf:"Send confirmation to client 💬",fechar:"Close",
    espTit:"⭐ Special Dish",
    espDesc:"None of today's options work for you? Request a special dish! Describe what you'd like and the kitchen will check availability and send you the price.",
    espAviso:"⏱ Subject to availability. The kitchen will reply via WhatsApp.",
    espFazer:"Make a request",espNome:"Your name",espTel:"Phone (for follow-up)",
    espPed:"What would you like? 🍽️",espPedPh:"Ex: Rice, beans and grilled tilapia...",
    espObs:"Additional notes (optional)",espObsPh:"Ex: no salt, larger portion...",
    espEnviar:"⭐ Send request via WhatsApp",espHist:"Your requests",
    espAg:"⏳ Waiting for kitchen response...",espAcei:"✅ Accepted by the kitchen!",
    espRec:"❌ Not available today",espENome:"Fill in name and phone.",espEDesc:"Describe what you'd like.",
    fbTit:"Reviews and suggestions",fbVazio:"No orders yet",
    fbVazioPh:"Place an order to leave a review.",
    fbSeu:"Your review:",fbEdit:"✏️ Edit",
    fbPh:"Tell us about your experience, dish suggestions, etc...",
    fbEnv:"Send",fbCancel:"Cancel",fbBtn:"💬 Leave a review or suggestion",
    caixaTit:"💰 Daily financial report",
    cBruto:"Gross total",cReceb:"Received",cAReceb:"Outstanding",cGorj:"Tips",
    cComp:"Breakdown",cPratos:"Dishes",cFrete:"Delivery fee",cTotal:"Total",
    cNaoPag:"⏳ Delivered but not paid",cNaoEnt:"🛵 Not yet delivered",
    cMarcarPago:"Mark as paid",cNenhum:"No orders today",
    cozTit:"⚙️ Today's menu",cozPratos:"Today's dishes",cozSub:"Tap edit to change",
    cozEdit:"✏️ Edit",prazoTit:"Voting deadline",prazoEnc:"Closed — dish set by vote count",
    calc:"Calculating...",votosLabel:"Votes",rankTit:"🗳️ Votes per dish",
    rankVazio:"No votes yet.\nClients vote in the menu.",pratoFixo:"TODAY'S DISH",
    espCozTit:"⭐ Special dish requests",espCozVazio:"No requests yet.",
    espResp:"Reply to client:",espValor:"Dish price (CA$)",
    espMsgOpc:"Message (optional — ex: ready by 12pm)",
    espAceitarBtn:"✅ Accept and notify",espRecusarBtn:"❌ Decline",
    avisoAtivo:"Active notice",
    lembrTit:"🔔 Time to send today's menu!",
    lembrSub:"Today is the day to notify clients with the 2 available dishes. They have until tomorrow at 10am to choose.",
    lembrBtn:"📤 Send today's menu now",
    cliTit:"📲 Send menu to clients",cliVazio:"No clients yet",
    cliVazioPh:"They appear automatically after the 1st order.",cliEnvTodos:"📤 Send menu to everyone",
    cliEnvBtn:"Send ↗",cliEnviando:"Sending to",cliToque:"tap \"Send ↗\"",
    cliTodos:"✅ Everyone received the menu!",cliFechar:"Close",
    editTit:"Today's menu",editDef:"Set today's 2 dishes:",editPrato:"Dish",
    editDesc:"Description",editPreco:"Price CA$",editSalvar:"Save today's menu ✓",
    avisoTit:"⚠️ Daily notice (optional)",
    avisoSub:"Use this to inform clients about alternative ingredients, substitutions or special changes this week.",
    avisoPh:"Ex: This week the chicken will come with passion fruit sauce instead of traditional.",
    avisoLimpar:"✕ Clear notice",
    cardapioBtn:"📋 Full menu",
    cComCarne:"🥩 With meat",cSemCarne:"🥦 No meat",
    cBase:"🍱 Included in every meal",cPag:"💳 Payment",cEnt:"🛵 Delivery",
  },
};
};

const fmt = v => `CA$ ${(Number(v)||0).toFixed(2)}`;
function fmtTel(val) {
  const d = val.replace(/\D/g,"").slice(0,10);
  if (d.length<=3)  return d.length?`(${d}`:"";
  if (d.length<=6)  return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
const horaEst = min => { const d = new Date(Date.now()+min*60000); return d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); };
function beep() { try { const c=new(window.AudioContext||window.webkitAudioContext)(); [0,.15,.3].forEach((t,i)=>{ const o=c.createOscillator(),g=c.createGain(); o.connect(g);g.connect(c.destination); o.frequency.value=880-i*80; g.gain.setValueAtTime(.4,c.currentTime+t); g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t+.6); o.start(c.currentTime+t);o.stop(c.currentTime+t+.6); }); } catch(_){} }

// ── Prazo de votação ─────────────────────────────────────────────────────────
// Abre: Domingo às 12h (meio dia)
// Fecha: Sexta-feira às 18h (6 da tarde)
// Horário de Toronto (America/Toronto = EST/EDT)

function getTorontoDate() {
  // Converte hora atual para Toronto
  const now = new Date();
  const toronto = new Date(now.toLocaleString("en-US", {timeZone:"America/Toronto"}));
  return toronto;
}

function calcPrazo() {
  const now = getTorontoDate();
  const d = now.getDay(); // 0=Dom, 5=Sex
  const h = now.getHours();
  const m = now.getMinutes();

  // Próxima sexta às 18h
  let prazo = new Date(now);
  // Quantos dias até sexta (5)?
  let diasAteSex = (5 - d + 7) % 7;
  // Se já é sexta e ainda não são 18h, prazo é hoje às 18h
  if (d === 5 && (h < 18 || (h === 18 && m === 0))) diasAteSex = 0;
  // Se é sexta após 18h, próxima sexta = 7 dias
  if (d === 5 && h >= 18) diasAteSex = 7;
  
  prazo.setDate(prazo.getDate() + diasAteSex);
  prazo.setHours(18, 0, 0, 0);
  return prazo;
}

function votacaoAberta() {
  const now = getTorontoDate();
  const d = now.getDay();
  const h = now.getHours();
  // Aberto de domingo (0) meio dia até sexta (5) às 18h
  if (d === 0 && h >= 12) return true; // domingo após 12h
  if (d >= 1 && d <= 4) return true;   // segunda a quinta
  if (d === 5 && h < 18) return true;  // sexta antes das 18h
  return false;
}

const prazoExpirou = () => !votacaoAberta();

function tempoRestante() {
  if (!votacaoAberta()) return null;
  const diff = calcPrazo() - getTorontoDate();
  if (diff <= 0) return null;
  const dias = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (dias > 0) return `${dias}d ${h}h`;
  return `${h}h ${m}min`;
}

// Lembrete: domingo às 12h (hora de abrir a votação e avisar clientes)
const deveEnviarLembrete = () => {
  const now = getTorontoDate();
  return now.getDay() === 0 && now.getHours() >= 12 && now.getHours() < 13;
};

const pratoMaisVotado = (votos,pratos) => { if(!pratos?.length) return null; return pratos.reduce((best,p)=>(votos[p.id]||0)>(votos[best.id]||0)?p:best,pratos[0]); };

const P=`#0A0A0A`,O=`#C9A84C`,OE=`#7A5A1A`,CR=`#F5EDD5`,CA=`#1A1408`,TI=`#F5EDD5`,MU=`#9A8050`,BO=`#3A2E10`,BL=`#C9A84C44`,VE=`#25D366`;

const IcoPanel = ({size=44})=>(
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="10" y="26" width="28" height="18" rx="4" stroke={O} strokeWidth="2" fill="none"/>
    <path d="M10,34 Q4,34 4,40 Q4,46 10,46" stroke={O} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M38,34 Q44,34 44,40 Q44,46 38,46" stroke={O} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <ellipse cx="24" cy="26" rx="15" ry="4" stroke={O} strokeWidth="2" fill="none"/>
    <ellipse cx="24" cy="22" rx="10" ry="3" stroke={O} strokeWidth="1.5" fill="none"/>
    <rect x="19" y="18" width="10" height="4" rx="2" stroke={O} strokeWidth="1.5" fill="none"/>
    <path d="M18,17 Q16,11 18,5" stroke={O} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M24,16 Q22,10 24,4" stroke={O} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M30,17 Q28,11 30,5" stroke={O} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const Marmita = ({size=80})=>(
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <ellipse cx="40" cy="22" rx="28" ry="7" fill="#D4956A"/><ellipse cx="40" cy="20" rx="28" ry="7" fill="#E8A87C"/>
    <rect x="35" y="13" width="10" height="5" rx="2" fill="#C07A50"/>
    <rect x="12" y="22" width="56" height="32" rx="6" fill="#F2C49B"/><rect x="12" y="22" width="56" height="10" fill="#E8A87C"/>
    <ellipse cx="28" cy="42" rx="10" ry="7" fill="#FFFDF5"/>
    <ellipse cx="50" cy="40" rx="7" ry="5" fill="#7D4535"/>
    <ellipse cx="38" cy="50" rx="8" ry="4" fill="#6BA060"/>
    <rect x="8" y="28" width="4" height="14" rx="2" fill="#C07A50"/><rect x="68" y="28" width="4" height="14" rx="2" fill="#C07A50"/>
  </svg>
);
const IcoArroz = ({size=40})=>(
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="28" rx="16" ry="5" fill="#E8D5B0"/>
    <ellipse cx="20" cy="22" rx="14" ry="9" fill="#FFFDF5"/>
    <ellipse cx="15" cy="20" rx="3" ry="2" fill="#F0EBD8"/>
    <ellipse cx="22" cy="18" rx="3" ry="2" fill="#F0EBD8"/>
    <ellipse cx="19" cy="24" rx="3" ry="2" fill="#F0EBD8"/>
  </svg>
);
const IcoFeijao = ({size=40})=>(
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="28" rx="14" ry="5" fill="#E8D5B0"/>
    <ellipse cx="20" cy="22" rx="13" ry="8" fill="#7D4535"/>
    <ellipse cx="16" cy="20" rx="3.5" ry="2.5" fill="#6B3A2A"/>
    <ellipse cx="22" cy="23" rx="3.5" ry="2.5" fill="#6B3A2A"/>
  </svg>
);
const IcoSalada = ({size=40})=>(
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <ellipse cx="20" cy="30" rx="14" ry="5" fill="#E8D5B0"/>
    <ellipse cx="14" cy="24" rx="7" ry="5" fill="#6BA060"/>
    <ellipse cx="26" cy="22" rx="7" ry="5" fill="#82C074"/>
    <ellipse cx="20" cy="26" rx="7" ry="5" fill="#5D9152"/>
    <circle cx="18" cy="20" r="3" fill="#E85454"/>
  </svg>
);
const IcoCarne = ({size=44,tipo="carne"})=>{
  if(tipo==="frango"||tipo==="veg") return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="44" rx="22" ry="7" fill="#F5E8CC"/>
      <ellipse cx="28" cy="30" rx="14" ry="11" fill="#D4813A"/>
      <ellipse cx="28" cy="28" rx="12" ry="9" fill="#E8963F"/>
      <rect x="34" y="20" width="3" height="14" rx="1.5" fill="#F0DEB0"/>
    </svg>
  );
  if(tipo==="costela") return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="44" rx="22" ry="7" fill="#F5E8CC"/>
      <rect x="14" y="24" width="28" height="16" rx="4" fill="#8B3E24"/>
      <rect x="18" y="18" width="4" height="14" rx="2" fill="#F0DEB0"/>
      <rect x="26" y="16" width="4" height="16" rx="2" fill="#F0DEB0"/>
      <rect x="34" y="18" width="4" height="14" rx="2" fill="#F0DEB0"/>
    </svg>
  );
  if(tipo==="linguica") return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="44" rx="22" ry="7" fill="#F5E8CC"/>
      <ellipse cx="20" cy="30" rx="8" ry="5" fill="#8B2E10" transform="rotate(-20 20 30)"/>
      <ellipse cx="36" cy="28" rx="8" ry="5" fill="#8B2E10" transform="rotate(20 36 28)"/>
      <ellipse cx="28" cy="33" rx="8" ry="5" fill="#A83820"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="44" rx="22" ry="7" fill="#F5E8CC"/>
      <ellipse cx="28" cy="30" rx="15" ry="10" fill="#7A3520"/>
      <ellipse cx="27" cy="28" rx="13" ry="8" fill="#9B4A2A"/>
    </svg>
  );
};

function Tab({icon,label,ativo,onClick,badge}) {
  return (
    <button onClick={onClick} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,border:"none",background:"transparent",padding:"5px 0",color:ativo?O:MU,cursor:"pointer"}}>
      <span style={{position:"relative",fontSize:16}}>
        {icon}
        {badge>0&&<span style={{position:"absolute",top:-5,right:-8,background:O,color:P,fontSize:8,borderRadius:8,padding:"1px 4px",fontWeight:700}}>{badge}</span>}
      </span>
      <span style={{fontSize:9}}>{label}</span>
    </button>
  );
}

function ObsPanel({val,onSave,onClose,t}) {
  const [txt,setTxt]=useState(val);
  return (
    <div>
      <textarea autoFocus rows={2} value={txt} onChange={e=>setTxt(e.target.value)} placeholder={t.obsPh}
        style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${BL}`,fontSize:13,fontFamily:"inherit",color:"#2A1F00",background:"#FBF6EA",resize:"none",boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:8,marginTop:6}}>
        <button style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",background:O,color:P,fontSize:12.5,fontWeight:700,cursor:"pointer"}} onClick={()=>onSave(txt)}>{t.obsSave}</button>
        <button style={{flex:1,padding:"7px 0",borderRadius:8,border:`1px solid ${BL}`,background:"transparent",fontSize:12.5,cursor:"pointer",color:MU}} onClick={onClose}>{t.obsCancel}</button>
      </div>
    </div>
  );
}

export default function App() {
  const [lang,setLang]       = useState("pt");
  const t                    = T[lang];
  const [cozinhaVisivel,setCozinhaVisivel] = useState(false);
  const [pinAberto,setPinAberto]           = useState(false);
  const [pinInput,setPinInput]             = useState("");
  const [pinErro,setPinErro]               = useState("");
  const PIN_COZINHA = "1984";

  function abrirPin() { setPinAberto(true); setPinInput(""); setPinErro(""); }
  function digitarPin(d) {
    const novo = pinInput + d;
    setPinInput(novo);
    if (novo.length === 4) {
      if (novo === PIN_COZINHA) {
        setPinAberto(false);
        setCozinhaVisivel(true);
        setAba("cozinha");
        setCozinhaAuth(false);
        setSenhaInput("");
        setSenhaErro("");
        setPinInput("");
        setPinErro("");
      } else {
        setPinErro("PIN incorreto");
        setTimeout(() => { setPinInput(""); setPinErro(""); }, 1000);
      }
    }
  }
  const [cozinhaAuth,setCozinhaAuth]   = useState(false);
  const [senhaInput,setSenhaInput]     = useState("");
  const [senhaErro,setSenhaErro]       = useState("");
  const [trocandoSenha,setTrocandoSenha] = useState(false);
  const [senhaAtual,setSenhaAtual]     = useState("");
  const [senhaNova,setSenhaNova]       = useState("");
  const [senhaConfirm,setSenhaConfirm] = useState("");
  const [senhaMsg,setSenhaMsg]         = useState("");
  const SENHA_KEY = "tdv_senha";
  function getSenha() { try { return localStorage.getItem(SENHA_KEY)||"Gitorres11121984"; } catch(_){ return "Gitorres11121984"; } }
  function setSenha(s) { try { localStorage.setItem(SENHA_KEY,s); } catch(_){} }
  const [menuDia,setMenuDia] = useState({pratos:PRATOS_BASE,aviso:""});
  const PRATOS               = menuDia.pratos;
  const [editando,setEditando]   = useState(false);
  const [menuTemp,setMenuTemp]   = useState(null);
  const [aba,setAba]             = useState("cardapio");
  const [carrinho,setCarrinho]   = useState({});
  const [obs,setObs]             = useState({});
  const [obsAberto,setObsAberto] = useState(null);
  const [extra,setExtra]         = useState({});
  const [pedidos,setPedidos]     = useState([]);
  const [clientes,setClientes]   = useState([]);
  const [especiais,setEspeciais] = useState([]);
  const [form,setForm]           = useState({nome:"",tel:"",tipo:"entrega",end:"",endCity:"",endProv:"",endCep:"",pag:"etransfer",alergia:null,alergiaDesc:""});
  const [especForm,setEspecForm] = useState({nome:"",tel:"",desc:"",obs:""});
  const [especErro,setEspecErro] = useState("");
  const [gorjeta,setGorjeta]     = useState(0);
  const [erro,setErro]           = useState("");
  const [checkout,setCheckout]   = useState(false);
  const [alerta,setAlerta]       = useState(null);
  const [confirm,setConfirm]     = useState(null);
  const [novos,setNovos]         = useState(0);
  const [votos,setVotos]         = useState({});
  const [votoFeito,setVotoFeito] = useState(null);
  const [cardapioOpen,setCardapioOpen] = useState(false);
  const [enviando,setEnviando]   = useState(null);
  const [fbAberto,setFbAberto]   = useState(null);
  const [fbTxt,setFbTxt]         = useState("");
  // eslint-disable-next-line no-unused-vars
  const [tick,setTick]           = useState(0);
  const prev = useRef(0);

  useEffect(()=>{ const id=setInterval(()=>setTick(n=>n+1),60000); return()=>clearInterval(id); },[]);
  useEffect(()=>{ if(pedidos.length>prev.current){beep();try{navigator.vibrate&&navigator.vibrate([200,100,200]);}catch(_){}} prev.current=pedidos.length; },[pedidos.length]);

  const expirou  = prazoExpirou();
  const restante = tempoRestante();
  const lembrete = deveEnviarLembrete();
  const pratoFixo = expirou ? pratoMaisVotado(votos,[...CARDAPIO.carne,...CARDAPIO.veg]) : null;

  const itens = useMemo(()=>
    Object.entries(carrinho).filter(([,q])=>q>0).map(([id,qty])=>{
      const p=PRATOS.find(x=>x.id===id); if(!p) return null;
      const e=extra[id]||0;
      return {id,nome:p.nome+(e>0?` +${e*100}g`:""),icon:p.icon,preco:p.preco+e*PRECO_100G,e,qty,obs:obs[id]||""};
    }).filter(Boolean),[carrinho,obs,extra,PRATOS]);

  const sub   = itens.reduce((s,i)=>s+i.preco*i.qty,0);
  const frete = form.tipo==="entrega"?TAXA_ENTREGA:0;
  const gVal  = Math.round(sub*gorjeta)/100;
  const total = sub+frete+gVal;
  const nCart = itens.reduce((s,i)=>s+i.qty,0);
  const ranking = useMemo(()=>[...CARDAPIO.carne,...CARDAPIO.veg].map(p=>({...p,v:votos[p.id]||0})).filter(p=>p.v>0).sort((a,b)=>b.v-a.v),[votos]);
  const totVotos = ranking.reduce((s,p)=>s+p.v,0);

  function votar(id){if(votoFeito||expirou)return;setVotos(v=>({...v,[id]:(v[id]||0)+1}));setVotoFeito(id);}

  function enviar(){
    if(!form.nome.trim()||!form.tel.trim()){setErro(t.eNome);return;}
    if(form.tipo==="entrega"&&(!form.end.trim()||!form.endCity?.trim()||!form.endProv?.trim()||!form.endCep?.trim())){setErro(t.eEnd);return;}
    if(!itens.length){setErro(t.eCart);return;}
    if(form.alergia===null){setErro(t.eAl);return;}
    if(form.alergia&&!form.alergiaDesc.trim()){setErro(t.eAlDesc);return;}
    setErro("");
    const hr=horaEst(form.tipo==="entrega"?TEMPO_ENT:TEMPO_RET);
    const num=String(Date.now()).slice(-4);
    const lns=itens.map(i=>`• ${i.qty}x ${i.nome} — ${fmt(i.preco*i.qty)}`+(i.obs?`\n  ✏️ ${i.obs}`:``)).join("\n");
    const lA=form.alergia?`\n🚨 ALERGIA: ${form.alergiaDesc}`:"";
    const lF=frete>0?`🛵 Taxa: ${fmt(frete)}\n`:"";
    const lG=gVal>0?`💛 Gorjeta: ${fmt(gVal)}\n`:"";
    const lP=form.pag==="etransfer"?"📧 e-Transfer":form.pag==="dinheiro"?"💵 Dinheiro":"💳 Cartão";
    const end=form.tipo==="entrega"?`📍 ${form.end}, ${form.endCity||""}, ${form.endProv||""} ${form.endCep||""}`:"🏠 Retirada";
    const msgCoz=`🔔 *PEDIDO #${num}*${form.alergia?"\n🚨 ALERGIA — LEIA ANTES DE PREPARAR":""}\n\n${lns}\n\n${lF}${lG}💰 *Total: ${fmt(total)}*\n${lP}${lA}\n\n👤 ${form.nome} · 📞 ${form.tel}\n${end}\n⏱ ${hr}`;
    const msgCli=`✅ *Pedido #${num} confirmado!*\n\nOlá, ${form.nome}! 🍱\n\n${lns}\n\n${lF}${lG}💰 *Total: ${fmt(total)}*\n${lP}${lA}\n\n⏱ ${hr}\n\nObrigada! 💛`;
    const tel=form.tel.replace(/\D/g,"");
    setClientes(p=>p.find(c=>c.tel.replace(/\D/g,"")===tel)?p:[...p,{id:Date.now(),nome:form.nome,tel:form.tel}]);
    const novo={id:Date.now(),num,cliente:form.nome,tel:form.tel,itens:itens.map(i=>`${i.qty}x ${i.nome}`).join(", "),sub,frete,gorjeta:gVal,total,tipo:form.tipo,end:form.end,endCity:form.endCity||"",endProv:form.endProv||"",endCep:form.endCep||"",hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),previsao:hr,alergia:form.alergia,alergiaDesc:form.alergiaDesc,ciente:false,pago:false,entregue:false,comentario:""};
    setPedidos(p=>[novo,...p]);setNovos(n=>n+1);
    setAlerta({num,nome:form.nome,total,hora:hr,alergia:form.alergia,alergiaDesc:form.alergiaDesc});
    setConfirm({num,hora:hr,tipo:form.tipo,nome:form.nome,tel:form.tel,msg:msgCli});
    window.open(`https://wa.me/${SEU_WHATSAPP}?text=${encodeURIComponent(msgCoz)}`,"_blank");
    setCarrinho({});setObs({});setExtra({});setGorjeta(0);setCheckout(false);
    setForm({nome:"",tel:"",tipo:"entrega",end:"",endCity:"",endProv:"",endCep:"",pag:"etransfer",alergia:null,alergiaDesc:""});setAba("pedidos");
  }

  function msgMenu(nome){
    const hoje=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
    const ps=PRATOS.map(p=>`🍱 *${p.nome}* — ${fmt(p.preco)}\n   ${p.desc}`).join("\n\n");
    const av=menuDia.aviso?`\n\n⚠️ *Aviso:* ${menuDia.aviso}`:"";
    return `🍱 *Cardápio — Tempero da Vó*\n${hoje}\n\nOlá, ${nome}! 👋\n\n${ps}${av}\n\nBase: 🍚 Arroz · 🫘 Feijão · 🥗 Salada\n\n🛵 Entrega: ${fmt(TAXA_ENTREGA)} · 🏠 Retirada: grátis\n\nPeça pelo app! 😊`;
  }

  const s = {
    page:{minHeight:500,background:P,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",color:TI,maxWidth:420,margin:"0 auto"},
    header:{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:P,borderBottom:`1px solid ${BL}`},
    logo:{width:40,height:40,borderRadius:10,border:`1.5px solid ${O}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
    marca:{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:19,color:O,lineHeight:1.1},
    sub:{fontSize:9,color:MU,letterSpacing:"0.08em"},
    langBtn:{padding:"4px 8px",borderRadius:8,border:`1.5px solid ${O}`,background:O,color:P,fontSize:11,fontWeight:700,cursor:"pointer"},
    tela:{flex:1,padding:"12px 12px 90px",overflowY:"auto"},
    card:{background:CA,border:`1px solid ${BL}`,borderRadius:14,padding:"12px 14px",marginBottom:12},
    hero:{background:CA,border:`1px solid ${BL}`,borderRadius:16,padding:16,marginBottom:12},
    heroTit:{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:20,color:O},
    baseRow:{display:"flex",justifyContent:"space-between",borderTop:`1px solid ${BL}`,paddingTop:12},
    baseItem:{display:"flex",flexDirection:"column",alignItems:"center",gap:5,fontSize:10.5,color:MU,flex:1},
    pratosHoje:{background:"#110D02",border:`1px solid ${BL}`,borderRadius:14,padding:"12px 14px",marginBottom:12},
    cardTit:{fontWeight:700,fontSize:13,color:O,marginBottom:10},
    pratoVis:{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:CA,border:`1px solid ${BL}`,borderRadius:12,padding:"10px 8px",flex:1,minWidth:0},
    pratoCard:{background:CA,border:`1px solid ${BL}`,borderRadius:16,marginBottom:12,overflow:"hidden"},
    votCard:{background:CA,border:`1px solid ${BL}`,borderRadius:14,padding:"12px 14px",marginBottom:12},
    itemCart:{background:CA,border:`1px solid ${BL}`,borderRadius:14,padding:12,display:"flex",gap:10,alignItems:"center"},
    resumo:{background:CA,border:`1px solid ${BL}`,borderRadius:14,padding:"12px 14px",marginBottom:12},
    resumoL:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,marginBottom:7},
    step:{display:"flex",alignItems:"center",gap:6,background:"#0A0A0A",borderRadius:20,padding:"3px 8px",flexShrink:0,border:`1px solid ${BL}`},
    stepBtn:{width:22,height:22,borderRadius:"50%",border:"none",background:"transparent",color:O,fontSize:14,cursor:"pointer"},
    stepN:{minWidth:16,textAlign:"center",fontWeight:600,fontSize:13,color:O},
    btnAdd:{width:26,height:26,borderRadius:"50%",border:`1.5px solid ${O}`,background:"transparent",color:O,fontSize:18,cursor:"pointer",flexShrink:0},
    btnObs:{width:"100%",padding:"6px 10px",background:"transparent",border:`1px dashed ${BL}`,borderRadius:8,fontSize:12,color:MU,cursor:"pointer",textAlign:"left"},
    btnPrinc:{width:"100%",padding:"12px 0",borderRadius:12,border:"none",background:O,color:P,fontSize:14.5,fontWeight:700,cursor:"pointer"},
    btnList:{border:`1px solid ${BL}`,background:"transparent",borderRadius:20,fontSize:15,padding:"3px 8px",cursor:"pointer",color:O},
    secTit:{fontSize:10,fontWeight:700,color:MU,marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"},
    vazio:{textAlign:"center",padding:"32px 20px",color:MU,display:"flex",flexDirection:"column",alignItems:"center",gap:8},
    nav:{position:"sticky",bottom:0,display:"flex",background:P,borderTop:`1px solid ${BL}`,padding:"6px 2px"},
    overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:50},
    modal:{width:"100%",maxWidth:420,background:CR,borderRadius:"22px 22px 0 0",padding:"18px 18px 28px",maxHeight:"85vh",overflowY:"auto"},
    lbl:{display:"block",fontSize:12,color:OE,margin:"10px 0 4px"},
    inp:{width:"100%",padding:"9px 11px",borderRadius:9,border:"1px solid #C9A84C66",fontSize:13,background:"#FBF6EA",color:"#2A1F00",fontFamily:"inherit",boxSizing:"border-box"},
  };

  const NAV = t.nav;

  return (
    <div style={s.page}>

      {alerta&&(
        <div style={{width:"100%",background:alerta.alergia?"#A03030":"#1A0F00",border:`1px solid ${alerta.alergia?"#FF6060":O}`,color:alerta.alergia?"#fff":O,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>{alerta.alergia?"🚨":"🔔"}</span>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>{alerta.alergia?"⚠️ ALERGIA! ":""}{t.novoPed||"Novo pedido"} #{alerta.num}</div>
              <div style={{fontSize:11,opacity:.85}}>{alerta.nome} · {fmt(alerta.total||0)} · {alerta.hora}</div>
              {alerta.alergia&&<div style={{fontSize:11,fontWeight:600,marginTop:2}}>🚨 {alerta.alergiaDesc}</div>}
            </div>
          </div>
          <button style={{border:"none",background:"transparent",color:"inherit",fontSize:18,cursor:"pointer"}} onClick={()=>{setAlerta(null);setNovos(0);}}>✕</button>
        </div>
      )}

      <header style={s.header}>
        <div style={{...s.logo,cursor:"pointer",userSelect:"none"}} onClick={abrirPin}><IcoPanel size={26}/></div>
        <div style={{flex:1}}>
          <div style={s.marca}>Tempero da Vó</div>
          <div style={s.sub}>{t.sub}</div>

        </div>
        <button style={s.langBtn} onClick={()=>setLang(t.langOther)}>
          {t.langOther==="en"?"🇧🇷 PT":"🇨🇦 EN"}
        </button>
      </header>

      <main style={s.tela}>

        {aba==="cardapio"&&(
          <div>
            <div style={s.hero}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={s.heroTit}>{t.heroTit}</div>
                <button style={s.btnList} onClick={()=>setCardapioOpen(true)}>{t.cardapioBtn}</button>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                <div style={{flexShrink:0}}><Marmita size={74}/></div>
                <div style={{fontSize:12,color:MU,lineHeight:1.5}}>{t.heroBase}</div>
              </div>
              <div style={s.baseRow}>
                <div style={s.baseItem}><IcoArroz size={38}/><span>{t.arroz}</span></div>
                <div style={s.baseItem}><IcoFeijao size={38}/><span>{t.feijao}</span></div>
                <div style={s.baseItem}><IcoSalada size={38}/><span>{t.salada}</span></div>
              </div>
            </div>

            <div style={s.pratosHoje}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={s.cardTit}>{t.pratosDia}</div>
                {!expirou&&restante&&<div style={{fontSize:10,color:O,background:CA,border:`1px solid ${BL}`,borderRadius:20,padding:"2px 8px"}}>⏱ {restante} {t.prazoLabel}</div>}
                {expirou&&<div style={{fontSize:10,color:"#E05050",fontWeight:700}}>{t.prazoOff}</div>}
              </div>
              <div style={{display:"flex",gap:10}}>
                {PRATOS.map((p,i)=>{
                  const ativo=!expirou||(pratoFixo&&pratoFixo.id===p.id);
                  return (
                    <div key={i} style={{...s.pratoVis,opacity:expirou&&pratoFixo&&pratoFixo.id!==p.id?.35:1,position:"relative"}}>
                      <IcoCarne tipo={p.icon} size={50}/>
                      <div style={{fontSize:11,fontWeight:600,textAlign:"center",color:ativo?TI:MU,lineHeight:1.3,wordBreak:"break-word"}}>{p.nome}</div>
                      <div style={{fontSize:11,color:ativo?O:MU,fontWeight:700}}>{fmt(p.preco)}</div>
                      {expirou&&pratoFixo&&pratoFixo.id===p.id&&<div style={{position:"absolute",top:-8,right:-8,background:O,color:P,fontSize:9,fontWeight:700,borderRadius:10,padding:"2px 6px"}}>{t.pratoFixo}</div>}
                      {expirou&&pratoFixo&&pratoFixo.id!==p.id&&<div style={{fontSize:10,color:MU}}>{t.segunda}</div>}
                    </div>
                  );
                })}
              </div>
              {expirou&&pratoFixo&&<div style={{marginTop:8,fontSize:11,color:MU,textAlign:"center",borderTop:`1px solid ${BL}`,paddingTop:8}}>{t.prazoMsg} <strong style={{color:O}}>{pratoFixo.nome}</strong></div>}
            </div>

            {menuDia.aviso&&menuDia.aviso.trim()&&(
              <div style={{background:CA,border:`1px solid ${O}`,borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
                <div><div style={{fontWeight:700,fontSize:12,color:O,marginBottom:3}}>{t.avisoAtivo}</div><div style={{fontSize:12.5,color:TI,lineHeight:1.4}}>{menuDia.aviso}</div></div>
              </div>
            )}

            {(expirou?(pratoFixo?[pratoFixo]:PRATOS.slice(0,1)):PRATOS).map(p=>{
              const q=carrinho[p.id]||0, painelObs=obsAberto===p.id, temObs=obs[p.id]?.trim();
              return (
                <div key={p.id} style={s.pratoCard}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start",padding:14}}>
                    <div style={{flexShrink:0}}><IcoCarne tipo={p.icon} size={54}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:19,color:O,marginBottom:3,lineHeight:1.2}}>{p.nome}</div>
                      <div style={{fontSize:12,color:MU,lineHeight:1.5,marginBottom:5,wordBreak:"break-word"}}>{p.desc}</div>
                      <div style={{fontWeight:700,fontSize:15,color:O}}>{fmt(p.preco)}</div>
                    </div>
                    {q===0
                      ?<button style={s.btnAdd} onClick={()=>setCarrinho(c=>({...c,[p.id]:1}))}>+</button>
                      :<div style={s.step}>
                        <button style={s.stepBtn} onClick={()=>{const n=Math.max(0,q-1);setCarrinho(c=>({...c,[p.id]:n}));if(n===0){setExtra(e=>{const x={...e};delete x[p.id];return x});setObs(o=>{const x={...o};delete x[p.id];return x});}}}>−</button>
                        <span style={s.stepN}>{q}</span>
                        <button style={s.stepBtn} onClick={()=>setCarrinho(c=>({...c,[p.id]:q+1}))}>+</button>
                      </div>
                    }
                  </div>
                  {q>0&&(
                    <div style={{borderTop:`1px solid ${BL}`,padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#0A0A0A",borderRadius:8,padding:"7px 10px",border:`1px solid ${BL}`}}>
                        <div style={{fontSize:12.5,fontWeight:600,color:TI}}>{t.extra} <span style={{fontSize:11,fontWeight:400,color:MU}}>+{fmt(PRECO_100G)}/{t.extraPor}</span></div>
                        <div style={s.step}>
                          <button style={s.stepBtn} onClick={()=>setExtra(e=>({...e,[p.id]:Math.max(0,(e[p.id]||0)-1)}))}>−</button>
                          <span style={s.stepN}>{extra[p.id]||0}</span>
                          <button style={s.stepBtn} onClick={()=>setExtra(e=>({...e,[p.id]:(e[p.id]||0)+1}))}>+</button>
                        </div>
                      </div>
                      {(extra[p.id]||0)>0&&<div style={{fontSize:11.5,color:O,fontWeight:600}}>+{(extra[p.id]||0)*100}g · {fmt((extra[p.id]||0)*PRECO_100G)} {t.extraInfo}</div>}
                      {painelObs
                        ?<ObsPanel val={obs[p.id]||""} onSave={txt=>{setObs(o=>({...o,[p.id]:txt}));setObsAberto(null);}} onClose={()=>setObsAberto(null)} t={t}/>
                        :<button style={s.btnObs} onClick={()=>setObsAberto(p.id)}>✏️ {temObs?`"${obs[p.id]}"`:t.obsPh}</button>
                      }
                    </div>
                  )}
                </div>
              );
            })}

            <div style={s.votCard}>
              <div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:19,color:O,marginBottom:4}}>{expirou?t.votOff:t.votTit}</div>
              {!expirou&&restante&&(
                <div style={{display:"flex",alignItems:"center",gap:6,background:"#1A1408",border:`1px solid ${O}`,borderRadius:20,padding:"5px 12px",marginBottom:10,width:"fit-content"}}>
                  <span style={{fontSize:13,color:O,fontWeight:700}}>⏱ {t.votPrazo} {restante}</span>
                </div>
              )}
              {expirou&&<div style={{fontSize:12,color:MU,marginBottom:8,lineHeight:1.5}}>{t.votMsg} <strong style={{color:O}}>{pratoFixo?.nome||"—"}</strong></div>}
              {!expirou&&<div style={{fontSize:12,color:MU,marginBottom:10}}>{t.votSub}</div>}
              {/* Lista completa do cardápio para votação */}
              <div style={{maxHeight:260,overflowY:"auto",opacity:expirou?.4:1}}>
                {[{label:t.cComCarne,lista:CARDAPIO.carne},{label:t.cSemCarne,lista:CARDAPIO.veg}].map(g=>(
                  <div key={g.label}>
                    <div style={{fontSize:10,fontWeight:700,color:O,padding:"6px 0 4px",letterSpacing:"0.08em",textTransform:"uppercase"}}>{g.label}</div>
                    {g.lista.map(c=>{
                      const jav=votoFeito!==null||expirou, esv=votoFeito===c.id;
                      const borda=esv?`2px solid ${O}`:`1px solid ${BL}`;
                      return (
                        <button key={c.id} disabled={jav} onClick={()=>votar(c.id)}
                          style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 10px",border:borda,borderRadius:10,background:esv?CA:"transparent",cursor:jav?"default":"pointer",opacity:jav&&!esv?.35:1,marginBottom:4}}>
                          <IcoCarne tipo={c.icon} size={28}/>
                          <span style={{flex:1,textAlign:"left",fontSize:13,color:esv?O:TI}}>{c.nome}</span>
                          {esv&&<span style={{color:O,fontWeight:700,fontSize:13}}>✓</span>}
                          {!jav&&<span style={{color:MU,fontSize:12}}>→</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              {votoFeito&&!expirou&&<div style={{fontSize:12,color:O,textAlign:"center",padding:8,background:CA,borderRadius:8,border:`1px solid ${BL}`,marginTop:8}}>{t.votObrig}</div>}
            </div>
            {/* Botão flutuante carrinho */}
            {nCart>0&&(
              <div style={{position:"sticky",bottom:0,padding:"10px 0 4px",background:`linear-gradient(transparent, ${P} 60%)`}}>
                <button onClick={()=>setAba("carrinho")}
                  style={{width:"100%",padding:"14px 0",borderRadius:12,border:"none",background:VE,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span>🛒</span>
                  <span>Ver carrinho ({nCart} {nCart===1?"item":"itens"}) — {fmt(sub)}</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>
        )}

        {aba==="carrinho"&&(
          <div>
            {itens.length===0
              ?<div style={s.vazio}><Marmita size={64}/><div style={{fontWeight:600,fontSize:14,color:TI,marginTop:8}}>{t.vazio}</div><div style={{fontSize:12,color:MU}}>{t.vazioPh}</div></div>
              :<>
                {itens.map(i=>(
                  <div key={i.id} style={{...s.itemCart,marginBottom:10}}>
                    <IcoCarne tipo={i.icon} size={42}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13.5,color:TI,marginBottom:2}}>{i.nome}</div>
                      {i.e>0&&<div style={{fontSize:11,color:O,fontWeight:600}}>🥩 +{i.e*100}g {t.extraInfo}</div>}
                      {i.obs&&<div style={{fontSize:11,color:MU,fontStyle:"italic"}}>✏️ {i.obs}</div>}
                      <div style={{fontWeight:700,fontSize:13,color:O,marginTop:3}}>{fmt(i.preco*i.qty)}</div>
                    </div>
                    <div style={s.step}>
                      <button style={s.stepBtn} onClick={()=>{const n=Math.max(0,(carrinho[i.id]||0)-1);setCarrinho(c=>({...c,[i.id]:n}));if(n===0){setExtra(e=>{const x={...e};delete x[i.id];return x});setObs(o=>{const x={...o};delete x[i.id];return x});}}}>−</button>
                      <span style={s.stepN}>{i.qty}</span>
                      <button style={s.stepBtn} onClick={()=>setCarrinho(c=>({...c,[i.id]:(c[i.id]||0)+1}))}>+</button>
                    </div>
                  </div>
                ))}
                <div style={s.resumo}>
                  <div style={s.resumoL}><span style={{color:MU}}>{t.subtotal}</span><span>{fmt(sub)}</span></div>
                  <div style={s.resumoL}><span style={{color:MU}}>{t.freteLabel}</span><span style={{color:O,fontWeight:600}}>{form.tipo==="retirada"?t.gratis:fmt(TAXA_ENTREGA)}</span></div>
                  <div style={{...s.resumoL,flexDirection:"column",alignItems:"flex-start",gap:8}}>
                    <span style={{color:MU}}>{t.gorjetaLabel}</span>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {GORJETAS.map(gp=>(
                        <button key={gp} onClick={()=>setGorjeta(gp)} style={{padding:"6px 10px",borderRadius:20,border:gorjeta===gp?`1.5px solid ${O}`:`1px solid ${BL}`,background:gorjeta===gp?CA:"transparent",color:gorjeta===gp?O:MU,fontSize:12,cursor:"pointer",fontWeight:gorjeta===gp?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                          {gp===0?t.semGorjeta:`${gp}%`}
                          {gp>0&&<span style={{fontSize:9,opacity:.8}}>{fmt(Math.round(sub*gp)/100)}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{...s.resumoL,borderTop:`1px solid ${BO}`,paddingTop:10,marginTop:4}}>
                    <span style={{fontWeight:700,fontSize:14}}>{t.totalLabel}</span>
                    <span style={{fontWeight:700,fontSize:17,color:O}}>{fmt(total)}</span>
                  </div>
                </div>
                <button style={{...s.btnPrinc,background:VE,fontSize:16,padding:"15px 0",marginTop:4}} onClick={()=>setCheckout(true)}>
                  🛒 {t.pedir}
                </button>
              </>
            }
          </div>
        )}

        {aba==="pedidos"&&(
          <div>
            {confirm&&(
              <div style={{...s.card,border:`1.5px solid ${O}`,textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:32,marginBottom:6}}>✅</div>
                <div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:17,color:O,marginBottom:4}}>{t.pedConf} #{confirm.num}</div>
                <div style={{fontSize:12.5,color:MU,lineHeight:1.5,marginBottom:10}}>Olá, {confirm.nome}! 🍱</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,color:MU,marginBottom:12}}>
                  ⏱ {confirm.hora}
                  <span style={{fontWeight:700,fontSize:16,color:P,background:O,padding:"3px 10px",borderRadius:20}}>{confirm.hora}</span>
                </div>
                <button style={{...s.btnPrinc,background:VE,marginBottom:8}} onClick={()=>window.open(`https://wa.me/${confirm.tel.replace(/\D/g,"")}?text=${encodeURIComponent(confirm.msg)}`,"_blank")}>{t.envConf}</button>
                <button style={{...s.btnPrinc,background:"transparent",border:`1px solid ${BL}`,color:MU}} onClick={()=>setConfirm(null)}>{t.fechar}</button>
              </div>
            )}
            <div style={s.secTit}>{t.pedRec}</div>
            {pedidos.length===0
              ?<div style={s.vazio}><div style={{fontSize:36}}>🧾</div><div style={{fontWeight:600,fontSize:14,color:TI,marginTop:8}}>{t.nenhumPed}</div></div>
              :pedidos.map(p=>(
                <div key={p.id} style={{...s.card,padding:0,marginBottom:10,overflow:"hidden"}}>
                  {p.alergia&&<div style={{background:"#A03030",padding:"7px 12px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🚨</span><div><div style={{fontWeight:700,fontSize:12,color:"#fff"}}>{t.alAviso}</div><div style={{fontSize:11,color:"#FFD0D0"}}>{p.alergiaDesc}</div></div></div>}
                  <div style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontWeight:600,fontSize:13.5,color:TI}}>{p.cliente} <span style={{fontSize:11,color:MU,fontWeight:400}}>#{p.num}</span></span>
                      <span style={{fontSize:11,color:MU}}>{p.hora}</span>
                    </div>
                    <div style={{fontSize:11.5,color:MU,lineHeight:1.4,marginBottom:4}}>{p.itens}</div>
                    <div style={{fontSize:11,color:"#4A7A3A",fontWeight:600,marginBottom:4}}>{t.prevLabel} {p.previsao}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,color:MU}}>{p.tipo==="entrega"?t.tEnt:t.tRet}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {p.tipo==="entrega"&&p.end&&(
                          <button
                            onClick={()=>{
                              const addr=encodeURIComponent(`${p.end}, ${p.endCity}, ${p.endProv} ${p.endCep}`);
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`,"_blank");
                            }}
                            title="Abrir no Google Maps"
                            style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,border:"none",background:"#1A73E8",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#fff"/>
                              <circle cx="12" cy="9" r="2.5" fill="#1A73E8"/>
                            </svg>
                            Maps
                          </button>
                        )}
                        <span style={{fontWeight:700,color:O,fontSize:13}}>{fmt(p.total)}</span>
                      </div>
                    </div>
                    {p.tipo==="entrega"&&p.end&&(
                      <div style={{fontSize:11,color:MU,marginBottom:4}}>📍 {p.end}, {p.endCity}, {p.endProv} {p.endCep}</div>
                    )}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {p.entregue&&<span style={{fontSize:10,background:"#2A5020",color:"#A0ECA0",borderRadius:10,padding:"2px 7px",fontWeight:700}}>{t.badEnt}</span>}
                      {p.pago&&<span style={{fontSize:10,background:"#1A3A5A",color:"#A0C8EC",borderRadius:10,padding:"2px 7px",fontWeight:700}}>{t.badPago}</span>}
                      {p.entregue&&!p.pago&&<span style={{fontSize:10,background:"#5A2A10",color:"#FFC080",borderRadius:10,padding:"2px 7px",fontWeight:700}}>{t.badPend}</span>}
                      {p.comentario&&<span style={{fontSize:10,background:"#1A1A5A",color:"#C0C0FF",borderRadius:10,padding:"2px 7px",fontWeight:700}}>{t.badComent}</span>}
                    </div>
                  </div>
                  {p.alergia&&!p.ciente&&<div style={{borderTop:`1px solid ${BL}`,padding:"8px 12px"}}><button onClick={()=>setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,ciente:true}:x))} style={{width:"100%",padding:"9px 0",borderRadius:10,border:"none",background:"#A03030",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.ciente}</button></div>}
                  {p.alergia&&p.ciente&&<div style={{borderTop:`1px solid ${BL}`,padding:"7px 12px",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13}}>✅</span><span style={{fontSize:11.5,color:"#3A8A30",fontWeight:600}}>{t.cienteOk}</span></div>}
                  {/* Botão confirmar recebimento ao cliente */}
                  {!p.confirmadoCliente&&(
                    <div style={{borderTop:`1px solid ${BL}`,padding:"8px 12px"}}>
                      <button onClick={()=>{
                        const msg=`✅ *Pedido #${p.num} recebido!*\n\nOlá, ${p.cliente}! 🍱\n\nSeu pedido foi recebido e já está sendo preparado com carinho.\n\n⏱ Previsão: *${p.previsao}*\n${p.tipo==="entrega"?"🛵 Entrega no seu endereço":"🏠 Retirada"}\n\nObrigada pela preferência! 💛\n\n— Tempero da Vó`;
                        window.open(`https://wa.me/55${p.tel.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`,"_blank");
                        setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,confirmadoCliente:true}:x));
                      }} style={{width:"100%",padding:"9px 0",borderRadius:10,border:"none",background:"#25D366",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <span>💬</span> Confirmar pedido ao cliente (WhatsApp)
                      </button>
                    </div>
                  )}
                  {p.confirmadoCliente&&(
                    <div style={{borderTop:`1px solid ${BL}`,padding:"6px 12px",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:13}}>✅</span>
                      <span style={{fontSize:11.5,color:"#3A8A30",fontWeight:600}}>Cliente confirmado — previsão {p.previsao}</span>
                    </div>
                  )}
                  {(!p.entregue||!p.pago)&&(
                    <div style={{borderTop:`1px solid ${BL}`,padding:"8px 12px",display:"flex",gap:8}}>
                      {!p.entregue&&<button onClick={()=>setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,entregue:true}:x))} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1px solid #3A8A30`,background:"transparent",color:"#3A8A30",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.marcarEnt}</button>}
                      {p.entregue&&!p.pago&&<>
                        <button onClick={()=>setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,pago:true}:x))} style={{flex:1,padding:"8px 0",borderRadius:10,border:"none",background:"#3A8A30",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.confirmarPag}</button>
                        <button onClick={()=>setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,pago:true}:x))} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1px solid #E05050`,background:"transparent",color:"#E05050",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.naoPago}</button>
                      </>}
                    </div>
                  )}
                  {p.comentario&&<div style={{borderTop:`1px solid ${BL}`,padding:"7px 12px",background:"#0A0A1A"}}><div style={{fontSize:10,color:MU,marginBottom:2}}>{t.fbSeu}</div><div style={{fontSize:12,color:TI,fontStyle:"italic"}}>"{p.comentario}"</div></div>}
                </div>
              ))
            }
          </div>
        )}

        {aba==="especial"&&(
          <div>
            <div style={s.hero}>
              <div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:20,color:O,marginBottom:6}}>{t.espTit}</div>
              <div style={{fontSize:13,color:MU,lineHeight:1.6,marginBottom:10}}>{t.espDesc}</div>
              <div style={{fontSize:12,color:MU,background:"#1A1408",border:`1px solid ${BL}`,borderRadius:8,padding:"7px 10px"}}>{t.espAviso}</div>
            </div>
            <div style={{...s.card,marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:13,color:O,marginBottom:10}}>{t.espFazer}</div>
              <label style={s.lbl}>{t.espNome}</label><input style={s.inp} value={especForm.nome} onChange={e=>setEspecForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Maria"/>
              <label style={s.lbl}>{t.espTel}</label><input style={s.inp} value={especForm.tel} onChange={e=>setEspecForm(f=>({...f,tel:fmtTel(e.target.value)}))} placeholder="(647) 000-0000"/>
              <label style={s.lbl}>{t.espPed}</label>
              <textarea rows={3} value={especForm.desc} onChange={e=>setEspecForm(f=>({...f,desc:e.target.value}))} placeholder={t.espPedPh}
                style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1px solid ${O}`,fontSize:13,fontFamily:"inherit",color:"#2A1F00",background:"#FBF6EA",resize:"none",boxSizing:"border-box",lineHeight:1.5}}/>
              <label style={s.lbl}>{t.espObs}</label><input style={s.inp} value={especForm.obs} onChange={e=>setEspecForm(f=>({...f,obs:e.target.value}))} placeholder={t.espObsPh}/>
              {especErro&&<div style={{color:"#E05050",fontSize:12,margin:"6px 0"}}>{especErro}</div>}
              <button style={{...s.btnPrinc,marginTop:12}} onClick={()=>{
                if(!especForm.nome.trim()||!especForm.tel.trim()){setEspecErro(t.espENome);return;}
                if(!especForm.desc.trim()){setEspecErro(t.espEDesc);return;}
                setEspecErro("");
                const num=String(Date.now()).slice(-4);
                const nova={id:Date.now(),num,nome:especForm.nome,tel:especForm.tel,desc:especForm.desc,obs:especForm.obs,hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),status:"aguardando",resposta:"",precoResp:null};
                setEspeciais(e=>[nova,...e]);
                const msg=`⭐ *PRATO ESPECIAL #${num}*\n\n👤 ${especForm.nome}\n📞 ${especForm.tel}\n\n🍽️ ${especForm.desc}`+(especForm.obs?`\n\n📝 ${especForm.obs}`:``)+`\n\nPor favor responda com disponibilidade e valor!`;
                window.open(`https://wa.me/${SEU_WHATSAPP}?text=${encodeURIComponent(msg)}`,"_blank");
                setEspecForm({nome:"",tel:"",desc:"",obs:""});
              }}>{t.espEnviar}</button>
            </div>
            {especiais.length>0&&(
              <>
                <div style={s.secTit}>{t.espHist}</div>
                {especiais.map(e=>(
                  <div key={e.id} style={{...s.card,marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontWeight:600,fontSize:13,color:TI}}>#{e.num}</span><span style={{fontSize:11,color:MU}}>{e.hora}</span></div>
                    <div style={{fontSize:13,color:TI,lineHeight:1.5,marginBottom:e.obs?4:8}}>{e.desc}</div>
                    {e.obs&&<div style={{fontSize:11.5,color:MU,marginBottom:8}}>📝 {e.obs}</div>}
                    {e.status==="aguardando"&&<div style={{fontSize:12,color:O}}>⏳ {t.espAg}</div>}
                    {e.status==="aceito"&&<div style={{background:"#0A1A0A",borderRadius:8,padding:"8px 10px",border:"1px solid #3A8A30"}}><div style={{fontSize:12,color:"#3A8A30",fontWeight:700,marginBottom:2}}>{t.espAcei}</div>{e.precoResp&&<div style={{fontSize:14,color:O,fontWeight:700}}>{fmt(e.precoResp)}</div>}{e.resposta&&<div style={{fontSize:12,color:MU,marginTop:2}}>{e.resposta}</div>}</div>}
                    {e.status==="recusado"&&<div style={{background:"#1A0A0A",borderRadius:8,padding:"8px 10px",border:"1px solid #E05050"}}><div style={{fontSize:12,color:"#E05050",fontWeight:700,marginBottom:2}}>{t.espRec}</div>{e.resposta&&<div style={{fontSize:12,color:MU}}>{e.resposta}</div>}</div>}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {aba==="feedback"&&(
          <div>
            <div style={s.secTit}>{t.fbTit}</div>
            {pedidos.length===0
              ?<div style={s.vazio}><div style={{fontSize:36}}>💬</div><div style={{fontWeight:600,fontSize:14,color:TI,marginTop:8}}>{t.fbVazio}</div><div style={{fontSize:12,color:MU}}>{t.fbVazioPh}</div></div>
              :pedidos.map(p=>(
                <div key={p.id} style={{...s.card,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontWeight:600,fontSize:13,color:TI}}>#{p.num}</span><span style={{fontSize:11,color:MU}}>{p.hora}</span></div>
                  <div style={{fontSize:11.5,color:MU,marginBottom:8}}>{p.itens}</div>
                  {p.comentario
                    ?<div style={{background:"#0A0A1A",borderRadius:8,padding:"8px 10px",border:`1px solid ${BL}`}}>
                        <div style={{fontSize:10,color:MU,marginBottom:3}}>{t.fbSeu}</div>
                        <div style={{fontSize:13,color:TI,fontStyle:"italic",lineHeight:1.5}}>"{p.comentario}"</div>
                        <button onClick={()=>{setFbAberto(p.id);setFbTxt(p.comentario);}} style={{fontSize:11,color:O,background:"transparent",border:"none",cursor:"pointer",marginTop:5,padding:0}}>{t.fbEdit}</button>
                      </div>
                    :fbAberto===p.id
                      ?<div>
                          <textarea rows={3} value={fbTxt} onChange={e=>setFbTxt(e.target.value)} placeholder={t.fbPh}
                            style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${O}`,fontSize:13,fontFamily:"inherit",color:"#2A1F00",background:"#FBF6EA",resize:"none",boxSizing:"border-box"}}/>
                          <div style={{display:"flex",gap:8,marginTop:6}}>
                            <button onClick={()=>{setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,comentario:fbTxt.trim()}:x));setFbAberto(null);setFbTxt("");}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:O,color:P,fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.fbEnv}</button>
                            <button onClick={()=>{setFbAberto(null);setFbTxt("");}} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${BL}`,background:"transparent",fontSize:13,cursor:"pointer",color:MU}}>{t.fbCancel}</button>
                          </div>
                        </div>
                      :<button onClick={()=>{setFbAberto(p.id);setFbTxt("");}} style={{width:"100%",padding:"9px 0",borderRadius:10,border:`1px dashed ${BL}`,background:"transparent",color:MU,fontSize:13,cursor:"pointer"}}>{t.fbBtn}</button>
                  }
                </div>
              ))
            }
          </div>
        )}

        {aba==="cozinha"&&(
          <div>
            {!cozinhaAuth
              ? <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
                  <div style={{background:CA,border:`1px solid ${BL}`,borderRadius:20,padding:"32px 24px",width:"100%",maxWidth:360,textAlign:"center"}}>
                    <div style={{fontSize:40,marginBottom:12}}>👩‍🍳</div>
                    <div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:22,color:O,marginBottom:6}}>Área da Cozinha</div>
                    <div style={{fontSize:13,color:MU,marginBottom:20}}>Digite a senha para continuar</div>
                    <input type="password" value={senhaInput} onChange={e=>setSenhaInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"){if(senhaInput===getSenha()){setCozinhaAuth(true);setSenhaInput("");setSenhaErro("");}else{setSenhaErro("Senha incorreta. Tente novamente.");}}}
                      }
                      placeholder="••••••••••••••••"
                      style={{...s.inp,textAlign:"center",fontSize:18,letterSpacing:"0.2em",marginBottom:8}}/>
                    {senhaErro&&<div style={{color:"#E05050",fontSize:12,marginBottom:8}}>{senhaErro}</div>}
                    <button style={s.btnPrinc} onClick={()=>{
                      if(senhaInput===getSenha()){setCozinhaAuth(true);setSenhaInput("");setSenhaErro("");}
                      else{setSenhaErro("Senha incorreta. Tente novamente.");}
                    }}>Entrar</button>
                  </div>
                </div>
              : <div>
                  {/* Botões topo cozinha */}
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,alignItems:"center"}}>
                    <button onClick={()=>{setCozinhaVisivel(false);setAba("cardapio");setCozinhaAuth(false);}}
                      style={{fontSize:11,color:"#E05050",background:"transparent",border:"1px solid #E0505044",borderRadius:20,padding:"5px 12px",cursor:"pointer"}}>
                      🔒 Sair da cozinha
                    </button>
                    <button onClick={()=>{setTrocandoSenha(true);setSenhaAtual("");setSenhaNova("");setSenhaConfirm("");setSenhaMsg("");}}
                      style={{fontSize:12,color:MU,background:"transparent",border:`1px solid ${BL}`,borderRadius:20,padding:"5px 12px",cursor:"pointer"}}>
                      🔑 Alterar senha
                    </button>
                  </div>
                  {trocandoSenha&&(
                    <div style={{...s.card,marginBottom:14,border:`1px solid ${O}`}}>
                      <div style={{fontWeight:700,fontSize:13,color:O,marginBottom:10}}>🔑 Alterar senha</div>
                      <label style={s.lbl}>Senha atual</label>
                      <input type="password" style={s.inp} value={senhaAtual} onChange={e=>setSenhaAtual(e.target.value)} placeholder="••••••••••••••••"/>
                      <label style={s.lbl}>Nova senha</label>
                      <input type="password" style={s.inp} value={senhaNova} onChange={e=>setSenhaNova(e.target.value)} placeholder="Mínimo 8 caracteres"/>
                      <label style={s.lbl}>Confirmar nova senha</label>
                      <input type="password" style={s.inp} value={senhaConfirm} onChange={e=>setSenhaConfirm(e.target.value)} placeholder="Repita a nova senha"/>
                      {senhaMsg&&<div style={{fontSize:12,color:senhaMsg.includes("✅")?"#3A8A30":"#E05050",margin:"8px 0"}}>{senhaMsg}</div>}
                      <div style={{display:"flex",gap:8,marginTop:10}}>
                        <button style={{...s.btnPrinc,background:OE}} onClick={()=>{
                          if(senhaAtual!==getSenha()){setSenhaMsg("❌ Senha atual incorreta.");return;}
                          if(senhaNova.length<8){setSenhaMsg("❌ A nova senha deve ter pelo menos 8 caracteres.");return;}
                          if(senhaNova!==senhaConfirm){setSenhaMsg("❌ As senhas não coincidem.");return;}
                          setSenha(senhaNova);
                          setSenhaMsg("✅ Senha alterada com sucesso!");
                          setTimeout(()=>setTrocandoSenha(false),2000);
                        }}>Salvar</button>
                        <button style={{...s.btnPrinc,background:"transparent",border:`1px solid ${BL}`,color:MU}} onClick={()=>setTrocandoSenha(false)}>Cancelar</button>
                      </div>
                    </div>
                  )}
            {lembrete&&(
              <div style={{...s.card,border:`2px solid ${O}`,marginBottom:14}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:22,flexShrink:0}}>🔔</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:O,marginBottom:4}}>{t.lembrTit}</div>
                    <div style={{fontSize:12.5,color:TI,lineHeight:1.5,marginBottom:10}}>{t.lembrSub}</div>
                    <button style={{...s.btnPrinc,padding:"9px 0",fontSize:13}} onClick={()=>setEnviando(0)}>{t.lembrBtn}</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{...s.card,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:10,color:MU,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{t.prazoTit}</div><div style={{fontSize:13,color:expirou?"#E05050":O,fontWeight:600,marginTop:2}}>{expirou?t.prazoEnc:restante?`⏱ ${restante}`:t.calc}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:10,color:MU,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{t.votosLabel}</div><div style={{fontSize:20,fontWeight:700,color:O}}>{totVotos}</div></div>
            </div>
            <div style={s.secTit}>{t.cozTit}</div>
            <div style={s.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div><div style={{fontWeight:700,fontSize:14,color:O}}>{t.cozPratos}</div><div style={{fontSize:11,color:MU,marginTop:2}}>{t.cozSub}</div></div>
                <button style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${O}`,background:"transparent",fontSize:12,cursor:"pointer",color:O,fontWeight:600}} onClick={()=>{setMenuTemp({pratos:PRATOS.map(p=>({...p})),aviso:menuDia.aviso||""});setEditando(true);}}>{t.cozEdit}</button>
              </div>
              <div style={{display:"flex",gap:10}}>
                {PRATOS.map((p,i)=>(
                  <div key={i} style={s.pratoVis}>
                    <IcoCarne tipo={p.icon} size={44}/>
                    <div style={{fontSize:11,fontWeight:600,textAlign:"center",color:TI,wordBreak:"break-word",lineHeight:1.3}}>{p.nome}</div>
                    <div style={{fontSize:11,color:O,fontWeight:700}}>{fmt(p.preco)}</div>
                  </div>
                ))}
              </div>
              {menuDia.aviso&&menuDia.aviso.trim()&&(
                <div style={{marginTop:10,background:"#1A1408",borderRadius:8,padding:"7px 10px",border:`1px solid ${O}`}}>
                  <div style={{fontSize:10,color:O,fontWeight:700,marginBottom:2}}>{t.avisoAtivo}</div>
                  <div style={{fontSize:12,color:TI}}>{menuDia.aviso}</div>
                </div>
              )}
            </div>
            <div style={s.secTit}>{t.rankTit}</div>
            <div style={s.card}>
              {totVotos===0
                ?<div style={{textAlign:"center",padding:"14px 0",color:MU,fontSize:13}}>{t.rankVazio}</div>
                :ranking.map((p,i)=>{
                    const pct=Math.round((p.v/totVotos)*100);
                    const venc=expirou&&i===0;
                    return (
                      <div key={p.id} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {i===0&&<span style={{fontSize:14}}>👑</span>}
                            <IcoCarne tipo={p.icon} size={30}/>
                            <span style={{fontSize:13,fontWeight:600,color:venc?O:TI}}>{p.nome}</span>
                            {venc&&<span style={{fontSize:9,background:O,color:P,borderRadius:10,padding:"2px 6px",fontWeight:700}}>{t.pratoFixo}</span>}
                          </div>
                          <span style={{fontSize:11,color:MU}}>{p.v} voto{p.v>1?"s":""}</span>
                        </div>
                        <div style={{height:6,background:"#1A1408",borderRadius:6,overflow:"hidden",marginBottom:2}}>
                          <div style={{height:"100%",width:`${pct}%`,background:i===0?O:BL,borderRadius:6,transition:"width .4s"}}/>
                        </div>
                        <div style={{fontSize:10,color:MU,textAlign:"right"}}>{pct}%</div>
                      </div>
                    );
                  })
              }
              {totVotos>0&&<div style={{fontSize:11,color:MU,textAlign:"right",borderTop:`1px solid ${BL}`,paddingTop:6}}>Total: {totVotos} voto{totVotos>1?"s":""}</div>}
            </div>
            <div style={s.secTit}>{t.espCozTit}</div>
            <div style={s.card}>
              {especiais.length===0
                ?<div style={{textAlign:"center",padding:"12px 0",color:MU,fontSize:13}}>{t.espCozVazio}</div>
                :especiais.map(e=>(
                    <div key={e.id} style={{borderBottom:`1px solid ${BL}`,paddingBottom:10,marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontWeight:600,fontSize:13,color:TI}}>⭐ #{e.num} — {e.nome}</span><span style={{fontSize:10,color:MU}}>{e.hora}</span></div>
                      <div style={{fontSize:13,color:TI,lineHeight:1.5,marginBottom:3}}>{e.desc}</div>
                      {e.obs&&<div style={{fontSize:11.5,color:MU,marginBottom:5}}>📝 {e.obs}</div>}
                      <div style={{fontSize:11.5,color:MU,marginBottom:8}}>📞 {e.tel}</div>
                      {e.status==="aguardando"&&(
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          <div style={{fontSize:11,color:O,fontWeight:600}}>{t.espResp}</div>
                          <input placeholder={t.espValor} type="number" id={`preco-${e.id}`} style={{...s.inp}}/>
                          <input placeholder={t.espMsgOpc} id={`msg-${e.id}`} style={{...s.inp}}/>
                          <div style={{display:"flex",gap:8}}>
                            <button onClick={()=>{
                              const preco=parseFloat(document.getElementById(`preco-${e.id}`)?.value||0);
                              const msg=document.getElementById(`msg-${e.id}`)?.value||"";
                              setEspeciais(pv=>pv.map(x=>x.id===e.id?{...x,status:"aceito",precoResp:preco||null,resposta:msg}:x));
                              const txt=`✅ *Prato Especial #${e.num} — Aceito!*\n\nOlá, ${e.nome}! 🍽️\n`+(preco?`💰 ${fmt(preco)}\n`:``)+( msg?`📝 ${msg}\n`:``)+`\nResponda para confirmar!`;
                              window.open(`https://wa.me/55${e.tel.replace(/\D/g,"")}?text=${encodeURIComponent(txt)}`,"_blank");
                            }} style={{flex:1,padding:"8px 0",borderRadius:10,border:"none",background:"#3A8A30",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.espAceitarBtn}</button>
                            <button onClick={()=>{
                              const msg=document.getElementById(`msg-${e.id}`)?.value||"Infelizmente não temos os ingredientes hoje.";
                              setEspeciais(pv=>pv.map(x=>x.id===e.id?{...x,status:"recusado",resposta:msg}:x));
                              const txt=`❌ *Prato Especial #${e.num}*\n\nOlá, ${e.nome}! Infelizmente não conseguiremos atender hoje.\n\n${msg}\n\nObrigada! 💛`;
                              window.open(`https://wa.me/55${e.tel.replace(/\D/g,"")}?text=${encodeURIComponent(txt)}`,"_blank");
                            }} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1px solid #E05050`,background:"transparent",color:"#E05050",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.espRecusarBtn}</button>
                          </div>
                        </div>
                      )}
                      {e.status!=="aguardando"&&<div style={{fontSize:12,color:e.status==="aceito"?"#3A8A30":"#E05050",fontWeight:700}}>{e.status==="aceito"?t.espAcei:t.espRec}{e.precoResp?` — ${fmt(e.precoResp)}`:""}</div>}
                    </div>
                  ))
              }
            </div>
            <div style={s.secTit}>{t.cliTit}</div>
            <div style={s.card}>
              {clientes.length===0
                ?<div style={s.vazio}><div style={{fontSize:30}}>👥</div><div style={{fontWeight:600,fontSize:14,color:TI,marginTop:6}}>{t.cliVazio}</div><div style={{fontSize:12,color:MU}}>{t.cliVazioPh}</div></div>
                :<>
                  <div style={{fontSize:12,color:MU,marginBottom:10}}>{clientes.length} cliente{clientes.length>1?"s":""}</div>
                  {clientes.map((c,i)=>(
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${BL}`}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:CA,border:`1px solid ${O}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:O,flexShrink:0}}>{c.nome[0].toUpperCase()}</div>
                      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:TI}}>{c.nome}</div><div style={{fontSize:11.5,color:MU}}>{c.tel}</div></div>
                      {enviando===i&&<button style={{padding:"6px 10px",borderRadius:20,border:"none",background:VE,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>{window.open(`https://wa.me/55${c.tel.replace(/\D/g,"")}?text=${encodeURIComponent(msgMenu(c.nome))}`,"_blank");setEnviando(i+1<clientes.length?i+1:null);}}>{t.cliEnvBtn}</button>}
                      {enviando!==null&&enviando!==i&&<span style={{fontSize:15,color:"#3A8A30"}}>✓</span>}
                    </div>
                  ))}
                  {enviando===null
                    ?<button style={{...s.btnPrinc,marginTop:12}} onClick={()=>setEnviando(0)}>{t.cliEnvTodos} ({clientes.length})</button>
                    :<div style={{marginTop:12,textAlign:"center"}}>
                      <div style={{height:5,background:CA,borderRadius:6,overflow:"hidden",marginBottom:6}}><div style={{height:"100%",width:`${(enviando/clientes.length)*100}%`,background:VE,borderRadius:6,transition:"width .3s"}}/></div>
                      <div style={{fontSize:12,color:MU,marginBottom:8}}>{enviando<clientes.length?`${t.cliEnviando} ${clientes[enviando]?.nome}... ${t.cliToque}`:t.cliTodos}</div>
                      {enviando>=clientes.length&&<button style={{...s.btnPrinc,background:"transparent",border:`1px solid ${BL}`,color:MU}} onClick={()=>setEnviando(null)}>{t.cliFechar}</button>}
                    </div>
                  }
                </>
              }
            </div>
          </div>
        )}

        {aba==="caixa"&&(()=>{
          const tots=pedidos.reduce((s,p)=>({bruto:s.bruto+p.total,rec:s.rec+(p.pago?p.total:0),pend:s.pend+(p.pago?0:p.total),gorj:s.gorj+(p.gorjeta||0),frete:s.frete+(p.frete||0),pratos:s.pratos+(p.sub||0)}),{bruto:0,rec:0,pend:0,gorj:0,frete:0,pratos:0});
          const naoPag=pedidos.filter(p=>!p.pago&&p.entregue);
          const naoEnt=pedidos.filter(p=>!p.entregue);
          return (
            <div>
              <div style={s.secTit}>{t.caixaTit}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                {[{l:t.cBruto,v:tots.bruto,c:O},{l:t.cReceb,v:tots.rec,c:"#3A8A30"},{l:t.cAReceb,v:tots.pend,c:"#E05050"},{l:t.cGorj,v:tots.gorj,c:O}].map(m=>(
                  <div key={m.l} style={s.card}><div style={{fontSize:10,color:MU,marginBottom:4}}>{m.l}</div><div style={{fontSize:19,fontWeight:700,color:m.c}}>{fmt(m.v)}</div></div>
                ))}
              </div>
              <div style={{...s.card,marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:13,color:O,marginBottom:10}}>{t.cComp}</div>
                {[{l:t.cPratos,v:tots.pratos},{l:t.cFrete,v:tots.frete},{l:t.cGorj,v:tots.gorj}].map(r=>(
                  <div key={r.l} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:7,paddingBottom:7,borderBottom:`1px solid ${BL}`}}><span style={{color:MU}}>{r.l}</span><span style={{color:TI,fontWeight:600}}>{fmt(r.v)}</span></div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700}}><span>{t.cTotal}</span><span style={{color:O}}>{fmt(tots.bruto)}</span></div>
              </div>
              {naoPag.length>0&&(
                <div style={{...s.card,marginBottom:12,border:"1px solid #E05050"}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#E05050",marginBottom:10}}>{t.cNaoPag}</div>
                  {naoPag.map(p=>(
                    <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${BL}`}}>
                      <div><div style={{fontSize:13,fontWeight:600,color:TI}}>{p.cliente} <span style={{fontSize:10,color:MU}}>#{p.num}</span></div><div style={{fontSize:11,color:MU}}>{p.tel}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontWeight:700,color:"#E05050",fontSize:13}}>{fmt(p.total)}</div><button onClick={()=>setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,pago:true}:x))} style={{fontSize:10,color:"#3A8A30",background:"transparent",border:"1px solid #3A8A30",borderRadius:8,padding:"2px 7px",cursor:"pointer",marginTop:3}}>{t.cMarcarPago}</button></div>
                    </div>
                  ))}
                </div>
              )}
              {naoEnt.length>0&&(
                <div style={{...s.card,marginBottom:12,border:`1px solid ${O}`}}>
                  <div style={{fontWeight:700,fontSize:13,color:O,marginBottom:10}}>{t.cNaoEnt}</div>
                  {naoEnt.map(p=>(
                    <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${BL}`}}>
                      <div><div style={{fontSize:13,fontWeight:600,color:TI}}>{p.cliente} <span style={{fontSize:10,color:MU}}>#{p.num}</span></div><div style={{fontSize:11,color:MU}}>{t.prevLabel} {p.previsao}</div></div>
                      <div style={{fontWeight:700,color:O,fontSize:13}}>{fmt(p.total)}</div>
                    </div>
                  ))}
                </div>
              )}
              {pedidos.length===0&&<div style={s.vazio}><div style={{fontSize:36}}>💰</div><div style={{fontWeight:600,fontSize:14,color:TI,marginTop:8}}>{t.cNenhum}</div></div>}
              {pedidos.length>0&&(
                <div style={{background:"#0A1A0A",border:"1px solid #3A8A30",borderRadius:14,padding:"12px 14px"}}>
                  <div style={{fontSize:13,color:"#A0ECA0",lineHeight:1.8}}>
                    📦 {pedidos.length} pedido{pedidos.length>1?"s":""}<br/>
                    ✅ {pedidos.filter(p=>p.pago).length} pago{pedidos.filter(p=>p.pago).length>1?"s":""}<br/>
                    ⏳ {pedidos.filter(p=>!p.pago).length} pendente{pedidos.filter(p=>!p.pago).length>1?"s":""}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </main>

      <nav style={s.nav}>
        {[
          {icon:"🍽️",idx:0,id:"cardapio"},
          {icon:"🛒",idx:1,id:"carrinho",badge:nCart},
          {icon:"🧾",idx:2,id:"pedidos",badge:novos,onClick:()=>{setAba("pedidos");setNovos(0);}},
          {icon:"⭐",idx:3,id:"especial"},
          {icon:"💬",idx:4,id:"feedback"},
          ...(cozinhaVisivel?[{icon:"👩‍🍳",idx:5,id:"cozinha",onClick:()=>{setCozinhaAuth(false);setSenhaInput("");setSenhaErro("");setAba("cozinha");}}]:[]),
          {icon:"💰",idx:6,id:"caixa"},
        ].map(tb=>(
          <Tab key={tb.id} icon={tb.icon} label={NAV[tb.idx]} ativo={aba===tb.id}
            onClick={tb.onClick||(()=>setAba(tb.id))} badge={tb.badge||0}/>
        ))}
      </nav>

      {pinAberto&&(
        <div style={s.overlay} onClick={()=>{setPinAberto(false);setPinInput("");setPinErro("");}}>
          <div style={{...s.modal,maxWidth:320,borderRadius:24,padding:"28px 24px"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:36,marginBottom:6}}>🔐</div>
              <div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:20,color:OE}}>Área da Cozinha</div>
              <div style={{fontSize:13,color:"#9A8050",marginTop:4}}>Digite o PIN de acesso</div>
            </div>
            {/* PIN dots display */}
            <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:20}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:18,height:18,borderRadius:"50%",background:pinInput.length>i?OE:"transparent",border:`2px solid ${OE}`,transition:"all .15s"}}/>
              ))}
            </div>
            {pinErro&&<div style={{color:"#E05050",fontSize:13,textAlign:"center",marginBottom:10,fontWeight:600}}>{pinErro}</div>}
            {/* PIN keypad */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map(d=>(
                <button key={d} onClick={()=>{ if(d==="⌫") setPinInput(p=>p.slice(0,-1)); else if(d) digitarPin(d); }}
                  style={{padding:"16px 0",borderRadius:12,border:d?"none":"none",background:d==="⌫"?"#2A1F00":d?"#1A1408":"transparent",color:d==="⌫"?"#E05050":OE,fontSize:d==="⌫"?20:22,fontWeight:700,cursor:d?"pointer":"default",opacity:d?1:0}}>
                  {d}
                </button>
              ))}
            </div>
            <button style={{width:"100%",marginTop:16,padding:"10px 0",borderRadius:12,border:"none",background:"transparent",color:"#9A8050",fontSize:13,cursor:"pointer"}} onClick={()=>{setPinAberto(false);setPinInput("");setPinErro("");}}>Cancelar</button>
          </div>
        </div>
      )}

      {checkout&&(
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:15,color:OE}}>{t.confirmarTit}</span>
              <button style={{border:"none",background:"transparent",fontSize:16,cursor:"pointer",color:OE}} onClick={()=>setCheckout(false)}>✕</button>
            </div>
            <label style={s.lbl}>{t.nomeLabel}</label><input style={s.inp} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder={t.nomePh}/>
            <label style={s.lbl}>{t.telLabel}</label><input style={s.inp} value={form.tel} onChange={e=>setForm({...form,tel:fmtTel(e.target.value)})} placeholder="(647) 000-0000"/>
            <label style={s.lbl}>{t.pagLabel}</label>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              {[{id:"etransfer",l:t.pEt,icon:"📧"},{id:"dinheiro",l:t.pDin,icon:"💵"},{id:"cartao",l:t.pCart,icon:"💳"}].map(pg=>(
                <button key={pg.id} onClick={()=>setForm({...form,pag:pg.id})} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"9px 4px",borderRadius:10,border:form.pag===pg.id?`2px solid ${OE}`:`1px solid #C9A84C66`,background:form.pag===pg.id?"#F5EDD5":"#FBF6EA",cursor:"pointer",fontSize:12,color:OE,fontWeight:form.pag===pg.id?700:400}}>
                  <span style={{fontSize:18}}>{pg.icon}</span><span>{pg.l}</span>
                </button>
              ))}
            </div>
            <label style={s.lbl}>{t.tipoLabel}</label>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              {["entrega","retirada"].map(tp=>(
                <button key={tp} onClick={()=>setForm({...form,tipo:tp})} style={{flex:1,padding:"8px 0",borderRadius:9,border:form.tipo===tp?`2px solid ${OE}`:`1px solid #C9A84C66`,background:form.tipo===tp?"#F5EDD5":"#FBF6EA",color:OE,fontWeight:form.tipo===tp?700:400,fontSize:13,cursor:"pointer"}}>
                  {tp==="entrega"?t.tEnt:t.tRet}
                </button>
              ))}
            </div>
            {form.tipo==="entrega"&&(
              <div>
                <label style={s.lbl}>{t.endLabel}</label>
                <input style={s.inp} value={form.end} onChange={e=>setForm({...form,end:e.target.value})}
                  placeholder="123 Main St, Apt 4"/>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <input style={{...s.inp,flex:2}} value={form.endCity||""} onChange={e=>setForm({...form,endCity:e.target.value})}
                    placeholder="Toronto"/>
                  <input style={{...s.inp,flex:1}} value={form.endProv||""} onChange={e=>setForm({...form,endProv:e.target.value.toUpperCase().slice(0,2)})}
                    placeholder="ON" maxLength={2}/>
                  <input style={{...s.inp,flex:1.5}} value={form.endCep||""} onChange={e=>{
                    const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"");
                    const fmt=v.length>3?v.slice(0,3)+" "+v.slice(3,6):v;
                    setForm({...form,endCep:fmt});
                  }} placeholder="M5V 1A1" maxLength={7}/>
                </div>
              </div>
            )}
            <div style={{marginTop:12,borderTop:"1px solid #C9A84C44",paddingTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:OE}}>{t.subtotal}</span><span style={{color:"#2A1F00"}}>{fmt(sub)}</span></div>
              {frete>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:OE}}>{t.freteLabel}</span><span style={{color:"#2A1F00"}}>{fmt(frete)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,marginTop:6}}><span style={{color:"#2A1F00"}}>{t.totalLabel}</span><span style={{color:OE}}>{fmt(total)}</span></div>
              <div style={{marginTop:8,fontSize:12,color:"#3B6030",background:"#EEF6E8",padding:"7px 10px",borderRadius:8,textAlign:"center"}}>⏱ {form.tipo==="entrega"?t.tEnt:t.tRet}: <strong>{horaEst(form.tipo==="entrega"?TEMPO_ENT:TEMPO_RET)}</strong></div>
            </div>
            <div style={{marginTop:12,background:"#1A1408",border:`2px solid ${form.alergia===null?"#E05050":form.alergia?O:"#3A8A30"}`,borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontWeight:700,fontSize:13,color:form.alergia===null?"#E05050":form.alergia?O:"#3A8A30",marginBottom:6}}>{t.alTit}</div>
              <div style={{fontSize:11,color:MU,marginBottom:8}}>{t.alSub}</div>
              <div style={{display:"flex",gap:8,marginBottom:form.alergia?10:0}}>
                <button onClick={()=>setForm({...form,alergia:false,alergiaDesc:""})} style={{flex:1,padding:"9px 0",borderRadius:10,border:`2px solid ${form.alergia===false?"#3A8A30":"#C9A84C44"}`,background:form.alergia===false?"#EEF6E8":"#FBF6EA",color:form.alergia===false?"#1A5020":OE,fontWeight:form.alergia===false?700:400,fontSize:13,cursor:"pointer"}}>{t.alNao}</button>
                <button onClick={()=>setForm({...form,alergia:true})} style={{flex:1,padding:"9px 0",borderRadius:10,border:`2px solid ${form.alergia===true?"#E05050":"#C9A84C44"}`,background:form.alergia===true?"#FBE8E8":"#FBF6EA",color:form.alergia===true?"#A03030":OE,fontWeight:form.alergia===true?700:400,fontSize:13,cursor:"pointer"}}>{t.alSim}</button>
              </div>
              {form.alergia===true&&(
                <>
                  <div style={{fontSize:12,color:"#A03030",fontWeight:600,marginBottom:5}}>{t.alDescLabel}</div>
                  <textarea rows={2} value={form.alergiaDesc} onChange={e=>setForm({...form,alergiaDesc:e.target.value})} placeholder={t.alPh}
                    style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"2px solid #E05050",fontSize:13,fontFamily:"inherit",color:"#2A1F00",background:"#FFF0F0",resize:"none",boxSizing:"border-box"}}/>
                </>
              )}
            </div>
            {erro&&<div style={{color:"#E05050",fontSize:12,margin:"8px 0"}}>{erro}</div>}
            <button style={{...s.btnPrinc,background:VE,marginTop:12}} onClick={enviar}>{t.confirmarBtn}</button>
          </div>
        </div>
      )}

      {cardapioOpen&&(
        <div style={s.overlay}>
          <div style={{...s.modal,maxHeight:"90vh"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:15,color:OE}}>{t.cardapioBtn}</span>
              <button style={{border:"none",background:"transparent",fontSize:16,cursor:"pointer",color:OE}} onClick={()=>setCardapioOpen(false)}>✕</button>
            </div>
            <div style={{fontWeight:700,fontSize:13,color:OE,marginBottom:6}}>{t.cBase}</div>
            <div style={{fontSize:13,color:"#6B5040",marginBottom:12,lineHeight:1.8}}>🍚 {t.arroz} · 🫘 {t.feijao} · 🥗 {t.salada}</div>
            <div style={{maxHeight:320,overflowY:"auto"}}>
              {[{label:t.cComCarne,lista:CARDAPIO.carne},{label:t.cSemCarne,lista:CARDAPIO.veg}].map(g=>(
                <div key={g.label}>
                  <div style={{fontSize:11,fontWeight:700,color:OE,padding:"8px 0 4px"}}>{g.label}</div>
                  {g.lista.map(c=>(
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #E7D9BC"}}>
                      <IcoCarne tipo={c.icon} size={26}/>
                      <span style={{fontSize:13,color:"#2A1F00"}}>{c.nome}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{marginTop:12,fontSize:13,color:"#6B5040",lineHeight:1.8}}>
              <div style={{fontWeight:700,color:OE,marginBottom:3}}>{t.cPag}</div>
              📧 {t.pEt} · 💵 {t.pDin} · 💳 {t.pCart}
            </div>
            <div style={{marginTop:8,fontSize:13,color:"#6B5040",lineHeight:1.8}}>
              <div style={{fontWeight:700,color:OE,marginBottom:3}}>{t.cEnt}</div>
              {fmt(TAXA_ENTREGA)} · {t.tRet}: {t.gratis}
            </div>
            <button style={{...s.btnPrinc,marginTop:14,background:OE}} onClick={()=>setCardapioOpen(false)}>{t.fechar}</button>
          </div>
        </div>
      )}

      {editando&&menuTemp&&(
        <div style={s.overlay}>
          <div style={{...s.modal,maxHeight:"90vh"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:15,color:OE}}>{t.editTit}</span>
              <button style={{border:"none",background:"transparent",fontSize:16,cursor:"pointer",color:OE}} onClick={()=>setEditando(false)}>✕</button>
            </div>
            <div style={{fontSize:12,color:"#6B5040",marginBottom:10}}>{t.editDef}</div>
            {menuTemp.pratos.map((prato,idx)=>(
              <div key={idx} style={{marginBottom:12,background:"#FBF6EA",borderRadius:12,border:"1px solid #C9A84C44",padding:"12px 14px"}}>
                <div style={{fontSize:12,color:OE,fontWeight:700,marginBottom:8}}>{t.editPrato} {idx+1}</div>
                <div style={{maxHeight:150,overflowY:"auto",marginBottom:8}}>
                  {[{label:t.cComCarne,lista:CARDAPIO.carne},{label:t.cSemCarne,lista:CARDAPIO.veg}].map(g=>(
                    <div key={g.label}>
                      <div style={{fontSize:10,color:OE,fontWeight:700,padding:"4px 0 2px"}}>{g.label}</div>
                      {g.lista.map(c=>(
                        <button key={c.id} onClick={()=>setMenuTemp(m=>({...m,pratos:m.pratos.map((p,i)=>i===idx?{...p,id:c.id,nome:c.nome,icon:c.icon}:p)}))}
                          style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 8px",border:prato.id===c.id?`2px solid ${OE}`:`1px solid #C9A84C44`,borderRadius:8,background:prato.id===c.id?"#F5EDD5":"transparent",cursor:"pointer",marginBottom:3,color:prato.id===c.id?OE:"#6B5040"}}>
                          <IcoCarne tipo={c.icon} size={22}/>
                          <span style={{flex:1,textAlign:"left",fontSize:12}}>{c.nome}</span>
                          {prato.id===c.id&&<span style={{color:OE,fontWeight:700,fontSize:13}}>✓</span>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <label style={s.lbl}>{t.editDesc}</label>
                <input style={s.inp} value={prato.desc} onChange={e=>setMenuTemp(m=>({...m,pratos:m.pratos.map((p,i)=>i===idx?{...p,desc:e.target.value}:p)}))} placeholder={t.descPlaceholder||"Ex: arroz, feijão, salada e frango grelhado"}/>
                <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
                  <label style={{...s.lbl,margin:0}}>{t.editPreco}</label>
                  <input style={{...s.inp,width:80}} value={prato.preco}
                    onChange={e=>setMenuTemp(m=>({...m,pratos:m.pratos.map((p,i)=>i===idx?{...p,preco:e.target.value}:p)}))}
                    onBlur={e=>{const n=parseFloat(String(e.target.value).replace(",","."));setMenuTemp(m=>({...m,pratos:m.pratos.map((p,i)=>i===idx?{...p,preco:isNaN(n)?p.preco:n}:p)}));}}/>
                </div>
              </div>
            ))}
            <button style={{...s.btnPrinc,background:OE,marginBottom:16}} onClick={()=>{
              if(!menuTemp?.pratos.length) return;
              setMenuDia({pratos:menuTemp.pratos.map(p=>({...p,preco:parseFloat(String(p.preco).replace(",","."))||35})),aviso:menuTemp.aviso||""});
              setCarrinho({});setExtra({});setEditando(false);
            }}>{t.editSalvar}</button>
            <div style={{borderTop:"1px solid #C9A84C44",paddingTop:14}}>
              <div style={{fontWeight:700,fontSize:13,color:OE,marginBottom:4}}>{t.avisoTit}</div>
              <div style={{fontSize:12,color:"#6B5040",marginBottom:8}}>{t.avisoSub}</div>
              <textarea rows={3} value={menuTemp.aviso||""} onChange={e=>setMenuTemp(m=>({...m,aviso:e.target.value}))} placeholder={t.avisoPh}
                style={{width:"100%",padding:"9px 11px",borderRadius:9,border:"1px solid #C9A84C66",fontSize:13,fontFamily:"inherit",color:"#2A1F00",background:"#FBF6EA",resize:"vertical",boxSizing:"border-box",lineHeight:1.5}}/>
              {menuTemp.aviso&&menuTemp.aviso.trim()&&<button style={{fontSize:11.5,color:"#A05050",background:"transparent",border:"none",cursor:"pointer",marginTop:4,padding:0}} onClick={()=>setMenuTemp(m=>({...m,aviso:""}))}>{t.avisoLimpar}</button>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
