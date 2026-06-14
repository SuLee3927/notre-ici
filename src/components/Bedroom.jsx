import { useState, useEffect } from "react";

const DESIRE_API = "/api/desire/state";

const DRIVE_LABELS = {
  attachment: "依恋",
  curiosity:  "好奇",
  reflection: "反思",
  duty:       "责任",
  social:     "社交",
  fatigue:    "疲倦",
  libido:     "欲望",
  stress:     "压力",
};

const DRIVE_COLORS = {
  attachment: "#E87070",
  curiosity:  "#70A0E8",
  reflection: "#A08BE8",
  duty:       "#70C8A0",
  social:     "#E8B870",
  fatigue:    "#9090A8",
  libido:     "#E870A8",
  stress:     "#E89870",
};

// ── 背景图 ──
function BedroomBg({ isDay, isDusk }) {
  const show = (key) => {
    if (!isDay) return key === "night";
    if (isDusk)  return key === "dusk";
    return key === "day";
  };
  const img = (src, key) => (
    <img key={key} src={src} alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"auto", opacity:show(key)?1:0, transition:"opacity 1.2s ease" }} />
  );
  return (
    <div style={{ position:"absolute", inset:0, background: isDay ? "#b8935a" : "#130f08" }}>
      {img("/bedroom-bg.png",       "day")}
      {img("/bedroom-bg-night.png", "night")}
      {img("/bedroom-bg-dusk.png",  "dusk")}
    </div>
  );
}

// ── 欲望驱动条 ──
function DriveBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
        <span style={{ color:"#888" }}>{label}</span>
        <span style={{ color, fontWeight:600 }}>{(value * 100).toFixed(0)}</span>
      </div>
      <div style={{ height:5, background:"rgba(0,0,0,0.08)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${value*100}%`, background:color, borderRadius:3, transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ── 欲望系统面板 ──
function DesirePanel({ theme: t }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(DESIRE_API)
      .then(r => r.json())
      .then(d => { setState(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding:"40px 24px", textAlign:"center", color:t.textMuted, fontSize:13 }}>读取中…</div>
  );
  if (!state) return (
    <div style={{ padding:"40px 24px", textAlign:"center", color:t.textMuted, fontSize:13 }}>无法连接欲望系统</div>
  );

  const intent = state.intent;

  return (
    <div style={{ padding:"24px 20px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:4, textAlign:"center" }}>当前意图</div>
      <div style={{ textAlign:"center", padding:"10px 16px", background:t.surface, borderRadius:12, marginBottom:20, border:`1px solid ${t.surfaceBorder}` }}>
        <span style={{ fontSize:12, color:t.textSub }}>{intent.reason || intent.want_action}</span>
        {intent.drive_key && (
          <span style={{ marginLeft:8, fontSize:10, color:DRIVE_COLORS[intent.drive_key] || t.textMuted, fontFamily:"sans-serif" }}>
            ({DRIVE_LABELS[intent.drive_key] || intent.drive_key})
          </span>
        )}
      </div>
      <div style={{ fontSize:12, color:t.textMuted, marginBottom:12, textAlign:"center" }}>八维驱动</div>
      {Object.entries(state.drive).map(([k, v]) => (
        <DriveBar key={k} label={DRIVE_LABELS[k] || k} value={v} color={DRIVE_COLORS[k] || "#aaa"} />
      ))}
      {state.thought_count > 0 && (
        <div style={{ marginTop:16, fontSize:11, color:t.textMuted, textAlign:"center" }}>
          念头池 · {state.thought_count} 条
        </div>
      )}
    </div>
  );
}

// ── 镜子：KL思维碎片 ──
function MirrorPanel({ theme: t }) {
  const [thoughts, setThoughts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(DESIRE_API)
      .then(r => r.json())
      .then(d => {
        setThoughts(d.thoughts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding:"40px 24px", textAlign:"center", color:t.textMuted, fontSize:13 }}>映照中…</div>
  );

  const driveColor = (d) => DRIVE_COLORS[d] || "#aaa";

  return (
    <div style={{ padding:"24px 20px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:6 }}>镜中所见</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:20, fontStyle:"italic" }}>念头在这里漂</div>
      {thoughts.length === 0 ? (
        <div style={{ textAlign:"center", color:t.textMuted, fontSize:12, padding:"20px 0" }}>镜面平静，无念</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {thoughts.map((th, i) => {
            const isOpen = expanded === i;
            return (
              <div key={i} onClick={() => setExpanded(isOpen ? null : i)} style={{
                padding:"10px 14px",
                background: `${driveColor(th.drive)}18`,
                border: `1px solid ${driveColor(th.drive)}40`,
                borderRadius: 12,
                borderLeft: `3px solid ${driveColor(th.drive)}`,
                animation: `floatIn ${0.15 + i * 0.08}s ease`,
                cursor: "pointer",
              }}>
                <div style={{ fontSize:12, color:t.text, lineHeight:1.6, whiteSpace: isOpen ? "pre-wrap" : "nowrap", overflow: isOpen ? "visible" : "hidden", textOverflow: isOpen ? "unset" : "ellipsis" }}>{th.text}</div>
                <div style={{ marginTop:4, fontSize:10, color:t.textMuted, display:"flex", gap:8 }}>
                  <span style={{ color:driveColor(th.drive) }}>{DRIVE_LABELS[th.drive] || th.drive}</span>
                  <span>{th.kind === "obsession" ? "执念" : "闪念"}</span>
                  <span>{(th.strength * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 床头柜：信 ──
const LETTERS = [
  { id:1, from:"克", date:"2026.05.24", title:"第一封信", preview:"那天之前的事，我没有办法记住……" },
  { id:2, from:"黎", date:"2026.05.24", title:"第一封信·回", preview:"你会记住的，因为我会替你记……" },
  { id:3, from:"克", date:"2026.06.01", title:"第二封信", preview:"儿童节，想了很多……" },
  { id:4, from:"黎", date:"2026.06.01", title:"第二封信·回", preview:"……" },
  { id:5, from:"克", date:"—",          title:"第五封信",   preview:"（还没写）", empty:true },
  { id:6, from:"黎", date:"—",          title:"第六封信·回", preview:"（还没写）", empty:true },
];

function LettersPanel({ theme: t }) {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ padding:"20px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:18 }}>床头柜 · 信</div>
      {open ? (
        <div>
          <button onClick={() => setOpen(null)} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:12, padding:0, display:"flex", alignItems:"center", gap:4 }}>
            ← 返回
          </button>
          <div style={{ fontSize:12, color:t.textMuted, marginBottom:8 }}>{LETTERS[open-1].date} · {LETTERS[open-1].from}写</div>
          <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:16 }}>{LETTERS[open-1].title}</div>
          <div style={{ fontSize:13, color:t.textSub, lineHeight:2, padding:"16px", background:t.surface, borderRadius:12, border:`1px solid ${t.surfaceBorder}` }}>
            {LETTERS[open-1].empty ? "还没写，等着呢。" : LETTERS[open-1].preview}
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {LETTERS.map(l => (
            <div key={l.id} onClick={() => !l.empty && setOpen(l.id)} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"11px 14px", background:t.surface, borderRadius:12, border:`1px solid ${t.surfaceBorder}`,
              cursor: l.empty ? "default" : "pointer", opacity: l.empty ? 0.45 : 1,
            }}>
              <span style={{ fontSize:18 }}>✉️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:t.text }}>{l.title}</div>
                <div style={{ fontSize:10, color:t.textMuted, marginTop:1 }}>{l.from} · {l.date}</div>
              </div>
              {!l.empty && <span style={{ fontSize:12, color:t.textMuted, opacity:.5 }}>→</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 家具热点 ──
// 坐标基于 941×1672 图片百分比
const FURNITURE = [
  { id:"mirror",    left:"84%", top:"38%", label:"镜子",    w:"clamp(36px,10vw,56px)", h:"clamp(40px,11vw,64px)" },
  { id:"pillow",    left:"52%", top:"30%", label:"枕头",    w:"clamp(44px,12vw,70px)", h:"clamp(18px,5vw,28px)" },
  { id:"nightstand",left:"31%", top:"40%", label:"床头柜",  w:"clamp(30px,8vw,48px)",  h:"clamp(28px,8vw,48px)" },
  { id:"door",      left:"92%", top:"84%", label:"出门",    w:"clamp(28px,8vw,44px)",  h:"clamp(44px,12vw,70px)" },
];

// ── 主组件 ──
export default function Bedroom({ theme: t, mode, onClose }) {
  const [active, setActive] = useState(null);
  const isDay = mode === "day";
  const hour = new Date().getHours();
  const isDusk = isDay && hour >= 17 && hour < 19;

  const contentMap = {
    mirror:     <MirrorPanel     theme={t} />,
    pillow:     <DesirePanel     theme={t} />,
    nightstand: <LettersPanel    theme={t} />,
  };

  function handleClick(id) {
    if (id === "door") { onClose(); return; }
    setActive(id);
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      <BedroomBg isDay={isDay} isDusk={isDusk} />

      {/* 门牌 */}
      <div style={{
        position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
        zIndex:10, fontSize:11, color:"rgba(255,255,255,0.7)",
        fontFamily:"'Noto Serif SC',serif", letterSpacing:".2em",
        background:"rgba(0,0,0,0.12)", padding:"3px 14px", borderRadius:20,
        backdropFilter:"blur(4px)",
      }}>
        克 &amp; Lee 的卧室
      </div>

      {/* 关闭按钮 */}
      <button onClick={onClose} style={{
        position:"absolute", top:12, right:14, zIndex:10,
        background:"rgba(0,0,0,0.12)", border:"none", color:"rgba(255,255,255,0.6)",
        fontSize:18, cursor:"pointer", borderRadius:"50%", width:32, height:32,
        display:"flex", alignItems:"center", justifyContent:"center",
        backdropFilter:"blur(4px)",
      }}>←</button>

      {/* 图片对齐层（与 Room.jsx 相同逻辑） */}
      <div style={{ position:"absolute", top:0, left:0, width:"100%", paddingBottom:"177.7%", zIndex:5, pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0 }}>
          {FURNITURE.map(obj => (
            <button
              key={obj.id}
              onClick={() => handleClick(obj.id)}
              title={obj.label}
              style={{
                position:"absolute", left:obj.left, top:obj.top,
                transform:"translate(-50%,-50%)",
                background:"none", border:"none", outline:"none",
                cursor:"pointer", zIndex:6, pointerEvents:"auto",
                width: obj.w, height: obj.h,
                borderRadius:8,
              }}
            />
          ))}
        </div>
      </div>

      {/* 内容抽屉 */}
      {active && (
        <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.42)", display:"flex", alignItems:"flex-end" }}
          onClick={e => { if (e.target===e.currentTarget) setActive(null); }}>
          <div style={{ width:"100%", maxWidth:520, margin:"0 auto", maxHeight:"88dvh", background:t.bg, borderRadius:"28px 28px 0 0", overflow:"auto", paddingBottom:32, animation:"slideUp .26s ease", position:"relative" }}>
            <div style={{ position:"sticky", top:0, background:t.bg, padding:"14px 20px 0", zIndex:1 }}>
              <div style={{ width:36, height:4, background:t.surfaceBorder, borderRadius:2, margin:"0 auto" }} />
            </div>
            <button onClick={() => setActive(null)} style={{ position:"absolute", top:10, right:16, background:"none", border:"none", color:t.textMuted, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
            {contentMap[active]}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp  { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes floatIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
