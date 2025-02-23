document.addEventListener('DOMContentLoaded', function() {
  // Recupera os dados salvos no localStorage
  const savedNumerosReservados = localStorage.getItem('numerosReservados');
  if (savedNumerosReservados) {
    numerosReservados = JSON.parse(savedNumerosReservados);
  }

  const savedAdminLogado = localStorage.getItem('adminLogado');
  if (savedAdminLogado) {
    adminLogado = JSON.parse(savedAdminLogado);
    if (adminLogado) {
      document.getElementById('admin-login').style.display = 'none';
      document.getElementById('admin-area').style.display = 'block';
      atualizarAreaAdmin();
    }
  }

  gerarRifa();
});

let numerosReservados = {}; // Objeto para armazenar os números reservados e os nomes
let numerosSelecionados = []; // Array para armazenar os números selecionados
let adminLogado = false; // Variável para verificar se o admin está logado

function gerarRifa() {
  const rifaContainer = document.getElementById('rifa-container');
  rifaContainer.innerHTML = ''; // Limpa qualquer conteúdo existente

  for (let i = 0; i < 100; i++) {
    const numeroDiv = document.createElement('div');
    numeroDiv.classList.add('numero');
    numeroDiv.dataset.numero = i.toString().padStart(2, '0'); // Garante dois dígitos
    numeroDiv.textContent = i.toString().padStart(2, '0'); // Garante dois dígitos
    numeroDiv.addEventListener('click', function() {
      selecionarNumero(i.toString().padStart(2, '0')); // Passa o número com dois dígitos
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
    // Se já está selecionado, remove da lista
    numerosSelecionados = numerosSelecionados.filter(num => num !== numero);
    const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
    if (numeroDiv) {
      numeroDiv.classList.remove('selecionado');
    }
  } else {
    // Se não está selecionado, adiciona à lista
    numerosSelecionados.push(numero);
    const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
    if (numeroDiv) {
      numeroDiv.classList.add('selecionado');
    }
  }

  // Atualiza o campo de números no formulário
  document.getElementById('numeros').value = numerosSelecionados.join(', ');
  document.getElementById('reserva-form').style.display = 'block';
}

function reservarNumeros() {
  const nome = document.getElementById('nome').value;
  let numeros = document.getElementById('numeros').value;

  // Divide a string de números em um array
  numeros = numeros.split(',').map(num => num.trim());

  if (!nome) {
    alert('Por favor, insira seu nome.');
    return;
  }

  for (const numero of numeros) {
    if (numerosReservados[numero] && !numerosReservados[numero].pago) {
      alert(`O número ${numero} já está reservado.`);
      return;
    }
    numerosReservados[numero] = { nome: nome, pago: false };

    const numeroDiv = document.querySelector(`.numero[data-numero="${numero}"]`);
    if (numeroDiv) {
      numeroDiv.classList.remove('selecionado'); // Remove a classe de selecionado
      numeroDiv.classList.add('reservado');
    }
  }

  document.getElementById('reserva-form').style.display = 'none';
  document.getElementById('nome').value = '';
  document.getElementById('numeros').value = '';
  numerosSelecionados = []; // Limpa a lista de números selecionados

  // Atualiza a área de administração se o admin estiver logado
  if (adminLogado) {
    atualizarAreaAdmin();
  }
  atualizarRifaContainer();
  salvarDados();
}

function fecharFormulario() {
  document.getElementById('reserva-form').style.display = 'none';
  numerosSelecionados = []; // Limpa a lista de números selecionados
  // Remove a classe 'selecionado' dos números
  const elementosSelecionados = document.querySelectorAll('.numero.selecionado');
  elementosSelecionados.forEach(elemento => {
    elemento.classList.remove('selecionado');
  });
}

// Funcionalidade da área de administração
function mostrarLoginAdmin() {
  document.getElementById('admin-login').style.display = 'block';
}

function fazerLoginAdmin() {
  const senha = document.getElementById('senha-admin').value;
  if (senha === 'admin123') {
    adminLogado = true;
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-area').style.display = 'block';
    atualizarAreaAdmin();
    salvarDados();
  } else {
    alert('Senha incorreta.');
  }
}

function sairAdmin() {
  adminLogado = false;
  document.getElementById('admin-area').style.display = 'none';
  salvarDados();
}

function limparRifa() {
  if (confirm('Tem certeza que deseja limpar toda a rifa?')) {
    numerosReservados = {};
    gerarRifa();
    atualizarAreaAdmin();
    atualizarRifaContainer();
    salvarDados();
  }
}

function marcarComoPago(numero) {
  numerosReservados[numero].pago = !numerosReservados[numero].pago;
  atualizarAreaAdmin();
  atualizarNumeroDiv(numero);
  atualizarRifaContainer();
  salvarDados();
}

function excluirNumero(numero) {
  delete numerosReservados[numero];
  atualizarAreaAdmin();
  atualizarNumeroDiv(numero);
  atualizarRifaContainer();
  salvarDados();
}

function atualizarAreaAdmin() {
  const tabelaReservas = document.getElementById('tabela-reservas');
  tabelaReservas.innerHTML = ''; // Limpa a tabela

  // Cria o cabeçalho da tabela
  let cabecalho = tabelaReservas.createTHead();
  let linhaCabecalho = cabecalho.insertRow();
  let thNumero = document.createElement('th');
  let thNome = document.createElement('th');
  let thPago = document.createElement('th'); // Nova coluna para Pago
  let thAcoes = document.createElement('th'); // Nova coluna para Ações
  thNumero.textContent = 'Número';
  thNome.textContent = 'Nome';
  thPago.textContent = 'Pago';
  thAcoes.textContent = 'Ações';
  linhaCabecalho.appendChild(thNumero);
  linhaCabecalho.appendChild(thNome);
  linhaCabecalho.appendChild(thPago);
  linhaCabecalho.appendChild(thAcoes);

  // Preenche a tabela com os números reservados
  for (const numero in numerosReservados) {
    if (numerosReservados.hasOwnProperty(numero)) {
      const reserva = numerosReservados[numero];
      let linha = tabelaReservas.insertRow();
      let celulaNumero = linha.insertCell();
      let celulaNome = linha.insertCell();
      let celulaPago = linha.insertCell(); // Celula para o status de pagamento
      let celulaAcoes = linha.insertCell(); // Celula para os botões de ação

      celulaNumero.textContent = numero;
      celulaNome.textContent = reserva.nome;

      // Botão para marcar como pago/não pago
      const btnPago = document.createElement('button');
      btnPago.textContent = reserva.pago ? 'Não Pago' : 'Pago';
      btnPago.addEventListener('click', function() {
        marcarComoPago(numero);
      });
      celulaPago.appendChild(btnPago);

      // Botão para excluir número
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
    numeroDiv.classList.remove('pago'); // Remove a classe pago

    numeroDiv.innerHTML = numero; // Limpa o conteúdo

    if (numerosReservados[numero]) {
      numeroDiv.classList.add('reservado');
      if (numerosReservados[numero].pago) {
        numeroDiv.classList.add('pago'); // Adiciona a classe pago se estiver pago
      }
    }

    // Adiciona o evento de clique novamente, se o número não estiver reservado
    numeroDiv.removeEventListener('click', function() {}); // Remove o listener existente
    if (!numerosReservados[numero]) {
      numeroDiv.addEventListener('click', function() {
        selecionarNumero(numero);
      });
    }
  }
}

function atualizarRifaContainer() {
  const rifaContainer = document.getElementById('rifa-container');
  rifaContainer.innerHTML = '';

  let reservasPorNome = {};

  // Agrupa os números reservados por nome
  for (const numero in numerosReservados) {
    if (numerosReservados.hasOwnProperty(numero)) {
      const reserva = numerosReservados[numero];
      if (!reservasPorNome[reserva.nome]) {
        reservasPorNome[reserva.nome] = [];
      }
      reservasPorNome[reserva.nome].push({ numero: numero, pago: reserva.pago });
    }
  }

  // Para cada número na rifa
  for (let i = 0; i < 100; i++) {
    const numeroFormatado = i.toString().padStart(2, '0');
    const numeroDiv = document.createElement('div');
    numeroDiv.classList.add('numero');
    numeroDiv.dataset.numero = numeroFormatado;
    numeroDiv.textContent = numeroFormatado;

    // Verifica se o número está reservado
    let reservado = false;
    for (const nome in reservasPorNome) {
      const numeros = reservasPorNome[nome];
      const numeroReservado = numeros.find(n => n.numero === numeroFormatado);
      if (numeroReservado) {
        reservado = true;
        numeroDiv.classList.add('reservado');
        if (numeroReservado.pago) {
          numeroDiv.classList.add('pago');
        }
        numeroDiv.textContent = numeroFormatado; // Garante que o número seja exibido

        const nomeSpan = document.createElement('span');
        nomeSpan.textContent = nome;
        numeroDiv.appendChild(nomeSpan);
        break; // Não precisa verificar outros nomes
      }
    }

    if (!reservado) {
      numeroDiv.addEventListener('click', function() {
        selecionarNumero(numeroFormatado);
      });
    }

    rifaContainer.appendChild(numeroDiv);
  }
}

function salvarDados() {
  localStorage.setItem('numerosReservados', JSON.stringify(numerosReservados));
  localStorage.setItem('adminLogado', JSON.stringify(adminLogado));
}