// ========== METRICS DERIVATI (valori per UI) ==========
function buildMetricsData(analysis, planets, edges, natalAnalysis, edgesN, useWeighted) {
  const displayedBetweenness = useWeighted ? analysis.weightedBetweenness : analysis.unweightedBetweenness;
  const apList = planets.filter((_, i) => analysis.articulationPoints[i]).map(p => p.name);
  const natalCount = analysis.natalCount || planets.length;
  const isTransitMode = (natalCount < planets.length);
  const natalIndices = planets.map((p, i) => i < natalCount ? i : -1).filter(i => i >= 0);

  let L1_natal_topol = '—';
  let L1_natal_model = '—';
  if (natalIndices.length > 0) {
    const bcTopolNatal = natalIndices.map(i => analysis.unweightedBetweenness[i]);
    const bcModelNatal = natalIndices.map(i => analysis.weightedBetweenness[i]);
    const idxTopol = bcTopolNatal.indexOf(Math.max(...bcTopolNatal));
    const idxModel = bcModelNatal.indexOf(Math.max(...bcModelNatal));
    if (idxTopol >= 0) L1_natal_topol = planets[natalIndices[idxTopol]].name;
    if (idxModel >= 0) L1_natal_model = planets[natalIndices[idxModel]].name;
  }

  let deltaData = null;
  if (isTransitMode && natalAnalysis && edgesN) {
    const ntEdges = edges.filter(e => e.type === 'nt').length;
    const ttEdges = edges.filter(e => e.type === 'tt').length;
    const deltaFiedler = analysis.fiedlerUnweighted - natalAnalysis.fiedlerUnweighted;
    const deltaK = analysis.maxKCore - natalAnalysis.maxKCore;
    const deltaAP = analysis.articulationPoints.filter(Boolean).length - natalAnalysis.articulationPoints.filter(Boolean).length;
    deltaData = { ntEdges, ttEdges, deltaFiedler, deltaK, deltaAP };
  }

  return {
    nodesTotal: planets.length,
    mainComponentSize: analysis.mainComponentSize,
    edgesTotal: edges.length,
    densityTotal: analysis.density,
    densityConn: analysis.mainComponentDensity,
    isConnected: analysis.componentCount === 1,
    componentCount: analysis.componentCount,
    fiedlerTopol: analysis.fiedlerUnweighted,
    fiedlerModel: analysis.fiedlerWeighted,
    minDegree: analysis.minDegree,
    maxDegree: analysis.maxDegree,
    maxKCore: analysis.maxKCore,
    articulationPoints: apList,
    isolatedPlanets: analysis.isolatedPlanets,
    topBetweennessUnweighted: analysis.topBetweennessUnweighted,
    topBetweennessWeighted: analysis.topBetweennessWeighted,
    L1_natal_topol,
    L1_natal_model,
    isTransitMode,
    deltaData
  };
}