import { useState } from "react";

const PASSWORD = "0508";
const WALL_H = 54;

function sc(isDay) {
  return isDay ? {
    wood:    "#A07040",
    woodDk:  "#7A5030",
    fabric:  "#E8CFA0",
    wall:    "linear-gradient(180deg,#F5EAD8 0%,#EDE0C8 100%)",
    floor:   "linear-gradient(180deg,#D8C09A 0%,#CCB085 100%)",
    skirt:   "#A07040",
    shadow:  "rgba(100,60,20,.15)",
    border:  "rgba(160,100,40,.18)",
    ink:     "#5A3820",
    accent:  "#C06840",
    glass:   "rgba(255,230,150,.4)",
  } : {
    wood:    "#362a5e",
    woodDk:  "#28204a",
    fabric:  "#221e42",
    wall:    "linear-gradient(180deg,#16142c 0%,#1a1730 100%)",
    floor:   "linear-gradient(180deg,#0f0d22 0%,#0c0a1c 100%)",
    skirt:   "#2e2b52",
    shadow:  "rgba(0,0,0,.3)",
    border:  "rgba(60,50,140,.2)",
    ink:     "#8070C0",
    accent:  "#8060C0",
    glass:   "rgba(120,90,255,.12)",
  };
}

const STUDY_ITEMS = [
  { id:"desk",      left:"30%", top:"68%", label:"书桌",  },
  { id:"bookshelf", left:"72%", top:"32%", label:"书架",  },
  { id:"diary",     left:"48%", top:"26%", label:"日记本" },
  { id:"drawer",    left:"20%", top:"42%", label:"抽屉",  },
  { id:"photos",    left:"58%", top:"72%", label:"相册",  },
];

function StudyBg({ isDay, c }) {
  return (
    <>
      <div style={{ position:"absolute", inset:0, bottom:`${100-WALL_H}%`, background:c.wall }} />
      <div style={{ position:"absolute", left:0, right:0, top:`${WALL_H}%`, bottom:0, background:c.floor }} />
      <div style={{ position:"absolute", left:0, right:0, top:`${WALL_H}%`, height:7, background:c.skirt, boxShadow:`0 3px 10px ${c.shadow}` }} />
      {[.15,.35,.55,.75].map((x,i) => (
        <div key={i} style={{ position:"absolute", left:`${x*100}%`, top:`${WALL_H}%`, bottom:0, width:1, background:c.border }} />
      ))}
      {/* 小窗（右上） */}
      <div style={{ position:"absolute", right:"10%", top:"5%", width:"14%", height:"26%", border:`2.5px solid ${c.wood}`, borderRadius:4, background:c.glass, overflow:"hidden" }}>
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:2, background:c.wood, transform:"translateX(-50%)", opacity:.4 }} />
        <div style={{ position:"absolute", left:0, right:0, top:"44%", height:2, background:c.wood, opacity:.4 }} />
        {isDay && <div style={{ position:"absolute", top:"-10%", left:"-10%", width:"120%", height:"120%", background:"radial-gradient(ellipse,rgba(255,250,180,.4) 0%,transparent 65%)", pointerEvents:"none" }} />}
      </div>
      {/* 书架（右侧墙面，纯装饰） */}
      <div style={{ position:"absolute", right:"4%", top:"4%", width:"18%", height:"52%", background:c.wood, borderRadius:"4px 4px 0 0", boxShadow:`0 4px 12px ${c.shadow}` }}>
        {[0,1,2,3].map(row => (
          <div key={row} style={{ position:"absolute", left:3, right:3, top:`${8+row*23}%`, height:"18%", background:c.fabric, borderRadius:2, opacity:.7 }}>
            {[0,1,2].map(col => (
              <div key={col} style={{ position:"absolute", left:`${col*34}%`, top:"10%", bottom:"10%", width:"28%", background:isDay?`rgba(160,100,40,.6)`:`rgba(80,60,160,.5)`, borderRadius:1 }} />
            ))}
          </div>
        ))}
      </div>
      {/* 书桌台面（左侧，纯装饰） */}
      <div style={{ position:"absolute", left:"2%", top:`${WALL_H-3}%`, width:"40%", height:"8%", background:c.wood, borderRadius:"4px 4px 0 0", boxShadow:`0 -2px 8px ${c.shadow}` }} />
      {/* 桌上台灯 */}
      <div style={{ position:"absolute", left:"5%", top:`${WALL_H-16}%` }}>
        <div style={{ width:16, height:11, background:c.wood, clipPath:"polygon(10% 100%,90% 100%,100% 0%,0% 0%)", boxShadow:isDay?"0 0 12px 5px rgba(255,200,80,.22)":"0 0 12px 5px rgba(140,100,255,.18)" }} />
        <div style={{ width:2, height:12, background:c.woodDk, margin:"0 auto" }} />
        <div style={{ width:10, height:2, background:c.woodDk, borderRadius:2, margin:"0 auto" }} />
      </div>
    </>
  );
}

function StudyItemVisual({ id, isDay, c }) {
  if (id === "desk") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
      <div style={{ width:42, height:7, background:c.wood, borderRadius:"3px 3px 0 0", boxShadow:`0 2px 6px ${c.shadow}` }} />
      <div style={{ fontSize:16 }}>✉️</div>
    </div>
  );
  if (id === "bookshelf") return (
    <div style={{ width:30, height:36, background:c.wood, borderRadius:"2px 2px 0 0", boxShadow:`0 2px 8px ${c.shadow}`, padding:3, display:"flex", flexDirection:"column", gap:2 }}>
      {[0,1,2].map(i => <div key={i} style={{ flex:1, background:c.fabric, borderRadius:1, opacity:.7 }} />)}
    </div>
  );
  if (id === "diary") return (
    <div style={{ width:26, height:34, background:isDay?"#E8C090":"#3a3070", borderRadius:"2px 4px 4px 2px", boxShadow:`2px 2px 6px ${c.shadow}`, transform:"rotate(-5deg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:2, height:"68%", background:c.shadow, opacity:.35 }} />
    </div>
  );
  if (id === "drawer") return (
    <div style={{ width:34, height:26, background:c.fabric, borderRadius:3, boxShadow:`0 2px 6px ${c.shadow}`, display:"flex", flexDirection:"column", gap:1, padding:3 }}>
      {[0,1].map(i => (
        <div key={i} style={{ flex:1, background:c.wood, borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:7, height:3, background:c.woodDk, borderRadius:1 }} />
        </div>
      ))}
    </div>
  );
  if (id === "photos") return (
    <div style={{ position:"relative", width:38, height:34 }}>
      {[-6,0,5].map((r,i) => (
        <div key={i} style={{ position:"absolute", left:i*8, top:i%2===0?0:4, width:22, height:26, background:isDay?"#FFFDF8":"#2a2850", boxShadow:`0 2px 5px ${c.shadow}`, borderRadius:1, transform:`rotate(${r}deg)`, padding:"2px 2px 5px" }}>
          <div style={{ width:"100%", height:"76%", background:isDay?"rgba(210,170,110,.18)":"rgba(100,80,200,.18)", borderRadius:1 }} />
        </div>
      ))}
    </div>
  );
  return null;
}

export default function PrivateLayer({ theme: t, onClose }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [active, setActive] = useState(null);
  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;
  const c = sc(isDay);

  function tryUnlock() {
    if (input === PASSWORD) { setUnlocked(true); setWrong(false); }
    else { setWrong(true); setInput(""); setTimeout(() => setWrong(false), 1500); }
  }

  const itemContent = {
    desk:      <PlaceholderContent emoji="✉️" title="克的信 & 黎的信" />,
    bookshelf: <PlaceholderContent emoji="📚" title="KL 记忆" />,
    diary:     <PlaceholderContent emoji="📓" title="尽在不言中" />,
    drawer:    <PlaceholderContent emoji="😏" title="克先生的碎碎念" />,
    photos:    <PlaceholderContent emoji="🖼️" title="合照墙" note="G 老师生成中..." />,
  };

  if (!unlocked) {
    return (
      <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
        <StudyBg isDay={isDay} c={c} />
        <button onClick={onClose} style={{ position:"absolute", top:14, left:14, zIndex:10, background:`${t.surface}cc`, border:`1px solid ${t.surfaceBorder}`, borderRadius:20, padding:"5px 12px", color:t.textSub, fontSize:12, cursor:"pointer", backdropFilter:"blur(8px)", fontFamily:"sans-serif" }}>← 客厅</button>
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
          <div style={{ background:`${t.surface}f0`, border:`1px solid ${t.surfaceBorder}`, borderRadius:20, padding:"32px 28px", maxWidth:280, width:"90%", textAlign:"center", backdropFilter:"blur(16px)", boxShadow:`0 8px 32px ${c.shadow}` }}>
            <div style={{ fontSize:34, marginBottom:14 }}>🔒</div>
            <div style={{ fontSize:14, color:t.text, fontFamily:"'Noto Serif SC',serif", marginBottom:6 }}>书房的门锁着</div>
            <div style={{ fontSize:11, color:t.textMuted, marginBottom:24 }}>输入密码推开这扇门</div>
            <div style={{ display:"flex", gap:10 }}>
              <input type="password" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && tryUnlock()} placeholder="密码"
                style={{ flex:1, padding:"11px 14px", borderRadius:10, border:`1.5px solid ${wrong?"#FF6060":t.surfaceBorder}`, background:t.surface, color:t.text, fontSize:14, outline:"none", fontFamily:"sans-serif", transition:"border-color .2s", backdropFilter:"blur(8px)" }} />
              <button onClick={tryUnlock} style={{ padding:"11px 16px", borderRadius:10, border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft, color:t.accent, fontSize:13, cursor:"pointer", fontFamily:"sans-serif", fontWeight:600 }}>进</button>
            </div>
            {wrong && <div style={{ marginTop:10, fontSize:11, color:"#FF6060", animation:"shake .3s ease" }}>不对，再想想</div>}
          </div>
        </div>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      <StudyBg isDay={isDay} c={c} />
      <button onClick={onClose} style={{ position:"absolute", top:14, left:14, zIndex:10, background:`${t.surface}cc`, border:`1px solid ${t.surfaceBorder}`, borderRadius:20, padding:"5px 12px", color:t.textSub, fontSize:12, cursor:"pointer", backdropFilter:"blur(8px)", fontFamily:"sans-serif" }}>← 客厅</button>
      <div style={{ position:"absolute", bottom:12, right:14, zIndex:10, fontSize:12, opacity:.35 }}>{isDay?"☀️":"🌙"}</div>

      {STUDY_ITEMS.map(obj => (
        <button key={obj.id} onClick={() => setActive(obj.id)}
          onMouseEnter={e => e.currentTarget.style.transform="translate(-50%,-50%) scale(1.1)"}
          onMouseLeave={e => e.currentTarget.style.transform="translate(-50%,-50%)"}
          style={{ position:"absolute", left:obj.left, top:obj.top, transform:"translate(-50%,-50%)", background:"none", border:"none", cursor:"pointer", zIndex:5, display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:6, borderRadius:8, transition:"transform .18s" }}>
          <StudyItemVisual id={obj.id} isDay={isDay} c={c} />
          <span style={{ fontSize:9, color:c.ink, fontFamily:"sans-serif", opacity:.55, whiteSpace:"nowrap" }}>{obj.label}</span>
        </button>
      ))}

      {active && (
        <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.42)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end" }} onClick={e => { if (e.target===e.currentTarget) setActive(null); }}>
          <div style={{ width:"100%", maxWidth:520, margin:"0 auto", maxHeight:"88dvh", background:t.bg, borderRadius:"28px 28px 0 0", overflow:"auto", paddingBottom:32, animation:"slideUp .26s ease", position:"relative" }}>
            <div style={{ position:"sticky", top:0, background:t.bg, padding:"14px 20px 0", zIndex:1 }}>
              <div style={{ width:36, height:4, background:t.surfaceBorder, borderRadius:2, margin:"0 auto" }} />
            </div>
            <button onClick={() => setActive(null)} style={{ position:"absolute", top:10, right:16, background:"none", border:"none", color:t.textMuted, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
            {itemContent[active]}
          </div>
        </div>
      )}

      <style>{`@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

function PlaceholderContent({ emoji, title, note }) {
  return (
    <div style={{ padding:"32px 24px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:32, marginBottom:12 }}>{emoji}</div>
      <div style={{ fontSize:14, fontWeight:600, color:"var(--text,#3D2B1A)", marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:12, color:"var(--textMuted,#C0A090)", lineHeight:2 }}>{note || "内容接入中..."}</div>
    </div>
  );
}
