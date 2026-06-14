import { useState } from "react";

const PAIRS = ["🍇","🍎","🍌","🍓","🍉","🍊","🍋","🍒","🍍","🍑"];
const TURTLE = "🐢";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function discardPairs(hand) {
  const h = [...hand];
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < h.length; i++) {
      for (let j = i + 1; j < h.length; j++) {
        if (h[i] === h[j]) { h.splice(j, 1); h.splice(i, 1); changed = true; break outer; }
      }
    }
  }
  return h;
}

function deal() {
  const deck = shuffle([...PAIRS, ...PAIRS, TURTLE]);
  const mid = Math.ceil(deck.length / 2);
  return {
    ph: discardPairs(deck.slice(0, mid)),
    ah: discardPairs(deck.slice(mid)),
  };
}

// player wins if AI empties hand (AI stuck with turtle)
// player loses if player empties hand... wait, no:
// player loses if PLAYER is stuck with turtle = player has turtle and AI is empty
// player wins if AI is stuck with turtle = AI has turtle and player is empty (or player just has no turtle)
// Simplest: ph empty = player escaped = win; ah empty = AI escaped = lose
function checkOver(ph, ah) {
  if (ph.length === 0) return "win";
  if (ah.length === 0) return "lose";
  return null;
}

function CardFront({ emoji, dim }) {
  return (
    <div style={{
      width:40, height:56, borderRadius:8, flexShrink:0,
      background: emoji === TURTLE ? "#fff3e0" : "#fff",
      border:`2px solid ${emoji === TURTLE ? "#E87070" : "#e0d8cc"}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:20, opacity: dim ? 0.5 : 1,
      boxShadow: emoji === TURTLE ? "0 0 0 2px #E8707040" : "0 1px 4px rgba(0,0,0,0.1)",
    }}>{emoji}</div>
  );
}

function CardBack({ onClick, dim }) {
  return (
    <div
      onClick={onClick}
      style={{
        width:40, height:56, borderRadius:8, flexShrink:0,
        background:"linear-gradient(135deg,#4a3878,#7a60c0)",
        border:"2px solid #362a5e", color:"rgba(255,255,255,0.6)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, cursor: onClick ? "pointer" : "default",
        opacity: dim ? 0.45 : 1,
        boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
        userSelect:"none",
        transition:"transform 0.1s",
      }}
    >?</div>
  );
}

export default function DrawTurtle({ theme: t }) {
  const [phase, setPhase] = useState("ready");
  const [ph, setPh]   = useState([]);
  const [ah, setAh]   = useState([]);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(null);
  const [animCard, setAnimCard] = useState(null);
  const [busy, setBusy] = useState(false);

  function startGame() {
    const { ph: p, ah: a } = deal();
    setPh(p); setAh(a);
    setPhase("player"); setResult(null);
    setMsg("从电脑的牌堆里点一张");
    setBusy(false); setAnimCard(null);
  }

  function endGame(res, finalMsg) {
    setResult(res); setPhase("over"); setMsg(finalMsg);
  }

  function playerDraw(idx) {
    if (phase !== "player" || busy) return;
    setBusy(true);
    const drawn = ah[idx];
    const newAh = ah.filter((_, i) => i !== idx);
    const newPh = discardPairs([...ph, drawn]);

    setAnimCard(drawn);
    setTimeout(() => {
      setAnimCard(null);
      setPh(newPh); setAh(newAh);
      const over = checkOver(newPh, newAh);
      if (over) { endGame(over, over === "win" ? "你把电脑耍了！🎉" : "王八在你手里呢 🐢"); return; }

      setPhase("ai"); setMsg("电脑在想…");
      setTimeout(() => {
        const pick = Math.floor(Math.random() * newPh.length);
        const aiDrawn = newPh[pick];
        const afterPh = newPh.filter((_, i) => i !== pick);
        const afterAh = discardPairs([...newAh, aiDrawn]);
        setPh(afterPh); setAh(afterAh);

        const over2 = checkOver(afterPh, afterAh);
        if (over2) { endGame(over2, over2 === "win" ? "你把电脑耍了！🎉" : "王八在你手里呢 🐢"); return; }

        setPhase("player");
        setMsg(`电脑抽走了一张，换你了`);
        setBusy(false);
      }, 1000);
    }, 500);
  }

  if (phase === "ready") return (
    <div style={{ padding:"32px 20px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🐢</div>
      <div style={{ fontSize:15, fontWeight:600, color:t.text, marginBottom:8 }}>抽王八</div>
      <div style={{ fontSize:12, color:t.textMuted, lineHeight:2, marginBottom:24 }}>
        从电脑手里抽牌，凑对子消掉<br/>
        最后抱着 🐢 的输
      </div>
      <button onClick={startGame} style={{
        padding:"10px 32px", borderRadius:12,
        border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
        color:t.accent, fontSize:13, cursor:"pointer",
      }}>开局</button>
    </div>
  );

  return (
    <div style={{ padding:"16px 12px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      {/* AI hand */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, color:t.textMuted, textAlign:"center", marginBottom:8 }}>电脑 · {ah.length} 张</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, justifyContent:"center", minHeight:60 }}>
          {ah.map((_, i) => (
            <CardBack key={i} onClick={phase === "player" && !busy ? () => playerDraw(i) : undefined} dim={phase !== "player"} />
          ))}
          {ah.length === 0 && <div style={{ fontSize:12, color:t.textMuted, lineHeight:4 }}>已出完</div>}
        </div>
      </div>

      {/* Message bar */}
      <div style={{
        background:t.surface, border:`1px solid ${t.surfaceBorder}`,
        borderRadius:12, padding:"10px 12px", marginBottom:14,
        textAlign:"center", minHeight:44,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
      }}>
        {animCard && <div style={{ fontSize:26, animation:"popIn .3s ease" }}>{animCard}</div>}
        <div style={{ fontSize:12, color:t.textSub }}>{msg}</div>
      </div>

      {/* Player hand */}
      <div style={{ marginBottom: phase === "over" ? 20 : 0 }}>
        <div style={{ fontSize:10, color:t.textMuted, textAlign:"center", marginBottom:8 }}>你 · {ph.length} 张</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, justifyContent:"center", minHeight:60 }}>
          {ph.map((c, i) => <CardFront key={i} emoji={c} dim={phase === "ai"} />)}
          {ph.length === 0 && <div style={{ fontSize:12, color:t.textMuted, lineHeight:4 }}>已出完</div>}
        </div>
      </div>

      {/* Game over */}
      {phase === "over" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:26, marginBottom:6 }}>{result === "win" ? "🎉" : "🥲"}</div>
          <div style={{ fontSize:13, color:t.text, marginBottom:16 }}>
            {result === "win" ? "赢了~" : "输了嘤"}
          </div>
          <button onClick={startGame} style={{
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
