// ========== CONSTANTS ==========
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_BASE = [0,30,60,90,120,150,180,210,240,270,300,330];
const SIGN_ABBR = ['Ar','Ta','Ge','Cn','Le','Vi','Li','Sc','Sg','Cp','Aq','Pi'];
const PTYPES = ['luminary','personal','social','outer','point'];
const PTYPE_LBL = {luminary:'Lum',personal:'Pers',social:'Soc',outer:'Out',point:'Pt'};
const PTYPE_DEFAULT = {
  'ASC':'point','MC':'point','Sun':'luminary','Moon':'luminary',
  'Mercury':'personal','Venus':'personal','Mars':'personal',
  'Jupiter':'social','Saturn':'social','Uranus':'outer','Neptune':'outer','Pluto':'outer',
  'NNode':'point','Chiron':'point','Lilith':'point','Vertex':'point','Fortune':'point'
};
const ASPECT_TYPES = ["Conjunction","Opposition","Square","Trine","Sextile","Quincunx","Quintile","Bi-Quintile","Octile","Tri-octile","Semi-Sextile"];
const ASPECT_ANGLES = [0,180,90,120,60,150,72,144,45,135,30];
const ASPECT_SYMS = ['☌','☍','□','△','⚹','⚻','Q','bQ','∠','⚼','⚺'];
const ASPECT_COLS = ['#FF4444','#FF4444','#FF4444','#00FF88','#00FF88','#888888','#CC88FF','#CC88FF','#FF8800','#FF8800','#888888'];
const ASPECT_WEIGHT = {
  "Conjunction": 1.2,
  "Opposition": 1.2,
  "Square": 1.2,
  "Trine": 1.2,
  "Sextile": 1.0,
  "Quincunx": 1.0,
  "Quintile": 1.0,
  "Bi-Quintile": 0.8,
  "Octile": 0.8,
  "Tri-octile": 0.8,
  "Semi-Sextile": 0.8
};

const MINOR_ASPECT_NAMES = ["Quincunx","Quintile","Bi-Quintile","Octile","Tri-octile","Semi-Sextile"];

const DEFAULT_ORB_BY_ASPECT = {
  "Conjunction": 8,
  "Opposition": 8,
  "Square": 7,
  "Trine": 7,
  "Sextile": 5,
  "Quincunx": 3,
  "Quintile": 3,
  "Bi-Quintile": 3,
  "Octile": 3,
  "Tri-octile": 3,
  "Semi-Sextile": 3
};
const CLASSIC_ORB_BY_ASPECT = {
  "Conjunction": 7,
  "Opposition": 7,
  "Square": 7,
  "Trine": 7,
  "Sextile": 5,
  "Quincunx": 3,
  "Quintile": 3,
  "Bi-Quintile": 3,
  "Octile": 3,
  "Tri-octile": 3,
  "Semi-Sextile": 3
};
var ORB_BY_ASPECT = JSON.parse(JSON.stringify(DEFAULT_ORB_BY_ASPECT));

const SLOW_TRANSIT_TEMPLATE = [
  {name:'T-Jupiter', sign:0, deg:0,min:0,retro:false,type:'social'},
  {name:'T-Saturn', sign:0, deg:0,min:0,retro:false,type:'social'},
  {name:'T-Uranus', sign:1, deg:0,min:0,retro:false,type:'outer'},
  {name:'T-Neptune', sign:0, deg:0,min:0,retro:false,type:'outer'},
  {name:'T-Pluto', sign:10,deg:0,min:0,retro:false,type:'outer'},
  {name:'T-Chiron', sign:0, deg:0,min:0,retro:false,type:'point'},
];

const DEFAULT_LOB65 = [
  {name:'ASC',sign:2,deg:17,min:46,retro:false,type:'point'},
  {name:'MC',sign:10,deg:22,min:57,retro:false,type:'point'},
  {name:'Sun',sign:10,deg:23,min:32,retro:false,type:'luminary'},
  {name:'Moon',sign:3,deg:4,min:16,retro:false,type:'luminary'},
  {name:'Mercury',sign:10,deg:14,min:42,retro:false,type:'personal'},
  {name:'Venus',sign:10,deg:8,min:56,retro:false,type:'personal'},
  {name:'Mars',sign:5,deg:26,min:40,retro:true,type:'personal'},
  {name:'Jupiter',sign:1,deg:17,min:54,retro:false,type:'social'},
  {name:'Saturn',sign:11,deg:5,min:54,retro:false,type:'social'},
  {name:'Uranus',sign:5,deg:13,min:37,retro:true,type:'outer'},
  {name:'Neptune',sign:7,deg:19,min:59,retro:false,type:'outer'},
  {name:'Pluto',sign:5,deg:15,min:34,retro:true,type:'outer'},
  {name:'NNode',sign:2,deg:19,min:43,retro:true,type:'point'},
  {name:'Chiron',sign:11,deg:16,min:48,retro:false,type:'point'},
  {name:'Lilith',sign:9,deg:13,min:51,retro:false,type:'point'},
  {name:'Fortune',sign:6,deg:28,min:30,retro:false,type:'point'},
  {name:'Vertex',sign:7,deg:9,min:55,retro:false,type:'point'},
];

// ========== UTIL ==========
function sdm2lon(s,d,m){
  const signIdx = parseInt(s);
  const deg = parseInt(d)||0;
  const min = parseInt(m)||0;
  if (isNaN(signIdx) || isNaN(deg) || isNaN(min)) return 0;
  return SIGN_BASE[signIdx] + deg + min/60;
}
function aspAngle(a,b){ let d=Math.abs(a-b)%360; return d>180?360-d:d; }
function fmtOrb(orb){ const d=Math.floor(orb),m=Math.round((orb-d)*60); return `${d}°${String(m).padStart(2,'0')}'`; }
function fmtLon(lon){ const s=Math.floor(lon/30),w=lon-s*30,d=Math.floor(w); let m=Math.round((w-d)*60); if(m===60)m=0; return `${d}°${String(m).padStart(2,'0')}' ${SIGN_ABBR[s]}`; }

// ========== WEIGHT COMPUTATION (Layer 3) ==========
function computeWeight(orb, orbMax, curve, kExp = 3, thrPoint = 0.5) {
  if (orb > orbMax) return 0;
  const ratio = orb / orbMax;
  let w = 0;
  if (curve === 'linear') w = 1 - ratio;
  else if (curve === 'exponential') w = Math.exp(-kExp * ratio);
  else if (curve === 'threshold') w = ratio <= thrPoint ? 1.0 : 0.0;
  else w = 1 - ratio;
  return Math.max(w, 1e-6);
}

// ========== DETECT EDGES (with minor exclusion) ==========
function detectEdges(planets, curve, retroFactor, kExp, thrPoint) {
  const n=planets.length, edges=[], nearMiss=[];
  const excludeMinor = document.getElementById('excludeMinorAspectCheck')?.checked || false;
  for(let i=0;i<n;i++){
    for(let j=i+1;j<n;j++){
      const ang=aspAngle(planets[i].lon,planets[j].lon);
      let bestAspIdx=-1, bestDev=Infinity, bestOrbMax=0;
      for(let a=0;a<ASPECT_TYPES.length;a++){
        const aspName=ASPECT_TYPES[a];
        if (excludeMinor && MINOR_ASPECT_NAMES.includes(aspName)) continue;
        const orbMax=ORB_BY_ASPECT[aspName]||3;
        if(orbMax<=0) continue;
        const dev=Math.abs(ang-ASPECT_ANGLES[a]);
        if(dev<=orbMax && dev<bestDev){
          bestDev=dev; bestAspIdx=a; bestOrbMax=orbMax;
        }
      }
      if(bestAspIdx!==-1){
        const aspName=ASPECT_TYPES[bestAspIdx];
        let weight=computeWeight(bestDev,bestOrbMax,curve,kExp,thrPoint);
        let retroMult=1.0;
        if(planets[i].retro) retroMult*=retroFactor;
        if(planets[j].retro) retroMult*=retroFactor;
        weight*=retroMult;
        weight*=(ASPECT_WEIGHT[aspName]||1.0);
        edges.push({
          s:i, t:j, si:planets[i].name, ti:planets[j].name,
          asp:{name:aspName, angle:ASPECT_ANGLES[bestAspIdx], sym:ASPECT_SYMS[bestAspIdx], col:ASPECT_COLS[bestAspIdx]},
          orb:bestDev, maxOrb:bestOrbMax, w:weight
        });
      } else {
        let bestMissAsp=null, bestMissDev=Infinity, bestMissOrbMax=0;
        for(let a=0;a<ASPECT_TYPES.length;a++){
          const aspName=ASPECT_TYPES[a];
          if (excludeMinor && MINOR_ASPECT_NAMES.includes(aspName)) continue;
          const orbMax=ORB_BY_ASPECT[aspName]||3;
          if(orbMax<=0) continue;
          const dev=Math.abs(ang-ASPECT_ANGLES[a]);
          if(dev<=orbMax*1.5 && dev<bestMissDev){
            bestMissDev=dev; bestMissAsp=aspName; bestMissOrbMax=orbMax;
          }
        }
        if(bestMissAsp){
          nearMiss.push({si:planets[i].name, ti:planets[j].name, aspName:bestMissAsp, orb:bestMissDev, maxOrb:bestMissOrbMax, over:bestMissDev-bestMissOrbMax});
        }
      }
    }
  }
  nearMiss.sort((a,b)=>a.over-b.over);
  return {edges, nearMiss};
}

// ========== DETECT EDGES WITH TRANSITS ==========
function detectAllEdges(natals, transits, curve, retroFactor, kExp, thrPoint){
  const showTT = document.getElementById('show-tt')?.checked;
  const excludeMinor = document.getElementById('excludeMinorAspectCheck')?.checked || false;
  const all = natals.map(p=>({...p,isTransit:false})).concat(transits);
  const nN = natals.length, nAll = all.length;
  const edges=[], nearMiss=[];
  for(let i=0;i<nAll;i++) for(let j=i+1;j<nAll;j++){
    const pi=all[i], pj=all[j];
    const isTT = pi.isTransit && pj.isTransit;
    const isNT = pi.isTransit !== pj.isTransit;
    if(isTT && !showTT) continue;
    const ang=aspAngle(pi.lon, pj.lon);
    let bestAspIdx=-1, bestDev=Infinity, bestOrbMax=0;
    for(let a=0;a<ASPECT_TYPES.length;a++){
      const aspName=ASPECT_TYPES[a];
      if (excludeMinor && MINOR_ASPECT_NAMES.includes(aspName)) continue;
      const orbMax=ORB_BY_ASPECT[aspName]||3;
      if(orbMax<=0) continue;
      const dev=Math.abs(ang-ASPECT_ANGLES[a]);
      if(dev<=orbMax && dev<bestDev){ bestDev=dev; bestAspIdx=a; bestOrbMax=orbMax; }
    }
    if(bestAspIdx!==-1){
      const aspName=ASPECT_TYPES[bestAspIdx];
      let weight=computeWeight(bestDev,bestOrbMax,curve,kExp,thrPoint);
      if(pi.retro) weight*=retroFactor;
      if(pj.retro) weight*=retroFactor;
      weight*=(ASPECT_WEIGHT[aspName]||1.0);
      // NOMI: se arco NT e il primo corpo è natale (i < nN) scambia si e ti per mettere il transito prima
      let siName = pi.name, tiName = pj.name;
      if (isNT && i < nN) {
        // i è natale, j è transito → vogliamo transito prima
        [siName, tiName] = [tiName, siName];
      }
      edges.push({
        s:i, t:j,
        si: siName, ti: tiName,
        asp:{name:aspName, angle:ASPECT_ANGLES[bestAspIdx], sym:ASPECT_SYMS[bestAspIdx], col:ASPECT_COLS[bestAspIdx]},
        orb:bestDev, maxOrb:bestOrbMax, w:weight,
        type:isTT?'tt':isNT?'nt':'nn'
      });
    } else if(!pi.isTransit && !pj.isTransit){
      let bestMissAsp=null, bestMissDev=Infinity, bestMissOrbMax=0;
      for(let a=0;a<ASPECT_TYPES.length;a++){
        const aspName=ASPECT_TYPES[a];
        if (excludeMinor && MINOR_ASPECT_NAMES.includes(aspName)) continue;
        const orbMax=ORB_BY_ASPECT[aspName]||3;
        if(orbMax<=0) continue;
        const dev=Math.abs(ang-ASPECT_ANGLES[a]);
        if(dev<=orbMax*1.5 && dev<bestMissDev){ bestMissDev=dev; bestMissAsp=aspName; bestMissOrbMax=orbMax; }
      }
      if(bestMissAsp) nearMiss.push({si:pi.name,ti:pj.name,aspName:bestMissAsp,orb:bestMissDev,maxOrb:bestMissOrbMax,over:bestMissDev-bestMissOrbMax});
    }
  }
  nearMiss.sort((a,b)=>a.over-b.over);
  return {edges, nearMiss, all};
}

// ========== GRAPH AND METRIC CORE ==========
function buildAdj(n,edges,oriented=false){ const adj=Array.from({length:n},()=>Array(n).fill(0)); edges.forEach(e=>{ adj[e.s][e.t]=e.w; if(!oriented) adj[e.t][e.s]=e.w; }); return adj; }
function buildBinaryAdj(n,edges){ const adj=Array.from({length:n},()=>Array(n).fill(0)); edges.forEach(e=>{ adj[e.s][e.t]=1; adj[e.t][e.s]=1; }); return adj; }
function computeDeg(adj,n){ return Array.from({length:n},(_,i)=>adj[i].reduce((a,b)=>a+(b>0?1:0),0)); }
function kCoreDecomp(adj,n){
  const deg=computeDeg(adj,n).slice(), kcore=new Array(n).fill(0), gone=new Array(n).fill(false);
  let rem=n;
  for(let k=1;rem>0;k++){
    let chg=true;
    while(chg){ chg=false;
      for(let v=0;v<n;v++) if(!gone[v]&&deg[v]<k){ gone[v]=true;rem--;kcore[v]=k-1; for(let u=0;u<n;u++) if(!gone[u]&&adj[v][u])deg[u]--; chg=true; }
    }
  }
  return kcore;
}
function betweenness(adj, n, isWeighted = false, useLog = false, comp = null) {
  const BC = new Array(n).fill(0);
  const compIdx = comp || Array(n).fill(0);
  const compSizes = {};
  compIdx.forEach(c => compSizes[c] = (compSizes[c]||0)+1);
  for (let s = 0; s < n; s++) {
    const dist = Array(n).fill(Infinity), sigma = Array(n).fill(0), pred = Array.from({length: n}, () => []);
    dist[s] = 0; sigma[s] = 1;
    const pq = new PriorityQueue(); pq.enqueue(s, 0);
    const stack = [];
    while (!pq.isEmpty()) {
      const {node: v, priority: d} = pq.dequeue();
      if (d > dist[v]) continue;
      stack.push(v);
      for (let w = 0; w < n; w++) {
        const weight = adj[v][w];
        if (weight <= 0) continue;
        let cost;
        if (!isWeighted) {
          cost = 1;
        } else {
          cost = useLog ? -Math.log(weight) : 1 / weight;
        }
        const alt = dist[v] + cost;
        if (alt < dist[w] - 1e-12) {
          dist[w] = alt;
          sigma[w] = sigma[v];
          pred[w] = [v];
          pq.enqueue(w, alt);
        } else if (Math.abs(alt - dist[w]) < 1e-12) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      }
    }
    const delta = Array(n).fill(0);
    while (stack.length) {
      const w = stack.pop();
      for (const v of pred[w]) {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      }
      if (w !== s) BC[w] += delta[w];
    }
  }
  for (let i = 0; i < n; i++) {
    const sz = compSizes[compIdx[i]] || n;
    const norm = (sz - 1) * (sz - 2);
    if (norm > 0) BC[i] /= norm;
  }
  return BC;
}
class PriorityQueue{ constructor(){this.heap=[];} enqueue(n,p){this.heap.push({node:n,priority:p});this._siftUp(this.heap.length-1);} dequeue(){const m=this.heap[0],l=this.heap.pop();if(this.heap.length){this.heap[0]=l;this._siftDown(0);}return m;} isEmpty(){return this.heap.length===0;} _siftUp(i){while(i>0){const p=Math.floor((i-1)/2);if(this.heap[p].priority<=this.heap[i].priority)break;[this.heap[p],this.heap[i]]=[this.heap[i],this.heap[p]];i=p;}} _siftDown(i){const n=this.heap.length;while(true){let l=2*i+1,r=2*i+2,s=i;if(l<n&&this.heap[l].priority<this.heap[s].priority)s=l;if(r<n&&this.heap[r].priority<this.heap[s].priority)s=r;if(s===i)break;[this.heap[i],this.heap[s]]=[this.heap[s],this.heap[i]];i=s;}} }
function cutVertices(adj,n){
  const vis=Array(n).fill(false),disc=Array(n),low=Array(n),par=Array(n).fill(-1),ap=Array(n).fill(false); let t=0;
  function dfs(u){ vis[u]=true; disc[u]=low[u]=++t; let ch=0;
    for(let v=0;v<n;v++){ if(!adj[u][v]) continue;
      if(!vis[v]){ ch++; par[v]=u; dfs(v); low[u]=Math.min(low[u],low[v]); if(par[u]===-1&&ch>1) ap[u]=true; if(par[u]!==-1&&low[v]>=disc[u]) ap[u]=true; }
      else if(v!==par[u]) low[u]=Math.min(low[u],disc[v]);
    }
  }
  for(let i=0;i<n;i++) if(!vis[i]) dfs(i);
  return ap;
}
function findComponents(adj,n){
  const comp=Array(n).fill(-1); let cid=0;
  for(let i=0;i<n;i++){ if(comp[i]!==-1) continue; const q=[i]; comp[i]=cid; let qi=0; while(qi<q.length){ const v=q[qi++]; for(let u=0;u<n;u++) if(adj[v][u]&&comp[u]===-1){ comp[u]=cid; q.push(u); } } cid++; }
  const sizes=Array(cid).fill(0); comp.forEach(c=>sizes[c]++);
  const mainComp=sizes.indexOf(Math.max(...sizes));
  const mainIdx=comp.reduce((arr,c,i)=>c===mainComp?[...arr,i]:arr,[]);
  return {comp,nComp:cid,mainIdx};
}
function fiedler(adj,mainIdx,useWeight){
  const m=mainIdx.length; if(m<2) return 0;
  const L=Array.from({length:m},()=>Array(m).fill(0));
  for(let ii=0;ii<m;ii++){ const v=mainIdx[ii]; for(let jj=0;jj<m;jj++){ const u=mainIdx[jj]; const w=adj[v][u]; if(w>0){ L[ii][ii]+=useWeight?w:1; L[ii][jj]=useWeight?-w:-1; } } }
  const isq=1/Math.sqrt(m), v0=Array(m).fill(isq);
  const matvec=x=>L.map(row=>row.reduce((s,lij,j)=>s+lij*x[j],0));
  const dot=(a,b)=>a.reduce((s,ai,i)=>s+ai*b[i],0);
  const norm=x=>{const n=Math.sqrt(dot(x,x)); return n>1e-15?x.map(xi=>xi/n):x;};
  const deflate=x=>{const c=dot(x,v0); return x.map((xi,i)=>xi-c*v0[i]);};
  let u=norm(Array.from({length:m},(_,i)=>Math.sin(i)));
  let lmax=0; for(let k=0;k<500;k++){ const Lu=matvec(u),r=dot(u,Lu); u=norm(Lu); if(Math.abs(r-lmax)<1e-12){lmax=r;break;} lmax=r; }
  const shift=lmax+1;
  let w=norm(deflate(Array.from({length:m},(_,i)=>Math.cos(i))));
  let f=0; for(let k=0;k<2000;k++){ const Lw=matvec(w); const shifted=deflate(w.map((wi,i)=>shift*wi-Lw[i])); const nf=dot(w,Lw); const nr=Math.sqrt(dot(shifted,shifted)); if(nr<1e-15) break; w=shifted.map(x=>x/nr); if(Math.abs(nf-f)<1e-10){f=nf;break;} f=nf; }
  return Math.max(0,f);
}
function analyze(planets, edges, oriented = false, useLog = false, nNatal = null) {
  const n = planets.length;
  const nN = (nNatal !== null) ? nNatal : n;
  const adjBinary = buildBinaryAdj(n, edges);
  const adjWeighted = buildAdj(n, edges, oriented);
  const deg = computeDeg(adjBinary, n);
  const kcore = kCoreDecomp(adjBinary, n);
  const {comp, nComp, mainIdx} = findComponents(adjBinary, n);
  const bc_unweighted = betweenness(adjBinary, n, false, false, comp);
  const bc_weighted = betweenness(adjWeighted, n, true, useLog, comp);
  const ap = cutVertices(adjBinary, n);
  let edgesInMain = 0;
  const mainSet = new Set(mainIdx);
  edges.forEach(e => {
    if (mainSet.has(e.s) && mainSet.has(e.t)) edgesInMain++;
  });
  const connNodes = mainIdx.length;
  const density = n > 1 ? 2 * edges.length / (n * (n - 1)) : 0;
  const densityConn = connNodes > 1 ? 2 * edgesInMain / (connNodes * (connNodes - 1)) : 0;
  const fiedler_unweighted = fiedler(adjBinary, mainIdx, false);
  const fiedler_weighted = fiedler(adjWeighted, mainIdx, true);
  const maxK = Math.max(...kcore);
  const minDeg = Math.min(...deg), maxDeg = Math.max(...deg);
  const isolated = planets.filter((_, i) => deg[i] === 0).map(p => p.name);
  const L1_weighted = planets[bc_weighted.indexOf(Math.max(...bc_weighted))]?.name || '—';
  const L1_unweighted = planets[bc_unweighted.indexOf(Math.max(...bc_unweighted))]?.name || '—';
  return {
    adjacencyMatrix: adjBinary,
    degrees: deg,
    kCores: kcore,
    weightedBetweenness: bc_weighted,
    unweightedBetweenness: bc_unweighted,
    articulationPoints: ap,
    componentCount: nComp,
    mainComponentIndices: mainIdx,
    componentMembership: comp,
    fiedlerUnweighted: fiedler_unweighted,
    fiedlerWeighted: fiedler_weighted,
    density: density,
    mainComponentDensity: densityConn,
    mainComponentSize: connNodes,
    maxKCore: maxK,
    minDegree: minDeg,
    maxDegree: maxDeg,
    isolatedPlanets: isolated,
    topBetweennessWeighted: L1_weighted,
    topBetweennessUnweighted: L1_unweighted,
    natalCount: nN,
    mainComponentEdges: edgesInMain
  };
}