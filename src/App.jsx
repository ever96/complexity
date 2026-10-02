import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  Network, Layers, TrendingUp, ArrowRight, Compass,
  BarChart2, Sparkles, X, Check, HelpCircle, LayoutGrid, Download
} from 'lucide-react';

/* ============================================================
   DATOS MOCK
   ============================================================ */
const mockProducts = [
  {
    id: '120100',
    name: 'Soya beans: whether or not broken (Soja)',
    category: 'Agricultura / Agroindustria',
    rca: 8.87, factibilidad: 0.85, valor: 0.60, delta: 0.12, m_star: 0.20,
    x: 140, y: 120,
    spillovers: ['Aceites vegetales', 'Alimentos balanceados', 'Logística fluvial'],
    politica: 'Ninguno (Caso espontáneo / Ventaja natural)',
    description: 'Producto primario con ventaja comparativa masiva e histórica en la estructura económica de Paraguay.'
  },
  {
    id: '150710',
    name: 'Vegetable oils: soya-bean oil and fractions',
    category: 'Agroindustria Procesada',
    rca: 7.10, factibilidad: 0.78, valor: 0.75, delta: 0.25, m_star: 0.40,
    x: 280, y: 190,
    spillovers: ['Química fina', 'Biodiésel', 'Empaques industriales'],
    politica: 'II-C: Compra pública / Regulación de estándares de calidad',
    description: 'Derivado industrial de la soja que representa un salto de complejidad intermedia en la cadena de valor.'
  },
  {
    id: '480522',
    name: 'Paper and paperboard: uncoated, multi-ply',
    category: 'Celulosa y Papel',
    rca: 9.18, factibilidad: 0.65, valor: 0.70, delta: 0.35, m_star: 0.55,
    x: 420, y: 110,
    spillovers: ['Embalajes avanzados', 'Impresión técnica'],
    politica: 'I-C: Subsidio a I+D y patentes forestales',
    description: 'Producto derivado del sector forestal con alta densidad de capital y encadenamientos industriales significativos.'
  },
  {
    id: '483220',
    name: 'Componentes de precisión óptica / Láser',
    category: 'Manufactura Avanzada',
    rca: 0.45, factibilidad: 0.35, valor: 0.94, delta: 0.68, m_star: 0.75,
    x: 560, y: 240,
    spillovers: ['Óptica', 'Metrología', 'Equipamiento médico', 'Defensa'],
    politica: 'III-C: Big Push (Inversión simultánea y Joint Venture)',
    description: 'Producto de alta complejidad económica. Presenta una brecha de capacidades alta, pero un potencial de spillovers transformador.'
  }
];

const mockLinks = [
  { source: '120100', target: '150710', proximity: 0.88 },
  { source: '150710', target: '480522', proximity: 0.65 },
  { source: '480522', target: '483220', proximity: 0.41 },
  { source: '120100', target: '483220', proximity: 0.30 }
];

const productsCatalog = {
  '120100': { name: 'Soya beans',                category: 'Agricultura' },
  '150710': { name: 'Soya-bean oil',             category: 'Agroindustria' },
  '230400': { name: 'Soya-bean oil-cake',        category: 'Agroindustria' },
  '020230': { name: 'Bovine meat, frozen',       category: 'Agroindustria' },
  '100590': { name: 'Maize (corn)',              category: 'Agricultura' },
  '480522': { name: 'Paper and paperboard',      category: 'Celulosa y papel' },
  '440711': { name: 'Wood sawn',                 category: 'Forestal' },
  '470321': { name: 'Wood pulp (chemical)',      category: 'Celulosa y papel' },
  '740311': { name: 'Copper cathodes',           category: 'Minería' },
  '260300': { name: 'Copper ores',               category: 'Minería' },
  '270900': { name: 'Crude petroleum',           category: 'Energía' },
  '710812': { name: 'Gold, unwrought',           category: 'Minería' },
  '260800': { name: 'Zinc ores',                 category: 'Minería' },
  '800110': { name: 'Tin, unwrought',            category: 'Minería' },
  '740200': { name: 'Copper anodes',             category: 'Minería' },
  '170114': { name: 'Cane sugar, raw',           category: 'Agroindustria' },
  '090111': { name: 'Coffee, not roasted',       category: 'Agricultura' },
  '220421': { name: 'Wine of fresh grapes',      category: 'Agroindustria' },
  '040210': { name: 'Milk powder',               category: 'Agroindustria' },
  '030214': { name: 'Salmon, fresh',             category: 'Pesca' },
  '030617': { name: 'Shrimps and prawns',        category: 'Pesca' },
  '080440': { name: 'Avocados, fresh',           category: 'Agricultura' },
  '080810': { name: 'Apples, fresh',             category: 'Agricultura' },
  '260111': { name: 'Iron ores',                 category: 'Minería' },
  '720711': { name: 'Iron semis',                category: 'Siderurgia' },
  '870323': { name: 'Automobiles',               category: 'Automotriz' },
  '880240': { name: 'Aircraft',                  category: 'Aeroespacial' },
  '300490': { name: 'Medicaments',               category: 'Farmacéutica' },
  '850231': { name: 'Wind generating sets',      category: 'Energías renovables' },
  '483220': { name: 'Optical components',        category: 'Manufactura avanzada' }
};

const countryData = {
  PY: {
    name: 'Paraguay', flag: '🇵🇾',
    products: {
      '120100': { value: 3500, rca: 8.87 },
      '230400': { value: 1500, rca: 8.20 },
      '020230': { value: 1400, rca: 4.50 },
      '150710': { value: 1200, rca: 7.10 },
      '100590': { value: 900,  rca: 2.10 },
      '480522': { value: 400,  rca: 9.18 },
      '440711': { value: 300,  rca: 1.80 },
      '740311': { value: 200,  rca: 0.30 },
      '870323': { value: 150,  rca: 0.10 },
      '483220': { value: 50,   rca: 0.45 }
    }
  },
  UY: {
    name: 'Uruguay', flag: '🇺🇾',
    products: {
      '020230': { value: 2200, rca: 12.50 },
      '120100': { value: 1800, rca: 3.20 },
      '480522': { value: 1500, rca: 10.50 },
      '470321': { value: 1200, rca: 6.00 },
      '440711': { value: 800,  rca: 3.50 },
      '040210': { value: 700,  rca: 8.00 },
      '100590': { value: 500,  rca: 1.20 },
      '300490': { value: 250,  rca: 1.80 },
      '870323': { value: 200,  rca: 0.40 },
      '220421': { value: 100,  rca: 1.50 }
    }
  },
  BO: {
    name: 'Bolivia', flag: '🇧🇴',
    products: {
      '710812': { value: 2000, rca: 4.50 },
      '270900': { value: 1500, rca: 2.00 },
      '260800': { value: 1200, rca: 8.50 },
      '800110': { value: 800,  rca: 15.00 },
      '120100': { value: 600,  rca: 2.50 },
      '230400': { value: 400,  rca: 2.20 },
      '150710': { value: 300,  rca: 2.00 },
      '740311': { value: 250,  rca: 1.50 }
    }
  },
  CL: {
    name: 'Chile', flag: '🇨🇱',
    products: {
      '740311': { value: 20000, rca: 25.00 },
      '260300': { value: 15000, rca: 20.00 },
      '030214': { value: 5000,  rca: 15.00 },
      '470321': { value: 3000,  rca: 8.00 },
      '740200': { value: 2000,  rca: 10.00 },
      '220421': { value: 1800,  rca: 12.00 },
      '030617': { value: 900,   rca: 6.00 },
      '080810': { value: 800,   rca: 5.50 },
      '440711': { value: 500,   rca: 1.50 },
      '080440': { value: 400,   rca: 6.50 }
    }
  },
  BR: {
    name: 'Brasil', flag: '🇧🇷',
    products: {
      '120100': { value: 45000, rca: 12.00 },
      '270900': { value: 40000, rca: 3.00 },
      '260111': { value: 30000, rca: 15.00 },
      '170114': { value: 12000, rca: 10.00 },
      '020230': { value: 10000, rca: 6.00 },
      '230400': { value: 9000,  rca: 10.00 },
      '090111': { value: 8000,  rca: 15.00 },
      '870323': { value: 6000,  rca: 1.50 },
      '720711': { value: 5000,  rca: 5.00 },
      '880240': { value: 4000,  rca: 2.00 }
    }
  }
};

/* ============================================================
   HELPERS
   ============================================================ */
function formatValue(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}B`;
  return `$${v}M`;
}

function truncate(str, maxChars) {
  if (str.length <= maxChars) return str;
  return str.slice(0, Math.max(maxChars - 1, 1)) + '…';
}

/* ---------- Paleta por sector ---------- */
const SECTOR_HUES = {
  'Agricultura':          142,
  'Agroindustria':         32,
  'Forestal':              85,
  'Celulosa y papel':     174,
  'Pesca':                195,
  'Siderurgia':           220,
  'Manufactura avanzada': 255,
  'Aeroespacial':         280,
  'Minería':              300,
  'Automotriz':           325,
  'Farmacéutica':         345,
  'Energía':                5,
  'Energías renovables':   55,
};
const DEFAULT_HUE = 220;

const RCA_LEVELS = [
  { l: 94, s: 50, text: 'dark'  },
  { l: 80, s: 65, text: 'dark'  },
  { l: 62, s: 72, text: 'dark'  },
  { l: 42, s: 72, text: 'white' },
  { l: 26, s: 70, text: 'white' },
];

function getRcaLevel(rca) {
  if (rca < 1)  return 0;
  if (rca < 3)  return 1;
  if (rca < 6)  return 2;
  if (rca < 12) return 3;
  return 4;
}

/* HSL → RGB (para jsPDF que solo acepta RGB) */
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
}

function rcaColor(rca, sector) {
  const hue = SECTOR_HUES[sector] ?? DEFAULT_HUE;
  const level = getRcaLevel(rca);
  const { l, s, text } = RCA_LEVELS[level];
  return {
    bg:     `hsl(${hue}, ${s}%, ${l}%)`,
    fg:     text === 'white' ? '#ffffff' : `hsl(${hue}, 55%, 12%)`,
    border: level === 0 ? `hsl(${hue}, 45%, 76%)` : 'transparent',
    dashed: level === 0,
    hue, level, l, s, text,
    rgb: hslToRgb(hue, s, l),
  };
}

/* ============================================================
   TREEMAP — squarify algorithm
   ============================================================ */
function worstRatio(row, w) {
  if (row.length === 0) return Infinity;
  const sum = row.reduce((s, r) => s + r.area, 0);
  const max = Math.max(...row.map((r) => r.area));
  const min = Math.min(...row.map((r) => r.area));
  return Math.max((w * w * max) / (sum * sum), (sum * sum) / (w * w * min));
}

function squarify(items, x, y, w, h) {
  if (items.length === 0) return [];
  const total = items.reduce((s, i) => s + i.value, 0);
  const areaTotal = w * h;
  const nodes = items
    .map((i) => ({ ...i, area: (i.value / total) * areaTotal }))
    .sort((a, b) => b.area - a.area);

  const result = [];
  let remaining = nodes;
  let rx = x, ry = y, rw = w, rh = h;

  while (remaining.length > 0) {
    const shortSide = Math.min(rw, rh);
    const isVertical = rw >= rh;

    let row = [];
    let bestWorst = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const candidate = [...row, remaining[i]];
      const w2 = worstRatio(candidate, shortSide);
      if (w2 <= bestWorst) { row = candidate; bestWorst = w2; }
      else break;
    }

    const rowArea = row.reduce((s, r) => s + r.area, 0);
    const rowThickness = rowArea / shortSide;

    let pos = 0;
    for (const item of row) {
      const itemLength = item.area / rowThickness;
      if (isVertical) result.push({ ...item, x: rx, y: ry + pos, w: rowThickness, h: itemLength });
      else            result.push({ ...item, x: rx + pos, y: ry, w: itemLength, h: rowThickness });
      pos += itemLength;
    }

    if (isVertical) { rx += rowThickness; rw -= rowThickness; }
    else            { ry += rowThickness; rh -= rowThickness; }

    remaining = remaining.slice(row.length);
  }

  return result;
}

/* ============================================================
   PDF — generación de reporte
   ============================================================ */
function generatePDFReport(countryCode) {
  const data = countryData[countryCode];
  const items = Object.entries(data.products).map(([id, d]) => ({
    id,
    value: d.value,
    rca: d.rca,
    name: productsCatalog[id]?.name || id,
    category: productsCatalog[id]?.category || 'Otros',
  }));

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const CW = W - M * 2;

  const totalValue = items.reduce((s, i) => s + i.value, 0);
  const avgRca = items.reduce((s, i) => s + i.rca * i.value, 0) / totalValue;
  const highRcaCount = items.filter(i => i.rca >= 1).length;
  const today = new Date().toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' });

  /* ============ HEADER ============ */
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, W, 90, 'F');

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M, 24, 32, 32, 6, 6, 'F');
  doc.setFillColor(9, 9, 11);
  doc.circle(M + 16, 40, 6, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('EconoFold Intelligence', M + 44, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 170);
  doc.text('Reporte de Complejidad Económica y Recomendación de Políticas', M + 44, 58);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(data.name.toUpperCase(), W - M, 42, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 170);
  doc.text(today, W - M, 58, { align: 'right' });

  /* ============ KPI CARDS ============ */
  let y = 120;
  const cardW = (CW - 24) / 3;
  const cardH = 74;

  const kpis = [
    { label: 'EXPORTACIONES TOTALES', value: formatValue(totalValue), sub: 'Millones USD · 2024' },
    { label: 'PRODUCTOS ANALIZADOS', value: String(items.length), sub: `${highRcaCount} con RCA ≥ 1` },
    { label: 'RCA PROMEDIO PONDERADO', value: avgRca.toFixed(2), sub: 'Ventaja comparativa' },
  ];

  kpis.forEach((kpi, i) => {
    const x = M + i * (cardW + 12);
    doc.setDrawColor(228, 228, 231);
    doc.setFillColor(250, 250, 251);
    doc.setLineWidth(0.75);
    doc.roundedRect(x, y, cardW, cardH, 6, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(113, 113, 122);
    doc.text(kpi.label, x + 12, y + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(9, 9, 11);
    doc.text(kpi.value, x + 12, y + 46);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(kpi.sub, x + 12, y + 62);
  });

  y += cardH + 32;

  /* ============ SECTION: COMPOSICIÓN SECTORIAL ============ */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(9, 9, 11);
  doc.text('COMPOSICIÓN SECTORIAL', M, y);
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.5);
  doc.line(M, y + 6, M + CW, y + 6);
  y += 22;

  const sectorMap = {};
  items.forEach(it => {
    if (!sectorMap[it.category]) {
      sectorMap[it.category] = { name: it.category, value: 0, hue: SECTOR_HUES[it.category] ?? DEFAULT_HUE };
    }
    sectorMap[it.category].value += it.value;
  });
  const sectors = Object.values(sectorMap).sort((a, b) => b.value - a.value);
  const maxSectorValue = sectors[0].value;

  const barLabelW = 130;
  const barValueW = 90;
  const barMaxW = CW - barLabelW - barValueW - 10;
  const barH = 14;
  const barGap = 10;

  sectors.forEach((s, i) => {
    const rowY = y + i * (barH + barGap);
    const pct = (s.value / totalValue) * 100;
    const barW = (s.value / maxSectorValue) * barMaxW;
    const [r, g, b] = hslToRgb(s.hue, 72, 52);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(63, 63, 70);
    doc.text(s.name, M, rowY + barH - 3);

    doc.setFillColor(244, 244, 245);
    doc.roundedRect(M + barLabelW, rowY, barMaxW, barH, 3, 3, 'F');

    doc.setFillColor(r, g, b);
    doc.roundedRect(M + barLabelW, rowY, barW, barH, 3, 3, 'F');

    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(24, 24, 27);
    doc.text(`${formatValue(s.value)}  ${pct.toFixed(1)}%`, M + CW, rowY + barH - 3, { align: 'right' });
  });

  y += sectors.length * (barH + barGap) + 24;

  /* ============ SECTION: TOP PRODUCTOS ============ */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(9, 9, 11);
  doc.text('TOP PRODUCTOS POR VALOR EXPORTADO', M, y);
  doc.setDrawColor(228, 228, 231);
  doc.line(M, y + 6, M + CW, y + 6);
  y += 22;

  const topItems = [...items].sort((a, b) => b.value - a.value).slice(0, 8);
  const rowH = 26;
  const colCode = M + 8;
  const colName = M + 60;
  const colSector = M + 260;
  const colValue = M + CW - 100;
  const colRca = M + CW - 8;

  doc.setFillColor(9, 9, 11);
  doc.rect(M, y, CW, rowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CPC', colCode, y + rowH - 9);
  doc.text('PRODUCTO', colName, y + rowH - 9);
  doc.text('SECTOR', colSector, y + rowH - 9);
  doc.text('EXPORT.', colValue, y + rowH - 9, { align: 'right' });
  doc.text('RCA', colRca, y + rowH - 9, { align: 'right' });
  y += rowH;

  topItems.forEach((it, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(250, 250, 251);
      doc.rect(M, y, CW, rowH, 'F');
    }

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(9, 9, 11);
    doc.text(it.id, colCode, y + rowH - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(9, 9, 11);
    const nameMaxW = colSector - colName - 8;
    let displayName = it.name;
    while (doc.getTextWidth(displayName) > nameMaxW && displayName.length > 4) {
      displayName = displayName.slice(0, -1);
    }
    if (displayName !== it.name) displayName = displayName.slice(0, -1) + '…';
    doc.text(displayName, colName, y + rowH - 9);

    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    doc.text(it.category, colSector, y + rowH - 9);

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(9, 9, 11);
    doc.text(formatValue(it.value), colValue, y + rowH - 9, { align: 'right' });

    if (it.rca >= 1) doc.setTextColor(9, 9, 11);
    else             doc.setTextColor(113, 113, 122);
    doc.text(String(it.rca), colRca, y + rowH - 9, { align: 'right' });

    y += rowH;
  });

  /* Footer page 1 */
  doc.setDrawColor(228, 228, 231);
  doc.line(M, H - 40, M + CW, H - 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text('EconoFold Intelligence · Generado con motor GNN + Econoformer', M, H - 26);
  doc.text('Página 1 de 2', W - M, H - 26, { align: 'right' });

  /* ============ PAGE 2: TREEMAP ============ */
  doc.addPage();

  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, W, 60, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Mapa de composición exportadora', M, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(160, 160, 170);
  doc.text(`${data.name} · ${items.length} productos · ${formatValue(totalValue)} exportados`, M, 44);

  y = 90;

  const tmW = CW;
  const tmH = 380;
  const tiles = squarify([...items].sort((a, b) => b.value - a.value), M, y, tmW, tmH);

  tiles.forEach(t => {
    if (t.w < 2 || t.h < 2) return;
    const c = rcaColor(t.rca, t.category);

    doc.setFillColor(c.rgb[0], c.rgb[1], c.rgb[2]);
    if (c.level === 0) {
      const borderRgb = hslToRgb(c.hue, 45, 76);
      doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
      doc.setLineWidth(0.5);
      doc.rect(t.x, t.y, t.w, t.h, 'FD');
    } else {
      doc.rect(t.x, t.y, t.w, t.h, 'F');
    }

    if (t.w > 60 && t.h > 24) {
      const textRgb = c.text === 'white' ? [255, 255, 255] : hslToRgb(c.hue, 55, 12);
      doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      const maxW = t.w - 10;
      let name = t.name;
      while (doc.getTextWidth(name) > maxW && name.length > 3) {
        name = name.slice(0, -1);
      }
      if (name !== t.name && name.length > 3) name = name.slice(0, -1) + '…';
      doc.text(name, t.x + 5, t.y + 12);

      if (t.h > 40) {
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.text(formatValue(t.value), t.x + 5, t.y + 22);
      }
    }
  });

  y += tmH + 20;

  /* Legend */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(82, 82, 91);
  doc.text('ESCALA RCA', M, y + 10);

  const legend = [
    { label: '< 1', l: 94, s: 50 },
    { label: '1–3', l: 80, s: 65 },
    { label: '3–6', l: 62, s: 72 },
    { label: '6–12', l: 42, s: 72 },
    { label: '≥ 12', l: 26, s: 70 },
  ];
  let lx = M + 80;
  legend.forEach(item => {
    const [r, g, b] = hslToRgb(DEFAULT_HUE, item.s, item.l);
    doc.setFillColor(r, g, b);
    doc.rect(lx, y + 3, 12, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    doc.text(item.label, lx + 16, y + 12);
    lx += 60;
  });

  y += 40;

  /* Insights */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(9, 9, 11);
  doc.text('LECTURA ESTRATÉGICA', M, y);
  doc.setDrawColor(228, 228, 231);
  doc.line(M, y + 6, M + CW, y + 6);
  y += 24;

  const topSector = sectors[0];
  const opportunityItems = items.filter(i => i.rca < 1 && i.value > 100);
  const dominantItem = topItems[0];
  const concentrationPct = ((dominantItem.value / totalValue) * 100).toFixed(1);

  const insights = [
    `El sector "${topSector.name}" concentra el ${((topSector.value / totalValue) * 100).toFixed(1)}% del valor exportado, con ${formatValue(topSector.value)} en 2024.`,
    `El producto líder es ${dominantItem.name} (CPC ${dominantItem.id}) con ${formatValue(dominantItem.value)}, representando el ${concentrationPct}% del total exportado del país.`,
    opportunityItems.length > 0
      ? `Se identificaron ${opportunityItems.length} producto(s) sin ventaja comparativa revelada (RCA < 1) pero con volumen significativo: ${opportunityItems.slice(0, 3).map(i => i.name).join(', ')}.`
      : `Todos los productos del top exportador presentan RCA ≥ 1, indicando una canasta altamente competitiva.`,
    `El RCA promedio ponderado por valor es ${avgRca.toFixed(2)}, ${avgRca > 3 ? 'muy por encima' : avgRca > 1 ? 'por encima' : 'por debajo'} del umbral de ventaja comparativa (1.0).`,
  ];

  let insightY = y;
  insights.forEach((text) => {
    doc.setFillColor(9, 9, 11);
    doc.circle(M + 4, insightY + 4, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(63, 63, 70);
    const lines = doc.splitTextToSize(text, CW - 20);
    doc.text(lines, M + 14, insightY + 6);
    insightY += lines.length * 12 + 8;
  });

  /* Footer page 2 */
  doc.setDrawColor(228, 228, 231);
  doc.line(M, H - 40, M + CW, H - 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(161, 161, 170);
  doc.text('EconoFold Intelligence · Reporte generado automáticamente', M, H - 26);
  doc.text('Página 2 de 2', W - M, H - 26, { align: 'right' });

  const safeName = data.name.replace(/[^a-z0-9]/gi, '_');
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`EconoFold_${safeName}_${stamp}.pdf`);
}

/* ============================================================
   CSS GLOBAL
   ============================================================ */
const globalCss = `
  :root {
    --gray-50: #fafafa; --gray-100: #f4f4f5; --gray-200: #e4e4e7;
    --gray-300: #d4d4d8; --gray-400: #a1a1aa; --gray-500: #71717a;
    --gray-600: #52525b; --gray-700: #3f3f46; --gray-900: #18181b;
    --ink: #09090b; --success: #10b981; --warning: #f59e0b; --danger: #ef4444;
    --fs-xs: 0.7rem; --fs-sm: 0.8rem; --fs-md: 0.875rem; --fs-lg: 1.05rem; --fs-xl: 1.25rem;
    --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 20px; --sp-6: 24px; --sp-8: 32px;
    --r-sm: 6px; --r-md: 10px; --r-lg: 14px; --r-pill: 999px;
    --shadow-sm: 0 1px 2px rgba(9,9,11,.04);
    --shadow-md: 0 4px 12px rgba(9,9,11,.06);
    --shadow-focus: 0 0 0 3px rgba(9,9,11,.12);
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: var(--ink); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
  button { font-family: inherit; }
  .shell { min-height: 100vh; padding: clamp(16px, 3vw, 40px); max-width: 1440px; margin: 0 auto; }

  .header { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-4); flex-wrap: wrap; border-bottom: 1px solid var(--gray-100); padding-bottom: var(--sp-6); margin-bottom: var(--sp-8); }
  .brand { display: flex; align-items: center; gap: var(--sp-3); }
  .brand__logo { width: 38px; height: 38px; background: var(--ink); border-radius: var(--r-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .brand__title { font-size: var(--fs-lg); font-weight: 700; margin: 0; letter-spacing: -0.02em; }
  .brand__title span { font-weight: 400; color: var(--gray-500); }
  .brand__desc { font-size: var(--fs-xs); color: var(--gray-500); margin: 2px 0 0; }
  .header__actions { display: flex; align-items: center; gap: var(--sp-4); flex-wrap: wrap; }

  .segmented { display: flex; background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: var(--r-md); padding: 4px; gap: 4px; }
  .segmented__btn { background: transparent; border: none; color: var(--gray-500); padding: 8px 14px; border-radius: var(--r-sm); font-size: var(--fs-sm); font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: var(--sp-2); transition: background .15s, color .15s; white-space: nowrap; }
  .segmented__btn:hover { color: var(--gray-900); }
  .segmented__btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
  .segmented__btn[aria-selected="true"] { background: var(--ink); color: #fff; font-weight: 600; }

  .context-badge { background: var(--gray-100); border: 1px solid var(--gray-200); padding: 8px 14px; border-radius: var(--r-md); font-size: var(--fs-sm); display: flex; align-items: center; gap: var(--sp-2); color: var(--gray-500); }
  .context-badge__dot { width: 6px; height: 6px; background: var(--success); border-radius: 50%; }

  .dashboard-grid { display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: var(--sp-6); align-items: start; }
  @media (max-width: 960px) { .dashboard-grid { grid-template-columns: 1fr; } }

  .panel { background: var(--gray-50); border: 1px solid var(--gray-100); border-radius: var(--r-lg); padding: var(--sp-6); display: flex; flex-direction: column; }
  .panel--list { height: min(640px, calc(100vh - 180px)); }
  .panel--detail { min-height: min(640px, calc(100vh - 180px)); justify-content: space-between; gap: var(--sp-5); }
  @media (max-width: 960px) { .panel--list { height: auto; max-height: 420px; } }

  .panel__header { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-3); }
  .panel__title { font-size: var(--fs-md); font-weight: 600; margin: 0; display: flex; align-items: center; gap: var(--sp-2); color: var(--ink); }
  .panel__counter { font-size: var(--fs-xs); font-family: var(--font-mono); background: var(--gray-200); color: var(--gray-600); padding: 2px 8px; border-radius: var(--r-pill); }
  .panel__subtitle { font-size: var(--fs-sm); color: var(--gray-500); margin: var(--sp-2) 0 var(--sp-4); line-height: 1.5; }

  .product-list { overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: var(--sp-2); padding-right: 4px; margin-right: -4px; }
  .product-list::-webkit-scrollbar { width: 6px; }
  .product-list::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: 3px; }

  .product-card { background: #fff; border: 1px solid var(--gray-200); border-left: 3px solid transparent; padding: var(--sp-3) var(--sp-4); border-radius: var(--r-md); cursor: pointer; text-align: left; transition: border-color .15s, box-shadow .15s, background .15s; font-family: inherit; }
  .product-card:hover { border-color: var(--gray-300); border-left-color: var(--gray-300); box-shadow: var(--shadow-sm); }
  .product-card:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
  .product-card[aria-current="true"] { border-color: var(--gray-300); border-left-color: var(--ink); box-shadow: var(--shadow-md); background: #fff; }
  .product-card__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-1); }
  .product-card__code { font-size: var(--fs-xs); font-family: var(--font-mono); color: var(--gray-500); }
  .product-card__name { font-size: var(--fs-md); font-weight: 500; color: var(--ink); margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .product-card__cat { font-size: var(--fs-xs); color: var(--gray-500); }

  .rca-tag { font-size: var(--fs-xs); padding: 2px 6px; border-radius: var(--r-sm); font-weight: 600; font-family: var(--font-mono); display: inline-flex; align-items: center; gap: 4px; }
  .rca-tag--high { background: var(--ink); color: #fff; }
  .rca-tag--low  { background: var(--gray-100); color: var(--gray-600); }

  .detail__head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-4); flex-wrap: wrap; border-bottom: 1px solid var(--gray-100); padding-bottom: var(--sp-5); }
  .detail__code-pill { display: inline-block; font-family: var(--font-mono); font-size: var(--fs-xs); background: var(--gray-200); color: var(--gray-700); padding: 3px 8px; border-radius: var(--r-sm); margin-bottom: var(--sp-2); }
  .detail__title { font-size: var(--fs-xl); font-weight: 700; margin: 0 0 var(--sp-1); letter-spacing: -0.01em; line-height: 1.25; }
  .detail__desc { font-size: var(--fs-sm); color: var(--gray-600); margin: 0; line-height: 1.5; max-width: 60ch; }
  .detail__sector { background: #fff; border: 1px solid var(--gray-200); padding: var(--sp-2) var(--sp-3); border-radius: var(--r-md); font-size: var(--fs-sm); text-align: right; }
  .detail__sector-label { font-size: var(--fs-xs); color: var(--gray-500); display: block; margin-bottom: 2px; }
  .detail__sector-value { font-weight: 600; color: var(--ink); }

  .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--sp-3); }
  @media (max-width: 1024px) { .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 480px)  { .metrics { grid-template-columns: 1fr; } }

  .metric { background: #fff; border: 1px solid var(--gray-200); padding: var(--sp-4); border-radius: var(--r-md); display: flex; flex-direction: column; gap: var(--sp-1); }
  .metric__label { font-size: var(--fs-xs); color: var(--gray-500); display: flex; align-items: center; gap: 4px; }
  .metric__value { font-size: 1.35rem; font-weight: 700; color: var(--ink); font-family: var(--font-mono); line-height: 1; }
  .metric__bar { height: 5px; border-radius: 3px; background: var(--gray-100); overflow: hidden; margin: var(--sp-2) 0 var(--sp-1); }
  .metric__bar > span { display: block; height: 100%; border-radius: 3px; transition: width .3s ease; }
  .metric__bar--good > span { background: var(--success); }
  .metric__bar--warn > span { background: var(--warning); }
  .metric__bar--bad  > span { background: var(--danger);  }
  .metric__hint { font-size: var(--fs-xs); color: var(--gray-500); }

  .policy-hero { background: var(--ink); color: #fff; padding: var(--sp-5); border-radius: var(--r-md); display: flex; flex-direction: column; gap: var(--sp-2); }
  .policy-hero__eyebrow { font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.65; display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
  .policy-hero__text { font-size: var(--fs-lg); font-weight: 500; margin: 0; line-height: 1.4; }

  .spillovers { background: #fff; border: 1px solid var(--gray-200); padding: var(--sp-4); border-radius: var(--r-md); }
  .spillovers__heading { font-size: var(--fs-sm); font-weight: 600; color: var(--gray-600); margin: 0 0 var(--sp-3); display: flex; align-items: center; gap: 6px; }
  .spillovers__tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .spill-tag { background: var(--gray-100); color: var(--gray-700); font-size: var(--fs-xs); padding: 4px 10px; border-radius: var(--r-sm); border: 1px solid var(--gray-200); font-weight: 500; }

  .detail__footer { border-top: 1px solid var(--gray-100); padding-top: var(--sp-4); display: flex; justify-content: space-between; align-items: center; gap: var(--sp-3); flex-wrap: wrap; }
  .detail__engine { font-size: var(--fs-xs); color: var(--gray-500); font-family: var(--font-mono); }
  .btn-primary { background: var(--ink); color: #fff; border: none; padding: 9px 16px; border-radius: var(--r-md); font-size: var(--fs-sm); font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: var(--sp-2); transition: transform .15s, box-shadow .15s; white-space: nowrap; }
  .btn-primary:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
  .btn-primary:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

  .graph-layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-5); transition: grid-template-columns .25s ease; }
  .graph-layout.has-drawer { grid-template-columns: minmax(0, 1fr) 400px; }
  @media (max-width: 1100px) { .graph-layout.has-drawer { grid-template-columns: minmax(0, 1fr); } }

  .graph-shell { background: var(--gray-50); border: 1px solid var(--gray-100); border-radius: var(--r-lg); padding: var(--sp-6); display: flex; flex-direction: column; min-height: 560px; }
  .graph-header { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-4); flex-wrap: wrap; margin-bottom: var(--sp-4); }
  .legend { display: flex; gap: var(--sp-4); flex-wrap: wrap; }
  .legend__item { display: flex; align-items: center; gap: var(--sp-2); font-size: var(--fs-sm); color: var(--gray-600); }
  .legend__dot { width: 9px; height: 9px; border-radius: 50%; }
  .svg-wrap { flex: 1; background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-md); overflow: hidden; min-height: 380px; }
  .svg-wrap svg { display: block; width: 100%; height: 100%; }

  .node { cursor: pointer; outline: none; }
  .node circle { transition: r .15s ease, fill .15s ease; }
  .node:focus-visible circle:last-of-type { stroke: var(--ink); stroke-width: 3; }
  .node:hover circle:last-of-type { r: 13; }

  .graph-footer { display: flex; justify-content: space-between; align-items: center; margin-top: var(--sp-4); background: #fff; border: 1px solid var(--gray-200); padding: var(--sp-3) var(--sp-5); border-radius: var(--r-md); gap: var(--sp-3); flex-wrap: wrap; font-size: var(--fs-sm); }

  .drawer { background: var(--gray-50); border: 1px solid var(--gray-100); border-radius: var(--r-lg); padding: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-4); animation: slideIn .25s ease; max-height: calc(100vh - 140px); overflow-y: auto; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
  @media (max-width: 1100px) { .drawer { max-height: 500px; } }
  .drawer__close { align-self: flex-end; background: transparent; border: 1px solid var(--gray-200); border-radius: var(--r-sm); width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--gray-600); transition: background .15s; }
  .drawer__close:hover { background: var(--gray-100); }
  .drawer .detail__head { padding-bottom: var(--sp-3); }
  .drawer .detail__title { font-size: var(--fs-lg); }
  .drawer .metrics { grid-template-columns: repeat(2, 1fr); }
  .drawer .policy-hero__text { font-size: var(--fs-md); }

  .treemap-shell { background: var(--gray-50); border: 1px solid var(--gray-100); border-radius: var(--r-lg); padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-5); }
  .treemap-topbar { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-4); flex-wrap: wrap; }
  .treemap-topbar__actions { display: flex; gap: var(--sp-3); align-items: center; flex-wrap: wrap; }
  .country-selector { display: flex; gap: 4px; background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: var(--r-md); padding: 4px; flex-wrap: wrap; }
  .country-btn { background: transparent; border: none; color: var(--gray-600); padding: 7px 12px; border-radius: var(--r-sm); font-size: var(--fs-sm); font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background .15s, color .15s; }
  .country-btn:hover { color: var(--ink); }
  .country-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
  .country-btn[aria-selected="true"] { background: var(--ink); color: #fff; font-weight: 600; }
  .country-btn__flag { font-size: 14px; line-height: 1; }

  .treemap-canvas { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-md); overflow: hidden; aspect-ratio: 16 / 10; min-height: 420px; }
  .treemap-canvas svg { display: block; width: 100%; height: 100%; }

  .treemap-tile { cursor: pointer; }
  .treemap-tile:focus { outline: none; }
  .treemap-tile:focus-visible rect { stroke: var(--ink) !important; stroke-width: 2.5 !important; stroke-dasharray: none !important; }

  .treemap-legend { display: flex; gap: var(--sp-4); flex-wrap: wrap; align-items: center; padding: var(--sp-4); background: #fff; border: 1px solid var(--gray-200); border-radius: var(--r-md); }
  .treemap-legend__title { font-size: var(--fs-xs); font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; margin-right: var(--sp-2); }
  .treemap-legend__item { display: flex; align-items: center; gap: 6px; font-size: var(--fs-xs); color: var(--gray-600); }
  .treemap-legend__swatch { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }

  .treemap-footer { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-3); flex-wrap: wrap; background: #fff; border: 1px solid var(--gray-200); padding: var(--sp-3) var(--sp-5); border-radius: var(--r-md); font-size: var(--fs-sm); }
  .treemap-footer__info { display: flex; align-items: center; gap: var(--sp-3); flex-wrap: wrap; }
  .treemap-footer__hint { color: var(--gray-500); font-size: var(--fs-xs); }

  .tooltip { position: relative; display: inline-flex; cursor: help; }
  .tooltip__bubble { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: var(--ink); color: #fff; font-size: var(--fs-xs); padding: 6px 10px; border-radius: var(--r-sm); white-space: normal; width: 220px; line-height: 1.4; opacity: 0; pointer-events: none; transition: opacity .15s; z-index: 10; font-weight: 400; text-transform: none; letter-spacing: 0; }
  .tooltip:hover .tooltip__bubble, .tooltip:focus-within .tooltip__bubble { opacity: 1; }
`;

/* ============================================================
   SUBCOMPONENTES
   ============================================================ */
function Tooltip({ text, children }) {
  return (
    <span className="tooltip" tabIndex={0} aria-label={text}>
      {children}
      <span className="tooltip__bubble" role="tooltip">{text}</span>
    </span>
  );
}

function Metric({ label, value, hint, invert = false, tooltip, thresholds = [0.33, 0.66] }) {
  const pct = Math.round(value * 100);
  let level;
  if (invert) level = value < thresholds[0] ? 'good' : value < thresholds[1] ? 'warn' : 'bad';
  else        level = value > thresholds[1] ? 'good' : value > thresholds[0] ? 'warn' : 'bad';

  return (
    <div className="metric">
      <span className="metric__label">
        {label}
        {tooltip && <Tooltip text={tooltip}><HelpCircle size={11} color="var(--gray-400)" /></Tooltip>}
      </span>
      <span className="metric__value">{pct}%</span>
      <div className={`metric__bar metric__bar--${level}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="metric__hint">{hint}</span>
    </div>
  );
}

function ProductCard({ product, isSelected, onSelect }) {
  const isHighRca = product.rca >= 1;
  return (
    <button type="button" className="product-card" aria-current={isSelected ? 'true' : undefined} onClick={() => onSelect(product)}>
      <div className="product-card__top">
        <span className="product-card__code">CPC {product.id}</span>
        <span className={`rca-tag ${isHighRca ? 'rca-tag--high' : 'rca-tag--low'}`}>
          {isHighRca && <Check size={10} />} RCA {product.rca}
        </span>
      </div>
      <h4 className="product-card__name" title={product.name}>{product.name}</h4>
      <span className="product-card__cat">{product.category}</span>
    </button>
  );
}

function DetailContent({ product, compact = false, onExplore, showExplore = true }) {
  return (
    <>
      <div className="detail__head">
        <div style={{ minWidth: 0 }}>
          <div className="detail__code-pill">ID: {product.id}</div>
          <h2 className="detail__title">{product.name}</h2>
          <p className="detail__desc">{product.description}</p>
        </div>
        <div className="detail__sector">
          <span className="detail__sector-label">Sector</span>
          <span className="detail__sector-value">{product.category}</span>
        </div>
      </div>

      <div className="metrics">
        <Metric label="Factibilidad (δ)" value={product.factibilidad} hint="Capacidades instaladas"
          tooltip="Probabilidad de que el país pueda producir este bien con su base de capacidades actual." />
        <Metric label="Valor / Complejidad" value={product.valor} hint="Rentabilidad y spillovers"
          tooltip="Valor económico y potencial de derrame hacia otros sectores." />
        <Metric label="Brecha Tecnológica" value={product.delta} hint="Distancia al producto" invert
          tooltip="Qué tan lejos estás hoy de poder producirlo. Menos es mejor." />
        <Metric label="Umbral Cohesión (m*)" value={product.m_star} hint="Acción colectiva req." invert
          tooltip="Nivel de coordinación entre actores necesario. Menos es mejor." />
      </div>

      <div className="policy-hero">
        <span className="policy-hero__eyebrow"><Sparkles size={12} /> Instrumento de política óptimo</span>
        <p className="policy-hero__text">{product.politica}</p>
      </div>

      <div className="spillovers">
        <h5 className="spillovers__heading">
          <TrendingUp size={14} color="var(--gray-500)" /> Externalidades e industrias conectadas
        </h5>
        <div className="spillovers__tags">
          {product.spillovers.map((spill, idx) => (
            <span key={idx} className="spill-tag">{spill}</span>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="detail__footer">
          <span className="detail__engine">GNN + Econoformer</span>
          {showExplore && (
            <button className="btn-primary" onClick={onExplore}>
              Explorar conexiones <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </>
  );
}

function GraphCanvas({ products, links, selectedId, onNodeClick }) {
  const [hovered, setHovered] = useState(null);
  const isDimLink = (link) => hovered && hovered !== link.source && hovered !== link.target;

  return (
    <svg viewBox="-60 -40 840 460" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Grafo de proximidad entre productos">
      {links.map((link, idx) => {
        const s = products.find((p) => p.id === link.source);
        const t = products.find((p) => p.id === link.target);
        if (!s || !t) return null;
        return (
          <line key={idx} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke="var(--gray-300)" strokeWidth={link.proximity * 2.5}
            strokeDasharray={link.proximity < 0.5 ? '4 4' : 'none'}
            strokeOpacity={isDimLink(link) ? 0.15 : 1}
            style={{ transition: 'stroke-opacity .15s' }} />
        );
      })}

      {products.map((prod) => {
        const isSelected = selectedId === prod.id;
        const nodeColor = rcaColor(prod.rca, prod.category);
        const isDim = hovered && hovered !== prod.id &&
          !links.some((l) =>
            (l.source === hovered && l.target === prod.id) ||
            (l.target === hovered && l.source === prod.id));
        const labelWidth = prod.id.length * 7.5 + 10;

        return (
          <g key={prod.id} transform={`translate(${prod.x}, ${prod.y})`} className="node"
            role="button" tabIndex={0} aria-pressed={isSelected}
            aria-label={`Producto ${prod.id}: ${prod.name}. Sector ${prod.category}. RCA ${prod.rca}.`}
            onClick={() => onNodeClick(prod)}
            onMouseEnter={() => setHovered(prod.id)} onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(prod.id)} onBlur={() => setHovered(null)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNodeClick(prod); } }}
            style={{ opacity: isDim ? 0.35 : 1, transition: 'opacity .15s' }}>
            {isSelected && <circle r="20" fill="none" stroke="var(--ink)" strokeWidth="1.5" opacity="0.5" />}
            <circle r={isSelected ? 14 : 10}
              fill={nodeColor.bg}
              stroke={nodeColor.border === 'transparent' ? '#ffffff' : nodeColor.border}
              strokeWidth="2.5" />
            <rect x="16" y="-9" width={labelWidth} height="18" rx="4" fill="#fff" opacity="0.9" />
            <text x="21" y="4" fill="var(--ink)" fontSize="12"
              fontWeight={isSelected ? '700' : '500'}
              fontFamily="var(--font-mono)">{prod.id}</text>
          </g>
        );
      })}
    </svg>
  );
}

function TreemapChart({ countryCode, onProductClick, selectedProductId }) {
  const [hovered, setHovered] = useState(null);
  const data = countryData[countryCode];

  const items = useMemo(() => {
    return Object.entries(data.products).map(([id, d]) => ({
      id,
      value: d.value,
      rca: d.rca,
      name: productsCatalog[id]?.name || id,
      category: productsCatalog[id]?.category || ''
    }));
  }, [data]);

  const layout = useMemo(() => {
    const raw = squarify(items, 0, 0, 800, 500);
    return raw.map((t) => ({
      ...t,
      x: t.x + 2, y: t.y + 2,
      w: Math.max(t.w - 4, 0), h: Math.max(t.h - 4, 0)
    }));
  }, [items]);

  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label={`Treemap de exportaciones de ${data.name}`}>
      {layout.map((t) => {
        if (t.w < 6 || t.h < 6) return null;
        const c = rcaColor(t.rca, t.category);
        const isHovered = hovered === t.id;
        const isSelected = selectedProductId === t.id;
        const showName = t.w > 62 && t.h > 30;
        const showValue = t.w > 82 && t.h > 54;
        const showRca = t.w > 96 && t.h > 54;
        const maxChars = Math.max(Math.floor((t.w - 16) / 6.4), 4);
        const name = truncate(t.name, maxChars);

        return (
          <g key={t.id} className="treemap-tile"
            role="button" tabIndex={0}
            aria-label={`${t.name}, ${formatValue(t.value)}, sector ${t.category}, RCA ${t.rca}`}
            onClick={() => onProductClick(t)}
            onMouseEnter={() => setHovered(t.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(t.id)}
            onBlur={() => setHovered(null)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onProductClick(t); } }}>
            <rect
              x={t.x} y={t.y} width={t.w} height={t.h}
              fill={c.bg}
              stroke={isSelected || isHovered ? 'var(--ink)' : c.border}
              strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
              strokeDasharray={c.dashed && !isHovered && !isSelected ? '3 3' : 'none'}
              rx={3}
              opacity={hovered && !isHovered ? 0.75 : 1}
              style={{ transition: 'opacity .15s' }} />

            {showName && (
              <text x={t.x + 8} y={t.y + 20}
                fontSize="11.5" fontWeight="600" fill={c.fg}
                style={{ pointerEvents: 'none' }}>{name}</text>
            )}
            {showValue && (
              <text x={t.x + 8} y={t.y + 36}
                fontSize="10" fontFamily="var(--font-mono)" fill={c.fg}
                opacity="0.8" style={{ pointerEvents: 'none' }}>
                {formatValue(t.value)}
              </text>
            )}
            {showRca && (
              <text x={t.x + t.w - 8} y={t.y + 20}
                fontSize="10" fontFamily="var(--font-mono)" fill={c.fg}
                opacity="0.7" textAnchor="end"
                style={{ pointerEvents: 'none' }}>
                RCA {t.rca}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function TreemapDetail({ product, onClose, onOpenFull }) {
  const hasFull = mockProducts.some((p) => p.id === product.id);

  return (
    <div className="drawer" aria-label="Detalle del producto">
      <button className="drawer__close" onClick={onClose} aria-label="Cerrar detalle">
        <X size={14} />
      </button>

      <div>
        <div className="detail__code-pill">CPC {product.id}</div>
        <h3 className="detail__title" style={{ fontSize: 'var(--fs-lg)' }}>{product.name}</h3>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--gray-500)', margin: '4px 0 0' }}>
          {product.category}
        </p>
      </div>

      <div className="metrics" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="metric">
          <span className="metric__label">Exportaciones</span>
          <span className="metric__value">{formatValue(product.value)}</span>
          <span className="metric__hint">Millones USD 2024</span>
        </div>
        <div className="metric">
          <span className="metric__label">RCA</span>
          <span className="metric__value">{product.rca}</span>
          <span className="metric__hint">{product.rca >= 1 ? 'Con ventaja' : 'Sin ventaja'}</span>
        </div>
      </div>

      <div className="policy-hero">
        <span className="policy-hero__eyebrow"><Sparkles size={12} /> Interpretación</span>
        <p className="policy-hero__text">
          {product.rca >= 1
            ? `Ventaja comparativa revelada (RCA ${product.rca}). El país ya compite globalmente en este producto.`
            : `Sin ventaja revelada (RCA ${product.rca}). Oportunidad potencial de diversificación.`}
        </p>
      </div>

      {hasFull && (
        <button className="btn-primary" onClick={() => onOpenFull(product.id)}>
          Ver análisis completo <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function TreemapView({ selectedCountry, onCountryChange, onOpenFull }) {
  const [selected, setSelected] = useState(null);
  const data = countryData[selectedCountry];
  const totalValue = Object.values(data.products).reduce((s, p) => s + p.value, 0);

  const handleDownload = () => {
    generatePDFReport(selectedCountry);
  };

  return (
    <div className={`graph-layout ${selected ? 'has-drawer' : ''}`}>
      <section className="treemap-shell" aria-label="Treemap de exportaciones">
        <div className="treemap-topbar">
          <div>
            <h3 className="panel__title">Composición exportadora por país</h3>
            <p className="panel__subtitle" style={{ marginBottom: 0 }}>
              Área proporcional al valor exportado · Color por sector, intensidad según RCA
            </p>
          </div>
          <div className="treemap-topbar__actions">
            <div className="country-selector" role="tablist" aria-label="Seleccionar país">
              {Object.entries(countryData).map(([code, c]) => (
                <button key={code} role="tab"
                  aria-selected={selectedCountry === code}
                  className="country-btn"
                  onClick={() => { onCountryChange(code); setSelected(null); }}>
                  <span className="country-btn__flag">{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={handleDownload} aria-label="Descargar reporte PDF">
              <Download size={14} /> Descargar PDF
            </button>
          </div>
        </div>

        <div className="treemap-canvas">
          <TreemapChart
            countryCode={selectedCountry}
            onProductClick={setSelected}
            selectedProductId={selected?.id}
          />
        </div>

        <div className="treemap-legend" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--sp-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <span className="treemap-legend__title">RCA</span>
            {[
              { label: '< 1',    l: 94, s: 50, dashed: true },
              { label: '1 – 3',  l: 80, s: 65 },
              { label: '3 – 6',  l: 62, s: 72 },
              { label: '6 – 12', l: 42, s: 72 },
              { label: '≥ 12',   l: 26, s: 70 },
            ].map((s) => (
              <div key={s.label} className="treemap-legend__item">
                <span className="treemap-legend__swatch"
                  style={{
                    background: `hsl(${DEFAULT_HUE}, ${s.s}%, ${s.l}%)`,
                    border: s.dashed ? `1px dashed hsl(${DEFAULT_HUE}, 45%, 60%)` : '1px solid transparent',
                  }} />
                {s.label}
              </div>
            ))}
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--gray-500)', marginLeft: 'auto' }}>
              Más oscuro = mayor ventaja comparativa
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <span className="treemap-legend__title">Sector</span>
            {Object.entries(SECTOR_HUES).map(([name, hue]) => (
              <div key={name} className="treemap-legend__item">
                <span className="treemap-legend__swatch"
                  style={{ background: `hsl(${hue}, 72%, 55%)`, border: 'none' }} />
                {name}
              </div>
            ))}
          </div>
        </div>

        <div className="treemap-footer">
          <div className="treemap-footer__info">
            <span style={{ color: 'var(--gray-500)' }}>Total exportado:</span>
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatValue(totalValue)}</strong>
            <span style={{ color: 'var(--gray-500)' }}>·</span>
            <span style={{ color: 'var(--gray-500)' }}>{Object.keys(data.products).length} productos</span>
          </div>
          <span className="treemap-footer__hint">
            Click en una celda para ver el detalle
          </span>
        </div>
      </section>

      {selected && (
        <TreemapDetail
          product={selected}
          onClose={() => setSelected(null)}
          onOpenFull={(id) => { onOpenFull(id); setSelected(null); }}
        />
      )}
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[3]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('PY');

  useEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-econofold', '');
    el.innerHTML = globalCss;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const handleNodeClick = (prod) => {
    setSelectedProduct(prod);
    setDrawerOpen(true);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'grafo') setDrawerOpen(false);
  };

  const handleOpenFullFromTreemap = (id) => {
    const full = mockProducts.find((p) => p.id === id);
    if (full) {
      setSelectedProduct(full);
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="shell">
      <header className="header">
        <div className="brand">
          <div className="brand__logo"><Network size={18} color="#fff" /></div>
          <div>
            <h1 className="brand__title">EconoFold <span>Intelligence</span></h1>
            <p className="brand__desc">Plataforma de complejidad económica y recomendación de políticas</p>
          </div>
        </div>

        <div className="header__actions">
          <div className="segmented" role="tablist" aria-label="Vistas">
            <button role="tab" aria-selected={activeTab === 'dashboard'}
              className="segmented__btn" onClick={() => handleTabChange('dashboard')}>
              <BarChart2 size={14} /> Dashboard
            </button>
            <button role="tab" aria-selected={activeTab === 'grafo'}
              className="segmented__btn" onClick={() => handleTabChange('grafo')}>
              <Compass size={14} /> Mapa de red
            </button>
            <button role="tab" aria-selected={activeTab === 'treemap'}
              className="segmented__btn" onClick={() => handleTabChange('treemap')}>
              <LayoutGrid size={14} /> Treemap
            </button>
          </div>

          <div className="context-badge">
            <span className="context-badge__dot" />
            <span>
              {activeTab === 'treemap'
                ? <><strong style={{ color: 'var(--ink)' }}>{countryData[selectedCountry].flag}</strong> {countryData[selectedCountry].name} <strong style={{ color: 'var(--ink)' }}>2024</strong></>
                : <>Paraguay <strong style={{ color: 'var(--ink)' }}>2024</strong></>}
            </span>
          </div>
        </div>
      </header>

      <main>
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            <section className="panel panel--list" aria-label="Cesta productiva">
              <div className="panel__header">
                <h3 className="panel__title"><Layers size={16} color="var(--gray-500)" /> Cesta productiva</h3>
                <span className="panel__counter">{mockProducts.length} activos</span>
              </div>
              <p className="panel__subtitle">Selecciona un producto para inspeccionar sus vectores y métricas.</p>
              <div className="product-list" role="list">
                {mockProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod}
                    isSelected={selectedProduct.id === prod.id}
                    onSelect={setSelectedProduct} />
                ))}
              </div>
            </section>

            <section className="panel panel--detail" aria-label="Detalle del producto">
              <DetailContent product={selectedProduct} onExplore={() => handleTabChange('grafo')} />
            </section>
          </div>
        )}

        {activeTab === 'grafo' && (
          <div className={`graph-layout ${drawerOpen ? 'has-drawer' : ''}`}>
            <section className="graph-shell" aria-label="Mapa de red">
              <div className="graph-header">
                <div>
                  <h3 className="panel__title">Topología del espacio de productos</h3>
                  <p className="panel__subtitle" style={{ marginBottom: 0 }}>
                    Pasa el cursor sobre un nodo para resaltar sus conexiones. Haz clic para ver el detalle.
                  </p>
                </div>
                <div className="legend">
                  <div className="legend__item">
                    <span className="legend__dot" style={{ background: 'var(--ink)' }} />
                    RCA ≥ 1 · Ventaja
                  </div>
                  <div className="legend__item">
                    <span className="legend__dot" style={{ background: '#fff', border: '1.5px solid var(--gray-400)' }} />
                    RCA &lt; 1 · Oportunidad
                  </div>
                </div>
              </div>

              <div className="svg-wrap">
                <GraphCanvas products={mockProducts} links={mockLinks}
                  selectedId={selectedProduct.id} onNodeClick={handleNodeClick} />
              </div>

              <div className="graph-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--gray-500)' }}>Nodo activo:</span>
                  <span style={{ fontWeight: 600 }}>
                    {selectedProduct.name}{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gray-500)' }}>
                      (CPC {selectedProduct.id})
                    </span>
                  </span>
                </div>
                <span style={{ color: 'var(--gray-500)', fontSize: 'var(--fs-xs)' }}>
                  Ancho de línea = proximidad entre productos
                </span>
              </div>
            </section>

            {drawerOpen && (
              <aside className="drawer" aria-label="Detalle del nodo seleccionado">
                <button className="drawer__close" onClick={() => setDrawerOpen(false)} aria-label="Cerrar detalle">
                  <X size={14} />
                </button>
                <DetailContent product={selectedProduct} compact showExplore={false} />
              </aside>
            )}
          </div>
        )}

        {activeTab === 'treemap' && (
          <TreemapView
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            onOpenFull={handleOpenFullFromTreemap}
          />
        )}
      </main>
    </div>
  );
}