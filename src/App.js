/* eslint-disable */
import { useState, useMemo, useEffect, useRef, Component } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA94GGJjsJvw9kqKBzsM8E_ph274LiVk4Y",
  authDomain: "tempero-da-vo.firebaseapp.com",
  projectId: "tempero-da-vo",
  storageBucket: "tempero-da-vo.firebasestorage.app",
  messagingSenderId: "405939961008",
  appId: "1:405939961008:web:2c4978fcdf0f23b8788f75"
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

if (typeof document !== "undefined" && !document.getElementById("tdv-font")) {
  const l = document.createElement("link"); l.id = "tdv-font";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&display=swap";
  document.head.appendChild(l);
}

const SEU_WHATSAPP  = "16478634945";
const SITE_URL       = "https://www.temperodavo.ca";
const INSTAGRAM_GI   = "sweetsda_gi";
const ETRANSFER_EMAIL = "gisele.torres180@mail.com";
const TAXA_ENTREGA  = 8.0;
const PRECO_100G_PADRAO = 4.0;
const TEMPO_ENT     = 45;
const TEMPO_RET     = 25;
const GORJETAS      = [0,5,10,15];
const DIAS_ENVIO    = [6,1,3];
const HORA_PRAZO    = 10;

// CEP de partida (cozinha da Gi) para cálculo de distância do frete
const CEP_COZINHA   = "M9N3G8";
// Faixas de frete por distância (em km) — ajuste os valores aqui
const FAIXAS_FRETE  = [
  {ateKm:4.5, valor:6},
  {ateKm:6.5, valor:8},
  {ateKm:10,  valor:15},
  {ateKm:20,  valor:25},
];
const LIMITE_ENTREGA_KM = 20; // acima disso, frete é combinado direto com a cozinha
const FRETE_MINIMO  = 5.0;
function freteParaDistancia(km){
  if(km>LIMITE_ENTREGA_KM) return null; // fora da área padrão — combinar com a cozinha
  const faixa = FAIXAS_FRETE.find(f=>km<=f.ateKm);
  const valor = faixa ? faixa.valor : FAIXAS_FRETE[FAIXAS_FRETE.length-1].valor;
  return Math.max(valor,FRETE_MINIMO);
}
const _geoCache = {};
async function geocodeFSA(cep){
  const fsa = (cep||"").replace(/\s/g,"").toUpperCase().slice(0,3);
  if(fsa.length<3) throw new Error("cep curto");
  if(_geoCache[fsa]) return _geoCache[fsa];
  const res = await fetch(`https://api.zippopotam.us/CA/${fsa}`);
  if(!res.ok) throw new Error("cep invalido");
  const data = await res.json();
  const place = data.places && data.places[0];
  if(!place) throw new Error("sem local");
  const geo = {lat:parseFloat(place.latitude), lon:parseFloat(place.longitude)};
  _geoCache[fsa] = geo;
  return geo;
}
function haversineKm(lat1,lon1,lat2,lon2){
  const R=6371;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

const PRATOS_BASE = [
  {id:"p1",nome:"Frango grelhado",desc:"Arroz, feijão, salada e frango grelhado ao molho.",preco:35,icon:"frango"},
  {id:"p2",nome:"Bife acebolado", desc:"Arroz, feijão, salada e bife acebolado.",          preco:35,icon:"carne"},
];

const CARDAPIO_PADRAO = {
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

// Sugestões padrão (2 opções por dia) — a Gi pode trocar pela tela da cozinha
const SUGESTOES_PADRAO = {
  segunda: ["bife_aceb","berinjela"],
  quarta:  ["frango_temp","mac_alfredo"],
  sexta:   ["strog_carne","lasanha_branco"],
};
const DIAS_SUGESTAO_KEYS = ["segunda","quarta","sexta"];

const T = {
  pt:{
    langBtn:"EN",langOther:"en",
    nav:["Cardápio","Carrinho","Pedidos","Especial","Feedback","Cozinha","Caixa"],
    sub:"COMIDA CASEIRA · GI TORRES",
    heroTit:"Marmita do dia",heroBase:"Toda marmita já vem com essa base:",
    escolhaCarne:"Escolha a carne do dia abaixo",
    boasVindas:nome=>`Olá, ${nome}! Qual o seu pedido de hoje?`,
    arroz:"Arroz",feijao:"Feijão",salada:"Salada / Legumes",
    pratosDia:"🥩 Pratos do dia",
    prazoLabel:"para escolher",prazoOff:"🔒 Prazo encerrado",
    prazoMsg:"Prazo encerrado. Prato definido pela cozinha:",
    segunda:"2ª opção",
    extra:"🥩 Carne extra",extraPor:"por 100g",extraInfo:"a mais",
    obsPh:"Observações (sem cebola, pouco sal...)",obsSave:"Salvar",obsCancel:"Cancelar",
    votTit:"Dê sua sugestão para a próxima semana",votOff:"🔒 Sugestão encerrada",
    votSub:"Vote na opção que você mais gostaria de comer em cada dia",
    votPrazo:"Prazo:",votado:"✓ Votado",
    votObrig:"Obrigada pelo voto! A cozinha vai adorar saber 💛",
    votMsg:"O prazo encerrou. A cozinha definiu o prato com base na votação:",
    votEncerrada:"O prazo encerrou. Obrigada por votar — a cozinha vai anunciar os pratos da semana em breve!",
    sugEscolher:"Escolher 2 pratos",sugSelecionados:"selecionados",sugConfirmar:"Confirmar sugestão",
    alterarVoto:"toque para alterar",sugSalvarAlteracao:"Salvar alteração",
    dia_segunda:"Segunda-feira",dia_quarta:"Quarta-feira",dia_sexta:"Sexta-feira",
    vazio:"Carrinho vazio",vazioPh:"Escolha no cardápio.",
    pedir:"Pedir pelo WhatsApp 💬",
    subtotal:"Subtotal",freteLabel:"Taxa de entrega",gorjetaLabel:"💛 Gorjeta",
    semGorjeta:"Nenhuma",totalLabel:"Total",gratis:"Grátis",
    gorjetaOutro:"💲 Outro valor",gorjetaOutroPh:"Valor (CA$)",doCep:"da cozinha",
    cadastrarBanner:"Cadastre seus dados para ver o valor da entrega",
    cadastrarPrimeiro:"Fazer meu cadastro",
    cadastrarTit:"Seus dados",cadastrarSub:"Preencha uma vez — usamos para calcular sua entrega.",
    continuar:"Continuar",seguirBtn:"Seguir para o carrinho",
    freteCombinar:"A combinar com a cozinha",falarCozinha:"Falar com a cozinha no WhatsApp",
    confirmarTit:"Confirmar pedido",nomeLabel:"Seu nome",nomePh:"Ex: Maria",naoVoce:"🗑 Não é você? Limpar",
    telLabel:"Telefone",telPh:"(647) 000-0000",
    pagLabel:"Pagamento",tipoLabel:"Tipo de entrega",endLabel:"Endereço",endPh:"123 Main St, Apt 4, Toronto, ON M5V 1A1",
    endApto:"Apto (opcional)",endBuzzer:"Buzzer (opcional)",
    pEt:"e-Transfer",pDin:"Dinheiro",pCart:"Cartão",
    etransferPara:"Enviar o e-Transfer para:",
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
    pedRec:"Pedidos recebidos",nenhumPed:"Nenhum pedido ativo",
    pedAtivos:"Ativos",pedHistorico:"Histórico",nenhumHist:"Nenhum pedido no histórico ainda",
    apagarPed:"Apagar do histórico",confirmApagar:"Apagar este pedido do histórico? Essa ação não pode ser desfeita.",
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
    cardCompTit:"📖 Cardápio completo",cardCompSub:"Todos os pratos que aparecem na votação e no cardápio completo",
    cardCompAdd:"Adicionar prato",
    cozEdit:"✏️ Editar",prazoTit:"Prazo de escolha",prazoEnc:"Encerrado — prato definido pela votação",
    calc:"Calculando...",votosLabel:"Votos",rankTit:"🗳️ Votos por prato",
    rankVazio:"Nenhum voto ainda.\nOs clientes votam no cardápio.",pratoFixo:"PRATO FIXO",
    editarSugestoes:"✏️ Editar sugestões",fecharEdicao:"✕ Fechar",
    sobremesaTit:"Sobremesa da semana",sobremesaSub:"Peça com antecedência — sujeito à disponibilidade.",
    sobEncBtn:"Sobremesa por encomenda",sobEncSub:"Conte pra Gi o que você gostaria — ela responde pelo WhatsApp com disponibilidade, valor e prazo de entrega. Também aceitamos encomendas de mini sobremesas para festas e eventos (catering)!",
    sobEncInsta:"Ver fotos no Instagram",
    sobEncDesc:"Qual sobremesa?",sobEncDescPh:"Ex: Brigadeiro, bolo de chocolate, pudim...",
    sobEncObsPh:"Alguma observação? (opcional)",sobEncEnviar:"Enviar encomenda pelo WhatsApp 💬",
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
    editPrecoExtraTit:"🥩 Valor da carne extra",editPrecoExtra:"Preço CA$",
    avisoTit:"⚠️ Aviso do dia (opcional)",
    avisoSub:"Use para informar clientes sobre ingredientes alternativos, substituições ou mudanças especiais desta semana.",
    avisoPh:"Ex: Esta semana o frango virá com molho de maracujá em vez do tradicional.",
    avisoLimpar:"✕ Limpar aviso",
    cardapioBtn:"📋 Cardápio completo",
    cComCarne:"🥩 Com carne",cSemCarne:"🥦 Sem carne",
    cBase:"🍱 Base de todas as marmitas",cPag:"💳 Pagamento",cEnt:"🛵 Entrega",
    entVariavel:"Calculada conforme a distância (a partir de $5)",
  },
  en:{
    langBtn:"PT",langOther:"pt",
    nav:["Menu","Cart","Orders","Special","Reviews","Kitchen","Finance"],
    sub:"HOME COOKING · GI TORRES",
    heroTit:"Meal of the day",heroBase:"Every meal already comes with this base:",
    escolhaCarne:"Choose today's meat below",
    boasVindas:nome=>`Hi, ${nome}! What would you like today?`,
    arroz:"Rice",feijao:"Beans",salada:"Salad / Veggies",
    pratosDia:"🥩 Today's dishes",
    prazoLabel:"left to choose",prazoOff:"🔒 Deadline passed",
    prazoMsg:"Deadline passed. Today's dish set by the kitchen:",
    segunda:"2nd option",
    extra:"🥩 Extra meat",extraPor:"per 100g",extraInfo:"extra",
    obsPh:"Notes (no onion, less salt...)",obsSave:"Save",obsCancel:"Cancel",
    votTit:"Give your suggestion for next week",votOff:"🔒 Voting closed",
    votSub:"Vote for the option you'd like to eat each day",
    votPrazo:"Deadline:",votado:"✓ Voted",
    votObrig:"Thanks for voting! The kitchen will love to know 💛",
    votMsg:"Voting closed. The kitchen set the dish based on votes:",
    votEncerrada:"Voting closed. Thanks for voting — the kitchen will announce the week's dishes soon!",
    sugEscolher:"Choose 2 dishes",sugSelecionados:"selected",sugConfirmar:"Confirm suggestion",
    alterarVoto:"tap to change",sugSalvarAlteracao:"Save change",
    dia_segunda:"Monday",dia_quarta:"Wednesday",dia_sexta:"Friday",
    vazio:"Cart is empty",vazioPh:"Choose from the menu.",
    pedir:"Order via WhatsApp 💬",
    subtotal:"Subtotal",freteLabel:"Delivery fee",gorjetaLabel:"💛 Tip",
    semGorjeta:"No tip",totalLabel:"Total",gratis:"Free",
    gorjetaOutro:"💲 Custom amount",gorjetaOutroPh:"Amount (CA$)",doCep:"from the kitchen",
    cadastrarBanner:"Register your info to see the delivery fee",
    cadastrarPrimeiro:"Register my info",
    cadastrarTit:"Your info",cadastrarSub:"Fill in once — we use it to calculate your delivery.",
    continuar:"Continue",seguirBtn:"Continue to cart",
    freteCombinar:"To confirm with the kitchen",falarCozinha:"Message the kitchen on WhatsApp",
    confirmarTit:"Confirm order",nomeLabel:"Your name",nomePh:"Ex: Maria",naoVoce:"🗑 Not you? Clear",
    telLabel:"Phone",telPh:"(647) 999-9999",
    pagLabel:"Payment",tipoLabel:"Delivery type",endLabel:"Address",endPh:"123 Main St, Apt 4, Toronto, ON M5V 1A1",
    endApto:"Apt (optional)",endBuzzer:"Buzzer (optional)",
    pEt:"e-Transfer",pDin:"Cash",pCart:"Card",
    etransferPara:"Send the e-Transfer to:",
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
    pedRec:"Orders received",nenhumPed:"No active orders",
    pedAtivos:"Active",pedHistorico:"History",nenhumHist:"No orders in history yet",
    apagarPed:"Delete from history",confirmApagar:"Delete this order from history? This can't be undone.",
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
    cardCompTit:"📖 Full menu",cardCompSub:"All dishes shown in voting and the full menu list",
    cardCompAdd:"Add dish",
    cozEdit:"✏️ Edit",prazoTit:"Voting deadline",prazoEnc:"Closed — dish set by vote count",
    calc:"Calculating...",votosLabel:"Votes",rankTit:"🗳️ Votes per dish",
    rankVazio:"No votes yet.\nClients vote in the menu.",pratoFixo:"TODAY'S DISH",
    editarSugestoes:"✏️ Edit suggestions",fecharEdicao:"✕ Close",
    sobremesaTit:"Dessert of the week",sobremesaSub:"Order ahead — subject to availability.",
    sobEncBtn:"Custom dessert order",sobEncSub:"Tell Gi what you'd like — she'll reply on WhatsApp with availability, price and delivery time. We also take orders for mini desserts for parties and events (catering)!",
    sobEncInsta:"See photos on Instagram",
    sobEncDesc:"Which dessert?",sobEncDescPh:"Ex: Brigadeiro, chocolate cake, pudding...",
    sobEncObsPh:"Any notes? (optional)",sobEncEnviar:"Send order via WhatsApp 💬",
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
    editPrecoExtraTit:"🥩 Extra meat price",editPrecoExtra:"Price CA$",
    avisoTit:"⚠️ Daily notice (optional)",
    avisoSub:"Use this to inform clients about alternative ingredients, substitutions or special changes this week.",
    avisoPh:"Ex: This week the chicken will come with passion fruit sauce instead of traditional.",
    avisoLimpar:"✕ Clear notice",
    cardapioBtn:"📋 Full menu",
    cComCarne:"🥩 With meat",cSemCarne:"🥦 No meat",
    cBase:"🍱 Included in every meal",cPag:"💳 Payment",cEnt:"🛵 Delivery",
    entVariavel:"Calculated by distance (from $5)",
  },
};

const fmt = v => `CA$ ${(Number(v)||0).toFixed(2)}`;
function fmtTel(val) {
  const d = val.replace(/\D/g,"").slice(0,10);
  if (d.length<=3)  return d.length?`(${d}`:"";
  if (d.length<=6)  return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
const horaEst = min => { const d = new Date(Date.now()+min*60000); return d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); };
const HORA_ENTREGA_PT = "18:30";
const HORA_ENTREGA_EN = "6:30pm";
const DIAS_PT = ["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
const DIAS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function previsaoEntrega(lang){
  const dia = (lang==="en"?DIAS_EN:DIAS_PT)[new Date().getDay()];
  return lang==="en" ? `After ${HORA_ENTREGA_EN} (${dia})` : `Após ${HORA_ENTREGA_PT} (${dia})`;
}
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

// Identifica o "ciclo" de votação atual: reinicia toda semana no sábado às 10h (hora de Toronto).
// Retorna a data (AAAA-MM-DD) do sábado que marca o início do ciclo em curso.
function cicloVotacaoAtual() {
  const now = getTorontoDate();
  const d = now.getDay(); // 0=Dom...6=Sáb
  const cursor = new Date(now);
  const diasDesdeSab = (d - 6 + 7) % 7;
  cursor.setDate(cursor.getDate() - diasDesdeSab);
  cursor.setHours(0,0,0,0);
  const sab10h = new Date(cursor);
  sab10h.setHours(10,0,0,0);
  if (now < sab10h) cursor.setDate(cursor.getDate() - 7);
  return cursor.toISOString().slice(0,10);
}

const DIAS_PEDIDO_NUM = {segunda:1,quarta:3,sexta:5}; // dia da semana (0=Dom) de cada opção de entrega
function diaUtilPadrao(){
  const d = getTorontoDate().getDay();
  const ordem = [["segunda",1],["quarta",3],["sexta",5]];
  for(const [key,num] of ordem){ if(d<=num) return key; }
  return "segunda";
}
function proximaDataDia(diaKey){
  const alvo = DIAS_PEDIDO_NUM[diaKey];
  const hoje = getTorontoDate();
  const diff = (alvo - hoje.getDay() + 7) % 7;
  const data = new Date(hoje);
  data.setDate(data.getDate()+diff);
  return data;
}
function fmtDataCurta(data){
  return data.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
}

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

const P=`#FFFCF7`,O=`#8B5A2B`,OE=`#5C3D1E`,CR=`#FFFFFF`,CA=`#F3E6D5`,TI=`#3B2A1A`,MU=`#8A7256`,BO=`#E0CBAE`,BL=`#8B5A2B33`,VE=`#25D366`;

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
  const uid=tipo; // sufixo pros gradientes (evita conflito visual entre tipos diferentes)
  const defsComuns=(
    <defs>
      <radialGradient id={`prato-${uid}`} cx="50%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.55"/>
        <stop offset="35%" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id={`sombra-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000" stopOpacity="0"/>
        <stop offset="100%" stopColor="#000" stopOpacity="0.22"/>
      </linearGradient>
    </defs>
  );
  const vapor=(
    <g opacity="0.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" fill="none">
      <path d="M20 14c-2 -3 2 -4 0 -7"/>
      <path d="M28 12c-2 -3 2 -4 0 -7"/>
      <path d="M36 14c-2 -3 2 -4 0 -7"/>
    </g>
  );
  if(tipo==="frango"||tipo==="veg") return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      {defsComuns}
      <ellipse cx="28" cy="45" rx="23" ry="6.5" fill="#000" opacity="0.10"/>
      <ellipse cx="28" cy="43" rx="22" ry="6.5" fill="#FBF3E4"/>
      <ellipse cx="28" cy="42.5" rx="22" ry="6" fill="#fff"/>
      <ellipse cx="28" cy="30" rx="15" ry="11.5" fill="#B8631F"/>
      <ellipse cx="28" cy="28.5" rx="13.5" ry="10" fill="#E8963F"/>
      <ellipse cx="28" cy="28.5" rx="13.5" ry="10" fill={`url(#sombra-${uid})`}/>
      <path d="M17 26c2 -6 6 -9 11 -9s9 3 11 9" stroke="#C9761F" strokeWidth="1.6" opacity="0.55" fill="none" strokeLinecap="round"/>
      <rect x="35" y="19" width="3" height="15" rx="1.5" fill="#F2E2BE" transform="rotate(8 36 26)"/>
      <ellipse cx="28" cy="28.5" rx="13.5" ry="10" fill={`url(#prato-${uid})`}/>
      {vapor}
    </svg>
  );
  if(tipo==="costela") return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      {defsComuns}
      <ellipse cx="28" cy="45" rx="23" ry="6.5" fill="#000" opacity="0.10"/>
      <ellipse cx="28" cy="43" rx="22" ry="6.5" fill="#FBF3E4"/>
      <ellipse cx="28" cy="42.5" rx="22" ry="6" fill="#fff"/>
      <rect x="13" y="23" width="30" height="17" rx="5" fill="#5E2515"/>
      <rect x="13" y="23" width="30" height="10" rx="5" fill="#8B3E24"/>
      <rect x="17" y="17" width="4.2" height="15" rx="2.1" fill="#F2E2BE"/>
      <rect x="25.5" y="15" width="4.2" height="17" rx="2.1" fill="#F2E2BE"/>
      <rect x="34" y="17" width="4.2" height="15" rx="2.1" fill="#F2E2BE"/>
      <path d="M15 27h26M15 32h26" stroke="#3F1A0E" strokeWidth="1.1" opacity="0.4"/>
      <rect x="13" y="23" width="30" height="17" rx="5" fill={`url(#prato-${uid})`}/>
      {vapor}
    </svg>
  );
  if(tipo==="linguica") return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      {defsComuns}
      <ellipse cx="28" cy="45" rx="23" ry="6.5" fill="#000" opacity="0.10"/>
      <ellipse cx="28" cy="43" rx="22" ry="6.5" fill="#FBF3E4"/>
      <ellipse cx="28" cy="42.5" rx="22" ry="6" fill="#fff"/>
      <ellipse cx="19" cy="31" rx="9" ry="5.6" fill="#6E2410" transform="rotate(-20 19 31)"/>
      <ellipse cx="37" cy="29" rx="9" ry="5.6" fill="#6E2410" transform="rotate(20 37 29)"/>
      <ellipse cx="28" cy="34" rx="9" ry="5.6" fill="#8B2E10"/>
      <ellipse cx="19" cy="31" rx="9" ry="5.6" fill={`url(#sombra-${uid})`} transform="rotate(-20 19 31)"/>
      <ellipse cx="37" cy="29" rx="9" ry="5.6" fill={`url(#sombra-${uid})`} transform="rotate(20 37 29)"/>
      <ellipse cx="17" cy="28" rx="2.6" ry="1.3" fill="#fff" opacity="0.35" transform="rotate(-20 17 28)"/>
      <ellipse cx="35" cy="26" rx="2.6" ry="1.3" fill="#fff" opacity="0.35" transform="rotate(20 35 26)"/>
      {vapor}
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      {defsComuns}
      <ellipse cx="28" cy="45" rx="23" ry="6.5" fill="#000" opacity="0.10"/>
      <ellipse cx="28" cy="43" rx="22" ry="6.5" fill="#FBF3E4"/>
      <ellipse cx="28" cy="42.5" rx="22" ry="6" fill="#fff"/>
      <ellipse cx="28" cy="30" rx="16" ry="11" fill="#5A2513"/>
      <ellipse cx="27" cy="28.5" rx="14" ry="9" fill="#9B4A2A"/>
      <path d="M17 25l20 7M17 30l20 6" stroke="#5A2513" strokeWidth="1.3" opacity="0.4" strokeLinecap="round"/>
      <ellipse cx="27" cy="28.5" rx="14" ry="9" fill={`url(#prato-${uid})`}/>
      {vapor}
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
  return (
    <ErrorBoundary>
      <AppInner/>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state={erro:null}; }
  static getDerivedStateFromError(erro){ return {erro}; }
  componentDidCatch(erro,info){ try{ console.error("Erro no app:",erro,info); }catch(_){} }
  render(){
    if(this.state.erro){
      return (
        <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:P,color:TI,padding:24,textAlign:"center",fontFamily:"sans-serif"}}>
          <div style={{fontSize:40,marginBottom:12}}>😔</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:8}}>Ops, algo deu errado</div>
          <div style={{fontSize:13,color:MU,marginBottom:20,maxWidth:320}}>Tenta recarregar a página. Se continuar acontecendo, avise a gente.</div>
          <button onClick={()=>window.location.reload()} style={{padding:"10px 24px",borderRadius:10,border:"none",background:O,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:16}}>Recarregar</button>
          <div style={{fontSize:10.5,color:MU,maxWidth:340,wordBreak:"break-word",background:CA,border:`1px solid ${BL}`,borderRadius:8,padding:"10px 12px",textAlign:"left"}}>
            <strong>Detalhe técnico (manda print pra Claude):</strong><br/>
            {String(this.state.erro?.message||this.state.erro)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const [lang,setLang]       = useState("pt");
  const t                    = T[lang];
  const [cozinhaVisivel,setCozinhaVisivel] = useState(()=>{ try{ return localStorage.getItem("acessoLiberado")==="1"; }catch(_){ return false; } });
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
        try{ localStorage.setItem("acessoLiberado","1"); }catch(_){}
        setAba("cozinha");
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
  const [cozinhaAuth,setCozinhaAuth]   = useState(()=>{ try{ return localStorage.getItem("cozinhaAutenticada")==="1"; }catch(_){ return false; } });
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
  const [menuDia,setMenuDia] = useState({pratosPorDia:{segunda:PRATOS_BASE,quarta:PRATOS_BASE,sexta:PRATOS_BASE},aviso:"",precoExtra:PRECO_100G_PADRAO});
  const [diaPedido,setDiaPedido] = useState(diaUtilPadrao());
  const [cardapio,setCardapio] = useState(()=>{
    try{ const s=JSON.parse(localStorage.getItem("cardapioCompleto")||"null"); if(s&&s.carne&&s.veg) return s; }catch(_){}
    return CARDAPIO_PADRAO;
  });
  const todosPratos = [...cardapio.carne, ...cardapio.veg];
  function dishById(id){ return todosPratos.find(d=>d.id===id); }
  const [editandoCardapio,setEditandoCardapio] = useState(false);
  const [cardapioTemp,setCardapioTemp] = useState(null);
  const [sobEncForm,setSobEncForm] = useState({nome:"",tel:"",desc:"",obs:""});
  const [sobEncErro,setSobEncErro] = useState("");
  const [sobEncModal,setSobEncModal] = useState(false);
  const [linkCopiado,setLinkCopiado] = useState(false);
  const PRATOS               = (menuDia.pratosPorDia?.[diaPedido]||[]).map(p=>{ const base=dishById(p.id); return base?{...p,nome:base.nome,icon:base.icon}:p; });
  const precoExtra            = menuDia.precoExtra ?? PRECO_100G_PADRAO;
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
  const [form,setForm]           = useState(()=>{
    try{
      const salvo=JSON.parse(localStorage.getItem("dadosCliente")||"null");
      if(salvo) return {nome:"",tel:"",tipo:"entrega",pag:"etransfer",alergia:null,alergiaDesc:"",endProv:"ON",endApto:"",endBuzzer:"",...salvo};
    }catch(_){}
    return {nome:"",tel:"",tipo:"entrega",end:"",endApto:"",endBuzzer:"",endCity:"",endProv:"ON",endCep:"",pag:"etransfer",alergia:null,alergiaDesc:""};
  });
  const [especForm,setEspecForm] = useState({nome:"",tel:"",desc:"",obs:""});
  const [especErro,setEspecErro] = useState("");
  const [gorjeta,setGorjeta]     = useState(0);
  const [gorjetaModo,setGorjetaModo] = useState("percent");
  const [gorjetaCustom,setGorjetaCustom] = useState("");
  const [distanciaKm,setDistanciaKm] = useState(null);
  const [freteStatus,setFreteStatus] = useState("idle"); // idle | calculando | ok | erro
  const [dadosPreModal,setDadosPreModal] = useState(false);
  const [erro,setErro]           = useState("");
  const [checkout,setCheckout]   = useState(false);
  const [alerta,setAlerta]       = useState(null);
  const [novos,setNovos]         = useState(0);
  useEffect(()=>{ if(aba==="pedidos") setNovos(0); },[aba]);
  const [verHistorico,setVerHistorico] = useState(false);
  const [votosSug,setVotosSug]         = useState({segunda:{},quarta:{},sexta:{}});
  const [votoFeitoSug,setVotoFeitoSug] = useState(()=>{
    const limpo={segunda:null,quarta:null,sexta:null};
    try{
      const v=JSON.parse(localStorage.getItem("votoFeitoSemana")||"null");
      if(v&&typeof v==="object"){
        for(const k of ["segunda","quarta","sexta"]){ if(Array.isArray(v[k])&&v[k].length===2) limpo[k]=v[k]; }
      }
    }catch(_){}
    return limpo;
  });
  const [selecaoDia,setSelecaoDia] = useState({segunda:[],quarta:[],sexta:[]});
  const [diaAberto,setDiaAberto] = useState(null);
  const [cardapioOpen,setCardapioOpen] = useState(false);
  const [enviando,setEnviando]   = useState(null);
  const [fbAberto,setFbAberto]   = useState(null);
  const [fbTxt,setFbTxt]         = useState("");
  // eslint-disable-next-line no-unused-vars
  const [tick,setTick]           = useState(0);
  const prev = useRef(0);
  const [cicloVotos,setCicloVotos] = useState(null);
  const [votosCarregados,setVotosCarregados] = useState(false);

  useEffect(()=>{ const id=setInterval(()=>setTick(n=>n+1),60000); return()=>clearInterval(id); },[]);
  useEffect(()=>{
    const unsubMenu = onSnapshot(doc(db,"estado","menu"), snap=>{
      if(snap.exists()){
        const d=snap.data();
        const padrao={segunda:PRATOS_BASE,quarta:PRATOS_BASE,sexta:PRATOS_BASE};
        setMenuDia({pratosPorDia:d.pratosPorDia||padrao,aviso:d.aviso||"",precoExtra:d.precoExtra??PRECO_100G_PADRAO});
      }
    }, ()=>{});
    const unsubCardapio = onSnapshot(doc(db,"estado","cardapioCompleto"), snap=>{
      if(snap.exists()){ const d=snap.data(); if(d.carne&&d.veg){ setCardapio(d); try{ localStorage.setItem("cardapioCompleto",JSON.stringify(d)); }catch(_){} } }
    }, ()=>{});
    const unsubVotos = onSnapshot(doc(db,"estado","votos"), snap=>{
      if(snap.exists()){
        const {ciclo,...dias}=snap.data();
        setVotosSug(v=>({segunda:{},quarta:{},sexta:{},...v,...dias}));
        setCicloVotos(ciclo||null);
      }
      setVotosCarregados(true);
    }, ()=>{ setVotosCarregados(true); });
    return ()=>{ unsubMenu(); unsubCardapio(); unsubVotos(); };
  },[]);
  useEffect(()=>{
    // Reinicia o "já votei" deste celular quando começa um novo ciclo de votação
    const ciclo=cicloVotacaoAtual();
    try{
      const ultimo=localStorage.getItem("cicloVotoLocal");
      if(ultimo!==ciclo){
        localStorage.setItem("cicloVotoLocal",ciclo);
        localStorage.removeItem("votoFeitoSemana");
        setVotoFeitoSug({segunda:null,quarta:null,sexta:null});
      }
    }catch(_){}
    // Reinicia os votos compartilhados (uma vez, quando o primeiro celular perceber o novo ciclo)
    if(votosCarregados&&cicloVotos!==ciclo){
      setDoc(doc(db,"estado","votos"),{segunda:{},quarta:{},sexta:{},ciclo}).catch(()=>{});
    }
  },[tick,votosCarregados,cicloVotos]);
  useEffect(()=>{
    if(form.tipo!=="entrega"){ setFreteStatus("idle"); setDistanciaKm(null); return; }
    const cep=(form.endCep||"").replace(/\s/g,"").toUpperCase();
    if(cep.length<3){ setFreteStatus("idle"); setDistanciaKm(null); return; }
    let cancelado=false;
    setFreteStatus("calculando");
    (async()=>{
      try{
        const [origem,destino]=await Promise.all([geocodeFSA(CEP_COZINHA),geocodeFSA(cep)]);
        if(cancelado) return;
        setDistanciaKm(haversineKm(origem.lat,origem.lon,destino.lat,destino.lon));
        setFreteStatus("ok");
      }catch(_){ if(!cancelado){ setDistanciaKm(null); setFreteStatus("erro"); } }
    })();
    return ()=>{cancelado=true;};
  },[form.endCep,form.tipo]);
  useEffect(()=>{ if(pedidos.length>prev.current){beep();try{navigator.vibrate&&navigator.vibrate([200,100,200]);}catch(_){}} prev.current=pedidos.length; },[pedidos.length]);

  const expirou  = prazoExpirou();
  const restante = tempoRestante();
  const lembrete = deveEnviarLembrete();

  const itens = useMemo(()=>
    Object.entries(carrinho).filter(([,q])=>q>0).map(([id,qty])=>{
      const p=PRATOS.find(x=>x.id===id); if(!p) return null;
      const e=extra[id]||0;
      return {id,nome:p.nome+(e>0?` +${e*100}g`:""),icon:p.icon,preco:p.preco+e*precoExtra,e,qty,obs:obs[id]||""};
    }).filter(Boolean),[carrinho,obs,extra,PRATOS,precoExtra]);

  const sub   = itens.reduce((s,i)=>s+i.preco*i.qty,0);
  const foraArea = form.tipo==="entrega" && distanciaKm!=null && distanciaKm>LIMITE_ENTREGA_KM;
  const frete = form.tipo!=="entrega" ? 0 : (foraArea ? 0 : (distanciaKm!=null ? freteParaDistancia(distanciaKm) : Math.max(TAXA_ENTREGA,FRETE_MINIMO)));
  const dadosCompletos = !!(form.nome.trim()&&form.tel.trim()&&(form.tipo!=="entrega"||(form.end.trim()&&form.endCep.trim())));
  const gVal  = gorjetaModo==="valor" ? (parseFloat(gorjetaCustom.replace(",","."))||0) : Math.round(sub*gorjeta)/100;
  const total = sub+frete+gVal;
  const nCart = itens.reduce((s,i)=>s+i.qty,0);

  function toggleSelecaoDia(dia,id){
    if(expirou) return;
    setSelecaoDia(sd=>{
      const atual=sd[dia]||[];
      if(atual.includes(id)) return {...sd,[dia]:atual.filter(x=>x!==id)};
      if(atual.length>=2) return sd;
      return {...sd,[dia]:[...atual,id]};
    });
  }
  function confirmarSugestaoDia(dia){
    const escolha=selecaoDia[dia]||[];
    if(escolha.length!==2||expirou) return;
    const anterior=votoFeitoSug[dia]||[];
    const delta={};
    anterior.forEach(id=>{ delta[id]=(delta[id]||0)-1; });
    escolha.forEach(id=>{ delta[id]=(delta[id]||0)+1; });
    setVotosSug(v=>{
      const diaVotos={...(v[dia]||{})};
      Object.entries(delta).forEach(([id,d])=>{ diaVotos[id]=Math.max(0,(diaVotos[id]||0)+d); });
      return {...v,[dia]:diaVotos};
    });
    setVotoFeitoSug(v=>{
      const novo={...v,[dia]:escolha};
      try{ localStorage.setItem("votoFeitoSemana",JSON.stringify(novo)); }catch(_){}
      return novo;
    });
    const mudou=Object.fromEntries(Object.entries(delta).filter(([,d])=>d!==0).map(([id,d])=>[id,increment(d)]));
    if(Object.keys(mudou).length) setDoc(doc(db,"estado","votos"),{[dia]:mudou},{merge:true}).catch(()=>{});
  }
  async function compartilharApp(){
    const texto="🍲 Conheça o Tempero da Vó — comida caseira brasileira em Toronto! Peça pelo app:";
    if(navigator.share){
      try{ await navigator.share({title:"Tempero da Vó",text:texto,url:SITE_URL}); }catch(_){}
    }else{
      try{ await navigator.clipboard.writeText(`${texto} ${SITE_URL}`); setLinkCopiado(true); setTimeout(()=>setLinkCopiado(false),2500); }catch(_){}
    }
  }
  function enviarEncomendaSobremesa(){
    if(!sobEncForm.nome.trim()||!sobEncForm.tel.trim()){setSobEncErro(t.espENome);return;}
    if(!sobEncForm.desc.trim()){setSobEncErro(t.espEDesc);return;}
    setSobEncErro("");
    const num=String(Date.now()).slice(-4);
    const msg=`🍰 *SOBREMESA POR ENCOMENDA #${num}*\n\n👤 ${sobEncForm.nome}\n📞 ${sobEncForm.tel}\n\n🍮 ${sobEncForm.desc}`+(sobEncForm.obs?`\n\n📝 ${sobEncForm.obs}`:``)+`\n\nPor favor responda com disponibilidade, valor e prazo de entrega!`;
    window.location.href=`https://wa.me/${SEU_WHATSAPP}?text=${encodeURIComponent(msg)}`;
    setSobEncForm({nome:"",tel:"",desc:"",obs:""});
    setSobEncModal(false);
  }

  function escolherDiaPedido(novoDia){
    if(novoDia===diaPedido) return;
    setDiaPedido(novoDia);
    setCarrinho({}); setExtra({}); setObs({});
  }
  function apagarPedido(id){
    if(window.confirm(t.confirmApagar)) setPedidos(p=>p.filter(x=>x.id!==id));
  }
  function abrirEdicaoCardapio(){
    setCardapioTemp({carne:cardapio.carne.map(d=>({...d})),veg:cardapio.veg.map(d=>({...d}))});
    setEditandoCardapio(true);
  }
  function addPratoCardapio(cat){
    setCardapioTemp(t=>({...t,[cat]:[...t[cat],{id:"novo_"+Date.now(),nome:"",icon:cat==="veg"?"veg":"carne"}]}));
  }
  function removerPratoCardapio(cat,idx){
    setCardapioTemp(t=>({...t,[cat]:t[cat].filter((_,i)=>i!==idx)}));
  }
  function salvarCardapioCompleto(){
    const limpo={
      carne:cardapioTemp.carne.filter(d=>d.nome.trim()).map(d=>({...d,nome:d.nome.trim()})),
      veg:cardapioTemp.veg.filter(d=>d.nome.trim()).map(d=>({...d,nome:d.nome.trim()})),
    };
    setCardapio(limpo);
    try{ localStorage.setItem("cardapioCompleto",JSON.stringify(limpo)); }catch(_){}
    setDoc(doc(db,"estado","cardapioCompleto"),limpo).catch(()=>{});
    setEditandoCardapio(false);
  }
  function enviar(){
    if(!form.nome.trim()||!form.tel.trim()){setErro(t.eNome);return;}
    if(form.tipo==="entrega"&&(!form.end.trim()||!form.endCity?.trim()||!form.endProv?.trim()||!form.endCep?.trim())){setErro(t.eEnd);return;}
    if(!itens.length){setErro(t.eCart);return;}
    if(form.alergia===null){setErro(t.eAl);return;}
    if(form.alergia&&!form.alergiaDesc.trim()){setErro(t.eAlDesc);return;}
    setErro("");
    const hr=previsaoEntrega(lang);
    const num=String(Date.now()).slice(-4);
    const lns=itens.map(i=>`• ${i.qty}x ${i.nome} — ${fmt(i.preco*i.qty)}`+(i.obs?`\n  ✏️ ${i.obs}`:``)).join("\n");
    const lA=form.alergia?`\n🚨 ALERGIA: ${form.alergiaDesc}`:"";
    const lF=foraArea?`🛵 Taxa: ⚠️ FORA DA ÁREA PADRÃO (~${distanciaKm.toFixed(1)}km) — combinar frete com o cliente\n`:frete>0?`🛵 Taxa: ${fmt(frete)}\n`:"";
    const lG=gVal>0?`💛 Gorjeta: ${fmt(gVal)}\n`:"";
    const lP=form.pag==="etransfer"?"📧 e-Transfer":form.pag==="dinheiro"?"💵 Dinheiro":"💳 Cartão";
    const end=form.tipo==="entrega"?`📍 ${form.end}${form.endApto?` Apt ${form.endApto}`:""}, ${form.endCity||""}, ${form.endProv||""} ${form.endCep||""}${form.endBuzzer?`\n🔔 Buzzer: ${form.endBuzzer}`:""}`:"🏠 Retirada";
    const msgCoz=`🔔 *PEDIDO #${num}*${form.alergia?"\n🚨 ALERGIA — LEIA ANTES DE PREPARAR":""}\n\n📅 ${t[`dia_${diaPedido}`]} (${fmtDataCurta(proximaDataDia(diaPedido))})\n\n${lns}\n\n${lF}${lG}💰 *Total: ${fmt(total)}*\n${lP}${lA}\n\n👤 ${form.nome} · 📞 ${form.tel}\n${end}\n⏱ ${hr}`;
    const tel=form.tel.replace(/\D/g,"");
    setClientes(p=>p.find(c=>c.tel.replace(/\D/g,"")===tel)?p:[...p,{id:Date.now(),nome:form.nome,tel:form.tel}]);
    try{ localStorage.setItem("dadosCliente",JSON.stringify({nome:form.nome,tel:form.tel,end:form.end,endApto:form.endApto,endBuzzer:form.endBuzzer,endCity:form.endCity,endProv:form.endProv,endCep:form.endCep})); }catch(_){}
    const novo={id:Date.now(),num,cliente:form.nome,tel:form.tel,dia:diaPedido,itens:itens.map(i=>`${i.qty}x ${i.nome}`).join(", "),sub,frete,gorjeta:gVal,total,tipo:form.tipo,end:form.end,endApto:form.endApto||"",endBuzzer:form.endBuzzer||"",endCity:form.endCity||"",endProv:form.endProv||"",endCep:form.endCep||"",hora:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),previsao:hr,alergia:form.alergia,alergiaDesc:form.alergiaDesc,ciente:false,pago:false,entregue:false,comentario:""};
    setPedidos(p=>[novo,...p]);setNovos(n=>n+1);
    setAlerta({num,nome:form.nome,total,hora:hr,alergia:form.alergia,alergiaDesc:form.alergiaDesc});
    window.location.href=`https://wa.me/${SEU_WHATSAPP}?text=${encodeURIComponent(msgCoz)}`;
    setCarrinho({});setObs({});setExtra({});setGorjeta(0);setGorjetaModo("percent");setGorjetaCustom("");setCheckout(false);
    setForm(f=>({...f,tipo:"entrega",pag:"etransfer",alergia:null,alergiaDesc:""}));setAba("pedidos");
  }

  function msgMenu(nome){
    const hoje=new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"});
    const ps=PRATOS.map(p=>`🍱 *${p.nome}* — ${fmt(p.preco)}\n   ${p.desc}`).join("\n\n");
    const av=menuDia.aviso?`\n\n⚠️ *Aviso:* ${menuDia.aviso}`:"";
    return `🍱 *Cardápio — Tempero da Vó*\n${hoje}\n\nOlá, ${nome}! 👋\n\n${ps}${av}\n\nBase: 🍚 Arroz · 🫘 Feijão · 🥗 Salada\n\n🛵 Entrega: calculada pela distância · 🏠 Retirada: grátis\n\nPeça pelo app! 😊`;
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
    pratosHoje:{background:CA,border:`1px solid ${BL}`,borderRadius:14,padding:"12px 14px",marginBottom:12},
    cardTit:{fontWeight:700,fontSize:13,color:O,marginBottom:10},
    pratoVis:{display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:CA,border:`1px solid ${BL}`,borderRadius:12,padding:"10px 8px",flex:1,minWidth:0},
    pratoCard:{background:CA,border:`1px solid ${BL}`,borderRadius:16,marginBottom:12,overflow:"hidden"},
    votCard:{background:CA,border:`1px solid ${BL}`,borderRadius:14,padding:"12px 14px",marginBottom:12},
    itemCart:{background:CA,border:`1px solid ${BL}`,borderRadius:14,padding:12,display:"flex",gap:10,alignItems:"center"},
    resumo:{background:CA,border:`1px solid ${BL}`,borderRadius:14,padding:"12px 14px",marginBottom:12},
    resumoL:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,marginBottom:7},
    step:{display:"flex",alignItems:"center",gap:6,background:CA,borderRadius:20,padding:"3px 8px",flexShrink:0,border:`1px solid ${BL}`},
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
    inp:{width:"100%",padding:"9px 11px",borderRadius:9,border:"1px solid #8B5A2B66",fontSize:13,background:"#FBF6EA",color:"#2A1F00",fontFamily:"inherit",boxSizing:"border-box"},
  };

  const NAV = t.nav;

  return (
    <div style={s.page}>

      {alerta&&(
        <div style={{width:"100%",background:alerta.alergia?"#A03030":"#FBF3E4",border:`1px solid ${alerta.alergia?"#FF6060":O}`,color:alerta.alergia?"#fff":O,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
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
            {form.nome&&form.nome.trim()
              ?<div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:22,color:O,marginBottom:10,textAlign:"center"}}>
                  {t.boasVindas(form.nome.trim())}
                </div>
              :<button onClick={()=>setDadosPreModal(true)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${O}`,background:CA,color:O,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:12}}>
                  <span style={{fontSize:18}}>👤</span> {t.cadastrarPrimeiro}
                </button>
            }
            {nCart>0&&!dadosCompletos&&(
              <button onClick={()=>setDadosPreModal(true)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${O}`,background:CA,color:O,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:12}}>
                <span style={{fontSize:18}}>📋</span> {t.cadastrarBanner}
              </button>
            )}
            <div style={s.hero}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={s.heroTit}>{t.heroTit}</div>
                <button style={s.btnList} onClick={()=>setCardapioOpen(true)}>{t.cardapioBtn}</button>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
                <div style={{flexShrink:0}}><Marmita size={56}/></div>
                <div style={{fontSize:12.5,color:TI,lineHeight:1.5,fontWeight:600}}>{t.heroBase}</div>
              </div>
              <div style={s.baseRow}>
                <div style={s.baseItem}><IcoArroz size={36}/><span>{t.arroz}</span></div>
                <div style={s.baseItem}><IcoFeijao size={36}/><span>{t.feijao}</span></div>
                <div style={s.baseItem}><IcoSalada size={36}/><span>{t.salada}</span></div>
              </div>
              <div style={{marginTop:10,fontSize:12,color:O,fontWeight:700,textAlign:"center",background:CA,borderRadius:8,padding:"7px 8px"}}>
                👇 {t.escolhaCarne}
              </div>
            </div>

            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {DIAS_SUGESTAO_KEYS.map(dia=>{
                const ativo=diaPedido===dia;
                return (
                  <button key={dia} onClick={()=>escolherDiaPedido(dia)}
                    style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"9px 4px",borderRadius:12,border:ativo?`2px solid ${O}`:`1px solid ${BL}`,background:ativo?CA:P,cursor:"pointer"}}>
                    <span style={{fontSize:12.5,fontWeight:700,color:ativo?O:TI}}>{t[`dia_${dia}`]}</span>
                    <span style={{fontSize:10.5,color:MU}}>{fmtDataCurta(proximaDataDia(dia))}</span>
                  </button>
                );
              })}
            </div>
            <div style={s.pratosHoje}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{...s.cardTit,fontSize:11.5,opacity:0.85}}>{t.pratosDia} — {t[`dia_${diaPedido}`]}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                {PRATOS.map((p,i)=>(
                  <div key={i} style={{...s.pratoVis,padding:"7px 6px"}}>
                    <IcoCarne tipo={p.icon} size={30}/>
                    <div style={{fontSize:10,fontWeight:600,textAlign:"center",color:TI,lineHeight:1.2,wordBreak:"break-word"}}>{p.nome}</div>
                    <div style={{fontSize:10,color:O,fontWeight:700}}>{fmt(p.preco)}</div>
                  </div>
                ))}
              </div>
            </div>

            {menuDia.aviso&&menuDia.aviso.trim()&&(
              <div style={{background:CA,border:`1px solid ${O}`,borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
                <div><div style={{fontWeight:700,fontSize:12,color:O,marginBottom:3}}>{t.avisoAtivo}</div><div style={{fontSize:12.5,color:TI,lineHeight:1.4}}>{menuDia.aviso}</div></div>
              </div>
            )}

            {PRATOS.map(p=>{
              const q=carrinho[p.id]||0, painelObs=obsAberto===p.id, temObs=obs[p.id]?.trim();
              return (
                <div key={p.id} style={s.pratoCard}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start",padding:14}}>
                    <div style={{flexShrink:0,width:84,height:84,borderRadius:"50%",background:"radial-gradient(circle at 35% 30%, #FFD9A0, #F5A623 62%, #E8963F)",boxShadow:"0 3px 10px rgba(245,166,35,0.45)",display:"flex",alignItems:"center",justifyContent:"center"}}><IcoCarne tipo={p.icon} size={70}/></div>
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
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:CA,borderRadius:8,padding:"7px 10px",border:`1px solid ${BL}`}}>
                        <div style={{fontSize:12.5,fontWeight:600,color:TI}}>{t.extra} <span style={{fontSize:11,fontWeight:400,color:MU}}>+{fmt(precoExtra)}/{t.extraPor}</span></div>
                        <div style={s.step}>
                          <button style={s.stepBtn} onClick={()=>setExtra(e=>({...e,[p.id]:Math.max(0,(e[p.id]||0)-1)}))}>−</button>
                          <span style={s.stepN}>{extra[p.id]||0}</span>
                          <button style={s.stepBtn} onClick={()=>setExtra(e=>({...e,[p.id]:(e[p.id]||0)+1}))}>+</button>
                        </div>
                      </div>
                      {(extra[p.id]||0)>0&&<div style={{fontSize:11.5,color:O,fontWeight:600}}>+{(extra[p.id]||0)*100}g · {fmt((extra[p.id]||0)*precoExtra)} {t.extraInfo}</div>}
                      {painelObs
                        ?<ObsPanel val={obs[p.id]||""} onSave={txt=>{setObs(o=>({...o,[p.id]:txt}));setObsAberto(null);}} onClose={()=>setObsAberto(null)} t={t}/>
                        :<button style={s.btnObs} onClick={()=>setObsAberto(p.id)}>✏️ {temObs?`"${obs[p.id]}"`:t.obsPh}</button>
                      }
                    </div>
                  )}
                </div>
              );
            })}

            <button onClick={()=>setSobEncModal(true)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 0",borderRadius:12,border:`1.5px dashed ${O}`,background:"transparent",color:O,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:4}}>
              🍰 {t.sobEncBtn}
            </button>
            <a href={`https://instagram.com/${INSTAGRAM_GI}`} target="_blank" rel="noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"fit-content",margin:"0 auto 12px",padding:"7px 16px",borderRadius:20,background:"linear-gradient(45deg,#FEDA75,#FA7E1E,#D62976,#962FBF,#4F5BD5)",color:"#fff",fontWeight:700,fontSize:12.5,textDecoration:"none",boxShadow:"0 2px 8px rgba(214,41,118,0.35)"}}>
              📷 {t.sobEncInsta}
            </a>

            <div style={s.votCard}>
              <div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:19,color:O,marginBottom:4}}>{expirou?t.votOff:t.votTit}</div>
              {!expirou&&restante&&(
                <div style={{display:"flex",alignItems:"center",gap:6,background:CA,border:`1px solid ${O}`,borderRadius:20,padding:"5px 12px",marginBottom:10,width:"fit-content"}}>
                  <span style={{fontSize:13,color:O,fontWeight:700}}>⏱ {t.votPrazo} {restante}</span>
                </div>
              )}
              {expirou&&<div style={{fontSize:12,color:MU,marginBottom:8,lineHeight:1.5}}>{t.votEncerrada}</div>}
              {!expirou&&<div style={{fontSize:12,color:MU,marginBottom:10}}>{t.votSub}</div>}
              <div style={{opacity:expirou?.5:1}}>
                {DIAS_SUGESTAO_KEYS.map(dia=>{
                  const votado=votoFeitoSug[dia];
                  const sel=selecaoDia[dia]||[];
                  const aberto=diaAberto===dia;
                  return (
                    <div key={dia} style={{marginBottom:10,border:`1px solid ${BL}`,borderRadius:12,overflow:"hidden"}}>
                      <button disabled={expirou} onClick={()=>{
                          setDiaAberto(a=>{
                            if(a===dia){ setSelecaoDia(sd=>({...sd,[dia]:votado||[]})); return null; }
                            if(votado) setSelecaoDia(sd=>({...sd,[dia]:votado}));
                            return dia;
                          });
                        }}
                        style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"transparent",border:"none",cursor:expirou?"default":"pointer"}}>
                        <span style={{fontSize:11,fontWeight:700,color:O,letterSpacing:"0.06em",textTransform:"uppercase"}}>{t[`dia_${dia}`]}</span>
                        {votado
                          ?<span style={{fontSize:11,color:"#3A8A30",fontWeight:700}}>✓ {t.votado}{!expirou&&` · ${aberto?"▲":t.alterarVoto}`}</span>
                          :<span style={{fontSize:11,color:MU}}>{aberto?"▲":"▼"} {t.sugEscolher}</span>}
                      </button>
                      {Array.isArray(votado)&&!aberto&&(
                        <div style={{padding:"0 12px 10px",fontSize:12,color:TI}}>
                          {votado.map(id=>dishById(id)?.nome).filter(Boolean).join(" · ")}
                        </div>
                      )}
                      {aberto&&!expirou&&(
                        <div style={{padding:"0 12px 12px"}}>
                          <div style={{fontSize:11,color:O,fontWeight:600,marginBottom:6}}>{sel.length}/2 {t.sugSelecionados}</div>
                          <div style={{maxHeight:220,overflowY:"auto"}}>
                            {[{label:t.cComCarne,lista:cardapio.carne},{label:t.cSemCarne,lista:cardapio.veg}].map(g=>(
                              <div key={g.label}>
                                <div style={{fontSize:9.5,fontWeight:700,color:MU,padding:"5px 0 3px",letterSpacing:"0.06em",textTransform:"uppercase"}}>{g.label}</div>
                                {g.lista.map(c=>{
                                  const esv=sel.includes(c.id);
                                  const cheio=sel.length>=2&&!esv;
                                  return (
                                    <button key={c.id} disabled={cheio} onClick={()=>toggleSelecaoDia(dia,c.id)}
                                      style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 8px",border:esv?`2px solid ${O}`:`1px solid ${BL}`,borderRadius:9,background:esv?CA:"transparent",cursor:cheio?"default":"pointer",opacity:cheio?.4:1,marginBottom:3}}>
                                      <IcoCarne tipo={c.icon} size={24}/>
                                      <span style={{flex:1,textAlign:"left",fontSize:12,color:esv?O:TI}}>{c.nome}</span>
                                      {esv&&<span style={{color:O,fontWeight:700,fontSize:12}}>✓</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                          <button disabled={sel.length!==2} onClick={()=>{confirmarSugestaoDia(dia);setDiaAberto(null);}}
                            style={{...s.btnPrinc,marginTop:8,padding:"9px 0",fontSize:13,opacity:sel.length!==2?.5:1}}>
                            {votado?t.sugSalvarAlteracao:t.sugConfirmar}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {!expirou&&Object.values(votoFeitoSug).some(Boolean)&&<div style={{fontSize:12,color:O,textAlign:"center",padding:8,background:CA,borderRadius:8,border:`1px solid ${BL}`,marginTop:4}}>{t.votObrig}</div>}
            </div>
            {/* Botão flutuante carrinho */}
            {nCart>0&&(
              <div style={{position:"sticky",bottom:0,padding:"10px 0 4px",background:`linear-gradient(transparent, ${P} 60%)`}}>
                <button onClick={()=>{ if(!dadosCompletos){ setDadosPreModal(true);} else { setAba("carrinho"); } }}
                  style={{width:"100%",padding:"14px 0",borderRadius:12,border:"none",background:VE,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <span>🛒</span>
                  <span>{t.seguirBtn} ({nCart} {nCart===1?"item":"itens"}) — {fmt(sub)}</span>
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
                  <div style={s.resumoL}><span style={{color:MU}}>{t.freteLabel}</span><span style={{color:foraArea?"#E05050":O,fontWeight:600}}>{form.tipo==="retirada"?t.gratis:foraArea?t.freteCombinar:freteStatus==="calculando"?t.calc:fmt(frete)}</span></div>
                  {form.tipo==="entrega"&&distanciaKm!=null&&<div style={{fontSize:10.5,color:MU,marginTop:-4,marginBottom:6}}>📍 ~{distanciaKm.toFixed(1)} km {t.doCep}</div>}
                  {foraArea&&(
                    <button onClick={()=>window.location.href=`https://wa.me/${SEU_WHATSAPP}?text=${encodeURIComponent(`Olá! Meu endereço fica a ~${distanciaKm.toFixed(1)}km da cozinha, fora da área padrão de entrega. Poderia me passar o valor do frete?`)}`}
                      style={{width:"100%",padding:"8px 0",borderRadius:10,border:"1px solid #E05050",background:"transparent",color:"#E05050",fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:8}}>
                      💬 {t.falarCozinha}
                    </button>
                  )}
                  <div style={{...s.resumoL,flexDirection:"column",alignItems:"flex-start",gap:8}}>
                    <span style={{color:MU}}>{t.gorjetaLabel}</span>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {GORJETAS.map(gp=>(
                        <button key={gp} onClick={()=>{setGorjeta(gp);setGorjetaModo("percent");}} style={{padding:"6px 10px",borderRadius:20,border:gorjetaModo==="percent"&&gorjeta===gp?`1.5px solid ${O}`:`1px solid ${BL}`,background:gorjetaModo==="percent"&&gorjeta===gp?CA:"transparent",color:gorjetaModo==="percent"&&gorjeta===gp?O:MU,fontSize:12,cursor:"pointer",fontWeight:gorjetaModo==="percent"&&gorjeta===gp?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                          {gp===0?t.semGorjeta:`${gp}%`}
                          {gp>0&&<span style={{fontSize:9,opacity:.8}}>{fmt(Math.round(sub*gp)/100)}</span>}
                        </button>
                      ))}
                      <button onClick={()=>setGorjetaModo("valor")} style={{padding:"6px 10px",borderRadius:20,border:gorjetaModo==="valor"?`1.5px solid ${O}`:`1px solid ${BL}`,background:gorjetaModo==="valor"?CA:"transparent",color:gorjetaModo==="valor"?O:MU,fontSize:12,cursor:"pointer",fontWeight:gorjetaModo==="valor"?700:400}}>
                        {t.gorjetaOutro}
                      </button>
                    </div>
                    {gorjetaModo==="valor"&&(
                      <input type="number" min="0" step="0.5" value={gorjetaCustom} onChange={e=>setGorjetaCustom(e.target.value)} placeholder={t.gorjetaOutroPh}
                        style={{...s.inp,maxWidth:140,marginTop:2}}/>
                    )}
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
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <button onClick={()=>setVerHistorico(false)} style={{flex:1,padding:"9px 0",borderRadius:10,border:!verHistorico?`2px solid ${O}`:`1px solid ${BL}`,background:!verHistorico?CA:"transparent",color:!verHistorico?O:MU,fontWeight:700,fontSize:12.5,cursor:"pointer"}}>
                📋 {t.pedAtivos} {pedidos.filter(p=>!p.pago).length>0&&`(${pedidos.filter(p=>!p.pago).length})`}
              </button>
              <button onClick={()=>setVerHistorico(true)} style={{flex:1,padding:"9px 0",borderRadius:10,border:verHistorico?`2px solid ${O}`:`1px solid ${BL}`,background:verHistorico?CA:"transparent",color:verHistorico?O:MU,fontWeight:700,fontSize:12.5,cursor:"pointer"}}>
                📜 {t.pedHistorico} {pedidos.filter(p=>p.pago).length>0&&`(${pedidos.filter(p=>p.pago).length})`}
              </button>
            </div>
            <div style={s.secTit}>{verHistorico?t.pedHistorico:t.pedRec}</div>
            {(verHistorico?pedidos.filter(p=>p.pago):pedidos.filter(p=>!p.pago)).length===0
              ?<div style={s.vazio}><div style={{fontSize:36}}>{verHistorico?"📜":"🧾"}</div><div style={{fontWeight:600,fontSize:14,color:TI,marginTop:8}}>{verHistorico?t.nenhumHist:t.nenhumPed}</div></div>
              :(verHistorico?pedidos.filter(p=>p.pago):pedidos.filter(p=>!p.pago)).map(p=>(
                <div key={p.id} style={{...s.card,padding:0,marginBottom:10,overflow:"hidden"}}>
                  {p.alergia&&<div style={{background:"#A03030",padding:"7px 12px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🚨</span><div><div style={{fontWeight:700,fontSize:12,color:"#fff"}}>{t.alAviso}</div><div style={{fontSize:11,color:"#FFD0D0"}}>{p.alergiaDesc}</div></div></div>}
                  <div style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontWeight:600,fontSize:13.5,color:TI}}>{p.cliente} <span style={{fontSize:11,color:MU,fontWeight:400}}>#{p.num}</span></span>
                      <span style={{fontSize:11,color:MU}}>{p.hora}</span>
                    </div>
                    {p.dia&&<div style={{fontSize:10.5,color:O,fontWeight:700,marginBottom:3}}>📅 {t[`dia_${p.dia}`]}</div>}
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
                      <div style={{fontSize:11,color:MU,marginBottom:4}}>📍 {p.end}{p.endApto?` Apt ${p.endApto}`:""}, {p.endCity}, {p.endProv} {p.endCep}{p.endBuzzer?` · 🔔 ${p.endBuzzer}`:""}</div>
                    )}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {p.entregue&&<span style={{fontSize:10,background:"#2A5020",color:"#A0ECA0",borderRadius:10,padding:"2px 7px",fontWeight:700}}>{t.badEnt}</span>}
                      {p.pago&&<span style={{fontSize:10,background:"#1A3A5A",color:"#A0C8EC",borderRadius:10,padding:"2px 7px",fontWeight:700}}>{t.badPago}</span>}
                      {p.entregue&&!p.pago&&<span style={{fontSize:10,background:"#5A2A10",color:"#FFC080",borderRadius:10,padding:"2px 7px",fontWeight:700}}>{t.badPend}</span>}
                      {p.comentario&&<span style={{fontSize:10,background:"#E8EAFB",color:"#3A3AA0",borderRadius:10,padding:"2px 7px",fontWeight:700}}>{t.badComent}</span>}
                    </div>
                  </div>
                  {p.alergia&&!p.ciente&&<div style={{borderTop:`1px solid ${BL}`,padding:"8px 12px"}}><button onClick={()=>setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,ciente:true}:x))} style={{width:"100%",padding:"9px 0",borderRadius:10,border:"none",background:"#A03030",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>{t.ciente}</button></div>}
                  {p.alergia&&p.ciente&&<div style={{borderTop:`1px solid ${BL}`,padding:"7px 12px",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:13}}>✅</span><span style={{fontSize:11.5,color:"#3A8A30",fontWeight:600}}>{t.cienteOk}</span></div>}
                  {/* Confirmação ao cliente — visual + envio numa coisa só */}
                  {!p.confirmadoCliente&&(
                    <div style={{borderTop:`1px solid ${BL}`,padding:"14px 12px",textAlign:"center",background:CA}}>
                      <div style={{fontSize:26,marginBottom:4}}>✅</div>
                      <div style={{fontFamily:"'Dancing Script',cursive",fontWeight:700,fontSize:16,color:O,marginBottom:2}}>{t.pedConf}</div>
                      <div style={{fontSize:12,color:MU,marginBottom:10}}>Olá, {p.cliente}! 🍱</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
                        <span style={{fontWeight:700,fontSize:15,color:P,background:O,padding:"4px 12px",borderRadius:20}}>⏱ {p.previsao}</span>
                      </div>
                      <button onClick={()=>{
                        const msg=`✅ *Pedido #${p.num} recebido!*\n\nOlá, ${p.cliente}! 🍱\n\nSeu pedido foi recebido e já está sendo preparado com carinho.\n\n⏱ Previsão: *${p.previsao}*\n${p.tipo==="entrega"?"🛵 Entrega no seu endereço":"🏠 Retirada"}\n\nObrigada pela preferência! 💛\n\n— Tempero da Vó`;
                        window.location.href=`https://wa.me/1${p.tel.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`;
                        setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,confirmadoCliente:true}:x));
                      }} style={{width:"100%",padding:"10px 0",borderRadius:10,border:"none",background:"#25D366",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <span>💬</span> {t.envConf}
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
                        <button onClick={()=>setPedidos(pv=>pv.map(x=>x.id===p.id?{...x,pago:false}:x))} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1px solid #E05050`,background:"transparent",color:"#E05050",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.naoPago}</button>
                      </>}
                    </div>
                  )}
                  {p.comentario&&<div style={{borderTop:`1px solid ${BL}`,padding:"7px 12px",background:CA}}><div style={{fontSize:10,color:MU,marginBottom:2}}>{t.fbSeu}</div><div style={{fontSize:12,color:TI,fontStyle:"italic"}}>"{p.comentario}"</div></div>}
                  {verHistorico&&(
                    <div style={{borderTop:`1px solid ${BL}`,padding:"7px 12px"}}>
                      <button onClick={()=>apagarPedido(p.id)} style={{width:"100%",padding:"7px 0",borderRadius:9,border:"1px solid #E0505066",background:"transparent",color:"#E05050",fontWeight:600,fontSize:12,cursor:"pointer"}}>🗑 {t.apagarPed}</button>
                    </div>
                  )}
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
              <div style={{fontSize:12,color:MU,background:CA,border:`1px solid ${BL}`,borderRadius:8,padding:"7px 10px"}}>{t.espAviso}</div>
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
                window.location.href=`https://wa.me/${SEU_WHATSAPP}?text=${encodeURIComponent(msg)}`;
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
                    {e.status==="aceito"&&<div style={{background:"#EAF6E8",borderRadius:8,padding:"8px 10px",border:"1px solid #3A8A30"}}><div style={{fontSize:12,color:"#3A8A30",fontWeight:700,marginBottom:2}}>{t.espAcei}</div>{e.precoResp&&<div style={{fontSize:14,color:O,fontWeight:700}}>{fmt(e.precoResp)}</div>}{e.resposta&&<div style={{fontSize:12,color:MU,marginTop:2}}>{e.resposta}</div>}</div>}
                    {e.status==="recusado"&&<div style={{background:"#FBE8E8",borderRadius:8,padding:"8px 10px",border:"1px solid #E05050"}}><div style={{fontSize:12,color:"#E05050",fontWeight:700,marginBottom:2}}>{t.espRec}</div>{e.resposta&&<div style={{fontSize:12,color:MU}}>{e.resposta}</div>}</div>}
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
                    ?<div style={{background:CA,borderRadius:8,padding:"8px 10px",border:`1px solid ${BL}`}}>
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
                      onKeyDown={e=>{if(e.key==="Enter"){if(senhaInput===getSenha()){setCozinhaAuth(true);try{localStorage.setItem("cozinhaAutenticada","1");}catch(_){}setSenhaInput("");setSenhaErro("");}else{setSenhaErro("Senha incorreta. Tente novamente.");}}}
                      }
                      placeholder="••••••••••••••••"
                      style={{...s.inp,textAlign:"center",fontSize:18,letterSpacing:"0.2em",marginBottom:8}}/>
                    {senhaErro&&<div style={{color:"#E05050",fontSize:12,marginBottom:8}}>{senhaErro}</div>}
                    <button style={s.btnPrinc} onClick={()=>{
                      if(senhaInput===getSenha()){setCozinhaAuth(true);try{localStorage.setItem("cozinhaAutenticada","1");}catch(_){}setSenhaInput("");setSenhaErro("");}
                      else{setSenhaErro("Senha incorreta. Tente novamente.");}
                    }}>Entrar</button>
                  </div>
                </div>
              : <div>
                  {/* Compartilhar app */}
                  <div style={{...s.card,marginBottom:14,textAlign:"center"}}>
                    <div style={{fontWeight:700,fontSize:13,color:O,marginBottom:10}}>📤 Compartilhar app com clientes</div>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(SITE_URL)}`} alt="QR code" width={140} height={140} style={{borderRadius:10,marginBottom:10}}/>
                    <div style={{fontSize:12,color:MU,marginBottom:10,wordBreak:"break-all"}}>{SITE_URL}</div>
                    <button onClick={compartilharApp} style={{...s.btnPrinc,padding:"10px 0"}}>
                      {linkCopiado?"✅ Link copiado!":"🔗 Compartilhar link"}
                    </button>
                  </div>
                  {/* Botões topo cozinha */}
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,alignItems:"center"}}>
                    <button onClick={()=>{setAba("cardapio");setCozinhaAuth(false);try{localStorage.removeItem("cozinhaAutenticada");}catch(_){}}}
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
              <div style={{textAlign:"right"}}><div style={{fontSize:10,color:MU,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{t.votosLabel}</div><div style={{fontSize:20,fontWeight:700,color:O}}>{Object.values(votosSug).reduce((s,d)=>s+Object.values(d).reduce((a,b)=>a+b,0),0)}</div></div>
            </div>
            <div style={s.secTit}>{t.cozTit}</div>
            <div style={s.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div><div style={{fontWeight:700,fontSize:14,color:O}}>{t.cozPratos}</div><div style={{fontSize:11,color:MU,marginTop:2}}>{t.cozSub}</div></div>
                <button style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${O}`,background:"transparent",fontSize:12,cursor:"pointer",color:O,fontWeight:600}} onClick={()=>{setMenuTemp({pratosPorDia:{segunda:(menuDia.pratosPorDia?.segunda||PRATOS_BASE).map(p=>({...p})),quarta:(menuDia.pratosPorDia?.quarta||PRATOS_BASE).map(p=>({...p})),sexta:(menuDia.pratosPorDia?.sexta||PRATOS_BASE).map(p=>({...p}))},aviso:menuDia.aviso||"",precoExtra:precoExtra});setEditando(true);}}>{t.cozEdit}</button>
              </div>
              {DIAS_SUGESTAO_KEYS.map(dia=>(
                <div key={dia} style={{marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:O,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5}}>{t[`dia_${dia}`]}</div>
                  <div style={{display:"flex",gap:10}}>
                    {(menuDia.pratosPorDia?.[dia]||[]).map((p0,i)=>{
                      const base=dishById(p0.id); const p={...p0,nome:base?.nome||p0.nome,icon:base?.icon||p0.icon};
                      return (
                        <div key={i} style={s.pratoVis}>
                          <IcoCarne tipo={p.icon} size={40}/>
                          <div style={{fontSize:10.5,fontWeight:600,textAlign:"center",color:TI,wordBreak:"break-word",lineHeight:1.3}}>{p.nome}</div>
                          <div style={{fontSize:10.5,color:O,fontWeight:700}}>{fmt(p.preco)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {menuDia.aviso&&menuDia.aviso.trim()&&(
                <div style={{marginTop:6,background:CA,borderRadius:8,padding:"7px 10px",border:`1px solid ${O}`}}>
                  <div style={{fontSize:10,color:O,fontWeight:700,marginBottom:2}}>{t.avisoAtivo}</div>
                  <div style={{fontSize:12,color:TI}}>{menuDia.aviso}</div>
                </div>
              )}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={s.secTit}>{t.cardCompTit}</div><div style={{fontSize:11,color:MU,marginTop:-6,marginBottom:8}}>{t.cardCompSub}</div></div>
              {!editandoCardapio&&<button style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${O}`,background:"transparent",fontSize:12,cursor:"pointer",color:O,fontWeight:600}} onClick={abrirEdicaoCardapio}>{t.cozEdit}</button>}
            </div>
            {!editandoCardapio
              ?<div style={s.card}>
                  {[{key:"carne",label:t.cComCarne},{key:"veg",label:t.cSemCarne}].map(g=>(
                    <div key={g.key} style={{marginBottom:8}}>
                      <div style={{fontSize:10,fontWeight:700,color:O,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:4}}>{g.label} ({cardapio[g.key].length})</div>
                      <div style={{fontSize:12,color:TI,lineHeight:1.6}}>{cardapio[g.key].map(d=>d.nome).join(" · ")}</div>
                    </div>
                  ))}
                </div>
              :<div style={s.card}>
                  {[{key:"carne",label:t.cComCarne},{key:"veg",label:t.cSemCarne}].map(g=>(
                    <div key={g.key} style={{marginBottom:14}}>
                      <div style={{fontSize:10,fontWeight:700,color:O,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:6}}>{g.label}</div>
                      {cardapioTemp[g.key].map((d,idx)=>(
                        <div key={d.id} style={{display:"flex",gap:6,marginBottom:5,alignItems:"center"}}>
                          <input style={{...s.inp,flex:1}} value={d.nome} onChange={e=>setCardapioTemp(t=>({...t,[g.key]:t[g.key].map((x,i)=>i===idx?{...x,nome:e.target.value}:x)}))}/>
                          <select value={d.icon} onChange={e=>setCardapioTemp(t=>({...t,[g.key]:t[g.key].map((x,i)=>i===idx?{...x,icon:e.target.value}:x)}))}
                            style={{...s.inp,width:92,padding:"9px 4px"}}>
                            <option value="carne">🍖 Carne</option>
                            <option value="frango">🍗 Frango</option>
                            <option value="costela">🍖 Costela</option>
                            <option value="linguica">🌭 Linguiça</option>
                            <option value="veg">🥗 S/carne</option>
                          </select>
                          <button onClick={()=>removerPratoCardapio(g.key,idx)} style={{border:"none",background:"transparent",color:"#E05050",fontSize:16,cursor:"pointer",padding:"2px 6px"}}>✕</button>
                        </div>
                      ))}
                      <button onClick={()=>addPratoCardapio(g.key)} style={{fontSize:12,color:O,background:"transparent",border:`1px dashed ${O}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",width:"100%"}}>+ {t.cardCompAdd}</button>
                    </div>
                  ))}
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...s.btnPrinc,background:"transparent",border:`1px solid ${BL}`,color:MU}} onClick={()=>setEditandoCardapio(false)}>{t.fechar}</button>
                    <button style={{...s.btnPrinc,background:OE}} onClick={salvarCardapioCompleto}>{t.editSalvar}</button>
                  </div>
                </div>
            }
            <div style={s.secTit}>{t.rankTit}</div>
            <div style={s.card}>
              {DIAS_SUGESTAO_KEYS.map(dia=>{
                const votosDia=votosSug[dia]||{};
                const totalDia=Object.values(votosDia).reduce((s,n)=>s+n,0);
                const opcoes=Object.entries(votosDia).map(([id,v])=>({...dishById(id),v})).filter(p=>p&&p.id&&p.v>0).sort((a,b)=>b.v-a.v);
                return (
                  <div key={dia} style={{marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:O,textTransform:"uppercase",marginBottom:6}}>{t[`dia_${dia}`]}</div>
                    {totalDia===0
                      ?<div style={{fontSize:12,color:MU}}>{t.rankVazio}</div>
                      :opcoes.map((p,i)=>{
                          const pct=totalDia?Math.round((p.v/totalDia)*100):0;
                          return (
                            <div key={p.id} style={{marginBottom:8}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  {i===0&&p.v>0&&<span style={{fontSize:13}}>👑</span>}
                                  <span style={{fontSize:12.5,color:i===0&&p.v>0?O:TI,fontWeight:i===0&&p.v>0?700:400}}>{p.nome}</span>
                                </div>
                                <span style={{fontSize:11,color:MU}}>{p.v} voto{p.v!==1?"s":""}</span>
                              </div>
                              <div style={{height:5,background:CA,borderRadius:5,overflow:"hidden"}}>
                                <div style={{height:"100%",width:`${pct}%`,background:i===0?O:BL,borderRadius:5}}/>
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                );
              })}
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
                              window.location.href=`https://wa.me/1${e.tel.replace(/\D/g,"")}?text=${encodeURIComponent(txt)}`;
                            }} style={{flex:1,padding:"8px 0",borderRadius:10,border:"none",background:"#3A8A30",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>{t.espAceitarBtn}</button>
                            <button onClick={()=>{
                              const msg=document.getElementById(`msg-${e.id}`)?.value||"Infelizmente não temos os ingredientes hoje.";
                              setEspeciais(pv=>pv.map(x=>x.id===e.id?{...x,status:"recusado",resposta:msg}:x));
                              const txt=`❌ *Prato Especial #${e.num}*\n\nOlá, ${e.nome}! Infelizmente não conseguiremos atender hoje.\n\n${msg}\n\nObrigada! 💛`;
                              window.location.href=`https://wa.me/1${e.tel.replace(/\D/g,"")}?text=${encodeURIComponent(txt)}`;
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
                      {enviando===i&&<button style={{padding:"6px 10px",borderRadius:20,border:"none",background:VE,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}} onClick={()=>{window.location.href=`https://wa.me/1${c.tel.replace(/\D/g,"")}?text=${encodeURIComponent(msgMenu(c.nome))}`;setEnviando(i+1<clientes.length?i+1:null);}}>{t.cliEnvBtn}</button>}
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
            }
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
                <div style={{background:"#EAF6E8",border:"1px solid #3A8A30",borderRadius:14,padding:"12px 14px"}}>
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
          {icon:"🛒",idx:1,id:"carrinho",badge:nCart,onClick:()=>{ if(nCart>0&&!dadosCompletos){ setDadosPreModal(true);} else { setAba("carrinho"); } }},
          {icon:"🧾",idx:2,id:"pedidos",badge:novos,onClick:()=>{setAba("pedidos");setNovos(0);}},
          {icon:"⭐",idx:3,id:"especial"},
          {icon:"💬",idx:4,id:"feedback"},
          ...(cozinhaVisivel?[{icon:"👩‍🍳",idx:5,id:"cozinha",onClick:()=>{setAba("cozinha");}}]:[]),
          ...(cozinhaVisivel?[{icon:"💰",idx:6,id:"caixa"}]:[]),
        ].map(tb=>(
          <Tab key={tb.id} icon={tb.icon} label={NAV[tb.idx]} ativo={aba===tb.id}
            onClick={tb.onClick||(()=>setAba(tb.id))} badge={tb.badge||0}/>
        ))}
      </nav>

      {pinAberto&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={()=>{setPinAberto(false);setPinInput("");setPinErro("");}}>
          <div style={{background:CA,borderRadius:24,padding:"28px 24px",width:300,border:`1.5px solid ${O}`}} onClick={e=>e.stopPropagation()}>
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
                  style={{padding:"16px 0",borderRadius:12,border:"none",background:d==="⌫"?"#FBE8E8":d?"#FBF6EA":"transparent",color:d==="⌫"?"#E05050":d?O:"transparent",fontSize:d==="⌫"?20:22,fontWeight:700,cursor:d?"pointer":"default"}}>
                  {d}
                </button>
              ))}
            </div>
            <button style={{width:"100%",marginTop:16,padding:"10px 0",borderRadius:12,border:"none",background:"transparent",color:MU,fontSize:13,cursor:"pointer"}} onClick={()=>{setPinAberto(false);setPinInput("");setPinErro("");}}>Cancelar</button>
          </div>
        </div>
      )}

      {sobEncModal&&(
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontWeight:700,fontSize:15,color:OE}}>🍰 {t.sobEncBtn}</span>
              <button style={{border:"none",background:"transparent",fontSize:16,cursor:"pointer",color:OE}} onClick={()=>setSobEncModal(false)}>✕</button>
            </div>
            <div style={{fontSize:12,color:MU,marginBottom:12}}>{t.sobEncSub}</div>
            <label style={s.lbl}>{t.espNome}</label>
            <input style={s.inp} value={sobEncForm.nome} onChange={e=>setSobEncForm(f=>({...f,nome:e.target.value}))} placeholder="Ex: Maria"/>
            <label style={s.lbl}>{t.espTel}</label>
            <input style={s.inp} value={sobEncForm.tel} onChange={e=>setSobEncForm(f=>({...f,tel:fmtTel(e.target.value)}))} placeholder="(647) 000-0000"/>
            <label style={s.lbl}>{t.sobEncDesc}</label>
            <textarea rows={3} value={sobEncForm.desc} onChange={e=>setSobEncForm(f=>({...f,desc:e.target.value}))} placeholder={t.sobEncDescPh}
              style={{width:"100%",padding:"9px 11px",borderRadius:9,border:`1px solid ${O}`,fontSize:13,fontFamily:"inherit",color:"#2A1F00",background:"#FBF6EA",resize:"none",boxSizing:"border-box",lineHeight:1.5}}/>
            <label style={s.lbl}>{t.espObs}</label>
            <input style={s.inp} value={sobEncForm.obs} onChange={e=>setSobEncForm(f=>({...f,obs:e.target.value}))} placeholder={t.sobEncObsPh}/>
            {sobEncErro&&<div style={{color:"#E05050",fontSize:12,margin:"6px 0"}}>{sobEncErro}</div>}
            <button style={{...s.btnPrinc,marginTop:12}} onClick={enviarEncomendaSobremesa}>{t.sobEncEnviar}</button>
          </div>
        </div>
      )}

      {dadosPreModal&&(
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontWeight:700,fontSize:15,color:OE}}>{t.cadastrarTit}</span>
              <button style={{border:"none",background:"transparent",fontSize:16,cursor:"pointer",color:OE}} onClick={()=>setDadosPreModal(false)}>✕</button>
            </div>
            <div style={{fontSize:12,color:MU,marginBottom:12}}>{t.cadastrarSub}</div>
            <label style={s.lbl}>{t.nomeLabel}</label>
            <input style={s.inp} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder={t.nomePh}/>
            <label style={s.lbl}>{t.telLabel}</label>
            <input style={s.inp} value={form.tel} onChange={e=>setForm({...form,tel:fmtTel(e.target.value)})} placeholder="(647) 000-0000"/>
            <label style={s.lbl}>{t.tipoLabel}</label>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              {["entrega","retirada"].map(tp=>(
                <button key={tp} onClick={()=>setForm({...form,tipo:tp})} style={{flex:1,padding:"8px 0",borderRadius:9,border:form.tipo===tp?`2px solid ${OE}`:`1px solid #8B5A2B66`,background:form.tipo===tp?"#F5EDD5":"#FBF6EA",color:OE,fontWeight:form.tipo===tp?700:400,fontSize:13,cursor:"pointer"}}>
                  {tp==="entrega"?t.tEnt:t.tRet}
                </button>
              ))}
            </div>
            {form.tipo==="entrega"&&(
              <div>
                <label style={s.lbl}>{t.endLabel}</label>
                <input style={s.inp} value={form.end} onChange={e=>setForm({...form,end:e.target.value})}
                  placeholder="123 Main St"/>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <input style={{...s.inp,flex:1}} value={form.endApto||""} onChange={e=>setForm({...form,endApto:e.target.value})}
                    placeholder={t.endApto}/>
                  <input style={{...s.inp,flex:1}} value={form.endBuzzer||""} onChange={e=>setForm({...form,endBuzzer:e.target.value})}
                    placeholder={t.endBuzzer}/>
                </div>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <input style={{...s.inp,flex:2}} value={form.endCity||""} onChange={e=>setForm({...form,endCity:e.target.value})}
                    placeholder="Toronto"/>
                  <input style={{...s.inp,flex:1}} value={form.endProv||"ON"} onChange={e=>setForm({...form,endProv:e.target.value.toUpperCase().slice(0,2)})}
                    placeholder="ON" maxLength={2}/>
                  <input style={{...s.inp,flex:1.5}} value={form.endCep||""} onChange={e=>{
                    const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"");
                    const fmt=v.length>3?v.slice(0,3)+" "+v.slice(3,6):v;
                    setForm({...form,endCep:fmt});
                  }} placeholder="M5V 1A1" maxLength={7}/>
                </div>
                <div style={{marginTop:8,fontSize:12.5,color:foraArea?"#A03030":"#3B6030",background:foraArea?"#FBE8E8":"#EEF6E8",padding:"7px 10px",borderRadius:8,textAlign:"center"}}>
                  {freteStatus==="calculando"?`⏳ ${t.calc}`
                    :foraArea?`⚠️ ${t.freteCombinar} (~${distanciaKm.toFixed(1)} km)`
                    :freteStatus==="ok"?`🛵 ${t.freteLabel}: ${fmt(frete)} (~${distanciaKm.toFixed(1)} km)`
                    :freteStatus==="erro"?`⚠️ CEP não encontrado — usando taxa padrão ${fmt(TAXA_ENTREGA)}`
                    :t.freteLabel+": —"}
                </div>
              </div>
            )}
            <button style={{...s.btnPrinc,marginTop:14}} onClick={()=>{
              if(!form.nome.trim()||!form.tel.trim()){setErro(t.eNome);return;}
              if(form.tipo==="entrega"&&(!form.end.trim()||!form.endCep.trim())){setErro(t.eEnd);return;}
              setErro("");
              setDadosPreModal(false);
              if(nCart>0) setAba("carrinho");
            }}>{t.continuar}</button>
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={s.lbl}>{t.nomeLabel}</label>
              {form.nome&&<span onClick={()=>{setForm(f=>({...f,nome:"",tel:"",end:"",endApto:"",endBuzzer:"",endCity:"",endProv:"ON",endCep:""}));try{localStorage.removeItem("dadosCliente");}catch(_){}}} style={{fontSize:11,color:MU,cursor:"pointer",textDecoration:"underline"}}>{t.naoVoce}</span>}
            </div>
            <input style={s.inp} value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder={t.nomePh}/>
            <label style={s.lbl}>{t.telLabel}</label><input style={s.inp} value={form.tel} onChange={e=>setForm({...form,tel:fmtTel(e.target.value)})} placeholder="(647) 000-0000"/>
            <label style={s.lbl}>{t.pagLabel}</label>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              {[{id:"etransfer",l:t.pEt,icon:"📧"},{id:"dinheiro",l:t.pDin,icon:"💵"},{id:"cartao",l:t.pCart,icon:"💳"}].map(pg=>(
                <button key={pg.id} onClick={()=>setForm({...form,pag:pg.id})} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"9px 4px",borderRadius:10,border:form.pag===pg.id?`2px solid ${OE}`:`1px solid #8B5A2B66`,background:form.pag===pg.id?"#F5EDD5":"#FBF6EA",cursor:"pointer",fontSize:12,color:OE,fontWeight:form.pag===pg.id?700:400}}>
                  <span style={{fontSize:18}}>{pg.icon}</span><span>{pg.l}</span>
                </button>
              ))}
            </div>
            {form.pag==="etransfer"&&(
              <div style={{marginTop:-2,marginBottom:10,fontSize:12,color:"#3B6030",background:"#EEF6E8",padding:"7px 10px",borderRadius:8,textAlign:"center"}}>
                📧 {t.etransferPara} <strong>{ETRANSFER_EMAIL}</strong>
              </div>
            )}
            <label style={s.lbl}>{t.tipoLabel}</label>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              {["entrega","retirada"].map(tp=>(
                <button key={tp} onClick={()=>setForm({...form,tipo:tp})} style={{flex:1,padding:"8px 0",borderRadius:9,border:form.tipo===tp?`2px solid ${OE}`:`1px solid #8B5A2B66`,background:form.tipo===tp?"#F5EDD5":"#FBF6EA",color:OE,fontWeight:form.tipo===tp?700:400,fontSize:13,cursor:"pointer"}}>
                  {tp==="entrega"?t.tEnt:t.tRet}
                </button>
              ))}
            </div>
            {form.tipo==="entrega"&&(
              <div>
                <label style={s.lbl}>{t.endLabel}</label>
                <input style={s.inp} value={form.end} onChange={e=>setForm({...form,end:e.target.value})}
                  placeholder="123 Main St"/>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <input style={{...s.inp,flex:1}} value={form.endApto||""} onChange={e=>setForm({...form,endApto:e.target.value})}
                    placeholder={t.endApto}/>
                  <input style={{...s.inp,flex:1}} value={form.endBuzzer||""} onChange={e=>setForm({...form,endBuzzer:e.target.value})}
                    placeholder={t.endBuzzer}/>
                </div>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <input style={{...s.inp,flex:2}} value={form.endCity||""} onChange={e=>setForm({...form,endCity:e.target.value})}
                    placeholder="Toronto"/>
                  <input style={{...s.inp,flex:1}} value={form.endProv||"ON"} onChange={e=>setForm({...form,endProv:e.target.value.toUpperCase().slice(0,2)})}
                    placeholder="ON" maxLength={2}/>
                  <input style={{...s.inp,flex:1.5}} value={form.endCep||""} onChange={e=>{
                    const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"");
                    const fmt=v.length>3?v.slice(0,3)+" "+v.slice(3,6):v;
                    setForm({...form,endCep:fmt});
                  }} placeholder="M5V 1A1" maxLength={7}/>
                </div>
              </div>
            )}
            <div style={{marginTop:12,borderTop:"1px solid #8B5A2B44",paddingTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:OE}}>{t.subtotal}</span><span style={{color:"#2A1F00"}}>{fmt(sub)}</span></div>
              {frete>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:OE}}>{t.freteLabel}</span><span style={{color:"#2A1F00"}}>{fmt(frete)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,marginTop:6}}><span style={{color:"#2A1F00"}}>{t.totalLabel}</span><span style={{color:OE}}>{fmt(total)}</span></div>
              <div style={{marginTop:8,fontSize:12,color:"#3B6030",background:"#EEF6E8",padding:"7px 10px",borderRadius:8,textAlign:"center"}}>⏱ {form.tipo==="entrega"?t.tEnt:t.tRet}: <strong>{previsaoEntrega(lang)}</strong></div>
            </div>
            <div style={{marginTop:12,background:CA,border:`2px solid ${form.alergia===null?"#E05050":form.alergia?O:"#3A8A30"}`,borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontWeight:700,fontSize:13,color:form.alergia===null?"#E05050":form.alergia?O:"#3A8A30",marginBottom:6}}>{t.alTit}</div>
              <div style={{fontSize:11,color:MU,marginBottom:8}}>{t.alSub}</div>
              <div style={{display:"flex",gap:8,marginBottom:form.alergia?10:0}}>
                <button onClick={()=>setForm({...form,alergia:false,alergiaDesc:""})} style={{flex:1,padding:"9px 0",borderRadius:10,border:`2px solid ${form.alergia===false?"#3A8A30":"#8B5A2B44"}`,background:form.alergia===false?"#EEF6E8":"#FBF6EA",color:form.alergia===false?"#1A5020":OE,fontWeight:form.alergia===false?700:400,fontSize:13,cursor:"pointer"}}>{t.alNao}</button>
                <button onClick={()=>setForm({...form,alergia:true})} style={{flex:1,padding:"9px 0",borderRadius:10,border:`2px solid ${form.alergia===true?"#E05050":"#8B5A2B44"}`,background:form.alergia===true?"#FBE8E8":"#FBF6EA",color:form.alergia===true?"#A03030":OE,fontWeight:form.alergia===true?700:400,fontSize:13,cursor:"pointer"}}>{t.alSim}</button>
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
              {[{label:t.cComCarne,lista:cardapio.carne},{label:t.cSemCarne,lista:cardapio.veg}].map(g=>(
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
              {t.entVariavel} · {t.tRet}: {t.gratis}
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
            {DIAS_SUGESTAO_KEYS.map(dia=>(
              <div key={dia} style={{marginBottom:16}}>
                <div style={{fontSize:12.5,fontWeight:700,color:O,letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8,borderBottom:`1px solid ${BL}`,paddingBottom:4}}>{t[`dia_${dia}`]}</div>
                {menuTemp.pratosPorDia[dia].map((prato,idx)=>(
                  <div key={idx} style={{marginBottom:12,background:"#FBF6EA",borderRadius:12,border:"1px solid #8B5A2B44",padding:"12px 14px"}}>
                    <div style={{fontSize:12,color:OE,fontWeight:700,marginBottom:8}}>{t.editPrato} {idx+1}</div>
                    <div style={{maxHeight:130,overflowY:"auto",marginBottom:8}}>
                      {[{label:t.cComCarne,lista:cardapio.carne},{label:t.cSemCarne,lista:cardapio.veg}].map(g=>(
                        <div key={g.label}>
                          <div style={{fontSize:10,color:OE,fontWeight:700,padding:"4px 0 2px"}}>{g.label}</div>
                          {g.lista.map(c=>(
                            <button key={c.id} onClick={()=>setMenuTemp(m=>({...m,pratosPorDia:{...m.pratosPorDia,[dia]:m.pratosPorDia[dia].map((p,i)=>i===idx?{...p,id:c.id,nome:c.nome,icon:c.icon}:p)}}))}
                              style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"6px 8px",border:prato.id===c.id?`2px solid ${OE}`:`1px solid #8B5A2B44`,borderRadius:8,background:prato.id===c.id?"#F5EDD5":"transparent",cursor:"pointer",marginBottom:3,color:prato.id===c.id?OE:"#6B5040"}}>
                              <IcoCarne tipo={c.icon} size={22}/>
                              <span style={{flex:1,textAlign:"left",fontSize:12}}>{c.nome}</span>
                              {prato.id===c.id&&<span style={{color:OE,fontWeight:700,fontSize:13}}>✓</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                    <label style={s.lbl}>{t.editDesc}</label>
                    <input style={s.inp} value={prato.desc} onChange={e=>setMenuTemp(m=>({...m,pratosPorDia:{...m.pratosPorDia,[dia]:m.pratosPorDia[dia].map((p,i)=>i===idx?{...p,desc:e.target.value}:p)}}))} placeholder={t.descPlaceholder||"Ex: arroz, feijão, salada e frango grelhado"}/>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
                      <label style={{...s.lbl,margin:0}}>{t.editPreco}</label>
                      <input style={{...s.inp,width:80}} value={prato.preco}
                        onChange={e=>setMenuTemp(m=>({...m,pratosPorDia:{...m.pratosPorDia,[dia]:m.pratosPorDia[dia].map((p,i)=>i===idx?{...p,preco:e.target.value}:p)}}))}
                        onBlur={e=>{const n=parseFloat(String(e.target.value).replace(",","."));setMenuTemp(m=>({...m,pratosPorDia:{...m.pratosPorDia,[dia]:m.pratosPorDia[dia].map((p,i)=>i===idx?{...p,preco:isNaN(n)?p.preco:n}:p)}}));}}/>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <button style={{...s.btnPrinc,background:OE,marginBottom:16}} onClick={()=>{
              const limpo=d=>d.map(p=>({...p,preco:parseFloat(String(p.preco).replace(",","."))||35}));
              const novoMenu={pratosPorDia:{segunda:limpo(menuTemp.pratosPorDia.segunda),quarta:limpo(menuTemp.pratosPorDia.quarta),sexta:limpo(menuTemp.pratosPorDia.sexta)},aviso:menuTemp.aviso||"",precoExtra:parseFloat(String(menuTemp.precoExtra).replace(",","."))||PRECO_100G_PADRAO};
              setMenuDia(novoMenu);
              setDoc(doc(db,"estado","menu"),novoMenu).catch(()=>{});
              setCarrinho({});setExtra({});setEditando(false);
            }}>{t.editSalvar}</button>
            <div style={{marginBottom:16,background:"#FBF6EA",borderRadius:12,border:"1px solid #8B5A2B44",padding:"12px 14px"}}>
              <div style={{fontSize:12,color:OE,fontWeight:700,marginBottom:8}}>{t.editPrecoExtraTit}</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <label style={{...s.lbl,margin:0}}>{t.editPrecoExtra}</label>
                <input style={{...s.inp,width:80}} value={menuTemp.precoExtra}
                  onChange={e=>setMenuTemp(m=>({...m,precoExtra:e.target.value}))}
                  onBlur={e=>{const n=parseFloat(String(e.target.value).replace(",","."));setMenuTemp(m=>({...m,precoExtra:isNaN(n)?m.precoExtra:n}));}}/>
                <span style={{fontSize:11,color:MU}}>/ {t.extraPor}</span>
              </div>
            </div>
            <div style={{borderTop:"1px solid #8B5A2B44",paddingTop:14}}>
              <div style={{fontWeight:700,fontSize:13,color:OE,marginBottom:4}}>{t.avisoTit}</div>
              <div style={{fontSize:12,color:"#6B5040",marginBottom:8}}>{t.avisoSub}</div>
              <textarea rows={3} value={menuTemp.aviso||""} onChange={e=>setMenuTemp(m=>({...m,aviso:e.target.value}))} placeholder={t.avisoPh}
                style={{width:"100%",padding:"9px 11px",borderRadius:9,border:"1px solid #8B5A2B66",fontSize:13,fontFamily:"inherit",color:"#2A1F00",background:"#FBF6EA",resize:"vertical",boxSizing:"border-box",lineHeight:1.5}}/>
              {menuTemp.aviso&&menuTemp.aviso.trim()&&<button style={{fontSize:11.5,color:"#A05050",background:"transparent",border:"none",cursor:"pointer",marginTop:4,padding:0}} onClick={()=>setMenuTemp(m=>({...m,aviso:""}))}>{t.avisoLimpar}</button>}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
