// Cartografia 2D do Atlas de Silvengard.
// Desenha um mapa de papel a partir dos dados (células, relevo, biomas, cidades),
// e não uma captura da vista 3D. Usado pela janela "Mapa 2D".
import {societyField} from './society-core.js?v=27.1';
import {populationField, populationColor, inhabitants} from './population-core.js?v=40';

const MAP_W = 1920, MAP_H = 937;
const MAP_FONT = "'Palatino Linotype','Book Antiqua',Georgia,serif";

export const PRINT_MODES = [
  ['terrain', 'Terreno', 'Relevo, vegetação, rios e fronteiras; os estados não são pintados.'],
  ['political', 'Político', 'Estados pintados em cores suaves, fronteiras e capitais.'],
  ['population', 'População', 'Densidade urbana em manchas de calor, com círculos por cidade.'],
  ['culture', 'Cultura', 'Culturas pintadas a partir do entorno das cidades.'],
  ['religion', 'Religião', 'Religiões pintadas a partir do entorno das cidades.'],
  ['goods', 'Bens produzidos', 'Bem predominante de cada província, por valor produzido.'],
  ['markets', 'Mercados', 'Território de cada mercado econômico.'],
  ['provinces', 'Províncias', 'Divisão interna dos estados em províncias.']
];

export const PRINT_THEMES = [
  ['blue', 'Carta azul', 'Papel azulado e tinta cinza, como a referência.'],
  ['parchment', 'Pergaminho', 'Papel quente e tintas sépia.'],
  ['sepia', 'Sépia', 'Papel envelhecido, contraste mais macio.'],
  ['night', 'Noite', 'Papel escuro e tinta clara, para mesa à noite.']
];

const FONT = MAP_FONT;

const THEMES = {
  blue: {
    id: 'blue',
    paper: '#dfe2da', paperDark: '#c9cec4', paperLight: '#eceee6',
    seaTop: '#7d95a1', seaMid: '#6c8794', seaBottom: '#5b7886', seaShallow: '#a4b9bf',
    land: '#ebe4d0', landWarm: '#f3edda', landShade: '#d6ceb8',
    ink: '#30393b', inkSoft: '#5b6563', inkFaint: '#828b85',
    coast: '#39464a', river: '#5f818b',
    border: '#5c6866', grid: '#7d9299',
    veg: '#6b8064', vegDeep: '#566e55',
    reliefLight: '#d9d4c1', reliefShadow: '#a4a494', snow: '#f4f2e7',
    gold: '#8f7648', legend: '#e6dfc8', legendInk: '#39423f', legendBorder: '#8a938b',
    neutral: '#ded7c3', unknown: '#d2ccb9', markers: '#394445',
    vignette: 'rgba(42,52,48,.20)'
  },
  parchment: {
    id: 'parchment',
    paper: '#efe4c9', paperDark: '#dccfae', paperLight: '#f6eed7',
    seaTop: '#aab99f', seaMid: '#95a68e', seaBottom: '#87977f', seaShallow: '#c8cfb1',
    land: '#ecdcb3', landWarm: '#f4e8c6', landShade: '#d8c69a',
    ink: '#3b3226', inkSoft: '#665a46', inkFaint: '#8c7e64',
    coast: '#4a3f30', river: '#6c8272',
    border: '#6f6148', grid: '#a39372',
    veg: '#77805a', vegDeep: '#66704e',
    reliefLight: '#e0d0a7', reliefShadow: '#b0a17f', snow: '#f7f1de',
    gold: '#8a6a35', legend: '#f1e6ca', legendInk: '#42382a', legendBorder: '#9b8a64',
    neutral: '#e5d8ba', unknown: '#ddd1b6', markers: '#4a3f30',
    vignette: 'rgba(74,58,36,.20)'
  },
  sepia: {
    id: 'sepia',
    paper: '#ded0b2', paperDark: '#c9b995', paperLight: '#eae0c8',
    seaTop: '#b1b7a1', seaMid: '#9ba289', seaBottom: '#8b917a', seaShallow: '#cfd0b4',
    land: '#e6d6b2', landWarm: '#efe2c2', landShade: '#cfbc95',
    ink: '#403528', inkSoft: '#6b5d48', inkFaint: '#907f66',
    coast: '#4d4130', river: '#6d7f6c',
    border: '#6f6049', grid: '#9e8d6b',
    veg: '#78805a', vegDeep: '#626a4b',
    reliefLight: '#dcc79f', reliefShadow: '#ab9875', snow: '#f5efdd',
    gold: '#86672f', legend: '#e9dbbb', legendInk: '#453a2b', legendBorder: '#95825c',
    neutral: '#dfd0af', unknown: '#d6c8ac', markers: '#4a3d2c',
    vignette: 'rgba(72,56,34,.22)'
  },
  night: {
    id: 'night',
    paper: '#1a282d', paperDark: '#101c21', paperLight: '#24343a',
    seaTop: '#152730', seaMid: '#11222a', seaBottom: '#0d1c23', seaShallow: '#3d5a62',
    land: '#2c3f3c', landWarm: '#394c45', landShade: '#22332f',
    ink: '#ddd4b6', inkSoft: '#b3b09a', inkFaint: '#8f9182',
    coast: '#0a1418', river: '#7fa6ad',
    border: '#c9c2a6', grid: '#55707a',
    veg: '#7d9b78', vegDeep: '#66845f',
    reliefLight: '#5d6f63', reliefShadow: '#16241f', snow: '#e9e7d4',
    gold: '#d3b573', legend: '#22343a', legendInk: '#e2d9bc', legendBorder: '#7e8c84',
    neutral: '#34463f', unknown: '#2c3d39', markers: '#e4dcc1',
    vignette: 'rgba(0,0,0,.45)'
  }
};

const BIOME_TONES = {
  1: '#ded2ab', 2: '#cfcaaf', 3: '#cdcba4', 4: '#c8c8a4', 5: '#bec5a0',
  6: '#b8c0a6', 7: '#aeb99f', 8: '#b3bca5', 9: '#b5b9a3', 10: '#c7c3b1',
  11: '#e8e6da', 12: '#b6bdaa', 13: '#c1baa8', 14: '#c0b6a4', 15: '#c0ac9e',
  16: '#c6bca4'
};

const FOREST_BIOMES = new Set([5, 6, 7, 8, 9]);
const GRASS_BIOMES = new Set([3, 4, 10]);
const DRY_BIOMES = new Set([1, 2]);
const MARSH_BIOMES = new Set([12]);
const DEAD_BIOMES = new Set([13]);
const WASTE_BIOMES = new Set([14]);

const GOOD_COLORS = {0: '#59636a', 1: '#508268', 2: '#9d968c', 3: '#cbc5b8', 4: '#899cae', 5: '#c2875c', 6: '#8bbdb8', 7: '#c9d8e8', 8: '#e3bb50', 9: '#bbc369', 10: '#c6a782', 11: '#71b8d6', 12: '#83986c', 34: '#575267', 53: '#6395be', 58: '#b5a187', 59: '#be736a', 72: '#d8cfb6', 73: '#b9ad97', 74: '#b15c51', 75: '#d17656', 76: '#c48c65', 77: '#a580d0'};

/* ---------------------------------------------------------------- utilidades */

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function hexRgb(hex) {
  let h = String(hex || '#888888').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) h = '888888';
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgb = c => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
const hexA = (hex, a) => rgba(hexRgb(hex), a);
const css = c => typeof c === 'string' ? c : rgb(c);

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  const hue = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 0.5) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
}

function mute(hex, sat = 0.34, lo = 0.64, hi = 0.74) {
  const [h, s, l] = rgbToHsl(hexRgb(hex));
  return hslToRgb(h, Math.min(s, sat), clamp(l, lo, hi));
}

function themeMix(pal, terrain) {
  if (pal.id === 'night') return terrain ? 0.82 : 0.58;
  return terrain ? 0.26 : 0.22;
}

function poiModeOf(opts) {
  if (opts.pois === false || opts.pois === 'none') return 'none';
  return opts.pois === 'natural' ? 'natural' : 'all';
}

function labelInkOf(opts, pal, soft) {
  if (opts.labelInk) return hexRgb(opts.labelInk);
  return labelColor(pal, opts.labelTone, soft);
}

function labelColor(pal, tone, soft) {
  const base = hexRgb(soft ? pal.inkSoft : pal.ink);
  if (tone === 'soft') return base;
  if (!tone) tone = 'dark';
  const target = pal.id === 'night' ? [255, 255, 255] : [10, 14, 14];
  return mix(base, target, tone === 'black' ? 0.82 : 0.6);
}

function hash01(n) {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 2246822507) >>> 0;
  x ^= x >>> 13; x = Math.imul(x, 3266489909) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function niceNumber(value) {
  const exp = Math.floor(Math.log10(value)), base = value / Math.pow(10, exp);
  const step = base >= 5 ? 5 : base >= 2 ? 2 : 1;
  return step * Math.pow(10, exp);
}

/* ---------------------------------------------------------------- mundo */

function stitch(edges, vx, vy) {
  const adj = new Map(), used = new Set(), loops = [];
  const key = (a, b) => a < b ? a + ':' + b : b + ':' + a;
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  }
  for (const [start, list] of adj) {
    for (const first of list) {
      if (used.has(key(start, first))) continue;
      const ids = [start];
      used.add(key(start, first));
      let cur = first, closed = false, guard = 0;
      while (guard++ < 300000) {
        if (cur === start) { closed = true; break; }
        ids.push(cur);
        const next = (adj.get(cur) || []).find(n => !used.has(key(cur, n)));
        if (next === undefined) break;
        used.add(key(cur, next));
        cur = next;
      }
      if (ids.length > 1) loops.push({points: ids.map(i => [vx[i], vy[i]]), ids, closed});
    }
  }
  // nenhuma aresta pode ficar de fora (o traçado precisa ser contínuo)
  for (const [a, b] of edges) {
    if (!used.has(key(a, b))) loops.push({points: [[vx[a], vy[a]], [vx[b], vy[b]]], ids: [a, b], closed: false});
  }
  return loops;
}

function smoothPoints(points, closed, passes = 4) {
  let pts = points;
  for (let pass = 0; pass < passes; pass++) {
    const out = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      if (!closed && (i === 0 || i === n - 1)) { out.push(pts[i]); continue; }
      const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
      out.push([a[0] * 0.25 + b[0] * 0.5 + c[0] * 0.25, a[1] * 0.25 + b[1] * 0.5 + c[1] * 0.25]);
    }
    pts = out;
  }
  return pts;
}

function wobblePoints(points, closed, amp, seed) {
  const n = points.length, out = [];
  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) { out.push(points[i]); continue; }
    const prev = points[(i - 1 + n) % n], next = points[(i + 1) % n];
    let tx = next[0] - prev[0], ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len, ny = tx / len;
    const wave = 0.65 * Math.sin(i * 0.42 + seed) + 0.35 * (hash01(seed + i * 7) - 0.5) * 2;
    out.push([points[i][0] + nx * amp * wave, points[i][1] + ny * amp * wave]);
  }
  return out;
}

function smoothLoop(loop, iterations = 1) {
  let points = loop.points;
  if (points.length < 5) return loop;
  for (let it = 0; it < iterations; it++) {
    const out = [], n = points.length;
    if (!loop.closed) out.push(points[0]);
    const last = loop.closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p = points[i], q = points[(i + 1) % n];
      out.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25]);
      out.push([p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]);
    }
    if (!loop.closed) out.push(points[n - 1]);
    points = out;
  }
  return {points, closed: loop.closed};
}

function prepareWorld(D) {
  const cols = D.grid.columns, rows = D.grid.rows, n = D.cells.length;
  const h = new Float32Array(n), land = new Uint8Array(n);
  for (let i = 0; i < n; i++) { h[i] = D.cells[i].h; land[i] = h[i] >= 20 ? 1 : 0; }
  const vx = new Float32Array(D.vertices.length), vy = new Float32Array(D.vertices.length);
  for (let i = 0; i < D.vertices.length; i++) { vx[i] = D.vertices[i].p[0]; vy[i] = D.vertices[i].p[1]; }
  // O array `c` das células de borda vem truncado no world.json; a vizinhança
  // confiável de cada aresta é a célula que compartilha os dois vértices dela.
  const vCells = new Array(D.vertices.length);
  for (let i = 0; i < D.vertices.length; i++) vCells[i] = D.vertices[i].c;
  function edgeNeighbour(c, k) {
    const a = c.v[k], b = c.v[(k + 1) % c.v.length];
    const list = vCells[a];
    for (let j = 0; j < list.length; j++) {
      const id = list[j];
      if (id !== c.i && vCells[b].indexOf(id) >= 0) return id;
    }
    return -1;
  }

  // lagos: massas de água que não tocam a borda do mapa
  const comp = new Int32Array(n).fill(-1), lake = new Uint8Array(n), groups = [];
  for (const c of D.cells) {
    if (c.h >= 20 || comp[c.i] >= 0) continue;
    const id = groups.length, list = [c.i];
    groups.push(list); comp[c.i] = id;
    for (let q = 0; q < list.length; q++) {
      for (const nb of D.cells[list[q]].c) {
        if (D.cells[nb].h < 20 && comp[nb] < 0) { comp[nb] = id; list.push(nb); }
      }
    }
  }
  for (let id = 0; id < groups.length; id++) {
    let touches = false;
    for (const cell of groups[id]) {
      const col = cell % cols, row = (cell / cols) | 0;
      if (col === 0 || col === cols - 1 || row === 0 || row === rows - 1) { touches = true; break; }
    }
    if (!touches) for (const cell of groups[id]) lake[cell] = 1;
  }

  const coastEdges = [], lakeEdges = [], stateEdges = [], neighbours = new Array(n);
  for (const c of D.cells) {
    const edgeCells = new Int32Array(c.v.length).fill(-1);
    neighbours[c.i] = edgeCells;
    for (let k = 0; k < c.v.length; k++) {
      const nb = edgeNeighbour(c, k);
      edgeCells[k] = nb;
      if (nb < 0) continue;
      const same = !!land[c.i] === !!land[nb];
      if (!same) {
        if (!land[c.i]) continue;
        const a = c.v[k], b = c.v[(k + 1) % c.v.length];
        if (lake[nb]) lakeEdges.push([a, b]); else coastEdges.push([a, b]);
      } else if (land[c.i] && nb > c.i && D.cells[nb].state !== c.state) {
        const a = c.v[k], b = c.v[(k + 1) % c.v.length];
        stateEdges.push([a, b]);
      }
    }
  }

  // distância à costa (para a sombra de sopé)
  const coastDist = new Int16Array(n).fill(3000);
  const queue = [];
  for (const c of D.cells) {
    if (!land[c.i]) continue;
    for (const nb of c.c) if (!land[nb]) { coastDist[c.i] = 0; queue.push(c.i); break; }
  }
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    for (const nb of D.cells[i].c) {
      if (land[nb] && coastDist[nb] > coastDist[i] + 1) { coastDist[nb] = coastDist[i] + 1; queue.push(nb); }
    }
  }

  // picos para os glifos de montanha
  const candidates = [];
  for (const c of D.cells) {
    if (!land[c.i] || c.h < 48 || coastDist[c.i] < 2) continue;
    candidates.push(c.i);
  }
  candidates.sort((a, b) => h[b] - h[a]);
  const mountains = [], cellsAt = new Map();
  for (const id of candidates) {
    if (mountains.length > 720) break;
    const c = D.cells[id], x = c.p[0], y = c.p[1];
    const kx = Math.floor(x / 7), ky = Math.floor(y / 7);
    let near = false;
    for (let dx = -1; dx <= 1 && !near; dx++) for (let dy = -1; dy <= 1; dy++) {
      const arr = cellsAt.get((kx + dx) + ',' + (ky + dy));
      if (arr && arr.some(m => (m.x - x) ** 2 + (m.y - y) ** 2 < 40)) { near = true; break; }
    }
    if (near) continue;
    const m = {x, y, h: h[id]};
    mountains.push(m);
    const key = kx + ',' + ky;
    if (!cellsAt.has(key)) cellsAt.set(key, []);
    cellsAt.get(key).push(m);
  }

  return {
    cols, rows, h, land, lake, coastDist, mountains, stateEdges, neighbours, vx, vy,
    coastLoops: stitch(coastEdges, vx, vy).map(loop => smoothLoop(loop, 1)),
    lakeLoops: stitch(lakeEdges, vx, vy).map(loop => smoothLoop(loop, 1)),
    stateChains: stitch(stateEdges, vx, vy).map(loop => {
      // uma leve irregularidade por vértice, a mesma nos dois lados da fronteira
      const jittered = loop.ids.map(id => [
        vx[id] + (hash01(id * 17 + 3) - 0.5) * 2.8,
        vy[id] + (hash01(id * 29 + 7) - 0.5) * 2.8
      ]);
      let pts = smoothPoints(jittered, loop.closed, 5);
      pts = wobblePoints(pts, loop.closed, 1.1, hash01(loop.ids[0] * 13) * 6.28);
      return {points: pts, closed: loop.closed};
    })
  };
}

/* ---------------------------------------------------------------- desenho base */

function drawSea(ctx, rect, s, pal, seed) {
  const R = rng(seed ^ 0x51ea);
  ctx.save();
  ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w * 0.85, rect.y + rect.h);
  g.addColorStop(0, pal.seaTop); g.addColorStop(0.52, pal.seaMid); g.addColorStop(1, pal.seaBottom);
  ctx.fillStyle = g; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  // manchas de aguarela
  for (let i = 0; i < 90; i++) {
    const x = rect.x + R() * rect.w, y = rect.y + R() * rect.h, r = (24 + R() * 120) * s;
    const light = R() > 0.45;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, light ? hexA(pal.seaShallow, 0.075) : hexA(pal.seaBottom, 0.08));
    rg.addColorStop(1, light ? hexA(pal.seaShallow, 0) : hexA(pal.seaBottom, 0));
    ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // bordas mais fundas
  const edge = ctx.createRadialGradient(rect.x + rect.w * 0.5, rect.y + rect.h * 0.48, Math.min(rect.w, rect.h) * 0.32, rect.x + rect.w * 0.5, rect.y + rect.h * 0.5, Math.max(rect.w, rect.h) * 0.62);
  edge.addColorStop(0, hexA(pal.seaBottom, 0));
  edge.addColorStop(1, hexA(pal.seaBottom, 0.22));
  ctx.fillStyle = edge; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // marolas discretas
  ctx.strokeStyle = hexA(pal.paperLight, 0.10);
  ctx.lineWidth = 0.8 * s;
  for (let i = 0; i < 150; i++) {
    const x = rect.x + R() * rect.w, y = rect.y + R() * rect.h, w = (8 + R() * 22) * s;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 0.5, y - 2.2 * s, x, y);
    ctx.quadraticCurveTo(x + w * 0.5, y + 2.2 * s, x + w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCoastBands(ctx, loops, scale, mx, my, s, pal) {
  // bandas de água rasa desenhadas antes da terra: a metade de dentro fica coberta
  const path = new Path2D();
  for (const loop of loops) {
    const pts = loop.points;
    path.moveTo(mx + pts[0][0] * scale, my + pts[0][1] * scale);
    for (let i = 1; i < pts.length; i++) path.lineTo(mx + pts[i][0] * scale, my + pts[i][1] * scale);
    if (loop.closed) path.closePath();
  }
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const bands = [[26 * s, 0.10], [13 * s, 0.16], [5 * s, 0.22]];
  for (const [width, alpha] of bands) {
    ctx.strokeStyle = hexA(pal.seaShallow, alpha);
    ctx.lineWidth = width;
    ctx.stroke(path);
  }
  ctx.restore();
  return path;
}

function drawCoastInk(ctx, coastPath, s, pal) {
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = hexA(pal.coast, 0.18);
  ctx.lineWidth = 6 * s;
  ctx.stroke(coastPath);
  ctx.strokeStyle = pal.coast;
  ctx.lineWidth = 1.5 * s;
  ctx.stroke(coastPath);
  ctx.restore();
}

function drawCoastRipples(ctx, loops, land, cols, rows, stepX, stepY, mx, my, scale, s, pal) {
  const landAt = (x, y) => {
    const col = Math.floor(x / stepX), row = Math.floor(y / stepY);
    if (col < 0 || row < 0 || col >= cols || row >= rows) return false;
    return !!land[row * cols + col];
  };
  ctx.save();
  ctx.lineJoin = 'round';
  for (const [distance, alpha] of [[4.2, 0.24], [8.4, 0.13], [13, 0.07]]) {
    const path = new Path2D();
    for (const loop of loops) {
      const pts = loop.points, n = pts.length;
      if (n < 3) continue;
      let started = false;
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const prev = loop.closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
        const next = loop.closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
        let tx = next[0] - prev[0], ty = next[1] - prev[1];
        const len = Math.hypot(tx, ty) || 1;
        tx /= len; ty /= len;
        let nx = -ty, ny = tx;
        if (landAt(p[0] + nx * distance, p[1] + ny * distance)) { nx = -nx; ny = -ny; }
        const x = mx + (p[0] + nx * distance) * scale, y = my + (p[1] + ny * distance) * scale;
        if (!started) { path.moveTo(x, y); started = true; } else path.lineTo(x, y);
      }
      if (loop.closed) path.closePath();
    }
    ctx.strokeStyle = hexA(pal.seaBottom, alpha);
    ctx.lineWidth = 0.6 * s;
    ctx.stroke(path);
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- glifos */

function treeGlyph(ctx, x, y, size, kind, R, pal, alpha = 1) {
  const ink = hexA(pal.vegDeep, 0.62 * alpha), leaf = hexA(pal.veg, 0.42 * alpha);
  ctx.save();
  ctx.lineWidth = Math.max(0.35, size * 0.11);
  ctx.strokeStyle = ink;
  ctx.fillStyle = leaf;
  ctx.lineJoin = 'round';
  if (kind === 'conifer') {
    const hh = size * 1.15, ww = size * 0.42;
    ctx.fillStyle = hexA(pal.vegDeep, 0.55 * alpha);
    ctx.beginPath();
    ctx.moveTo(x, y - hh); ctx.lineTo(x + ww, y + hh * 0.25); ctx.lineTo(x - ww, y + hh * 0.25); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexA(pal.vegDeep, 0.5 * alpha);
    ctx.lineWidth = Math.max(0.25, size * 0.07);
    ctx.stroke();
  } else if (kind === 'acacia') {
    ctx.beginPath(); ctx.moveTo(x, y + size * 0.7); ctx.lineTo(x, y - size * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - size * 0.18, size * 0.62, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  } else if (kind === 'palm') {
    ctx.beginPath(); ctx.moveTo(x, y + size * 0.8); ctx.quadraticCurveTo(x + size * 0.15, y, x, y - size * 0.35); ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.5;
      ctx.beginPath(); ctx.moveTo(x, y - size * 0.35);
      ctx.quadraticCurveTo(x + Math.cos(a) * size * 0.55, y - size * 0.35 + Math.sin(a) * size * 0.55, x + Math.cos(a) * size * 0.95, y - size * 0.2 + Math.sin(a) * size * 0.85);
      ctx.stroke();
    }
  } else if (kind === 'dead') {
    ctx.beginPath(); ctx.moveTo(x, y + size * 0.75); ctx.lineTo(x, y - size * 0.4); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.15); ctx.lineTo(x - size * 0.45, y - size * 0.55);
    ctx.moveTo(x, y - size * 0.28); ctx.lineTo(x + size * 0.42, y - size * 0.62);
    ctx.stroke();
  } else if (kind === 'swamp') {
    ctx.lineWidth = Math.max(0.3, size * 0.09);
    for (let i = 0; i < 3; i++) {
      const dx = (i - 1) * size * 0.5;
      ctx.beginPath(); ctx.moveTo(x + dx, y + size * 0.5); ctx.lineTo(x + dx, y - size * 0.5); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x - size * 0.7, y + size * 0.1); ctx.lineTo(x + size * 0.7, y + size * 0.1); ctx.stroke();
  } else {
    // folhosa: três copas sobrepostas
    ctx.beginPath(); ctx.arc(x - size * 0.34, y + size * 0.12, size * 0.36, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + size * 0.34, y + size * 0.1, size * 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - size * 0.26, size * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y + size * 0.75); ctx.lineTo(x, y + size * 0.2); ctx.stroke();
  }
  ctx.restore();
}

function mountainGlyph(ctx, x, y, size, R, pal, alpha = 1, snow = false) {
  const peaks = 1 + (size > 8 ? Math.floor(R() * 2) : 0);
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (let i = 0; i < peaks; i++) {
    const px = x + (i - (peaks - 1) / 2) * size * 0.9 + (R() - 0.5) * size * 0.3;
    const base = y + (R() - 0.5) * size * 0.2;
    const hh = size * (0.85 + R() * 0.45), ww = size * (0.55 + R() * 0.25);
    const tipx = px + (R() - 0.5) * size * 0.18;
    ctx.beginPath();
    ctx.moveTo(px - ww, base);
    ctx.quadraticCurveTo(px - ww * 0.35, base - hh * 0.42, tipx, base - hh);
    ctx.quadraticCurveTo(px + ww * 0.4, base - hh * 0.4, px + ww, base);
    ctx.closePath();
    ctx.fillStyle = rgba(mix(hexRgb(pal.reliefLight), hexRgb(pal.inkSoft), 0.3), 0.9 * alpha);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tipx, base - hh);
    ctx.quadraticCurveTo(px + ww * 0.4, base - hh * 0.4, px + ww, base);
    ctx.lineTo(px + ww * 0.05, base);
    ctx.closePath();
    ctx.fillStyle = rgba(mix(hexRgb(pal.reliefShadow), hexRgb(pal.ink), 0.3), 0.6 * alpha);
    ctx.fill();
    if (snow) {
      ctx.beginPath();
      ctx.moveTo(tipx, base - hh);
      ctx.lineTo(tipx - ww * 0.22, base - hh * 0.75);
      ctx.lineTo(tipx + ww * 0.24, base - hh * 0.77);
      ctx.closePath();
      ctx.fillStyle = hexA(pal.snow, 0.9 * alpha);
      ctx.fill();
    }
    ctx.strokeStyle = hexA(pal.ink, 0.72 * alpha);
    ctx.lineWidth = Math.max(0.45, size * 0.09);
    ctx.stroke();
    // hachura de encosta apenas nos picos maiores
    if (size > 7) {
      ctx.strokeStyle = hexA(pal.ink, 0.18 * alpha);
      ctx.lineWidth = Math.max(0.3, size * 0.04);
      for (let k = 0; k < 3; k++) {
        const t = 0.25 + k * 0.2;
        ctx.beginPath();
        ctx.moveTo(px + ww * t, base - hh * 0.55 * (1 - t));
        ctx.lineTo(px + ww * (t + 0.22), base - hh * 0.55 * (1 - t - 0.12));
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

function duneGlyph(ctx, x, y, size, pal, alpha = 1) {
  ctx.save();
  ctx.strokeStyle = hexA(pal.inkSoft, 0.26 * alpha);
  ctx.lineWidth = Math.max(0.3, size * 0.08);
  ctx.beginPath();
  ctx.moveTo(x - size, y + size * 0.2);
  ctx.quadraticCurveTo(x - size * 0.2, y - size * 0.7, x + size, y + size * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - size * 0.4, y + size * 0.45);
  ctx.quadraticCurveTo(x + size * 0.2, y - size * 0.15, x + size * 0.9, y + size * 0.4);
  ctx.stroke();
  ctx.restore();
}

function poiGlyph(ctx, kind, x, y, size, pal, alpha = 1) {
  ctx.save();
  ctx.strokeStyle = hexA(pal.inkSoft, 0.8 * alpha);
  ctx.fillStyle = hexA(pal.inkSoft, 0.55 * alpha);
  ctx.lineWidth = Math.max(0.35, size * 0.12);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const S = size;
  switch (kind) {
    case 'montanha': {
      ctx.beginPath();
      ctx.moveTo(x - S, y + S * 0.6); ctx.lineTo(x, y - S * 0.9); ctx.lineTo(x + S, y + S * 0.6);
      ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - S * 0.2, y - S * 0.1); ctx.lineTo(x + S * 0.2, y + S * 0.6); ctx.stroke();
      break;
    }
    case 'floresta': case 'bioma': {
      ctx.beginPath(); ctx.moveTo(x, y + S * 0.7); ctx.lineTo(x, y - S * 0.1); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y - S * 0.35, S * 0.55, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'floresta morta': {
      ctx.beginPath(); ctx.moveTo(x, y + S * 0.7); ctx.lineTo(x, y - S * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - S * 0.1); ctx.lineTo(x - S * 0.5, y - S * 0.6);
      ctx.moveTo(x, y - S * 0.25); ctx.lineTo(x + S * 0.5, y - S * 0.7); ctx.stroke();
      break;
    }
    case 'lago': {
      ctx.beginPath();
      ctx.moveTo(x - S, y); ctx.quadraticCurveTo(x - S * 0.4, y - S * 0.5, x, y);
      ctx.quadraticCurveTo(x + S * 0.4, y + S * 0.5, x + S, y); ctx.stroke();
      break;
    }
    case 'mar': case 'baía': {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x - S, y + i * S * 0.4);
        ctx.quadraticCurveTo(x - S * 0.4, y + i * S * 0.4 - S * 0.3, x, y + i * S * 0.4);
        ctx.quadraticCurveTo(x + S * 0.4, y + i * S * 0.4 + S * 0.3, x + S, y + i * S * 0.4);
        ctx.stroke();
      }
      break;
    }
    case 'ilha': {
      ctx.beginPath(); ctx.ellipse(x, y, S * 0.9, S * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - S * 1.2, y + S * 0.65); ctx.lineTo(x + S * 1.2, y + S * 0.65); ctx.stroke();
      break;
    }
    case 'ruínas': {
      ctx.beginPath(); ctx.moveTo(x - S * 0.8, y + S * 0.7); ctx.lineTo(x - S * 0.8, y - S * 0.4);
      ctx.lineTo(x - S * 0.2, y - S * 0.8); ctx.lineTo(x + S * 0.4, y - S * 0.35);
      ctx.lineTo(x + S * 0.4, y + S * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + S * 0.7, y + S * 0.7); ctx.lineTo(x + S * 0.7, y + S * 0.1); ctx.stroke();
      break;
    }
    case 'pântano': {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(x + i * S * 0.45, y + S * 0.55); ctx.lineTo(x + i * S * 0.45, y - S * 0.45); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(x - S * 0.9, y + S * 0.15); ctx.lineTo(x + S * 0.9, y + S * 0.15); ctx.stroke();
      break;
    }
    case 'deserto': {
      ctx.beginPath(); ctx.moveTo(x - S, y + S * 0.3);
      ctx.quadraticCurveTo(x - S * 0.2, y - S * 0.6, x + S, y + S * 0.25); ctx.stroke();
      break;
    }
    case 'vulcão': {
      ctx.beginPath(); ctx.moveTo(x - S, y + S * 0.65); ctx.lineTo(x - S * 0.18, y - S * 0.8);
      ctx.lineTo(x + S * 0.18, y - S * 0.8); ctx.lineTo(x + S, y + S * 0.65); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - S); ctx.quadraticCurveTo(x + S * 0.4, y - S * 1.4, x + S * 0.1, y - S * 1.7); ctx.stroke();
      break;
    }
    case 'desfiladeiro': {
      ctx.beginPath(); ctx.moveTo(x - S, y + S * 0.2); ctx.lineTo(x - S * 0.4, y - S * 0.6);
      ctx.lineTo(x, y + S * 0.05); ctx.lineTo(x + S * 0.45, y - S * 0.6); ctx.lineTo(x + S, y + S * 0.25); ctx.stroke();
      break;
    }
    case 'campinas': {
      for (let i = 0; i < 3; i++) {
        const dx = (i - 1) * S * 0.5;
        ctx.beginPath(); ctx.moveTo(x + dx, y + S * 0.5); ctx.lineTo(x + dx - S * 0.2, y - S * 0.35); ctx.stroke();
      }
      break;
    }
    case 'mansão': case 'povoado': case 'localidade': {
      ctx.beginPath(); ctx.rect(x - S * 0.6, y - S * 0.35, S * 1.2, S * 1.05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - S * 0.8, y - S * 0.4); ctx.lineTo(x, y - S * 0.95); ctx.lineTo(x + S * 0.8, y - S * 0.4); ctx.stroke();
      break;
    }
    default: {
      ctx.beginPath(); ctx.arc(x, y, S * 0.55, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - S); ctx.lineTo(x, y - S * 0.55); ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- texto e etiquetas */

function setFont(ctx, size, weight, italic) {
  ctx.font = `${italic ? 'italic ' : ''}${weight || 400} ${size}px ${FONT}`;
}

function trackedWidth(ctx, text, tracking) {
  const chars = [...text];
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width;
  return w + tracking * Math.max(0, chars.length - 1);
}

function drawTracked(ctx, text, x, y, opt) {
  const {size, tracking = 0, weight = 400, italic = false, color = '#000', alpha = 1, align = 'center', halo = null, rotate = 0} = opt;
  ctx.save();
  ctx.translate(x, y);
  if (rotate) ctx.rotate(rotate);
  setFont(ctx, size, weight, italic);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const chars = [...text], widths = [];
  let total = 0;
  for (const ch of chars) { const w = ctx.measureText(ch).width; widths.push(w); total += w; }
  total += tracking * Math.max(0, chars.length - 1);
  let cx = align === 'center' ? -total / 2 : align === 'right' ? -total : 0;
  ctx.globalAlpha = alpha;
  if (halo) {
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = halo.width; ctx.strokeStyle = halo.color;
  }
  for (let i = 0; i < chars.length; i++) {
    if (halo) ctx.strokeText(chars[i], cx, 0);
    ctx.fillStyle = color;
    ctx.fillText(chars[i], cx, 0);
    cx += widths[i] + tracking;
  }
  ctx.restore();
  return total;
}

function bbox(x, y, w, h, rotate) {
  const c = Math.abs(Math.cos(rotate)), s = Math.abs(Math.sin(rotate));
  const bw = w * c + h * s, bh = w * s + h * c;
  return {x0: x - bw / 2, y0: y - bh / 2, x1: x + bw / 2, y1: y + bh / 2};
}

function createBoard(rect, pad = 3) {
  const boxes = [];
  const hit = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  return {
    rect,
    reserve(box) { boxes.push(box); },
    reservePx(x, y, w, h) { boxes.push({x0: x, y0: y, x1: x + w, y1: y + h}); },
    fits(box) {
      return box.x0 >= rect.x + pad && box.y0 >= rect.y + pad && box.x1 <= rect.x + rect.w - pad && box.y1 <= rect.y + rect.h - pad && !boxes.some(b => hit(box, b));
    },
    add(box) { boxes.push(box); },
    overlapScore(box) {
      let score = 0;
      for (const b of boxes) {
        const w = Math.min(box.x1, b.x1) - Math.max(box.x0, b.x0);
        const h = Math.min(box.y1, b.y1) - Math.max(box.y0, b.y0);
        if (w > 0 && h > 0) score += w * h;
      }
      return score;
    }
  };
}

/* ---------------------------------------------------------------- marcas e rótulos */

function drawCityMarker(ctx, x, y, s, pal, kind) {
  ctx.save();
  if (kind === 'capital') {
    ctx.beginPath(); ctx.arc(x, y, 4.6 * s, 0, Math.PI * 2);
    ctx.strokeStyle = hexA(pal.ink, 0.7); ctx.lineWidth = 1.1 * s; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 2.5 * s, 0, Math.PI * 2);
    ctx.fillStyle = pal.ink; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 0.9 * s, 0, Math.PI * 2);
    ctx.fillStyle = pal.gold; ctx.fill();
  } else if (kind === 'major') {
    ctx.beginPath(); ctx.arc(x, y, 2.3 * s, 0, Math.PI * 2);
    ctx.fillStyle = pal.ink; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 0.75 * s, 0, Math.PI * 2);
    ctx.fillStyle = pal.landWarm; ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(x, y, 1.35 * s, 0, Math.PI * 2);
    ctx.fillStyle = hexA(pal.ink, 0.72); ctx.fill();
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- legenda */

function wrapLabel(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let out = text;
  while (out.length > 2 && ctx.measureText(out + '…').width > max) out = out.slice(0, -1);
  return out + '…';
}

function legendMetrics(ctx, model, s) {
  const entries = model.entries || [];
  const fs = 9 * s, rowH = 15 * s, pad = 11 * s, sw = 10 * s;
  const cols = entries.length > 12 ? 2 : 1;
  setFont(ctx, fs, 400, false);
  let widest = 0;
  for (const e of entries) widest = Math.max(widest, ctx.measureText(e.label).width);
  const maxLabel = Math.min(132 * s, Math.max(48 * s, widest));
  const colW = sw + 7 * s + maxLabel;
  setFont(ctx, 7.4 * s, 400, true);
  const noteW = model.note ? ctx.measureText(model.note).width : 0;
  setFont(ctx, 10 * s, 600, false);
  const titleW = trackedWidth(ctx, model.title || 'LEGENDA', 1.6 * s);
  const headerW = Math.min(320 * s, Math.max(noteW, titleW, 48 * s));
  const width = Math.max(model.ramp ? 196 * s : 0, entries.length === 0 ? 150 * s : 0, pad * 2 + headerW, pad * 2 + cols * colW + (cols - 1) * 12 * s);
  const rows = Math.ceil(entries.length / cols);
  const headerH = 26 * s + (model.note ? 13 * s : 0);
  const rampH = model.ramp ? 30 * s : 0;
  const height = pad * 2 + headerH + rampH + rows * rowH;
  return {entries, fs, rowH, pad, sw, cols, width, rows, headerH, rampH, height, maxLabel, colW};
}

function drawLegend(ctx, model, x, yTop, s, pal) {
  const m = legendMetrics(ctx, model, s);
  const {entries, fs, rowH, pad, sw, cols, rows, maxLabel, colW, rampH} = m;
  const width = m.width, height = m.height;
  const x0 = x, y0 = yTop;

  ctx.save();
  ctx.fillStyle = hexA(pal.legend, 0.94);
  ctx.strokeStyle = hexA(pal.legendBorder, 0.8);
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x0, y0, width, height, 2 * s); else ctx.rect(x0, y0, width, height);
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = hexA(pal.legendBorder, 0.35);
  ctx.strokeRect(x0 + 3 * s, y0 + 3 * s, width - 6 * s, height - 6 * s);

  drawTracked(ctx, model.title || 'LEGENDA', x0 + pad, y0 + pad + 5 * s, {
    size: 10 * s, tracking: 1.6 * s, weight: 600, color: pal.legendInk, align: 'left'
  });
  if (model.note) {
    drawTracked(ctx, model.note, x0 + pad, y0 + pad + 18 * s, {
      size: 7.4 * s, tracking: 0.15 * s, italic: true, color: pal.inkSoft, align: 'left', alpha: 0.9
    });
  }
  const top = y0 + pad + m.headerH;
  if (model.ramp) {
    const barW = width - pad * 2, barX = x0 + pad, barY = top + 3 * s, barH = 8 * s;
    const max = model.ramp.max || 1;
    const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    for (let i = 0; i <= 5; i++) grad.addColorStop(i / 5, rgb(populationColor(max * i / 5, max).map(v => v * 255)));
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = hexA(pal.legendBorder, 0.5); ctx.lineWidth = 0.6 * s;
    ctx.strokeRect(barX, barY, barW, barH);
    drawTracked(ctx, '0', barX, barY + barH + 8 * s, {size: 7.2 * s, color: pal.inkSoft, align: 'left'});
    drawTracked(ctx, Math.round(max).toLocaleString('pt-BR'), barX + barW, barY + barH + 8 * s, {size: 7.2 * s, color: pal.inkSoft, align: 'right'});
    drawTracked(ctx, 'habitantes', barX + barW / 2, barY + barH + 8 * s, {size: 7.2 * s, italic: true, color: pal.inkFaint, align: 'center'});
  }
  for (let i = 0; i < entries.length; i++) {
    const col = Math.floor(i / rows), row = i % rows;
    const ex = x0 + pad + col * (colW + 12 * s);
    const ey = top + m.rampH + row * rowH;
    const e = entries[i];
    const cy = ey + rowH / 2;
    if (e.sample) {
      drawLegendSample(ctx, e.sample, ex + sw / 2, cy, s, pal, e.color);
    } else {
      ctx.fillStyle = css(e.color || pal.neutral);
      ctx.strokeStyle = hexA(pal.legendBorder, 0.55);
      ctx.lineWidth = 0.6 * s;
      ctx.beginPath();
      ctx.rect(ex, cy - 4 * s, sw, 8 * s);
      ctx.fill(); ctx.stroke();
    }
    setFont(ctx, fs, 400, false);
    drawTracked(ctx, wrapLabel(ctx, e.label, maxLabel), ex + sw + 7 * s, cy, {
      size: fs, tracking: 0.1 * s, color: pal.legendInk, align: 'left'
    });
  }
  ctx.restore();
  return {x: x0, y: y0, w: width, h: height};
}

function drawLegendSample(ctx, kind, x, y, s, pal, color) {
  ctx.save();
  if (kind === 'shade') {
    const g = ctx.createLinearGradient(x - 6 * s, y - 4 * s, x + 6 * s, y + 4 * s);
    g.addColorStop(0, '#efe9d7'); g.addColorStop(0.45, '#b9b5a2'); g.addColorStop(0.72, '#8b8f82'); g.addColorStop(1, '#d9d4c3');
    ctx.fillStyle = g;
    ctx.fillRect(x - 6 * s, y - 4 * s, 12 * s, 8 * s);
    ctx.strokeStyle = 'rgba(60,60,50,.35)';
    ctx.lineWidth = 0.6 * s;
    ctx.strokeRect(x - 6 * s, y - 4 * s, 12 * s, 8 * s);
  } else if (kind === 'mountain') mountainGlyph(ctx, x, y + 3 * s, 5.5 * s, rng(7), pal, 1);
  else if (kind === 'tree') treeGlyph(ctx, x, y + 2.5 * s, 4.4 * s, 'deciduous', rng(3), pal, 1);
  else if (kind === 'conifer') treeGlyph(ctx, x, y + 2.5 * s, 4.4 * s, 'conifer', rng(5), pal, 1);
  else if (kind === 'capital') drawCityMarker(ctx, x, y, s * 1.15, pal, 'capital');
  else if (kind === 'city') drawCityMarker(ctx, x, y, s * 1.15, pal, 'major');
  else if (kind === 'poi') poiGlyph(ctx, 'ruínas', x, y + 2 * s, 4.2 * s, pal);
  else if (kind === 'coast') {
    ctx.strokeStyle = pal.coast; ctx.lineWidth = 1.3 * s;
    ctx.beginPath(); ctx.moveTo(x - 6 * s, y); ctx.lineTo(x + 6 * s, y); ctx.stroke();
  } else if (kind === 'border') {
    ctx.strokeStyle = hexA(pal.border, 0.9); ctx.lineWidth = 1.1 * s; ctx.setLineDash([2.2 * s, 2.2 * s]);
    ctx.beginPath(); ctx.moveTo(x - 6 * s, y); ctx.lineTo(x + 6 * s, y); ctx.stroke();
  } else if (kind === 'river') {
    ctx.strokeStyle = hexA(pal.river, 0.9); ctx.lineWidth = 1.2 * s;
    ctx.beginPath(); ctx.moveTo(x - 6 * s, y); ctx.bezierCurveTo(x - 2 * s, y - 3 * s, x + 2 * s, y + 3 * s, x + 6 * s, y); ctx.stroke();
  } else {
    ctx.fillStyle = css(color || pal.neutral);
    ctx.fillRect(x - 5 * s, y - 4 * s, 10 * s, 8 * s);
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- móveis do mapa */

function drawFrame(ctx, W, H, s, pal) {
  ctx.save();
  const a = 9 * s, b = 18 * s;
  ctx.fillStyle = hexA(pal.paperDark, 0.35);
  ctx.fillRect(a, a, W - 2 * a, H - 2 * a);
  ctx.strokeStyle = hexA(pal.ink, 0.55); ctx.lineWidth = 0.9 * s;
  ctx.strokeRect(a, a, W - 2 * a, H - 2 * a);
  ctx.lineWidth = 1.6 * s; ctx.strokeStyle = hexA(pal.ink, 0.75);
  ctx.strokeRect(b, b, W - 2 * b, H - 2 * b);
  // cantos
  const c = 7 * s;
  for (const [x, y] of [[b, b], [W - b, b], [b, H - b], [W - b, H - b]]) {
    ctx.fillStyle = hexA(pal.gold, 0.75);
    ctx.beginPath();
    ctx.moveTo(x, y - c); ctx.lineTo(x + c, y); ctx.lineTo(x, y + c); ctx.lineTo(x - c, y);
    ctx.closePath(); ctx.fill();
  }
  // losangos nos meios
  for (const [x, y] of [[W / 2, b], [W / 2, H - b], [b, H / 2], [W - b, H / 2]]) {
    ctx.fillStyle = hexA(pal.gold, 0.6);
    ctx.beginPath();
    ctx.moveTo(x, y - 4 * s); ctx.lineTo(x + 4 * s, y); ctx.lineTo(x, y + 4 * s); ctx.lineTo(x - 4 * s, y);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawTitle(ctx, W, s, pal, title, subtitle, opts) {
  const center = W / 2;
  const scale = clamp(Number(opts.titleScale) || 1, 0.75, 1.6);
  const titleSize = 25 * s * scale;
  const titleTracking = 0.18 * titleSize;
  const subSize = 7.6 * s;
  const subTracking = 2.4 * s;
  const titleY = 46 * s;
  const subY = titleY + titleSize * 0.55 + 3 * s + subSize * 0.5;
  const ruleY = subY + 9 * s;
  const shownTitle = title.toUpperCase();
  if (opts.titleFrame) {
    setFont(ctx, titleSize, 600, false);
    const tw = trackedWidth(ctx, shownTitle, titleTracking);
    setFont(ctx, subSize, 400, false);
    const sw = trackedWidth(ctx, subtitle, subTracking);
    const fw = Math.max(tw, sw) + 44 * s;
    const fy = Math.max(17 * s, titleY - titleSize * 0.55 - 9 * s);
    const fh = ruleY - fy + 11 * s;
    const fx = center - fw / 2;
    ctx.save();
    ctx.fillStyle = hexA(pal.paperLight, 0.62);
    ctx.fillRect(fx, fy, fw, fh);
    ctx.strokeStyle = hexA(pal.ink, 0.55); ctx.lineWidth = 1.2 * s;
    ctx.strokeRect(fx, fy, fw, fh);
    ctx.strokeStyle = hexA(pal.gold, 0.7); ctx.lineWidth = 0.6 * s;
    ctx.strokeRect(fx + 4 * s, fy + 4 * s, fw - 8 * s, fh - 8 * s);
    ctx.fillStyle = hexA(pal.gold, 0.85);
    for (const [cx, cy] of [[fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh]]) {
      const r = 3.2 * s;
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  drawTracked(ctx, shownTitle, center, titleY, {
    size: titleSize, tracking: titleTracking, weight: 600, color: css(labelInkOf(opts, pal, false)), align: 'center', alpha: 0.97,
    halo: {width: Math.max(5 * s, titleSize * 0.28), color: hexA(pal.paperLight, 0.45)}
  });
  drawTracked(ctx, subtitle, center, subY, {
    size: subSize, tracking: subTracking, color: css(labelInkOf(opts, pal, true)), align: 'center', alpha: 0.92,
    halo: {width: 4 * s, color: hexA(pal.paperLight, 0.4)}
  });
  ctx.save();
  ctx.strokeStyle = hexA(pal.ink, 0.35); ctx.lineWidth = 0.8 * s;
  const half = 120 * s;
  ctx.beginPath(); ctx.moveTo(center - half, ruleY); ctx.lineTo(center - 8 * s, ruleY);
  ctx.moveTo(center + 8 * s, ruleY); ctx.lineTo(center + half, ruleY); ctx.stroke();
  ctx.fillStyle = hexA(pal.gold, 0.8);
  ctx.beginPath();
  ctx.moveTo(center, ruleY - 3.5 * s); ctx.lineTo(center + 3.5 * s, ruleY);
  ctx.lineTo(center, ruleY + 3.5 * s); ctx.lineTo(center - 3.5 * s, ruleY);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawCompass(ctx, cx, cy, R, s, pal) {
  ctx.save();
  ctx.translate(cx, cy);
  // rosa de 8 pontas
  const points = 8;
  for (let i = 0; i < points; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const long = i % 2 === 0;
    const len = long ? R : R * 0.62;
    const wid = long ? R * 0.13 : R * 0.09;
    const tipx = Math.cos(a) * len, tipy = Math.sin(a) * len;
    const bx = Math.cos(a + Math.PI / 2) * wid, by = Math.sin(a + Math.PI / 2) * wid;
    for (const side of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(tipx, tipy);
      ctx.lineTo(bx * side * 0.45, by * side * 0.45);
      ctx.closePath();
      ctx.fillStyle = side === 1 ? hexA(pal.ink, 0.82) : hexA(pal.ink, 0.28);
      ctx.fill();
      ctx.strokeStyle = hexA(pal.ink, 0.5); ctx.lineWidth = 0.5 * s; ctx.stroke();
    }
  }
  ctx.beginPath(); ctx.arc(0, 0, R * 1.06, 0, Math.PI * 2);
  ctx.strokeStyle = hexA(pal.ink, 0.65); ctx.lineWidth = 1.1 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R * 1.2, 0, Math.PI * 2);
  ctx.strokeStyle = hexA(pal.ink, 0.4); ctx.lineWidth = 0.7 * s; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = hexA(pal.gold, 0.9); ctx.fill();
  ctx.strokeStyle = hexA(pal.ink, 0.6); ctx.stroke();
  // marcas de grau
  for (let i = 0; i < 32; i++) {
    const a = i * Math.PI / 16, len = i % 4 === 0 ? R * 0.1 : R * 0.05;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * R * 1.06, Math.sin(a) * R * 1.06);
    ctx.lineTo(Math.cos(a) * (R * 1.06 + len), Math.sin(a) * (R * 1.06 + len));
    ctx.strokeStyle = hexA(pal.ink, 0.4); ctx.lineWidth = 0.55 * s; ctx.stroke();
  }
  drawTracked(ctx, 'N', 0, -R * 1.36, {size: 10 * s, tracking: 0.5 * s, weight: 600, color: pal.ink, align: 'center'});
  ctx.restore();
  return {x: cx - R * 1.3, y: cy - R * 1.55, w: R * 2.6, h: R * 3.1};
}

function drawScaleBar(ctx, xRight, y, s, pal, scaleKmPerUnit, pxPerUnit) {
  const target = 132 * s;
  let totalKm = niceNumber(Math.max(1, (target / Math.max(0.01, pxPerUnit)) * scaleKmPerUnit));
  let px = (totalKm / scaleKmPerUnit) * pxPerUnit;
  if (px > target * 1.6) { totalKm = Math.round(totalKm / 2); px = (totalKm / scaleKmPerUnit) * pxPerUnit; }
  const x = xRight - px, h = 3.6 * s;
  ctx.save();
  const segs = 4;
  for (let i = 0; i < segs; i++) {
    ctx.fillStyle = i % 2 === 0 ? hexA(pal.ink, 0.85) : hexA(pal.legend, 0.9);
    ctx.fillRect(x + (px / segs) * i, y, px / segs, h);
  }
  ctx.strokeStyle = hexA(pal.ink, 0.7); ctx.lineWidth = 0.7 * s;
  ctx.strokeRect(x, y, px, h);
  for (let i = 0; i <= segs; i++) {
    const lx = x + (px / segs) * i;
    ctx.beginPath(); ctx.moveTo(lx, y + h); ctx.lineTo(lx, y + h + 3 * s); ctx.stroke();
  }
  for (const [t, label] of [[0, '0'], [0.5, String(Math.round(totalKm / 2))], [1, String(totalKm) + ' km']]) {
    drawTracked(ctx, label, x + px * t, y + h + 9 * s, {size: 7.6 * s, tracking: 0.2 * s, color: pal.inkSoft, align: t === 0 ? 'left' : t === 1 ? 'right' : 'center'});
  }
  ctx.restore();
  return {x: x - 2 * s, y: y - 2 * s, w: px + 4 * s, h: h + 14 * s};
}

/* ---------------------------------------------------------------- sobreposições de papel */

function drawGrain(ctx, W, H, s, pal, seed) {
  const tile = 160;
  let grain = grainTile;
  if (!grain) {
    grain = grainTile = document.createElement('canvas');
    grain.width = grain.height = tile;
    const g = grain.getContext('2d');
    const img = g.createImageData(tile, tile);
    const R = rng(918273);
    for (let i = 0; i < tile * tile; i++) {
      const v = 118 + R() * 60;
      img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = pal.id === 'night' ? 0.09 : 0.2;
  const pattern = ctx.createPattern(grain, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

let grainTile = null;
let washTile = null;

function makeWash() {
  if (washTile) return washTile;
  const c = document.createElement('canvas');
  c.width = 72; c.height = 36;
  const g = c.getContext('2d');
  const img = g.createImageData(c.width, c.height);
  const R = rng(77123);
  for (let i = 0; i < c.width * c.height; i++) {
    const v = 116 + R() * 32;
    img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  washTile = c;
  return c;
}

function drawWash(ctx, W, H, pal) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = pal.id === 'night' ? 0.12 : 0.2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(makeWash(), 0, 0, W, H);
  ctx.restore();
}

function drawVignette(ctx, W, H, pal) {
  ctx.save();
  const g = ctx.createRadialGradient(W * 0.5, H * 0.47, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.72, 'rgba(0,0,0,0)');
  g.addColorStop(1, pal.vignette);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawStains(ctx, W, H, s, pal, seed) {
  const R = rng(seed ^ 0x9e37);
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const x = R() * W, y = R() * H, r = (40 + R() * 140) * s;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(pal.gold, 0.028));
    g.addColorStop(0.7, hexA(pal.paperDark, 0.03));
    g.addColorStop(1, hexA(pal.paperDark, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- cartógrafo */

export function createCartographer({D, cityName, stateName, getEconomy, getProvince, mapName}) {
  const art = prepareWorld(D);
  const cache = {society: null, population: null, economy: null, rasters: new Map()};
  const inhabitantsOf = b => inhabitants(D, b);

  const visibleCities = () => D.cities.filter(b => !b.excluded && b.visible !== false);

  function cellAtPoint(x, y) {
    const g = D.grid;
    if (!g) return -1;
    const col = clamp(Math.floor(x / g.stepX), 0, g.columns - 1);
    const row = clamp(Math.floor(y / g.stepY), 0, g.rows - 1);
    return row * g.columns + col;
  }

  // Recorte por estado ou província: células, caixa, vizinhança para os
  // elementos naturais que atravessam a fronteira.
  function resolveFocus(opts) {
    const raw = String(opts.focus || '');
    if (!raw) return null;
    const [kind, idText] = raw.split(':');
    const id = Number(idText);
    if (!Number.isFinite(id)) return null;
    let cells, name, stateId = null;
    if (kind === 'state') {
      const s = D.states.find(x => x.i === id);
      if (!s) return null;
      cells = D.cells.filter(c => art.land[c.i] && c.state === id);
      name = String(stateName ? stateName(s) : s.name).trim();
      stateId = id;
    } else if (kind === 'province') {
      const p = provinces();
      if (!p) return null;
      const pr = p.data.provinces.find(x => x.i === id);
      if (!pr) return null;
      cells = D.cells.filter(c => art.land[c.i] && p.provinceAt(c.i)?.i === id);
      name = String(pr.name).trim();
      stateId = pr.state;
    } else {
      return null;
    }
    if (!cells.length) return null;
    const set = new Set();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const c of cells) {
      set.add(c.i);
      for (const vid of c.v) {
        const pt = D.vertices[vid].p;
        if (pt[0] < x0) x0 = pt[0];
        if (pt[0] > x1) x1 = pt[0];
        if (pt[1] < y0) y0 = pt[1];
        if (pt[1] > y1) y1 = pt[1];
      }
    }
    const near = new Set(set);
    let frontier = [...set];
    for (let step = 0; step < 2; step++) {
      const next = [];
      for (const cellId of frontier) {
        const c = D.cells[cellId];
        for (let k = 0; k < c.v.length; k++) {
          const nb = art.neighbours[cellId][k];
          if (nb >= 0 && art.land[nb] && !near.has(nb)) { near.add(nb); next.push(nb); }
        }
      }
      frontier = next;
    }
    const borderEdges = new Map();
    for (const c of cells) {
      for (let k = 0; k < c.v.length; k++) {
        const nb = art.neighbours[c.i][k];
        if (nb < 0 || !art.land[nb] || set.has(nb)) continue;
        const nbState = D.cells[nb].state;
        if (!nbState || nbState === stateId) continue;
        if (!borderEdges.has(nbState)) borderEdges.set(nbState, []);
        borderEdges.get(nbState).push([c.v[k], c.v[(k + 1) % c.v.length]]);
      }
    }
    const st = stateId != null ? D.states.find(s => s.i === stateId) : null;
    return {
      kind, id, name, cells, set, near, x0, y0, x1, y1, stateId, borderEdges,
      stateName: st ? String(stateName ? stateName(st) : st.name).trim() : ''
    };
  }
  const citySize = b => b.capital ? 1 : (b.settlementClass === 'Vila' ? 0 : 2);

  function society() {
    if (!cache.society) cache.society = societyField(D);
    return cache.society;
  }
  function population() {
    if (!cache.population) cache.population = populationField(D);
    return cache.population;
  }
  function economy() {
    if (cache.economy) return cache.economy;
    const e = getEconomy && getEconomy();
    if (!e) return null;
    try { cache.economy = e.maps(); } catch (err) { cache.economy = null; }
    return cache.economy;
  }  function provinces() {
    const p = getProvince && getProvince();
    return p && p.data ? p : null;
  }

  function stateOf(id) {
    return D.states.find(s => s.i === id) || null;
  }

  function provinceTone(pal) {
    const p = provinces();
    if (!p) return null;
    const table = new Map();
    for (const pr of p.data.provinces) table.set(pr.i, mix(mute(pr.color, 0.22, 0.7, 0.8), hexRgb(pal.land), themeMix(pal, false)));
    return {table, at: id => p.provinceAt(id)};
  }

  function goodColor(id) {
    const fixed = GOOD_COLORS[id];
    if (fixed) return fixed;
    const h = (id * 0.61803398875) % 1, s = 0.4, l = 0.58;
    return css(hslToRgb(h, s, l));
  }

  function toneTable(mode, pal) {
    const table = new Map();
    const base = hexRgb(pal.land);
    if (mode === 'political') {
      for (const s of D.states) {
        table.set(s.i, s.i === 0 ? hexRgb(pal.neutral) : mix(mute(s.color || '#a9a99a', 0.3, 0.68, 0.78), base, themeMix(pal, false)));
      }
    } else if (mode === 'culture' || mode === 'religion') {
      const field = society();
      const ids = new Set();
      for (let i = 0; i < D.cells.length; i++) if (art.land[i]) ids.add(field[mode][i]);
      for (const id of ids) {
        if (id < 0) { table.set(-1, hexRgb(pal.unknown)); continue; }
        if (id === 0) { table.set(0, hexRgb('#a7b3ad')); continue; }
        const hue = ((id * 137.508) + (mode === 'religion' ? 34 : 0)) % 360;
        table.set(id, mix(hslToRgb(hue / 360, 0.21, 0.73), base, themeMix(pal, false)));
      }
    } else if (mode === 'goods' || mode === 'markets') {
      const map = economy();
      if (!map) return table;
      if (mode === 'goods') {
        const ids = new Set(map.goodsField);
        for (const id of ids) {
          if (!id) { table.set(0, hexRgb(pal.unknown)); continue; }
          table.set(id, mix(mute(goodColor(id), 0.26, 0.68, 0.79), base, themeMix(pal, false)));
        }
      } else {
        for (const [id, m] of map.marketInfo) table.set(id, mix(mute(m.color || '#a9a9a9', 0.24, 0.69, 0.8), base, themeMix(pal, false)));
        table.set(0, hexRgb(pal.unknown));
      }
    } else if (mode === 'provinces') {
      const p = provinceTone(pal);
      if (p) {
        for (const [id, color] of p.table) table.set(id, mix(color, base, 0.16));
        table.set(0, hexRgb(pal.unknown));
      }
    } else if (mode === 'terrain') {
      for (let i = 1; i <= 16; i++) {
        const total = BIOME_TONES[i];
        if (total) table.set(i, mix(hexRgb(total), base, themeMix(pal, true)));
      }
    }
    return table;
  }

  function shadedCell(c, mode, table, pal, reliefOn) {
    let color;
    if (mode === 'terrain') {
      color = table.get(c.biome) || hexRgb(pal.land);
    } else if (mode === 'political') {
      color = table.get(c.state) || hexRgb(pal.neutral);
    } else if (mode === 'culture' || mode === 'religion') {
      color = table.get(society()[mode][c.i]) || hexRgb(pal.unknown);
    } else if (mode === 'goods') {
      const map = economy();
      color = (map && (table.get(map.goodsField[c.i]) || table.get(0))) || hexRgb(pal.unknown);
    } else if (mode === 'markets') {
      const map = economy();
      color = (map && (table.get(map.marketField[c.i]) || table.get(0))) || hexRgb(pal.unknown);
    } else if (mode === 'provinces') {
      const p = provinces();
      const id = p ? (p.provinceAt(c.i)?.i ?? 0) : 0;
      color = table.get(id) || table.get(0) || hexRgb(pal.unknown);
    } else if (mode === 'population') {
      const field = population();
      const v = field.field[c.i] || 0;
      const t = field.max > 0 ? clamp(Math.log1p(v) / Math.log1p(field.max), 0, 1) : 0;
      color = mix(hexRgb(pal.land), populationColor(v, field.max).map(x => x * 255), 0.12 + 0.72 * t);
    } else {
      color = hexRgb(pal.land);
    }
    const i = c.i, col = i % art.cols, row = (i / art.cols) | 0;
    const h = art.h[i];
    let shade = 1;
    if (reliefOn) {
      const hL = col > 0 && art.land[i - 1] ? art.h[i - 1] : 20;
      const hR = col < art.cols - 1 && art.land[i + 1] ? art.h[i + 1] : 20;
      const hU = row > 0 && art.land[i - art.cols] ? art.h[i - art.cols] : 20;
      const hD = row < art.rows - 1 && art.land[i + art.cols] ? art.h[i + art.cols] : 20;
      const gx = hR - hL, gy = hD - hU;
      const alt = clamp((h - 20) / 63, 0, 1);
      const strength = mode === 'terrain' ? 0.038 : 0.018;
      shade = 1 + (gx + gy) * strength + alt * (mode === 'terrain' ? 0.03 : 0.012);
      shade *= 1 - 0.05 * Math.exp(-art.coastDist[i] / 2.4);
      shade = clamp(shade, 0.87, 1.12);
    }
    const jitter = (hash01(i * 2654435761) - 0.5) * 4;
    let out = [color[0] * shade + jitter, color[1] * shade + jitter, color[2] * shade + jitter];
    if (mode === 'terrain') {
      const snowT = clamp((h - 76) / 8, 0, 1);
      if (snowT > 0) out = mix(out, hexRgb(pal.snow), snowT * 0.4);
    }
    return out;
  }

  function landRaster(mode, pal, reliefStyle) {
    const reliefOn = reliefStyle !== 'none';
    const key = `${mode}|${pal.id}|${reliefStyle}`;
    if (cache.rasters.has(key)) return cache.rasters.get(key);
    const table = toneTable(mode, pal);
    const base = document.createElement('canvas');
    base.width = art.cols; base.height = art.rows;
    const g = base.getContext('2d');
    const img = g.createImageData(art.cols, art.rows);
    const px = img.data;
    for (const c of D.cells) {
      if (!art.land[c.i]) { px[c.i * 4 + 3] = 0; continue; }
      const color = shadedCell(c, mode, table, pal, reliefOn);
      px[c.i * 4] = clamp(color[0], 0, 255);
      px[c.i * 4 + 1] = clamp(color[1], 0, 255);
      px[c.i * 4 + 2] = clamp(color[2], 0, 255);
      px[c.i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const canvas = reliefStyle === 'shade' ? shadeRaster(base, mode) : base;
    cache.rasters.set(key, {canvas, table});
    if (cache.rasters.size > 8) cache.rasters.delete(cache.rasters.keys().next().value);
    return {canvas, table};
  }

  // Sombreado do relevo em resolução dupla: a luz vem do noroeste, como nas cartas antigas.
  function shadeRaster(base, mode) {
    const factor = 2;
    const w = art.cols * factor, h = art.rows * factor;
    const shade = document.createElement('canvas');
    shade.width = w; shade.height = h;
    const sg = shade.getContext('2d');
    const img = sg.createImageData(w, h);
    const data = img.data;
    const H = (ix, iy) => {
      if (ix < 0 || iy < 0 || ix >= art.cols || iy >= art.rows) return 20;
      const j = iy * art.cols + ix;
      return art.land[j] ? art.h[j] : 20;
    };
    const L = (ix, iy) => {
      if (ix < 0 || iy < 0 || ix >= art.cols || iy >= art.rows) return 0;
      return art.land[iy * art.cols + ix] ? 1 : 0;
    };
    const sample = (fn, x, y) => {
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      return (fn(x0, y0) * (1 - fx) + fn(x0 + 1, y0) * fx) * (1 - fy)
        + (fn(x0, y0 + 1) * (1 - fx) + fn(x0 + 1, y0 + 1) * fx) * fy;
    };
    const strength = mode === 'terrain' ? 0.05 : 0.022;
    const alpha = mode === 'terrain' ? 232 : 140;
    for (let oy = 0; oy < h; oy++) {
      const y = (oy + 0.5) / factor - 0.5;
      for (let ox = 0; ox < w; ox++) {
        const x = (ox + 0.5) / factor - 0.5;
        const land = sample(L, x, y);
        const idx = (oy * w + ox) * 4;
        if (land <= 0.002) continue;
        const height = sample(H, x, y);
        const gx = sample(H, x + 1, y) - sample(H, x - 1, y);
        const gy = sample(H, x, y + 1) - sample(H, x, y - 1);
        const altitude = clamp((height - 20) / 63, 0, 1);
        let tone = 1 + (gx + gy) * strength + altitude * 0.04;
        tone = clamp(tone, 0.58, 1.36);
        const value = clamp(128 + (tone - 1) * 162, 16, 242);
        data[idx] = value; data[idx + 1] = value; data[idx + 2] = value;
        data[idx + 3] = clamp(land * alpha, 0, 255);
      }
    }
    sg.putImageData(img, 0, 0);
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const og = out.getContext('2d');
    og.imageSmoothingEnabled = true;
    og.imageSmoothingQuality = 'high';
    og.drawImage(base, 0, 0, w, h);
    og.globalCompositeOperation = 'overlay';
    og.filter = 'blur(0.9px)';
    og.drawImage(shade, 0, 0);
    og.filter = 'none';
    og.globalCompositeOperation = 'source-over';
    return out;
  }

  /* ------------------------------------------------------------ montagem */

  function renderSheet(opts = {}) {
    const mode = opts.mode || 'terrain';
    const pal = THEMES[opts.theme] || THEMES.blue;
    const W = Math.round(opts.width || 3200), H = Math.round(opts.height || 1600);
    const s = W / 1600;
    const seed = opts.seed || 20260101;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const frameInset = 10 * s, mapInset = 18 * s;
    const mapRect = {x: mapInset, y: mapInset, w: W - mapInset * 2, h: H - mapInset * 2};
    const baseScale = Math.min(mapRect.w / MAP_W, mapRect.h / MAP_H);
    const zoom = clamp(Number(opts.zoom) || 1, 1, 1.2);
    const focus = resolveFocus(opts);
    let scale, mx, my;
    if (focus) {
      const fw0 = focus.x1 - focus.x0, fh0 = focus.y1 - focus.y0;
      const pad = Math.max(14, Math.max(fw0, fh0) * 0.08);
      const fw = fw0 + pad * 2, fh = fh0 + pad * 2;
      const fit = Math.min(mapRect.w / fw, mapRect.h / fh);
      // um mínimo de mundo visível evita que uma província minúscula
      // transforme o terreno em manchas gigantes
      scale = Math.min(fit, baseScale * 14, mapRect.w / 760) * zoom;
      const cx = (focus.x0 + focus.x1) / 2, cy = (focus.y0 + focus.y1) / 2;
      mx = mapRect.x + mapRect.w / 2 - cx * scale;
      my = mapRect.y + mapRect.h / 2 - cy * scale;
    } else {
      scale = baseScale * zoom;
      mx = mapRect.x + (mapRect.w - MAP_W * baseScale) / 2;
      my = mapRect.y;
    }
    const X = x => mx + x * scale, Y = y => my + y * scale;
    // tipografia e traços acompanham a folha, não o zoom do recorte
    const u = Math.min(scale, 1.35 * s);
    const inkA = (a) => hexA(pal.ink, a);

    // papel
    ctx.fillStyle = pal.paper;
    ctx.fillRect(0, 0, W, H);
    const paperGrad = ctx.createRadialGradient(W * 0.45, H * 0.4, 0, W * 0.5, H * 0.5, W * 0.75);
    paperGrad.addColorStop(0, hexA(pal.paperLight, 0.55));
    paperGrad.addColorStop(1, hexA(pal.paperDark, 0.35));
    ctx.fillStyle = paperGrad; ctx.fillRect(0, 0, W, H);

    // todo o conteúdo do mapa respeita a moldura
    ctx.save();
    ctx.beginPath(); ctx.rect(mapRect.x, mapRect.y, mapRect.w, mapRect.h); ctx.clip();

    // mar
    drawSea(ctx, mapRect, s, pal, seed);

    // bandas de água rasa e costa
    drawCoastBands(ctx, art.coastLoops, scale, mx, my, s, pal);

    // terra
    const reliefStyle = opts.reliefStyle || (opts.relief === false ? 'none' : 'shade');
    const raster = landRaster(mode, pal, reliefStyle);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(raster.canvas, mx, my, MAP_W * scale, MAP_H * scale);

    // lagos
    if (art.lakeLoops.length) {
      const lakePath = new Path2D();
      for (const loop of art.lakeLoops) {
        const pts = loop.points;
        lakePath.moveTo(X(pts[0][0]), Y(pts[0][1]));
        for (let i = 1; i < pts.length; i++) lakePath.lineTo(X(pts[i][0]), Y(pts[i][1]));
        lakePath.closePath();
      }
      ctx.save();
      ctx.fillStyle = hexA(pal.seaMid, 0.94);
      ctx.fill(lakePath);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = hexA(pal.coast, 0.9);
      ctx.lineWidth = 1.15 * u;
      ctx.stroke(lakePath);
      ctx.restore();
    }

    // textura de aguarela sobre a terra (manchas)
    {
      const R = rng(seed ^ 0x2b1);
      ctx.save();
      for (let i = 0; i < 260; i++) {
        const cx = R() * MAP_W, cy = R() * MAP_H;
        const ci = ((cy / art.rows) | 0) * art.cols + ((cx / art.cols) | 0);
        if (!art.land[ci]) continue;
        const r = (12 + R() * 58) * u;
        const g = ctx.createRadialGradient(X(cx), Y(cy), 0, X(cx), Y(cy), r);
        const warm = R() > 0.5;
        g.addColorStop(0, warm ? hexA(pal.landWarm, 0.09) : hexA(pal.landShade, 0.08));
        g.addColorStop(1, warm ? hexA(pal.landWarm, 0) : hexA(pal.landShade, 0));
        ctx.fillStyle = g;
        ctx.fillRect(X(cx) - r, Y(cy) - r, r * 2, r * 2);
      }
      ctx.restore();
    }

    // vegetação
    if (opts.vegetation !== false) drawVegetation(ctx, mode, pal, u, X, Y, seed);
    if (reliefStyle === 'glyphs') drawRelief(ctx, pal, u, X, Y, mode);

    // rios
    drawRivers(ctx, pal, u, X, Y, opts);

    // estradas
    if (opts.roads) drawRoads(ctx, pal, u, X, Y);

    // fronteiras
    drawBorders(ctx, mode, pal, u, X, Y, opts);

    // linhas de água rasa acompanhando a costa
    drawCoastRipples(ctx, art.coastLoops, art.land, art.cols, art.rows, D.grid.stepX, D.grid.stepY, mx, my, scale, s, pal);

    // costa por cima
    const coastPath = new Path2D();
    for (const loop of art.coastLoops) {
      const pts = loop.points;
      coastPath.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (let i = 1; i < pts.length; i++) coastPath.lineTo(X(pts[i][0]), Y(pts[i][1]));
      if (loop.closed) coastPath.closePath();
    }
    drawCoastInk(ctx, coastPath, s, pal);

    // grades e coordenadas
    if (opts.grid !== false) drawGraticule(ctx, mapRect, mx, my, scale, s, pal);
    if (!focus && opts.unknownNorth !== false) drawUnknownNorth(ctx, mapRect, W, s, pal, opts, X, Y);
    if (focus) drawFocusOutline(ctx, pal, u, X, Y, focus);

    // marcas e rótulos
    const legendModel = opts.legend !== false ? buildLegend(mode, pal, opts, focus) : null;
    let legendRect = null;
    if (legendModel) {
      const m = legendMetrics(ctx, legendModel, s);
      legendRect = opts.legendCorner === 'bottom-left'
        ? {x: mapRect.x + 12 * s, y: mapRect.y + mapRect.h - 12 * s - m.height, w: m.width, h: m.height}
        : {x: mapRect.x + mapRect.w - 12 * s - m.width, y: mapRect.y + 12 * s, w: m.width, h: m.height};
    }
    const board = createBoard(mapRect, 3);
    reserveFurniture(ctx, board, W, H, mapRect, s, opts, pal, legendRect, focus);
    const cityLevel = opts.cities || 'capitals';
    const allCities = visibleCities().filter(b => !focus || opts.focusOtherCities || focus.set.has(b.cell));
    const majorIds = new Set(allCities.filter(isMajorCity).map(b => b.i));
    const topIds = new Set([...allCities].sort((a, b) => inhabitantsOf(b) - inhabitantsOf(a)).slice(0, 30).map(b => b.i));
    drawCityMarkers(ctx, opts, pal, u, X, Y, mode, focus);
    const placedStates = drawStateLabels(ctx, opts, pal, u, X, Y, board, mode, focus);
    if (mode === 'provinces' || (focus && opts.focusOtherProvinces)) drawProvinceLabels(ctx, opts, pal, u, X, Y, board, focus);
    drawFocusProvinceLabel(ctx, opts, pal, u, X, Y, board, focus);
    drawBorderStateLabels(ctx, opts, pal, u, X, Y, board, focus, placedStates);
    drawWaterLabels(ctx, opts, pal, u, X, Y, board, mode, focus);
    if (cityLevel !== 'none') drawCityLabels(ctx, opts, pal, u, X, Y, board, allCities.filter(b => b.capital), focus);
    if (cityLevel === 'major' || cityLevel === 'all') {
      const rest = allCities.filter(b => !b.capital && (cityLevel === 'all' || majorIds.has(b.i) || topIds.has(b.i)));
      drawCityLabels(ctx, opts, pal, u, X, Y, board, rest, focus);
    }
    drawRiverLabels(ctx, opts, pal, u, X, Y, board, mode, focus);
    drawPoiLabels(ctx, opts, pal, u, X, Y, board, mode, focus);

    ctx.restore();

    // móveis
    drawFrame(ctx, W, H, s, pal);
    drawTitle(ctx, W, s, pal, opts.title || `O MUNDO DE ${String(mapName || 'SILVANGAD').toUpperCase()}`, opts.subtitle || 'ATLAS VIVO · EDIÇÃO DO MESTRE', opts);
    let compassBox = null, scaleBox = null;
    if (opts.compass !== false) compassBox = drawCompass(ctx, W - 95 * s, H - 150 * s, 44 * s, s, pal);
    if (opts.scale !== false) scaleBox = drawScaleBar(ctx, W - 70 * s, H - 58 * s, s, pal, D.settings?.distanceScale || 1.5, scale);
    if (legendModel && legendRect) {
      drawLegend(ctx, legendModel, legendRect.x, legendRect.y, s, pal);
      board.reservePx(legendRect.x, legendRect.y, legendRect.w, legendRect.h);
    }

    drawStains(ctx, W, H, s, pal, seed);
    drawWash(ctx, W, H, pal);
    drawGrain(ctx, W, H, s, pal, seed);
    drawVignette(ctx, W, H, pal);
    return canvas;
  }

  function reserveFurniture(ctx, board, W, H, mapRect, s, opts, pal, legendRect, focus) {
    // título
    const titleScale = clamp(Number(opts.titleScale) || 1, 0.75, 1.6);
    const titleH = (66 + Math.max(0, titleScale - 1) * 18 + (opts.titleFrame ? 22 : 0)) * s;
    board.reservePx(W / 2 - 330 * s, 18 * s, 660 * s, titleH);
    if (!focus && opts.unknownNorth !== false && opts.unknownLabel !== false) board.reservePx(W * 0.225 - 130 * s, mapRect.y + 8 * s, 260 * s, 26 * s);
    if (opts.compass !== false) board.reservePx(W - 95 * s - 62 * s, H - 150 * s - 62 * s, 124 * s, 124 * s);
    if (opts.scale !== false) board.reservePx(W - 250 * s, H - 80 * s, 220 * s, 32 * s);
    if (legendRect) board.reservePx(legendRect.x - 2 * s, legendRect.y - 2 * s, legendRect.w + 4 * s, legendRect.h + 4 * s);
  }

  function drawFocusOutline(ctx, pal, u, X, Y, focus) {
    const edges = [];
    for (const cellId of focus.set) {
      const c = D.cells[cellId];
      for (let k = 0; k < c.v.length; k++) {
        const nb = art.neighbours[cellId][k];
        if (nb < 0 || focus.set.has(nb)) continue;
        edges.push([c.v[k], c.v[(k + 1) % c.v.length]]);
      }
    }
    if (!edges.length) return;
    const chains = stitch(edges, art.vx, art.vy).map(loop => {
      const jittered = loop.ids.map(id => [
        art.vx[id] + (hash01(id * 17 + 3) - 0.5) * 1.1,
        art.vy[id] + (hash01(id * 29 + 7) - 0.5) * 1.1
      ]);
      return {points: smoothPoints(jittered, loop.closed, 3), closed: loop.closed};
    });
    const path = new Path2D();
    for (const chain of chains) {
      const pts = chain.points;
      path.moveTo(X(pts[0][0]), Y(pts[0][1]));
      for (let i = 1; i < pts.length; i++) path.lineTo(X(pts[i][0]), Y(pts[i][1]));
      if (chain.closed) path.closePath();
    }
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = hexA(pal.paperLight, 0.75);
    ctx.lineWidth = 5 * u;
    ctx.stroke(path);
    ctx.strokeStyle = rgba(mix(hexRgb(pal.gold), hexRgb(pal.ink), 0.25), 0.9);
    ctx.lineWidth = 1.7 * u;
    ctx.stroke(path);
    ctx.restore();
  }

  /* ------------------------------------------------------------ terreno detalhado */

  function drawVegetation(ctx, mode, pal, u, X, Y, seed) {
    const thematic = mode !== 'terrain' && mode !== 'political';
    const R = rng(seed ^ 0x77aa);
    const blobAlpha = thematic ? 0.04 : 0.055;
    ctx.save();
    // manchas de floresta
    for (const c of D.cells) {
      if (!art.land[c.i] || !FOREST_BIOMES.has(c.biome)) continue;
      if (hash01(c.i * 7 + 11) > 0.07) continue;
      const x = X(c.p[0]), y = Y(c.p[1]), r = (11 + hash01(c.i) * 16) * u;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, hexA(pal.veg, blobAlpha));
      g.addColorStop(1, hexA(pal.veg, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    if (thematic) { ctx.restore(); return; }

    for (const c of D.cells) {
      if (!art.land[c.i]) continue;
      const biome = c.biome;
      const dense = FOREST_BIOMES.has(biome) || MARSH_BIOMES.has(biome) || DEAD_BIOMES.has(biome);
      if (!dense) {
        if (GRASS_BIOMES.has(biome) && hash01(c.i * 31 + 5) < 0.05) {
          const x = X(c.p[0] + (hash01(c.i + 2) - 0.5) * 3), y = Y(c.p[1] + (hash01(c.i + 9) - 0.5) * 3);
          ctx.strokeStyle = hexA(pal.veg, 0.22);
          ctx.lineWidth = 0.4 * u;
          ctx.beginPath(); ctx.moveTo(x, y + 1.8 * u); ctx.lineTo(x - 0.8 * u, y - 1.6 * u); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 1.2 * u, y + 1.8 * u); ctx.lineTo(x + 1.8 * u, y - 1.2 * u); ctx.stroke();
        }
        if (DRY_BIOMES.has(biome) && hash01(c.i * 13 + 7) < 0.1) {
          duneGlyph(ctx, X(c.p[0]), Y(c.p[1]), (3 + hash01(c.i) * 3) * u, pal, 0.9);
        }
        if (biome === 11 && hash01(c.i * 3 + 1) < 0.16) {
          const x = X(c.p[0]), y = Y(c.p[1]);
          ctx.strokeStyle = hexA(pal.inkSoft, 0.16);
          ctx.lineWidth = 0.45 * u;
          ctx.beginPath(); ctx.moveTo(x - 4 * u, y + 2 * u); ctx.lineTo(x - 1 * u, y - 2.5 * u); ctx.lineTo(x + 2 * u, y + 1.5 * u); ctx.stroke();
        }
        if (WASTE_BIOMES.has(biome) && hash01(c.i * 17 + 3) < 0.05) {
          const x = X(c.p[0]), y = Y(c.p[1]);
          ctx.strokeStyle = hexA(pal.inkSoft, 0.15);
          ctx.lineWidth = 0.45 * u;
          ctx.beginPath(); ctx.moveTo(x - 3 * u, y + 1 * u); ctx.lineTo(x, y - 2 * u); ctx.lineTo(x + 3 * u, y + 1 * u); ctx.stroke();
        }
        continue;
      }
      const density = biome === 12 ? 0.22 : biome === 9 ? 0.17 : biome === 13 ? 0.1 : 0.15;
      if (c.h > 74 || hash01(c.i * 41 + 13) > density) continue;
      const jx = (hash01(c.i * 5 + 1) - 0.5) * 3.4, jy = (hash01(c.i * 11 + 7) - 0.5) * 3.4;
      const size = (3.1 + hash01(c.i * 19 + 2) * 2.1) * u;
      let kind = 'deciduous';
      if (biome === 9) kind = 'conifer';
      else if (biome === 5 || biome === 7) kind = hash01(c.i + 3) > 0.35 ? 'palm' : 'acacia';
      else if (biome === 12) kind = 'swamp';
      else if (biome === 13 || biome === 14) kind = 'dead';
      treeGlyph(ctx, X(c.p[0] + jx), Y(c.p[1] + jy), size, kind, R, pal, 0.85);
    }
    ctx.restore();
  }

  function drawRelief(ctx, pal, u, X, Y, mode) {
    for (const m of art.mountains) {
      const t = clamp((m.h - 48) / 34, 0, 1);
      const size = (3.2 + t * 4.6) * u;
      const alpha = mode === 'terrain' ? 0.95 : 0.5;
      mountainGlyph(ctx, X(m.x), Y(m.y), size, rng((m.x * 13 + m.y * 7) | 0), pal, alpha, m.h > 74);
    }
  }

  function drawRivers(ctx, pal, u, X, Y, opts) {
    const style = opts.riverStyle || (opts.rivers === false ? 'none' : 'banks');
    if (style === 'none') return;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const bankColor = mix(hexRgb(pal.river), hexRgb(pal.ink), 0.45);
    const lightColor = mix(hexRgb(pal.river), [255, 255, 255], 0.45);
    for (const river of D.rivers) {
      if (!river.points || river.points.length < 2) continue;
      const base = clamp((river.width || 1) * 0.95, 0.5, 2.8) * u;
      const smooth = smoothPoints(river.points, false, 2);
      if (style === 'simple') {
        const path = smoothRiver(smooth, X, Y);
        ctx.strokeStyle = hexA(pal.river, 0.35);
        ctx.lineWidth = base + 1.6 * u;
        ctx.stroke(path);
        ctx.strokeStyle = hexA(pal.river, 0.92);
        ctx.lineWidth = base;
        ctx.stroke(path);
        continue;
      }
      const P = smooth.map(pt => [X(pt[0]), Y(pt[1])]);
      const n = P.length, left = [], right = [];
      for (let i = 0; i < n; i++) {
        const prev = P[Math.max(0, i - 1)], next = P[Math.min(n - 1, i + 1)];
        let tx = next[0] - prev[0], ty = next[1] - prev[1];
        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len, ny = tx / len;
        const w = base * (0.5 + 0.6 * (i / (n - 1)));
        left.push([P[i][0] + nx * w, P[i][1] + ny * w]);
        right.push([P[i][0] - nx * w, P[i][1] - ny * w]);
      }
      const ribbon = new Path2D();
      ribbon.moveTo(left[0][0], left[0][1]);
      for (let i = 1; i < n; i++) ribbon.lineTo(left[i][0], left[i][1]);
      for (let i = n - 1; i >= 0; i--) ribbon.lineTo(right[i][0], right[i][1]);
      ribbon.closePath();
      ctx.fillStyle = hexA(pal.river, 0.92);
      ctx.fill(ribbon);
      ctx.strokeStyle = hexA(bankColor, 0.7);
      ctx.lineWidth = Math.max(0.5, 0.7 * u);
      ctx.stroke(ribbon);
      const shine = new Path2D();
      shine.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < n; i++) shine.lineTo(P[i][0], P[i][1]);
      ctx.strokeStyle = hexA(lightColor, 0.4);
      ctx.lineWidth = Math.max(0.25, base * 0.28);
      ctx.stroke(shine);
    }
    ctx.restore();
  }

  function smoothRiver(points, X, Y) {
    const p = points.map(pt => [X(pt[0]), Y(pt[1])]);
    const path = new Path2D();
    if (p.length < 3) { path.moveTo(p[0][0], p[0][1]); path.lineTo(p[p.length - 1][0], p[p.length - 1][1]); return path; }
    path.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length - 1; i++) {
      const xc = (p[i][0] + p[i + 1][0]) / 2, yc = (p[i][1] + p[i + 1][1]) / 2;
      path.quadraticCurveTo(p[i][0], p[i][1], xc, yc);
    }
    path.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
    return path;
  }

  function drawRoads(ctx, pal, u, X, Y) {
    ctx.save();
    ctx.setLineDash([1.6 * u, 3.4 * u]);
    ctx.strokeStyle = hexA(pal.inkSoft, 0.4);
    ctx.lineWidth = 0.9 * u;
    for (const r of D.routes) {
      if (r.kind !== 'road' || !r.points || r.points.length < 2) continue;
      const path = smoothRiver(r.points, X, Y);
      ctx.stroke(path);
    }
    ctx.restore();
  }

  function drawBorders(ctx, mode, pal, u, X, Y, opts) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // fronteiras dos estados: sempre visíveis, exceto se o autor desligar
    if (opts.stateBorders !== false) {
      const statePath = new Path2D();
      const chains = art.stateChains;
      for (const chain of chains) {
        const pts = chain.points;
        statePath.moveTo(X(pts[0][0]), Y(pts[0][1]));
        for (let i = 1; i < pts.length; i++) statePath.lineTo(X(pts[i][0]), Y(pts[i][1]));
        if (chain.closed) statePath.closePath();
      }
      const thematic = mode !== 'terrain';
      ctx.strokeStyle = hexA(thematic ? pal.landWarm : pal.paperLight, thematic ? 0.62 : 0.22);
      ctx.lineWidth = (thematic ? 5.2 : 2.1) * u;
      ctx.stroke(statePath);
      ctx.setLineDash([]);
      ctx.strokeStyle = hexA(pal.ink, mode === 'political' ? 0.75 : 0.66);
      ctx.lineWidth = Math.max(0.9, 1.4 * u);
      ctx.stroke(statePath);
    }
    ctx.restore();

    const fieldEdges = (fieldAt, alpha, dash) => {
      const edges = [];
      for (const c of D.cells) {
        if (!art.land[c.i]) continue;
        const mine = fieldAt(c.i);
        for (let k = 0; k < c.v.length; k++) {
          const nb = art.neighbours[c.i][k];
          if (nb < 0 || nb <= c.i || !art.land[nb]) continue;
          if (fieldAt(nb) !== mine) edges.push([c.v[k], c.v[(k + 1) % c.v.length]]);
        }
      }
      const chains = stitch(edges, art.vx, art.vy).map(loop => {
        const jittered = loop.ids.map(id => [
          art.vx[id] + (hash01(id * 17 + 3) - 0.5) * 2.2,
          art.vy[id] + (hash01(id * 29 + 7) - 0.5) * 2.2
        ]);
        return {points: smoothPoints(jittered, loop.closed, 4), closed: loop.closed};
      });
      const path = new Path2D();
      for (const chain of chains) {
        const pts = chain.points;
        path.moveTo(X(pts[0][0]), Y(pts[0][1]));
        for (let i = 1; i < pts.length; i++) path.lineTo(X(pts[i][0]), Y(pts[i][1]));
        if (chain.closed) path.closePath();
      }
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = hexA(pal.landWarm, 0.34);
      ctx.lineWidth = 2.6 * u;
      ctx.stroke(path);
      ctx.strokeStyle = hexA(pal.ink, alpha);
      ctx.lineWidth = 1.15 * u;
      if (dash) ctx.setLineDash(dash.map(v => v * u));
      ctx.stroke(path);
      ctx.restore();
    };

    if (['culture', 'religion'].includes(mode)) {
      const field = society();
      fieldEdges(id => field[mode][id], 0.5, [2, 2.4]);
    }

    if (mode === 'goods' || mode === 'markets') {
      const map = economy();
      if (map) fieldEdges(id => (mode === 'goods' ? map.goodsField[id] : map.marketField[id]), 0.46, [2, 2.4]);
    }

    if (mode === 'provinces') {
      const p = provinces();
      if (p) fieldEdges(id => p.provinceAt(id)?.i ?? 0, 0.55, null);
    }
  }

  function drawGraticule(ctx, rect, mx, my, scale, s, pal) {
    ctx.save();
    ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
    const stepX = MAP_W / 24, stepY = MAP_H / 12;
    ctx.strokeStyle = hexA(pal.grid, 0.32);
    ctx.lineWidth = 0.6 * s;
    for (let i = 1; i < 24; i++) {
      const x = mx + i * stepX * scale;
      ctx.beginPath(); ctx.moveTo(x, rect.y); ctx.lineTo(x, rect.y + rect.h); ctx.stroke();
    }
    for (let j = 1; j < 12; j++) {
      const y = my + j * stepY * scale;
      ctx.beginPath(); ctx.moveTo(rect.x, y); ctx.lineTo(rect.x + rect.w, y); ctx.stroke();
    }
    ctx.restore();
    // números
    ctx.save();
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 24; i++) {
      const lon = -180 + i * 15;
      const x = mx + i * stepX * scale;
      if (x < rect.x + 10 * s || x > rect.x + rect.w - 10 * s) continue;
      const label = String(Math.abs(lon));
      drawTracked(ctx, label, x, rect.y + rect.h - 8 * s, {size: 7.2 * s, tracking: 0.2 * s, color: pal.inkFaint, align: 'center', alpha: 0.85});
    }
    for (let j = 0; j <= 12; j++) {
      const lat = 90 - j * 15;
      const y = my + j * stepY * scale;
      if (y < rect.y + 10 * s || y > rect.y + rect.h - 10 * s) continue;
      drawTracked(ctx, String(Math.abs(lat)), rect.x + rect.w - 8 * s, y, {size: 7.2 * s, tracking: 0.2 * s, color: pal.inkFaint, align: 'right', alpha: 0.85});
    }
    ctx.restore();
  }

  function drawUnknownNorth(ctx, mapRect, W, s, pal, opts, X, Y) {
    // o norte termina no limite do mapa: não é mar, é o fim do que se sabe
    const cut = new Path2D();
    for (let i = 0; i < art.cols * 10; i++) {
      if (!art.land[i]) continue;
      const c = D.cells[i];
      const pts = c.v;
      cut.moveTo(X(D.vertices[pts[0]].p[0]), Y(D.vertices[pts[0]].p[1]));
      for (let k = 1; k < pts.length; k++) cut.lineTo(X(D.vertices[pts[k]].p[0]), Y(D.vertices[pts[k]].p[1]));
      cut.closePath();
    }
    ctx.save();
    ctx.clip(cut);
    const fade = ctx.createLinearGradient(0, mapRect.y, 0, mapRect.y + 22 * s);
    fade.addColorStop(0, hexA(pal.paper, 0.7));
    fade.addColorStop(0.4, hexA(pal.paper, 0.3));
    fade.addColorStop(1, hexA(pal.paper, 0));
    ctx.fillStyle = fade;
    ctx.fillRect(mapRect.x, mapRect.y, mapRect.w, 23 * s);
    // fios finos paralelos à borda, como um corte de página
    ctx.strokeStyle = hexA(pal.ink, 0.2);
    ctx.lineWidth = 0.7 * s;
    for (let i = 0; i < 3; i++) {
      const y = mapRect.y + (2.2 + i * 1.9) * s;
      ctx.beginPath(); ctx.moveTo(mapRect.x + 2 * s, y); ctx.lineTo(mapRect.x + mapRect.w - 2 * s, y); ctx.stroke();
    }
    ctx.restore();
    if (opts.unknownLabel !== false) {
      const label = 'TERRAS DESCONHECIDAS';
      const size = 9.4 * s, tracking = 3.4 * s;
      setFont(ctx, size, 400, true);
      const w = trackedWidth(ctx, label, tracking);
      drawTracked(ctx, label, W * 0.225, mapRect.y + 22 * s, {
        size, tracking, italic: true, color: pal.inkSoft, align: 'center', alpha: 0.72,
        halo: {width: 5 * s, color: hexA(pal.paper, 0.72)}
      });
      return {x: W * 0.225 - w / 2, y: mapRect.y + 10 * s, w, h: 24 * s};
    }
    return null;
  }

  /* ------------------------------------------------------------ rótulos */

  function drawProvinceLabels(ctx, opts, pal, u, X, Y, board, focus) {
    const p = provinces();
    if (!p) return;
    let list = [...p.data.provinces].filter(pr => pr.area > 900 && pr.labelPoint).sort((a, b) => b.area - a.area);
    if (focus) {
      if (focus.kind === 'province') {
        list = opts.focusOtherProvinces ? list.filter(pr => pr.i !== focus.id) : [];
      } else if (!opts.focusOtherProvinces) {
        const ids = new Set();
        for (const cellId of focus.set) {
          const pr = p.provinceAt(cellId);
          if (pr) ids.add(pr.i);
        }
        list = list.filter(pr => ids.has(pr.i));
      }
    }
    list = list.slice(0, 60);
    for (const pr of list) {
      const text = String(pr.name).toUpperCase();
      const size = clamp(8.6 + Math.sqrt(pr.area) * 0.014, 8.6, 13.5) * u;
      const tracking = size * 0.2;
      setFont(ctx, size, 400, false);
      const w = trackedWidth(ctx, text, tracking);
      const box = bbox(X(pr.labelPoint[0]), Y(pr.labelPoint[1]), w + 4 * u, size * 1.2 + 3 * u, 0);
      if (!board.fits(box)) continue;
      board.add(box);
      drawTracked(ctx, text, X(pr.labelPoint[0]), Y(pr.labelPoint[1]), {
        size, tracking, color: css(labelInkOf(opts, pal, true)), alpha: 0.92,
        halo: {width: 2.2 * u, color: hexA(pal.land, 0.5)}
      });
    }
  }

  const isMajorCity = b => !!(b.capital || b.majorPort || b.magicSchool || b.type === 'Escola de magia'
    || b.dwarvenFortress || b.dwarven || String(b.settlementClass || '').startsWith('Forte'));

  function drawCityMarkers(ctx, opts, pal, u, X, Y, mode, focus) {
    const all = visibleCities().filter(b => !focus || focus.set.has(b.cell));
    if (all.length === 0) return;
    const ranked = [...all].sort((a, b) => inhabitantsOf(b) - inhabitantsOf(a));
    const top = new Set(ranked.slice(0, 30).map(b => b.i));
    if (mode === 'population') {
      const field = population(), max = field.max || 1;
      for (const b of all) {
        const v = inhabitantsOf(b);
        if (!v) continue;
        const radius = (2.4 + 12.5 * Math.sqrt(v / max)) * u;
        ctx.save();
        ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), radius, 0, Math.PI * 2);
        ctx.fillStyle = hexA(pal.ink, 0.07); ctx.fill();
        ctx.strokeStyle = hexA(pal.ink, 0.55); ctx.lineWidth = 0.9 * u; ctx.stroke();
        ctx.restore();
      }
    }
    for (const b of all) {
      const kind = b.capital ? 'capital' : (top.has(b.i) || isMajorCity(b)) ? 'major' : 'minor';
      drawCityMarker(ctx, X(b.x), Y(b.y), u, pal, kind);
    }
  }

  function drawCityLabels(ctx, opts, pal, u, X, Y, board, list, focus) {
    const inside = b => focus && focus.set.has(b.cell) ? 1 : 0;
    const ordered = [...list].sort((a, b) => (b.capital ? 1 : 0) - (a.capital ? 1 : 0)
      || inside(b) - inside(a) || inhabitantsOf(b) - inhabitantsOf(a));
    for (const b of ordered) {
      const label = String(cityName ? cityName(b) : b.name).trim();
      if (!label) continue;
      const size = (b.capital ? 13.8 : 12.4) * u;
      const tracking = 0.12 * size;
      const weight = b.capital ? 600 : 400;
      setFont(ctx, size, weight, false);
      const w = trackedWidth(ctx, label, tracking);
      const h = size * 1.1;
      const markerR = (b.capital ? 5.6 : 3.2) * u;
      const near = markerR + 2.4 * u, diag = near * 0.82;
      const leftFirst = X(b.x) > board.rect.x + board.rect.w * 0.72;
      const candidates = leftFirst
        ? [[-near, 0, 'right'], [near, 0, 'left'], [0, -markerR - size * 0.6, 'center'], [0, markerR + size * 0.6, 'center'],
           [-diag, -diag, 'right'], [-diag, diag, 'right'], [diag, -diag, 'left'], [diag, diag, 'left'],
           [0, -markerR - size * 1.7, 'center'], [0, markerR + size * 1.7, 'center'],
           [-near * 1.6, 0, 'right'], [near * 1.6, 0, 'left']]
        : [[near, 0, 'left'], [-near, 0, 'right'], [0, -markerR - size * 0.6, 'center'], [0, markerR + size * 0.6, 'center'],
           [diag, -diag, 'left'], [diag, diag, 'left'], [-diag, -diag, 'right'], [-diag, diag, 'right'],
           [0, -markerR - size * 1.7, 'center'], [0, markerR + size * 1.7, 'center'],
           [near * 1.6, 0, 'left'], [-near * 1.6, 0, 'right']];
      // Capitais podem ir um pouco mais longe, com uma linha-guia até o ponto,
      // para nunca ficarem sem nome quando o entorno está cheio.
      if (b.capital) {
        for (const radius of [near * 2.4, near * 3.4, near * 5, near * 7]) {
          for (const angle of [-90, -60, -30, 0, 30, 60, 90, 120, 150, 180, 210, 240]) {
            const rad = angle * Math.PI / 180;
            candidates.push([Math.cos(rad) * radius, Math.sin(rad) * radius, Math.cos(rad) >= 0 ? 'left' : 'right']);
          }
        }
      }
      const paint = (dx, dy, align, force) => {
        const x = X(b.x) + dx, y = Y(b.y) + dy;
        const cx = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;
        const box = bbox(cx, y, w + 3 * u, h + 2 * u, 0);
        if (!force && !board.fits(box)) return false;
        board.add(box);
        if (b.capital && Math.hypot(dx, dy) > 14 * u) {
          ctx.save();
          ctx.strokeStyle = hexA(pal.ink, 0.45);
          ctx.lineWidth = Math.max(0.35, 0.55 * u);
          ctx.beginPath();
          ctx.moveTo(X(b.x), Y(b.y));
          ctx.lineTo(align === 'left' ? x : align === 'right' ? x : x, y);
          ctx.stroke();
          ctx.restore();
        }
        drawTracked(ctx, label, x, y, {
          size, tracking, weight, color: css(labelInkOf(opts, pal, false)), alpha: 0.97, align,
          halo: {width: 2.4 * u, color: hexA(pal.land, 0.5)}
        });
        return true;
      };
      let placed = false;
      for (const [dx, dy, align] of candidates) {
        if (paint(dx, dy, align, false)) { placed = true; break; }
      }
      // A capital nunca fica sem nome: se todos os lados estiverem ocupados,
      // ela entra no lugar com menos sobreposição e as outras cidades cedem.
      if (!placed && b.capital) {
        let best = candidates[0], bestScore = Infinity;
        for (const [dx, dy, align] of candidates) {
          const x = X(b.x) + dx, y = Y(b.y) + dy;
          const cx = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;
          const box = bbox(cx, y, w + 3 * u, h + 2 * u, 0);
          const inside = box.x0 >= board.rect.x && box.y0 >= board.rect.y && box.x1 <= board.rect.x + board.rect.w && box.y1 <= board.rect.y + board.rect.h;
          const score = board.overlapScore(box) + (inside ? 0 : 1e9);
          if (score < bestScore) { bestScore = score; best = [dx, dy, align]; }
        }
        paint(best[0], best[1], best[2], true);
      }
    }
  }

  function stateCells(id) {
    return D.cells.filter(c => art.land[c.i] && c.state === id);
  }

  function drawFocusProvinceLabel(ctx, opts, pal, u, X, Y, board, focus) {
    if (!focus || focus.kind !== 'province') return;
    const p = provinces();
    if (!p) return;
    const pr = p.data.provinces.find(x => x.i === focus.id);
    if (!pr || !pr.labelPoint) return;
    const text = String(pr.name).toUpperCase();
    const size = clamp(11 + Math.sqrt(pr.area || 0) * 0.012, 11, 16) * u;
    const tracking = size * 0.22;
    setFont(ctx, size, 400, false);
    const w = trackedWidth(ctx, text, tracking);
    for (const dy of [0, -size * 1.6, size * 1.6]) {
      const x = X(pr.labelPoint[0]), y = Y(pr.labelPoint[1]) + dy;
      const box = bbox(x, y, w + 5 * u, size * 1.3 + 4 * u, 0);
      if (!board.fits(box)) continue;
      board.add(box);
      drawTracked(ctx, text, x, y, {
        size, tracking, color: css(labelInkOf(opts, pal, false)), alpha: 0.95,
        halo: {width: 2.8 * u, color: hexA(pal.land, 0.55)}
      });
      return;
    }
  }

  function drawStateLabels(ctx, opts, pal, u, X, Y, board, mode, focus) {
    if (opts.stateLabels === false) return new Set();
    const placedStates = new Set();
    let states = D.states.filter(s => s.i !== 0 && stateCells(s.i).length > 0);
    if (focus) {
      if (opts.focusHideStateName) states = states.filter(s => s.i !== focus.stateId);
      if (!opts.focusOtherStates) states = focus.kind === 'state' ? states.filter(s => s.i === focus.id) : [];
    }
    for (const s of states) {
      const cells = stateCells(s.i);
      if (!cells.length) continue;
      const area = cells.reduce((n, c) => n + c.area, 0);
      let cx = 0, cy = 0;
      for (const c of cells) { cx += c.p[0]; cy += c.p[1]; }
      cx /= cells.length; cy /= cells.length;
      // orientação pelo eixo principal
      let sxx = 0, syy = 0, sxy = 0;
      for (const c of cells) { const dx = c.p[0] - cx, dy = c.p[1] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
      let angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      if (Math.abs(angle) > Math.PI / 2) angle -= Math.sign(angle) * Math.PI;
      const elong = Math.abs(sxx - syy) / Math.max(1, Math.sqrt(sxx * syy));
      if (elong < 0.4) angle = 0;
      if (Math.abs(angle) < 0.08) angle = 0;
      const name = String(stateName ? stateName(s) : s.name).trim().toUpperCase();
      const size = clamp(Math.sqrt(area) * 0.078, 15, 33) * u;
      const tracking = size * 0.27;
      setFont(ctx, size, 600, false);
      const w = trackedWidth(ctx, name, tracking), h = size * 1.05;
      let placed = false;
      for (const [dx, dy] of [[0, 0], [0, -h * 1.4], [0, h * 1.4], [-w * 0.2, 0], [w * 0.2, 0]]) {
        const box = bbox(X(cx) + dx, Y(cy) + dy, w + 5 * u, h + 5 * u, angle);
        if (!board.fits(box)) continue;
        board.add(box);
        placedStates.add(s.i);
        drawTracked(ctx, name, X(cx) + dx, Y(cy) + dy, {
          size, tracking, weight: 600, color: css(labelInkOf(opts, pal, false)), alpha: 0.98, rotate: angle,
          halo: {width: 3 * u, color: hexA(pal.land, 0.55)}
        });
        placed = true;
        break;
      }
      if (!placed && angle !== 0) {
        const box = bbox(X(cx), Y(cy), w + 5 * u, h + 5 * u, 0);
        if (board.fits(box)) {
          board.add(box);
          placedStates.add(s.i);
          drawTracked(ctx, name, X(cx), Y(cy), {
            size, tracking, weight: 600, color: css(labelInkOf(opts, pal, false)), alpha: 0.98,
            halo: {width: 3 * u, color: hexA(pal.land, 0.55)}
          });
        }
      }
    }
    // terras livres
    if ((!focus || opts.focusOtherStates) && (mode === 'political' || mode === 'terrain')) {
      const neutral = D.cells.filter(c => art.land[c.i] && c.state === 0);
      if (neutral.length > 400) {
        const R = rng(4242);
        const buckets = new Map();
        for (const c of neutral) {
          const key = (Math.floor(c.p[0] / 500)) + ',' + (Math.floor(c.p[1] / 500));
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(c);
        }
        const groups = [...buckets.values()].sort((a, b) => b.length - a.length).slice(0, 2);
        for (const g of groups) {
          if (g.length < 500) continue;
          const cx = g.reduce((n, c) => n + c.p[0], 0) / g.length;
          const cy = g.reduce((n, c) => n + c.p[1], 0) / g.length;
          const size = 13 * u, tracking = 0.28 * size;
          const text = 'TERRAS LIVRES';
          setFont(ctx, size, 400, false);
          const w = trackedWidth(ctx, text, tracking);
          const box = bbox(X(cx), Y(cy), w + 4 * u, size * 1.2 + 4 * u, 0);
          if (!board.fits(box)) continue;
          board.add(box);
          drawTracked(ctx, text, X(cx), Y(cy), {
            size, tracking, color: pal.inkSoft, alpha: 0.7,
            halo: {width: 2.6 * u, color: hexA(pal.land, 0.5)}
          });
        }
      }
    }
    return placedStates;
  }

  function drawBorderStateLabels(ctx, opts, pal, u, X, Y, board, focus, placedStates) {
    if (!focus || !opts.focusBorderStateNames || opts.stateLabels === false) return;
    const entries = [...(focus.borderEdges || new Map())];
    let shown = 0;
    for (const [stateId, edges] of entries) {
      if (shown >= 8) break;
      if (placedStates && placedStates.has(stateId)) continue;
      const st = D.states.find(s => s.i === stateId);
      if (!st) continue;
      const name = String(stateName ? stateName(st) : st.name).trim().toUpperCase();
      const chains = stitch(edges, art.vx, art.vy).filter(ch => ch.points.length > 1);
      if (!chains.length) continue;
      chains.sort((a, b) => b.points.length - a.points.length);
      const pts = chains[0].points;
      const size = 8.4 * u, tracking = 1.5 * u;
      setFont(ctx, size, 500, false);
      const w = trackedWidth(ctx, name, tracking);
      let done = false;
      for (const fraction of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const idx = clamp(Math.round((pts.length - 1) * fraction), 1, pts.length - 2);
        const p = pts[idx], prev = pts[idx - 1], next = pts[idx + 1];
        const dx = next[0] - prev[0], dy = next[1] - prev[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        for (const side of [1, -1]) {
          for (const off of [13, 23, 35]) {
            const mx = p[0] + side * nx * off, my = p[1] + side * ny * off;
            const cellId = cellAtPoint(mx, my);
            if (cellId < 0 || D.cells[cellId].state !== stateId) continue;
            const x = X(mx), y = Y(my);
            const box = bbox(x, y, w + 6 * u, size * 1.2 + 4 * u, 0);
            if (!board.fits(box)) continue;
            board.add(box);
            drawTracked(ctx, name, x, y, {
              size, tracking, weight: 500, color: css(labelInkOf(opts, pal, true)), alpha: 0.86,
              halo: {width: 2.5 * u, color: hexA(pal.paperLight, 0.55)}
            });
            done = true;
            shown++;
            break;
          }
          if (done) break;
        }
        if (done) break;
      }
    }
  }

  function drawWaterLabels(ctx, opts, pal, u, X, Y, board, mode, focus) {
    const waterKinds = new Set(['mar', 'baía', 'lago']);
    for (const l of D.landmarks || []) {
      if (!waterKinds.has(l.kind)) continue;
      if (focus && !opts.focusOtherPois && !(l.point[0] >= focus.x0 - 90 && l.point[0] <= focus.x1 + 90 && l.point[1] >= focus.y0 - 90 && l.point[1] <= focus.y1 + 90)) continue;
      const size = (l.kind === 'lago' ? 9.6 : 13.4) * u;
      const tracking = 0.26 * size;
      const text = String(l.name).toUpperCase();
      setFont(ctx, size, 400, true);
      const w = trackedWidth(ctx, text, tracking);
      const angles = l.kind === 'lago' ? [0] : [-0.1, 0.08, 0, -0.2, 0.18];
      for (const rot of angles) {
        const box = bbox(X(l.point[0]), Y(l.point[1]), w + 6 * u, size * 1.3 + 4 * u, rot);
        if (!board.fits(box)) continue;
        board.add(box);
        drawTracked(ctx, text, X(l.point[0]), Y(l.point[1]), {
          size, tracking, italic: true, color: css(labelInkOf(opts, pal, false)), alpha: 0.85, rotate: rot,
          halo: {width: 2.6 * u, color: hexA(pal.seaMid, 0.55)}
        });
        break;
      }
    }
  }

  function drawPoiLabels(ctx, opts, pal, u, X, Y, board, mode, focus) {
    const level = poiModeOf(opts);
    if (level === 'none') return;
    const skip = new Set(['mar', 'baía', 'lago']);
    const natural = new Set(['montanha', 'floresta', 'floresta morta', 'deserto', 'pântano', 'campinas', 'desfiladeiro', 'vulcão', 'ilha', 'bioma']);
    const list = (D.landmarks || []).filter(l => !skip.has(l.kind) && (level !== 'natural' || natural.has(l.kind)));
    for (const l of list) {
      if (focus && !opts.focusOtherPois) {
        const cellId = cellAtPoint(l.point[0], l.point[1]);
        const inside = focus.set.has(cellId);
        const near = focus.near.has(cellId);
        if (!inside && !(near && natural.has(l.kind))) continue;
      }
      const size = 10.2 * u, tracking = 0.17 * size;
      const text = String(l.name).toUpperCase();
      setFont(ctx, size, 400, true);
      const w = trackedWidth(ctx, text, tracking);
      const x = X(l.point[0]), y = Y(l.point[1]);
      const glyph = 4.4 * u;
      const options = [
        [glyph + 3 * u, 0, 'left'],
        [-glyph - 3 * u, 0, 'right'],
        [0, -glyph - size, 'center'],
        [0, glyph + size, 'center']
      ];
      for (const [dx, dy, align] of options) {
        const tx = x + dx, ty = y + dy;
        const cx = align === 'left' ? tx + w / 2 : align === 'right' ? tx - w / 2 : tx;
        const box = bbox(cx, ty, w + 3 * u, size * 1.2 + 2 * u, 0);
        if (!board.fits(box)) continue;
        board.add(box);
        poiGlyph(ctx, l.kind, x, y, glyph, pal, 0.9);
        drawTracked(ctx, text, tx, ty, {
          size, tracking, italic: true, color: css(labelInkOf(opts, pal, true)), alpha: 0.92, align,
          halo: {width: 2.2 * u, color: hexA(pal.land, 0.55)}
        });
        break;
      }
    }
  }

  function drawRiverLabels(ctx, opts, pal, u, X, Y, board, mode, focus) {
    if (opts.riverLabels === false) return;
    const rivers = [...D.rivers]
      .filter(r => r.name && r.points && r.points.length >= 4)
      .sort((a, b) => (b.major ? 1 : 0) - (a.major ? 1 : 0) || (b.width || 0) - (a.width || 0));
    for (const river of rivers) {
      const pts = river.points;
      if (focus && !opts.focusOtherPois && !pts.some(pt => pt[0] >= focus.x0 - 40 && pt[0] <= focus.x1 + 40 && pt[1] >= focus.y0 - 40 && pt[1] <= focus.y1 + 40)) continue;
      const major = !!river.major;
      const size = (major ? 11.2 : 8.8) * u;
      const tracking = (major ? 0.2 : 0.14) * size;
      const text = river.name.toUpperCase();
      setFont(ctx, size, major ? 500 : 400, true);
      const w = trackedWidth(ctx, text, tracking);
      const fractions = major ? [0.5, 0.36, 0.64, 0.24, 0.76] : [0.5, 0.36, 0.64];
      let placed = false;
      for (const fraction of fractions) {
        const idx = clamp(Math.round((pts.length - 1) * fraction), 1, pts.length - 2);
        const p = pts[idx], prev = pts[idx - 1], next = pts[idx + 1];
        const angle = Math.atan2(Y(next[1]) - Y(prev[1]), X(next[0]) - X(prev[0]));
        let rot = angle > Math.PI / 2 ? angle - Math.PI : angle < -Math.PI / 2 ? angle + Math.PI : angle;
        rot = clamp(rot, -1.05, 1.05);
        const nx = -Math.sin(rot), ny = Math.cos(rot);
        for (const off of [0, size * 0.9, -size * 0.9]) {
          const x = X(p[0]) + nx * off, y = Y(p[1]) + ny * off;
          const box = bbox(x, y, w + 6 * u, size * 1.2 + 4 * u, rot);
          if (!board.fits(box)) continue;
          board.add(box);
          drawTracked(ctx, text, x, y, {
            size, tracking, italic: true, weight: major ? 600 : 400,
            color: css(mix(hexRgb(pal.ink), hexRgb(pal.river), major ? 0.22 : 0.45)),
            alpha: major ? 0.94 : 0.72, rotate: rot,
            halo: {width: (major ? 3 : 2.1) * u, color: hexA(pal.paperLight, major ? 0.62 : 0.45)}
          });
          placed = true;
          break;
        }
        if (placed) break;
      }
    }
  }

  /* ------------------------------------------------------------ legenda por modo */

  function buildLegend(mode, pal, opts, focus) {
    const base = {title: 'LEGENDA', entries: []};
    if (mode === 'terrain') {
      base.note = 'Relevo, vegetação e hidrografia';
      const relief = opts.reliefStyle || (opts.relief === false ? 'none' : 'shade');
      base.entries = [
        relief === 'glyphs' ? {sample: 'mountain', label: 'Montanha'} : relief === 'shade' ? {sample: 'shade', label: 'Relevo sombreado'} : null,
        {sample: 'conifer', label: 'Floresta'},
        {sample: 'tree', label: 'Bosque'},
        {sample: 'river', label: 'Rio'},
        {sample: 'border', label: 'Fronteira de estado'},
        {sample: 'capital', label: 'Capital'},
        {sample: 'city', label: 'Cidade principal'},
        {sample: 'poi', label: 'Ponto de interesse'}
      ].filter(Boolean);
    } else if (mode === 'political') {
      base.note = 'Estados e territórios livres';
      let states = D.states.filter(s => s.i !== 0).map(s => {
        const area = D.cells.reduce((n, c) => n + (art.land[c.i] && c.state === s.i ? c.area : 0), 0);
        return {s, area};
      }).filter(x => x.area > 0).sort((a, b) => b.area - a.area);
      if (focus) states = states.filter(({s}) => s.i === focus.stateId);
      base.entries = states.map(({s}) => ({color: mix(mute(s.color || '#aaa', 0.3, 0.68, 0.78), hexRgb(pal.land), themeMix(pal, false)), label: String(stateName ? stateName(s) : s.name).trim()}));
      if (!focus) base.entries.push({color: hexRgb(pal.neutral), label: 'Terras livres'});
    } else if (mode === 'population') {
      const pop = population();
      base.title = 'POPULAÇÃO URBANA';
      base.note = 'Manchas de densidade a partir das cidades';
      base.ramp = {max: pop.max};
      base.entries = [];
    } else if (mode === 'culture' || mode === 'religion') {
      const field = society();
      const ids = new Map();
      const scan = focus ? focus.set : null;
      if (scan) {
        for (const cellId of scan) {
          const id = field[mode][cellId];
          ids.set(id, (ids.get(id) || 0) + D.cells[cellId].area);
        }
      } else {
        for (let i = 0; i < D.cells.length; i++) {
          if (!art.land[i]) continue;
          const id = field[mode][i];
          ids.set(id, (ids.get(id) || 0) + D.cells[i].area);
        }
      }
      const list = [...ids].sort((a, b) => b[1] - a[1]);
      base.title = mode === 'culture' ? 'CULTURAS' : 'RELIGIÕES';
      base.note = 'Entorno das cidades';
      for (const [id] of list) {
        const category = id < 0 ? null : (mode === 'culture' ? D.cultures : D.religions).find(x => x.i === id);
        let color;
        if (id < 0) color = hexRgb(pal.unknown);
        else if (id === 0) color = hexRgb('#a7b3ad');
        else {
          const hue = ((id * 137.508) + (mode === 'religion' ? 34 : 0)) % 360;
          color = mix(hslToRgb(hue / 360, 0.21, 0.73), hexRgb(pal.land), themeMix(pal, false));
        }
        base.entries.push({color, label: category ? category.name : 'Sem informação'});
      }
    } else if (mode === 'goods') {
      const map = economy();
      base.title = 'BENS PRODUZIDOS';
      if (!map) { base.note = 'Economia ainda não carregada'; return base; }
      base.note = 'Bem predominante por província';
      let rows = [...map.goods.values()].sort((a, b) => b.provinces - a.provinces);
      if (focus) {
        const present = new Set();
        for (const cellId of focus.set) present.add(map.goodsField[cellId]);
        rows = rows.filter(row => present.has(row.good));
      }
      for (const row of rows) {
        const g = map.model.goods.get(row.good);
        base.entries.push({color: mix(mute(goodColor(row.good), 0.26, 0.68, 0.79), hexRgb(pal.land), themeMix(pal, false)), label: g ? g.name : 'Bem ' + row.good});
      }
    } else if (mode === 'markets') {
      const map = economy();
      base.title = 'MERCADOS';
      if (!map) { base.note = 'Economia ainda não carregada'; return base; }
      base.note = 'Território comercial de cada mercado';
      let marketList = [...map.marketInfo.values()].sort((a, b) => b.localValue - a.localValue);
      if (focus) {
        const present = new Set();
        for (const cellId of focus.set) present.add(map.marketField[cellId]);
        marketList = marketList.filter(m => present.has(m.i));
      }
      for (const m of marketList) {
        base.entries.push({color: mix(mute(m.color || '#aaa', 0.24, 0.69, 0.8), hexRgb(pal.land), themeMix(pal, false)), label: m.name});
      }
    } else if (mode === 'provinces') {
      base.title = 'PROVÍNCIAS';
      const p = provinces();
      base.note = p ? `${p.data.provinces.length} províncias · divisão sugerida` : 'Divisão indisponível';
      base.entries = [];
    }
    return base;
  }

  return {
    renderSheet,
    invalidate() {
      cache.society = null;
      cache.population = null;
      cache.economy = null;
      cache.rasters.clear();
    },
    hasEconomy: () => !!economy(),
    hasProvinces: () => !!provinces(),
    goods: () => {
      const e = getEconomy && getEconomy();
      try { return e ? e.goodsList().map(g => ({i: g.i, name: g.name})) : []; } catch { return []; }
    }
  };
}
