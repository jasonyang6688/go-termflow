// Shared wireframe primitives — sketchy vibe
// Every stroke uses currentColor; ink defaults to #2B2A28

const ink = '#2B2A28';
const paper = '#FAF8F4';
const pencil = '#6B6864';
const faint = '#C9C4BA';
const highlight = 'oklch(0.92 0.18 95)';
const envProd = 'oklch(0.65 0.2 25)';
const envStg  = 'oklch(0.8 0.15 80)';
const envDev  = 'oklch(0.72 0.17 150)';
const accent  = 'oklch(0.72 0.13 230)'; // cyber blue default

// ---------- Sketchy rect ----------
// Renders a hand-drawn rectangle with slightly wobbly edges via SVG path
function SketchyRect({ w, h, stroke = ink, fill = 'none', strokeWidth = 1.6, rough = 1, dashed = false, style = {}, className = '' }) {
  // small wobble offsets
  const r = rough;
  const d = `
    M ${0 + r*0.4} ${0 + r*0.2}
    L ${w - r*0.3} ${0 - r*0.1}
    L ${w + r*0.2} ${h - r*0.4}
    L ${0 + r*0.1} ${h + r*0.2}
    Z
  `;
  return (
    <svg width={w} height={h} viewBox={`-2 -2 ${w+4} ${h+4}`} className={className}
         style={{ display: 'block', overflow: 'visible', ...style }}>
      <path d={d} stroke={stroke} fill={fill} strokeWidth={strokeWidth}
            strokeLinejoin="round" strokeLinecap="round"
            strokeDasharray={dashed ? '5 4' : 'none'} />
    </svg>
  );
}

// Box wrapper that paints a sketchy outline behind its children
function Box({ children, w, h, stroke = ink, fill = paper, strokeWidth = 1.6, rough = 1, dashed = false, pad = 12, style = {}, radius = 6 }) {
  return (
    <div style={{ position: 'relative', width: w, height: h, ...style }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
           style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
        <path
          d={wobblyRectPath(w, h, rough, radius)}
          stroke={stroke}
          fill={fill}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={dashed ? '5 4' : 'none'}
        />
      </svg>
      <div style={{ position: 'relative', padding: pad, width: '100%', height: '100%', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  );
}

function wobblyRectPath(w, h, rough = 1, radius = 6) {
  const r = Math.min(radius, w/2, h/2);
  const j = rough * 0.6; // jitter amount
  // build path with rounded corners + slight wobble
  const rand = (seed) => ((Math.sin(seed*99.1)+1)/2 - 0.5) * j;
  return `
    M ${r} ${rand(1)}
    L ${w - r + rand(2)} ${rand(3)}
    Q ${w + rand(4)} ${rand(5)}, ${w + rand(6)} ${r}
    L ${w + rand(7)} ${h - r + rand(8)}
    Q ${w + rand(9)} ${h + rand(10)}, ${w - r + rand(11)} ${h + rand(12)}
    L ${r + rand(13)} ${h + rand(14)}
    Q ${rand(15)} ${h + rand(16)}, ${rand(17)} ${h - r + rand(18)}
    L ${rand(19)} ${r + rand(20)}
    Q ${rand(21)} ${rand(22)}, ${r} ${rand(23)}
    Z
  `;
}

// ---------- Sketchy line ----------
function Line({ x1, y1, x2, y2, stroke = ink, strokeWidth = 1.4, dashed = false, rough = 1 }) {
  const dx = (x2 - x1), dy = (y2 - y1);
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * rough;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * rough;
  return (
    <path d={`M ${x1} ${y1} Q ${mx} ${my}, ${x2} ${y2}`}
          stroke={stroke} fill="none" strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashed ? '4 3' : 'none'} />
  );
}

// ---------- Handwritten text ----------
function Hand({ children, size = 16, weight = 500, color = ink, style = {}, font = 'caveat' }) {
  const family = font === 'kalam' ? "'Kalam', cursive"
               : font === 'mono'  ? "'JetBrains Mono', monospace"
               : "'Caveat', cursive";
  return <span style={{ fontFamily: family, fontSize: size, fontWeight: weight, color, ...style }}>{children}</span>;
}

// ---------- Pill (quick command button) ----------
function Pill({ children, color = ink, w, h = 28, filled = false, style = {} }) {
  const fill = filled ? color : 'transparent';
  const text = filled ? paper : color;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: h, padding: '0 12px',
      fontFamily: "'Caveat', cursive", fontSize: 17, fontWeight: 600,
      color: text,
      border: `1.5px solid ${color}`,
      background: fill,
      borderRadius: h,
      transform: `rotate(${(Math.random()-0.5)*0.4}deg)`,
      whiteSpace: 'nowrap',
      ...style
    }}>{children}</span>
  );
}

// ---------- Traffic lights (Mac chrome) ----------
function TrafficLights() {
  return (
    <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
      {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="5" fill={c} stroke={ink} strokeWidth="1" />
        </svg>
      ))}
    </div>
  );
}

// ---------- Env dot ----------
function EnvDot({ env = 'dev', size = 10 }) {
  const c = env === 'prod' ? envProd : env === 'stg' ? envStg : envDev;
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <circle cx="5" cy="5" r="4" fill={c} stroke={ink} strokeWidth="1"/>
    </svg>
  );
}

// ---------- Annotation callout (curly arrow + label) ----------
function Annotation({ x, y, children, dir = 'right', color = 'oklch(0.55 0.2 25)' }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none',
                  display: 'flex', alignItems: 'center', gap: 4,
                  transform: `rotate(${(Math.random()-0.5)*1.2}deg)` }}>
      {dir === 'left' && (
        <svg width="32" height="20" viewBox="0 0 32 20" style={{ overflow: 'visible' }}>
          <path d="M 30 10 Q 20 4, 10 10 Q 4 14, 2 10" stroke={color} fill="none" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M 2 10 L 7 6 M 2 10 L 7 14" stroke={color} fill="none" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )}
      <span style={{ fontFamily: "'Caveat', cursive", fontSize: 17, color, fontWeight: 600 }}>{children}</span>
      {dir === 'right' && (
        <svg width="32" height="20" viewBox="0 0 32 20" style={{ overflow: 'visible' }}>
          <path d="M 2 10 Q 12 4, 22 10 Q 28 14, 30 10" stroke={color} fill="none" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M 30 10 L 25 6 M 30 10 L 25 14" stroke={color} fill="none" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

// ---------- Window chrome (platform-neutral) ----------
function WindowChrome({ title = 'TermFlow', platform = 'mac', w, h, children, style = {} }) {
  const chromeH = 36;
  return (
    <div style={{ position: 'relative', width: w, height: h, background: paper,
                  border: `1.5px solid ${ink}`, borderRadius: 10, overflow: 'hidden', ...style }}>
      <div style={{ height: chromeH, borderBottom: `1.2px solid ${faint}`,
                    display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
                    background: '#F3EFE6' }}>
        {platform === 'mac' && <TrafficLights />}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <Hand size={17} color={pencil}>{title}</Hand>
        </div>
        {platform === 'win' && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6 L10 6" stroke={ink} strokeWidth="1.3"/></svg>
            <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" fill="none" stroke={ink} strokeWidth="1.3"/></svg>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2 L10 10 M10 2 L2 10" stroke={ink} strokeWidth="1.3"/></svg>
          </div>
        )}
      </div>
      <div style={{ position: 'relative', width: '100%', height: h - chromeH }}>
        {children}
      </div>
    </div>
  );
}

// ---------- Sketchy icon (generic shape) ----------
function Icon({ kind, size = 18, color = ink, strokeWidth = 1.5 }) {
  const s = size;
  const paths = {
    server: <><rect x="3" y="4" width="16" height="5" rx="1" fill="none"/><rect x="3" y="12" width="16" height="5" rx="1" fill="none"/><circle cx="6" cy="6.5" r="0.8" fill={color}/><circle cx="6" cy="14.5" r="0.8" fill={color}/></>,
    folder: <path d="M2 5 L9 5 L11 7 L20 7 L20 17 L2 17 Z" fill="none"/>,
    terminal: <><path d="M3 4 L3 18 L19 18 L19 4 Z" fill="none"/><path d="M6 8 L9 11 L6 14 M11 14 L15 14" /></>,
    search: <><circle cx="9" cy="9" r="5" fill="none"/><path d="M13 13 L18 18"/></>,
    plus:   <><path d="M4 11 L18 11 M11 4 L11 18"/></>,
    gear:   <><circle cx="11" cy="11" r="3.5" fill="none"/><path d="M11 3 L11 5 M11 17 L11 19 M3 11 L5 11 M17 11 L19 11 M5 5 L6.5 6.5 M15.5 15.5 L17 17 M5 17 L6.5 15.5 M15.5 6.5 L17 5"/></>,
    bolt:   <path d="M12 2 L5 12 L10 12 L9 19 L17 9 L12 9 Z" fill="none"/>,
    chart:  <><path d="M3 18 L3 4 M3 18 L19 18"/><path d="M5 14 L9 10 L12 13 L18 6"/></>,
    upload: <><path d="M11 14 L11 4 M6 8 L11 3 L16 8"/><path d="M4 17 L18 17"/></>,
    split:  <><rect x="3" y="4" width="16" height="14" fill="none"/><path d="M11 4 L11 18"/></>,
    grid:   <><rect x="3" y="3" width="7" height="7" fill="none"/><rect x="12" y="3" width="7" height="7" fill="none"/><rect x="3" y="12" width="7" height="7" fill="none"/><rect x="12" y="12" width="7" height="7" fill="none"/></>,
    star:   <path d="M11 3 L13 9 L19 9 L14 13 L16 19 L11 15 L6 19 L8 13 L3 9 L9 9 Z" fill="none"/>,
    link:   <><path d="M8 11 L14 11" /><path d="M9 8 L7 8 Q4 8 4 11 Q4 14 7 14 L9 14" fill="none"/><path d="M13 8 L15 8 Q18 8 18 11 Q18 14 15 14 L13 14" fill="none"/></>,
    eye:    <><path d="M2 11 Q11 4, 20 11 Q11 18, 2 11 Z" fill="none"/><circle cx="11" cy="11" r="2.5" fill="none"/></>,
    close:  <><path d="M4 4 L18 18 M18 4 L4 18"/></>,
    key:    <><circle cx="6" cy="11" r="3" fill="none"/><path d="M9 11 L18 11 L18 14 M15 11 L15 13"/></>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 22 22" style={{ display: 'inline-block', flexShrink: 0 }}>
      <g stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {paths[kind] || paths.server}
      </g>
    </svg>
  );
}

// ---------- Sketchy divider ----------
function Divider({ w, color = faint, vertical = false, h }) {
  if (vertical) {
    return <svg width="2" height={h} style={{ flexShrink: 0 }}><path d={`M 1 0 Q ${1 + Math.random()*0.6 - 0.3} ${h/2}, 1 ${h}`} stroke={color} strokeWidth="1.2" fill="none"/></svg>;
  }
  return <svg width={w} height="2"><path d={`M 0 1 Q ${w/2} ${1 + Math.random()*0.6 - 0.3}, ${w} 1`} stroke={color} strokeWidth="1.2" fill="none"/></svg>;
}

// ---------- Scribble (placeholder text) ----------
function Scribble({ w = 120, lines = 1, color = pencil, spacing = 8 }) {
  return (
    <svg width={w} height={lines * spacing + 2}>
      {Array.from({ length: lines }).map((_, i) => {
        const y = i * spacing + 4;
        const endX = w - Math.random() * w * 0.25;
        return <path key={i} d={`M 0 ${y} Q ${endX/2} ${y + (Math.random()-0.5)*1.2}, ${endX} ${y}`}
                     stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7" />;
      })}
    </svg>
  );
}

// Expose to other scripts
Object.assign(window, {
  WF: { ink, paper, pencil, faint, highlight, envProd, envStg, envDev, accent },
  WFSketchyRect: SketchyRect,
  WFBox: Box,
  WFLine: Line,
  WFHand: Hand,
  WFPill: Pill,
  WFTrafficLights: TrafficLights,
  WFEnvDot: EnvDot,
  WFAnnotation: Annotation,
  WFWindowChrome: WindowChrome,
  WFIcon: Icon,
  WFDivider: Divider,
  WFScribble: Scribble,
});
