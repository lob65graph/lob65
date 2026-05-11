// ========== STATO GLOBALE (condiviso con gli altri moduli) ==========
let useWeighted = false;
let themes = {};
let activeTheme = null;
let transitSets = {};
let simulation = null;

// ========== PRESET ==========
function loadDefault(){
  clearAll();
  DEFAULT_LOB65.forEach(d=>addRow(d));
  activeTheme='LOB65 preset';
  updateHdrTheme();
  computeGraph();
}
function loadTemplate(){
  clearAll();
  DEFAULT_LOB65.forEach(d=>addRow({...d, sign:0, deg:0, min:0, retro:false}));
  activeTheme=null;
  updateHdrTheme();
  computeGraph();
}

// ========== COMPUTE ==========
function computeGraph(){
  if (typeof d3 === 'undefined') {
    alert('D3.js library not loaded. Please check your internet connection and reload the page.');
    return;
  }
  const natals=getPlanets();
  if(natals.length<2){alert('Insert at least 2 natal planets');return;}
  const transits=getTransits();
  const curve=document.getElementById('weightCurveSelect').value;
  const retroFactor=parseFloat(document.getElementById('retroFactor').value)||1.0;
  const kExp=parseFloat(document.getElementById('kExpInput')?.value)||3;
  const thrPoint=parseFloat(document.getElementById('thrPointInput')?.value)||0.5;
  const overlayOnly=document.getElementById('overlay-only')?.checked;
  const useLog=document.getElementById('useLogCheck')?.checked||false;
  const filterWeight=document.getElementById('filterByWeightCheck')?.checked||false;
  const minWeight=parseFloat(document.getElementById('visualThresholdInput')?.value)||0.10;
  const {edges:edgesN,nearMiss:nmN}=detectEdges(natals,curve,retroFactor,kExp,thrPoint);
  const natalAnalysis=analyze(natals,edgesN,false,useLog,natals.length);
  if(transits.length>0){
    const {edges,nearMiss,all}=detectAllEdges(natals,transits,curve,retroFactor,kExp,thrPoint);
    const fullAnalysis=analyze(all,edges,false,useLog,natals.length);
    const activatedNatalIdx=new Set();
    edges.filter(e=>e.type==='nt').forEach(e=>{
      if(e.s<natals.length) activatedNatalIdx.add(e.s);
      if(e.t<natals.length) activatedNatalIdx.add(e.t);
    });
    drawGraph(all,edges,fullAnalysis,overlayOnly?activatedNatalIdx:null,filterWeight,minWeight);
    updateUI(all,edges,fullAnalysis,nearMiss,natalAnalysis,edgesN);
  } else {
    drawGraph(natals,edgesN,natalAnalysis,null,filterWeight,minWeight);
    updateUI(natals,edgesN,natalAnalysis,nmN,null,null);
  }
  updateTransitCount();
}

// ========== TOGGLE WEIGHTED MODE ==========
function toggleWeighted(){
  useWeighted = !useWeighted;
  const btn = document.getElementById('weight-toggle');
  if (useWeighted) {
    btn.textContent = '⚖ Switch to Unweighted';
    btn.style.color = 'var(--purple)';
    btn.style.borderColor = 'var(--purple)';
  } else {
    btn.textContent = '⚖ Switch to Weighted';
    btn.style.color = 'var(--text3)';
    btn.style.borderColor = '#333';
  }
  if(getPlanets().length>=2) computeGraph();
}

// ========== EXPORT REPORT ==========
function exportReport() {
  const natals = getPlanets();
  if (natals.length < 2) { alert('Insert at least 2 natal planets before exporting.'); return; }
  const transits = getTransits();
  const curve = document.getElementById('weightCurveSelect').value;
  const retroFactor = parseFloat(document.getElementById('retroFactor').value) || 1.0;
  const kExp = parseFloat(document.getElementById('kExpInput')?.value) || 3;
  const thrPoint = parseFloat(document.getElementById('thrPointInput')?.value) || 0.5;
  const useLog = document.getElementById('useLogCheck')?.checked || false;
  const excludeMinor = document.getElementById('excludeMinorAspectCheck')?.checked || false;
  let planets, edges, nearMiss, analysis;
  if (transits.length > 0) {
    const all = natals.map(p=>({...p,isTransit:false})).concat(transits);
    const res = detectAllEdges(natals, transits, curve, retroFactor, kExp, thrPoint);
    edges = res.edges; nearMiss = res.nearMiss; planets = res.all;
    analysis = analyze(planets, edges, false, useLog, natals.length);
  } else {
    planets = natals.map(p=>({...p,isTransit:false}));
    const res = detectEdges(planets, curve, retroFactor, kExp, thrPoint);
    edges = res.edges; nearMiss = res.nearMiss;
    analysis = analyze(planets, edges, false, useLog, planets.length);
  }
  const displayedBetweenness = useWeighted ? analysis.weightedBetweenness : analysis.unweightedBetweenness;
  const L1_topol_name = planets[analysis.unweightedBetweenness.indexOf(Math.max(...analysis.unweightedBetweenness))]?.name || '—';
  const L1_model_name = planets[analysis.weightedBetweenness.indexOf(Math.max(...analysis.weightedBetweenness))]?.name || '—';
  const apList = planets.filter((_, i) => analysis.articulationPoints[i]).map(p => p.name);
  const isolatedList = planets.filter((_, i) => analysis.degrees[i] === 0).map(p => p.name);
  let report = `NATAL THEME GRAPH REPORT (LAYERED MODEL)\n==========================================\n`;
  report += `Date: ${new Date().toLocaleString()}\n`;
  if (transits.length) report += `Transits included: ${transits.map(t=>t.name).join(', ')}\n`;
  report += `\nCONFIGURATION:\n`;
  report += `- Weight curve: ${curve}\n- k-exp: ${kExp}  thr-point: ${thrPoint}\n- Retrograde factor: ${retroFactor}\n- Minor aspects excluded: ${excludeMinor ? 'YES' : 'NO'}\n- Nodes: ${planets.map(p=>p.name).join(', ')}\n\n`;
  report += `GENERAL METRICS (topological):\n`;
  report += `- Nodes: ${planets.length}\n- Geometric edges: ${edges.length}\n- Density: ${analysis.density.toFixed(4)} (${(analysis.density*100).toFixed(1)}%)\n- Density main comp: ${analysis.mainComponentDensity.toFixed(4)}\n- Max k-core: ${analysis.maxKCore}\n- Cut vertices: ${apList.length ? apList.join(', ') : 'none'}\n- Connected: ${analysis.componentCount===1?'YES':'NO ('+analysis.componentCount+' components)'}\n- |V| main component: ${analysis.mainComponentSize}\n- λ₂ Fiedler topol.: ${analysis.fiedlerUnweighted.toFixed(4)}\n- λ₂ Fiedler model: ${analysis.fiedlerWeighted.toFixed(4)}\n- Min degree: ${analysis.minDegree}  Max degree: ${analysis.maxDegree}\n- Isolated: ${isolatedList.length ? isolatedList.join(', ') : 'none'}\n- L1 (BC max topol.): ${L1_topol_name}\n- L1 (BC max model): ${L1_model_name}\n\n`;
  report += `BETWEENNESS CENTRALITY (topological):\n`;
  const sortedTopol = [...Array(planets.length).keys()].sort((a,b)=>analysis.unweightedBetweenness[b]-analysis.unweightedBetweenness[a]);
  sortedTopol.forEach(idx => report += `  ${planets[idx].name}: ${analysis.unweightedBetweenness[idx].toFixed(4)}\n`);
  report += `\nBETWEENNESS CENTRALITY (weighted model):\n`;
  const sortedModel = [...Array(planets.length).keys()].sort((a,b)=>analysis.weightedBetweenness[b]-analysis.weightedBetweenness[a]);
  sortedModel.forEach(idx => report += `  ${planets[idx].name}: ${analysis.weightedBetweenness[idx].toFixed(4)}\n`);
  report += `\nNODE DETAILS (sorted by weighted BC):\n`;
  sortedModel.forEach(idx => {
    const p = planets[idx];
    report += `${p.name}: degree=${analysis.degrees[idx]}, core=${analysis.kCores[idx]}, BC_topol=${analysis.unweightedBetweenness[idx].toFixed(4)}, BC_model=${analysis.weightedBetweenness[idx].toFixed(4)}\n`;
  });
  report += `\nGEOMETRIC EDGES LIST:\n`;
  edges.sort((a,b)=>a.orb-b.orb).forEach(e => {
    report += `${e.si} - ${e.ti} (${e.asp.name}, orb ${fmtOrb(e.orb)}, max ${e.maxOrb}°) → model weight ${e.w.toFixed(4)} [${e.type||'nn'}]\n`;
  });
  if (nearMiss && nearMiss.length) {
    report += `\nNEAR MISS (orb * 1.5):\n`;
    nearMiss.forEach(nm => report += `${nm.si} – ${nm.ti}  ${nm.aspName}  +${fmtOrb(nm.over)}\n`);
  }
  report += `==========================================\nEnd of report.\n`;
  const blob = new Blob([report], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `graph_report_${activeTheme||'theme'}_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('TXT Report exported', 'ok');
}

// ========== INIT ==========
window.onload = () => {
  loadStorage();
  buildOrbAspectUI();
  renderThemeList();
  renderTransitSets();
  if (activeTheme && themes[activeTheme]) {
    applyTheme(themes[activeTheme]);
    updateHdrTheme();
    computeGraph();
  } else {
    clearAll();
    activeTheme = null;
    updateHdrTheme();
  }
};