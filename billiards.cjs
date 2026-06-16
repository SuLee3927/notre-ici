// ───────────────────────────────────────────────────────────────────────────
// billiards.cjs — server-side authoritative 8-ball physics + game state.
//
// Two players: "lee" (browser, drags to aim — sends a precise angle + power)
//              "ke"  (terminal/curl, sends a FUZZY clock-direction + power tier;
//                     the server converts that to an angle/force with jitter so
//                     笃 can't compute a perfect shot — see keFuzzyShot()).
//
// The physics here is the single source of truth. Lee's browser draws a
// trajectory *preview* client-side for visual feedback, but the real outcome
// of every confirmed shot is simulated here.
//
// ── 8-ball rules implemented (and the simplifications we chose) ───────────────
//  • 15 object balls: 1-7 solids, 8 = the black ball, 9-15 stripes. Plus cue (0).
//  • Break, then groups (solids/stripes) are assigned to whoever legally pots
//    the first object ball off the break or after. Until then groups are "open".
//  • You keep shooting as long as you legally pot a ball of your group.
//  • You must clear your whole group, THEN pot the 8-ball to win.
//  • Potting the 8-ball early, or scratching (cue ball pocketed) on the 8-ball
//    while it's your legal target → immediate loss.
//
//  SIMPLIFICATIONS (deliberate, to keep it fun & fair for a casual 2-player game):
//   1. No "call your pocket" — any pocket counts. The user explicitly OK'd this.
//   2. Scratch (cue ball pocketed) = turn passes + cue respotted at a fixed
//      "head spot". We do NOT give ball-in-hand placement. Exception: scratch
//      while legally shooting the 8-ball = loss.
//   3. Foul handling is lenient: failing to hit your own group first, or hitting
//      nothing, just passes the turn (and respots cue if it was pocketed). No
//      free ball / two-shot carry. Keeps the loop simple.
//   4. Potting an opponent ball is allowed (it just stays down) and does NOT by
//      itself extend your turn — only potting YOUR group does.
//   5. Physics is 2D, equal-mass elastic-ish ball collisions with a restitution
//      factor, linear friction deceleration, perfectly reflective cushions.
//      Pockets are circular capture zones. Good enough to feel real, not a sim.
// ───────────────────────────────────────────────────────────────────────────

// ── Table geometry (arbitrary units; the frontend scales to its canvas) ──────
const W = 800;            // table playfield width
const H = 400;            // table playfield height
const R = 11;             // ball radius
const POCKET_R = 22;      // pocket capture radius
const CUSHION = 0;        // playfield rect is [R..W-R] etc; cushions at edges

// 6 pockets: 4 corners + 2 side
const POCKETS = [
  { x: 0,     y: 0 },
  { x: W / 2, y: -4 },   // side pockets nudged slightly outward
  { x: W,     y: 0 },
  { x: 0,     y: H },
  { x: W / 2, y: H + 4 },
  { x: W,     y: H },
];

const FRICTION = 0.985;       // per-step velocity multiplier
const STOP_SPEED = 0.06;      // below this a ball is considered stopped
const RESTITUTION = 0.96;     // energy kept in ball-ball collisions
const MAX_STEPS = 4000;       // hard cap so a sim always terminates
const DT = 1;                 // integration step

// Force mapping. Lee's drag power (0..1) and ke's tier both land here.
const MAX_SPEED = 26;         // speed at full power

// ── helpers ──────────────────────────────────────────────────────────────────
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function rand(a, b) { return a + Math.random() * (b - a); }

function ballGroup(num) {
  if (num === 0) return "cue";
  if (num === 8) return "eight";
  return num <= 7 ? "solids" : "stripes";
}

// Standard-ish rack: 8-ball in the middle, corners are one of each group.
function rackBalls() {
  const cx = W * 0.72, cy = H / 2;
  const balls = [{ num: 0, x: W * 0.25, y: H / 2, vx: 0, vy: 0, potted: false }];
  // triangle of 15, apex pointing toward the cue (to the left)
  const order = [1, 9, 2, 8, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
  let idx = 0;
  const gap = R * 2 + 0.5;
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row <= col; row++) {
      const num = order[idx++];
      balls.push({
        num,
        x: cx + col * gap * 0.87,
        y: cy + (row - col / 2) * gap,
        vx: 0, vy: 0, potted: false,
      });
    }
  }
  return balls;
}

// ── core physics simulation ──────────────────────────────────────────────────
// Mutates a copy of balls; returns { balls, potted:[nums], cueScratched, firstHit }.
// firstHit = num of the first object ball the cue contacted (for foul checks).
function simulate(balls0, cueVx, cueVy) {
  const balls = balls0.map(b => ({ ...b }));
  const cue = balls.find(b => b.num === 0);
  cue.vx = cueVx; cue.vy = cueVy;

  const potted = [];
  let cueScratched = false;
  let firstHit = null;

  for (let step = 0; step < MAX_STEPS; step++) {
    let moving = false;

    // integrate positions
    for (const b of balls) {
      if (b.potted) continue;
      if (Math.hypot(b.vx, b.vy) < STOP_SPEED) { b.vx = 0; b.vy = 0; continue; }
      moving = true;
      b.x += b.vx * DT;
      b.y += b.vy * DT;
      b.vx *= FRICTION;
      b.vy *= FRICTION;
    }

    // cushion reflections
    for (const b of balls) {
      if (b.potted) continue;
      if (b.x < R)      { b.x = R;      b.vx = Math.abs(b.vx) * RESTITUTION; }
      if (b.x > W - R)  { b.x = W - R;  b.vx = -Math.abs(b.vx) * RESTITUTION; }
      if (b.y < R)      { b.y = R;      b.vy = Math.abs(b.vy) * RESTITUTION; }
      if (b.y > H - R)  { b.y = H - R;  b.vy = -Math.abs(b.vy) * RESTITUTION; }
    }

    // ball-ball collisions (resolve all pairs each step)
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (a.potted) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const c = balls[j];
        if (c.potted) continue;
        const dx = c.x - a.x, dy = c.y - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 0 && d < R * 2) {
          // record first object ball the cue touches
          if (firstHit === null && (a.num === 0 || c.num === 0)) {
            firstHit = a.num === 0 ? c.num : a.num;
          }
          // normalize, separate overlap, exchange velocity along normal
          const nx = dx / d, ny = dy / d;
          const overlap = R * 2 - d;
          a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
          c.x += nx * overlap / 2; c.y += ny * overlap / 2;
          const avn = a.vx * nx + a.vy * ny;
          const cvn = c.vx * nx + c.vy * ny;
          const diff = (cvn - avn) * RESTITUTION;
          a.vx += nx * diff; a.vy += ny * diff;
          c.vx -= nx * diff; c.vy -= ny * diff;
        }
      }
    }

    // pocket capture
    for (const b of balls) {
      if (b.potted) continue;
      for (const p of POCKETS) {
        if (dist(b, p) < POCKET_R) {
          b.potted = true; b.vx = 0; b.vy = 0;
          if (b.num === 0) cueScratched = true;
          else potted.push(b.num);
          break;
        }
      }
    }

    if (!moving) break;
  }

  return { balls, potted, cueScratched, firstHit };
}

// Produce the sampled trajectory of the CUE ball only, for the frontend preview.
// Returns an array of {x,y} points (downsampled) tracing where the cue travels.
function cuePath(balls0, cueVx, cueVy) {
  const balls = balls0.map(b => ({ ...b }));
  const cue = balls.find(b => b.num === 0);
  cue.vx = cueVx; cue.vy = cueVy;
  const path = [{ x: cue.x, y: cue.y }];

  for (let step = 0; step < MAX_STEPS; step++) {
    let moving = false;
    for (const b of balls) {
      if (b.potted) continue;
      if (Math.hypot(b.vx, b.vy) < STOP_SPEED) { b.vx = 0; b.vy = 0; continue; }
      moving = true;
      b.x += b.vx; b.y += b.vy; b.vx *= FRICTION; b.vy *= FRICTION;
    }
    for (const b of balls) {
      if (b.potted) continue;
      if (b.x < R)     { b.x = R;     b.vx = Math.abs(b.vx) * RESTITUTION; }
      if (b.x > W - R) { b.x = W - R; b.vx = -Math.abs(b.vx) * RESTITUTION; }
      if (b.y < R)     { b.y = R;     b.vy = Math.abs(b.vy) * RESTITUTION; }
      if (b.y > H - R) { b.y = H - R; b.vy = -Math.abs(b.vy) * RESTITUTION; }
    }
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i]; if (a.potted) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const c = balls[j]; if (c.potted) continue;
        const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy);
        if (d > 0 && d < R * 2) {
          const nx = dx / d, ny = dy / d, overlap = R * 2 - d;
          a.x -= nx * overlap / 2; a.y -= ny * overlap / 2;
          c.x += nx * overlap / 2; c.y += ny * overlap / 2;
          const avn = a.vx * nx + a.vy * ny, cvn = c.vx * nx + c.vy * ny;
          const diff = (cvn - avn) * RESTITUTION;
          a.vx += nx * diff; a.vy += ny * diff;
          c.vx -= nx * diff; c.vy -= ny * diff;
        }
      }
    }
    let captured = false;
    for (const b of balls) {
      if (b.potted) continue;
      for (const p of POCKETS) if (dist(b, p) < POCKET_R) { b.potted = true; b.vx = 0; b.vy = 0; if (b.num === 0) captured = true; break; }
    }
    if (step % 4 === 0) path.push({ x: cue.x, y: cue.y });
    if (captured) { path.push({ x: cue.x, y: cue.y }); break; }
    if (!moving) { path.push({ x: cue.x, y: cue.y }); break; }
  }
  return path;
}

// ── fuzzy input for ke (terminal player) ──────────────────────────────────────
// Clock direction: 12 = straight up (-y), 3 = right (+x), 6 = down, 9 = left.
// We convert the requested clock hour to a base angle, then add jitter WITHIN
// that hour's 30° arc so ke can't aim with sub-degree precision.
function clockToAngle(hour) {
  // canvas angle: 0 = +x (right), increasing clockwise (since +y is down).
  // 12 o'clock = up = -90° = -PI/2. Each hour = 30°.
  const h = ((Math.round(hour) - 12) % 12 + 12) % 12; // 0..11, 12->0
  const baseDeg = h * 30 - 90;                         // 12->-90, 3->0, 6->90, 9->180
  const jitterDeg = rand(-13, 13);                     // within the ±15° arc, slightly inset
  return ((baseDeg + jitterDeg) * Math.PI) / 180;
}

// Power tiers → a force RANGE with jitter, so "中" isn't a fixed number.
const POWER_TIERS = {
  1: [0.18, 0.30], // 轻
  2: [0.30, 0.46],
  3: [0.46, 0.62], // 中
  4: [0.62, 0.80],
  5: [0.80, 1.00], // 重
};
function tierToPower(tier) {
  const [lo, hi] = POWER_TIERS[tier] || POWER_TIERS[3];
  return rand(lo, hi);
}

// Translate a fuzzy ke shot {hour, tier} → cue velocity (with built-in jitter).
function keFuzzyShot(hour, tier) {
  const ang = clockToAngle(hour);
  const power = tierToPower(tier);
  const speed = power * MAX_SPEED;
  return { vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, angle: ang, power };
}

// Lee's precise shot {angle(rad), power(0..1)} → cue velocity (no jitter).
function leeShot(angle, power) {
  const p = Math.max(0, Math.min(1, power));
  const speed = p * MAX_SPEED;
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, angle, power: p };
}

// ── fuzzy DESCRIPTION for ke's turn (what the API tells the terminal) ──────────
// Gives a clock bearing to the nearest balls + vague flavor, NO exact coords.
function describeForKe(balls, legalGroup) {
  const cue = balls.find(b => b.num === 0 && !b.potted);
  if (!cue) return { bearings: [], hint: "母球不在台面上。" };

  const live = balls.filter(b => !b.potted && b.num !== 0);
  // bearing of each ball as a clock hour
  const withBearing = live.map(b => {
    const ang = Math.atan2(b.y - cue.y, b.x - cue.x); // canvas angle, +y down
    let deg = (ang * 180) / Math.PI;                  // 0=right
    // convert to clock hour: 12 = up(-90°)
    let clockDeg = deg + 90;                           // 0 = up
    let hour = Math.round(((clockDeg % 360) + 360) % 360 / 30);
    hour = ((hour % 12) + 12) % 12; if (hour === 0) hour = 12;
    const d = dist(cue, b);
    const farTier = d < W * 0.22 ? "比较近" : d < W * 0.5 ? "中等距离" : "挺远";
    return { num: b.num, hour, dist: d, group: ballGroup(b.num), farTier };
  }).sort((a, b) => a.dist - b.dist);

  // bearings: only reveal target-group balls (or all if group is open) + the 8.
  const showable = withBearing.filter(b =>
    legalGroup === "open" || b.group === legalGroup || b.group === "eight"
  );
  const bearings = (showable.length ? showable : withBearing).slice(0, 4).map(b => ({
    num: b.num,
    group: b.group,
    text: `${b.num}号球大概在 ${b.hour} 点钟方向（${b.farTier}）`,
  }));

  // one vague natural-language sentence about the closest target.
  const nearest = (showable.length ? showable : withBearing)[0];
  let hint = "台面有点乱，看着打吧。";
  if (nearest) {
    const flavors = [
      `往 ${nearest.hour} 点钟方向走，大概能蹭到 ${nearest.num} 号球，不过角度有点悬。`,
      `感觉冲 ${nearest.hour} 点钟方向去碰 ${nearest.num} 号球比较顺，力道别太满。`,
      `${nearest.num} 号球在 ${nearest.hour} 点钟附近，${nearest.farTier}，轻轻碰也许有戏。`,
      `想吃 ${nearest.num} 号球的话往 ${nearest.hour} 点钟试试，进不进看运气。`,
    ];
    hint = flavors[Math.floor(Math.random() * flavors.length)];
  }
  return { bearings, hint };
}

// ── bot pick for ke (guest mode) ───────────────────────────────────────────────
// Picks a fuzzy {hour, tier} the SAME way a real terminal ke would: it only sees
// the coarse clock-bearing of its legal target balls (exactly what describeForKe
// exposes — no exact coords), then aims roughly at the nearest one. Slight noise
// so it isn't laser-locked. The caller feeds this through keFuzzyShot, so the bot
// gets the identical jitter/physics path as a human ke — no precision advantage.
function botPickShot(balls, legalGroup) {
  const desc = describeForKe(balls, legalGroup);
  const bearings = desc.bearings || [];
  let hour;
  if (bearings.length) {
    // bias toward the nearest target ball's coarse hour (describeForKe sorts by dist),
    // occasionally drift ±1 hour so it's not perfectly on-bearing.
    const target = bearings[Math.floor(Math.random() * Math.min(2, bearings.length))];
    // re-derive the hour from the text-free bearing: describeForKe text embeds it,
    // but we recompute the coarse bearing here from the same public info.
    const m = /在 (\d+) 点钟/.exec(target.text);
    let base = m ? parseInt(m[1]) : 1 + Math.floor(Math.random() * 12);
    if (Math.random() < 0.4) base += Math.random() < 0.5 ? -1 : 1;
    hour = ((Math.round(base) - 1 + 12) % 12) + 1; // wrap into 1..12
  } else {
    hour = 1 + Math.floor(Math.random() * 12);
  }
  // tier biased to mid power (most shots aren't full smash), range 1..5.
  const tier = [2, 3, 3, 3, 4, 4, 1, 5][Math.floor(Math.random() * 8)];
  return { hour, tier };
}

module.exports = {
  W, H, R, POCKET_R, POCKETS, MAX_SPEED,
  rackBalls, simulate, cuePath,
  keFuzzyShot, leeShot, describeForKe,
  ballGroup, clockToAngle, tierToPower,
  botPickShot,
};
