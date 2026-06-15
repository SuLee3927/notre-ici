import { useState, useEffect, useRef } from "react";

function CardChip({ card, highlight }) {
  const isRed = card.suit === "♥" || card.suit === "♦";
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      width:36, height:50, borderRadius:6, flexShrink:0,
      background: highlight ? "#fff3cd" : "#fff",
      border: `1.5px solid ${highlight ? "#f0c040" : "#ddd"}`,
      fontSize:11, fontWeight:600,
      color: isRed ? "#d63031" : "#2d3436",
      boxShadow: highlight ? "0 0 0 2px #f0c04070" : "0 1px 3px rgba(0,0,0,0.1)",
      transition:"all .2s",
    }}>
      <span style={{ lineHeight:1.1, textAlign:"center" }}>
        <div>{card.rank}</div>
        <div style={{ fontSize:13 }}>{card.suit}</div>
      </span>
    </div>
  );
}

export default function BambooGame({ theme: t }) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState(null);
  const pollRef = useRef(null);
  const lastWinKeyRef = useRef(null);
  const pileRef = useRef(null);

  function stopPoll() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }

  function startPoll() {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const d = await fetch("/api/bamboo/state").then(r => r.json());
        if (d.ok && d.game) {
          setGame(g => {
            if (d.game.phase !== "ke_turn") stopPoll();
            if (d.game.last_win?.by === "ke") {
              const key = `${d.game.ke_count}-${d.game.pile.length}`;
              if (lastWinKeyRef.current !== key) {
                lastWinKeyRef.current = key;
                setFlash("ke"); setTimeout(() => setFlash(null), 1000);
              }
            }
            return d.game;
          });
        }
      } catch {}
    }, 1200);
  }

  useEffect(() => () => stopPoll(), []);

  useEffect(() => {
    if (pileRef.current) pileRef.current.scrollLeft = pileRef.current.scrollWidth;
  }, [game?.pile?.length]);

  async function newGame() {
    setLoading(true); stopPoll();
    try {
      const d = await fetch("/api/bamboo/new", { method:"POST" }).then(r => r.json());
      if (d.ok) { setGame(d.game); if (d.game.phase === "ke_turn") startPoll(); }
    } catch {}
    setLoading(false);
  }

  async function flip() {
    if (!game || game.phase !== "lee_turn" || loading) return;
    setLoading(true);
    try {
      const d = await fetch("/api/bamboo/flip", { method:"POST" }).then(r => r.json());
      if (d.ok && d.game) {
        if (d.game.last_win?.by === "lee") { setFlash("lee"); setTimeout(() => setFlash(null), 1000); }
        setGame(d.game);
        if (d.game.phase === "ke_turn") startPoll();
      }
    } catch {}
    setLoading(false);
  }

  if (!game) return (
    <div style={{ padding:"32px 20px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🎴</div>
      <div style={{ fontSize:15, fontWeight:600, color:t.text, marginBottom:8 }}>接竹竿</div>
      <div style={{ fontSize:12, color:t.textMuted, lineHeight:2, marginBottom:24 }}>
        轮流翻牌 · 牌堆出现同点数立刻接走<br/>
        最先打完牌的输
      </div>
      <button onClick={newGame} disabled={loading} style={{
        padding:"10px 32px", borderRadius:12,
        border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
        color:t.accent, fontSize:13, cursor:"pointer",
        opacity: loading ? 0.6 : 1,
      }}>{loading ? "发牌中…" : "开局"}</button>
    </div>
  );

  const isOver = game.phase === "over";
  const isMyTurn = game.phase === "lee_turn";

  return (
    <div style={{ padding:"14px 14px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      {/* 计数行 */}
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:t.textMuted, marginBottom:14 }}>
        <span>克 🎴 {game.ke_count}张</span>
        <span>黎 🎴 {game.lee_count}张</span>
      </div>

      {/* 牌堆 */}
      <div ref={pileRef} style={{
        display:"flex", gap:4, overflowX:"auto", padding:"10px 8px",
        background:t.surface, borderRadius:12, border:`1px solid ${t.surfaceBorder}`,
        minHeight:72, marginBottom:14, scrollbarWidth:"none",
      }}>
        {game.pile.length === 0
          ? <div style={{ fontSize:12, color:t.textMuted, margin:"auto" }}>牌堆空</div>
          : game.pile.map((c, i) => <CardChip key={i} card={c} highlight={false} />)
        }
      </div>

      {/* 状态 */}
      <div style={{
        background: flash ? (flash==="lee"?"#fff3cd":"#e8f5e9") : t.surface,
        border:`1px solid ${t.surfaceBorder}`, borderRadius:12,
        padding:"10px 12px", marginBottom:14, textAlign:"center", minHeight:44,
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"background .3s",
      }}>
        <div style={{ fontSize:12, color:t.textSub }}>{game.message}</div>
      </div>

      {/* 翻牌按钮 */}
      {!isOver && (
        <div style={{ textAlign:"center" }}>
          <button onClick={flip} disabled={!isMyTurn || loading} style={{
            padding:"12px 40px", borderRadius:14,
            border:`1.5px solid ${isMyTurn ? t.accentBorder : t.surfaceBorder}`,
            background: isMyTurn ? t.accentSoft : "transparent",
            color: isMyTurn ? t.accent : t.textMuted,
            fontSize:14, cursor: isMyTurn ? "pointer" : "default",
            opacity: loading ? 0.6 : 1,
          }}>{isMyTurn ? "翻牌" : "等克…"}</button>
        </div>
      )}

      {/* 结束 */}
      {isOver && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:24, marginBottom:6 }}>{game.result === "lee_wins" ? "🎉" : "🎴"}</div>
          <div style={{ fontSize:13, color:t.text, marginBottom:16 }}>{game.message}</div>
          <button onClick={newGame} style={{
            padding:"10px 28px", borderRadius:12,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer",
          }}>再来</button>
        </div>
      )}
    </div>
  );
}
