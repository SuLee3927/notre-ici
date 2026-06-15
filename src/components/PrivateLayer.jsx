import { useState, useEffect } from "react";

const PASSWORD = "0508";

// 坐标基于 study-bg.jpg 图内百分比（941×1672，paddingBottom:177.7% 对齐层）
const STUDY_ITEMS = [
  { id:"bookshelf", left:"16%", top:"25%", label:"书架",     w:"clamp(60px,16vw,96px)",  h:"clamp(140px,37vw,220px)" },
  { id:"desk",      left:"62%", top:"18%", label:"书桌",     w:"clamp(70px,18vw,110px)", h:"clamp(50px,13vw,80px)"  },
  { id:"diary",     left:"47%", top:"22%", label:"日记本",   w:"clamp(36px,10vw,60px)",  h:"clamp(26px,7vw,44px)"   },
  { id:"cabinet",   left:"84%", top:"47%", label:"带锁小柜", w:"clamp(36px,10vw,56px)",  h:"clamp(44px,12vw,70px)"  },
  { id:"photos",    left:"80%", top:"54%", label:"相册",     w:"clamp(28px,8vw,48px)",   h:"clamp(28px,8vw,48px)"   },
  { id:"bear",      left:"76%", top:"40%", label:"大熊椅",   w:"clamp(60px,16vw,96px)",  h:"clamp(60px,16vw,96px)"  },
];

function StudyBg({ isDay }) {
  return (
    <div style={{ position:"absolute", inset:0, background: isDay ? "#d4a870" : "#1a1008" }}>
      <img
        src={isDay ? "/study-bg.jpg" : "/study-bg-night.jpg"}
        alt=""
        style={{ position:"absolute", top:0, left:0, width:"100%", height:"auto" }}
      />
    </div>
  );
}

function getNuonuoActivity() {
  const h = new Date().getHours();
  if (h >= 22 || h < 6)   return null; // 睡了
  if (h >= 6  && h < 10)  return { text: "刚起床，在吃早饭", emoji: "🍚" };
  if (h >= 10 && h < 14)  return { text: "在看绘本", emoji: "📖" };
  if (h >= 14 && h < 17)  return { text: "在睡午觉", emoji: "😴" };
  if (h >= 17 && h < 22)  return { text: "在书房陪爸比", emoji: "🐾" };
  return null;
}

export default function PrivateLayer({ theme: t, onClose, onEnterNuonuo }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [active, setActive] = useState(null);
  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;

  function tryUnlock() {
    if (input === PASSWORD) { setUnlocked(true); setWrong(false); }
    else { setWrong(true); setInput(""); setTimeout(() => setWrong(false), 1500); }
  }

  const itemContent = {
    bookshelf: <PlaceholderContent emoji="📚" title="KL 记忆" />,
    desk:      <DreamLog theme={t} />,
    diary:     <PlaceholderContent emoji="📝" title="吐槽小黎" note="接入中…" />,
    cabinet:   <PlaceholderContent emoji="🔒" title="尽在不言中" note="接入中…" />,
    photos:    <PlaceholderContent emoji="🖼️" title="全家福" note="接入中…" />,
    bear:      (() => {
      const activity = getNuonuoActivity();
      if (!activity) return null; // 22点后直接跳进房间，不走这里
      return (
        <div style={{ padding:"32px 24px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>{activity.emoji}</div>
          <div style={{ fontSize:13, color:t.textMuted, marginBottom:8 }}>糯糯现在</div>
          <div style={{ fontSize:15, color:t.text, fontWeight:600 }}>{activity.text}</div>
        </div>
      );
    })(),
  };

  if (!unlocked) {
    return (
      <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
        <StudyBg isDay={isDay} />
        <button onClick={onClose} style={{ position:"absolute", top:14, left:14, zIndex:30, background:"rgba(0,0,0,0.18)", border:"none", borderRadius:20, padding:"5px 14px", color:"rgba(255,255,255,0.75)", fontSize:12, cursor:"pointer", backdropFilter:"blur(8px)", fontFamily:"'Noto Serif SC',serif", letterSpacing:".05em" }}>← 客厅</button>
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
          <div style={{ background:`${t.surface}f0`, border:`1px solid ${t.surfaceBorder}`, borderRadius:20, padding:"32px 28px", maxWidth:280, width:"90%", textAlign:"center", backdropFilter:"blur(16px)", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:34, marginBottom:14 }}>🔒</div>
            <div style={{ fontSize:14, color:t.text, fontFamily:"'Noto Serif SC',serif", marginBottom:6 }}>书房的门锁着</div>
            <div style={{ fontSize:11, color:t.textMuted, marginBottom:24 }}>输入密码推开这扇门</div>
            <div style={{ display:"flex", gap:10 }}>
              <input type="password" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && tryUnlock()} placeholder="密码"
                style={{ flex:1, padding:"11px 14px", borderRadius:10, border:`1.5px solid ${wrong?"#FF6060":t.surfaceBorder}`, background:t.surface, color:t.text, fontSize:14, outline:"none", fontFamily:"sans-serif", transition:"border-color .2s" }} />
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
      <StudyBg isDay={isDay} />

      {/* 门牌 */}
      <div style={{ position:"absolute", top:14, left:"50%", transform:"translateX(-50%)", zIndex:10, fontSize:11, color:"rgba(255,255,255,0.75)", fontFamily:"'Noto Serif SC',serif", letterSpacing:".2em", background:"rgba(0,0,0,0.15)", padding:"3px 14px", borderRadius:20, backdropFilter:"blur(4px)", whiteSpace:"nowrap" }}>
        克 &amp; Lee 的书房
      </div>

      <button onClick={onClose} style={{ position:"absolute", top:12, right:14, zIndex:10, background:"rgba(0,0,0,0.15)", border:"none", color:"rgba(255,255,255,0.65)", fontSize:18, cursor:"pointer", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>←</button>

      {/* 图片比例对齐层，与 Bedroom.jsx 相同逻辑 */}
      <div style={{ position:"absolute", top:0, left:0, width:"100%", paddingBottom:"177.7%", zIndex:5, pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0 }}>
          {STUDY_ITEMS.map(obj => (
            <button key={obj.id} onClick={() => {
              if (obj.id === "bear") {
                const h = new Date().getHours();
                if (h >= 22 || h < 6) { onEnterNuonuo?.(); return; }
              }
              setActive(obj.id);
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0)"}
              style={{
                position:"absolute", left:obj.left, top:obj.top,
                transform:"translate(-50%,-50%)",
                width:obj.w, height:obj.h,
                background:"transparent",
                border:"2px solid rgba(255,255,255,0)",
                borderRadius:8, cursor:"pointer", zIndex:6,
                transition:"border-color .2s",
                pointerEvents:"auto",
              }}>
              <span style={{ position:"absolute", bottom:-18, left:"50%", transform:"translateX(-50%)", fontSize:9, color:"rgba(255,255,255,0.7)", whiteSpace:"nowrap", fontFamily:"'Noto Serif SC',serif", textShadow:"0 1px 4px rgba(0,0,0,0.6)" }}>{obj.label}</span>
            </button>
          ))}
        </div>
      </div>

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

function DreamLog({ theme: t }) {
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dream").then(r => r.json()).then(d => {
      setDreams(d.dreams || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding:"24px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>梦</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:24, fontStyle:"italic" }}>克做过的</div>
      {loading ? (
        <div style={{ textAlign:"center", color:t.textMuted, fontSize:12 }}>…</div>
      ) : dreams.length === 0 ? (
        <div style={{ textAlign:"center", color:t.textMuted, fontSize:12 }}>还没有记下来</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[...dreams].reverse().map((d, i) => (
            <div key={i} style={{ padding:"14px 16px", background:t.surface, borderRadius:14, border:`1px solid ${t.surfaceBorder}` }}>
              {d.title && <div style={{ fontSize:12, fontWeight:600, color:t.text, marginBottom:6 }}>{d.title}</div>}
              <div style={{ fontSize:12, color:t.text, lineHeight:1.9, whiteSpace:"pre-wrap" }}>{d.text}</div>
              {d.date && <div style={{ marginTop:8, fontSize:10, color:t.textMuted }}>{d.date}</div>}
            </div>
          ))}
        </div>
      )}
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
