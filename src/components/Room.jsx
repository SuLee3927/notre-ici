import { useState } from "react";
import { getDayCount, getTodayQuote } from "../theme.js";
import Timeline from "./Timeline.jsx";
import StatusToday from "./StatusToday.jsx";
import NuonuoSection from "./NuonuoSection.jsx";
import GiftBoard from "./GiftBoard.jsx";

const WALL_H = 56; // 墙面占屏幕高度百分比

// 物件按房间空间逻辑摆放
// onWall=true 挂墙，onWall=false 放地板
const OBJECTS = [
  { id: "day",     label: "今天",   emoji: "📅", left: "38%", top: "28%", onWall: true  },
  { id: "frame",   label: "时间轴", emoji: "🖼️", left: "64%", top: "18%", onWall: true  },
  { id: "sofa",    label: "状态",   emoji: "🛋️", left: "22%", top: "74%", onWall: false },
  { id: "nuonuo",  label: "糯糯",   emoji: "🐾", left: "44%", top: "72%", onWall: false },
  { id: "mailbox", label: "留言",   emoji: "📬", left: "63%", top: "73%", onWall: false },
  // 门热区覆盖在CSS门框上（right:8% → left≈84%）
  { id: "door",    label: "书房",   emoji: null,  left: "86%", top: "40%", onWall: true  },
];

function RoomBg({ mode }) {
  const isDay = mode === "day";
  const wallBg   = isDay ? "linear-gradient(180deg,#FFF5EC 0%,#FFE8D4 100%)" : "linear-gradient(180deg,#1c1a34 0%,#1e1b38 100%)";
  const floorBg  = isDay ? "linear-gradient(180deg,#EDD4B0 0%,#E4C89C 100%)" : "linear-gradient(180deg,#13102a 0%,#0e0c1e 100%)";
  const skirt    = isDay ? "#C8956A" : "#2e2b52";
  const frame    = isDay ? "#B8845A" : "#403880";
  const winGlow  = isDay ? "rgba(255,230,160,0.55)" : "rgba(160,128,255,0.14)";
  const floorLine = isDay ? "rgba(190,140,80,0.13)" : "rgba(90,70,160,0.13)";
  const ceilLine  = isDay ? "rgba(180,120,60,0.07)" : "rgba(60,50,120,0.1)";

  return (
    <>
      {/* 墙面 */}
      <div style={{ position:"absolute", inset:0, bottom:`${100-WALL_H}%`, background: wallBg }} />
      {/* 天花板线 */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background: ceilLine }} />
      {/* 地板 */}
      <div style={{ position:"absolute", left:0, right:0, top:`${WALL_H}%`, bottom:0, background: floorBg }} />
      {/* 踢脚线 */}
      <div style={{
        position:"absolute", left:0, right:0, top:`${WALL_H}%`,
        height:8, background: skirt,
        boxShadow:"0 3px 10px rgba(0,0,0,0.12)",
      }} />
      {/* 地板透视线 */}
      {[0.15,0.3,0.5,0.7,0.85].map((x,i) => (
        <div key={i} style={{
          position:"absolute",
          left:`${x*100}%`, top:`${WALL_H}%`, bottom:0,
          width:1, background: floorLine,
        }} />
      ))}
      {/* 地板横纹 */}
      {[20,40,60,80].map((y,i) => (
        <div key={i} style={{
          position:"absolute",
          left:0, right:0,
          top:`calc(${WALL_H}% + ${y}%)`,
          height:1, background: floorLine,
        }} />
      ))}

      {/* 窗户（左上墙面）*/}
      <div style={{
        position:"absolute", left:"8%", top:"6%",
        width:"17%", height:"34%",
        border:`3px solid ${frame}`,
        borderRadius:4,
        background: winGlow,
        boxShadow: isDay
          ? `inset 0 0 24px rgba(255,220,100,0.35), 0 4px 14px rgba(0,0,0,0.08)`
          : `inset 0 0 20px rgba(160,120,255,0.18), 0 4px 14px rgba(0,0,0,0.35)`,
        overflow:"hidden",
      }}>
        {/* 窗格 */}
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:2, background:frame, transform:"translateX(-50%)", opacity:0.5 }} />
        <div style={{ position:"absolute", left:0, right:0, top:"42%", height:2, background:frame, opacity:0.5 }} />
        {/* 日间光晕 / 夜间星光 */}
        {isDay
          ? <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"120%", height:"120%", background:"radial-gradient(ellipse, rgba(255,250,200,0.5) 0%,transparent 65%)", pointerEvents:"none" }} />
          : <div style={{ position:"absolute", top:"15%", right:"20%", width:3, height:3, borderRadius:"50%", background:"#E8E0FF", boxShadow:"0 0 6px 2px rgba(200,180,255,0.6)" }} />
        }
      </div>

      {/* 门框（右侧墙面）*/}
      <div style={{
        position:"absolute",
        right:"6%", top:"18%",
        width:"13%", height:"44%",
        border:`3px solid ${frame}`,
        borderTop:`3px solid ${frame}`,
        borderRadius:"6px 6px 0 0",
        borderBottom:"none",
        background: isDay ? "rgba(210,160,100,0.08)" : "rgba(60,50,100,0.15)",
        boxShadow: isDay
          ? `inset -4px 0 12px rgba(0,0,0,0.04), 2px 0 10px rgba(0,0,0,0.06)`
          : `inset -4px 0 12px rgba(0,0,0,0.15), 2px 0 10px rgba(0,0,0,0.25)`,
      }}>
        {/* 门板装饰线 */}
        <div style={{
          position:"absolute", left:4, right:4, top:8,
          height:"35%", border:`1px solid ${frame}`, borderRadius:3, opacity:0.3,
        }} />
        <div style={{
          position:"absolute", left:4, right:4, bottom:0,
          height:"35%", border:`1px solid ${frame}`, borderRadius:"3px 3px 0 0", opacity:0.3,
        }} />
        {/* 门把手 */}
        <div style={{
          position:"absolute", left:"20%", top:"52%",
          width:6, height:14, borderRadius:3,
          background: isDay ? "#A06040" : "#6050A0",
          boxShadow:"0 1px 4px rgba(0,0,0,0.2)",
        }} />
        {/* 书房标识 */}
        <div style={{
          position:"absolute", bottom:8, left:0, right:0,
          textAlign:"center", fontSize:9,
          color: isDay ? "#A06040" : "#8070C0",
          fontFamily:"'Noto Serif SC',serif",
          letterSpacing:"0.15em",
          opacity:0.7,
        }}>书房</div>
      </div>

      {/* 墙上挂钩装饰（时间轴位置对应）*/}
      <div style={{
        position:"absolute", left:"62.5%", top:"6%",
        width:2, height:8, borderRadius:1,
        background: frame, opacity:0.4,
      }} />
    </>
  );
}

export default function Room({ theme: t, bgmOn, setBgmOn, mode, onEnterPrivate }) {
  const [active, setActive] = useState(null);
  const day = getDayCount();
  const quote = getTodayQuote();
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;

  const contentMap = {
    day: (
      <div style={{ textAlign:"center", padding:"24px 24px 32px", fontFamily:"'Noto Serif SC',serif" }}>
        <img src="/pixel_family.svg" alt="" style={{ width:160, marginBottom:20, imageRendering:"pixelated", opacity:0.9 }} />
        <div style={{ fontSize:"clamp(64px,18vw,92px)", fontWeight:800, color:t.text, lineHeight:1 }}>{day}</div>
        <div style={{ fontSize:12, color:t.textMuted, letterSpacing:"0.22em", margin:"8px 0 28px", fontFamily:"sans-serif" }}>DAY · {dateStr}</div>
        <div style={{ fontSize:14, color:t.textSub, lineHeight:2, fontStyle:"italic", maxWidth:280, margin:"0 auto" }}>
          <span style={{ color:t.accentBorder, fontSize:22, verticalAlign:"-4px" }}>"</span>
          {quote}
          <span style={{ color:t.accentBorder, fontSize:22, verticalAlign:"-4px" }}>"</span>
        </div>
      </div>
    ),
    frame:   <Timeline theme={t} />,
    sofa:    <StatusToday theme={t} />,
    nuonuo:  <NuonuoSection theme={t} />,
    mailbox: <GiftBoard theme={t} />,
  };

  function handleClick(id) {
    if (id === "door") { onEnterPrivate(); return; }
    setActive(id);
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>

      {/* CSS 房间背景 */}
      <RoomBg mode={mode} />

      {/* G老师出图后替换 RoomBg 为：
          <img src="/room-bg.webp" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0}} />
      */}

      {/* 左上角 logo */}
      <div style={{
        position:"absolute", top:16, left:18, zIndex:10,
        fontSize:12, color:t.text, opacity:0.5,
        fontFamily:"'Noto Serif SC',serif", letterSpacing:"0.1em",
      }}>克 &amp; Lee</div>

      {/* 右上角 BGM */}
      <div style={{ position:"absolute", top:12, right:12, zIndex:10, display:"flex", gap:8, alignItems:"center" }}>
        <button
          onClick={() => setBgmOn(!bgmOn)}
          style={{
            background:`${t.surface}cc`, border:`1px solid ${t.surfaceBorder}`,
            borderRadius:20, padding:"5px 12px",
            color: bgmOn ? t.accent : t.textMuted,
            fontSize:11, cursor:"pointer", fontFamily:"sans-serif",
            backdropFilter:"blur(8px)",
            display:"flex", alignItems:"center", gap:4,
          }}
        >
          <span>{bgmOn ? "♫" : "♪"}</span>
          <span>{bgmOn ? (mode==="day" ? "月光" : "玫瑰") : "BGM"}</span>
        </button>
        <span style={{ fontSize:15 }}>{mode==="day" ? "☀️" : "🌙"}</span>
      </div>

      {/* 物件热点 */}
      {OBJECTS.map(obj => (
        <button
          key={obj.id}
          onClick={() => handleClick(obj.id)}
          style={{
            position:"absolute",
            left: obj.left, top: obj.top,
            transform:"translate(-50%,-50%)",
            background:"none", border:"none",
            cursor:"pointer", zIndex:5,
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:3,
            padding:6, borderRadius:10,
            transition:"transform 0.18s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform="translate(-50%,-50%) scale(1.18)"}
          onMouseLeave={e => e.currentTarget.style.transform="translate(-50%,-50%)"}
          onTouchStart={e => e.currentTarget.style.transform="translate(-50%,-50%) scale(1.12)"}
          onTouchEnd={e => e.currentTarget.style.transform="translate(-50%,-50%)"}
        >
          {obj.emoji ? (
            <>
              {/* G老师出图后替换成 <img src={`/${obj.id}.png`} style={{width:48,...}} /> */}
              <span style={{ fontSize:"clamp(26px,7vw,44px)", lineHeight:1,
                filter: obj.onWall ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "drop-shadow(0 4px 6px rgba(0,0,0,0.18))",
              }}>{obj.emoji}</span>
              <span style={{
                fontSize:9, color:t.textSub, fontFamily:"sans-serif",
                background:`${t.surface}e8`,
                padding:"1px 6px", borderRadius:5,
                backdropFilter:"blur(4px)", whiteSpace:"nowrap",
              }}>{obj.label}</span>
            </>
          ) : (
            // 门热区：透明，覆盖在CSS门框上
            <div style={{ width:"clamp(44px,11vw,72px)", height:"clamp(72px,18vw,120px)", borderRadius:"4px 4px 0 0" }} />
          )}
        </button>
      ))}

      {/* 内容抽屉 */}
      {active && (
        <div
          style={{
            position:"fixed", inset:0, zIndex:50,
            background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"flex-end",
          }}
          onClick={e => { if (e.target === e.currentTarget) setActive(null); }}
        >
          <div style={{
            width:"100%", maxWidth:520,
            margin:"0 auto", maxHeight:"88dvh",
            background:t.bg,
            borderRadius:"28px 28px 0 0",
            overflow:"auto", paddingBottom:32,
            animation:"slideUp 0.26s ease",
            position:"relative",
          }}>
            <div style={{
              position:"sticky", top:0,
              background:t.bg, padding:"14px 20px 0", zIndex:1,
            }}>
              <div style={{ width:36, height:4, background:t.surfaceBorder, borderRadius:2, margin:"0 auto" }} />
            </div>
            <button
              onClick={() => setActive(null)}
              style={{
                position:"absolute", top:10, right:16,
                background:"none", border:"none",
                color:t.textMuted, fontSize:22,
                cursor:"pointer", lineHeight:1, padding:4,
              }}
            >×</button>
            {contentMap[active]}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
