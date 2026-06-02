import { useRef } from 'react';
import { Tooltip, Box } from '@mui/material';
import type { ToothCondition, ToothData } from './types';

type ChartView = 'medical' | 'cosmetic';

// Conditions highlighted in cosmetic view — restorative work only.
// Pathological conditions (decay, missing) are rendered as healthy in this view.
const COSMETIC_CONDITIONS = new Set<ToothCondition>(['crown', 'filling']);

interface DentalChartProps {
  teeth: ToothData[];
  view?: ChartView;
  readonly?: boolean;
  onToothClick?: (toothNumber: number) => void;
  selectedTooth?: number | null;
}

interface ToothStyle {
  fill: string;
  patternId: string | null;
  strokeDasharray?: string;
  opacity?: number;
}

const TOOTH_STYLES: Record<ToothCondition, ToothStyle> = {
  healthy:  { fill: 'transparent', patternId: null },
  crown:    { fill: '#00897B',     patternId: 'pattern-crown' },
  decay:    { fill: '#E53935',     patternId: 'pattern-decay' },
  filling:  { fill: '#43A047',     patternId: 'pattern-filling' },
  missing:  { fill: '#9E9E9E',     patternId: null, strokeDasharray: '4 2', opacity: 0.5 },
};

// Image dimensions (must match the actual PNG)
const IMG_W = 377;
const IMG_H = 497;

// Approximate visual centre used only for pushing labels outward

// ---------------------------------------------------------------------------
// Tooth overlay data
// cx/cy  – centre of the ellipse in PNG pixel space
// rx/ry  – semi-axes (rx = along arch tangent, ry = along arch normal)
// rot    – degrees the ellipse is tilted to follow the arch curvature
// ---------------------------------------------------------------------------
type ToothOverlay = {
  id: number;
  cx: number; cy: number;
  rx: number; ry: number;
  rot: number;
};

const UPPER_TEETH: ToothOverlay[] = [
  // Upper-right quadrant 11–18 (left side of chart, from midline outward)
  { id: 8, cx: 171, cy:  26, rx: 11, ry: 18, rot:   4 },
  { id: 7, cx: 139, cy:  35, rx: 11, ry: 17, rot:  13 },
  { id: 6, cx: 115, cy:  52, rx: 11, ry: 17, rot:  25 },
  { id: 5, cx: 95, cy:  77, rx: 13, ry: 17, rot:  37 },
  { id: 4, cx:  83, cy: 106, rx: 13, ry: 17, rot:  49 },
  { id: 3, cx:  67, cy: 141, rx: 15, ry: 18, rot:  61 },
  { id: 2, cx:  60, cy: 181, rx: 15, ry: 16, rot:  71 },
  { id: 1, cx:  50, cy: 220, rx: 13, ry: 16, rot:  79 },
  // Upper-left quadrant 21–28 (right side of chart, from midline outward)
  { id: 9, cx: 205, cy:  26, rx: 11, ry: 18, rot:  -4 },
  { id: 10, cx: 235, cy:  35, rx: 11, ry: 17, rot: -13 },
  { id: 11, cx: 263, cy:  46, rx: 12, ry: 14, rot: -20 },
  { id: 12, cx: 280, cy:  77, rx: 13, ry: 17, rot: -37 },
  { id: 13, cx: 296, cy: 106, rx: 13, ry: 17, rot: -49 },
  { id: 14, cx: 308, cy: 142, rx: 15, ry: 18, rot: -61 },
  { id: 15, cx: 315, cy: 185, rx: 15, ry: 18, rot: -71 },
  { id: 16, cx: 325, cy: 220, rx: 13, ry: 16, rot: -79 },
];

const LOWER_TEETH: ToothOverlay[] = [
  // Lower-right quadrant 41–48 (left side of chart, from midline outward)
  { id: 32, cx:  56, cy: 300, rx: 14, ry: 16, rot: 102 },
  { id: 31, cx:  65, cy: 337, rx: 14, ry: 16, rot: 111 },
  { id: 30, cx:  80, cy: 385, rx: 14, ry: 16, rot: 122 },
  { id: 29, cx:  95, cy: 416, rx: 10, ry: 15, rot: 100 },
  { id: 28, cx: 108, cy: 443, rx: 12, ry: 10, rot: 147 },
  { id: 27, cx: 128, cy: 465, rx: 10, ry: 10, rot: 158 },
  { id: 26, cx: 152, cy: 476, rx: 10, ry: 12, rot: 168 },
  { id: 25, cx: 177, cy: 478, rx: 10, ry: 10, rot: 176 },
  // Lower-left quadrant 31–38 (right side of chart, from midline outward)
  { id: 24, cx: 201, cy: 478, rx: 10, ry: 10, rot: -176 },
  { id: 23, cx: 225, cy: 476, rx: 10, ry: 10, rot: -168 },
  { id: 22, cx: 248, cy: 462, rx: 10, ry: 10, rot: -158 },
  { id: 21, cx: 269, cy: 443, rx: 12, ry: 12, rot: -147 },
  { id: 20, cx: 285, cy: 416, rx: 12, ry: 12, rot: -135 },
  { id: 19, cx: 295, cy: 385, rx: 14, ry: 16, rot: -122 },
  { id: 18, cx: 310, cy: 337, rx: 14, ry: 16, rot: -111 },
  { id: 17, cx: 320, cy: 295, rx: 14, ry: 16, rot: -102 },
];

const ALL_OVERLAYS: ToothOverlay[] = [...UPPER_TEETH, ...LOWER_TEETH];

// True on any device that reports touch capability (tablets, touch laptops).
// Used to expand SVG tooth hit zones to meet 44px minimum (FR52, UX-DR6).
const IS_TOUCH_DEVICE = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

// Minimum hit radius to achieve 44px target: ceil(44 / 2) = 22px.
const MIN_HIT_RADIUS = 22;

/**
 * For each tooth, compute the largest hit radius that won't overlap the nearest
 * neighbour's hit zone: floor(min_centre_distance / 2).
 *
 * On densely packed lower incisors (teeth 22–27) centres are only ~24px apart,
 * so the safe cap is 12px — expansion is limited there to prevent silent
 * wrong-tooth selection (P-2 from code review).  Molars and posteriors have
 * 30–50px spacing so they reach or approach the full 22px MIN_HIT_RADIUS.
 */
function buildSafeHitRadii(overlays: ToothOverlay[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const ov of overlays) {
    let minDist = Infinity;
    for (const other of overlays) {
      if (other.id === ov.id) continue;
      const dx = ov.cx - other.cx;
      const dy = ov.cy - other.cy;
      minDist = Math.min(minDist, Math.sqrt(dx * dx + dy * dy));
    }
    map.set(ov.id, Math.floor(minDist / 2));
  }
  return map;
}

// Pre-computed once at module load — tooth positions are static.
const SAFE_HIT_RADII = buildSafeHitRadii(ALL_OVERLAYS);

export default function DentalChart({ teeth, view = 'medical', readonly = false, onToothClick, selectedTooth }: DentalChartProps) {
  const toothRefs = useRef<Record<number, SVGGElement | null>>({});

  const getCondition = (id: number): ToothCondition => {
    const condition = teeth.find(t => t.toothNumber === id)?.condition ?? 'healthy';
    if (view === 'cosmetic' && !COSMETIC_CONDITIONS.has(condition)) return 'healthy';
    return condition;
  };

  const moveFocus = (id: number, dir: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown') => {
    const allIds = ALL_OVERLAYS.map(o => o.id);
    const idx = allIds.indexOf(id);
    if (idx < 0) return;
    let next: number | undefined;
    if (dir === 'ArrowLeft')  next = allIds[idx - 1];
    if (dir === 'ArrowRight') next = allIds[idx + 1];
    if (dir === 'ArrowUp' || dir === 'ArrowDown') {
      const mirror: Record<number, number> = {};
      UPPER_TEETH.forEach((u, i) => {
        if (LOWER_TEETH[i]) { mirror[u.id] = LOWER_TEETH[i].id; mirror[LOWER_TEETH[i].id] = u.id; }
      });
      next = mirror[id];
    }
    if (next) toothRefs.current[next]?.focus();
  };

  const renderOverlay = (ov: ToothOverlay) => {
    const condition = getCondition(ov.id);
    const style = TOOTH_STYLES[condition];
    const ariaLabel = `Tooth ${ov.id}: ${condition}`;
    const isActive = condition !== 'healthy';
    const isSelected = ov.id === selectedTooth;
    // Clamped hit radius: expand toward 44px but never past the safe distance
    // to the nearest neighbour centre (prevents overlap on densely packed incisors).
    const safeHitR = SAFE_HIT_RADII.get(ov.id) ?? MIN_HIT_RADIUS;

    return (
      <g key={ov.id}>
        {/* Interactive tooth hit-zone */}
        <Tooltip title={ariaLabel} arrow>
          <g
            ref={el => { toothRefs.current[ov.id] = el; }}
            role={readonly ? undefined : 'button'}
            tabIndex={readonly ? -1 : 0}
            aria-label={ariaLabel}
            transform={`translate(${ov.cx},${ov.cy}) rotate(${ov.rot})`}
            style={{ cursor: (!readonly && onToothClick) ? 'pointer' : 'default', outline: 'none' }}
            onClick={readonly ? undefined : () => onToothClick?.(ov.id)}
            onKeyDown={readonly ? undefined : e => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToothClick?.(ov.id); }
              else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
                e.preventDefault();
                moveFocus(ov.id, e.key as 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown');
              }
            }}
            onFocus={readonly ? undefined : e => {
              (e.currentTarget as SVGGElement).querySelector('.hit')?.setAttribute('stroke', '#1976d2');
              (e.currentTarget as SVGGElement).querySelector('.hit')?.setAttribute('stroke-width', '2');
            }}
            onBlur={readonly ? undefined : e => {
              (e.currentTarget as SVGGElement).querySelector('.hit')?.setAttribute('stroke', 'transparent');
              (e.currentTarget as SVGGElement).querySelector('.hit')?.setAttribute('stroke-width', '0');
            }}
          >
            {/* Selected tooth highlight ring — tracks the actual expanded hit zone
                so the visual selection indicator matches the tappable area (P-3 fix). */}
            {isSelected && (
              <ellipse cx={0} cy={0}
                rx={(IS_TOUCH_DEVICE ? Math.min(Math.max(ov.rx, MIN_HIT_RADIUS), safeHitR) : ov.rx) + 4}
                ry={(IS_TOUCH_DEVICE ? Math.min(Math.max(ov.ry, MIN_HIT_RADIUS), safeHitR) : ov.ry) + 4}
                fill="none" stroke="#1976d2" strokeWidth={2} opacity={0.85}
                pointerEvents="none"
              />
            )}
            {/* Condition colour fill */}
            {isActive && (
              <ellipse cx={0} cy={0} rx={ov.rx} ry={ov.ry}
                fill={style.fill} opacity={0.65}
                strokeDasharray={style.strokeDasharray}
                pointerEvents="none"
              />
            )}
            {/* Condition pattern */}
            {isActive && style.patternId && (
              <ellipse cx={0} cy={0} rx={ov.rx} ry={ov.ry}
                fill={`url(#${style.patternId})`} opacity={0.5}
                pointerEvents="none"
              />
            )}
            {/* Transparent hit ellipse — expanded on touch devices, capped at safeHitR
                to prevent overlap with adjacent tooth zones (FR52, P-2 fix). */}
            <ellipse className="hit"
              cx={0} cy={0}
              rx={IS_TOUCH_DEVICE ? Math.min(Math.max(ov.rx, MIN_HIT_RADIUS), safeHitR) : ov.rx}
              ry={IS_TOUCH_DEVICE ? Math.min(Math.max(ov.ry, MIN_HIT_RADIUS), safeHitR) : ov.ry}
              fill="transparent" stroke="transparent" strokeWidth={0}
            />
          </g>
        </Tooltip>

        {/* Tooth number label */}
        <text
          x={ov.cx} y={ov.cy}
          textAnchor="middle" dominantBaseline="central"
          fontSize={12} fontWeight={isSelected ? 700 : 600}
          fill={isSelected ? '#1976d2' : '#1a237e'}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {ov.id}
        </text>
      </g>
    );
  };

  return (
    <Box
      component="svg"
      width={IMG_W}
      height={IMG_H}
      viewBox={`0 0 ${IMG_W} ${IMG_H}`}
      role="img"
      aria-label="Dental chart — click a tooth to record its condition"
      sx={{ display: 'block', maxWidth: '100%', height: 'auto', touchAction: 'manipulation' }}
    >
      <defs>
        <pattern id="pattern-crown" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={6} stroke="#fff" strokeWidth={1.2} />
        </pattern>
        <pattern id="pattern-decay" patternUnits="userSpaceOnUse" width={8} height={8}>
          <line x1={0} y1={0} x2={0} y2={8} stroke="#fff" strokeWidth={1.2} />
          <line x1={0} y1={0} x2={8} y2={0} stroke="#fff" strokeWidth={1.2} />
        </pattern>
        <pattern id="pattern-filling" patternUnits="userSpaceOnUse" width={6} height={6}>
          <circle cx={3} cy={3} r={1} fill="#fff" />
        </pattern>
      </defs>

      {/* Base dental chart image */}
      <image
        href="/assets/dental-chart.png"
        x={0} y={0}
        width={IMG_W}
        height={IMG_H}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Clickable tooth overlays */}
      {ALL_OVERLAYS.map(ov => renderOverlay(ov))}
    </Box>
  );
}
