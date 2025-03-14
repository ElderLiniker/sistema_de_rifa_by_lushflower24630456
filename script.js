document.addEventListener('DOMContentLoaded', async function () {
  await carregarReservas();
  gerarRifa();
});

async function carregarReservas() {
  try {
    const response = await fetch('https://rifa-api-spxw.onrender.com');
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

let numerosReservados = {};
let numerosSelecionados = [];
let adminLogado = false;

function gerarRifa() {
  const rifaContainer = document.getElementById('rifa-container');
  rifaContainer.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const numeroDiv = document.createElement('div');
    numeroDiv.classList.add('numero');
    numeroDiv.dataset.numero = i.toString().padStart(2, '0');
    numeroDiv.textContent = i.toString().padStart(2, '0');

    // Exibe o nome da pessoa ao lado do número
    if (numerosReservados[i.toString().padStart(2, '0')]) {
      const nomePessoa = numerosReservados[i.toString().padStart(2, '0')].nome;
      numeroDiv.textContent += ` - ${nomePessoa}`;
    }

    // Verifica se o número foi reservado e marca a cor
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
    const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
    if (numeroDiv) {
      numeroDiv.classList.remove('selecionado');
    }
  } else {
    numerosSelecionados.push(numero);
    const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
    if (numeroDiv) {
      numeroDiv.classList.add('selecionado');
    }
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
    const response = await fetch('https://rifa-api-spxw.onrender.com', {
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
  const elementosSelecionados = document.querySelectorAll('.numero.selecionado');
  elementosSelecionados.forEach(elemento => {
    elemento.classList.remove('selecionado');
  });
}

function mostrarLoginAdmin() {
  document.getElementById('admin-login').style.display = 'block';
}

function fazerLoginAdmin() {
  const senha = document.getElementById('senha-admin').value;

  // Verificar a senha através de uma requisição de API
  fetch('https://rifa-api-spxw.onrender.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.sucesso) {
      adminLogado = true;
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
  document.getElementById('admin-area').style.display = 'none';
  salvarDados();
}

async function limparRifa() {
  if (confirm('Tem certeza que deseja limpar toda a rifa?')) {
    try {
      const response = await fetch('https://rifa-api-spxw.onrender.com', { method: 'DELETE' });
      if (response.ok) {
        numerosReservados = {}; // Limpar os números reservados no frontend
        gerarRifa(); // Regerar a rifa
        atualizarAreaAdmin(); // Atualizar a área administrativa
        atualizarRifaContainer(); // Atualizar a interface de números
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
    const response = await fetch(`https://rifa-api-spxw.onrender.com`, { method: 'PUT' });
    if (response.ok) {
      // Atualiza a interface para refletir que o número foi marcado como pago
      const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
      if (numeroDiv) {
        numeroDiv.classList.add('pago');
        numeroDiv.classList.remove('reservado');
      }
    }
  } catch (error) {
    console.error('Erro ao marcar como pago:', error);
  }
}
async function marcarComoNaoPago(numero) {
  try {
    const response = await fetch(`https://rifa-api-spxw.onrender.com`, { method: 'PUT' });

    if (response.ok) {
      // Atualiza a interface para refletir que o número foi marcado como não pago
      const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
      if (numeroDiv) {
        numeroDiv.classList.remove('pago');  // Remove a classe "pago"
        numeroDiv.classList.add('reservado'); // Adiciona a classe "reservado"
      }
    } else {
      alert('Erro ao marcar como não pago');
    }
  } catch (error) {
    console.error('Erro ao marcar como não pago:', error);
  }
}



async function excluirNumero(numero) {
  try {
    await fetch(`https://rifa-api-spxw.onrender.com`, { method: 'DELETE' });
    await carregarReservas();
  } catch (error) {
    console.error('Erro ao excluir número:', error);
  }
}

function atualizarAreaAdmin() {
  const tabelaReservas = document.getElementById('tabela-reservas');
  tabelaReservas.innerHTML = '';
  
  let cabecalho = tabelaReservas.createTHead();
  let linhaCabecalho = cabecalho.insertRow();
  let thNumero = document.createElement('th');
  let thNome = document.createElement('th');
  let thPago = document.createElement('th');
  let thAcoes = document.createElement('th');
  
  thNumero.textContent = 'Número';
  thNome.textContent = 'Nome';
  thPago.textContent = 'Pago';
  thAcoes.textContent = 'Ações';
  
  linhaCabecalho.appendChild(thNumero);
  linhaCabecalho.appendChild(thNome);
  linhaCabecalho.appendChild(thPago);
  linhaCabecalho.appendChild(thAcoes);

  for (const numero in numerosReservados) {
    if (numerosReservados.hasOwnProperty(numero)) {
      const reserva = numerosReservados[numero];
      let linha = tabelaReservas.insertRow();
      let celulaNumero = linha.insertCell();
      let celulaNome = linha.insertCell();
      let celulaPago = linha.insertCell();
      let celulaAcoes = linha.insertCell();

      celulaNumero.textContent = numero;
      celulaNome.textContent = reserva.nome;

      const btnPago = document.createElement('button');
      btnPago.textContent = reserva.pago ? 'Marcar como Não Pago' : 'Marcar como Pago';
      btnPago.style.backgroundColor = reserva.pago ? 'green' : ''; // Muda a cor para verde
      btnPago.addEventListener('click', function() {
        if (reserva.pago) {
          marcarComoNaoPago(numero);  // Marca como não pago
        } else {
          marcarComoPago(numero);  // Marca como pago
        }
      });
      celulaPago.appendChild(btnPago);

      const btnExcluir = document.createElement('button');
      btnExcluir.textContent = 'Excluir';
      btnExcluir.addEventListener('click', function() {
        excluirNumero(numero);
      });
      celulaAcoes.appendChild(btnExcluir);
    }
  }
}


function atualizarNumeroDiv(numero) {
  const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
  if (numeroDiv) {
    numeroDiv.classList.remove('reservado');
    numeroDiv.classList.remove('selecionado');
    numeroDiv.classList.remove('pago');
    numeroDiv.innerHTML = numero;

    if (numerosReservados[numero]) {
      numeroDiv.classList.add('reservado');
      if (numerosReservados[numero].pago) {
        numeroDiv.classList.add('pago');
      } else {
        numeroDiv.style.backgroundColor = '#f0ad4e'; // Cor para número reservado, mas não pago
      }
    }

    numeroDiv.removeEventListener('click', function() {});
    if (!numerosReservados[numero]) {
      numeroDiv.addEventListener('click', function() {
        selecionarNumero(numero);
      });
    }
  }
}

function salvarDados() {
  if (adminLogado) {
    localStorage.setItem('adminLogado', 'true');
  } else {
    localStorage.removeItem('adminLogado');
  }
}

