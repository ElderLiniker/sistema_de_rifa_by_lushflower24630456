const apiUrl = 'https://rifa-api-production.up.railway.app';

// ╭─ Admin cache ─╮
let adminLogado = localStorage.getItem('adminLogado')==='true';
let senhaAdmin  = localStorage.getItem('senhaAdmin')||'';

// ╭─ DOM ready ─╮
document.addEventListener('DOMContentLoaded', async()=>{
  await verificaAdmin();
  await carregarReservas();
  gerarRifa();
  await carregaConfig();
});

/* ─ Configurações (rifa/premio) ─ */
const inforifa=document.querySelector('.info-rifa');
const infopremio=document.querySelector('.info-premio');
const inputvalue=document.querySelector('.inputvalue');
const inputpremio=document.querySelector('.inputpremio');

async function carregaConfig(){
  try{
    const r=await fetch(apiUrl+'/configuracoes');
    const {rifa,premio}=await r.json();
    if(rifa)setCampo('rifa',rifa);
    if(premio)setCampo('premio',premio);
  }catch{
    if(localStorage.rifa)setCampo('rifa',localStorage.rifa);
    if(localStorage.premio)setCampo('premio',localStorage.premio);
  }
}
function setCampo(chave,val){
  if(chave==='rifa')inforifa.textContent=val;
  if(chave==='premio')infopremio.textContent=val;
  localStorage[chave]=val;
}
document.querySelector('.button-mudar').onclick=()=>salvarCampo('rifa',inputvalue.value.trim());
document.querySelector('.button-premio').onclick=()=>salvarCampo('premio',inputpremio.value.trim());

async function salvarCampo(chave,valor){
  if(!valor)return;
  setCampo(chave,valor);
  try{
    await fetch(apiUrl+'/configuracoes',{method:'PUT',
      headers:{'Content-Type':'application/json',Authorization:senhaAdmin},
      body:JSON.stringify({[chave]:valor})});
  }catch{alert('Falha ao salvar na API');}
}

/* ─ Reservas ─ */
let numerosReservados={}, numerosSelecionados=[];
async function carregarReservas(){
  const r=await fetch(apiUrl+'/reservas');
  numerosReservados={};
  (await r.json()).forEach(x=>numerosReservados[x.numero]={nome:x.nome,pago:x.pago});
  atualizarRifaContainer();
}
function gerarRifa(){
  const c=document.getElementById('rifa-container');c.innerHTML='';
  for(let i=0;i<100;i++){
    const n=i.toString().padStart(2,'0');
    const d=document.createElement('div');d.className='numero';d.dataset.numero=n;d.textContent=n;
    if(numerosReservados[n]){d.textContent+=` - ${numerosReservados[n].nome}`;d.classList.add('reservado');
      if(numerosReservados[n].pago)d.classList.add('pago');}
    d.onclick=()=>selecionarNumero(n);
    c.appendChild(d);
  }
}
function selecionarNumero(n){
  if(numerosReservados[n]&&!numerosReservados[n].pago)return alert('Já reservado');
  const idx=numerosSelecionados.indexOf(n);
  if(idx>-1){numerosSelecionados.splice(idx,1);document.querySelector(`.numero[data-numero="${n}"]`).classList.remove('selecionado');}
  else{numerosSelecionados.push(n);document.querySelector(`.numero[data-numero="${n}"]`).classList.add('selecionado');}
  document.getElementById('numeros').value=numerosSelecionados.join(', ');
  document.getElementById('reserva-form').style.display='block';
}
async function reservarNumeros(){
  const nome=document.getElementById('nome').value;
  const nums=numerosSelecionados;
  if(!nome)return alert('Insira nome');
  const r=await fetch(apiUrl+'/reservas',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({nome,numeros:nums})});
  if(r.ok){alert('Reservado!');fecharFormulario();carregarReservas();}
  else alert('Erro ao reservar');
}
function fecharFormulario(){
  document.getElementById('reserva-form').style.display='none';
  numerosSelecionados=[];document.querySelectorAll('.numero.selecionado').forEach(e=>e.classList.remove('selecionado'));
}
function atualizarRifaContainer(){for(const n in numerosReservados)atualizarNumeroDiv(n);}
function atualizarNumeroDiv(n){
  const d=document.querySelector(`.numero[data-numero="${n}"]`);
  if(!d)return;
  d.className='numero';d.textContent=n;
  if(numerosReservados[n]){d.textContent+=` - ${numerosReservados[n].nome}`;d.classList.add('reservado');
    if(numerosReservados[n].pago)d.classList.add('pago');}
}

/* ─ Admin ─ */
async function verificaAdmin(){
  if(!adminLogado)return;
  const r=await fetch(apiUrl+'/api/verificar-admin',{headers:{Authorization:senhaAdmin}});
  if(r.ok)document.getElementById('admin-area').style.display='block';
  else sairAdmin();
}
function mostrarLoginAdmin(){document.getElementById('admin-login').style.display='block';}
function fazerLoginAdmin(){
  const senha=document.getElementById('senha-admin').value;
  fetch(apiUrl+'/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senha})})
  .then(r=>r.json()).then(d=>{
    if(d.autorizado){adminLogado=true;senhaAdmin=senha;localStorage.adminLogado='true';localStorage.senhaAdmin=senha;
      document.getElementById('admin-login').style.display='none';
      document.getElementById('admin-area').style.display='block';
      atualizarAreaAdmin();}
    else alert('Senha incorreta');
  });
}
function sairAdmin(){adminLogado=false;senhaAdmin='';localStorage.removeItem('adminLogado');localStorage.removeItem('senhaAdmin');
  document.getElementById('admin-area').style.display='none';}

function atualizarAreaAdmin(){
  const t=document.getElementById('tabela-reservas');t.innerHTML='';
  const head=t.insertRow();['Número','Nome','Pago','Ações'].forEach(h=>{const th=document.createElement('th');th.textContent=h;head.appendChild(th);});
  for(const n in numerosReservados){
    const r=numerosReservados[n];const row=t.insertRow();
    row.insertCell().textContent=n;row.insertCell().textContent=r.nome;
    const btnPago=document.createElement('button');btnPago.textContent=r.pago?'Não Pago':'Pago';
    btnPago.style.background=r.pago?'green':'';
    btnPago.onclick=()=>togglePago(n,r.pago);
    row.insertCell().appendChild(btnPago);
    const btnDel=document.createElement('button');btnDel.textContent='Excluir';
    btnDel.onclick=()=>excluirNumero(n);
    row.insertCell().appendChild(btnDel);
  }
}
async function togglePago(n,flag){
  await fetch(`${apiUrl}/reservas/${n}/${flag?'nao-pago':'pago'}`,{method:'PUT'});
  numerosReservados[n].pago=!flag;atualizarNumeroDiv(n);atualizarAreaAdmin();
}
async function excluirNumero(n){
  const r=await fetch(`${apiUrl}/reservas/${n}`,{method:'DELETE',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({senha:senhaAdmin})});
  if(r.ok){delete numerosReservados[n];atualizarAreaAdmin();atualizarNumeroDiv(n);}
  else alert('Erro ao excluir');
}
async function limparRifa(){
  if(!confirm('Limpar toda rifa?'))return;
  const r=await fetch(apiUrl+'/reservas',{method:'DELETE',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({senha:senhaAdmin})});
  if(r.ok){numerosReservados={};atualizarAreaAdmin();atualizarRifaContainer();}
  else alert('Erro');
}