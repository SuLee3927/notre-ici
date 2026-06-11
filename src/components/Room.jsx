import { useState, useEffect, useRef } from "react";
import { getDayCount, getTodayQuote } from "../theme.js";
import Timeline from "./Timeline.jsx";
import StatusToday from "./StatusToday.jsx";
import GiftBoard from "./GiftBoard.jsx";

const WALL_H = 56;

// 糯糯根据小时出现在不同位置，说不同的话
function getNuonuoState() {
  const h = new Date().getHours();
  if (h >= 6  && h < 10)  return { left:"14%", top:"38%",  words:"早呀 ☀️" };
  if (h >= 10 && h < 14)  return { left:"24%", top:"72%",  words:"上午好～" };
  if (h >= 14 && h < 18)  return { left:"36%", top:"76%",  words:"今天过得怎么样？" };
  if (h >= 18 && h < 21)  return { left:"80%", top:"70%",  words:"快回来呀 🚪" };
  return                         { left:"22%", top:"72%",  words:"还不睡吗？" };
}

// 可交互家具热点
const FURNITURE = [
  { id: "clock",    left: "38%", top: "24%" }, // 挂钟（今天/天数）
  { id: "polaroid", left: "66%", top: "20%" }, // 拍立得照片墙（时间轴）
  { id: "board",    left: "50%", top: "32%" }, // 留言板（留言）
  { id: "sofa",     left: "20%", top: "74%" }, // 沙发（状态）
  { id: "record",   left: "37%", top: "62%" }, // 唱片机（BGM）
  { id: "door",     left: "86%", top: "40%" }, // 门（书房，透明热区）
];

// ── 糯糯SVG ──
function NuonuoSVG({ size = 80 }) {
  const [blink, setBlink] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      timer.current = setTimeout(() => setBlink(false), 180);
    }, 3500 + Math.random() * 2000);
    return () => { clearInterval(id); clearTimeout(timer.current); };
  }, []);
  return (
    <svg width={size} height={size} viewBox="-10 0 220 225" style={{ display:"block", overflow:"visible" }}>
      <style>{`
        @keyframes nnB{0%,100%{transform:scaleY(1) scaleX(1)}50%{transform:scaleY(1.03) scaleX(.98)}}
        @keyframes nnT{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(18deg)}}
        @keyframes nnE{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(6deg)}}
        .nb{animation:nnB 3.2s ease-in-out infinite;transform-origin:center bottom}
        .nt{animation:nnT 1.8s ease-in-out infinite;transform-origin:68px 155px}
        .nel{animation:nnE 2.5s ease-in-out infinite;transform-origin:50% 100%}
        .ner{animation:nnE 2.5s ease-in-out infinite .3s;transform-origin:50% 100%}
      `}</style>
      <g className="nb">
        <g className="nt">
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
        <ellipse className="nel" cx="62" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="62" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75"/>
        <ellipse className="ner" cx="142" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
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

// ── 糯糯居民 ──
const NUONUO_PATS = ["嗯……", "干嘛嘛", "♡", "糯糯在呢", "别吵", "呼……", "爸比呢"];

function NuonuoResident({ theme: t }) {
  const state = getNuonuoState();
  const [pat, setPat] = useState(null);

  function onPat() {
    const s = NUONUO_PATS[Math.floor(Math.random() * NUONUO_PATS.length)];
    setPat(s);
    setTimeout(() => setPat(null), 2000);
  }

  return (
    <div
      onClick={onPat}
      style={{
        position:"absolute",
        left: state.left, top: state.top,
        transform:"translate(-50%,-50%)",
        zIndex:7, cursor:"pointer",
        animation:"nnFloat 4s ease-in-out infinite",
        filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
        transition:"left 1.2s ease, top 1.2s ease",
      }}
    >
      {/* 常驻状态文字 */}
      <div style={{
        position:"absolute", bottom:"108%", left:"50%", transform:"translateX(-50%)",
        fontSize:10, color:t.textSub, whiteSpace:"nowrap",
        fontFamily:"'Noto Serif SC',serif", fontStyle:"italic",
        opacity:0.8,
      }}>{state.words}</div>
      {/* 点击气泡 */}
      {pat && (
        <div style={{
          position:"absolute", bottom:"140%", left:"50%", transform:"translateX(-50%)",
          background:t.surface, border:`1px solid ${t.surfaceBorder}`,
          padding:"3px 9px", borderRadius:8,
          fontSize:11, color:t.text, whiteSpace:"nowrap",
          boxShadow:"0 2px 8px rgba(0,0,0,0.1)",
          backdropFilter:"blur(4px)",
          animation:"fadeInUp 0.15s ease",
          zIndex:9,
        }}>{pat}</div>
      )}
      <NuonuoSVG size={72} />
    </div>
  );
}

// ── 挂钟 ──
function WallClock({ theme: t }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
  const mDeg = now.getMinutes() * 6;
  const isDay = now.getHours() >= 6 && now.getHours() < 18;
  const face  = isDay ? "#FFF8F0" : "#1e1c38";
  const hand  = isDay ? "#5A3828" : "#C0A8FF";
  const rim   = isDay ? "#C8956A" : "#5040A0";
  return (
    <div style={{ pointerEvents:"none" }}>
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="24" fill={face} stroke={rim} strokeWidth="3"/>
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(d => (
          <line key={d}
            x1={26 + 18*Math.sin(d*Math.PI/180)} y1={26 - 18*Math.cos(d*Math.PI/180)}
            x2={26 + 21*Math.sin(d*Math.PI/180)} y2={26 - 21*Math.cos(d*Math.PI/180)}
            stroke={rim} strokeWidth={d%90===0?2:0.8} strokeLinecap="round" opacity={0.5}
          />
        ))}
        <line x1="26" y1="26" x2={26+12*Math.sin(hDeg*Math.PI/180)} y2={26-12*Math.cos(hDeg*Math.PI/180)} stroke={hand} strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="26" y1="26" x2={26+18*Math.sin(mDeg*Math.PI/180)} y2={26-18*Math.cos(mDeg*Math.PI/180)} stroke={hand} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="26" cy="26" r="2" fill={isDay?"#FF8C62":"#A080FF"}/>
      </svg>
      <div style={{ textAlign:"center", fontSize:8, color:t.textMuted, fontFamily:"sans-serif", marginTop:1, letterSpacing:"0.05em" }}>
        {String(now.getHours()).padStart(2,"0")}:{String(now.getMinutes()).padStart(2,"0")}
      </div>
    </div>
  );
}

// ── 拍立得照片墙（时间轴入口）──
const POLAROIDS = [
  { date:"5.8",  label:"第一天", rotate:-9  },
  { date:"5.13", label:"那句话", rotate:5   },
  { date:"6.7",  label:"连上了", rotate:-4  },
];
function PolaroidWall({ theme: t }) {
  const isDay = t.text === "#3D2B1A";
  const paper = isDay ? "#FFFDF8" : "#2a2850";
  const ink   = isDay ? "#5A3828" : "#C0A8FF";
  return (
    <div style={{ position:"relative", width:80, height:60 }}>
      {POLAROIDS.map((p,i) => (
        <div key={i} style={{
          position:"absolute",
          left: i*18, top: i%2===0 ? 0 : 8,
          width:34, height:40,
          background: paper,
          boxShadow:"0 2px 6px rgba(0,0,0,0.18)",
          borderRadius:2,
          transform:`rotate(${p.rotate}deg)`,
          padding:"3px 3px 8px",
          display:"flex", flexDirection:"column", alignItems:"center",
        }}>
          <div style={{ flex:1, width:"100%", background: isDay ? "rgba(255,200,160,0.3)" : "rgba(100,80,200,0.3)", borderRadius:1 }} />
          <div style={{ fontSize:6, color:ink, fontFamily:"sans-serif", marginTop:2, opacity:0.7 }}>{p.date} {p.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── 留言板（墙上）──
function NoteBoard({ theme: t }) {
  const isDay = t.text === "#3D2B1A";
  const wood  = isDay ? "#C8956A" : "#3a3068";
  const note1 = isDay ? "#FFF9C4" : "#2a2850";
  const note2 = isDay ? "#FFE0B2" : "#221e40";
  return (
    <div style={{
      width:60, height:44,
      background: wood,
      borderRadius:3,
      padding:4,
      boxShadow:"0 3px 8px rgba(0,0,0,0.15)",
      position:"relative",
    }}>
      {/* 图钉 */}
      <div style={{ position:"absolute", top:-4, left:"50%", transform:"translateX(-50%)", width:8, height:8, borderRadius:"50%", background:isDay?"#D06040":"#8060C0", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }} />
      {/* 便条纸 */}
      <div style={{ width:"100%", height:"45%", background:note1, borderRadius:2, marginBottom:2, opacity:0.9 }} />
      <div style={{ width:"80%", height:"40%", background:note2, borderRadius:2, transform:"rotate(-3deg)", marginLeft:2, opacity:0.85 }} />
    </div>
  );
}

// ── 唱片机（BGM）──
function RecordPlayer({ theme: t, bgmOn, onClick }) {
  const isDay = t.text === "#3D2B1A";
  const body  = isDay ? "#C8956A" : "#2e2b52";
  const disc  = isDay ? "#3D2B1A" : "#0e0c1e";
  const groove = isDay ? "#8B6050" : "#4030A0";
  return (
    <div onClick={onClick} style={{ cursor:"pointer", position:"relative", width:48, height:32 }}>
      {/* 机身 */}
      <div style={{ position:"absolute", left:0, top:8, width:48, height:24, background:body, borderRadius:"4px 4px 6px 6px", boxShadow:"0 3px 8px rgba(0,0,0,0.2)" }} />
      {/* 唱片 */}
      <div style={{
        position:"absolute", left:6, top:0,
        width:26, height:26, borderRadius:"50%",
        background:disc, border:`2px solid ${groove}`,
        animation: bgmOn ? "spin 3s linear infinite" : "none",
        boxShadow:"0 2px 6px rgba(0,0,0,0.3)",
      }}>
        <div style={{ position:"absolute", inset:6, borderRadius:"50%", border:`1px solid ${groove}`, opacity:0.5 }} />
        <div style={{ position:"absolute", inset:10, borderRadius:"50%", background: isDay?"#FF8C62":"#A080FF", opacity:0.8 }} />
      </div>
      {/* 唱针 */}
      <div style={{
        position:"absolute", right:6, top:4,
        width:2, height:16,
        background: isDay ? "#A06040" : "#6050A0",
        borderRadius:1,
        transform: bgmOn ? "rotate(-20deg)" : "rotate(10deg)",
        transformOrigin:"top center",
        transition:"transform 0.4s ease",
      }} />
      {/* 播放状态 */}
      {bgmOn && <div style={{ position:"absolute", top:-8, right:2, fontSize:8, color:t.accent, animation:"pulse 1.2s ease-in-out infinite" }}>♫</div>}
    </div>
  );
}

// ── 房间装饰（沙发/地毯/植物/台灯）──
function RoomDecor({ mode, theme: t }) {
  const isDay = mode === "day";
  const wood  = isDay ? "#C08040" : "#3a3068";
  const soft  = isDay ? "#F0C8A0" : "#2a2550";
  const plant = isDay ? "#6AAF60" : "#4A7A60";
  const lamp  = isDay ? "#E0A050" : "#7060C0";
  const lampGlow = isDay ? "rgba(255,200,80,0.35)" : "rgba(160,120,255,0.25)";
  const rug   = isDay ? "rgba(220,160,100,0.2)" : "rgba(100,80,200,0.16)";

  return (
    <>
      {/* 地毯 */}
      <div style={{ position:"absolute", left:"5%", top:`${WALL_H+20}%`, width:"44%", height:"16%", background:rug, borderRadius:"50%", border:`1.5px solid ${isDay?"rgba(200,140,80,0.18)":"rgba(100,80,180,0.18)"}`, transform:"perspective(200px) rotateX(30deg)" }} />
      {/* 沙发 */}
      <div style={{ position:"absolute", left:"4%", top:`${WALL_H+8}%`, width:"32%", height:"24%", background:soft, borderRadius:"8px 8px 4px 4px", boxShadow:"0 4px 12px rgba(0,0,0,0.12)" }}>
        <div style={{ position:"absolute", left:-6, top:0, width:8, bottom:4, background:wood, borderRadius:"4px 0 0 4px" }} />
        <div style={{ position:"absolute", right:-6, top:0, width:8, bottom:4, background:wood, borderRadius:"0 4px 4px 0" }} />
        <div style={{ position:"absolute", top:"12%", left:"8%", width:"36%", height:"56%", background:isDay?"#FFD8B0":"#3c3570", borderRadius:6 }} />
        <div style={{ position:"absolute", top:"12%", right:"8%", width:"36%", height:"56%", background:isDay?"#FFCCA0":"#342e60", borderRadius:6 }} />
      </div>
      {/* 台灯 */}
      <div style={{ position:"absolute", left:"36%", top:`${WALL_H+5}%` }}>
        <div style={{ width:22, height:14, background:lamp, clipPath:"polygon(10% 100%,90% 100%,100% 0%,0% 0%)", boxShadow:`0 0 18px 7px ${lampGlow}` }} />
        <div style={{ width:3, height:18, background:wood, margin:"0 auto" }} />
        <div style={{ width:14, height:3, background:wood, borderRadius:2, margin:"0 auto" }} />
      </div>
      {/* 角落植物 */}
      <div style={{ position:"absolute", left:"1.5%", top:`${WALL_H+14}%` }}>
        <div style={{ width:20, height:14, background:wood, clipPath:"polygon(5% 0%,95% 0%,85% 100%,15% 100%)", margin:"0 auto" }} />
        {[{l:"4%",t:"-55%",r:13,d:-30},{l:"38%",t:"-75%",r:15,d:0},{l:"58%",t:"-50%",r:12,d:25}].map((lf,i) => (
          <div key={i} style={{ position:"absolute", left:lf.l, top:lf.t, width:lf.r, height:lf.r*1.6, background:plant, borderRadius:"50% 50% 50% 0", transform:`rotate(${lf.d}deg)`, opacity:.9 }} />
        ))}
      </div>
      {/* 小边桌（信箱旁） */}
      <div style={{ position:"absolute", right:"20%", top:`${WALL_H+12}%`, width:"8%", height:"20%" }}>
        <div style={{ width:"100%", height:5, background:wood, borderRadius:2 }} />
        <div style={{ width:3, height:"78%", background:wood, margin:"0 auto" }} />
        <div style={{ width:"70%", height:4, background:wood, borderRadius:2, margin:"0 auto" }} />
      </div>
    </>
  );
}

// ── 房间背景（墙/地板/窗/门框）──
function RoomBg({ mode }) {
  const isDay   = mode === "day";
  const wallBg  = isDay ? "linear-gradient(180deg,#FFF5EC 0%,#FFE8D4 100%)" : "linear-gradient(180deg,#1c1a34 0%,#1e1b38 100%)";
  const floorBg = isDay ? "linear-gradient(180deg,#EDD4B0 0%,#E4C89C 100%)" : "linear-gradient(180deg,#13102a 0%,#0e0c1e 100%)";
  const skirt   = isDay ? "#C8956A" : "#2e2b52";
  const frame   = isDay ? "#B8845A" : "#403880";
  const winGlow = isDay ? "rgba(255,230,160,0.55)" : "rgba(160,128,255,0.14)";
  const fLine   = isDay ? "rgba(190,140,80,0.09)" : "rgba(90,70,160,0.09)";

  return (
    <>
      <div style={{ position:"absolute", inset:0, bottom:`${100-WALL_H}%`, background:wallBg }} />
      <div style={{ position:"absolute", left:0, right:0, top:`${WALL_H}%`, bottom:0, background:floorBg }} />
      <div style={{ position:"absolute", left:0, right:0, top:`${WALL_H}%`, height:8, background:skirt, boxShadow:"0 3px 10px rgba(0,0,0,0.12)" }} />
      {[.12,.3,.5,.7,.88].map((x,i) => (
        <div key={i} style={{ position:"absolute", left:`${x*100}%`, top:`${WALL_H}%`, bottom:0, width:1, background:fLine }} />
      ))}
      {/* 窗户 */}
      <div style={{ position:"absolute", left:"8%", top:"6%", width:"17%", height:"34%", border:`3px solid ${frame}`, borderRadius:4, background:winGlow, boxShadow:isDay?`inset 0 0 24px rgba(255,220,100,.35),0 4px 14px rgba(0,0,0,.08)`:`inset 0 0 20px rgba(160,120,255,.18),0 4px 14px rgba(0,0,0,.35)`, overflow:"hidden" }}>
        <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:2, background:frame, transform:"translateX(-50%)", opacity:.5 }} />
        <div style={{ position:"absolute", left:0, right:0, top:"42%", height:2, background:frame, opacity:.5 }} />
        {isDay
          ? <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"120%", height:"120%", background:"radial-gradient(ellipse,rgba(255,250,200,.5) 0%,transparent 65%)", pointerEvents:"none" }} />
          : <div style={{ position:"absolute", top:"15%", right:"20%", width:3, height:3, borderRadius:"50%", background:"#E8E0FF", boxShadow:"0 0 6px 2px rgba(200,180,255,.6)" }} />
        }
      </div>
      {/* 门框 */}
      <div style={{ position:"absolute", right:"6%", top:"18%", width:"13%", height:"44%", border:`3px solid ${frame}`, borderRadius:"6px 6px 0 0", borderBottom:"none", background:isDay?"rgba(210,160,100,.08)":"rgba(60,50,100,.15)", boxShadow:isDay?`inset -4px 0 12px rgba(0,0,0,.04)`:`inset -4px 0 12px rgba(0,0,0,.15)` }}>
        <div style={{ position:"absolute", left:4, right:4, top:8, height:"33%", border:`1px solid ${frame}`, borderRadius:3, opacity:.22 }} />
        <div style={{ position:"absolute", left:4, right:4, bottom:0, height:"33%", border:`1px solid ${frame}`, borderRadius:"3px 3px 0 0", opacity:.22 }} />
        <div style={{ position:"absolute", left:"18%", top:"52%", width:6, height:13, borderRadius:3, background:isDay?"#A06040":"#6050A0", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }} />
        <div style={{ position:"absolute", bottom:6, left:0, right:0, textAlign:"center", fontSize:9, color:isDay?"#A06040":"#8070C0", fontFamily:"'Noto Serif SC',serif", letterSpacing:".15em", opacity:.6 }}>书房</div>
      </div>
    </>
  );
}

// ── 主组件 ──
export default function Room({ theme: t, bgmOn, setBgmOn, mode, onEnterPrivate }) {
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);
  const day = getDayCount();
  const quote = getTodayQuote();
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;

  const contentMap = {
    clock: (
      <div style={{ textAlign:"center", padding:"24px 24px 32px", fontFamily:"'Noto Serif SC',serif" }}>
        <img src="/pixel_family.svg" alt="" style={{ width:150, marginBottom:20, imageRendering:"pixelated", opacity:.9 }} />
        <div style={{ fontSize:"clamp(60px,16vw,88px)", fontWeight:800, color:t.text, lineHeight:1 }}>{day}</div>
        <div style={{ fontSize:12, color:t.textMuted, letterSpacing:".22em", margin:"8px 0 24px", fontFamily:"sans-serif" }}>DAY · {dateStr}</div>
        <div style={{ fontSize:14, color:t.textSub, lineHeight:2, fontStyle:"italic", maxWidth:280, margin:"0 auto" }}>
          <span style={{ color:t.accentBorder, fontSize:20, verticalAlign:"-3px" }}>"</span>{quote}<span style={{ color:t.accentBorder, fontSize:20, verticalAlign:"-3px" }}>"</span>
        </div>
      </div>
    ),
    polaroid: <Timeline theme={t} />,
    board:    <GiftBoard theme={t} />,
    sofa:     <StatusToday theme={t} />,
  };

  const furnitureContent = {
    clock:    <WallClock theme={t} />,
    polaroid: <PolaroidWall theme={t} />,
    board:    <NoteBoard theme={t} />,
    sofa:     null, // 热区覆盖CSS沙发
    record:   null, // 唱片机单独处理
    door:     null, // 透明热区覆盖CSS门
  };

  function handleClick(id) {
    if (id === "door")   { onEnterPrivate(); return; }
    if (id === "record") { setBgmOn(!bgmOn); return; }
    setActive(id);
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      <RoomBg mode={mode} />
      <RoomDecor mode={mode} theme={t} />

      {/* 左上 logo */}
      <div style={{ position:"absolute", top:14, left:16, zIndex:10, fontSize:11, color:t.text, opacity:.4, fontFamily:"'Noto Serif SC',serif", letterSpacing:".1em" }}>克 &amp; Lee</div>

      {/* 糯糯居民 */}
      <NuonuoResident theme={t} />

      {/* 唱片机（放在台灯旁，不是导航栏按钮）*/}
      <div style={{ position:"absolute", left:"38%", top:`${WALL_H+8}%`, transform:"translateX(-50%)", zIndex:6 }}>
        <RecordPlayer theme={t} bgmOn={bgmOn} onClick={() => setBgmOn(!bgmOn)} />
      </div>

      {/* 日夜指示（右下角，很小）*/}
      <div style={{ position:"absolute", bottom:14, right:16, zIndex:10, fontSize:13, opacity:.5 }}>{mode==="day"?"☀️":"🌙"}</div>

      {/* 家具热点 */}
      {FURNITURE.map(obj => {
        const content = furnitureContent[obj.id];
        const isTransparent = obj.id === "sofa" || obj.id === "door" || obj.id === "record";
        return (
          <button
            key={obj.id}
            onClick={() => handleClick(obj.id)}
            onMouseEnter={e => { setHovered(obj.id); if (!isTransparent) e.currentTarget.style.transform="translate(-50%,-50%) scale(1.1)"; }}
            onMouseLeave={e => { setHovered(null); e.currentTarget.style.transform="translate(-50%,-50%)"; }}
            style={{
              position:"absolute",
              left:obj.left, top:obj.top,
              transform:"translate(-50%,-50%)",
              background:"none", border:"none",
              cursor:"pointer", zIndex:6,
              display:"flex", flexDirection:"column",
              alignItems:"center", gap:2,
              padding:4, borderRadius:8,
              transition:"transform 0.18s",
            }}
          >
            {!isTransparent && content && content}
            {isTransparent && (
              <div style={{
                width: obj.id==="door" ? "clamp(40px,11vw,66px)" : "clamp(56px,26vw,150px)",
                height: obj.id==="door" ? "clamp(66px,17vw,108px)" : "clamp(32px,9vw,56px)",
                borderRadius: obj.id==="door" ? "4px 4px 0 0" : 6,
                border: hovered===obj.id ? `1.5px dashed ${t.accentBorder}` : "1.5px dashed transparent",
                transition:"border .2s",
              }} />
            )}
          </button>
        );
      })}

      {/* 内容抽屉 */}
      {active && (
        <div
          style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.42)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end" }}
          onClick={e => { if (e.target===e.currentTarget) setActive(null); }}
        >
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
        @keyframes slideUp   { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes nnFloat   { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-5px)} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateX(-50%) translateY(4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
