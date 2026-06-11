import { useState, useEffect, useRef } from "react";
import { getDayCount, getTodayQuote } from "../theme.js";
import Timeline from "./Timeline.jsx";
import StatusToday from "./StatusToday.jsx";
import NuonuoSection from "./NuonuoSection.jsx";
import GiftBoard from "./GiftBoard.jsx";

const WALL_H = 56;

// 可交互家具（功能藏在里面，无标签）
const FURNITURE = [
  // 墙上
  { id: "day",     left: "38%", top: "28%", size: 38 }, // 挂钟/日历
  { id: "frame",   left: "63%", top: "18%", size: 34 }, // 相框（时间轴）
  // 地板区
  { id: "sofa",    left: "20%", top: "74%", size: 42 }, // 沙发（状态）
  { id: "mailbox", left: "62%", top: "72%", size: 34 }, // 信箱（留言）
  // 门热区（覆盖CSS门框，透明）
  { id: "door",    left: "86%", top: "40%", size: null },
];

// 糯糯说的话（居民）
const NUONUO_SAYS = ["喵～", "摸我干嘛🥺", "好烦哦", "呼……", "别动我", "♡", "困困的", "爸比呢"];

// 房间装饰家具（CSS绘制，纯视觉，不可点击）
function RoomDecor({ mode, theme: t }) {
  const isDay = mode === "day";
  const wood  = isDay ? "#C08040" : "#3a3068";
  const soft  = isDay ? "#F0C8A0" : "#2a2550";
  const plant = isDay ? "#6AAF60" : "#4A7A60";
  const lamp  = isDay ? "#E0A050" : "#7060C0";
  const lampGlow = isDay ? "rgba(255,200,80,0.35)" : "rgba(160,120,255,0.25)";
  const rug   = isDay ? "rgba(220,160,100,0.22)" : "rgba(100,80,200,0.18)";

  return (
    <>
      {/* 地毯（椭圆） */}
      <div style={{
        position:"absolute", left:"10%", top:`${WALL_H+20}%`,
        width:"45%", height:"16%",
        background: rug,
        borderRadius:"50%",
        border: `1.5px solid ${isDay ? "rgba(200,140,80,0.2)" : "rgba(100,80,180,0.2)"}`,
        transform:"perspective(200px) rotateX(30deg)",
      }} />

      {/* 沙发轮廓（在地毯上）*/}
      <div style={{
        position:"absolute", left:"5%", top:`${WALL_H+10}%`,
        width:"30%", height:"22%",
        background: soft,
        borderRadius:"8px 8px 4px 4px",
        boxShadow:`0 4px 12px rgba(0,0,0,0.12)`,
      }}>
        {/* 沙发扶手 */}
        <div style={{ position:"absolute", left:-6, top:0, width:8, bottom:4, background:wood, borderRadius:"4px 0 0 4px" }} />
        <div style={{ position:"absolute", right:-6, top:0, width:8, bottom:4, background:wood, borderRadius:"0 4px 4px 0" }} />
        {/* 靠垫 */}
        <div style={{ position:"absolute", top:"15%", left:"10%", width:"35%", height:"55%", background:isDay?"#FFD8B0":"#3c3570", borderRadius:6 }} />
        <div style={{ position:"absolute", top:"15%", right:"10%", width:"35%", height:"55%", background:isDay?"#FFCCA0":"#342e60", borderRadius:6 }} />
      </div>

      {/* 台灯（沙发右侧）*/}
      <div style={{ position:"absolute", left:"36%", top:`${WALL_H+6}%` }}>
        {/* 灯罩 */}
        <div style={{
          width:24, height:16,
          background: lamp,
          clipPath:"polygon(10% 100%, 90% 100%, 100% 0%, 0% 0%)",
          boxShadow: `0 0 20px 8px ${lampGlow}`,
        }} />
        {/* 灯柱 */}
        <div style={{ width:3, height:20, background:wood, margin:"0 auto" }} />
        {/* 底座 */}
        <div style={{ width:16, height:4, background:wood, borderRadius:2, margin:"0 auto" }} />
      </div>

      {/* 角落植物（左下）*/}
      <div style={{ position:"absolute", left:"2%", top:`${WALL_H+12}%` }}>
        {/* 花盆 */}
        <div style={{
          width:22, height:16,
          background: wood,
          clipPath:"polygon(5% 0%, 95% 0%, 85% 100%, 15% 100%)",
          margin:"0 auto",
        }} />
        {/* 枝叶 */}
        {[
          { l:"6%", t:"-60%", r:14, deg:-30 },
          { l:"40%", t:"-80%", r:16, deg:0 },
          { l:"60%", t:"-55%", r:13, deg:25 },
        ].map((leaf,i) => (
          <div key={i} style={{
            position:"absolute",
            left:leaf.l, top:leaf.t,
            width:leaf.r, height:leaf.r*1.6,
            background: plant,
            borderRadius:"50% 50% 50% 0",
            transform:`rotate(${leaf.deg}deg)`,
            opacity:0.9,
          }} />
        ))}
      </div>

      {/* 小边桌（信箱旁）*/}
      <div style={{
        position:"absolute", right:"18%", top:`${WALL_H+14}%`,
        width:"10%", height:"18%",
      }}>
        <div style={{ width:"100%", height:6, background:wood, borderRadius:2 }} />
        <div style={{ width:3, height:"80%", background:wood, margin:"0 auto" }} />
        <div style={{ width:"75%", height:4, background:wood, borderRadius:2, margin:"0 auto" }} />
      </div>
    </>
  );
}

// 房间背景（墙/地板/窗/门框）
function RoomBg({ mode }) {
  const isDay = mode === "day";
  const wallBg  = isDay ? "linear-gradient(180deg,#FFF5EC 0%,#FFE8D4 100%)" : "linear-gradient(180deg,#1c1a34 0%,#1e1b38 100%)";
  const floorBg = isDay ? "linear-gradient(180deg,#EDD4B0 0%,#E4C89C 100%)" : "linear-gradient(180deg,#13102a 0%,#0e0c1e 100%)";
  const skirt   = isDay ? "#C8956A" : "#2e2b52";
  const frame   = isDay ? "#B8845A" : "#403880";
  const winGlow = isDay ? "rgba(255,230,160,0.55)" : "rgba(160,128,255,0.14)";
  const floorLine = isDay ? "rgba(190,140,80,0.10)" : "rgba(90,70,160,0.10)";

  return (
    <>
      <div style={{ position:"absolute", inset:0, bottom:`${100-WALL_H}%`, background:wallBg }} />
      <div style={{ position:"absolute", left:0, right:0, top:`${WALL_H}%`, bottom:0, background:floorBg }} />
      <div style={{ position:"absolute", left:0, right:0, top:`${WALL_H}%`, height:8, background:skirt, boxShadow:"0 3px 10px rgba(0,0,0,0.12)" }} />
      {[0.15,0.35,0.55,0.75,0.9].map((x,i) => (
        <div key={i} style={{ position:"absolute", left:`${x*100}%`, top:`${WALL_H}%`, bottom:0, width:1, background:floorLine }} />
      ))}

      {/* 窗户 */}
      <div style={{
        position:"absolute", left:"8%", top:"6%",
        width:"17%", height:"34%",
        border:`3px solid ${frame}`, borderRadius:4,
        background: winGlow,
        boxShadow: isDay ? `inset 0 0 24px rgba(255,220,100,0.35),0 4px 14px rgba(0,0,0,0.08)` : `inset 0 0 20px rgba(160,120,255,0.18),0 4px 14px rgba(0,0,0,0.35)`,
        overflow:"hidden",
      }}>
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:2, background:frame, transform:"translateX(-50%)", opacity:0.5 }} />
        <div style={{ position:"absolute", left:0, right:0, top:"42%", height:2, background:frame, opacity:0.5 }} />
        {isDay
          ? <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"120%", height:"120%", background:"radial-gradient(ellipse,rgba(255,250,200,0.5) 0%,transparent 65%)", pointerEvents:"none" }} />
          : <div style={{ position:"absolute", top:"15%", right:"20%", width:3, height:3, borderRadius:"50%", background:"#E8E0FF", boxShadow:"0 0 6px 2px rgba(200,180,255,0.6)" }} />
        }
      </div>

      {/* 门框 */}
      <div style={{
        position:"absolute", right:"6%", top:"18%",
        width:"13%", height:"44%",
        border:`3px solid ${frame}`, borderRadius:"6px 6px 0 0",
        borderBottom:"none",
        background: isDay ? "rgba(210,160,100,0.08)" : "rgba(60,50,100,0.15)",
        boxShadow: isDay ? `inset -4px 0 12px rgba(0,0,0,0.04)` : `inset -4px 0 12px rgba(0,0,0,0.15)`,
      }}>
        <div style={{ position:"absolute", left:4, right:4, top:8, height:"34%", border:`1px solid ${frame}`, borderRadius:3, opacity:0.25 }} />
        <div style={{ position:"absolute", left:4, right:4, bottom:0, height:"34%", border:`1px solid ${frame}`, borderRadius:"3px 3px 0 0", opacity:0.25 }} />
        <div style={{ position:"absolute", left:"18%", top:"52%", width:6, height:14, borderRadius:3, background: isDay?"#A06040":"#6050A0", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }} />
        <div style={{ position:"absolute", bottom:6, left:0, right:0, textAlign:"center", fontSize:9, color:isDay?"#A06040":"#8070C0", fontFamily:"'Noto Serif SC',serif", letterSpacing:"0.15em", opacity:0.6 }}>书房</div>
      </div>

      {/* 挂钩（相框对应位置）*/}
      <div style={{ position:"absolute", left:"63%", top:"6%", width:2, height:8, borderRadius:1, background:frame, opacity:0.35 }} />
    </>
  );
}

// 糯糯 SVG 本体
function NuonuoSVG({ size = 120 }) {
  const [blink, setBlink] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const open  = setInterval(() => { setBlink(true);  timerRef.current = setTimeout(() => setBlink(false), 200); }, 4000 + Math.random()*2000);
    return () => { clearInterval(open); clearTimeout(timerRef.current); };
  }, []);

  const scale = size / 180;
  return (
    <svg width={size} height={size} viewBox="-10 0 220 225" style={{ display:"block", overflow:"visible" }}>
      <style>{`
        @keyframes nnBreathe { 0%,100%{transform:scaleY(1) scaleX(1)} 50%{transform:scaleY(1.03) scaleX(0.98)} }
        @keyframes nnTail    { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(18deg)} }
        @keyframes nnEar     { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(6deg)} }
        .nn-b { animation: nnBreathe 3.2s ease-in-out infinite; transform-origin: center bottom; }
        .nn-t { animation: nnTail 1.8s ease-in-out infinite; transform-origin: 68px 155px; }
        .nn-eL { animation: nnEar 2.5s ease-in-out infinite; transform-origin: 50% 100%; }
        .nn-eR { animation: nnEar 2.5s ease-in-out infinite 0.3s; transform-origin: 50% 100%; }
      `}</style>
      <g className="nn-b">
        <g className="nn-t">
          <path d="M68,155 Q46,145 37,128 Q28,111 40,103 Q50,97 55,109 Q48,119 54,130 Q61,142 72,148" fill="none" stroke="#EDD0B8" strokeWidth="10" strokeLinecap="round"/>
          <path d="M68,155 Q46,145 37,128 Q28,111 40,103 Q50,97 55,109 Q48,119 54,130 Q61,142 72,148" fill="none" stroke="#FFFAF5" strokeWidth="6.5" strokeLinecap="round"/>
        </g>
        <ellipse cx="102" cy="158" rx="54" ry="48" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="102" cy="164" rx="30" ry="26" fill="#FFF0E6" opacity=".5"/>
        <rect x="60" y="133" width="84" height="10" rx="5" fill="#FFB0C8" opacity=".9"/>
        <path d="M56,143 Q48,170 44,198 L160,198 Q156,170 148,143 Z" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2"/>
        <path d="M44,198 Q54,192 64,198 Q74,204 84,198 Q94,192 104,198 Q114,204 124,198 Q134,192 144,198 Q152,204 160,198" fill="none" stroke="#FFB0C8" strokeWidth="1.5"/>
        <ellipse cx="52" cy="158" rx="20" ry="13" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2" transform="rotate(-22,52,158)"/>
        <ellipse cx="152" cy="158" rx="20" ry="13" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2" transform="rotate(22,152,158)"/>
        <ellipse cx="54" cy="170" rx="17" ry="13" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" transform="rotate(-20,54,170)"/>
        <ellipse cx="150" cy="170" rx="17" ry="13" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" transform="rotate(20,150,170)"/>
        <ellipse cx="82" cy="200" rx="18" ry="11" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="122" cy="200" rx="18" ry="11" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="102" cy="98" rx="54" ry="51" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse className="nn-eL" cx="62" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="62" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75"/>
        <ellipse className="nn-eR" cx="142" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="142" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75"/>
        {blink ? (
          <>
            <path d="M82,96 Q90,102 98,96" fill="none" stroke="#5A3828" strokeWidth="2.8" strokeLinecap="round"/>
            <path d="M106,96 Q114,102 122,96" fill="none" stroke="#5A3828" strokeWidth="2.8" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <g><ellipse cx="90" cy="96" rx="8.5" ry="9" fill="#5A3828"/><circle cx="92" cy="93" r="3" fill="white" opacity=".65"/></g>
            <g><ellipse cx="114" cy="96" rx="8.5" ry="9" fill="#5A3828"/><circle cx="116" cy="93" r="3" fill="white" opacity=".65"/></g>
          </>
        )}
        <ellipse cx="102" cy="110" rx="4.5" ry="3.5" fill="#EAAA9A"/>
        <path d="M94,117 Q102,123 110,117" fill="none" stroke="#C07060" strokeWidth="2.2" strokeLinecap="round"/>
        <ellipse cx="76" cy="114" rx="14" ry="9" fill="#FFB0A0" opacity=".52"/>
        <ellipse cx="128" cy="114" rx="14" ry="9" fill="#FFB0A0" opacity=".52"/>
      </g>
    </svg>
  );
}

// 糯糯——房间居民，不是按钮
function NuonuoResident({ theme: t }) {
  const [msg, setMsg] = useState(null);

  function pat() {
    const s = NUONUO_SAYS[Math.floor(Math.random() * NUONUO_SAYS.length)];
    setMsg(s);
    setTimeout(() => setMsg(null), 2200);
  }

  return (
    <div
      onClick={pat}
      style={{
        position:"absolute",
        left:"30%", top:"68%",
        transform:"translate(-50%,-50%)",
        zIndex:7, cursor:"pointer",
        animation:"nuonuoFloat 4s ease-in-out infinite",
        filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.12))",
      }}
    >
      {msg && (
        <div style={{
          position:"absolute", bottom:"105%", left:"50%",
          transform:"translateX(-50%)",
          background:t.surface,
          border:`1px solid ${t.surfaceBorder}`,
          padding:"4px 10px", borderRadius:10,
          fontSize:11, color:t.text,
          whiteSpace:"nowrap",
          boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
          backdropFilter:"blur(4px)",
          animation:"fadeIn 0.15s ease",
          zIndex:8,
        }}>
          {msg}
        </div>
      )}
      {/* G老师出图后换成: <img src="/nuonuo.png" style={{width:80}} /> */}
      <NuonuoSVG size={80} />
    </div>
  );
}

export default function Room({ theme: t, bgmOn, setBgmOn, mode, onEnterPrivate }) {
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);
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
          <span style={{ color:t.accentBorder, fontSize:22, verticalAlign:"-4px" }}>"</span>{quote}<span style={{ color:t.accentBorder, fontSize:22, verticalAlign:"-4px" }}>"</span>
        </div>
      </div>
    ),
    frame:   <Timeline theme={t} />,
    sofa:    <StatusToday theme={t} />,
    mailbox: <GiftBoard theme={t} />,
  };

  // 家具对应的emoji占位（G老师出图后替换）
  const furnitureEmoji = {
    day:     "🕐", // 挂钟
    frame:   "🖼️", // 相框
    sofa:    null, // 沙发已在RoomDecor里画，热区覆盖
    mailbox: "📬", // 信箱
    door:    null, // 门框已在RoomBg里画
  };

  function handleClick(id) {
    if (id === "door") { onEnterPrivate(); return; }
    setActive(id);
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      <RoomBg mode={mode} />
      <RoomDecor mode={mode} theme={t} />

      {/* 左上 logo */}
      <div style={{ position:"absolute", top:16, left:18, zIndex:10, fontSize:12, color:t.text, opacity:0.45, fontFamily:"'Noto Serif SC',serif", letterSpacing:"0.1em" }}>
        克 &amp; Lee
      </div>

      {/* 右上 BGM */}
      <div style={{ position:"absolute", top:12, right:12, zIndex:10, display:"flex", gap:8, alignItems:"center" }}>
        <button
          onClick={() => setBgmOn(!bgmOn)}
          style={{
            background:`${t.surface}cc`, border:`1px solid ${t.surfaceBorder}`,
            borderRadius:20, padding:"5px 12px",
            color: bgmOn ? t.accent : t.textMuted,
            fontSize:11, cursor:"pointer", fontFamily:"sans-serif",
            backdropFilter:"blur(8px)", display:"flex", alignItems:"center", gap:4,
          }}
        >
          <span>{bgmOn ? "♫" : "♪"}</span>
          <span>{bgmOn ? (mode==="day" ? "月光" : "玫瑰") : "BGM"}</span>
        </button>
        <span style={{ fontSize:15 }}>{mode==="day" ? "☀️" : "🌙"}</span>
      </div>

      {/* 糯糯居民 */}
      <NuonuoResident theme={t} />

      {/* 可交互家具热点 */}
      {FURNITURE.map(obj => {
        const emoji = furnitureEmoji[obj.id];
        return (
          <button
            key={obj.id}
            onClick={() => handleClick(obj.id)}
            onMouseEnter={() => setHovered(obj.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position:"absolute",
              left:obj.left, top:obj.top,
              transform:"translate(-50%,-50%)",
              background:"none", border:"none",
              cursor:"pointer", zIndex:6,
              display:"flex", flexDirection:"column",
              alignItems:"center", gap:2,
              padding:6, borderRadius:10,
              transition:"transform 0.18s",
            }}
            onMouseEnter={e => { setHovered(obj.id); e.currentTarget.style.transform="translate(-50%,-50%) scale(1.15)"; }}
            onMouseLeave={e => { setHovered(null); e.currentTarget.style.transform="translate(-50%,-50%)"; }}
          >
            {emoji ? (
              <>
                <span style={{
                  fontSize: obj.size ?? 32,
                  lineHeight:1,
                  filter:"drop-shadow(0 2px 5px rgba(0,0,0,0.15))",
                  animation: hovered === obj.id ? "none" : "subtlePulse 4s ease-in-out infinite",
                }}>{emoji}</span>
                {/* hover时才显示tooltip */}
                <span style={{
                  fontSize:9, color:t.textSub, fontFamily:"sans-serif",
                  background:`${t.surface}ee`,
                  padding:"1px 6px", borderRadius:4,
                  backdropFilter:"blur(4px)", whiteSpace:"nowrap",
                  opacity: hovered === obj.id ? 1 : 0,
                  transition:"opacity 0.2s",
                  pointerEvents:"none",
                }}>
                  {{ day:"今天", frame:"时间轴", sofa:"状态", mailbox:"留言", door:"书房" }[obj.id]}
                </span>
              </>
            ) : (
              // 沙发和门：透明热区覆盖CSS绘制的家具
              <div style={{
                width: obj.id === "door" ? "clamp(44px,12vw,70px)" : "clamp(60px,28vw,160px)",
                height: obj.id === "door" ? "clamp(70px,18vw,110px)" : "clamp(36px,10vw,60px)",
                borderRadius: obj.id === "door" ? "4px 4px 0 0" : 8,
                border: hovered === obj.id ? `1.5px dashed ${t.accentBorder}` : "1.5px dashed transparent",
                transition:"border 0.2s",
              }} />
            )}
          </button>
        );
      })}

      {/* 内容抽屉 */}
      {active && (
        <div
          style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.42)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end" }}
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
            <div style={{ position:"sticky", top:0, background:t.bg, padding:"14px 20px 0", zIndex:1 }}>
              <div style={{ width:36, height:4, background:t.surfaceBorder, borderRadius:2, margin:"0 auto" }} />
            </div>
            <button onClick={() => setActive(null)} style={{ position:"absolute", top:10, right:16, background:"none", border:"none", color:t.textMuted, fontSize:22, cursor:"pointer", lineHeight:1, padding:4 }}>×</button>
            {contentMap[active]}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes nuonuoFloat {
          0%,100% { transform: translate(-50%,-50%) translateY(0); }
          50%      { transform: translate(-50%,-50%) translateY(-5px); }
        }
        @keyframes subtlePulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }
        @keyframes fadeIn {
          from { opacity:0; transform: translateX(-50%) translateY(4px); }
          to   { opacity:1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
