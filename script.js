
const apiUrl = 'https://rifa-api-production.up.railway.app';

let numerosReservados = {};
let numerosSelecionados = [];
let adminLogado = false;
let senhaAdmin = '';

document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('adminLogado') === 'true') {
    adminLogado = true;
    senhaAdmin = localStorage.getItem('senhaAdmin') || '';
    document.getElementById('admin-area').style.display = 'block';
  }
  await carregarReservas();
  gerarRifa();
});

async function carregarReservas() {
  try {
    const response = await fetch(`${apiUrl}/reservas`);
    const data = await response.json();
    numerosReservados = {};
    data.forEach(reserva => {
      numerosReservados[reserva.numero] = { nome: reserva.nome, pago: reserva.pago };
    });
    atualizarRifaContainer();
    if (adminLogado) atualizarAreaAdmin();
  } catch (error) {
    console.error('Erro ao carregar reservas:', error);
  }
}

function gerarRifa() {
  const rifaContainer = document.getElementById('rifa-container');
  rifaContainer.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const num = i.toString().padStart(2, '0');
    const numeroDiv = document.createElement('div');
    numeroDiv.classList.add('numero');
    numeroDiv.dataset.numero = num;

    if (numerosReservados[num]) {
      numeroDiv.textContent = `${num} - ${numerosReservados[num].nome}`;
      numeroDiv.classList.add('reservado');
      if (numerosReservados[num].pago) {
        numeroDiv.classList.add('pago');
      }
    } else {
      numeroDiv.textContent = num;
    }

    numeroDiv.addEventListener('click', () => selecionarNumero(num));
    rifaContainer.appendChild(numeroDiv);
  }
}

function selecionarNumero(numero) {
  if (numerosReservados[numero] && !numerosReservados[numero].pago) {
    alert('Este número já está reservado.');
    return;
  }

  if (numerosSelecionados.includes(numero)) {
    numerosSelecionados = numerosSelecionados.filter(n => n !== numero);
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
  let numeros = document.getElementById('numeros').value.split(',').map(num => num.trim());

  if (!nome) return alert('Por favor, insira seu nome.');

  try {
    const response = await fetch(`${apiUrl}/reservas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeros, nome }),
    });

    if (response.ok) {
      alert('Reserva feita com sucesso!');
      await carregarReservas();
      fecharFormulario();
    } else {
      alert('Erro ao reservar números.');
    }
  } catch (error) {
    console.error('Erro ao reservar números:', error);
  }
}

function fecharFormulario() {
  document.getElementById('reserva-form').style.display = 'none';
  numerosSelecionados = [];
  document.querySelectorAll('.numero.selecionado').forEach(el => el.classList.remove('selecionado'));
}

function mostrarLoginAdmin() {
  document.getElementById('admin-login').style.display = 'block';
}

function fazerLoginAdmin() {
  const senha = document.getElementById('senha-admin').value;

  fetch(`${apiUrl}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha }),
  })
  .then(res => res.json())
  .then(data => {
    if (data.autorizado) {
      adminLogado = true;
      senhaAdmin = senha;
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('admin-area').style.display = 'block';
      salvarDados();
      carregarReservas();
    } else {
      alert('Senha incorreta.');
    }
  });
}

function sairAdmin() {
  adminLogado = false;
  senhaAdmin = '';
  document.getElementById('admin-area').style.display = 'none';
  salvarDados();
}

async function limparRifa() {
  if (confirm('Tem certeza que deseja limpar toda a rifa?')) {
    try {
      const response = await fetch(`${apiUrl}/reservas`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaAdmin }),
      });
      if (response.ok) {
        await carregarReservas();
        alert('Rifa limpa com sucesso!');
      } else {
        alert('Erro ao limpar a rifa.');
      }
    } catch (error) {
      console.error('Erro ao limpar a rifa:', error);
    }
  }
}

async function marcarComoPago(numero) {
  try {
    await fetch(`${apiUrl}/reservas/${numero}/pago`, { method: 'PUT' });
    await carregarReservas();
  } catch (error) {
    console.error('Erro ao marcar como pago:', error);
  }
}

async function marcarComoNaoPago(numero) {
  try {
    await fetch(`${apiUrl}/reservas/${numero}/nao-pago`, { method: 'PUT' });
    await carregarReservas();
  } catch (error) {
    console.error('Erro ao marcar como não pago:', error);
  }
}

async function excluirNumero(numero) {
  try {
    await fetch(`${apiUrl}/reservas/${numero}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: senhaAdmin }),
    });
    await carregarReservas();
  } catch (error) {
    console.error('Erro ao excluir número:', error);
  }
}

function atualizarAreaAdmin() {
  const tabela = document.getElementById('tabela-reservas');
  tabela.innerHTML = '';

  const cabecalho = tabela.insertRow();
  ['Número', 'Nome', 'Pago', 'Ações'].forEach(texto => {
    const th = document.createElement('th');
    th.textContent = texto;
    cabecalho.appendChild(th);
  });

  for (const numero in numerosReservados) {
    const reserva = numerosReservados[numero];
    const linha = tabela.insertRow();

    linha.insertCell().textContent = numero;
    linha.insertCell().textContent = reserva.nome;

    const btnPago = document.createElement('button');
    btnPago.textContent = reserva.pago ? 'Não Pago' : 'Pago';
    btnPago.style.backgroundColor = reserva.pago ? 'green' : '';
    btnPago.addEventListener('click', () => {
      reserva.pago ? marcarComoNaoPago(numero) : marcarComoPago(numero);
    });
    linha.insertCell().appendChild(btnPago);

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', () => excluirNumero(numero));
    linha.insertCell().appendChild(btnExcluir);
  }
}

function atualizarRifaContainer() {
  gerarRifa();
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

// Configurações
const inforifa = document.querySelector(".info-rifa");
const infopremio = document.querySelector(".info-premio");
const inputvalue = document.querySelector(".inputvalue");
const buttonmudar = document.querySelector(".button-mudar");
const buttopremio = document.querySelector(".button-premio");
const inputpremio = document.querySelector(".inputpremio");

if (localStorage.getItem("rifa")) inforifa.innerHTML = localStorage.getItem("rifa");
if (localStorage.getItem("premio")) infopremio.innerHTML = localStorage.getItem("premio");

buttonmudar.addEventListener("click", () => {
  const valor = inputvalue.value;
  inforifa.innerHTML = valor;
  localStorage.setItem("rifa", valor);
});

buttopremio.addEventListener("click", () => {
  const valor = inputpremio.value;
  infopremio.innerHTML = valor;
  localStorage.setItem("premio", valor);
});