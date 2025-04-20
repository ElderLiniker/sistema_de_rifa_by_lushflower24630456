
document.addEventListener('DOMContentLoaded', async function () {
  if (localStorage.getItem('adminLogado') === 'true') {
    adminLogado = true;
    senhaAdmin = localStorage.getItem('senhaAdmin') || '';
    document.getElementById('admin-area').style.display = 'block';
  }
  await carregarReservas();
  gerarRifa();
});

const apiUrl = 'https://rifa-api-production.up.railway.app';

let numerosReservados = {};
let numerosSelecionados = [];
let adminLogado = false;
let senhaAdmin = '';

async function carregarReservas() {
  try {
    const response = await fetch(`${apiUrl}/reservas`);
    const data = await response.json();
    numerosReservados = {};
    data.forEach(reserva => {
      numerosReservados[reserva.numero] = { nome: reserva.nome, pago: reserva.pago };
    });
    atualizarRifaContainer();
  } catch (error) {
    console.error('Erro ao carregar reservas:', error);
  }
}

function gerarRifa() {
  const rifaContainer = document.getElementById('rifa-container');
  rifaContainer.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const numeroDiv = document.createElement('div');
    numeroDiv.classList.add('numero');
    numeroDiv.dataset.numero = i.toString().padStart(2, '0');
    numeroDiv.textContent = i.toString().padStart(2, '0');

    if (numerosReservados[i.toString().padStart(2, '0')]) {
      const nomePessoa = numerosReservados[i.toString().padStart(2, '0')].nome;
      numeroDiv.textContent += ` - ${nomePessoa}`;
    }

    if (numerosReservados[i.toString().padStart(2, '0')]) {
      numeroDiv.classList.add('reservado');
      if (numerosReservados[i.toString().padStart(2, '0')].pago) {
        numeroDiv.classList.add('pago');
      }
    }

    numeroDiv.addEventListener('click', function() {
      selecionarNumero(i.toString().padStart(2, '0'));
    });
    rifaContainer.appendChild(numeroDiv);
  }
  atualizarRifaContainer();
}

function selecionarNumero(numero) {
  if (numerosReservados[numero] && !numerosReservados[numero].pago) {
    alert('Este número já está reservado.');
    return;
  }

  if (numerosSelecionados.includes(numero)) {
    numerosSelecionados = numerosSelecionados.filter(num => num !== numero);
    document.querySelector(`.numero[data-numero="${numero}"]`)?.classList.remove('selecionado');
  } else {
    numerosSelecionados.push(numero);
    document.querySelector(`.numero[data-numero="${numero}"]`)?.classList.add('selecionado');
  }

  document.getElementById('numeros').value = numerosSelecionados.join(', ');
  document.getElementById('reserva-form').style.display = 'block';
}

async function reservarNumeros() {
  const nome = document.getElementById('nome').value;
  let numeros = document.getElementById('numeros').value.split(',').map(num => num.trim());

  if (!nome) {
    alert('Por favor, insira seu nome.');
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/reservas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeros, nome }),
    });

    if (response.ok) {
      alert('Reserva feita com sucesso!');
      await carregarReservas();
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
  .then(response => response.json())
  .then(data => {
    console.log('Resposta do login:', data); // 👈 VERIFICAR AQUI

    if (data.autorizado) {
      adminLogado = true;
      senhaAdmin = senha;
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('admin-area').style.display = 'block';
      atualizarAreaAdmin();
      salvarDados();
    } else {
      alert('Senha incorreta.');
    }
  })
  .catch(error => {
    console.error('Erro ao fazer login:', error);
  });
}



function sairAdmin() {
  adminLogado = false;
  senhaAdmin = '';
  document.getElementById('admin-area').style.display = 'none';
  salvarDados();
}

async function limparRifa() {
  const senhaAdmin = localStorage.getItem("senhaAdmin");

  if (!senhaAdmin) {
    alert("Você precisa estar logado como admin para limpar a rifa.");
    return;
  }

  if (confirm("Tem certeza que deseja limpar toda a rifa?")) {
    try {
      const response = await fetch(`${apiUrl}/reservas`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha: senhaAdmin }),
      });

      const resultado = await response.json();

      if (response.ok) {
        alert("Rifa limpa com sucesso!");
        numerosReservados = {};
        atualizarAreaAdmin();
        atualizarRifaContainer();
      } else {
        alert(`Erro: ${resultado.message}`);
      }
    } catch (error) {
      console.error("Erro ao limpar a rifa:", error);
      alert("Erro de conexão ao tentar limpar a rifa.");
    }
  }
}


async function marcarComoPago(numero) {
  try {
    const response = await fetch(`${apiUrl}/reservas/${numero}/pago`, { method: 'PUT' });
    if (response.ok) {
      numerosReservados[numero].pago = true; // 👈 atualiza no objeto
      atualizarNumeroDiv(numero);
      atualizarAreaAdmin();
    }
  } catch (error) {
    console.error('Erro ao marcar como pago:', error);
  }
}



async function marcarComoNaoPago(numero) {
  try {
    const response = await fetch(`${apiUrl}/reservas/${numero}/nao-pago`, { method: 'PUT' });
    if (response.ok) {
      numerosReservados[numero].pago = false; // 👈 atualiza no objeto
      atualizarNumeroDiv(numero);
      atualizarAreaAdmin();
    } else {
      alert('Erro ao marcar como não pago');
    }
  } catch (error) {
    console.error('Erro ao marcar como não pago:', error);
  }
}

async function excluirNumero(numero) {
  try {
    const response = await fetch(`${apiUrl}/reservas/${numero}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: senhaAdmin }) // 👈 Manda a senha!
    });

    if (response.ok) {
      await carregarReservas();
      atualizarAreaAdmin();
    } else {
      const erro = await response.json();
      alert(erro.message || 'Erro ao excluir número');
    }
  } catch (error) {
    console.error('Erro ao excluir número:', error);
  }
}




function atualizarAreaAdmin() {
  const tabelaReservas = document.getElementById('tabela-reservas');
  tabelaReservas.innerHTML = '';

  let cabecalho = tabelaReservas.createTHead();
  let linhaCabecalho = cabecalho.insertRow();
  ['Número', 'Nome', 'Pago', 'Ações'].forEach(titulo => {
    const th = document.createElement('th');
    th.textContent = titulo;
    linhaCabecalho.appendChild(th);
  });

  for (const numero in numerosReservados) {
    const reserva = numerosReservados[numero];
    let linha = tabelaReservas.insertRow();
    linha.insertCell().textContent = numero;
    linha.insertCell().textContent = reserva.nome;

    const btnPago = document.createElement('button');
    btnPago.textContent = reserva.pago ? 'Marcar como Não Pago' : 'Marcar como Pago';
    btnPago.style.backgroundColor = reserva.pago ? 'green' : '';
    btnPago.addEventListener('click', () => {
      if (reserva.pago) {
        marcarComoNaoPago(numero);
      } else {
        marcarComoPago(numero);
      }
    });
    linha.insertCell().appendChild(btnPago);

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', () => excluirNumero(numero));
    linha.insertCell().appendChild(btnExcluir);
  }
}

function atualizarRifaContainer() {
  for (const numero in numerosReservados) {
    atualizarNumeroDiv(numero);
  }
}
function mostrarLoginAdmin() {
  document.getElementById('admin-login').style.display = 'block';
}


function atualizarNumeroDiv(numero) {
  const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
  if (numeroDiv) {
    numeroDiv.classList.remove('reservado', 'selecionado', 'pago');
    numeroDiv.innerHTML = numero;

    if (numerosReservados[numero]) {
      const nomePessoa = numerosReservados[numero].nome;
      numeroDiv.innerHTML += ` - ${nomePessoa}`;
      
      numeroDiv.classList.add('reservado');
      if (numerosReservados[numero].pago) {
        numeroDiv.classList.add('pago');
      }
    }

    numeroDiv.removeEventListener('click', function () { });

    if (!numerosReservados[numero]) {
      numeroDiv.addEventListener('click', function () {
        selecionarNumero(numero);
      });
    }
  }
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

// Configurações de rifa e prêmio com localStorage
const inforifa = document.querySelector(".info-rifa");
const infopremio = document.querySelector(".info-premio");
const inputvalue = document.querySelector(".inputvalue");
const buttonmudar = document.querySelector(".button-mudar");
const buttopremio = document.querySelector(".button-premio");
const inputpremio = document.querySelector(".inputpremio");

if (localStorage.getItem("rifa")) inforifa.innerHTML = localStorage.getItem("rifa");
if (localStorage.getItem("premio")) infopremio.innerHTML = localStorage.getItem("premio");

function novarifa() {
  const valor = inputvalue.value;
  inforifa.innerHTML = valor;
  localStorage.setItem("rifa", valor);
}

function novopremio() {
  const valor = inputpremio.value;
  infopremio.innerHTML = valor;
  localStorage.setItem("premio", valor);
}

buttonmudar.addEventListener("click", novarifa);
buttopremio.addEventListener("click", novopremio);

