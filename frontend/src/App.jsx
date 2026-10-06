import React, { useState, useEffect, useMemo } from 'react';
import {
  Network, Layers, TrendingUp, ArrowRight, Compass,
  BarChart2, Sparkles, X, Check, LayoutGrid
} from 'lucide-react';

const COUNTRIES = [
  { code: 'PRY', flag: '🇵🇾', name: 'Paraguay' },
  { code: 'URY', flag: '🇺🇾', name: 'Uruguay' },
  { code: 'BOL', flag: '🇧🇴', name: 'Bolivia' },
  { code: 'CHL', flag: '🇨🇱', name: 'Chile' },
  { code: 'BRA', flag: '🇧🇷', name: 'Brasil' },
  { code: 'ARG', flag: '🇦🇷', name: 'Argentina' },
  { code: 'PER', flag: '🇵🇪', name: 'Perú' },
  { code: 'COL', flag: '🇨🇴', name: 'Colombia' },
];
const YEAR = 2024;

function fmt(v) {
  if (v == null) return '—';
  if (v >= 1000) return `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}B`;
  return `$${Number(v).toFixed(0)}M`;
}

function truncate(s, n) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

function sectorOf(code) {
  const c = parseInt(String(code).substring(0, 2), 10);
  if (isNaN(c)) return 'Otros';
  if (c <= 24) return 'Agricultura';
  if (c <= 27) return 'Energía';
  if (c <= 38) return 'Química';
  if (c <= 40) return 'Plásticos';
  if (c <= 43) return 'Cuero';
  if (c <= 46) return 'Forestal';
  if (c <= 49) return 'Celulosa';
  if (c <= 63) return 'Textil';
  if (c <= 67) return 'Calzado';
  if (c <= 71) return 'Minería';
  if (c <= 83) return 'Siderurgia';
  if (c <= 89) return 'Manufactura';
  if (c <= 97) return 'Manufactura';
  return 'Otros';
}

const HUES = {
  'Agricultura': 142, 'Energía': 5, 'Química': 290, 'Plásticos': 265,
  'Cuero': 20, 'Forestal': 85, 'Celulosa': 174, 'Textil': 310,
  'Calzado': 335, 'Minería': 300, 'Siderurgia': 220, 'Manufactura': 255,
  'Otros': 210,
};

function rcaColors(rca, sector) {
  const hue = HUES[sector] ?? 220;
  let level = 0, l = 94, s = 50, fg = `hsl(${hue}, 55%, 12%)`, dashed = true;
  if (rca >= 12) { level = 4; l = 26; s = 70; fg = '#fff'; dashed = false; }
  else if (rca >= 6) { level = 3; l = 42; s = 72; fg = '#fff'; dashed = false; }
  else if (rca >= 3) { level = 2; l = 62; s = 72; dashed = false; }
  else if (rca >= 1) { level = 1; l = 80; s = 65; dashed = false; }
  return {
    bg: `hsl(${hue}, ${s}%, ${l}%)`,
    fg,
    border: dashed ? `hsl(${hue}, 45%, 76%)` : 'transparent',
    dashed,
  };
}

function worstRatio(row, w) {
  if (!row.length) return Infinity;
  const sum = row.reduce((a, r) => a + r.area, 0);
  const max = Math.max(...row.map((r) => r.area));
  const min = Math.min(...row.map((r) => r.area));
  return Math.max((w * w * max) / (sum * sum), (sum * sum) / (w * w * min));
}

function squarify(items, x, y, w, h) {
  if (!items.length) return [];
  const total = items.reduce((a, i) => a + i.value, 0);
  if (total <= 0) return [];
  const area = w * h;
  const nodes = items.map((i) => ({ ...i, area: (i.value / total) * area })).sort((a, b) => b.area - a.area);
  const out = [];
  let rem = nodes, rx = x, ry = y, rw = w, rh = h;
  while (rem.length) {
    const side = Math.min(rw, rh);
    const vert = rw >= rh;
    let row = [], best = Infinity;
    for (let i = 0; i < rem.length; i++) {
      const cand = [...row, rem[i]];
      const wr = worstRatio(cand, side);
      if (wr <= best) { row = cand; best = wr; } else break;
    }
    const rowArea = row.reduce((a, r) => a + r.area, 0);
    const thick = rowArea / side;
    let pos = 0;
    for (const it of row) {
      const len = it.area / thick;
      if (vert) out.push({ ...it, x: rx, y: ry + pos, w: thick, h: len });
      else out.push({ ...it, x: rx + pos, y: ry, w: len, h: thick });
      pos += len;
    }
    if (vert) { rx += thick; rw -= thick; } else { ry += thick; rh -= thick; }
    rem = rem.slice(row.length);
  }
  return out;
}

function useFetch(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!url) { setLoading(false); return; }
    let cancel = false;
    setLoading(true); setError(null);
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { if (!cancel) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancel) { setError(e.message); setLoading(false); } });
    return () => { cancel = true; };
    // eslint-disable-next-line
  }, deps);
  return { data, loading, error };
}

function ProductCard({ p, selected, onSelect }) {
  const high = p.rca >= 1;
  return (
    <button className="card" aria-current={selected ? 'true' : undefined} onClick={() => onSelect(p)}>
      <div className="card-top">
        <span className="card-code">HS {p.code}</span>
        <span className={`tag ${high ? 'tag-hi' : 'tag-lo'}`}>
          {high && <Check size={10} />} {Number(p.rca).toFixed(2)}
        </span>
      </div>
      <h4 className="card-name">{p.name}</h4>
      <span className="card-cat">{sectorOf(p.code)}</span>
    </button>
  );
}

function Detail({ p, country, ranking, compact, onClose, onExplore }) {
  const { data: nbrs, loading } = useFetch(
    p ? `/api/products/${p.code}/neighbors?limit=6` : null,
    [p?.code]
  );
  if (!p) return <div className="msg">Seleccioná un producto</div>;
  const high = p.rca >= 1;
  return (
    <>
      {compact && <button className="close" onClick={onClose}><X size={14} /></button>}
      <div className="head">
        <div>
          <div className="pill">HS {p.code}</div>
          <h2 className="title">{p.name}</h2>
          <p className="desc">{country.flag} {country.name} · {YEAR}</p>
        </div>
        <div className="sector">
          <span className="sector-l">Sector</span>
          <span className="sector-v">{sectorOf(p.code)}</span>
        </div>
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="metric-l">RCA</span>
          <span className="metric-v">{Number(p.rca).toFixed(2)}</span>
          <span className="metric-h">{high ? 'Con ventaja' : 'Sin ventaja'}</span>
        </div>
        <div className="metric">
          <span className="metric-l">Exportaciones</span>
          <span className="metric-v">{fmt(p.value)}</span>
          <span className="metric-h">USD · {YEAR}</span>
        </div>
        {ranking && (
          <div className="metric">
            <span className="metric-l">Ranking</span>
            <span className="metric-v">#{ranking.position}</span>
            <span className="metric-h">de {ranking.total}</span>
          </div>
        )}
      </div>
      <div className="spill">
        <h5 className="spill-h"><TrendingUp size={14} /> Productos cercanos</h5>
        {loading ? <p className="desc">Cargando…</p> :
          nbrs && nbrs.length > 0 ? (
            <div className="tags">
              {nbrs.map((n) => (
                <span key={n.code} className="tag-n" title={Number(n.proximity).toFixed(3)}>
                  {truncate(n.name, 26)} <b>{Number(n.proximity).toFixed(2)}</b>
                </span>
              ))}
            </div>
          ) : <p className="desc">Sin datos</p>}
      </div>
      <div className="policy">
        <span className="policy-h"><Sparkles size={12} /> PREDICCIÓN</span>
        <p className="policy-t">En desarrollo. Motor en validación científica.</p>
      </div>
      {!compact && (
        <div className="foot">
          <span className="foot-e">BACI · HS92 · {YEAR}</span>
          {onExplore && (
            <button className="btn" onClick={onExplore}>
              Explorar <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </>
  );
}

function Graph({ iso3, selectedId, onNodeClick }) {
  const { data, loading, error } = useFetch(`/api/graph/${iso3}?top=40&year=${YEAR}`, [iso3]);
  const [hov, setHov] = useState(null);
  const nodes = useMemo(() => {
    if (!data?.nodes) return [];
    const n = data.nodes.length;
    if (!n) return [];
    const R = Math.min(200, 40 + n * 4);
    return data.nodes.map((node, i) => {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      return { ...node, x: 400 + R * Math.cos(a), y: 250 + R * Math.sin(a) };
    });
  }, [data]);
  if (loading) return <div className="msg">Cargando…</div>;
  if (error) return <div className="msg err">Error: {error}</div>;
  if (!nodes.length) return <div className="msg">Sin datos</div>;
  const map = new Map(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
      {(data.links || []).map((l, i) => {
        const s = map.get(l.source), t = map.get(l.target);
        if (!s || !t) return null;
        const dim = hov && hov !== l.source && hov !== l.target;
        return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
          stroke="#d4d4d8" strokeWidth={Math.max(l.proximity * 2.5, 0.5)}
          strokeDasharray={l.proximity < 0.3 ? '4 4' : 'none'}
          strokeOpacity={dim ? 0.15 : 1} />;
      })}
      {nodes.map((n) => {
        const sel = selectedId === n.id;
        const col = rcaColors(n.rca, sectorOf(n.id));
        const dim = hov && hov !== n.id && !data.links.some((l) =>
          (l.source === hov && l.target === n.id) || (l.target === hov && l.source === n.id));
        const lw = n.id.length * 7.5 + 10;
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`}
            style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1 }}
            onClick={() => onNodeClick(n)}
            onMouseEnter={() => setHov(n.id)} onMouseLeave={() => setHov(null)}>
            {sel && <circle r="20" fill="none" stroke="#09090b" strokeWidth="1.5" opacity="0.5" />}
            <circle r={sel ? 14 : 10} fill={col.bg}
              stroke={col.border === 'transparent' ? '#fff' : col.border} strokeWidth="2.5" />
            <rect x="16" y="-9" width={lw} height="18" rx="4" fill="#fff" opacity="0.9" />
            <text x="21" y="4" fontSize="12" fontFamily="monospace">{n.id}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Treemap({ iso3, selectedId, onTileClick }) {
  const { data, loading, error } = useFetch(`/api/treemap/${iso3}?year=${YEAR}&limit=80`, [iso3]);
  const [hov, setHov] = useState(null);
  const items = useMemo(() => (data || []).map((r) => ({
    id: r.code, value: r.value, rca: r.rca, name: r.name,
    cat: sectorOf(r.hs_chapter || r.code),
  })), [data]);
  const layout = useMemo(() => {
    if (!items.length) return [];
    return squarify(items, 0, 0, 800, 500).map((t) => ({
      ...t, x: t.x + 2, y: t.y + 2,
      w: Math.max(t.w - 4, 0), h: Math.max(t.h - 4, 0),
    }));
  }, [items]);
  if (loading) return <div className="msg">Cargando…</div>;
  if (error) return <div className="msg err">Error: {error}</div>;
  if (!layout.length) return <div className="msg">Sin datos</div>;
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
      {layout.map((t) => {
        if (t.w < 6 || t.h < 6) return null;
        const c = rcaColors(t.rca, t.cat);
        const sel = selectedId === t.id, h = hov === t.id;
        return (
          <g key={t.id} style={{ cursor: 'pointer' }}
            onClick={() => onTileClick(t)}
            onMouseEnter={() => setHov(t.id)} onMouseLeave={() => setHov(null)}>
            <rect x={t.x} y={t.y} width={t.w} height={t.h}
              fill={c.bg}
              stroke={sel || h ? '#09090b' : c.border}
              strokeWidth={sel ? 2.5 : h ? 2 : 1}
              strokeDasharray={c.dashed && !h && !sel ? '3 3' : 'none'}
              rx={3} opacity={hov && !h ? 0.75 : 1} />
            {t.w > 62 && t.h > 30 && (
              <text x={t.x + 8} y={t.y + 20} fontSize="11.5" fontWeight="600" fill={c.fg}
                style={{ pointerEvents: 'none' }}>{truncate(t.name, Math.floor((t.w - 16) / 6.4))}</text>
            )}
            {t.w > 82 && t.h > 54 && (
              <text x={t.x + 8} y={t.y + 36} fontSize="10" fontFamily="monospace" fill={c.fg}
                opacity="0.8" style={{ pointerEvents: 'none' }}>{fmt(t.value)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const CSS = `
  :root{--ink:#09090b;--g50:#fafafa;--g100:#f4f4f5;--g200:#e4e4e7;--g300:#d4d4d8;--g400:#a1a1aa;--g500:#71717a;--g600:#52525b;--g700:#3f3f46;--red:#ef4444}
  *{box-sizing:border-box}
  body{margin:0;background:#fff;color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  button{font-family:inherit;cursor:pointer}
  .shell{min-height:100vh;padding:clamp(16px,3vw,40px);max-width:1440px;margin:0 auto}
  .hdr{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;border-bottom:1px solid var(--g100);padding-bottom:24px;margin-bottom:32px}
  .brand{display:flex;gap:12px;align-items:center}
  .logo{width:38px;height:38px;background:var(--ink);border-radius:10px;display:flex;align-items:center;justify-content:center}
  .brand h1{font-size:1.05rem;font-weight:700;margin:0}
  .brand h1 span{font-weight:400;color:var(--g500)}
  .brand p{font-size:.7rem;color:var(--g500);margin:2px 0 0}
  .hdr-a{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
  .sel{background:var(--g100);border:1px solid var(--g200);border-radius:10px;padding:8px 12px;font-size:.8rem;font-family:inherit}
  .seg{display:flex;background:var(--g100);border:1px solid var(--g200);border-radius:10px;padding:4px;gap:4px}
  .seg button{background:transparent;border:none;color:var(--g500);padding:8px 14px;border-radius:6px;font-size:.8rem;font-weight:500;display:flex;gap:8px;align-items:center}
  .seg button[aria-selected=true]{background:var(--ink);color:#fff;font-weight:600}
  .grid{display:grid;grid-template-columns:minmax(280px,340px) minmax(0,1fr);gap:24px;align-items:start}
  @media(max-width:960px){.grid{grid-template-columns:1fr}}
  .panel{background:var(--g50);border:1px solid var(--g100);border-radius:14px;padding:24px;display:flex;flex-direction:column}
  .panel-list{height:min(680px,calc(100vh - 180px))}
  .panel-detail{min-height:min(680px,calc(100vh - 180px));gap:20px}
  @media(max-width:960px){.panel-list{height:auto;max-height:420px}}
  .panel-h{display:flex;justify-content:space-between;align-items:center}
  .panel-t{font-size:.875rem;font-weight:600;margin:0;display:flex;gap:8px;align-items:center}
  .panel-c{font-size:.7rem;font-family:monospace;background:var(--g200);color:var(--g600);padding:2px 8px;border-radius:999px}
  .panel-s{font-size:.8rem;color:var(--g500);margin:8px 0 16px}
  .list{overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px}
  .card{background:#fff;border:1px solid var(--g200);border-left:3px solid transparent;padding:12px 16px;border-radius:10px;text-align:left}
  .card:hover{border-color:var(--g300);box-shadow:0 1px 2px rgba(9,9,11,.04)}
  .card[aria-current=true]{border-color:var(--g300);border-left-color:var(--ink);box-shadow:0 4px 12px rgba(9,9,11,.06)}
  .card-top{display:flex;justify-content:space-between;margin-bottom:4px}
  .card-code{font-size:.7rem;font-family:monospace;color:var(--g500)}
  .card-name{font-size:.875rem;font-weight:500;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .card-cat{font-size:.7rem;color:var(--g500)}
  .tag{font-size:.7rem;padding:2px 6px;border-radius:6px;font-weight:600;font-family:monospace;display:inline-flex;gap:4px;align-items:center}
  .tag-hi{background:var(--ink);color:#fff}
  .tag-lo{background:var(--g100);color:var(--g600)}
  .head{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:1px solid var(--g100);padding-bottom:20px}
  .pill{display:inline-block;font-family:monospace;font-size:.7rem;background:var(--g200);color:var(--g700);padding:3px 8px;border-radius:6px;margin-bottom:8px}
  .title{font-size:1.25rem;font-weight:700;margin:0 0 4px}
  .desc{font-size:.8rem;color:var(--g600);margin:0}
  .sector{background:#fff;border:1px solid var(--g200);padding:8px 12px;border-radius:10px;text-align:right}
  .sector-l{font-size:.7rem;color:var(--g500);display:block}
  .sector-v{font-weight:600;font-size:.8rem}
  .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
  .metric{background:#fff;border:1px solid var(--g200);padding:16px;border-radius:10px}
  .metric-l{font-size:.7rem;color:var(--g500);display:block}
  .metric-v{font-size:1.35rem;font-weight:700;font-family:monospace;display:block;line-height:1.2}
  .metric-h{font-size:.7rem;color:var(--g500);display:block;margin-top:2px}
  .spill{background:#fff;border:1px solid var(--g200);padding:16px;border-radius:10px}
  .spill-h{font-size:.8rem;font-weight:600;color:var(--g600);margin:0 0 12px;display:flex;gap:6px;align-items:center}
  .tags{display:flex;flex-wrap:wrap;gap:6px}
  .tag-n{background:var(--g100);color:var(--g700);font-size:.7rem;padding:4px 10px;border-radius:6px;border:1px solid var(--g200)}
  .tag-n b{font-family:monospace;color:var(--g500);margin-left:6px}
  .policy{background:var(--g100);border:1px dashed var(--g300);padding:16px;border-radius:10px}
  .policy-h{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;font-weight:600;color:var(--g600);display:flex;gap:6px;align-items:center}
  .policy-t{font-size:.875rem;color:var(--g700);margin:8px 0 0}
  .foot{border-top:1px solid var(--g100);padding-top:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:auto}
  .foot-e{font-size:.7rem;color:var(--g500);font-family:monospace}
  .btn{background:var(--ink);color:#fff;border:none;padding:9px 16px;border-radius:10px;font-size:.8rem;font-weight:600;display:inline-flex;gap:8px;align-items:center}
  .btn:hover{box-shadow:0 4px 12px rgba(9,9,11,.06)}
  .msg{padding:60px 20px;text-align:center;color:var(--g500);font-size:.8rem}
  .msg.err{color:var(--red)}
  .close{align-self:flex-end;background:transparent;border:1px solid var(--g200);border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--g600)}
  .gl{display:grid;grid-template-columns:minmax(0,1fr);gap:20px}
  .gl.has-drawer{grid-template-columns:minmax(0,1fr) 400px}
  @media(max-width:1100px){.gl.has-drawer{grid-template-columns:minmax(0,1fr)}}
  .gshell{background:var(--g50);border:1px solid var(--g100);border-radius:14px;padding:24px;display:flex;flex-direction:column;min-height:560px}
  .ghdr{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px}
  .legend{display:flex;gap:16px;flex-wrap:wrap}
  .legend-i{display:flex;gap:8px;align-items:center;font-size:.8rem;color:var(--g600)}
  .legend-d{width:9px;height:9px;border-radius:50%}
  .svg-w{flex:1;background:#fff;border:1px solid var(--g200);border-radius:10px;overflow:hidden;min-height:380px}
  .svg-w svg{display:block;width:100%;height:100%}
  .gfoot{display:flex;justify-content:space-between;align-items:center;margin-top:16px;background:#fff;border:1px solid var(--g200);padding:12px 20px;border-radius:10px;gap:12px;flex-wrap:wrap;font-size:.8rem}
  .drawer{background:var(--g50);border:1px solid var(--g100);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:16px;max-height:calc(100vh - 140px);overflow-y:auto}
  .tshell{background:var(--g50);border:1px solid var(--g100);border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:20px}
  .ttop{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
  .tcanvas{background:#fff;border:1px solid var(--g200);border-radius:10px;overflow:hidden;aspect-ratio:16/10;min-height:420px}
  .tcanvas svg{display:block;width:100%;height:100%}
  .tlegend{display:flex;gap:16px;flex-wrap:wrap;align-items:center;padding:16px;background:#fff;border:1px solid var(--g200);border-radius:10px}
  .tlegend-t{font-size:.7rem;font-weight:600;color:var(--g500);text-transform:uppercase;margin-right:8px}
  .tlegend-i{display:flex;gap:6px;align-items:center;font-size:.7rem;color:var(--g600)}
  .tlegend-s{width:14px;height:14px;border-radius:3px}
  .tfoot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;border:1px solid var(--g200);padding:12px 20px;border-radius:10px;font-size:.8rem}
`;

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [product, setProduct] = useState(null);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const el = document.createElement('style');
    el.innerHTML = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const changeCountry = (e) => {
    const c = COUNTRIES.find((x) => x.code === e.target.value) || COUNTRIES[0];
    setCountry(c); setProduct(null); setDrawer(false);
  };

  const changeTab = (t) => {
    setTab(t);
    if (t === 'dashboard') setDrawer(false);
  };

  const clickNode = (n) => {
    setProduct({ code: n.id, name: n.name, rca: n.rca, value: n.value });
    setDrawer(true);
  };

  return (
    <div className="shell">
      <header className="hdr">
        <div className="brand">
          <div className="logo"><Network size={18} color="#fff" /></div>
          <div>
            <h1>EconoFold <span>Intelligence</span></h1>
            <p>Complejidad económica · BACI/HS92</p>
          </div>
        </div>
        <div className="hdr-a">
          <select className="sel" value={country.code} onChange={changeCountry}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
          <div className="seg" role="tablist">
            <button role="tab" aria-selected={tab === 'dashboard'} onClick={() => changeTab('dashboard')}>
              <BarChart2 size={14} /> Dashboard
            </button>
            <button role="tab" aria-selected={tab === 'grafo'} onClick={() => changeTab('grafo')}>
              <Compass size={14} /> Mapa
            </button>
            <button role="tab" aria-selected={tab === 'treemap'} onClick={() => changeTab('treemap')}>
              <LayoutGrid size={14} /> Treemap
            </button>
          </div>
        </div>
      </header>

      <main>
        {tab === 'dashboard' && <Dashboard country={country} product={product} setProduct={setProduct} onExplore={() => changeTab('grafo')} />}
        {tab === 'grafo' && (
          <div className={`gl ${drawer && product ? 'has-drawer' : ''}`}>
            <section className="gshell">
              <div className="ghdr">
                <div>
                  <h3 className="panel-t">Topología del espacio de productos</h3>
                  <p className="panel-s">Top 40 · {country.flag} {country.name} · {YEAR}</p>
                </div>
                <div className="legend">
                  <div className="legend-i"><span className="legend-d" style={{ background: 'var(--ink)' }} /> RCA ≥ 1</div>
                  <div className="legend-i"><span className="legend-d" style={{ background: '#fff', border: '1.5px solid var(--g400)' }} /> RCA &lt; 1</div>
                </div>
              </div>
              <div className="svg-w"><Graph iso3={country.code} selectedId={product?.code} onNodeClick={clickNode} /></div>
              <div className="gfoot">
                <span style={{ color: 'var(--g500)' }}>{product ? `Seleccionado: ${product.name}` : 'Clic en un nodo para ver detalle'}</span>
                <span style={{ color: 'var(--g500)', fontSize: '.7rem' }}>Ancho de línea = proximidad</span>
              </div>
            </section>
            {drawer && product && (
              <aside className="drawer">
                <Detail p={product} country={country} compact onClose={() => setDrawer(false)} />
              </aside>
            )}
          </div>
        )}
        {tab === 'treemap' && (
          <div className={`gl ${drawer && product ? 'has-drawer' : ''}`}>
            <section className="tshell">
              <div className="ttop">
                <div>
                  <h3 className="panel-t">Composición exportadora</h3>
                  <p className="panel-s" style={{ margin: 0 }}>{country.flag} {country.name} · {YEAR}</p>
                </div>
              </div>
              <div className="tcanvas"><Treemap iso3={country.code} selectedId={product?.code} onTileClick={clickNode} /></div>
              <div className="tlegend">
                <span className="tlegend-t">RCA</span>
                {[
                  { l: '< 1', L: 94, S: 50, d: true },
                  { l: '1–3', L: 80, S: 65 },
                  { l: '3–6', L: 62, S: 72 },
                  { l: '6–12', L: 42, S: 72 },
                  { l: '≥ 12', L: 26, S: 70 },
                ].map((s) => (
                  <div key={s.l} className="tlegend-i">
                    <span className="tlegend-s" style={{
                      background: `hsl(220,${s.S}%,${s.L}%)`,
                      border: s.d ? '1px dashed hsl(220,45%,60%)' : '1px solid transparent',
                    }} />
                    {s.l}
                  </div>
                ))}
              </div>
              <div className="tlegend">
                <span className="tlegend-t">Sector</span>
                {Object.entries(HUES).map(([name, hue]) => (
                  <div key={name} className="tlegend-i">
                    <span className="tlegend-s" style={{ background: `hsl(${hue},72%,55%)` }} />
                    {name}
                  </div>
                ))}
              </div>
            </section>
            {drawer && product && (
              <aside className="drawer">
                <Detail p={product} country={country} compact onClose={() => setDrawer(false)} />
              </aside>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Dashboard({ country, product, setProduct, onExplore }) {
  const { data: products, loading, error } = useFetch(
    `/api/countries/${country.code}/products?year=${YEAR}&limit=100`,
    [country.code]
  );

  useEffect(() => {
    if (products?.length) {
      const cur = product && products.find((p) => p.code === product.code);
      if (!cur) setProduct(products[0]);
    }
    // eslint-disable-next-line
  }, [products]);

  if (loading) return <div className="msg">Cargando {country.name}…</div>;
  if (error) return <div className="msg err">Error: {error}</div>;
  if (!products?.length) return <div className="msg">Sin datos</div>;

  const cur = product ? products.find((p) => p.code === product.code) || products[0] : products[0];
  const ranking = { position: products.findIndex((p) => p.code === cur.code) + 1, total: products.length };

  return (
    <div className="grid">
      <section className="panel panel-list">
        <div className="panel-h">
          <h3 className="panel-t"><Layers size={16} /> Cesta productiva</h3>
          <span className="panel-c">{products.length} activos</span>
        </div>
        <p className="panel-s">Top exportaciones · {country.flag} {country.name} · {YEAR}</p>
        <div className="list">
          {products.map((p) => (
            <ProductCard key={p.code} p={p} selected={cur?.code === p.code} onSelect={setProduct} />
          ))}
        </div>
      </section>
      <section className="panel panel-detail">
        <Detail p={cur} country={country} ranking={ranking} onExplore={onExplore} />
      </section>
    </div>
  );
}