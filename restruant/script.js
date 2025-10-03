// Simple client-side menu, ordering and reservation logic
const menuData = [
  {id:1,name:'Bruschetta',category:'starters',price:6.5,desc:'Toasted bread with tomato, garlic & basil.',img:'images/bruschetta.svg'},
  {id:2,name:'Green Salad',category:'starters',price:5.0,desc:'Mixed greens, lemon vinaigrette.',img:'images/salad.svg'},
  {id:3,name:'Margherita Pizza',category:'mains',price:12.5,desc:'Tomato, mozzarella, basil.',img:'images/pizza.svg'},
  {id:4,name:'Penne Arrabiata',category:'mains',price:11.0,desc:'Spicy tomato sauce, parmesan.',img:'images/penne.svg'},
  {id:5,name:'Tiramisu',category:'desserts',price:6.0,desc:'Classic coffee mascarpone.',img:'images/tiramisu.svg'},
  {id:6,name:'Panna Cotta',category:'desserts',price:5.5,desc:'Vanilla cream with berry coulis.',img:'images/tiramisu.svg'},
  {id:7,name:'Soda',category:'drinks',price:2.5,desc:'Sparkling refreshment.',img:'images/drinks.svg'},
  {id:8,name:'Red Wine Glass',category:'drinks',price:7.0,desc:'House selection.',img:'images/drinks.svg'}
];

// state
let order = JSON.parse(localStorage.getItem('delizia-order')||'[]');

// helpers
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function formatPrice(v){return v.toFixed(2)}

function renderMenu(items){
  const grid = $('#menu-grid');
  grid.innerHTML = '';
  if(items.length===0){grid.innerHTML='<p class="muted">No items found.</p>';return}
  items.forEach(it=>{
    const card = document.createElement('article');card.className='card';
    card.innerHTML = `
      <img class="media" src="${it.img}" alt="${it.name}" />
      <h4>${it.name}</h4>
      <p>${it.desc}</p>
      <div class="meta">
        <div class="price">$${formatPrice(it.price)}</div>
        <div>
          <button class="btn add" data-id="${it.id}">Add</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function applyFilter(cat, q=''){
  q = q.trim().toLowerCase();
  let items = menuData.filter(i=> (cat==='all' || i.category===cat));
  if(q){items = items.filter(i=> i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))}
  renderMenu(items);
}

function updateOrderCount(){
  const count = order.reduce((s,i)=>s+i.qty,0);
  $('#order-count').textContent = count;
}

function saveOrder(){
  localStorage.setItem('delizia-order', JSON.stringify(order));
}

function addToOrder(id){
  const menuItem = menuData.find(m=>m.id===id); if(!menuItem) return;
  const existing = order.find(o=>o.id===id);
  if(existing) existing.qty += 1; else order.push({id:menuItem.id,name:menuItem.name,price:menuItem.price,qty:1});
  saveOrder(); updateOrderCount();
  flash(`${menuItem.name} added to order`);
}

function flash(msg){
  const el = document.createElement('div');el.textContent = msg;el.style.position='fixed';el.style.right='16px';el.style.bottom='16px';el.style.background='#222';el.style.color='#fff';el.style.padding='.5rem .8rem';el.style.borderRadius='8px';el.style.zIndex=9999;document.body.appendChild(el);
  setTimeout(()=>el.remove(),1600);
}

function renderOrderModal(){
  const panel = $('#order-list'); panel.innerHTML='';
  if(order.length===0){panel.innerHTML='<p>Your order is empty.</p>';$('#order-total').textContent='0.00';return}
  let total = 0;
  order.forEach(item=>{
    total += item.price*item.qty;
    const div = document.createElement('div');div.className='order-item';
    div.innerHTML = `<div>${item.name} x ${item.qty}</div><div>$${formatPrice(item.price*item.qty)} <button data-remove="${item.id}">remove</button></div>`;
    panel.appendChild(div);
  });
  $('#order-total').textContent = formatPrice(total);
}

function openModal(id){
  const m = $(id); m.classList.remove('hidden'); m.setAttribute('aria-hidden','false');
}
function closeModal(id){
  const m = $(id); m.classList.add('hidden'); m.setAttribute('aria-hidden','true');
}

// init
window.addEventListener('DOMContentLoaded',()=>{
  // theme handling — safe guards: if the selector is present, wire it up; otherwise do nothing
  const themeSelect = $('#theme-select');
  if(themeSelect){
    const saved = localStorage.getItem('delizia-theme') || 'warm';
    document.documentElement.setAttribute('data-theme', saved);
    themeSelect.value = saved;
    const applyNeon = t => {
      const isNeon = t === 'neon';
      document.querySelectorAll('.logo').forEach(el=>el.classList.toggle('neon', isNeon));
      document.querySelectorAll('.btn').forEach(el=>el.classList.toggle('neon', isNeon));
      document.querySelectorAll('.card').forEach(el=>el.classList.toggle('neon', isNeon));
    };
    applyNeon(saved);
    themeSelect.addEventListener('change', e=>{
      const t = e.target.value; document.documentElement.setAttribute('data-theme', t); localStorage.setItem('delizia-theme', t); applyNeon(t);
    });
  }
  // initial render
  applyFilter('all');
  updateOrderCount();
  $('#year').textContent = new Date().getFullYear();

  // filters
  $$('.filter').forEach(btn=>btn.addEventListener('click',e=>{
    $$('.filter').forEach(b=>b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    applyFilter(e.currentTarget.dataset.cat, $('#search').value);
  }));

  // search
  $('#search').addEventListener('input',e=>{
    applyFilter($$('.filter.active')[0]?.dataset.cat||'all', e.target.value);
  });

  // delegate add buttons
  document.body.addEventListener('click', e=>{
    if(e.target.matches('.btn.add')){
      addToOrder(Number(e.target.dataset.id));
    }
    if(e.target.id==='view-order'){
      renderOrderModal(); openModal('#order-modal');
    }
    if(e.target.dataset.dismiss!==undefined || e.target.classList.contains('modal-close')){
      // close closest modal
      const modal = e.target.closest('.modal'); if(modal) closeModal('#'+modal.id);
    }
    if(e.target.matches('#reserve-btn')){ openModal('#reserve-modal') }
    if(e.target.matches('#checkout')){
      if(order.length===0){ flash('Order is empty'); return }
      // fake checkout
      flash('Thank you — your order is placed!'); order = []; saveOrder(); updateOrderCount(); renderOrderModal(); closeModal('#order-modal');
    }
    if(e.target.matches('[data-remove]')){
      const rid = Number(e.target.getAttribute('data-remove'));
      order = order.filter(i=>i.id!==rid); saveOrder(); updateOrderCount(); renderOrderModal();
    }
  });

  // reservation form
  $('#reserve-form').addEventListener('submit', e=>{
    e.preventDefault();
    const fm = new FormData(e.target);
    const name = fm.get('name');
    // show success message
    $('#reserve-success').classList.remove('hidden');
    $('#reserve-success').textContent = `Thanks ${name}! Your reservation request was received.`;
    e.target.reset();
    setTimeout(()=>{ closeModal('#reserve-modal'); $('#reserve-success').classList.add('hidden') },2000);
  });

});
