// ========== UI PLANETS ==========
function signSelect(sel){ return `<select class="pi-sign">${SIGNS.map((s,i)=>`<option value="${i}"${i===sel?' selected':''}>${s}</option>`).join('')}</select>`; }
function typeSelect(sel){ return `<select class="pi-type">${PTYPES.map(t=>`<option value="${t}"${t===sel?' selected':''}>${PTYPE_LBL[t]}</option>`).join('')}</select>`; }
function addRow(data){
  const d=data||{name:'',sign:0,deg:0,min:0,retro:false,type:'point'};
  const tp=d.type||(PTYPE_DEFAULT[d.name]||'point');
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><input class="pi-name" value="${d.name}" onchange="autoType(this)"></td><td>${signSelect(d.sign)}</td><td><input class="pi-num" type="number" min="0" max="29" value="${d.deg}"></td><td><input class="pi-num" type="number" min="0" max="59" value="${d.min}"></td><td>${typeSelect(tp)}</td><td style="text-align:center"><input class="pi-cb" type="checkbox" ${d.retro?'checked':''}></td><td><span class="pi-del" onclick="this.closest('tr').remove()">×</span></td>`;
  document.getElementById('planet-body').appendChild(tr);
}
function autoType(inp){ const name=inp.value.trim(); const tp=PTYPE_DEFAULT[name]; if(tp){ const sel=inp.closest('tr').querySelector('.pi-type'); if(sel) sel.value=tp; } }
function clearAll(){
  document.getElementById('planet-body').innerHTML = '';
  clearGraph();
}
function clearGraph() {
  if (simulation) { simulation.stop(); simulation = null; }
  const svg = d3.select('#graph-svg');
  svg.selectAll('*').remove();
  document.getElementById('graph-status').textContent = 'Press COMPUTE';
  document.getElementById('legend-box').innerHTML = '';
  document.getElementById('metrics-wrap').innerHTML = '<div class="empty-msg">—</div>';
  document.getElementById('node-body').innerHTML = '';
  document.getElementById('edge-count').textContent = '0';
  document.getElementById('edge-list').innerHTML = '';
  document.getElementById('nm-count').textContent = '0';
  document.getElementById('near-miss-list').innerHTML = '';
}
function getPlanets(){
  return [...document.getElementById('planet-body').querySelectorAll('tr')].map(r=>{
    const name=r.querySelector('.pi-name').value.trim(); if(!name)return null;
    const sign=parseInt(r.querySelector('.pi-sign').value)||0;
    const nums=r.querySelectorAll('.pi-num');
    const deg=parseInt(nums[0]?.value||0)||0;
    const min=parseInt(nums[1]?.value||0)||0;
    const retro=r.querySelector('.pi-cb').checked;
    const type=r.querySelector('.pi-type').value;
    return {name,sign,deg,min,retro,type,lon:sdm2lon(sign,deg,min)};
  }).filter(Boolean);
}

// ========== UI UNIFORM ORBS ==========
function buildOrbAspectUI(){
  const container=document.getElementById('orbAspectContainer');
  let html='<table><thead><tr><th>Aspect</th><th>Orb (°)</th></tr></thead><tbody>';
  ASPECT_TYPES.forEach(asp=>{
    const val=ORB_BY_ASPECT[asp]||3;
    html+=`<tr><td>${asp}</td><td><input type="number" step="0.5" min="0" max="15" value="${val}" data-asp="${asp}" class="orb-asp-input" style="width:60px;"></td></tr>`;
  });
  html+='</tbody></table>';
  container.innerHTML=html;
  document.querySelectorAll('.orb-asp-input').forEach(inp=>{
    inp.addEventListener('change',function(){
      const asp=this.dataset.asp;
      ORB_BY_ASPECT[asp]=parseFloat(this.value)||3;
    });
  });
}
function resetOrbAspectDefault(){ ORB_BY_ASPECT=JSON.parse(JSON.stringify(DEFAULT_ORB_BY_ASPECT)); buildOrbAspectUI(); toast('Uniform orbs reset to default','info'); }
function resetOrbAspectClassic(){ ORB_BY_ASPECT=JSON.parse(JSON.stringify(CLASSIC_ORB_BY_ASPECT)); buildOrbAspectUI(); toast('Uniform orbs reset to classic LOB65 values','info'); }

// ========== TRANSIT FUNCTIONS ==========
function addTransitRow(data){
  const d=data||{name:'',sign:0,deg:0,min:0,retro:false,type:'outer'};
  const tp=d.type||'outer';
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td><input class="pi-name" type="text" value="${d.name}" placeholder="T-Pluto" style="width:52px"></td>
    <td>${signSelect(d.sign)}</td>
    <td><input class="pi-num" type="number" min="0" max="29" value="${d.deg}"></td>
    <td><input class="pi-num" type="number" min="0" max="59" value="${d.min}"></td>
    <td>${typeSelect(tp)}</td>
    <td style="text-align:center"><input class="pi-cb" type="checkbox" ${d.retro?'checked':''}></td>
    <td><span class="pi-del" onclick="this.closest('tr').remove();updateTransitCount();computeGraph()">×</span></td>
  `;
  document.getElementById('tr-planet-body').appendChild(tr);
  updateTransitCount();
}
function clearTransits(){ document.getElementById('tr-planet-body').innerHTML=''; updateTransitCount(); computeGraph(); }
function loadSlowTransits(){
  document.getElementById('tr-planet-body').innerHTML='';
  SLOW_TRANSIT_TEMPLATE.forEach(d=>addTransitRow(d));
  const tb=document.getElementById('tr-body');
  if(tb.style.display==='none') togglePanel('tr-body','trtog');
  toast('Slow transit template loaded — enter coordinates.','info');
}
function updateTransitCount(){
  const rows=document.getElementById('tr-planet-body').querySelectorAll('tr');
  const valid=[...rows].filter(r=>r.querySelector('.pi-name').value.trim()).length;
  document.getElementById('tr-count').textContent=valid;
}
function getTransits(){
  return [...document.getElementById('tr-planet-body').querySelectorAll('tr')].map(r=>{
    const name=r.querySelector('.pi-name').value.trim();
    if(!name) return null;
    const sign=parseInt(r.querySelector('.pi-sign').value)||0;
    const nums=r.querySelectorAll('.pi-num');
    const deg=parseInt(nums[0]?.value||0)||0, min=parseInt(nums[1]?.value||0)||0;
    const retro=r.querySelector('.pi-cb').checked;
    const type=r.querySelector('.pi-type').value||'outer';
    return {name,sign,deg,min,retro,type,lon:sdm2lon(sign,deg,min),isTransit:true};
  }).filter(Boolean);
}

// ========== THEMES ==========
function updateHdrTheme(){ const el=document.getElementById('hdr-theme'); el.textContent=activeTheme?`◆ ${activeTheme}`:'— no theme —'; }
function serialize(){
  return {
    planets: getPlanets().map(p=>({name:p.name,sign:p.sign,deg:p.deg,min:p.min,retro:p.retro,type:p.type})),
    orbByAspect: JSON.parse(JSON.stringify(ORB_BY_ASPECT))
  };
}
function applyTheme(data){
  clearAll();
  if(data.planets) data.planets.forEach(p=>addRow(p));
  if(data.orbByAspect){
    ORB_BY_ASPECT = data.orbByAspect;
  } else if(data.orbMatrix){
    const firstCat = Object.values(data.orbMatrix)[0];
    if(firstCat) ORB_BY_ASPECT = { ...firstCat };
    toast('Old orbMatrix format converted to uniform orbs.', 'info');
  }
  buildOrbAspectUI();
}
function saveToSession(){
  const name=document.getElementById('theme-name-in').value.trim();
  if(!name) return;
  themes[name]=serialize();
  activeTheme=name;
  updateHdrTheme();
  renderThemeList();
  saveStorage();
  toast(`"${name}" saved`);
}
function loadFromSession(name){
  if(!themes[name]) return;
  applyTheme(themes[name]);
  activeTheme=name;
  updateHdrTheme();
  renderThemeList();
  saveStorage();
  toast(`"${name}" loaded`);
}
function deleteFromSession(name){
  delete themes[name];
  if(activeTheme===name) activeTheme=null;
  updateHdrTheme();
  renderThemeList();
  saveStorage();
}
function overwriteSession(name){
  themes[name]=serialize();
  renderThemeList();
  saveStorage();
  toast(`"${name}" updated`);
}
function renderThemeList(){
  const list=document.getElementById('theme-list'), keys=Object.keys(themes);
  if(!keys.length){list.innerHTML='<div id="theme-empty">No themes</div>';return;}
  list.innerHTML=keys.map(n=>`<div class="theme-row${activeTheme===n?' active':''}"><div class="theme-dot"></div><span class="theme-name" onclick="loadFromSession('${n}')">${n}</span><button class="t-btn" onclick="loadFromSession('${n}')">↺</button><button class="t-btn" onclick="overwriteSession('${n}')">⬆</button><button class="t-btn del" onclick="deleteFromSession('${n}')">×</button></div>`).join('');
}
function exportJSON(){
  const name=activeTheme||'graph';
  const blob=new Blob([JSON.stringify(serialize(),null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=name.replace(/\s/g,'_')+'.json';
  a.click();
}
function importJSON(ev){
  const f=ev.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      applyTheme(data);
      const themeName=data.name||f.name.replace(/\.json$/i,'');
      activeTheme=themeName;
      themes[themeName]=data;
      updateHdrTheme();
      renderThemeList();
      saveStorage();
      toast(`Theme "${themeName}" imported.`,'ok');
    }catch(err){ toast('JSON error: '+err.message,'err'); }
  };
  r.readAsText(f); ev.target.value='';
}

// ========== TRANSIT SETS ==========
function saveTransitSet(){
  const ni=document.getElementById('ts-name-in'), name=ni.value.trim();
  if(!name){toast('Enter a name for the set.','err');return;}
  transitSets[name]=getTransits().map(t=>({name:t.name,sign:t.sign,deg:t.deg,min:t.min,retro:t.retro,type:t.type}));
  ni.value=''; renderTransitSets(); saveStorage(); toast(`Set "${name}" saved.`,'ok');
}
function loadTransitSet(name){
  const rows=transitSets[name]; if(!rows) return;
  document.getElementById('tr-planet-body').innerHTML='';
  rows.forEach(d=>addTransitRow(d));
  updateTransitCount(); computeGraph();
  const tb=document.getElementById('tr-body');
  if(tb.style.display==='none') togglePanel('tr-body','trtog');
  toast(`Set "${name}" loaded.`,'ok');
}
function deleteTransitSet(name){
  delete transitSets[name]; renderTransitSets(); saveStorage(); toast(`Set "${name}" deleted.`,'info');
}
function renderTransitSets(){
  const list=document.getElementById('transit-sets-list');
  if(!list) return;
  const keys=Object.keys(transitSets);
  if(!keys.length){ list.innerHTML='<div id="ts-empty" style="font-size:11px;color:var(--text3)">No saved sets.</div>'; return; }
  list.innerHTML = keys.map(name=>`
    <div style="display:flex;align-items:center;gap:3px;padding:3px 4px;border:1px solid #442266;background:var(--bg2)">
      <span style="flex:1;font-size:11px;color:var(--text2);cursor:pointer;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" onclick="loadTransitSet('${name}')">${name}</span>
      <button class="t-btn" onclick="loadTransitSet('${name}')" style="color:#884499">↺</button>
      <button class="t-btn del" onclick="deleteTransitSet('${name}')">×</button>
    </div>
  `).join('');
}
function exportTransitSets(){
  const data={type:'transit_sets',sets:transitSets};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='transit_sets.json'; a.click();
  toast('Transit sets exported.','ok');
}
function importTransitSets(event){
  const f=event.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(data.type==='transit_sets' && data.sets){
        Object.assign(transitSets, data.sets);
        renderTransitSets();
        saveStorage();
        toast('Transit sets imported.','ok');
      } else throw new Error('Invalid format');
    }catch(err){toast('Error: '+err.message,'err');}
  };
  r.readAsText(f); event.target.value='';
}

// ========== PERSISTENCE ==========
function saveStorage() {
  try {
    localStorage.setItem('LOB65_themes', JSON.stringify(themes));
    localStorage.setItem('LOB65_transitSets', JSON.stringify(transitSets));
    localStorage.setItem('LOB65_activeTheme', activeTheme || '');
  } catch(e) {
    console.error('LocalStorage save error:', e);
  }
}
function loadStorage() {
  try {
    const t = localStorage.getItem('LOB65_themes');
    if (t) themes = JSON.parse(t);
    const ts = localStorage.getItem('LOB65_transitSets');
    if (ts) transitSets = JSON.parse(ts);
    const at = localStorage.getItem('LOB65_activeTheme');
    if (at) activeTheme = at;
  } catch(e) {
    console.error('LocalStorage load error:', e);
  }
}

// ========== UTIL UI ==========
function togglePanel(id,togId){
  const el=document.getElementById(id),tog=document.getElementById(togId);
  if(!el)return;
  const isHide=el.style.display==='none';
  el.style.display=isHide?'':'none';
  if(tog) tog.textContent=isHide?'▾':'▸';
}
function toast(msg,type='ok'){
  const el=document.getElementById('toast');
  el.textContent=msg; el.className=type; el.style.display='block';
  setTimeout(()=>el.style.display='none',2000);
}