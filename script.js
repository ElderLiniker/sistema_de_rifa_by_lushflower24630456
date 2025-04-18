// Mock de números reservados, para testes
let reservas = [];

// Função para reservar os números
function reservarNumeros() {
  const nome = document.getElementById('nome').value;
  const numerosInput = document.getElementById('numeros').value;
  const numeros = numerosInput.split(',').map(num => num.trim());

  if (!nome || numeros.length === 0) {
    alert("Por favor, preencha o nome e os números.");
    return;
  }

  numeros.forEach(num => {
    const numeroDiv = document.querySelector(`.numero[data-numero="${num}"]`);
    if (numeroDiv) {
      numeroDiv.classList.add('reservado');
      numeroDiv.innerHTML = `${num} - ${nome}`;
      reservas.push({ numero: num, nome });
    }
  });

  fecharFormulario();
  atualizarTabela();
}

// Função para exibir o formulário de reserva
function mostrarFormulario() {
  document.getElementById('reserva-form').style.display = 'block';
}

// Função para fechar o formulário de reserva
function fecharFormulario() {
  document.getElementById('reserva-form').style.display = 'none';
}

// Exibe login de admin
function mostrarLoginAdmin() {
  document.getElementById('admin-login').style.display = 'block';
}

// Função de login do admin
function fazerLoginAdmin() {
  const senhaAdmin = document.getElementById('senha-admin').value;
  const senhaCorreta = "12345";  // Aqui você pode colocar a lógica de senha

  if (senhaAdmin === senhaCorreta) {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-area').style.display = 'block';
    atualizarTabela();
  } else {
    alert("Senha incorreta!");
  }
}

// Sair da área de admin
function sairAdmin() {
  document.getElementById('admin-area').style.display = 'none';
  document.getElementById('admin-login').style.display = 'block';
}

// Função para limpar a rifa (resetar números)
function limparRifa() {
  const numeroDivs = document.querySelectorAll('.numero');
  numeroDivs.forEach(div => {
    div.classList.remove('reservado', 'pago');
    div.innerHTML = div.dataset.numero;
  });
  reservas = [];
  atualizarTabela();
}

// Função para marcar o número como pago
function marcarComoPago(numero) {
  const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
  if (numeroDiv && numeroDiv.classList.contains('reservado')) {
    numeroDiv.classList.add('pago');
    atualizarTabela();
  }
}

// Função para excluir a reserva de um número
function excluirReserva(numero) {
  const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
  if (numeroDiv) {
    numeroDiv.classList.remove('reservado', 'pago');
    numeroDiv.innerHTML = numero;
  }
  reservas = reservas.filter(reserva => reserva.numero !== numero);
  atualizarTabela();
}

// Função para atualizar a tabela de reservas
function atualizarTabela() {
  const tabela = document.getElementById('tabela-reservas');
  tabela.innerHTML = '';
  reservas.forEach(reserva => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${reserva.numero}</td>
      <td>${reserva.nome}</td>
      <td><button onclick="marcarComoPago('${reserva.numero}')">Marcar como Pago</button></td>
      <td><button onclick="excluirReserva('${reserva.numero}')">Excluir</button></td>
    `;
    tabela.appendChild(tr);
  });
}
