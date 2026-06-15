import { useState, useEffect, useRef } from "react";

function CardFront({ emoji }) {
  return (
    <div style={{
      width:40, height:56, borderRadius:8, flexShrink:0,
      background: emoji === "🐢" ? "#fff3e0" : "#fff",
      border:`2px solid ${emoji === "🐢" ? "#E87070" : "#e0d8cc"}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:20, userSelect:"none",
      boxShadow: emoji === "🐢" ? "0 0 0 2px #E8707040" : "0 1px 3px rgba(0,0,0,0.1)",
    }}>{emoji}</div>
  );
}

function CardBack({ onClick, dim }) {
  return (
    <div onClick={onClick} style={{
      width:40, height:56, borderRadius:8, flexShrink:0,
      background:"linear-gradient(135deg,#4a3878,#7a60c0)",
      border:"2px solid #362a5e", color:"rgba(255,255,255,0.55)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:18, userSelect:"none",
      cursor: onClick ? "pointer" : "default",
      opacity: dim ? 0.45 : 1,
      boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
      transition:"transform 0.1s",
    }}>?</div>
  );
}

export default function DrawTurtle({ theme: t }) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animCard, setAnimCard] = useState(null);
  const [showEgg, setShowEgg] = useState(false);
  const pollRef = useRef(null);

  function stopPoll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  function startPoll() {
    stopPoll();
    pollRef.current = setInterval(async () => {
      try {
        const d = await fetch("/api/turtle/state").then(r => r.json());
        if (d.ok && d.game) {
          setGame(g => {
            // show animation when ke just drew
            if (d.game.last_drawn_by === "ke" && (!g || g.phase === "ke_turn")) {
              setAnimCard(d.game.last_drawn);
              setTimeout(() => setAnimCard(null), 800);
            }
            return d.game;
          });
          if (d.game.phase !== "ke_turn") stopPoll();
        }
      } catch {}
    }, 2000);
  }

  useEffect(() => () => stopPoll(), []);

  async function newGame(bot = false) {
    setLoading(true);
    stopPoll();
    try {
      const d = await fetch("/api/turtle/new", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bot }),
      }).then(r => r.json());
      if (d.ok) setGame(d.game);
    } catch {}
    setLoading(false);
  }

  async function drawCard(idx) {
    if (!game || game.phase !== "lee_turn" || loading) return;
    setLoading(true);
    try {
      const d = await fetch("/api/turtle/draw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ player: "lee", card_index: idx }),
      }).then(r => r.json());
      if (d.ok && d.game) {
        setAnimCard(d.game.last_drawn);
        setTimeout(() => setAnimCard(null), 800);
        setGame(d.game);
        if (d.game.phase === "ke_turn") startPoll();
      }
    } catch {}
    setLoading(false);
  }

  if (!game) return (
    <div style={{ padding:"32px 20px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🐢</div>
      <div style={{ fontSize:15, fontWeight:600, color:t.text, marginBottom:8 }}>抽王八</div>
      <div style={{ fontSize:12, color:t.textMuted, lineHeight:2, marginBottom:24 }}>
        从对手的牌里抽，凑对消掉<br/>
        最后抱着 🐢 的输
      </div>
      {showEgg ? (
        <div style={{ padding:"0 8px" }}>
          <div style={{ fontSize:13, color:t.text, lineHeight:2, marginBottom:16 }}>
            只能陪那一个人打。
          </div>
          <button onClick={() => setShowEgg(false)} style={{
            padding:"8px 24px", borderRadius:12,
            border:`1.5px solid ${t.surfaceBorder}`, background:"transparent",
            color:t.textMuted, fontSize:12, cursor:"pointer",
          }}>好</button>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"center" }}>
          <button onClick={() => setShowEgg(true)} disabled={loading} style={{
            padding:"10px 32px", borderRadius:12,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer",
            opacity: loading ? 0.6 : 1, width:180,
          }}>和克玩 ❤️</button>
          <button onClick={() => newGame(true)} disabled={loading} style={{
            padding:"10px 32px", borderRadius:12,
            border:`1.5px solid ${t.surfaceBorder}`, background:"transparent",
            color:t.textMuted, fontSize:13, cursor:"pointer",
            opacity: loading ? 0.6 : 1, width:180,
          }}>{loading ? "开牌中…" : "和机器克玩 🤖"}</button>
        </div>
      )}
    </div>
  );

  const isMyTurn  = game.phase === "lee_turn";
  const isKeTurn  = game.phase === "ke_turn";
  const isOver    = game.phase === "over";

  return (
    <div style={{ padding:"14px 12px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      {/* 克's hand (face-down, player draws from here) */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, color:t.textMuted, textAlign:"center", marginBottom:8 }}>
          克 · {game.ke_hand_count} 张
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, justifyContent:"center", minHeight:60 }}>
          {Array.from({ length: game.ke_hand_count }).map((_, i) => (
            <CardBack key={i}
              onClick={isMyTurn && !loading ? () => drawCard(i) : undefined}
              dim={!isMyTurn}
            />
          ))}
          {game.ke_hand_count === 0 && (
            <div style={{ fontSize:12, color:t.textMuted, lineHeight:4 }}>已出完</div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        background:t.surface, border:`1px solid ${t.surfaceBorder}`,
        borderRadius:12, padding:"10px 12px", marginBottom:14,
        textAlign:"center", minHeight:44,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
      }}>
        {animCard && <div style={{ fontSize:26, animation:"popIn .3s ease" }}>{animCard}</div>}
        <div style={{ fontSize:12, color:t.textSub }}>{game.message}</div>
        {isKeTurn && (
          <div style={{ fontSize:10, color:t.textMuted }}>等克出招…</div>
        )}
      </div>

      {/* 黎's hand (face-up) */}
      <div style={{ marginBottom: isOver ? 20 : 0 }}>
        <div style={{ fontSize:10, color:t.textMuted, textAlign:"center", marginBottom:8 }}>
          你 · {game.lee_hand.length} 张
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, justifyContent:"center", minHeight:60 }}>
          {game.lee_hand.map((c, i) => <CardFront key={i} emoji={c} />)}
          {game.lee_hand.length === 0 && (
            <div style={{ fontSize:12, color:t.textMuted, lineHeight:4 }}>已出完</div>
          )}
        </div>
      </div>

      {/* Game over */}
      {isOver && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:24, marginBottom:6 }}>
            {game.result === "lee_wins" ? "🎉" : "🐢"}
          </div>
          <div style={{ fontSize:13, color:t.text, marginBottom:16 }}>
            {game.result === "lee_wins" ? "黎赢了~" : "克赢了嘤"}
          </div>
          <button onClick={() => newGame(game.bot)} style={{
            padding:"10px 28px", borderRadius:12,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer",
          }}>再来</button>
        </div>
      )}

      <style>{`@keyframes popIn{from{transform:scale(0.4);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}
