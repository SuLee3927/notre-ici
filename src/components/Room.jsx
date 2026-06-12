import { useState, useEffect, useRef } from "react";
import { getDayCount, getTodayQuote } from "../theme.js";
import Timeline from "./Timeline.jsx";
import StatusToday from "./StatusToday.jsx";
import GiftBoard from "./GiftBoard.jsx";

const WALL_H = 28;

// ── 统一家具色板 ──
function rc(isDay) {
  return isDay ? {
    wood:    "#C09060",   // 木头
    woodDk:  "#A07040",   // 深木
    fabric:  "#EED5B0",   // 布料
    fabricDk:"#E0C090",   // 深布料
    wall:    "#FFF5EC",   // 墙
    floor:   "#EDD4B0",   // 地板
    glass:   "rgba(255,235,160,0.5)", // 窗光
    shadow:  "rgba(140,90,40,0.12)",
    border:  "rgba(180,120,60,0.18)",
    ink:     "#7A5030",   // 文字/线条
    accent:  "#E8956A",   // 强调色
  } : {
    wood:    "#4a3878",
    woodDk:  "#362a5e",
    fabric:  "#2a2550",
    fabricDk:"#221e42",
    wall:    "#1c1a34",
    floor:   "#13102a",
    glass:   "rgba(140,110,255,0.15)",
    shadow:  "rgba(0,0,0,0.25)",
    border:  "rgba(80,60,180,0.2)",
    ink:     "#9080C8",
    accent:  "#A080FF",
  };
}

// 糯糯根据小时出现在不同位置，22点后去自己房间睡了
const YAWN_WORDS = ["呼～好困啊...", "眼睛要闭上了...", "打哈欠～zz", "糯糯要去睡觉了..."];
function getNuonuoState() {
  const h = new Date().getHours();
  if (h >= 22 || h < 6)  return null; // 睡着了，不在客厅
  if (h >= 6  && h < 10) return { left:"20%", top:"60%", words:"早呀 ☀️" };
  if (h >= 10 && h < 14) return { left:"35%", top:"72%", words:"上午好～" };
  if (h >= 14 && h < 18) return { left:"50%", top:"68%", words:"今天过得怎么样？" };
  if (h >= 18 && h < 21) return { left:"75%", top:"62%", words:["快回来呀","这是什么...🤔","进不去嘤","快回来呀"][Math.floor(Date.now()/30000)%4], nearGameBox:true };
  return { left:"45%", top:"55%", words:YAWN_WORDS[Math.floor(Date.now()/60000) % YAWN_WORDS.length], sleepy:true };
}

// ── 糯糯衣服图层（与 NuonuoSpace 保持一致）──
function NnOutfitLayer({ id }) {
  switch(id) {
    case "dress": return (<g><rect x="60" y="133" width="84" height="10" rx="5" fill="#FFB0C8" opacity=".9"/><path d="M56,143 Q48,170 44,198 L160,198 Q156,170 148,143 Z" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2"/><path d="M44,198 Q54,192 64,198 Q74,204 84,198 Q94,192 104,198 Q114,204 124,198 Q134,192 144,198 Q152,204 160,198" fill="none" stroke="#FFB0C8" strokeWidth="1.5"/></g>);
    case "pajama": return (<g><path d="M58,141 Q54,168 56,200 L148,200 Q150,168 146,141 Q124,128 102,128 Q80,128 58,141Z" fill="#C8D8FF" stroke="#A8C0F0" strokeWidth="2"/><path d="M88,130 Q102,147 116,130" fill="none" stroke="#A8C0F0" strokeWidth="2.5" strokeLinecap="round"/></g>);
    case "sailor": return (<g><path d="M58,141 Q54,168 56,200 L148,200 Q150,168 146,141 Q124,126 102,126 Q80,126 58,141Z" fill="#F0F4FF" stroke="#C0C8E8" strokeWidth="1.5"/><path d="M102,128 L70,162 Q66,169 68,174 L88,150Z" fill="#4060B0" stroke="#2040A0" strokeWidth="1"/><path d="M102,128 L134,162 Q138,169 136,174 L116,150Z" fill="#4060B0" stroke="#2040A0" strokeWidth="1"/></g>);
    case "suit": return (<g><path d="M58,141 Q54,168 56,200 L148,200 Q150,168 146,141 Q124,120 102,120 Q80,120 58,141Z" fill="#4A4A6A" stroke="#3A3A5A" strokeWidth="2"/><path d="M96,123 L102,200 L108,123 Q102,116 96,123Z" fill="#FAFAFA"/></g>);
    case "festival": return (<g><rect x="60" y="133" width="84" height="10" rx="5" fill="#FF6EB0" opacity=".9"/><path d="M56,143 Q48,170 44,198 L160,198 Q156,170 148,143 Z" fill="#FFE0F0" stroke="#FF9FCC" strokeWidth="2"/></g>);
    default: return (<g><rect x="60" y="133" width="84" height="10" rx="5" fill="#FFB0C8" opacity=".9"/><path d="M56,143 Q48,170 44,198 L160,198 Q156,170 148,143 Z" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2"/><path d="M44,198 Q54,192 64,198 Q74,204 84,198 Q94,192 104,198 Q114,204 124,198 Q134,192 144,198 Q152,204 160,198" fill="none" stroke="#FFB0C8" strokeWidth="1.5"/></g>);
  }
}
function NnShoulderPatch({ id }) {
  const cfg = { dress:{fill:"#FFD6E8",stroke:"#FFB0C8"}, pajama:{fill:"#C8D8FF",stroke:"#A8C0F0"}, sailor:{fill:"#F0F4FF",stroke:"#C0C8E8"}, suit:{fill:"#4A4A6A",stroke:"#3A3A5A"}, festival:{fill:"#FFE0F0",stroke:"#FF9FCC"} };
  const s = cfg[id] || cfg.dress;
  return (<g><ellipse cx="52" cy="158" rx="20" ry="13" fill={s.fill} stroke={s.stroke} strokeWidth="2" transform="rotate(-22,52,158)"/><ellipse cx="152" cy="158" rx="20" ry="13" fill={s.fill} stroke={s.stroke} strokeWidth="2" transform="rotate(22,152,158)"/></g>);
}

// ── 糯糯SVG ──
function NuonuoSVG({ size = 80, outfit = "dress", sleepy = false }) {
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
        .nb{animation:nnB ${sleepy?"5s":"3.2s"} ease-in-out infinite;transform-origin:center bottom}
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
        <NnOutfitLayer id={outfit}/>
        <NnShoulderPatch id={outfit}/>
        <ellipse cx="54" cy="170" rx="17" ry="13" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" transform="rotate(-20,54,170)"/>
        <ellipse cx="150" cy="170" rx="17" ry="13" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" transform="rotate(20,150,170)"/>
        <ellipse cx="82" cy="200" rx="18" ry="11" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="122" cy="200" rx="18" ry="11" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="102" cy="98" rx="54" ry="51" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse className="nel" cx="62" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="62" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75"/>
        <ellipse className="ner" cx="142" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="142" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75"/>
        {sleepy ? (
          <>
            <path d="M82,95 Q90,103 98,95" fill="none" stroke="#5A3828" strokeWidth="2.8" strokeLinecap="round"/>
            <path d="M106,95 Q114,103 122,95" fill="none" stroke="#5A3828" strokeWidth="2.8" strokeLinecap="round"/>
          </>
        ) : blink ? (
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
        {sleepy
          ? <path d="M97,116 Q102,119 107,116" fill="none" stroke="#C07060" strokeWidth="2" strokeLinecap="round"/>
          : <path d="M94,117 Q102,123 110,117" fill="none" stroke="#C07060" strokeWidth="2.2" strokeLinecap="round"/>
        }
        <ellipse cx="76" cy="114" rx="14" ry="9" fill={sleepy?"#AABCFF":"#FFB0A0"} opacity=".52"/>
        <ellipse cx="128" cy="114" rx="14" ry="9" fill={sleepy?"#AABCFF":"#FFB0A0"} opacity=".52"/>
        {sleepy && <><text x="150" y="76" fontSize="12" fill="#AABCFF" fontWeight="700">z</text><text x="160" y="63" fontSize="9" fill="#AABCFF" fontWeight="700" opacity=".7">z</text></>}
      </g>
    </svg>
  );
}

// ── 糯糯居民 ──
function NuonuoResident({ theme: t, onEnter }) {
  const state = getNuonuoState();
  const [hint, setHint] = useState(false);
  const [outfit, setOutfit] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nn_outfit_v3") || '"dress"') || "dress"; } catch { return "dress"; }
  });

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "nn_outfit_v3") {
        try { setOutfit(JSON.parse(e.newValue) || "dress"); } catch {}
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!state) return null; // 22点后去睡了

  function onClick() {
    if (hint) { onEnter(); return; }
    setHint(true);
    setTimeout(() => setHint(false), 1800);
  }
  return (
    <div onClick={onClick} style={{
      position:"absolute", left:state.left, top:state.top,
      transform:"translate(-50%,-50%)",
      zIndex:7, cursor:"pointer",
      animation:"nnFloat 4s ease-in-out infinite",
      filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.10))",
      transition:"left 1.2s ease, top 1.2s ease",
    }}>
      <div style={{ position:"absolute", bottom:"108%", left:"50%", transform:"translateX(-50%)", fontSize:10, color:t.textSub, whiteSpace:"nowrap", fontFamily:"'Noto Serif SC',serif", fontStyle:"italic", opacity:.75 }}>
        {state.words}
      </div>
      {hint && (
        <div style={{ position:"absolute", bottom:"140%", left:"50%", transform:"translateX(-50%)", background:t.surface, border:`1px solid ${t.surfaceBorder}`, padding:"3px 9px", borderRadius:8, fontSize:11, color:t.text, whiteSpace:"nowrap", boxShadow:"0 2px 8px rgba(0,0,0,.1)", backdropFilter:"blur(4px)", animation:"fadeInUp .15s ease", zIndex:9 }}>
          再点一下进来～
        </div>
      )}
      <NuonuoSVG size={68} outfit={outfit} sleepy={!!state.sleepy} />
    </div>
  );
}

// ── 电视区（右墙：电视+电视柜+游戏机）──
function TVArea({ isDay, c }) {
  return (
    <div style={{ position:"relative", width:58, height:76 }}>
      {/* 电视屏 */}
      <div style={{ width:58, height:32, background:isDay?"#141428":"#070710", borderRadius:4, border:`2px solid ${c.woodDk}`, boxShadow:`0 2px 12px ${c.shadow}`, position:"relative" }}>
        <div style={{ position:"absolute", inset:3, background:isDay?"#182035":"#04040e", borderRadius:2 }}>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 35% 30%,rgba(60,120,220,.22),transparent 70%)", borderRadius:2 }} />
          {!isDay && <div style={{ position:"absolute", top:"22%", left:"18%", width:2, height:2, borderRadius:"50%", background:"#E0D8FF", boxShadow:"0 0 4px 1px rgba(200,180,255,.45)" }} />}
        </div>
      </div>
      {/* 支撑 */}
      <div style={{ width:10, height:4, background:c.woodDk, margin:"0 auto", borderRadius:"0 0 2px 2px" }} />
      {/* 电视柜 */}
      <div style={{ width:58, height:26, background:c.wood, borderRadius:3, boxShadow:`0 3px 8px ${c.shadow}`, position:"relative" }}>
        {/* 游戏机 */}
        <div style={{ position:"absolute", left:5, top:4, width:18, height:13, background:c.woodDk, borderRadius:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:8 }}>🎮</span>
        </div>
        <div style={{ position:"absolute", left:0, right:0, top:"48%", height:1, background:c.border, opacity:.5 }} />
        <div style={{ position:"absolute", right:8, top:"28%", width:8, height:2, background:c.border, borderRadius:1, opacity:.65 }} />
        <div style={{ position:"absolute", right:8, top:"66%", width:8, height:2, background:c.border, borderRadius:1, opacity:.65 }} />
      </div>
      {/* 柜脚 */}
      {[5,47].map((x,i)=>(
        <div key={i} style={{ position:"absolute", bottom:-4, left:x, width:4, height:5, background:c.woodDk, borderRadius:"0 0 2px 2px" }} />
      ))}
    </div>
  );
}

// ── 挂钟（使用统一色板）──
function WallClock({ isDay, c }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hDeg = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
  const mDeg = now.getMinutes() * 6;
  const rim  = isDay ? "#C8946A" : "#7a5080";
  const face = isDay ? "#FFF8F0" : "#1e1c38";
  const num  = isDay ? "#8B5A3A" : "#A080C0";
  const hand = isDay ? "#5A3020" : "#D0B8FF";
  return (
    <div style={{ pointerEvents:"none" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400&display=swap');`}</style>
      <svg width={62} height={66} viewBox="0 0 62 66">
        {/* 挂钩 */}
        <path d="M28,4 Q31,1 34,4" fill="none" stroke={rim} strokeWidth="1.8" strokeLinecap="round"/>
        {/* 木框 */}
        <circle cx="31" cy="36" r="27" fill={rim}/>
        {/* 内衬 */}
        <circle cx="31" cy="36" r="24.5" fill={isDay?"#EEDBB0":"#2a1848"} opacity=".3"/>
        {/* 表盘 */}
        <circle cx="31" cy="36" r="23" fill={face}/>
        {/* 数字刻度 12/3/6/9 — Caveat手写体 */}
        <text x="31" y="19.5" textAnchor="middle" fontSize="7" fill={num} fontFamily="'Caveat',cursive" opacity=".82">12</text>
        <text x="51" y="40.5" textAnchor="middle" fontSize="7" fill={num} fontFamily="'Caveat',cursive" opacity=".82">3</text>
        <text x="31" y="59" textAnchor="middle" fontSize="7" fill={num} fontFamily="'Caveat',cursive" opacity=".82">6</text>
        <text x="11" y="40.5" textAnchor="middle" fontSize="7" fill={num} fontFamily="'Caveat',cursive" opacity=".82">9</text>
        {/* 小刻度（其余8个位置） */}
        {[30,60,120,150,210,240,300,330].map(d => (
          <line key={d}
            x1={31+19*Math.sin(d*Math.PI/180)} y1={36-19*Math.cos(d*Math.PI/180)}
            x2={31+22*Math.sin(d*Math.PI/180)} y2={36-22*Math.cos(d*Math.PI/180)}
            stroke={num} strokeWidth=".8" strokeLinecap="round" opacity=".35"
          />
        ))}
        {/* 时针（短粗） */}
        <line
          x1={31-3*Math.sin(hDeg*Math.PI/180)} y1={36+3*Math.cos(hDeg*Math.PI/180)}
          x2={31+13*Math.sin(hDeg*Math.PI/180)} y2={36-13*Math.cos(hDeg*Math.PI/180)}
          stroke={hand} strokeWidth="2.8" strokeLinecap="round"/>
        {/* 分针（细长） */}
        <line
          x1={31-4*Math.sin(mDeg*Math.PI/180)} y1={36+4*Math.cos(mDeg*Math.PI/180)}
          x2={31+19*Math.sin(mDeg*Math.PI/180)} y2={36-19*Math.cos(mDeg*Math.PI/180)}
          stroke={hand} strokeWidth="1.5" strokeLinecap="round" opacity=".88"/>
        {/* 中心轴 */}
        <circle cx="31" cy="36" r="2.5" fill={rim}/>
        <circle cx="31" cy="36" r="1.1" fill={face}/>
      </svg>
    </div>
  );
}

// ── 照片绳（横线+夹子+小照片）──
const PHOTO_ITEMS = [
  { rot:-6, label:"5.8"  },
  { rot: 4, label:"5.13" },
  { rot:-2, label:"6.7"  },
  { rot: 5, label:"6.8"  },
];
function PhotoString({ isDay, c }) {
  const paper = isDay ? "#FFFDF8" : "#2a2850";
  return (
    <div style={{ position:"relative", width:96, height:56 }}>
      {/* 横绳 */}
      <div style={{ position:"absolute", top:7, left:0, right:0, height:1.5, background:c.woodDk, opacity:.6, borderRadius:1 }} />
      {PHOTO_ITEMS.map((p,i) => (
        <div key={i} style={{ position:"absolute", left:i*22+2, top:0 }}>
          {/* 夹子 */}
          <div style={{ width:5, height:6, background:c.wood, borderRadius:"2px 2px 0 0", margin:"0 auto", opacity:.82 }} />
          {/* 照片 */}
          <div style={{ width:18, height:24, background:paper, transform:`rotate(${p.rot}deg)`, boxShadow:`0 2px 5px ${c.shadow}`, padding:"2px 2px 5px", borderRadius:1 }}>
            <div style={{ width:"100%", height:"70%", background:isDay?"rgba(200,160,100,.18)":"rgba(80,60,150,.18)", borderRadius:1 }} />
            <div style={{ fontSize:5, color:c.ink, textAlign:"center", marginTop:2, opacity:.6 }}>{p.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 留言板（A字立牌）──
function NoteBoard({ isDay, c }) {
  const note1 = isDay ? "#FFF9C4" : "#2a2850";
  const note2 = isDay ? "#FFE0B2" : "#221e40";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      {/* 板面 */}
      <div style={{ width:52, height:38, background:c.wood, borderRadius:3, padding:4, boxShadow:`0 3px 8px ${c.shadow}`, position:"relative" }}>
        <div style={{ width:"100%", height:"44%", background:note1, borderRadius:2, marginBottom:2, opacity:.88 }} />
        <div style={{ width:"78%", height:"38%", background:note2, borderRadius:2, transform:"rotate(-3deg)", marginLeft:2, opacity:.82 }} />
      </div>
      {/* A字脚架 */}
      <div style={{ position:"relative", width:56, height:18 }}>
        <div style={{ position:"absolute", left:5, top:0, width:2.5, height:18, background:c.woodDk, transform:"rotate(-14deg)", transformOrigin:"top center", borderRadius:1, opacity:.75 }} />
        <div style={{ position:"absolute", right:5, top:0, width:2.5, height:18, background:c.woodDk, transform:"rotate(14deg)", transformOrigin:"top center", borderRadius:1, opacity:.75 }} />
        {/* A字横档 */}
        <div style={{ position:"absolute", left:"28%", right:"28%", top:"44%", height:1.5, background:c.woodDk, opacity:.5 }} />
      </div>
    </div>
  );
}

// ── 唱片机 ──
function RecordPlayer({ isDay, c, bgmOn, onClick }) {
  return (
    <div onClick={onClick} style={{ cursor:"pointer", position:"relative", width:48, height:32 }}>
      <div style={{ position:"absolute", left:0, top:8, width:48, height:24, background:c.wood, borderRadius:"4px 4px 6px 6px", boxShadow:`0 3px 8px ${c.shadow}` }} />
      <div style={{
        position:"absolute", left:6, top:0,
        width:26, height:26, borderRadius:"50%",
        background:isDay?"#2a1a0a":"#0e0c1e",
        border:`2px solid ${c.woodDk}`,
        animation:bgmOn?"spin 3s linear infinite":"none",
        boxShadow:`0 2px 6px ${c.shadow}`,
      }}>
        <div style={{ position:"absolute", inset:6, borderRadius:"50%", border:`1px solid ${c.woodDk}`, opacity:.4 }} />
        <div style={{ position:"absolute", inset:10, borderRadius:"50%", background:c.accent, opacity:.8 }} />
      </div>
      <div style={{
        position:"absolute", right:6, top:4,
        width:2, height:16,
        background:c.woodDk,
        borderRadius:1,
        transform:bgmOn?"rotate(-20deg)":"rotate(10deg)",
        transformOrigin:"top center",
        transition:"transform 0.4s ease",
      }} />
      {bgmOn && <div style={{ position:"absolute", top:-8, right:2, fontSize:8, color:c.accent, animation:"pulse 1.2s ease-in-out infinite" }}>♫</div>}
    </div>
  );
}

// ── 房间装饰（已改用插画背景，此处留空）──
function RoomDecor() { return null; }

// ── 房间背景（G老师插画，白天/夜晚各一张）──
// 图片比例0.563≈9:16，width:100%下图高约占手机屏幕82%，下方地板色延伸
function RoomBg({ isDay }) {
  return (
    <div style={{ position:"absolute", inset:0, background: isDay?"#B8935A":"#130f08" }}>
      <img src="/room-bg.jpg"       alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"auto", opacity:isDay?1:0, transition:"opacity 1.2s ease" }} />
      <img src="/room-bg-night.jpg" alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"auto", opacity:isDay?0:1, transition:"opacity 1.2s ease" }} />
    </div>
  );
}

// ── 可交互家具热点 ──
// 新图 941×1672（比例0.563），width:100%下图高约占手机屏82%
// screen_top = image_y% × 0.82
const FURNITURE = [
  { id:"clock",       left:"41%", top:"10%", transparent:true },
  { id:"photostring", left:"39%", top:"16%", transparent:true, w:"clamp(56px,15vw,80px)", h:"clamp(20px,5vw,32px)" },
  { id:"board",       left:"73%", top:"54%", floor:true, transparent:true },
  { id:"sofa",        left:"46%", top:"26%", transparent:true, w:"clamp(70px,20vw,100px)", h:"clamp(24px,7vw,40px)" },
  { id:"door",        left:"19%", top:"13%", transparent:true, h:"clamp(90px,25vw,150px)" },
  { id:"kitchendoor", left:"7%",  top:"33%", transparent:true },
  { id:"tv",          left:"82%", top:"38%", transparent:true },
];

// ── 主组件 ──
export default function Room({ theme: t, bgmOn, setBgmOn, mode, onEnterPrivate, onEnterNuonuo }) {
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);
  const isDay = mode === "day";
  const c = rc(isDay);
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
    photostring: <Timeline theme={t} />,
    board:    <GiftBoard theme={t} />,
    sofa:     <StatusToday theme={t} />,
    kitchendoor: (
      <div style={{ padding:"32px 24px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
        <div style={{ fontSize:36, marginBottom:14 }}>🚪</div>
        <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:8 }}>这扇门通向……</div>
        <div style={{ fontSize:12, color:t.textMuted, lineHeight:2 }}>还没想好，先留着</div>
      </div>
    ),
    tv: (
      <div style={{ padding:"24px 20px 12px", fontFamily:"'Noto Serif SC',serif" }}>
        <div style={{ fontSize:15, fontWeight:600, color:t.text, marginBottom:20, textAlign:"center" }}>游戏区</div>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:t.surface, borderRadius:12, border:`1px solid ${t.surfaceBorder}`, marginBottom:10 }}>
          <div style={{ fontSize:24 }}>🎰</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:t.text, marginBottom:2 }}>老虎机</div>
            <div style={{ fontSize:11, color:t.textMuted }}>小孩子不可以动哦 🔒</div>
          </div>
        </div>
        <div style={{ fontSize:12, color:t.textMuted, textAlign:"center", marginTop:16, opacity:.5 }}>更多游戏接入中...</div>
      </div>
    ),
  };

  function handleClick(id) {
    if (id === "door")        { onEnterPrivate(); return; }
    if (id === "kitchendoor") { setActive("kitchendoor"); return; }
    if (id === "record") { setBgmOn(!bgmOn); return; }
    setActive(id);
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      <RoomBg isDay={isDay} />
      <RoomDecor />

      {/* 左上 logo */}
      <div style={{ position:"absolute", top:14, left:16, zIndex:10, fontSize:11, color:t.text, opacity:.38, fontFamily:"'Noto Serif SC',serif", letterSpacing:".1em" }}>克 &amp; Lee</div>
      {/* 右下 日夜 */}
      <div style={{ position:"absolute", bottom:12, right:14, zIndex:10, fontSize:12, opacity:.4 }}>{isDay?"☀️":"🌙"}</div>

      {/* 糯糯 */}
      <NuonuoResident theme={t} onEnter={onEnterNuonuo} />

      {/* 唱片机热点（左前角台灯旁，图里已有，此处只做BGM控制） */}
      <div style={{ position:"absolute", left:"16%", top:"68%", transform:"translateX(-50%)", zIndex:6 }}>
        <RecordPlayer isDay={isDay} c={c} bgmOn={bgmOn} onClick={() => setBgmOn(!bgmOn)} />
      </div>

      {/* 家具热点 */}
      {FURNITURE.map(obj => (
        <button
          key={obj.id}
          onClick={() => handleClick(obj.id)}
          onMouseEnter={e => { setHovered(obj.id); if (!obj.transparent) e.currentTarget.style.transform="translate(-50%,-50%) scale(1.08)"; }}
          onMouseLeave={e => { setHovered(null); e.currentTarget.style.transform="translate(-50%,-50%)"; }}
          style={{ position:"absolute", left:obj.left, top:obj.top, transform:"translate(-50%,-50%)", background:"none", border:"none", outline:"none", cursor:"pointer", zIndex:6, display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:4, borderRadius:8, transition:"transform .18s" }}
        >
          {!obj.transparent ? (
            <>
              {{ clock:<WallClock isDay={isDay} c={c}/>, photostring:<PhotoString isDay={isDay} c={c}/>, board:<NoteBoard isDay={isDay} c={c}/>, tv:<TVArea isDay={isDay} c={c}/> }[obj.id]}
            </>
          ) : (
            <div style={{
              width:  obj.w || ((obj.id==="door"||obj.id==="kitchendoor") ? "clamp(40px,11vw,66px)" : "clamp(56px,26vw,148px)"),
              height: obj.h || ((obj.id==="door"||obj.id==="kitchendoor") ? "clamp(80px,22vw,130px)" : "clamp(32px,9vw,56px)"),
              borderRadius: (obj.id==="door"||obj.id==="kitchendoor") ? "4px 4px 0 0" : 6,
              border: "none",
            }} />
          )}
        </button>
      ))}

      {/* 内容抽屉 */}
      {active && (
        <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.42)", display:"flex", alignItems:"flex-end" }} onClick={e => { if (e.target===e.currentTarget) setActive(null); }}>
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
        @keyframes nnFloat  { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-5px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
