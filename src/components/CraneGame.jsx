import { useState, useEffect, useRef, useCallback } from "react";

// ── 娃娃种类 ──────────────────────────────────────────────
const TOYS = [
  { id:"bear",  emoji:"🧸", name:"小熊" },
  { id:"bunny", emoji:"🐰", name:"小兔" },
  { id:"cat",   emoji:"🐱", name:"小猫" },
  { id:"dog",   emoji:"🐶", name:"小狗" },
  { id:"duck",  emoji:"🐥", name:"小鸭" },
  { id:"pig",   emoji:"🐷", name:"小猪" },
  { id:"panda", emoji:"🐼", name:"熊猫" },
  { id:"frog",  emoji:"🐸", name:"小蛙" },
];

// 摆放位置（像真机器里随意堆着）
const TOY_POS = [
  { x:40,  y:150 }, { x:92,  y:145 }, { x:144, y:152 }, { x:196, y:146 }, { x:242, y:150 },
  { x:66,  y:180 }, { x:118, y:177 }, { x:168, y:183 }, { x:218, y:179 },
];

const CW = 280; const CH = 210; // canvas size
const CLAW_Y0 = 26;             // resting height
const DROP_Y  = 162;            // drop depth
const BOUNCE_SPEED = 88;        // px/s horizontal
const DROP_SPEED   = 180;       // px/s descent
const RISE_SPEED   = 200;       // px/s ascent

// ── sessionStorage 暂存 ───────────────────────────────────
const PENDING_KEY = "crane_pending";
export function getPendingToys() {
  try { return JSON.parse(sessionStorage.getItem(PENDING_KEY)) || []; } catch { return []; }
}
export function clearPendingToys() { sessionStorage.removeItem(PENDING_KEY); }
function savePendingToys(list) { sessionStorage.setItem(PENDING_KEY, JSON.stringify(list)); }
function addPendingToy(toy, playerId) {
  const list = getPendingToys();
  list.push({ ...toy, playerId: (playerId || "游客").slice(0, 8), wonAt: Date.now() });
  savePendingToys(list);
}

// ── 胜负判断 ──────────────────────────────────────────────
function rollWin(dropX) {
  const near = TOY_POS.some(p => Math.abs(p.x - dropX) < 26);
  return Math.random() < (near ? 0.42 : 0.14);
}

// ── 爪子绘制 ──────────────────────────────────────────────
function drawClaw(ctx, x, y, open) {
  // 钢丝
  ctx.strokeStyle = "rgba(200,160,60,0.55)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 8); ctx.stroke();
  // 爪头小球
  ctx.fillStyle = "#C8A040";
  ctx.beginPath(); ctx.arc(x, y - 6, 4.5, 0, Math.PI * 2); ctx.fill();
  // 三根爪
  const spread = open * 18;
  const offsets = [-spread, 0, spread];
  ctx.strokeStyle = "#C8A040";
  ctx.lineWidth = 2;
  offsets.forEach(ox => {
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x + ox, y + 16);
    ctx.stroke();
    // 爪尖小弯
    ctx.beginPath();
    ctx.arc(x + ox, y + 16, 3, 0, Math.PI, ox >= 0);
    ctx.stroke();
  });
}

// ── 主组件 ────────────────────────────────────────────────
export default function CraneGame({ theme: t }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const lastTRef  = useRef(null);

  // 可变游戏状态（不触发 re-render）
  const g = useRef({
    phase: "idle",   // idle | running | dropping | grabbing | rising | done
    x: CW / 2, y: CLAW_Y0, vx: BOUNCE_SPEED,
    open: 0,
    grabT: 0,
    won: false,
    wonToy: null,
    toyArrange: TOY_POS.map((_, i) => TOYS[i % TOYS.length]),
  });

  const [phase, setPhaseUI] = useState("idle");
  // balance derived below from wallet selection
  const [playerId, setPlayerId] = useState("");
  const [pending, setPending] = useState(() => getPendingToys());
  const [wonToyUI, setWonToyUI] = useState(null);

  function setPhase(p) { g.current.phase = p; setPhaseUI(p); }

  // 获取余额
  const [isLee,      setIsLee]      = useState(false);
  const [pubBal,     setPubBal]     = useState(null);
  const [privBal,    setPrivBal]    = useState(null);
  const [wallet,     setWallet]     = useState("public"); // "public" | "private"

  const fetchBalance = useCallback(async () => {
    try {
      const [authRes, pubRes] = await Promise.all([
        fetch("/api/auth/check").then(r => r.json()),
        fetch("/api/coins").then(r => r.json()),
      ]);
      setPubBal(pubRes.balance ?? 0);
      if (authRes.ok) {
        setIsLee(true);
        const sal = await fetch("/api/salary").then(r => r.json());
        setPrivBal(sal.lee?.balance ?? 0);
      } else {
        setIsLee(false);
        setPrivBal(null);
      }
    } catch { setPubBal(0); }
  }, []);

  const balance = wallet === "private" ? privBal : pubBal;
  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  // RAF 主循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function loop(ts) {
      const dt = lastTRef.current ? Math.min((ts - lastTRef.current) / 1000, 0.05) : 0;
      lastTRef.current = ts;
      const s = g.current;

      // 更新状态
      if (s.phase === "running") {
        s.x += s.vx * dt;
        if (s.x > CW - 28) { s.x = CW - 28; s.vx = -Math.abs(s.vx); }
        if (s.x < 28)       { s.x = 28;      s.vx =  Math.abs(s.vx); }
      }
      if (s.phase === "dropping") {
        s.y += DROP_SPEED * dt;
        if (s.y >= DROP_Y) { s.y = DROP_Y; s.phase = "grabbing"; s.grabT = 0; }
      }
      if (s.phase === "grabbing") {
        s.grabT += dt;
        const p = s.grabT / 0.42;
        if (p < 0.5)     s.open = p * 2;
        else if (p < 1)  s.open = 1 - (p - 0.5) * 2;
        else {
          s.open = 0;
          s.won = rollWin(s.x);
          s.wonToy = s.won ? TOYS[Math.floor(Math.random() * TOYS.length)] : null;
          s.phase = "rising";
          if (s.won) {
            setWonToyUI(s.wonToy);
            addPendingToy(s.wonToy, s.playerId);
            setPending(getPendingToys());
          }
        }
      }
      if (s.phase === "rising") {
        s.y -= RISE_SPEED * dt;
        if (s.y <= CLAW_Y0) {
          s.y = CLAW_Y0;
          s.phase = "done";
          setPhase("done");
          setTimeout(() => { s.phase = "idle"; s.wonToy = null; setPhase("idle"); setWonToyUI(null); }, 2200);
        }
      }

      // 绘制
      ctx.clearRect(0, 0, CW, CH);
      // 机器内部底色
      ctx.fillStyle = "#110C05";
      ctx.fillRect(0, 0, CW, CH);
      // 顶部暖光晕
      const grd = ctx.createRadialGradient(s.x, 0, 0, s.x, 20, 110);
      grd.addColorStop(0, "rgba(255,190,60,0.10)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, CW, CH);
      // 地板线
      ctx.strokeStyle = "rgba(180,140,60,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, CH - 26); ctx.lineTo(CW, CH - 26); ctx.stroke();

      // 娃娃
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.82;
      s.toyArrange.forEach((toy, i) => {
        ctx.fillText(toy.emoji, TOY_POS[i].x, TOY_POS[i].y);
      });
      ctx.globalAlpha = 1;

      // 爪子
      drawClaw(ctx, s.x, s.y, s.open);

      // 上升中夹着的娃娃
      if (s.won && (s.phase === "rising" || s.phase === "done") && s.wonToy) {
        ctx.font = "18px serif";
        ctx.fillText(s.wonToy.emoji, s.x, s.y + 22);
      }

      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); lastTRef.current = null; };
  }, []);

  // 投币
  async function insertCoin() {
    if (balance === null || balance < 5) return;
    const usePrivate = isLee && wallet === "private";
    const [url, body] = usePrivate
      ? ["/api/salary/spend-lee", { amount: 5, reason: "黎私密币投入 娃娃机" }]
      : ["/api/coins/spend",      { amount: 5, who: playerId || "游客", reason: "娃娃机" }];
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).catch(() => ({ ok: false }));
    if (!res.ok) return;
    g.current.playerId = playerId;
    g.current.x = CW / 2;
    g.current.vx = BOUNCE_SPEED * (Math.random() > 0.5 ? 1 : -1);
    setPhase("running");
    fetchBalance();
  }

  // 抓取
  function drop() {
    if (g.current.phase !== "running") return;
    g.current.phase = "dropping";
    g.current.vx = 0;
    setPhaseUI("dropping");
  }

  const isIdle    = phase === "idle";
  const isRunning = phase === "running";
  const canAfford = balance !== null && balance >= 5;

  // 结果文字
  let resultMsg = "";
  if (phase === "done") {
    resultMsg = wonToyUI
      ? `夹到啦！${wonToyUI.emoji} ${wonToyUI.name}`
      : "没夹到呢 🥺";
  }

  return (
    <div style={{ fontFamily:"'Noto Serif SC',serif", userSelect:"none", maxWidth:320, margin:"0 auto" }}>

      {/* 玩家 ID */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <input
          value={playerId}
          onChange={e => setPlayerId(e.target.value.slice(0,8))}
          placeholder="留个名字（可不填）"
          maxLength={8}
          style={{
            flex:1, padding:"6px 12px", borderRadius:8,
            border:`1px solid ${t.surfaceBorder}`,
            background:"rgba(20,14,6,0.6)", color:t.text,
            fontSize:12, outline:"none", fontFamily:"inherit",
          }}
        />
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
          {isLee ? (
            <>
              <div style={{ display:"flex", gap:4 }}>
                {["public","private"].map(w => (
                  <button key={w} onClick={() => setWallet(w)} style={{
                    padding:"2px 8px", borderRadius:5, fontSize:10, cursor:"pointer",
                    border: wallet === w ? "1px solid rgba(200,160,60,0.7)" : `1px solid ${t.surfaceBorder}`,
                    background: wallet === w ? "rgba(200,160,60,0.12)" : "transparent",
                    color: wallet === w ? "#C8A040" : t.textMuted, fontFamily:"inherit",
                  }}>{w === "public" ? "公共" : "私密"}</button>
                ))}
              </div>
              <span style={{ fontSize:10, color:t.textMuted }}>
                🪙 {wallet === "public" ? (pubBal ?? "…") : (privBal ?? "…")}
              </span>
            </>
          ) : (
            <span style={{ fontSize:11, color:t.textMuted, whiteSpace:"nowrap" }}>🪙 {pubBal ?? "…"}</span>
          )}
          <button onClick={fetchBalance} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:t.textMuted, padding:"0 2px", lineHeight:1 }} title="刷新余额">↻</button>
        </div>
      </div>

      {/* 机器外壳 */}
      <div style={{
        background:"#2A1E0F",
        borderRadius:16,
        overflow:"hidden",
        boxShadow:"0 6px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(200,160,60,0.2)",
      }}>
        {/* 顶部铭牌 */}
        <div style={{
          padding:"7px 16px",
          background:"rgba(200,160,60,0.10)",
          borderBottom:"1px solid rgba(200,160,60,0.2)",
          textAlign:"center",
          fontSize:11, color:"rgba(200,160,60,0.8)", letterSpacing:"0.15em",
        }}>
          ✦ 夹娃娃机 ✦
        </div>

        {/* 玻璃窗（canvas）*/}
        <div style={{
          margin:"10px 10px 0",
          borderRadius:8,
          border:"1.5px solid rgba(200,160,60,0.35)",
          overflow:"hidden",
          position:"relative",
          background:"#110C05",
          boxShadow:"inset 0 0 20px rgba(0,0,0,0.5)",
        }}>
          <canvas
            ref={canvasRef}
            width={CW} height={CH}
            style={{ display:"block", width:"100%", height:"auto" }}
          />
          {/* 结果浮层 */}
          {phase === "done" && (
            <div style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(10,7,3,0.55)",
              backdropFilter:"blur(2px)",
            }}>
              <div style={{
                textAlign:"center",
                padding:"14px 22px",
                borderRadius:14,
                background:"rgba(20,14,6,0.92)",
                border:`1px solid ${wonToyUI ? "rgba(200,160,60,0.6)" : "rgba(120,90,50,0.35)"}`,
              }}>
                <div style={{ fontSize:wonToyUI ? 32 : 22, marginBottom:4 }}>
                  {wonToyUI ? wonToyUI.emoji : "🤲"}
                </div>
                <div style={{ fontSize:13, color: wonToyUI ? "#C8A040" : "rgba(160,130,70,0.7)", fontWeight:600 }}>
                  {resultMsg}
                </div>
                {wonToyUI && (
                  <div style={{ fontSize:10, color:"rgba(160,130,60,0.6)", marginTop:5, lineHeight:1.6 }}>
                    去客厅找糯糯送给她 →
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 操控区 */}
        <div style={{
          padding:"12px 14px 14px",
          background:"rgba(0,0,0,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
        }}>
          {isIdle && (
            <button
              onClick={insertCoin}
              disabled={!canAfford}
              style={{
                padding:"10px 28px", borderRadius:10, fontSize:13, cursor: canAfford ? "pointer" : "not-allowed",
                border:`1.5px solid ${canAfford ? "rgba(200,160,60,0.7)" : "rgba(100,80,40,0.3)"}`,
                background: canAfford ? "rgba(200,160,60,0.12)" : "rgba(60,40,20,0.3)",
                color: canAfford ? "#C8A040" : "rgba(120,90,50,0.4)",
                fontFamily:"inherit", fontWeight:600, letterSpacing:"0.05em",
              }}
            >
              🪙 投币 · 5币/次
            </button>
          )}
          {isRunning && (
            <button
              onClick={drop}
              style={{
                padding:"10px 32px", borderRadius:10, fontSize:14,
                border:"1.5px solid rgba(180,220,120,0.6)",
                background:"rgba(140,200,80,0.15)",
                color:"rgba(180,230,120,0.9)",
                fontFamily:"inherit", fontWeight:700, cursor:"pointer",
                animation:"pulse 0.8s ease-in-out infinite",
              }}
            >
              ⬇ 抓取
            </button>
          )}
          {(phase === "dropping" || phase === "grabbing" || phase === "rising") && (
            <div style={{ fontSize:11, color:"rgba(200,160,60,0.5)", padding:"10px 0" }}>
              {phase === "dropping" ? "下降中…" : phase === "grabbing" ? "夹取中…" : "上升中…"}
            </div>
          )}
        </div>

        {/* 投币口装饰 */}
        <div style={{
          padding:"4px 0 8px",
          textAlign:"center",
          fontSize:10, color:"rgba(160,120,50,0.35)", letterSpacing:"0.1em",
        }}>
          ▭  COIN  ▭
        </div>
      </div>

      {/* 暂存区 */}
      {pending.length > 0 && (
        <div style={{
          marginTop:14,
          padding:"12px 14px",
          background:"rgba(200,160,60,0.06)",
          border:"1px solid rgba(200,160,60,0.2)",
          borderRadius:12,
        }}>
          <div style={{ fontSize:11, color:"rgba(200,160,60,0.7)", marginBottom:8, fontWeight:600 }}>
            🎁 暂存区（离开小屋后清空）
          </div>
          {pending.map((toy, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 0", fontSize:12, color:t.textSub }}>
              <span style={{ fontSize:18 }}>{toy.emoji}</span>
              <span>{toy.name}</span>
              <span style={{ fontSize:10, color:t.textMuted, marginLeft:"auto" }}>
                {toy.playerId}
              </span>
            </div>
          ))}
          <div style={{ marginTop:8, fontSize:10, color:"rgba(160,130,60,0.55)", lineHeight:1.7 }}>
            去客厅找糯糯，点她就能送出去 🐾
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(160,220,80,0); }
          50%      { box-shadow: 0 0 0 6px rgba(160,220,80,0.2); }
        }
      `}</style>
    </div>
  );
}
