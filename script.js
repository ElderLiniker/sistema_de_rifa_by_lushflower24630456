/* app.js – frontend completo */
const apiUrl = 'https://rifa-api-production.up.railway.app';

// ───────────────────────────────────────────
// 1. Estados globais
// ───────────────────────────────────────────
let numerosReservados = {};
let numerosSelecionados = [];
let adminLogado = localStorage.getItem('adminLogado') === 'true';
let senhaAdmin  = localStorage.getItem('senhaAdmin') || '';

// ───────────────────────────────────────────
// 2. DOM pronto
// ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await verificaAdmin();
  await carregarReservas();
  gerarRifa();
  await carregaConfig();      //  ← NOVO
});

/* ╭─────────────────────────────────────────╮
   │ 3. CONFIGURAÇÕES (rifa / prêmio)       │
   ╰─────────────────────────────────────────╯ */
const inforifa    = document.querySelector('.info-rifa');
const infopremio  = document.querySelector('.info-premio');
const inputvalue  = document.querySelector('.inputvalue');
const inputpremio = document.querySelector('.inputpremio');

async function carregaConfig() {
  try {
    const res = await fetch(`${apiUrl}/configuracoes`);
    const { rifa, premio } = await res.json();
    if (rifa)   setCampo('rifa', rifa);
    if (premio) setCampo('premio', premio);
  } catch {
    // offline → cache local
    if (localStorage.rifa)   setCampo('rifa',   localStorage.rifa);
    if (localStorage.premio) setCampo('premio', localStorage.premio);
  }
}
function setCampo(chave, valor) {
  if (chave === 'rifa')   inforifa.textContent   = valor;
  if (chave === 'premio') infopremio.textContent = valor;
  localStorage[chave] = valor;
}

// Botões salvar
document.querySelector('.button-mudar').onclick = () =>
  salvarConfig('rifa', inputvalue.value.trim());
document.querySelector('.button-premio').onclick = () =>
  salvarConfig('premio', inputpremio.value.trim());

async function salvarConfig(chave, valor) {
  if (!valor) return;
  setCampo(chave, valor);

  // Envia PUT /configuracoes
  try {
    await fetch(`${apiUrl}/configuracoes`, {
      method : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization  : senhaAdmin        // também aceita no body
      },
      body: JSON.stringify({ [chave]: valor, senha: senhaAdmin })
    });
  } catch {
    alert('Não foi possível salvar na API (ficou apenas no cache local).');
  }
}

/* ╭─────────────────────────────────────────╮
   │ 4. RESERVAS (inalteradas)              │
   ╰─────────────────────────────────────────╯ */
async function carregarReservas() {
  const r = await fetch(`${apiUrl}/reservas`);
  numerosReservados = {};
  (await r.json()).forEach(o => numerosReservados[o.numero] = { nome:o.nome, pago:o.pago });
  atualizarRifaContainer();
}

function gerarRifa() {
  const cont = document.getElementById('rifa-container');
  cont.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const n = i.toString().padStart(2, '0');
    const div = document.createElement('div');
    div.className = 'numero';
    div.dataset.numero = n;
    div.textContent = n;
    if (numerosReservados[n]) {
      div.textContent += ` - ${numerosReservados[n].nome}`;
      div.classList.add('reservado');
      if (numerosReservados[n].pago) div.classList.add('pago');
    }
    div.onclick = () => selecionarNumero(n);
    cont.appendChild(div);
  }
  atualizarRifaContainer();
}

function selecionarNumero(numero) {
  if (numerosReservados[numero] && !numerosReservados[numero].pago)
    return alert('Este número já está reservado.');

  const idx = numerosSelecionados.indexOf(numero);
  if (idx > -1) {
    numerosSelecionados.splice(idx, 1);
    document.querySelector(`.numero[data-numero="${numero}"]`).classList.remove('selecionado');
  } else {
    numerosSelecionados.push(numero);
    document.querySelector(`.numero[data-numero="${numero}"]`).classList.add('selecionado');
  }

  document.getElementById('numeros').value = numerosSelecionados.join(', ');
  document.getElementById('reserva-form').style.display = 'block';
}

async function reservarNumeros() {
  const nome = document.getElementById('nome').value;
  if (!nome) return alert('Insira seu nome.');
  const nums = [...numerosSelecionados];

  const res = await fetch(`${apiUrl}/reservas`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ nome, numeros: nums })
  });
  if (res.ok) {
    alert('Reserva feita!');
    fecharFormulario();
    await carregarReservas();
  } else {
    alert('Erro ao reservar.');
  }
}
function fecharFormulario() {
  document.getElementById('reserva-form').style.display = 'none';
  numerosSelecionados = [];
  document.querySelectorAll('.numero.selecionado').forEach(e => e.classList.remove('selecionado'));
}
function atualizarRifaContainer() { for (const n in numerosReservados) atualizarNumeroDiv(n); }
function atualizarNumeroDiv(n) {
  const d = document.querySelector(`.numero[data-numero="${n}"]`);
  if (!d) return;
  d.className = 'numero'; d.textContent = n;
  if (numerosReservados[n]) {
    d.textContent += ` - ${numerosReservados[n].nome}`;
    d.classList.add('reservado');
    if (numerosReservados[n].pago) d.classList.add('pago');
  }
}

/* ╭─────────────────────────────────────────╮
   │ 5. ADMIN (mesma lógica, sem mudanças)  │
   ╰─────────────────────────────────────────╯ */
async function verificaAdmin() {
  if (!adminLogado) return;
  const r = await fetch(`${apiUrl}/api/verificar-admin`, { headers:{ Authorization: senhaAdmin }});
  if (r.ok) document.getElementById('admin-area').style.display = 'block';
  else sairAdmin();
}
function mostrarLoginAdmin() {
  document.getElementById('admin-login').style.display = 'block';
}
function fazerLoginAdmin() {
  const senha = document.getElementById('senha-admin').value;
  fetch(`${apiUrl}/admin/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({senha})})
    .then(r=>r.json())
    .then(d=>{
      if (d.autorizado) {
        adminLogado = true; senhaAdmin = senha;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-area').style.display  = 'block';
        atualizarAreaAdmin(); salvarDados();
      } else alert('Senha incorreta.');
    });
}
function sairAdmin() {
  adminLogado = false; senhaAdmin = '';
  document.getElementById('admin-area').style.display = 'none';
  salvarDados();
}
function salvarDados() {
  if (adminLogado) {
    localStorage.setItem('adminLogado', 'true');
    localStorage.setItem('senhaAdmin', senhaAdmin);
  } else {
    localStorage.removeItem('adminLogado');
    localStorage.removeItem('senhaAdmin');
  }
}

/* (demais funções de painel admin permanecem idênticas ao seu script original) */
