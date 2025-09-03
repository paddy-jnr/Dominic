/* Dominic Futuristic Portfolio - v3 */
/* Utilities */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const lerp = (a,b,t) => a + (b-a)*t;

/* Global state */
const state = {
  hologram: false,
  sfx: true,
  hue: 190,
  konami: [],
};

/* SFX (WebAudio) */
let audioCtx;
function playBeep(freq=560, time=0.08){
  if(!state.sfx) return;
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.value = 0.03; o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + time);
}
window.playPing = () => playBeep(980, .07);

/* Preloader */
window.addEventListener('load', () => {
  const pre = $('#preloader'); if(!pre) return;
  setTimeout(() => pre.style.opacity = 0, 900);
  setTimeout(() => pre.remove(), 1300);
});

/* Scroll progress */
const prog = $('.scroll-progress');
function updateProgress(){
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight);
  prog.style.width = (scrolled*100) + '%';
}
document.addEventListener('scroll', updateProgress, {passive:true}); updateProgress();

/* Navbar + Mobile */
const burger = $('.burger');
const drawer = $('.mobile-drawer');
if(burger){
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('active');
    drawer.classList.toggle('open', open); burger.setAttribute('aria-expanded', open);
    playBeep(open?700:420, .05);
  });
  $$('.mobile-drawer a').forEach(a => a.addEventListener('click', () => {
    drawer.classList.remove('open'); burger.classList.remove('active'); burger.setAttribute('aria-expanded', false);
  }));
}

/* Hologram grid toggle */
const holoBtn = $('#toggle-hologram');
const grid = $('.hologram-grid');
function setHologram(on){
  state.hologram = on; grid.classList.toggle('on', on);
  holoBtn?.setAttribute('aria-pressed', on);
  playBeep(on?800:400, .06);
}
holoBtn?.addEventListener('click', () => setHologram(!state.hologram));

/* SFX toggle */
const sfxBtn = $('#toggle-sfx');
sfxBtn?.addEventListener('click', () => {
  state.sfx = !state.sfx; sfxBtn.setAttribute('aria-pressed', state.sfx);
  playBeep(state.sfx?900:300, .05);
});

/* Hue slider */
const hue = $('#hue');
if(hue){
  hue.addEventListener('input', e => {
    state.hue = +e.target.value;
    document.documentElement.style.setProperty('--accent-hue', state.hue);
  });
}

/* Command palette */
const cmdk = $('#cmdk');
const cmdkInput = $('#cmdk-input');
const cmdkList = $('#cmdk-list');
const paletteItems = [
  {label:'Go: Home', action:() => $('#home').scrollIntoView({behavior:'smooth'})},
  {label:'Go: Projects', action:() => $('#projects').scrollIntoView({behavior:'smooth'})},
  {label:'Go: Playground', action:() => $('#playground').scrollIntoView({behavior:'smooth'})},
  {label:'Go: About', action:() => $('#about').scrollIntoView({behavior:'smooth'})},
  {label:'Go: Contact', action:() => $('#contact').scrollIntoView({behavior:'smooth'})},
  {label:'Toggle: Hologram Grid', action:() => setHologram(!state.hologram)},
  {label:'Toggle: Sounds', action:() => sfxBtn.click()},
  {label:'Open: Terminal', action:() => $('#open-terminal').click()},
  {label:'Easter Egg: Confetti', action:() => confetti()},
];
function openCmdK(){
  cmdk.classList.add('open');
  cmdk.setAttribute('aria-hidden','false');
  cmdkInput.value = '';
  renderCmdK();
  cmdkInput.focus();
}
function closeCmdK(){
  cmdk.classList.remove('open'); cmdk.setAttribute('aria-hidden','true');
}
function renderCmdK(){
  const q = cmdkInput.value.trim().toLowerCase();
  const results = paletteItems.filter(i => i.label.toLowerCase().includes(q));
  cmdkList.innerHTML = results.map((r, idx) => `<li data-idx="${idx}" class="${idx===0?'active':''}"><span>${r.label}</span><kbd>↩</kbd></li>`).join('');
}
$('#open-cmdk')?.addEventListener('click', openCmdK);
cmdkInput?.addEventListener('input', renderCmdK);
cmdk?.addEventListener('click', e => { if(e.target===cmdk) closeCmdK(); });
document.addEventListener('keydown', e => {
  if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openCmdK(); }
  if(e.key==='Escape') closeCmdK();
  // Konami: ↑↑↓↓←→←→BA
  const keyMap = {ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R', a:'A', b:'B'};
  state.konami.push(keyMap[e.key] || '');
  const seq = state.konami.join('').replace(/[^UDLRA B]/g,'');
  if(seq.endsWith('UUDDLRLRBA')){ setHologram(true); confetti(); state.konami.length=0; }
});
cmdkList?.addEventListener('mousemove', e => {
  const li = e.target.closest('li'); if(!li) return;
  $$('#cmdk-list li').forEach(s=> s.classList.remove('active'));
  li.classList.add('active');
});
cmdkList?.addEventListener('click', e => {
  const li = e.target.closest('li'); if(!li) return;
  const idx = +li.dataset.idx;
  const q = cmdkInput.value.trim().toLowerCase();
  const results = paletteItems.filter(i => i.label.toLowerCase().includes(q));
  results[idx]?.action();
  closeCmdK();
});
cmdkInput?.addEventListener('keydown', e => {
  if(e.key==='Enter'){
    const active = $('#cmdk-list li.active');
    if(active){ active.click(); }
  }
  if(['ArrowDown','ArrowUp'].includes(e.key)){
    e.preventDefault();
    const items = $$('#cmdk-list li'); if(!items.length) return;
    let i = items.findIndex(el => el.classList.contains('active'));
    i = i + (e.key==='ArrowDown'?1:-1);
    if(i<0) i=items.length-1; if(i>=items.length) i=0;
    items.forEach(el=>el.classList.remove('active')); items[i].classList.add('active');
  }
});

/* Terminal overlay */
const term = $('#terminal');
$('#open-terminal')?.addEventListener('click', () => {
  term.style.display='block';
  $('#term-body').textContent = '';
  typeLines([
    'boot> Initializing neon systems...',
    'boot> Loading micro-interactions [OK]',
    'boot> Connecting to SellIt/TradeNest modules [OK]',
    'dominic@playground:~$ whoami',
    '→ Creative Web Developer — building futuristic marketplaces.',
    'dominic@playground:~$ help',
    '→ Use ⌘/Ctrl+K for the command palette, drag the orb, try the magnetic button, and toggle the hologram grid.',
  ], 24);
});
$('#term-close')?.addEventListener('click', () => term.style.display='none');
function typeLines(lines, speed=20){
  const el = $('#term-body'); let i = 0;
  function next(){
    if(i>=lines.length) return;
    typeText(el, lines[i]+'\n', speed, () => { i++; next(); });
  } next();
}
function typeText(el, text, speed, done){
  let i=0; const t = setInterval(()=>{
    el.textContent += text[i++]; el.scrollTop = el.scrollHeight;
    if(i>=text.length){ clearInterval(t); done&&done(); }
  }, speed);
}

/* Reveal on scroll */
const io = new IntersectionObserver(entries=>{
  for(const e of entries){
    if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); }
  }
},{threshold:.2});
$$('.reveal, [data-section]').forEach(el => io.observe(el));

/* Cards tilt / parallax */
$$('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', (e)=>{
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const rotX = lerp(8, -8, y);
    const rotY = lerp(-8, 8, x);
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });
  card.addEventListener('mouseleave', ()=> card.style.transform='');
});

/* Modals */
$$('.open-modal').forEach(btn => btn.addEventListener('click', ()=>{
  const target = btn.dataset.target; const modal = $(target);
  modal.classList.add('open'); playBeep(880,.06);
}));
$$('.modal').forEach(m => {
  m.addEventListener('click', e => { if(e.target.classList.contains('modal')) m.classList.remove('open'); });
  m.querySelector('.modal-close')?.addEventListener('click', ()=> m.classList.remove('open'));
});

/* Text morph */
const morphTarget = $('#morph');
if(morphTarget){
  const phrases = [
    'Imagination → Code',
    'Figma → Pixels',
    'Concept → Interaction',
    'Idea → Marketplace',
    'Spark → Product'
  ];
  let idx=0;
  setInterval(()=>{
    idx=(idx+1)%phrases.length;
    scrambleTo(morphTarget, phrases[idx]);
  }, 2200);
}
function scrambleTo(el, text){
  const chars = '!<>-_\\/[]{}—=+*^?#________';
  const from = el.textContent;
  const length = Math.max(from.length, text.length);
  let frame=0; const queue=[];
  for(let i=0;i<length;i++){
    const fromChar = from[i] || '';
    const toChar = text[i] || '';
    const start = Math.floor(Math.random()*20);
    const end = start + Math.floor(Math.random()*20);
    queue.push({from:fromChar, to:toChar, start, end, char:''});
  }
  cancelAnimationFrame(el._raf);
  function update(){
    let out=''; let complete=0;
    for(const q of queue){
      if(frame >= q.end){ complete++; out+=q.to; }
      else if(frame >= q.start){
        if(!q.char || Math.random()<0.28){ q.char = chars[Math.floor(Math.random()*chars.length)]; }
        out+=`<span class="dud">${q.char}</span>`;
      } else out+=q.from;
    }
    el.innerHTML = out;
    if(complete===queue.length) return;
    el._raf = requestAnimationFrame(update); frame++;
  }
  update();
}

/* Ripple */
$$('[data-ripple]').forEach(btn => {
  btn.addEventListener('click', e => {
    const c = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    c.style.width = c.style.height = d+'px';
    c.style.left = (e.clientX - rect.left - d/2)+'px';
    c.style.top = (e.clientY - rect.top - d/2)+'px';
    c.className = 'ripple';
    btn.appendChild(c);
    setTimeout(()=> c.remove(), 600);
  });
});

/* Magnetic buttons */
$$('[data-magnet], .magnetic').forEach(el => {
  const strength = el.classList.contains('magnetic') ? 24 : 10;
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width/2);
    const y = e.clientY - (r.top + r.height/2);
    el.style.transform = `translate(${x/strength}px, ${y/strength}px)`;
  });
  el.addEventListener('mouseleave', ()=> el.style.transform='');
});

/* Draggable orb */
const orb = $('#orb');
if(orb){
  let dragging=false, ox=0, oy=0;
  orb.addEventListener('pointerdown', e=>{
    dragging=true; orb.setPointerCapture(e.pointerId);
    ox = e.clientX - orb.offsetLeft; oy = e.clientY - orb.offsetTop; orb.style.cursor='grabbing';
  });
  window.addEventListener('pointermove', e=>{
    if(!dragging) return;
    orb.style.position='absolute';
    orb.style.left = (e.clientX - ox)+'px';
    orb.style.top = (e.clientY - oy)+'px';
  });
  window.addEventListener('pointerup', ()=>{ dragging=false; orb.style.cursor='grab'; });
}

/* Counters */
const counters = $$('.num');
const io2 = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const el = e.target; const to = +el.dataset.count; let n=0;
      const step = Math.ceil(to/60);
      const t = setInterval(()=>{
        n += step; if(n>=to){ n=to; clearInterval(t); }
        el.textContent = n;
      }, 20);
      io2.unobserve(el);
    }
  })
},{threshold:.7});
counters.forEach(el=> io2.observe(el));

/* Particle Cursor */
const canvas = $('#cursor-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
window.addEventListener('resize', resize); resize();
window.addEventListener('mousemove', e => {
  for(let i=0;i<4;i++){
    particles.push({x:e.clientX, y:e.clientY, vx:(Math.random()-0.5)*1.6, vy:(Math.random()-0.5)*1.6, life: Math.random()*60 + 30});
  }
});
function drawParticles(){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'lighter';
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life -= 1;
    const alpha = clamp(p.life/60, 0, 1);
    const hue = getComputedStyle(document.documentElement).getPropertyValue('--accent-hue') || 190;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
    ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
    ctx.shadowBlur = 12; ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${alpha})`;
    ctx.fill();
    if(p.life <= 0) particles.splice(i,1);
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

/* Three.js Neon Shape in Hero */
function initThree(){
  const container = document.getElementById('threejs-canvas');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 0.1, 100);
  camera.position.z = 6;
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const geometry = new THREE.TorusKnotGeometry(1.5, 0.45, 220, 40);
  const material = new THREE.MeshBasicMaterial({ color: 0x00f7ff, wireframe: true, transparent: true, opacity: 0.7 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function onResize(){
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w,h); camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  function animate(){
    const hue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--accent-hue')) || 190;
    const col = new THREE.Color(`hsl(${hue}, 100%, 60%)`);
    material.color = col;
    mesh.rotation.x += 0.003; mesh.rotation.y += 0.004;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
initThree();

/* Hero video only in view */
const heroVideo = document.getElementById('heroVideo');
if(heroVideo){
  const ivo = new IntersectionObserver(([e]) => {
    if(e.isIntersecting){ heroVideo.play().catch(()=>{}); }
    else { heroVideo.pause(); }
  }, {threshold:.2});
  ivo.observe(heroVideo);
}

/* Ripple CSS helper */
const style = document.createElement('style');
style.textContent = `.ripple{position:absolute; border-radius:50%; transform:scale(0); animation:ripple .6s ease-out; background:rgba(255,255,255,.5); opacity:.6}
@keyframes ripple{to{transform:scale(2.5); opacity:0}} .dud{opacity:.4}`;
document.head.appendChild(style);

/* Keyboard quick toggles */
document.addEventListener('keydown', e => {
  if(e.key.toLowerCase()==='h') setHologram(!state.hologram);
  if(e.key.toLowerCase()==='m'){ state.sfx=!state.sfx; sfxBtn.setAttribute('aria-pressed', state.sfx); }
});

/* Confetti (tiny canvas particles) */
function confetti(){
  const c = document.createElement('canvas'); c.width=innerWidth; c.height=innerHeight; c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9994'; document.body.appendChild(c);
  const cx = c.getContext('2d'); const pieces = new Array(180).fill(0).map(()=>({x:Math.random()*c.width, y:-20, vy: Math.random()*2+1, size: Math.random()*6+2, hue: Math.random()*360}));
  function tick(){
    cx.clearRect(0,0,c.width,c.height);
    pieces.forEach(p=>{ p.y+=p.vy; cx.fillStyle=`hsla(${p.hue},90%,60%,.9)`; cx.fillRect(p.x, p.y, p.size, p.size*0.6); });
    if(pieces.some(p=>p.y < c.height)) requestAnimationFrame(tick); else c.remove();
  } tick(); playBeep(1000,.05);
}

/* Year */
$('#year').textContent = new Date().getFullYear();

/* Accessibility: reduced motion */
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  // Turn down particle count
  window.removeEventListener('mousemove', ()=>{});
}

// Skills modal
    const skills={
      html:{title:"HTML5",desc:"Markup language for structuring content. Experienced in semantic HTML, forms, SEO-friendly tags."},
      css:{title:"CSS3",desc:"Styling with animations, responsive layouts, Flexbox, Grid, and modern design techniques."},
      js:{title:"JavaScript",desc:"Dynamic client-side scripting. Comfortable with ES6+, DOM manipulation, APIs, and frameworks."},
      php:{title:"PHP",desc:"Server-side scripting. Experience with MySQL integration, authentication, and full-stack solutions."}
    };
    const modal=document.getElementById('skillModal');
    const modalTitle=document.getElementById('skillTitle');
    const modalDesc=document.getElementById('skillDescription');
    const modalClose=document.querySelector('.modal-close');

    document.querySelectorAll('.planet').forEach(planet=>{
      planet.addEventListener('click',()=>{
        const key=planet.dataset.skill;
        modalTitle.textContent=skills[key].title;
        modalDesc.textContent=skills[key].desc;
        modal.classList.add('show');
      });
    });
    modalClose.addEventListener('click',()=>modal.classList.remove('show'));
    modal.addEventListener('click',e=>{ if(e.target===modal) modal.classList.remove('show'); });
