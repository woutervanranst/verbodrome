import { APP } from '../config/app';

/** Paris at dusk: a painted sky and rooftop silhouette, or the configured photo. */
export function Scene() {
  if (APP.backdropPhoto) {
    return (
      <div className="scene" aria-hidden="true">
        <div className="scene__photo" style={{ backgroundImage: `url(${APP.backdropPhoto})` }} />
        <div className="scene__veil" />
      </div>
    );
  }
  return (
    <div className="scene" aria-hidden="true">
      <div className="scene__sky" />
      <div className="scene__sun" />
      <svg className="scene__roofs" viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
        <g fill="#3a2440" opacity="0.7">
          {FAR.map(([x0, x1, top]) => <path key={x0} d={mansard(x0, x1, top, 14)} />)}
        </g>
        <g fill="#170f1e">
          {/* Eiffel tower: arched base, two platforms, spire */}
          <path d="M946 320Q984 250 994 176h32q10 74 48 144h-22q-12-44-42-44t-42 44z" />
          <path d="M986 170h48v9h-48zM996 172q7-40 9-68h10q2 28 9 68zM1000 99h20v6h-20zM1005 100q4-40 4.4-80h1.2q.4 40 4.4 80z" />
          {NEAR.map(([x0, x1, top]) => <path key={x0} d={mansard(x0, x1, top, 20)} />)}
          {NEAR.flatMap(([x0, x1, top]) => chimneys(x0, x1, top))}
        </g>
      </svg>
      <div className="scene__veil" />
    </div>
  );
}

/** [left, right, roof height] of each rooftop, in viewBox units. */
const FAR: readonly (readonly [number, number, number])[] = [
  [-10, 170, 196], [170, 300, 176], [300, 520, 204], [520, 640, 184], [640, 880, 210],
  [880, 1130, 228], [1130, 1290, 190], [1290, 1450, 206],
];
const NEAR: readonly (readonly [number, number, number])[] = [
  [-10, 210, 252], [210, 430, 238], [430, 600, 262], [600, 860, 246], [860, 1000, 274],
  [1000, 1080, 286], [1080, 1250, 258], [1250, 1450, 244],
];

/** A Haussmann block: straight walls with a sloped mansard roof. */
function mansard(x0: number, x1: number, top: number, slope: number): string {
  return `M${x0} 320V${top + 26}L${x0 + slope} ${top}H${x1 - slope}L${x1} ${top + 26}V320z`;
}

/** A few chimney stacks with pots along a roof, placed deterministically. */
function chimneys(x0: number, x1: number, top: number) {
  const width = x1 - x0;
  const count = Math.max(1, Math.floor(width / 85));
  return Array.from({ length: count }, (_, i) => {
    const x = x0 + ((i + 0.5) * width) / count + ((i * 37 + x0) % 23) - 11;
    const height = 12 + ((i * 53 + x0) % 11);
    return (
      <path key={`${x0}-${i}`}
        d={`M${x} ${top}v${-height}h22v${height}zM${x + 2} ${top - height}v-7h4v7zM${x + 9} ${top - height}v-9h4v9zM${x + 16} ${top - height}v-6h4v6z`} />
    );
  });
}
