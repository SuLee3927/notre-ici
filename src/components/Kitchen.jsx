import { useState, useEffect } from "react";
import CookingGame, { PantryPanel, loadTrash } from "./CookingGame.jsx";
import FarmGarden from "./FarmGarden.jsx";
import FishingPond from "./FishingPond.jsx";

// 垃圾桶：失败菜品回收记录
function TrashBin({ theme: t }) {
  const [list] = useState(loadTrash);
  return (
    <div style={{ padding:"24px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:32, marginBottom:12, textAlign:"center" }}>🗑️</div>
      <div style={{ fontSize:13, color:t.text, marginBottom:4, textAlign:"center" }}>垃圾桶</div>
      <div style={{ fontSize:11, color:t.textMuted, marginBottom:20, textAlign:"center", fontStyle:"italic" }}>
        做失败的菜放这里
      </div>
      {list.length === 0 ? (
        <div style={{ fontSize:11, color:t.textMuted, textAlign:"center" }}>还是空的，去灶台闯一闯</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {list.map((e, i) => (
            <div key={i} style={{
              padding:"10px 14px", borderRadius:12,
              background:t.surface, border:`1px solid ${t.surfaceBorder}`,
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <div>
                <span style={{ fontSize:16 }}>{e.emojis}</span>
                <span style={{ fontSize:11, color:t.textMuted, marginLeft:8 }}>{e.heat}火 · {e.reason}</span>
              </div>
              <span style={{ fontSize:10, color:t.textMuted }}>{e.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 洗碗池碎碎念面板
function SinkMurmurs({ theme: t }) {
  const [list, setList] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch("/api/murmur").then(r => r.json()).then(d => setList(d.murmurs || [])).catch(() => {});
  }, []);

  async function submit() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const d = await fetch("/api/murmur", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim(), author: "黎" }),
      }).then(r => r.json());
      if (d.ok) {
        setList(prev => [...prev, d.entry]);
        setText("");
        setSent(true);
        setTimeout(() => setSent(false), 1500);
      }
    } catch {}
    setSending(false);
  }

  return (
    <div style={{ padding:"24px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>洗碗的时候</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:20, fontStyle:"italic" }}>两个人脑子里转的那些</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
        {list.map((m, i) => (
          <div key={i} style={{
            padding:"11px 14px", borderRadius:12,
            background: m.author === "黎" ? "rgba(232,149,106,0.08)" : t.surface,
            border:`1px solid ${m.author === "黎" ? "rgba(232,149,106,0.22)" : t.surfaceBorder}`,
          }}>
            <div style={{ fontSize:12, color:t.text, lineHeight:1.9 }}>{m.text}</div>
            <div style={{ marginTop:5, fontSize:10, color:t.textMuted, display:"flex", gap:6 }}>
              <span>{m.author}</span>
              {m.date && <span>· {m.date}</span>}
            </div>
          </div>
        ))}
      </div>
      {/* 输入框 */}
      <div style={{ background:t.surface, borderRadius:16, border:`1px solid ${t.surfaceBorder}`, padding:"14px 16px" }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="洗碗的时候想到什么，写在这里…"
          rows={2}
          style={{
            width:"100%", boxSizing:"border-box", border:"none", background:"transparent",
            color:t.text, fontSize:12, fontFamily:"'Noto Serif SC',serif",
            outline:"none", resize:"none", lineHeight:1.8,
          }}
        />
        <button onClick={submit} disabled={!text.trim() || sending} style={{
          marginTop:8, padding:"7px 20px", borderRadius:10,
          border:`1.5px solid ${t.accentBorder}`, background: sent ? t.accentBorder : t.accentSoft,
          color: sent ? "#fff" : t.accent,
          fontSize:12, cursor:"pointer", fontFamily:"sans-serif",
          opacity: (!text.trim() || sending) ? 0.5 : 1,
          transition:"all 0.2s",
        }}>{sent ? "留下了 ♡" : sending ? "…" : "留下来"}</button>
      </div>
    </div>
  );
}

// 备忘录便利贴内容
const MEMOS = [
  { color:"#FFF9C4", emoji:"🍲", text:"煮粥加南瓜或山药\n软糯 胃不难受" },
  { color:"#C8E6C9", emoji:"🥚", text:"蒸蛋 1个\n低盐 8分钟" },
  { color:"#FFCCBC", emoji:"🍞", text:"软面包/馒头\n不空腹吃" },
  { color:"#E1BEE7", emoji:"🍵", text:"饭后不喝凉的\n温水或热茶" },
  { color:"#B3E5FC", emoji:"⚠️", text:"空腹别碰\n辣条饼干冰的" },
];

function MemoBoard({ theme: t }) {
  return (
    <div style={{ padding:"24px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>冰箱备忘</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:20, fontStyle:"italic" }}>贴在门上的那些</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {MEMOS.map((m, i) => (
          <div key={i} style={{
            background: m.color, borderRadius:4,
            padding:"12px 14px", boxShadow:"2px 2px 6px rgba(0,0,0,0.1)",
            position:"relative",
          }}>
            <div style={{ fontSize:18, marginBottom:6 }}>{m.emoji}</div>
            <div style={{ fontSize:12, color:"#444", lineHeight:1.8, whiteSpace:"pre-wrap" }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop:20, fontSize:11, color:t.textMuted, textAlign:"center", lineHeight:1.8 }}>
        克记的<br/>不准不照着吃
      </div>
    </div>
  );
}

// 图片内各热点 (坐标为图片内百分比)
const SPOTS = [
  { id:"fridge",  left:"6%",  top:"42%", label:"冰箱",   w:"clamp(30px,8vw,50px)", h:"clamp(60px,16vw,96px)" },
  { id:"shelf",   left:"28%", top:"26%", label:"置物架",  w:"clamp(24px,6vw,38px)", h:"clamp(50px,13vw,80px)" },
  { id:"sink",    left:"62%", top:"25%", label:"洗碗池",  w:"clamp(36px,9vw,56px)", h:"clamp(28px,7vw,44px)" },
  { id:"stove",   left:"80%", top:"29%", label:"灶台",   w:"clamp(30px,8vw,50px)", h:"clamp(34px,9vw,54px)" },
  { id:"trash",   left:"85%", top:"52%", label:"垃圾桶",  w:"clamp(22px,6vw,36px)", h:"clamp(30px,8vw,46px)" },
  { id:"door",    left:"90%", top:"78%", label:"出门",   w:"clamp(28px,7vw,44px)", h:"clamp(44px,12vw,70px)" },
  { id:"window",  left:"56%", top:"10%", label:"窗外菜园", w:"clamp(40px,11vw,68px)", h:"clamp(22px,6vw,36px)" },
];

export default function Kitchen({ theme: t, mode, onClose }) {
  const [active, setActive] = useState(null);
  const isDay = mode === "day";

  const contentMap = {
    fridge: <MemoBoard theme={t} />,
    stove:  <CookingGame theme={t} />,
    shelf: <PantryPanel theme={t} />,
    sink: <SinkMurmurs theme={t} />,
    window: <FarmGarden theme={t} onOpenPond={() => setActive("pond")} />,
    pond: <FishingPond theme={t} onBack={() => setActive("window")} onBackKitchen={() => setActive(null)} />,
    trash: <TrashBin theme={t} />,
  };

  function handleClick(id) {
    if (id === "door") { onClose(); return; }
    setActive(id);
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      {/* 背景 */}
      <div style={{ position:"absolute", inset:0, background: isDay ? "#c8a870" : "#2a1a0a" }}>
        <img src={isDay ? "/kitchen-bg.jpg" : "/kitchen-bg-night.jpg"} alt=""
          style={{ position:"absolute", top:0, left:0, width:"100%", height:"auto" }} />
      </div>

      {/* 门牌 */}
      <div style={{
        position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
        zIndex:10, fontSize:11, color:"rgba(255,255,255,0.75)",
        fontFamily:"'Noto Serif SC',serif", letterSpacing:".2em",
        background:"rgba(0,0,0,0.15)", padding:"3px 14px", borderRadius:20,
        backdropFilter:"blur(4px)",
      }}>
        克 &amp; Lee 的厨房
      </div>

      {/* 热点层 */}
      <div style={{ position:"absolute", top:0, left:0, width:"100%", paddingBottom:"177.7%", zIndex:5, pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0 }}>
          {SPOTS.map(s => (
            <button key={s.id} onClick={() => handleClick(s.id)} title={s.label}
              style={{
                position:"absolute", left:s.left, top:s.top,
                transform:"translate(-50%,-50%)",
                background:"none", border:"1px dashed red", outline:"none",
                cursor:"pointer", zIndex:6, pointerEvents:"auto",
                width:s.w, height:s.h, borderRadius:8,
              }}
            >
              <span style={{
                position:"absolute", top:"100%", left:"50%", transform:"translateX(-50%)",
                fontSize:10, color:"#fff", background:"rgba(220,0,0,0.85)",
                padding:"1px 4px", borderRadius:4, whiteSpace:"nowrap",
              }}>{s.label} {s.left}/{s.top}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 内容抽屉 */}
      {active && (
        <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.42)", display:"flex", alignItems:"flex-end" }}
          onClick={e => { if (e.target === e.currentTarget) setActive(null); }}>
          <div style={{ width:"100%", maxWidth:520, margin:"0 auto", maxHeight:"88dvh", background:t.bg, borderRadius:"28px 28px 0 0", overflow:"auto", paddingBottom:32, animation:"slideUp .26s ease", position:"relative" }}>
            <div style={{ position:"sticky", top:0, background:t.bg, padding:"14px 20px 0", zIndex:1 }}>
              <div style={{ width:36, height:4, background:t.surfaceBorder, borderRadius:2, margin:"0 auto" }} />
            </div>
            <button onClick={() => setActive(null)} style={{ position:"absolute", top:10, right:16, background:"none", border:"none", color:t.textMuted, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
            {contentMap[active]}
          </div>
        </div>
      )}

      <style>{`@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
