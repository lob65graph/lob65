// ========== D3 VISUALIZATION ==========
const KC_COLOR = ['#444','#4488FF','#00CCFF','#00FF88','#FFD700','#FF6600','#FF00FF'];

function filterEdgesByAspect(edges, planets) {
  // RIMOSSO il blocco che eliminava tutti gli archi nn in presenza di transiti.
  let filtered = edges;
  const showConj = document.getElementById('filterConj')?.checked ?? true;
  const showHarm = document.getElementById('filterHarm')?.checked ?? true;
  const showDyn = document.getElementById('filterDyn')?.checked ?? true;
  if (showConj && showHarm && showDyn) return filtered;
  const conjAsp = ["Conjunction"];
  const harmAsp = ["Sextile","Trine","Semi-Sextile","Quintile","Bi-Quintile"];
  const dynAsp = ["Opposition","Square","Octile","Tri-octile","Quincunx"];
  return filtered.filter(e => {
    const aspName = e.asp.name;
    if (conjAsp.includes(aspName)) return showConj;
    if (harmAsp.includes(aspName)) return showHarm;
    if (dynAsp.includes(aspName)) return showDyn;
    return false;
  });
}

function drawGraph(planets, edges, analysis, activatedIdx = null, filterWeight = false, minWeight = 0) {
  if (simulation) { simulation.stop(); simulation = null; }
  let visibleEdges = filterEdgesByAspect(edges, planets);
  
  // Overlay only: se la checkbox è attiva, mostra solo archi che coinvolgono transiti (nt e tt)
  const overlayOnly = document.getElementById('overlay-only')?.checked || false;
  if (overlayOnly) {
    visibleEdges = visibleEdges.filter(e => e.type !== 'nn');
  }
  if (filterWeight) visibleEdges = visibleEdges.filter(e => e.w >= minWeight);
  
  const svg = d3.select('#graph-svg');
  const W = svg.node().clientWidth || 800;
  const H = svg.node().clientHeight || 600;
  svg.on('.zoom', null);
  svg.selectAll('*').remove();
  svg.attr('width', W).attr('height', H);
  const displayedBetweenness = useWeighted ? analysis.weightedBetweenness : analysis.unweightedBetweenness;
  let maxBetweenness = Math.max(...displayedBetweenness, 1e-9);
  if (maxBetweenness < 1e-9) maxBetweenness = 1;
  const natalCount = analysis.natalCount || planets.length;
  const nodes = planets.map((p, i) => ({
    id: i, name: p.name, retro: p.retro, lon: p.lon, type: p.type,
    k: analysis.kCores[i], betweenness: displayedBetweenness[i], deg: analysis.degrees[i], ap: analysis.articulationPoints[i],
    isTransit: p.isTransit || i >= natalCount
  }));
  const links = visibleEdges.map(e => ({
    source: e.s, target: e.t, si: e.si, ti: e.ti, asp: e.asp, orb: e.orb, w: e.w, type: e.type || 'nn'
  }));
  const r = d => 8 + (d.betweenness / maxBetweenness) * 15;
  const g = svg.append('g');
  svg.call(d3.zoom().scaleExtent([0.1, 8]).on('zoom', ev => g.attr('transform', ev.transform)));
  const link = g.append('g').selectAll('line').data(links).enter().append('line')
    .attr('stroke', d => (d.type === 'nt' || d.type === 'tt') ? '#FFFFFF' : d.asp.col)
    .attr('stroke-width', d => (d.type === 'nt' || d.type === 'tt') ? 0.2 + d.w * 1.2 : 0.3 + d.w * 1.5)
    .attr('stroke-opacity', d => {
      if (activatedIdx && d.type === 'nn') {
        const sAct = activatedIdx.has(typeof d.source === 'object' ? d.source.id : d.source);
        const tAct = activatedIdx.has(typeof d.target === 'object' ? d.target.id : d.target);
        return (sAct || tAct) ? 0.7 : 0.08;
      }
      return d.type === 'nt' ? 0.55 : (d.type === 'tt' ? 0.35 : 0.8);
    })
    .attr('stroke-dasharray', d => {
      if (d.type === 'nt') return '6,4';
      if (d.type === 'tt') return '3,5';
      const majorAngles = [0, 60, 90, 120, 180];
      return majorAngles.includes(d.asp.angle) ? null : '5,4';
    });
  const tip = d3.select('#tooltip');
  let dragging = false;
  const node = g.append('g').selectAll('g').data(nodes).enter().append('g')
    .call(d3.drag()
      .on('start', (ev, d) => { dragging = true; tip.style('display', 'none'); if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on('end', (ev, d) => { dragging = false; if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );
  node.filter(d => d.ap).append('circle').attr('r', d => r(d) + 5).attr('fill', 'none').attr('stroke', '#FFD700').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3');
  node.filter(d => d.isTransit).append('circle').attr('r', d => r(d) + 7).attr('fill', 'none').attr('stroke', '#CC44FF').attr('stroke-width', 1.5).attr('stroke-dasharray', '3,3').attr('opacity', 0.9);
  node.append('circle').attr('r', d => r(d)).attr('fill', d => d.isTransit ? '#2a0a3a' : KC_COLOR[Math.min(d.k, KC_COLOR.length - 1)]).attr('stroke', '#000');
  node.append('text').text(d => d.k).attr('text-anchor', 'middle').attr('dy', '4px').style('font', 'bold 10px monospace').style('fill', '#000');
  node.append('text').text(d => d.name + (d.retro ? ' ℞' : '')).attr('text-anchor', 'middle').attr('dy', d => r(d) + 14).style('font', 'bold 12px monospace').style('fill', '#FFF');
  node.on('mouseover', (ev, d) => {
    if (dragging) return;
    tip.style('display', 'block').html(`<b>${d.name}${d.retro ? ' ℞' : ''}</b>${d.isTransit ? '<span class="tr-badge">T</span>' : ''}<br>${fmtLon(d.lon)} · ${d.type}<br>k=${d.k} deg=${d.deg} BC=${d.betweenness.toFixed(4)}${d.ap ? '<br><span style="color:#FFD700">⚠ AP</span>' : ''}`);
  }).on('mousemove', ev => tip.style('left', (ev.clientX + 14) + 'px').style('top', (ev.clientY - 8) + 'px')).on('mouseout', () => tip.style('display', 'none'));
  link.on('mouseover', (ev, d) => tip.style('display', 'block').html(`<span style="color:${d.asp.col}">${d.asp.sym}</span> ${d.si}–${d.ti}<br>${d.asp.name} orb ${fmtOrb(d.orb)} weight ${d.w.toFixed(3)}`))
    .on('mousemove', ev => tip.style('left', (ev.clientX + 14) + 'px').style('top', (ev.clientY - 8) + 'px')).on('mouseout', () => tip.style('display', 'none'));
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide().radius(d => r(d) + 10));
  simulation.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });
  const transitCount = planets.length - natalCount;
  document.getElementById('graph-status').textContent = `|V|=${planets.length}${transitCount > 0 ? ` (T:${transitCount})` : ''} conn=${analysis.mainComponentSize} |E|=${edges.length} (vis: ${visibleEdges.length}) λ₂ topol.=${analysis.fiedlerUnweighted.toFixed(3)} (model: ${analysis.fiedlerWeighted.toFixed(3)}) k-max=${analysis.maxKCore} AP=${analysis.articulationPoints.filter(Boolean).length}`;
  let leg = '<div class="lg-title">K-CORE</div>' + KC_COLOR.slice(0, analysis.maxKCore + 1).map((c, i) => `<div class="lg-row"><div class="lg-dot" style="background:${c}"></div>k=${i}</div>`).join('');
  leg += '<div class="lg-title">ASPECTS</div>☌/☍/□ <span style="color:#FF4444">●</span> △/⚹ <span style="color:#00FF88">●</span> ∠/⚼ <span style="color:#FF8800">●</span> Q/bQ <span style="color:#CC88FF">●</span> ⚺/⚻ <span style="color:#888">●</span>';
  document.getElementById('legend-box').innerHTML = leg;
}

// ========== UI METRICS PANEL (renders from metrics data) ==========
function updateUI(planets, edges, analysis, nearMiss, natalAnalysis, edgesN) {
  const m = buildMetricsData(analysis, planets, edges, natalAnalysis, edgesN, useWeighted);

  let metricsHTML = `
    <div class="mrow"><span class="mlbl">|V| nodes</span><span class="mval">${m.nodesTotal}</span></div>
    <div class="mrow"><span class="mlbl">|V| main component</span><span class="mval">${m.mainComponentSize}</span></div>
    <div class="mrow"><span class="mlbl">|E| geometric edges</span><span class="mval">${m.edgesTotal}</span></div>
    <div class="mrow"><span class="mlbl">Density ρ (total)</span><span class="mval">${m.densityTotal.toFixed(4)}</span></div>
    <div class="mrow"><span class="mlbl">Density ρ (conn)</span><span class="mval">${m.densityConn.toFixed(4)}</span></div>
    <div class="mrow"><span class="mlbl">Connected</span><span class="mval ${m.isConnected?'ok':'bad'}">${m.isConnected?'YES':'NO ('+m.componentCount+')'}</span></div>
    <div class="mrow"><span class="mlbl">λ₂ Fiedler topol.</span><span class="mval ${m.fiedlerTopol>.5?'ok':m.fiedlerTopol>0?'warn':'bad'}">${m.fiedlerTopol.toFixed(4)}</span></div>
    <div class="mrow"><span class="mlbl" style="color:var(--purple)">λ₂ Fiedler model</span><span class="mval" style="color:var(--purple)">${m.fiedlerModel.toFixed(4)}</span></div>
    <div class="mrow"><span class="mlbl">Min / Max degree</span><span class="mval">${m.minDegree} / ${m.maxDegree}</span></div>
    <div class="mrow"><span class="mlbl">k-core max</span><span class="mval">${m.maxKCore}</span></div>
    <div class="mrow${m.articulationPoints.length>0?' alert':''}"><span class="mlbl">Cut vertices</span><span class="mval ${m.articulationPoints.length>0?'warn':'ok'}">${m.articulationPoints.length>0?'⚠ '+m.articulationPoints.length+' — '+m.articulationPoints.join(', '):'0'}</span></div>
    ${m.isolatedPlanets.length?`<div class="mrow" style="background:#0a000f"><span class="mlbl" style="color:#FF4444">Isolated</span><span class="mval bad">${m.isolatedPlanets.join(', ')}</span></div>`:''}
    <div class="mrow"><span class="mlbl">L1 (BC max topol.)</span><span class="mval accent">${m.topBetweennessUnweighted}</span></div>
    <div class="mrow"><span class="mlbl" style="color:var(--purple)">L1 (BC max model)</span><span class="mval" style="color:var(--purple)">${m.topBetweennessWeighted}</span></div>
    ${m.isTransitMode ? `<div class="mrow"><span class="mlbl">L1 natal topol.</span><span class="mval" style="font-size:12px">${m.L1_natal_topol}</span></div><div class="mrow"><span class="mlbl">L1 natal model</span><span class="mval" style="font-size:12px;color:var(--purple)">${m.L1_natal_model}</span></div>` : ''}
  `;

  if (m.deltaData) {
    const d = m.deltaData;
    const color = v => v>0?'#00FF88':v<0?'#FF4444':'#888';
    const sign = v => v>0?'+':'';
    metricsHTML += `
      <div style="height:1px;background:#442266;margin:4px 0"></div>
      <div class="mrow tr-row"><span class="mlbl" style="color:#CC44FF;font-weight:700">Δ STRUCTURAL</span></div>
      <div class="mrow tr-row"><span class="mlbl">Transit edges (NT / TT)</span><span class="mval">${d.ntEdges} / ${d.ttEdges}</span></div>
      <div class="mrow tr-row"><span class="mlbl">Δ Fiedler topol.</span><span class="mval" style="color:${color(d.deltaFiedler)}">${sign(d.deltaFiedler)}${d.deltaFiedler.toFixed(4)}</span></div>
      <div class="mrow tr-row"><span class="mlbl">Δ k-max</span><span class="mval" style="color:${color(d.deltaK)}">${sign(d.deltaK)}${d.deltaK}</span></div>
      <div class="mrow tr-row"><span class="mlbl">Δ AP</span><span class="mval" style="color:${color(d.deltaAP)}">${sign(d.deltaAP)}${d.deltaAP}</span></div>
    `;
  }

  document.getElementById('metrics-wrap').innerHTML = metricsHTML;

  const displayedBetweenness = useWeighted ? analysis.weightedBetweenness : analysis.unweightedBetweenness;
  const natalCount = analysis.natalCount || planets.length;
  const nd = planets.map((p,i)=>({
    name:p.name,retro:p.retro,k:analysis.kCores[i],betweenness:displayedBetweenness[i],bc_topol:analysis.unweightedBetweenness[i],deg:analysis.degrees[i],ap:analysis.articulationPoints[i],isTransit:p.isTransit||i>=natalCount
  }));
  nd.sort((a,b)=>b.k-a.k||b.betweenness-b.betweenness);
  document.getElementById('node-body').innerHTML = nd.map(d=>`<tr><td>${d.name}${d.retro?' ℞':''}${d.isTransit?'<span class="tr-badge">T</span>':''}${d.ap?' ⚠':''}</td><td>${d.deg}</td><td>${d.k}</td><td>${d.bc_topol.toFixed(3)}</td><td>${d.betweenness.toFixed(3)}</td><td>${d.ap?'AP':''}</td></tr>`).join('');
  document.getElementById('edge-count').textContent = edges.length;
  document.getElementById('edge-list').innerHTML = edges.sort((a,b)=>a.orb-b.orb).map(e=>`<div class="erow${e.type==='nt'?' e-nt':e.type==='tt'?' e-tt':''}"><span style="color:${e.asp.col}">${e.asp.sym}</span> ${e.si}–${e.ti}${e.type==='nt'?'<span class="tr-badge">T→N</span>':e.type==='tt'?'<span class="tr-badge">T→T</span>':''} ${fmtOrb(e.orb)} (w=${e.w.toFixed(2)})</div>`).join('');
  document.getElementById('nm-count').textContent = nearMiss.length;
  document.getElementById('near-miss-list').innerHTML = nearMiss.length?nearMiss.map(e=>`<div class="nmrow">${e.si}–${e.ti} ${e.aspName} +${fmtOrb(e.over)}</div>`).join(''):'<div class="empty-msg">—</div>';
}
