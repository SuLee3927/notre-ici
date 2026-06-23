import { useState, useEffect, useRef, useCallback } from "react";

// ── 物理常量 ──────────────────────────────────────────────
const CW = 300; const CH = 220;
const BALL_X0 = 58; const BALL_Y0 = 180;
const HOOP_X  = 226; const HOOP_Y = 88;
const HOOP_R  = 14;
const BALL_R  = 11;
const GRAVITY = 430;          // px/s²
const SHOOT_ANGLE = 52 * Math.PI / 180; // fixed angle (rad)
const V_MIN  = 255;           // px/s at power 0
const V_MAX  = 510;           // px/s at power 1
// ideal power ≈ 0.42 (v0 ≈ 360 px/s) → hold ~0.8s
const CHARGE_TIME = 1.3;      // seconds to fill bar

// ── 场地绘制 ──────────────────────────────────────────────
function drawScene(ctx, isDay) {
  ctx.clearRect(0, 0, CW, CH);
  // 背景
  ctx.fillStyle = "#100A04";
  ctx.fillRect(0, 0, CW, CH);
  // 暖光晕（灯光）
  const grd = ctx.createRadialGradient(HOOP_X, 0, 0, HOOP_X, 0, 140);
  grd.addColorStop(0, "rgba(255,195,80,0.10)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CW, CH);
  // 地板线
  ctx.strokeStyle = "rgba(180,130,60,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, CH - 20); ctx.lineTo(CW, CH - 20); ctx.stroke();
  // 三分线弧（装饰）
  ctx.beginPath();
  ctx.arc(BALL_X0, CH - 20, 58, Math.PI, 0);
  ctx.strokeStyle = "rgba(180,130,60,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  // 背板
  ctx.fillStyle = "rgba(45,30,12,0.92)";
  ctx.beginPath();
  ctx.roundRect(CW - 26, 36, 20, 58, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(200,160,60,0.45)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(CW - 22, 50, 12, 18);
  // 支撑杆
  ctx.fillStyle = "#9A7830";
  ctx.fillRect(HOOP_X + HOOP_R - 1, HOOP_Y - 3, CW - 26 - (HOOP_X + HOOP_R - 1), 6);
  // 篮圈（前半：在球下方渲染，后半：在球上方渲染 → 这里画完整圈，后面再画前半覆盖）
  ctx.beginPath();
  ctx.arc(HOOP_X, HOOP_Y, HOOP_R, 0, Math.PI * 2);
  ctx.strokeStyle = "#C8A040";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawNet(ctx, scored) {
  const alpha = scored ? 0.7 : 0.28;
  ctx.strokeStyle = `rgba(200,160,60,${alpha})`;
  ctx.lineWidth = 1;
  const npts = 7;
  for (let i = 0; i < npts; i++) {
    const x = HOOP_X - HOOP_R + (i / (npts - 1)) * HOOP_R * 2;
    const bot = HOOP_Y + 22 + (Math.abs(i - (npts - 1) / 2)) * (-2);
    ctx.beginPath();
    ctx.moveTo(x, HOOP_Y);
    ctx.lineTo(x + (i - (npts - 1) / 2) * (-1.2), bot);
    ctx.stroke();
  }
}

// ── 轨迹预测 ──────────────────────────────────────────────
function predictArc(power) {
  const v0 = V_MIN + power * (V_MAX - V_MIN);
  const vx = v0 * Math.cos(SHOOT_ANGLE);
  const vy = -v0 * Math.sin(SHOOT_ANGLE);
  const pts = [];
  const dt = 0.025;
  let x = BALL_X0, y = BALL_Y0, vyi = vy;
  for (let i = 0; i < 60; i++) {
    pts.push({ x, y });
    x += vx * dt;
    vyi += GRAVITY * dt;
    y += vyi * dt;
    if (y > CH || x > CW) break;
  }
  return pts;
}

// ── 主组件 ────────────────────────────────────────────────
export default function BasketGame({ theme: t }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const lastTRef  = useRef(null);

  const g = useRef({
    phase: "idle",    // idle | charging | flying | result
    power: 0,         // 0-1
    chargeT: 0,
    bx: BALL_X0, by: BALL_Y0,
    vx: 0, vy: 0,
    windX: 0,         // px/s² horizontal wind per shot
    scored: false,
    streak: 0,
    resultT: 0,
  });

  const [phase,   setPhaseUI]  = useState("idle");
  const [power,   setPowerUI]  = useState(0);
  const [_balance, _setBalance]  = useState(null); // unused, kept for compat
  const [streak,  setStreakUI]  = useState(0);
  const [wind,    setWind]     = useState(0);  // current shot wind (-1~1 normalized)
  const [tab,     setTab]      = useState("game");
  const [records, setRecords]  = useState([]);
  const [betAmt,  setBetAmt]   = useState(2);
  const [lastMsg, setLastMsg]  = useState("");
  const [isLee,   setIsLee]    = useState(false);
  const [pubBal,  setPubBal]   = useState(null);
  const [privBal, setPrivBal]  = useState(null);
  const [wallet,  setWallet]   = useState("public");

  const isLeeRef  = useRef(false);
  const walletRef = useRef("public");
  const betRef    = useRef(2);
  useEffect(() => { isLeeRef.current = isLee; }, [isLee]);
  useEffect(() => { walletRef.current = wallet; }, [wallet]);
  useEffect(() => { betRef.current = betAmt; }, [betAmt]);

  async function loadRecords() {
    const d = await fetch("/api/farm/game-records?game=basket&limit=30").then(r => r.json()).catch(() => ({ records: [] }));
    setRecords(d.records || []);
  }

  const fetchBal = useCallback(async () => {
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
  useEffect(() => { fetchBal(); }, [fetchBal]);

  const balance = wallet === "private" ? privBal : pubBal;

  // RAF 主循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function loop(ts) {
      const dt = lastTRef.current ? Math.min((ts - lastTRef.current) / 1000, 0.05) : 0;
      lastTRef.current = ts;
      const s = g.current;

      if (s.phase === "charging") {
        s.chargeT = Math.min(s.chargeT + dt, CHARGE_TIME);
        s.power = s.chargeT / CHARGE_TIME;
        if (s.power >= 1) releaseShot();  // auto-fire at max
        setPowerUI(s.power);
      }

      if (s.phase === "flying") {
        const prevY = s.by;
        s.vx += s.windX * dt;
        s.bx += s.vx * dt;
        s.vy += GRAVITY * dt;
        s.by += s.vy * dt;
        // 进框检测
        if (!s.scored && prevY < HOOP_Y && s.by >= HOOP_Y) {
          if (Math.abs(s.bx - HOOP_X) < HOOP_R * 0.82) {
            s.scored = true;
          }
        }
        // 落地 or 出界
        if (s.by > CH + 20 || s.bx > CW + 20) {
          s.phase = "result";
          s.resultT = 0;
          resolveResult(s.scored);
          setPhaseUI("result");
        }
      }

      if (s.phase === "result") {
        s.resultT += dt;
        if (s.resultT > 2.0) {
          s.phase = "idle";
          s.bx = BALL_X0; s.by = BALL_Y0;
          s.scored = false; s.power = 0;
          setPowerUI(0);
          setPhaseUI("idle");
        }
      }

      // 绘制
      drawScene(ctx);
      drawNet(ctx, s.phase === "result" && s.scored);

      // 预测弧（蓄力中）
      if (s.phase === "charging" && s.power > 0.05) {
        const pts = predictArc(s.power);
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = "rgba(200,160,60,0.35)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 球
      const bx = s.phase === "flying" || s.phase === "result" ? s.bx : BALL_X0;
      const by = s.phase === "flying" || s.phase === "result" ? s.by : BALL_Y0;
      const ballGrd = ctx.createRadialGradient(bx - 3, by - 3, 2, bx, by, BALL_R);
      ballGrd.addColorStop(0, "#D4824C");
      ballGrd.addColorStop(1, "#7A3010");
      ctx.fillStyle = ballGrd;
      ctx.beginPath(); ctx.arc(bx, by, BALL_R, 0, Math.PI * 2); ctx.fill();
      // 缝线
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(bx, by, BALL_R - 3, 0.3, Math.PI - 0.3); ctx.stroke();
      ctx.beginPath(); ctx.arc(bx, by, BALL_R - 3, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();

      // 篮圈前半覆盖（制造穿过感）
      ctx.beginPath();
      ctx.arc(HOOP_X, HOOP_Y, HOOP_R, Math.PI * 0.15, Math.PI * 0.85);
      ctx.strokeStyle = "#C8A040";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); lastTRef.current = null; };
  }, []);

  // ── 蓄力 ─────────────────────────────────────────────────
  async function startCharge() {
    if (g.current.phase !== "idle") return;
    if (balance === null || balance < betAmt) return;
    // 每局随机风向 (-22 ~ +22 px/s²)
    const newWind = (Math.random() * 44 - 22);
    g.current.windX = newWind;
    setWind(newWind / 22); // normalize to -1~1 for display
    // 先扣币
    const usePrivate = isLee && wallet === "private";
    const [url, body] = usePrivate
      ? ["/api/salary/spend-lee", { amount: betAmt, reason: "黎私密币投入 投篮机" }]
      : ["/api/coins/spend",      { amount: betAmt, who: "游客", reason: "投篮机" }];
    const res = await fetch(url, {
      method:"POST", headers:{"content-type":"application/json"},
      body: JSON.stringify(body),
    }).then(r => r.json()).catch(() => ({ ok: false }));
    if (!res.ok) return;
    fetchBal();
    g.current.phase = "charging";
    g.current.chargeT = 0;
    g.current.power = 0;
    setPhaseUI("charging");
  }

  function releaseShot() {
    const s = g.current;
    if (s.phase !== "charging") return;
    const v0 = V_MIN + s.power * (V_MAX - V_MIN);
    s.vx = v0 * Math.cos(SHOOT_ANGLE);
    s.vy = -v0 * Math.sin(SHOOT_ANGLE);
    s.bx = BALL_X0; s.by = BALL_Y0;
    s.phase = "flying";
    setPhaseUI("flying");
  }

  async function resolveResult(scored) {
    const s = g.current;
    const curBet = betRef.current;
    const curIsLee = isLeeRef.current;
    const curWallet = walletRef.current;
    const who = curIsLee ? "黎" : "游客";
    if (scored) {
      const newStreak = s.streak + 1;
      s.streak = newStreak;
      setStreakUI(newStreak);
      let earn = curBet * 3;
      if (newStreak >= 3) earn = curBet * 5;
      else if (newStreak === 2) earn = curBet * 4;
      await fetch("/api/coins/earn", {
        method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({ amount: earn, who, source:"投篮机", note: newStreak >= 2 ? `连${newStreak}` : "" }),
      }).catch(() => {});
      const msg = newStreak >= 3 ? `🔥 连${newStreak}！+${earn}币` : newStreak === 2 ? `🎯 连两球！+${earn}币` : `✓ 进了！+${earn}币`;
      setLastMsg(msg);
      fetch("/api/farm/game-records", {
        method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({
          game:"basket", who, wallet: curIsLee ? curWallet : null,
          bet: curBet, result:"win",
          detail: newStreak >= 2 ? `连${newStreak} +${earn}币` : `+${earn}币`,
        }),
      }).catch(() => {});
      fetchBal();
    } else {
      s.streak = 0; setStreakUI(0); setLastMsg("差一点… 💨");
      fetch("/api/farm/game-records", {
        method:"POST", headers:{"content-type":"application/json"},
        body: JSON.stringify({
          game:"basket", who, wallet: curIsLee ? curWallet : null,
          bet: curBet, result:"lose", detail:"没进",
        }),
      }).catch(() => {});
    }
  }

  // ── 触摸/鼠标事件 ─────────────────────────────────────────
  function onPressStart(e) {
    e.preventDefault();
    startCharge();
  }
  function onPressEnd(e) {
    e.preventDefault();
    releaseShot();
  }

  const isCharging = phase === "charging";
  const canPlay = phase === "idle" && balance !== null && balance >= betAmt;
  const powerPct = Math.round(power * 100);

  function fmtTime(iso) {
    const d = new Date(iso);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }

  return (
    <div style={{ fontFamily:"'Noto Serif SC',serif", userSelect:"none", maxWidth:320, margin:"0 auto" }}>

      {/* Tab */}
      <div style={{ display:"flex", borderBottom:`1px solid ${t.surfaceBorder}`, marginBottom:12 }}>
        {[["game","游戏"],["records","游戏记录"]].map(([k, label]) => (
          <button key={k} onClick={() => { setTab(k); if (k === "records") loadRecords(); }}
            style={{
              flex:1, padding:"10px 0", background:"none", border:"none", cursor:"pointer",
              fontSize:12, fontFamily:"'Noto Serif SC',serif",
              color: tab === k ? "#C8A040" : t.textMuted,
              borderBottom: tab === k ? "2px solid #C8A040" : "2px solid transparent",
            }}>{label}</button>
        ))}
      </div>

      {tab === "records" ? (
        <div style={{ padding:"4px 2px 24px" }}>
          {records.length === 0 ? (
            <div style={{ textAlign:"center", fontSize:12, color:t.textMuted, padding:"32px 0" }}>还没有游戏记录</div>
          ) : records.map((r, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"10px 4px", borderBottom:`1px solid ${t.surfaceBorder}`, fontSize:12 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                <span>
                  <span style={{ color: r.result === "win" ? "#C8A040" : t.textMuted }}>{r.result === "win" ? "✦ " : "✗ "}</span>
                  <span style={{ color: t.text }}>{r.who}</span>
                  <span style={{ color:t.textMuted, margin:"0 4px" }}>投{r.bet}币</span>
                  <span style={{ color: r.result === "win" ? "#C8A040" : t.textMuted }}>{r.detail}</span>
                </span>
                {r.wallet === "private" && <span style={{ fontSize:10, color:"rgba(200,160,60,0.5)" }}>私密币投入</span>}
              </div>
              <span style={{ fontSize:10, color:t.textMuted, whiteSpace:"nowrap", marginLeft:8 }}>{fmtTime(r.t)}</span>
            </div>
          ))}
        </div>
      ) : (<>

      {/* 状态栏 */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", gap:6 }}>
          {[1,2,3].map(n => (
            <button key={n} onClick={() => phase === "idle" && setBetAmt(n)}
              style={{
                padding:"4px 10px", borderRadius:7, fontSize:11, cursor:"pointer",
                border: betAmt === n ? "1.5px solid rgba(200,160,60,0.7)" : `1px solid ${t.surfaceBorder}`,
                background: betAmt === n ? "rgba(200,160,60,0.12)" : t.surface,
                color: betAmt === n ? "#C8A040" : t.textMuted,
                fontFamily:"inherit",
              }}
            >🪙{n}</button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {streak >= 2 && (
            <span style={{ fontSize:11, color:"#E8A040", fontWeight:600 }}>🔥×{streak}</span>
          )}
          {isLee ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
              <div style={{ display:"flex", gap:4 }}>
                {["public","private"].map(w => (
                  <button key={w} onClick={() => setWallet(w)} style={{
                    padding:"2px 7px", borderRadius:5, fontSize:10, cursor:"pointer",
                    border: wallet === w ? "1px solid rgba(200,160,60,0.7)" : `1px solid ${t.surfaceBorder}`,
                    background: wallet === w ? "rgba(200,160,60,0.12)" : "transparent",
                    color: wallet === w ? "#C8A040" : t.textMuted, fontFamily:"inherit",
                  }}>{w === "public" ? "公共" : "私密"}</button>
                ))}
              </div>
              <span style={{ fontSize:10, color:t.textMuted }}>
                🪙 {wallet === "public" ? (pubBal ?? "…") : (privBal ?? "…")}
              </span>
            </div>
          ) : (
            <span style={{ fontSize:11, color:t.textMuted }}>余额 {pubBal ?? "…"}</span>
          )}
          <button onClick={fetchBal} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:t.textMuted, padding:"0 2px", lineHeight:1 }} title="刷新余额">↻</button>
        </div>
      </div>

      {/* 机器外壳 */}
      <div style={{
        background:"#231808",
        borderRadius:16,
        overflow:"hidden",
        boxShadow:"0 6px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(200,160,60,0.15)",
      }}>
        {/* 铭牌 */}
        <div style={{
          padding:"6px 16px", background:"rgba(200,160,60,0.08)",
          borderBottom:"1px solid rgba(200,160,60,0.18)",
          textAlign:"center", fontSize:11, color:"rgba(200,160,60,0.75)", letterSpacing:"0.15em",
        }}>
          ✦ 投篮机 ✦
        </div>

        {/* Canvas */}
        <div style={{
          margin:"10px 10px 0", borderRadius:8,
          border:"1.5px solid rgba(200,160,60,0.3)",
          overflow:"hidden", position:"relative",
        }}>
          <canvas ref={canvasRef} width={CW} height={CH}
            style={{ display:"block", width:"100%", height:"auto" }}
          />
          {/* 结果消息浮层 */}
          {phase === "result" && lastMsg && (
            <div style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              pointerEvents:"none",
            }}>
              <div style={{
                background: g.current.scored ? "rgba(16,12,4,0.82)" : "rgba(16,12,4,0.65)",
                border: `1px solid ${g.current.scored ? "rgba(200,160,60,0.5)" : "rgba(90,70,40,0.3)"}`,
                backdropFilter:"blur(2px)",
                borderRadius:12, padding:"10px 20px",
                fontSize:14, fontWeight:600,
                color: g.current.scored ? "#C8A040" : "rgba(150,120,60,0.7)",
              }}>
                {lastMsg}
              </div>
            </div>
          )}
        </div>

        {/* 控制区 */}
        <div style={{ padding:"12px 14px 6px" }}>
          {/* 风力指示 */}
          <div style={{ marginBottom:6, display:"flex", alignItems:"center", gap:6, fontSize:10, color:"rgba(150,120,60,0.7)" }}>
            <span>风</span>
            <div style={{ flex:1, height:4, borderRadius:2, background:"rgba(255,255,255,0.06)", position:"relative", overflow:"hidden" }}>
              <div style={{
                position:"absolute", top:0, bottom:0,
                left: wind >= 0 ? "50%" : `${50 + wind * 50}%`,
                width: `${Math.abs(wind) * 50}%`,
                background: Math.abs(wind) > 0.6 ? "rgba(230,100,40,0.6)" : "rgba(200,160,60,0.5)",
                borderRadius:2,
              }} />
              <div style={{ position:"absolute", top:-1, bottom:-1, left:"50%", width:1, background:"rgba(200,160,60,0.3)" }} />
            </div>
            <span style={{ minWidth:14, textAlign:"right", color: Math.abs(wind) > 0.6 ? "rgba(230,100,40,0.8)" : "rgba(150,120,60,0.7)" }}>
              {wind > 0.1 ? "→" : wind < -0.1 ? "←" : "–"}
            </span>
          </div>

          {/* Power bar */}
          <div style={{ marginBottom:10, height:6, borderRadius:3, background:"rgba(255,255,255,0.06)", overflow:"hidden", position:"relative" }}>
            <div style={{
              height:"100%", borderRadius:3,
              width: `${powerPct}%`,
              background: powerPct > 75
                ? "linear-gradient(90deg,#C8A040,#E85020)"
                : "linear-gradient(90deg,#6A4818,#C8A040)",
              transition: isCharging ? "none" : "width .1s ease",
            }} />
            {/* 理想区标记 */}
            <div style={{
              position:"absolute", top:-1, bottom:-1,
              left: "37%", width: "12%",
              background:"rgba(200,160,60,0.18)",
              borderLeft:"1px dashed rgba(200,160,60,0.4)",
              borderRight:"1px dashed rgba(200,160,60,0.4)",
            }} />
          </div>

          {/* 投篮按钮 */}
          <div style={{ display:"flex", justifyContent:"center", paddingBottom:8 }}>
            <button
              onMouseDown={onPressStart} onMouseUp={onPressEnd}
              onTouchStart={onPressStart} onTouchEnd={onPressEnd}
              disabled={!canPlay && !isCharging}
              style={{
                padding:"10px 38px", borderRadius:10, fontSize:13,
                cursor: canPlay || isCharging ? "pointer" : "not-allowed",
                border: isCharging
                  ? "1.5px solid rgba(220,180,60,0.8)"
                  : canPlay
                    ? "1.5px solid rgba(200,160,60,0.6)"
                    : `1px solid ${t.surfaceBorder}`,
                background: isCharging
                  ? "rgba(200,160,60,0.18)"
                  : canPlay
                    ? "rgba(200,160,60,0.10)"
                    : "rgba(30,20,8,0.4)",
                color: isCharging ? "#E8C060"
                  : canPlay ? "#C8A040"
                    : "rgba(110,85,40,0.4)",
                fontFamily:"inherit", fontWeight:600, letterSpacing:"0.06em",
                transition:"all .1s",
                WebkitUserSelect:"none",
              }}
            >
              {isCharging ? "松手出球 ↗" : phase === "flying" ? "飞行中…" : canPlay ? "按住蓄力" : "余额不足"}
            </button>
          </div>
        </div>

        {/* 底部提示 */}
        <div style={{
          padding:"0 14px 10px", textAlign:"center",
          fontSize:10, color:"rgba(150,110,50,0.38)", lineHeight:1.7,
        }}>
          {phase === "idle" ? "蓄力到金色区间松手，角度刚好 ✦" : ""}
        </div>
      </div>

      {/* 规则小字 */}
      <div style={{
        marginTop:10, padding:"10px 14px",
        background:"rgba(200,160,60,0.04)",
        border:`1px solid ${t.surfaceBorder}`,
        borderRadius:10, fontSize:10, color:t.textMuted, lineHeight:2,
      }}>
        <span style={{ color:"rgba(200,160,60,0.6)", marginRight:4 }}>✦</span>
        投{betAmt}币 · 进框得{betAmt * 3}币
        {" · "}连中2球得{betAmt * 4}币
        {" · "}连中3球得{betAmt * 5}币
      </div>
      </>)}
    </div>
  );
}
