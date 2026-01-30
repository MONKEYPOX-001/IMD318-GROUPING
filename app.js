// BorneoAutoHub (Carsome-style frontend)
// Shared helpers
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function showToast(title, msg, type='info', timeout=3500){
  const host = document.getElementById('toastHost');
  if(!host) return;
  const t = document.createElement('div');
  t.className = `toast ${type||'info'}`;
  t.innerHTML = `
    <div>
      <div class="title">${title||'Notification'}</div>
      <div class="msg">${msg||''}</div>
    </div>
    <button class="close" aria-label="Close">×</button>
  `;
  const close = ()=> {
    t.style.animation = 'toastOut .14s ease-in forwards';
    setTimeout(()=>t.remove(), 160);
  };
  t.querySelector('.close').addEventListener('click', close);
  host.appendChild(t);
  if(timeout){
    setTimeout(()=>{ if(document.body.contains(t)) close(); }, timeout);
  }
}
window.showToast = showToast;


function money(n){
  try{
    return new Intl.NumberFormat('en-MY', {style:'currency', currency:'MYR', maximumFractionDigits:0}).format(n);
  }catch(e){
    return 'RM ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
function km(n){ return (n||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' km'; }

function slug(s){ return (s||'').toString().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

function setActiveNav(){
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $all('.nav a').forEach(a=>{
    const href = (a.getAttribute('href')||'').toLowerCase();
    a.classList.toggle('active', href === path);
  });
}

// Modals
function openModal(id){
  const m = document.getElementById(id);
  if(m){ m.classList.add('open'); document.body.classList.add('modal-open'); }
}
function closeModal(id){
  const m = document.getElementById(id);
  if(m){ m.classList.remove('open'); document.body.classList.remove('modal-open'); }
}
document.addEventListener('click', (e)=>{
  const closeBtn = e.target.closest('[data-close]');
  if(closeBtn){ closeModal(closeBtn.getAttribute('data-close')); }
  const overlay = e.target.classList && e.target.classList.contains('modal');
  if(overlay){ closeModal(e.target.id); }
});

// Simple scroll reveal
function initReveal(){
  const els = $all('.reveal');
  if(!('IntersectionObserver' in window) || !els.length) { els.forEach(el=>el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(ent=>{
      if(ent.isIntersecting){ ent.target.classList.add('in'); io.unobserve(ent.target); }
    });
  }, {threshold: 0.12});
  els.forEach(el=>io.observe(el));
}

// Data
function getCars(){
  return (window.BAH && Array.isArray(window.BAH.CARS)) ? window.BAH.CARS.slice() : [];
}
function getCarById(id){
  return getCars().find(c=>c.id === id);
}

// Shared enquiry modal
function openEnquiry(car){
  const modal = $('#enquiryModal');
  if(!modal) return;

  const generic = !car;
  const name = generic ? 'General enquiry' : car.name;
  const meta = generic ? 'Ask about financing, viewing, trade‑in, or rentals.' : `${car.year} • ${car.bodyType} • ${car.transmission} • ${km(car.mileage)}`;

  $('#enquiryCarName').textContent = name;
  const n2 = $('#enquiryCarName2'); if(n2) n2.textContent = name;

  $('#enquiryCarMeta').textContent = meta;
  const m2 = $('#enquiryCarMeta2'); if(m2) m2.textContent = meta;

  const img = $('#enquiryCarImg');
  const mini = $('.mini-card');
  if(generic){
    if(img) img.src = '';
    if(mini) mini.style.display = 'none';
    const hid = $('#enquiryCarId'); if(hid) hid.value = '';
  }else{
    if(mini) mini.style.display = '';
    if(img) img.src = car.image || '';
    const hid = $('#enquiryCarId'); if(hid) hid.value = car.id;
  }

  openModal('enquiryModal');
}

window.openEnquiry = openEnquiry;

function bindEnquiryForm(){
  const form = $('#enquiryForm');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = $('#enqName').value.trim();
    const phone = $('#enqPhone').value.trim();
    if(!name || !phone){
      $('#enquiryMsg').textContent = 'Please fill in your name and phone number.';
      $('#enquiryMsg').className = 'form-msg error';
      window.showToast && showToast('Missing details','Please fill in your name and phone number.','error');
      return;
    }
    window.showToast && showToast('Enquiry sent','Thanks! We received your enquiry. Our team will contact you shortly.','success');
    $('#enquiryMsg').textContent = 'Thanks! We received your enquiry. Our team will contact you shortly.';
    $('#enquiryMsg').className = 'form-msg success';
    form.reset();
  });
}


// HOME page featured
function renderHome(){
  const grid = $('#featuredGrid');
  if(!grid) return;
  const cars = getCars().slice(0,6);
  grid.innerHTML = cars.map(c=>`
    <article class="vehicle-card reveal" data-id="${c.id}">
      <div class="vehicle-img">
        <img src="${c.image}" alt="${c.name}">
        <span class="badge badge-primary">Certified</span>
      </div>
      <div class="vehicle-body">
        <div class="vehicle-top">
          <h3 class="vehicle-title">${c.name}</h3>
          <div class="vehicle-price">${money(c.price)}</div>
        </div>
        <div class="spec-row">
          <span class="spec">${c.year}</span>
          <span class="spec">${km(c.mileage)}</span>
          <span class="spec">${c.transmission}</span>
        </div>
        <div class="vehicle-actions">
          <a class="btn-outline" href="car.html?id=${encodeURIComponent(c.id)}">View details</a>
          <a class="btn-outline" href="compare.html?add=${encodeURIComponent(c.id)}">Compare</a>
          <a class="btn-outline" href="finance.html?id=${encodeURIComponent(c.id)}">Monthly</a>
          <button class="btn" data-enquire="${c.id}">Enquire</button>
        </div>
      </div>
    </article>
  `).join('');

  $all('[data-enquire]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const id = btn.getAttribute('data-enquire');
      const car = getCarById(id);
      if(car) openEnquiry(car);
    });
  });

  $all('.vehicle-card').forEach(card=>{
    card.addEventListener('click', (e)=>{
      if(e.target.closest('a,button')) return;
      const id=card.getAttribute('data-id');
      location.href = `car.html?id=${encodeURIComponent(id)}`;
    });
  });

  initReveal();
}

// BUY page
function renderBuy(){
  const grid = $('#buyGrid');
  if(!grid) return;

  const cars = getCars();
  // Populate body type chips from data (keep your UI but make it real)
  const chipWrap = $('#typeChips');
  if(chipWrap && !chipWrap.dataset.bound){
    const types = Array.from(new Set(cars.map(c=>c.bodyType))).sort();
    chipWrap.innerHTML = ['All', ...types].map(t=>`<button class="chip" data-type="${t==='All'?'':t}">${t}</button>`).join('');
    chipWrap.dataset.bound = '1';
  }

  function cardHTML(c){
    return `
      <article class="vehicle-card reveal" data-id="${c.id}">
        <div class="vehicle-img">
          <img src="${c.image}" alt="${c.name}">
          <span class="badge badge-primary">Certified</span>
        </div>
        <div class="vehicle-body">
          <div class="vehicle-top">
            <h3 class="vehicle-title">${c.name}</h3>
            <div class="vehicle-price">${money(c.price)}</div>
          </div>
          <div class="spec-row">
            <span class="spec">${c.year}</span>
            <span class="spec">${km(c.mileage)}</span>
            <span class="spec">${c.transmission}</span>
            <span class="spec">${c.fuel}</span>
          </div>
          <div class="vehicle-actions">
            <a class="btn-outline" href="car.html?id=${encodeURIComponent(c.id)}">View details</a>
            <a class="btn-outline" href="compare.html?add=${encodeURIComponent(c.id)}">Compare</a>
            <a class="btn-outline" href="finance.html?id=${encodeURIComponent(c.id)}">Monthly</a>
            <button class="btn" data-enquire="${c.id}">Enquire</button>
          </div>
        </div>
      </article>
    `;
  }

  // state
  const state = {
    type: '',
    q: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxMileage: '',
    transmission: '',
    sort: 'relevance'
  };

  // read URL search into q
  const params = new URLSearchParams(location.search);
  const qparam = params.get('q');
  if(qparam) state.q = qparam;

  // bind inputs
  const qInp = $('#filterKeyword');
  if(qInp){ qInp.value = state.q; qInp.addEventListener('input', ()=>{ state.q = qInp.value; apply(); }); }
  const minP = $('#filterMinPrice'); if(minP) minP.addEventListener('input', ()=>{ state.minPrice = minP.value; apply(); });
  const maxP = $('#filterMaxPrice'); if(maxP) maxP.addEventListener('input', ()=>{ state.maxPrice = maxP.value; apply(); });
  const minY = $('#filterMinYear'); if(minY) minY.addEventListener('input', ()=>{ state.minYear = minY.value; apply(); });
  const maxM = $('#filterMaxMileage'); if(maxM) maxM.addEventListener('input', ()=>{ state.maxMileage = maxM.value; apply(); });
  const trn = $('#filterTransmission'); if(trn) trn.addEventListener('change', ()=>{ state.transmission = trn.value; apply(); });
  const sortSel = $('#sortBy'); if(sortSel) sortSel.addEventListener('change', ()=>{ state.sort = sortSel.value; apply(); });

  // chips
  if(chipWrap){
    chipWrap.addEventListener('click',(e)=>{
      const btn = e.target.closest('.chip'); if(!btn) return;
      $all('#typeChips .chip').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.type = btn.dataset.type || '';
      apply();
    });
    // set default active
    const first = chipWrap.querySelector('.chip'); if(first) first.classList.add('active');
  }

  const clearBtn = $('#clearFilters');
  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{
      state.type=''; state.q=''; state.minPrice=''; state.maxPrice=''; state.minYear=''; state.maxMileage=''; state.transmission=''; state.sort='relevance';
      if(qInp) qInp.value='';
      if(minP) minP.value='';
      if(maxP) maxP.value='';
      if(minY) minY.value='';
      if(maxM) maxM.value='';
      if(trn) trn.value='';
      if(sortSel) sortSel.value='relevance';
      $all('#typeChips .chip').forEach((b,i)=>{ b.classList.toggle('active', i===0); });
      apply();
    });
  }

  function matches(c){
    if(state.type && c.bodyType !== state.type) return false;

    if(state.q){
      const needle = state.q.toLowerCase();
      const hay = `${c.name} ${c.brand} ${c.model} ${c.bodyType} ${c.transmission} ${c.fuel}`.toLowerCase();
      if(!hay.includes(needle)) return false;
    }

    const minPrice = parseInt(state.minPrice||'',10);
    if(!Number.isNaN(minPrice) && c.price < minPrice) return false;

    const maxPrice = parseInt(state.maxPrice||'',10);
    if(!Number.isNaN(maxPrice) && c.price > maxPrice) return false;

    const minYear = parseInt(state.minYear||'',10);
    if(!Number.isNaN(minYear) && c.year < minYear) return false;

    const maxMileage = parseInt(state.maxMileage||'',10);
    if(!Number.isNaN(maxMileage) && c.mileage > maxMileage) return false;

    if(state.transmission && c.transmission !== state.transmission) return false;

    return true;
  }

  function sortCars(list){
    const arr = list.slice();
    switch(state.sort){
      case 'price-asc': arr.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': arr.sort((a,b)=>b.price-a.price); break;
      case 'year-desc': arr.sort((a,b)=>b.year-a.year); break;
      case 'mileage-asc': arr.sort((a,b)=>a.mileage-b.mileage); break;
      default: break; // relevance = keep original order
    }
    return arr;
  }

  function apply(){
    const filtered = sortCars(cars.filter(matches));
    const count = $('#resultCount'); if(count) count.textContent = `${filtered.length} result${filtered.length===1?'':'s'}`;
    if(!filtered.length){
      grid.innerHTML = `<div class="empty-state reveal in"><h3>No matches</h3><p>Try adjusting your filters or clearing them.</p></div>`;
    }else{
      grid.innerHTML = filtered.map(cardHTML).join('');
    }

    // bind enquire buttons
    $all('[data-enquire]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        const id = btn.getAttribute('data-enquire');
        const car = getCarById(id);
        if(car) openEnquiry(car);
      });
    });

    // bind click anywhere on card to open details (except buttons/links)
    $all('.vehicle-card').forEach(card=>{
      card.addEventListener('click', (e)=>{
        if(e.target.closest('a,button,input,select,textarea,label')) return;
        const id = card.getAttribute('data-id');
        location.href = `car.html?id=${encodeURIComponent(id)}`;
      });
    });

    initReveal();
  }

  apply();
}

// CAR DETAIL page
function renderCarDetail(){
  const holder = $('#carDetail');
  if(!holder) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const car = id ? getCarById(id) : null;

  if(!car){
    holder.innerHTML = `<div class="empty-state reveal in"><h3>Car not found</h3><p>Please go back to <a href="buy.html" class="link">Buy</a>.</p></div>`;
    return;
  }

  holder.innerHTML = `
    <div class="detail-grid reveal in">
      <div class="detail-media">
        <img class="detail-img" src="${car.image}" alt="${car.name}">
        <div class="detail-badges">
          <span class="badge badge-primary">Certified</span>
          <span class="badge badge-success">${car.warranty}</span>
        </div>
      </div>

      <div class="detail-main">
        <div class="detail-head">
          <h1>${car.name}</h1>
          <div class="detail-price">${money(car.price)}</div>
          <div class="detail-sub">${car.location}</div>
        </div>

        <div class="detail-specs">
          <div class="spec-card"><div class="k">Year</div><div class="v">${car.year}</div></div>
          <div class="spec-card"><div class="k">Mileage</div><div class="v">${km(car.mileage)}</div></div>
          <div class="spec-card"><div class="k">Transmission</div><div class="v">${car.transmission}</div></div>
          <div class="spec-card"><div class="k">Fuel</div><div class="v">${car.fuel}</div></div>
          <div class="spec-card"><div class="k">Body type</div><div class="v">${car.bodyType}</div></div>
          <div class="spec-card"><div class="k">Seats</div><div class="v">${car.seats}</div></div>
        </div>

        <div class="detail-cta">
          <button class="btn" id="detailEnquire">Enquire now</button>
          <a class="btn-outline" href="finance.html?id=${encodeURIComponent(car.id)}">Monthly estimate</a>
          <a class="btn-outline" href="compare.html?add=${encodeURIComponent(car.id)}">Compare</a>
        </div>

        <div class="detail-section">
          <h3>Inspection checklist</h3>
          <ul class="checklist">
            <li>Exterior & paint condition checked</li>
            <li>Tyres, brakes & suspension inspected</li>
            <li>Engine & transmission test drive</li>
            <li>Air-conditioning & electronics verified</li>
            <li>Ownership & document verification</li>
          </ul>
        </div>

        <div class="detail-section">
          <h3>Highlights</h3>
          <p>Certified and inspected vehicle. Transparent pricing. Flexible viewing appointment options.</p>
        </div>
      </div>
    </div>
  `;

  const btn = $('#detailEnquire');
  if(btn) btn.addEventListener('click', ()=>openEnquiry(car));
}

// COMPARE page
function renderCompare(){
  const table = $('#compareTable');
  if(!table) return;

  const cars = getCars();
  const params = new URLSearchParams(location.search);
  const add = params.get('add');

  // use localStorage to keep compare list
  const key='bah_compare';
  let list = [];
  try{ list = JSON.parse(localStorage.getItem(key)||'[]'); }catch(e){ list=[]; }

  if(add && !list.includes(add)){
    list.push(add);
    list = list.slice(0,3);
    localStorage.setItem(key, JSON.stringify(list));
    const addedCar = getCarById(add);
    window.showToast && showToast('Added to compare', (addedCar?addedCar.name:'Car') + ' added to compare list.','success');
    // clean url
    params.delete('add');
    history.replaceState({},'',location.pathname + (params.toString()?`?${params}`:''));
  }

  const selected = list.map(getCarById).filter(Boolean);

  if(!selected.length){
    table.innerHTML = `<div class="empty-state reveal in"><h3>No cars selected</h3><p>Go to <a class="link" href="buy.html">Buy</a> and click Compare.</p></div>`;
    return;
  }

  function row(label, fn){
    return `
      <tr>
        <th>${label}</th>
        ${selected.map(c=>`<td>${fn(c)}</td>`).join('')}
      </tr>
    `;
  }

  const head = `
    <table class="compare">
      <thead>
        <tr>
          <th></th>
          ${selected.map(c=>`
            <td>
              <div class="cmp-head">
                <img src="${c.image}" alt="${c.name}">
                <div>
                  <div class="cmp-title">${c.name}</div>
                  <div class="cmp-price">${money(c.price)}</div>
                </div>
                <button class="btn-outline small" data-remove="${c.id}">Remove</button>
              </div>
            </td>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${row('Year', c=>c.year)}
        ${row('Mileage', c=>km(c.mileage))}
        ${row('Body type', c=>c.bodyType)}
        ${row('Transmission', c=>c.transmission)}
        ${row('Fuel', c=>c.fuel)}
        ${row('Seats', c=>c.seats)}
        ${row('Warranty', c=>c.warranty)}
      </tbody>
    </table>
  `;

  table.innerHTML = head;

  $all('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id=btn.getAttribute('data-remove');
      list=list.filter(x=>x!==id);
      localStorage.setItem(key, JSON.stringify(list));
      const removedCar = getCarById(id);
      window.showToast && showToast('Removed', (removedCar?removedCar.name:'Car') + ' removed from compare.','info');
      setTimeout(()=>location.reload(), 250);
    });
  });

  initReveal();
}

// FINANCE page
function renderFinance(){
  const box = $('#financeBox');
  if(!box) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const car = id ? getCarById(id) : null;

  if(!car){
    box.innerHTML = `<div class="empty-state reveal in"><h3>Select a car</h3><p>Go to <a class="link" href="buy.html">Buy</a> and choose “Monthly estimate”.</p></div>`;
    return;
  }

  // Populate
  $('#finCarName').textContent = car.name;
  $('#finCarPrice').textContent = money(car.price);
  const img = $('#finCarImg'); if(img) img.src = car.image;

  const dp = $('#finDown'); // down payment %
  const years = $('#finYears');
  const rate = $('#finRate'); // annual %
  const out = $('#finMonthly');

  function calc(){
    const price = car.price;
    const downPct = parseFloat(dp.value||'10');
    const down = price * (downPct/100);
    const principal = Math.max(0, price - down);
    const y = parseInt(years.value||'5',10);
    const n = y*12;
    const r = (parseFloat(rate.value||'3.5')/100)/12;
    // amortized payment
    let m = 0;
    if(r===0) m = principal/n;
    else m = principal * (r*Math.pow(1+r,n)) / (Math.pow(1+r,n)-1);
    out.textContent = money(Math.round(m));
    $('#finSummary').textContent = `Down payment: ${money(Math.round(down))} • Tenure: ${y} years • Interest: ${rate.value}% p.a.`;
  }

  [dp,years,rate].forEach(el=>el && el.addEventListener('input', calc));
  calc();
}


// RENT page render
function renderRent(){
  const grid = $('#rentGrid');
  if(!grid) return;
  const cars = getCars().filter(c=>c.rentalPerDay);
  grid.innerHTML = cars.map(c=>`
    <article class="vehicle-card reveal">
      <div class="vehicle-img">
        <img src="${c.image}" alt="${c.name}">
        <span class="badge badge-success">From RM ${c.rentalPerDay}/day</span>
      </div>
      <div class="vehicle-body">
        <div class="vehicle-top">
          <h3 class="vehicle-title">${c.name}</h3>
          <div class="vehicle-price">RM ${c.rentalPerDay}/day</div>
        </div>
        <div class="spec-row">
          <span class="spec">${c.year}</span>
          <span class="spec">${c.transmission}</span>
          <span class="spec">${c.bodyType}</span>
        </div>
        <div class="vehicle-actions">
          <a class="btn-outline" href="car.html?id=${encodeURIComponent(c.id)}">View details</a>
          <button class="btn" data-rent-open="${c.id}">Book</button>
        </div>
      </div>
    </article>
  `).join('');
  initReveal();
}

// RENT page keep existing logic (if present)
function initRent(){
  const btns = $all('[data-rent-open]');
  if(!btns.length) return;

  btns.forEach(b=>{
    b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-rent-open');
      const car=getCarById(id);
      if(!car) return;
      $('#rentCarName').textContent = car.name;
      $('#rentRate').textContent = `RM ${car.rentalPerDay}/day`;
      $('#rentCarId').value = car.id;
      openModal('rentModal');
      updateRentTotal();
    });
  });

  function updateRentTotal(){
    const days = parseInt($('#rentDays').value||'1',10);
    const id = $('#rentCarId').value;
    const car = getCarById(id);
    const total = (car && car.rentalPerDay) ? car.rentalPerDay*days : 0;
    $('#rentTotal').textContent = `Total: RM ${total}`;
  }
  const daysInp = $('#rentDays');
  if(daysInp) daysInp.addEventListener('input', updateRentTotal);

  const form = $('#rentForm');
  if(form){
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const id = $('#rentCarId').value;
      const name = $('#rentName').value.trim();
      const phone = $('#rentPhone').value.trim();
      if(!name || !phone){
        window.showToast && showToast('Missing details','Please fill in your name and phone number.','error');
        $('#rentMsg').textContent = 'Please fill in your name and phone number.';
        $('#rentMsg').className = 'form-msg error';
        return;
      }
      window.showToast && showToast('Booking received','Booking request received. We will confirm via phone.','success');
      $('#rentMsg').textContent = 'Booking request received. We will confirm via phone.';
      $('#rentMsg').className = 'form-msg success';
      form.reset();
      closeModal('rentModal');
      // disable button for this car
      const btn = document.querySelector(`[data-rent-open="${id}"]`);
      if(btn){ btn.textContent='Booked'; btn.disabled=true; btn.classList.add('disabled'); }
    });
  }
}

function initGlobalSearch(){
  const form = $('#globalSearchForm');
  const input = $('#globalSearchInput');
  if(!form || !input) return;
  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const q = input.value.trim();
    location.href = `buy.html${q?`?q=${encodeURIComponent(q)}`:''}`;
  });
}

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  setActiveNav();
  bindEnquiryForm();
  initGlobalSearch();
  renderHome();
  renderBuy();
  renderCarDetail();
  renderCompare();
  renderRent();
  renderFinance();
  initRent();
  initReveal();
});
