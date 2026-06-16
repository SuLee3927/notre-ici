import { useState, useEffect, useRef, useCallback } from "react";

// ── 桌球 / 8-ball ───────────────────────────────────────────────────────────
// Lee plays from this canvas: drag on the cue ball to set aim direction (drag
// vector) and power (drag length). A dashed trajectory preview (server-computed)
// shows where the cue ball would travel, including cushion bounces, before she
// releases. The server (./billiards.cjs) is the authoritative physics.
//
// Ke plays from a terminal via /api/billiards/ke with a fuzzy clock-hour +
// power tier — when it's his turn this shows a waiting state with the vague
// description the server hands out.
// ────────────────────────────────────────────────────────────────────────────

// cute hand-drawn ball colors (solids 1-7, then stripes 9-15 reuse hues)
const BALL_COLORS = {
  1: "#F4C430", 2: "#2E5BBA", 3: "#E0392B", 4: "#7B4FA0", 5: "#E8862E",
  6: "#2E8B57", 7: "#8B3A2E", 8: "#222222",
  9: "#F4C430", 10: "#2E5BBA", 11: "#E0392B", 12: "#7B4FA0",
  13: "#E8862E", 14: "#2E8B57", 15: "#8B3A2E",
};
function isStripe(n) { return n >= 9 && n <= 15; }

export default function Billiards({ theme: t }) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("game"); // game | history
  const [history, setHistory] = useState([]);
  const [preview, setPreview] = useState(null); // {path, power}
  const [aiming, setAiming] = useState(false);

  const canvasRef = useRef(null);
  const pollRef = useRef(null);
  const dragRef = useRef(null);   // {angle, power} current aim while dragging
  const previewTimer = useRef(null);

  // ── polling for ke's terminal moves ──
  function stopPoll() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
  function startPoll() {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const d = await fetch("/api/billiards/state").then(r => r.json());
        if (d.ok && d.game) {
          setGame(d.game);
          if (d.game.phase !== "ke_turn") stopPoll();
        }
      } catch {}
    }, 2000);
  }
  useEffect(() => () => { stopPoll(); if (previewTimer.current) clearTimeout(previewTimer.current); }, []);

  async function loadHistory() {
    try {
      const d = await fetch("/api/billiards/history").then(r => r.json());
      if (d.ok) setHistory(d.history);
    } catch {}
  }

  async function newGame() {
    setLoading(true); stopPoll(); setPreview(null);
    try {
      const d = await fetch("/api/billiards/new", { method: "POST" }).then(r => r.json());
      if (d.ok) { setGame(d.game); if (d.game.phase === "ke_turn") startPoll(); }
    } catch {}
    setLoading(false);
  }

  // ── canvas coords <-> table coords ──
  function canvasMetrics() {
    const c = canvasRef.current;
    if (!c || !game) return null;
    const rect = c.getBoundingClientRect();
    const T = game.table;
    const pad = 18; // cushion frame thickness in px
    const scale = Math.min((rect.width - pad * 2) / T.W, (rect.height - pad * 2) / T.H);
    return { rect, T, pad, scale, ox: pad, oy: pad };
  }
  function toCanvas(m, x, y) { return { x: m.ox + x * m.scale, y: m.oy + y * m.scale }; }

  // ── drawing ──
  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !game) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    if (c.width !== rect.width * dpr) { c.width = rect.width * dpr; c.height = rect.height * dpr; }
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const m = canvasMetrics(); if (!m) return;
    const { T, scale } = m;
    const ballR = T.R * scale;

    // wooden frame
    ctx.fillStyle = "#7A4A28";
    roundRect(ctx, 2, 2, rect.width - 4, rect.height - 4, 14); ctx.fill();
    // felt
    const fx = m.ox, fy = m.oy, fw = T.W * scale, fh = T.H * scale;
    ctx.fillStyle = "#3E9B6E";
    roundRect(ctx, fx, fy, fw, fh, 8); ctx.fill();
    // soft felt shading
    ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 2;
    roundRect(ctx, fx, fy, fw, fh, 8); ctx.stroke();

    // pockets
    for (const p of T.pockets) {
      const cp = toCanvas(m, p.x, p.y);
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, T.pocketR * scale * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = "#14110a"; ctx.fill();
    }

    // trajectory preview (dashed) while aiming
    if (preview && preview.path && preview.path.length > 1) {
      ctx.save();
      ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      preview.path.forEach((pt, i) => {
        const cp = toCanvas(m, pt.x, pt.y);
        if (i === 0) ctx.moveTo(cp.x, cp.y); else ctx.lineTo(cp.x, cp.y);
      });
      ctx.stroke();
      // endpoint marker
      const last = preview.path[preview.path.length - 1];
      const cl = toCanvas(m, last.x, last.y);
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(cl.x, cl.y, ballR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }

    // balls
    for (const b of game.balls) {
      if (b.potted) continue;
      const cp = toCanvas(m, b.x, b.y);
      drawBall(ctx, cp.x, cp.y, ballR, b.num);
    }

    // power gauge while aiming
    if (aiming && dragRef.current) {
      const cue = game.balls.find(b => b.num === 0 && !b.potted);
      if (cue) {
        const cp = toCanvas(m, cue.x, cue.y);
        const ang = dragRef.current.angle;
        const len = 26 + dragRef.current.power * 46;
        // cue stick drawn opposite to aim (you pull back)
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cp.x - Math.cos(ang) * (ballR + 4), cp.y - Math.sin(ang) * (ballR + 4));
        ctx.lineTo(cp.x - Math.cos(ang) * (ballR + 4 + len), cp.y - Math.sin(ang) * (ballR + 4 + len));
        ctx.stroke();
        ctx.restore();
      }
    }
  }, [game, preview, aiming]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  // ── drag-to-aim handlers (lee only) ──
  function eventPos(e) {
    const c = canvasRef.current; const rect = c.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    return { x: pt.clientX - rect.left, y: pt.clientY - rect.top };
  }

  function computeAim(p) {
    const m = canvasMetrics(); if (!m || !game) return null;
    const cue = game.balls.find(b => b.num === 0 && !b.potted);
    if (!cue) return null;
    const cp = toCanvas(m, cue.x, cue.y);
    // aim points FROM the drag end TOWARD the cue ball (slingshot feel)
    const dx = cp.x - p.x, dy = cp.y - p.y;
    const angle = Math.atan2(dy, dx);
    const pull = Math.hypot(dx, dy);
    const power = Math.max(0, Math.min(1, pull / 140));
    return { angle, power };
  }

  function onDown(e) {
    if (!game || game.phase !== "lee_turn" || loading) return;
    e.preventDefault();
    setAiming(true);
    const aim = computeAim(eventPos(e));
    if (aim) { dragRef.current = aim; requestPreview(aim); }
    draw();
  }
  function onMove(e) {
    if (!aiming) return;
    e.preventDefault();
    const aim = computeAim(eventPos(e));
    if (aim) { dragRef.current = aim; requestPreviewDebounced(aim); }
    draw();
  }
  async function onUp() {
    if (!aiming) return;
    setAiming(false);
    const aim = dragRef.current;
    setPreview(null);
    if (!aim || aim.power < 0.04) { draw(); return; } // tiny drag = cancel
    await shoot(aim.angle, aim.power);
  }

  // ── server-side trajectory preview (debounced) ──
  async function requestPreview(aim) {
    try {
      const d = await fetch("/api/billiards/preview", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ angle: aim.angle, power: aim.power }),
      }).then(r => r.json());
      if (d.ok) setPreview({ path: d.path, power: aim.power });
    } catch {}
  }
  function requestPreviewDebounced(aim) {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => requestPreview(aim), 40);
  }

  async function shoot(angle, power) {
    setLoading(true);
    try {
      const d = await fetch("/api/billiards/shoot", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ angle, power }),
      }).then(r => r.json());
      if (d.ok && d.game) {
        setGame(d.game);
        if (d.game.phase === "ke_turn") startPoll();
      }
    } catch {}
    setLoading(false);
  }

  // ── landing / new game screen ──
  if (!game) return (
    <div style={{ fontFamily: "'Noto Serif SC',serif" }}>
      <Tabs t={t} tab={tab} setTab={setTab} loadHistory={loadHistory} />
      {tab === "game" ? (
        <div style={{ padding: "28px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎱</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 8 }}>桌球</div>
          <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 2, marginBottom: 22 }}>
            拖动母球瞄准，松手击球<br />打进自己那组，最后再收黑八
          </div>
          <button onClick={newGame} disabled={loading} style={{
            padding: "10px 32px", borderRadius: 12,
            border: `1.5px solid ${t.accentBorder}`, background: t.accentSoft,
            color: t.accent, fontSize: 13, cursor: "pointer", opacity: loading ? 0.6 : 1,
          }}>{loading ? "摆球中…" : "和克开一局 🎱"}</button>
        </div>
      ) : (
        <HistoryList t={t} history={history} />
      )}
    </div>
  );

  const isOver = game.phase === "over";
  const isKeTurn = game.phase === "ke_turn";
  const isMyTurn = game.phase === "lee_turn";

  const myGroup = game.groups?.lee;
  const groupLabel = (g) => g === "solids" ? "全色 ●" : g === "stripes" ? "花色 ◐" : "未定";

  function remainingOf(grp) {
    if (!grp) return null;
    return game.balls.filter(b => !b.potted && ballGroupClient(b.num) === grp).length;
  }

  return (
    <div style={{ padding: "10px 12px 28px", fontFamily: "'Noto Serif SC',serif" }}>
      {/* score row */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.textMuted, marginBottom: 8 }}>
        <span>克 · {groupLabel(game.groups?.ke)}{remainingOf(game.groups?.ke) != null ? ` 剩${remainingOf(game.groups?.ke)}` : ""}</span>
        <span>你 · {groupLabel(myGroup)}{remainingOf(myGroup) != null ? ` 剩${remainingOf(myGroup)}` : ""}</span>
      </div>

      {/* table canvas */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "2 / 1", marginBottom: 10 }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", touchAction: "none", cursor: isMyTurn ? "crosshair" : "default", display: "block" }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        />
        {isKeTurn && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 12,
            background: "rgba(0,0,0,0.28)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: 16,
          }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>等克在终端出杆…</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>🎱</div>
          </div>
        )}
      </div>

      {/* status */}
      <div style={{
        background: t.surface, border: `1px solid ${t.surfaceBorder}`, borderRadius: 12,
        padding: "10px 12px", marginBottom: 12, textAlign: "center", minHeight: 40,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 12, color: t.textSub }}>{game.message}</div>
      </div>

      {isMyTurn && !isOver && (
        <div style={{ textAlign: "center", fontSize: 11, color: t.textMuted, marginBottom: 8 }}>
          在母球上往后拖再松手 · 拖得越远力越大
          {preview && <span style={{ marginLeft: 6, color: t.accent }}>力度 {Math.round(preview.power * 100)}%</span>}
        </div>
      )}

      {isOver && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{game.result === "lee_wins" ? "🎉" : "🎱"}</div>
          <div style={{ fontSize: 13, color: t.text, marginBottom: 16 }}>{game.message}</div>
          <button onClick={newGame} style={{
            padding: "10px 28px", borderRadius: 12,
            border: `1.5px solid ${t.accentBorder}`, background: t.accentSoft,
            color: t.accent, fontSize: 13, cursor: "pointer",
          }}>再来</button>
        </div>
      )}
    </div>
  );
}

// client-side group helper (mirrors server ballGroup, for the UI counters only)
function ballGroupClient(num) {
  if (num === 0) return "cue";
  if (num === 8) return "eight";
  return num <= 7 ? "solids" : "stripes";
}

function Tabs({ t, tab, setTab, loadHistory }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${t.surfaceBorder}` }}>
      {["game", "history"].map(k => (
        <button key={k} onClick={() => { setTab(k); if (k === "history") loadHistory(); }}
          style={{
            flex: 1, padding: "12px 0", background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: tab === k ? t.accent : t.textMuted,
            borderBottom: tab === k ? `2px solid ${t.accent}` : "2px solid transparent",
            fontFamily: "'Noto Serif SC',serif",
          }}>
          {k === "game" ? "开局" : "对局记录"}
        </button>
      ))}
    </div>
  );
}

function HistoryList({ t, history }) {
  return (
    <div style={{ padding: "16px 16px 32px" }}>
      {history.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 12, color: t.textMuted, padding: "32px 0" }}>还没有对局记录</div>
      ) : history.map((h, i) => {
        const winner = h.result === "lee_wins" ? "黎" : "克";
        const loser = h.result === "lee_wins" ? "克" : "黎";
        const d = new Date(h.ts);
        const timeStr = `${(d.getMonth() + 1)}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 0", borderBottom: `1px solid ${t.surfaceBorder}`, fontSize: 13,
          }}>
            <span style={{ color: t.text }}>
              <span style={{ color: t.accent }}>{winner}</span>
              <span style={{ color: t.textMuted, fontSize: 11, margin: "0 4px" }}>赢</span>
              <span style={{ color: t.textMuted }}>{loser} 🎱</span>
            </span>
            <span style={{ fontSize: 11, color: t.textMuted }}>{timeStr}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── cute vector ball drawing ──
function drawBall(ctx, x, y, r, num) {
  ctx.save();
  // shadow
  ctx.beginPath(); ctx.ellipse(x + 1.5, y + 2, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fill();

  if (num === 0) {
    // cue ball: white with a little pink dot
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#fdfdf8"; ctx.fill();
    ctx.strokeStyle = "#d8d4c4"; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.3, r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = "#F4A6B0"; ctx.fill();
  } else {
    const col = BALL_COLORS[num] || "#888";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (isStripe(num)) {
      // white ball with colored stripe band
      ctx.fillStyle = "#fdfdf8"; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = col;
      ctx.fillRect(x - r, y - r * 0.5, r * 2, r); // horizontal stripe band
      ctx.restore();
    } else {
      ctx.fillStyle = col; ctx.fill();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 1; ctx.stroke();
    // number on white circle
    ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.fillStyle = "#222"; ctx.font = `bold ${Math.max(7, r * 0.5)}px 'Noto Serif SC',serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(num), x, y + 0.5);
  }
  // glossy highlight
  ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.36, r * 0.28, r * 0.18, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
