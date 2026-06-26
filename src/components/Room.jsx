import { useState, useEffect, useRef } from "react";
import { getDayCount, getTodayQuote } from "../theme.js";
import Timeline from "./Timeline.jsx";
import StatusToday from "./StatusToday.jsx";
import GiftBoard from "./GiftBoard.jsx";
import DrawTurtle from "./DrawTurtle.jsx";
import BambooGame from "./BambooGame.jsx";
import GuessGame from "./GuessGame.jsx";
import Billiards from "./Billiards.jsx";
import BasketGame from "./BasketGame.jsx";
import WatchTogether from "./WatchTogether.jsx";
import CraneGame, { getPendingToys, clearPendingToys } from "./CraneGame.jsx";

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

const YAWN_WORDS = ["呼～好困啊...", "眼睛要闭上了...", "打哈欠～zz", "糯糯要去睡觉了..."];
function getNuonuoState() {
  const h = new Date().getHours();
  if (h >= 22 || h < 6) return null;
  return { sleepy: h >= 21 };
}

// 室内热点：位置（百分比）+ 触发用的 context 描述
const HOTSPOTS = [
  { id:"kitchen",     lx:5,  ty:51, context:"（走到厨房门口，闻到饭菜香气，好奇地张望）" },
  { id:"gamepad",     lx:82, ty:33, context:"（发现游戏机，伸手想按按钮）" },
  { id:"sofa",        lx:46, ty:27, context:"（走到沙发旁边，想往上爬）" },
  { id:"watchtv",     lx:46, ty:38, context:"（站在电视前，歪头看画面）" },
  { id:"record",      lx:92, ty:79, context:"（走到唱片机旁，听到音乐声）" },
  { id:"board",       lx:73, ty:51, context:"（发现地板上有个有趣的东西，蹲下来研究）" },
  { id:"door",        lx:19, ty:14, context:"（走到门口，扒着门框往外看）" },
  { id:"kitchendoor", lx:6,  ty:35, context:"（走到卧室门口，探头探脑）" },
];

// 房间内可自由漫游的区域（百分比）
const ROOM_BOUNDS = { minX:10, maxX:88, minY:30, maxY:82 };

function randomRoomPos() {
  const lx = ROOM_BOUNDS.minX + Math.random() * (ROOM_BOUNDS.maxX - ROOM_BOUNDS.minX);
  const ty = ROOM_BOUNDS.minY + Math.random() * (ROOM_BOUNDS.maxY - ROOM_BOUNDS.minY);
  return { lx, ty };
}

function nearestHotspot(lx, ty, threshold = 18) {
  for (const h of HOTSPOTS) {
    const d = Math.sqrt((lx - h.lx) ** 2 + (ty - h.ty) ** 2);
    if (d < threshold) return h;
  }
  return null;
}

// ── 糯糯PNG（G老师插画版，眨眼+随机走路动画）──
function NuonuoPNG({ size = 76, walkFrame = -1, blink = false }) {
  const src = walkFrame >= 0
    ? (walkFrame === 0 ? "/nuonuo-walk1.webp" : "/nuonuo-walk2.webp")
    : (blink ? "/nuonuo-blink.webp" : "/nuonuo.webp");
  return (
    <img src={src} alt="糯糯" style={{ width: size, height: "auto", display: "block" }} />
  );
}

// ── 糯糯互动反应（先用本地兜底，有API就走API）──
const NUONUO_FALLBACK = {
  greet: ["你好呀！♡","哦哦！你来啦！","嘿嘿～糯糯在这里！"],
  pat:   ["嘿嘿～舒服","（眯起眼睛）再摸摸～","糯糯喜欢被摸头♡"],
  pinch: ["哎呀！脸脸！","嘤嘤不要捏啦～","好痛…才怪！嘻嘻"],
};
const NUONUO_ACTION_PROMPT = {
  greet: "（有人跟你打招呼了）",
  pat:   "（有人摸了摸你的头）",
  pinch: "（有人捏了你的小脸）",
};

// ── 糯糯居民 ──
function NuonuoResident({ theme: t, onEnter }) {
  const state = getNuonuoState();
  const [menu, setMenu] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [pending, setPending] = useState(() => getPendingToys());
  const [giftStage, setGiftStage] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [walkFrame, setWalkFrame] = useState(-1);
  const [blink, setBlink] = useState(false);
  const [pos, setPos] = useState(() => randomRoomPos());
  const [moveDur, setMoveDur] = useState(0); // ms，按距离动态设置
  const [bubble, setBubble] = useState(null);
  const clickTimer = useRef(null);
  const blinkTimer = useRef(null);
  const walkTimer = useRef(null);
  const bubbleTimer = useRef(null);
  const lastHotspot = useRef(null);
  const posRef = useRef(pos); // 用 ref 在 effect 里读当前位置
  const hasToys = pending.length > 0;

  useEffect(() => {
    function scheduleBlink() {
      blinkTimer.current = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); scheduleBlink(); }, 300);
      }, 2000 + Math.random() * 2000);
    }
    scheduleBlink();

    async function triggerHotspot(hotspot) {
      if (lastHotspot.current === hotspot.id) return; // 同一热点不重复
      lastHotspot.current = hotspot.id;
      try {
        const r = await fetch("/api/nuonuo/messages/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: hotspot.context, author: "糯糯", context: "" }),
        });
        const d = await r.json();
        // 取最新一条消息的糯糯回复
        const msgs = d.messages || [];
        const last = msgs[msgs.length - 1];
        const reply = last?.replies?.find?.(r => r.author === "糯糯")?.text || last?.text;
        if (reply) {
          clearTimeout(bubbleTimer.current);
          setBubble(reply);
          bubbleTimer.current = setTimeout(() => { setBubble(null); lastHotspot.current = null; }, 5000);
        }
      } catch {}
    }

    function scheduleWalk() {
      const delay = 5000 + Math.random() * 7000;
      walkTimer.current = setTimeout(() => {
        let target;
        if (Math.random() < 0.3) {
          const h = HOTSPOTS[Math.floor(Math.random() * HOTSPOTS.length)];
          target = {
            lx: Math.min(ROOM_BOUNDS.maxX, Math.max(ROOM_BOUNDS.minX, h.lx + (Math.random() - 0.5) * 8)),
            ty: Math.min(ROOM_BOUNDS.maxY, Math.max(ROOM_BOUNDS.minY, h.ty + (Math.random() - 0.5) * 8)),
          };
        } else {
          target = randomRoomPos();
        }

        // 按实际距离算时长：每 1% 约 55ms，最短 2.5s
        const cur = posRef.current;
        const dist = Math.sqrt((target.lx - cur.lx) ** 2 + (target.ty - cur.ty) ** 2);
        const walkDur = Math.max(2500, dist * 55);

        // 先启动走路帧，再下一帧改位置，确保帧动画先渲染
        setWalkFrame(0);
        let f = 0;
        const iv = setInterval(() => { f = (f + 1) % 2; setWalkFrame(f); }, 280);

        requestAnimationFrame(() => {
          setMoveDur(walkDur);
          setPos(target);
          posRef.current = target;
        });

        setTimeout(() => {
          clearInterval(iv);
          setWalkFrame(-1);
          const hotspot = nearestHotspot(target.lx, target.ty);
          if (hotspot) triggerHotspot(hotspot);
          scheduleWalk();
        }, walkDur);
      }, delay);
    }
    scheduleWalk();

    return () => {
      clearTimeout(blinkTimer.current);
      clearTimeout(walkTimer.current);
      clearTimeout(bubbleTimer.current);
    };
  }, []);

  useEffect(() => {
    async function check() {
      const local = getPendingToys();
      let server = [];
      try {
        const r = await fetch("/api/farm/gifts");
        const d = await r.json();
        server = (d.gifts || []).map(g => ({ ...g.toy, from: g.from, playerId: g.from, source: "server" }));
      } catch {}
      setPending([...local, ...server]);
    }
    check();
    const id = setInterval(check, 3000);
    window.addEventListener("focus", check);
    return () => { clearInterval(id); window.removeEventListener("focus", check); };
  }, []);

  if (!state) return null;

  function onClick() {
    if (giftStage || reaction) return;
    setClickCount(c => c + 1);
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      setClickCount(prev => {
        if (prev >= 2) { onEnter(); }
        else { setMenu(m => !m); }
        return 0;
      });
    }, 280);
  }

  async function doReact(type) {
    setMenu(false);
    const fallback = NUONUO_FALLBACK[type];
    setReaction(fallback[Math.floor(Math.random() * fallback.length)]);
    try {
      const r = await fetch("/api/nuonuo/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: "访客", text: NUONUO_ACTION_PROMPT[type] }),
      });
      const d = await r.json();
      const msgs = d.messages || [];
      const last = msgs[msgs.length - 1];
      const reply = last?.replies?.[last.replies.length - 1];
      if (reply?.text) setReaction(reply.text.slice(0, 30));
    } catch {}
    setTimeout(() => setReaction(null), 3000);
  }

  function doGiftAction() {
    if (!hasToys) return;
    setMenu(false);
    setGiftStage("confirm");
  }

  async function doGift() {
    setGiftStage("done");
    clearPendingToys();
    setPending([]);
    fetch("/api/farm/gifts", { method: "DELETE" }).catch(() => {});
    setTimeout(() => setGiftStage(null), 2400);
  }

  const menuBg = t.surface || "rgba(255,250,240,0.95)";
  const menuBorder = t.surfaceBorder || "rgba(180,120,60,0.2)";

  return (
    <>
      {giftStage && (
        <div style={{
          position:"fixed", inset:0, zIndex:30,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(10,7,4,0.62)", backdropFilter:"blur(4px)",
        }} onClick={giftStage === "done" ? () => setGiftStage(null) : undefined}>
          <div style={{
            background:"rgba(20,14,6,0.96)",
            border:"1px solid rgba(200,160,60,0.4)",
            borderRadius:20, padding:"28px 32px", maxWidth:280, width:"90%",
            textAlign:"center", fontFamily:"'Noto Serif SC',serif",
            boxShadow:"0 8px 40px rgba(0,0,0,0.7)",
          }}>
            {giftStage === "confirm" && (
              <>
                <div style={{ fontSize:36, marginBottom:12 }}>
                  {pending.map(p => p.emoji).join(" ")}
                </div>
                <div style={{ fontSize:14, color:"#C8A040", fontWeight:600, marginBottom:6 }}>
                  送给糯糯？
                </div>
                <div style={{ fontSize:11, color:"rgba(180,150,80,0.7)", marginBottom:20, lineHeight:1.8 }}>
                  {pending.map(p => `${p.emoji}${p.name}（${p.playerId}）`).join("、")}
                </div>
                <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                  <button onClick={() => setGiftStage(null)} style={{
                    padding:"8px 20px", borderRadius:10, fontSize:12, cursor:"pointer",
                    border:"1px solid rgba(120,90,50,0.4)",
                    background:"transparent", color:"rgba(160,130,70,0.6)",
                    fontFamily:"inherit",
                  }}>等等</button>
                  <button onClick={doGift} style={{
                    padding:"8px 20px", borderRadius:10, fontSize:12, cursor:"pointer",
                    border:"1px solid rgba(200,160,60,0.6)",
                    background:"rgba(200,160,60,0.12)", color:"#C8A040",
                    fontFamily:"inherit", fontWeight:600,
                  }}>送出去 🎁</button>
                </div>
              </>
            )}
            {giftStage === "done" && (
              <>
                <div style={{ fontSize:44, marginBottom:10 }}>🥰</div>
                <div style={{ fontSize:14, color:"#C8A040", fontWeight:600, marginBottom:6 }}>
                  糯糯好开心！
                </div>
                <div style={{ fontSize:11, color:"rgba(180,150,80,0.6)", lineHeight:1.8 }}>
                  谢谢你，她会好好珍惜的
                </div>
                <div style={{ marginTop:14, fontSize:10, color:"rgba(130,100,50,0.4)" }}>点任意处关闭</div>
              </>
            )}
          </div>
        </div>
      )}

      {menu && (
        <div style={{ position:"fixed", inset:0, zIndex:28 }} onClick={() => setMenu(false)} />
      )}

      <div onClick={onClick} style={{
        position:"absolute",
        left:`${pos.lx}%`,
        top:`${pos.ty}%`,
        transform:"translate(-50%,-50%)",
        zIndex:7, cursor:"pointer",
        animation: walkFrame < 0 ? "nnFloat 5s ease-in-out infinite" : "none",
        filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.10))",
        transition: moveDur > 0 ? `left ${moveDur}ms linear, top ${moveDur}ms linear` : "none",
      }}>
        {(reaction || bubble) ? (
          <div style={{
            position:"absolute", bottom:"108%", left:"50%", transform:"translateX(-50%)",
            background: t.surface || "rgba(255,248,235,0.95)",
            border: `1.5px solid ${t.surfaceBorder || "rgba(180,140,80,0.3)"}`,
            borderRadius:10, padding:"5px 10px", fontSize:11, color: t.text,
            fontFamily:"'Noto Serif SC',serif",
            boxShadow:"0 2px 8px rgba(0,0,0,0.15)", maxWidth:140, textAlign:"center", lineHeight:1.5,
            whiteSpace:"normal",
          }}>
            {reaction || bubble}
          </div>
        ) : (state?.sleepy ? (
          <div style={{ position:"absolute", bottom:"108%", left:"50%", transform:"translateX(-50%)", fontSize:10, color:t.textSub, whiteSpace:"nowrap", fontFamily:"'Noto Serif SC',serif", fontStyle:"italic", opacity:.6 }}>
            {YAWN_WORDS[Math.floor(Date.now()/60000) % YAWN_WORDS.length]}
          </div>
        ) : null)}
        {hasToys && !menu && (
          <div style={{
            position:"absolute", top:-8, right:-8,
            background:"#C8A040", color:"#1A1008",
            borderRadius:"50%", width:20, height:20,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, fontWeight:700, zIndex:9,
            boxShadow:"0 2px 6px rgba(0,0,0,0.4)",
            animation:"pulse 1.2s ease-in-out infinite",
          }}>
            {pending.length}
          </div>
        )}
        {menu && (() => {
          const items = [
            { emoji:"👋", label:"打招呼", action:() => doReact("greet") },
            { emoji:"🤲", label:"摸摸头", action:() => doReact("pat") },
            { emoji:"🤏", label:"捏小脸", action:() => doReact("pinch") },
            { emoji:"🎁", label:"送礼物", action:doGiftAction, disabled:!hasToys },
          ];
          const radius = 60;
          const startAngle = -160;
          const sweep = 140;
          const step = sweep / (items.length - 1);
          return items.map((btn, i) => {
            const angle = (startAngle + step * i) * Math.PI / 180;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return (
              <button key={i} onClick={e => { e.stopPropagation(); btn.action(); }}
                disabled={btn.disabled}
                style={{
                  position:"absolute",
                  left:`calc(50% + ${x}px)`, top:`calc(50% + ${y}px)`,
                  transform:"translate(-50%,-50%)",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:1,
                  padding:"6px", borderRadius:"50%", border:`1px solid ${menuBorder}`,
                  background:menuBg, cursor:btn.disabled ? "default" : "pointer",
                  opacity:btn.disabled ? 0.35 : 1,
                  width:42, height:42,
                  justifyContent:"center",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.12)", backdropFilter:"blur(6px)",
                  zIndex:29,
                  animation:`fadeInUp .2s ease ${i * 0.04}s both`,
                  transition:"transform 0.15s",
                }}
                onMouseEnter={e => { if(!btn.disabled) e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translate(-50%,-50%)"; }}
              >
                <span style={{ fontSize:18, lineHeight:1 }}>{btn.emoji}</span>
                <span style={{ fontSize:7, color:t.textMuted || "#999", lineHeight:1, fontFamily:"'Noto Serif SC',serif" }}>{btn.label}</span>
              </button>
            );
          });
        })()}
        <NuonuoPNG size={76} walkFrame={walkFrame} blink={blink} />
      </div>
    </>
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
      <style>{`@import url('https://fonts.loli.net/css2?family=Caveat:wght@400&display=swap');`}</style>
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

// ── 窗口天气叠加 ──
// 窗外风景叠加：黄昏/雨天叠对应风景图；晴天/阴天用背景本身的窗户视角
function getWeatherSrc(isDusk, weatherKey) {
  if (weatherKey === "rain")       return "/weather-rain.jpg";
  if (weatherKey === "rain-light") return "/weather-rain-light.jpg";
  return null;
}

function WeatherWindow({ isDusk, weatherKey }) {
  const src = getWeatherSrc(isDusk, weatherKey);
  if (!src) return null;
  return (
    <div style={{
      position:"absolute", left:"52%", top:"7.8%",
      width:"23%", height:"6%",
      overflow:"hidden", borderRadius:2,
      zIndex:2, pointerEvents:"none",
    }}>
      <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 25%", display:"block" }} />
    </div>
  );
}

// ── 房间装饰（已改用插画背景，此处留空）──
function RoomDecor() { return null; }

// ── 房间背景（G老师插画全套：晴/阴/小雨/大雨/黄昏/夜）──
// weatherKey: null=晴天, "cloudy"=阴天, "rain-light"=小雨, "rain"=大雨
// isDusk 由 hour 决定（17-19），优先级高于 weatherKey
function RoomBg({ isDay, weatherKey, isDusk }) {
  const show = (key) => {
    if (!isDay) return key === "night";
    if (isDusk)  return key === "dusk";
    return key === (weatherKey || "clear");
  };
  const img = (src, key) => (
    <img key={key} src={src} alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"auto", opacity:show(key)?1:0, transition:"opacity 1.2s ease" }} />
  );
  return (
    <div style={{ position:"absolute", inset:0, background: isDay?"#B8935A":"#130f08" }}>
      {img("/room-bg.jpg",            "clear")}
      {img("/room-bg-cloudy.jpg",     "cloudy")}
      {img("/room-bg-rain-light.jpg", "rain-light")}
      {img("/room-bg-rain.jpg",       "rain")}
      {img("/room-bg-dusk.jpg",       "dusk")}
      {img("/room-bg-night.jpg",      "night")}
    </div>
  );
}

// ── 可交互家具热点 ──
// 坐标是图片内百分比（941×1672），放在与图片等尺寸的容器里，不受屏幕高度影响
const FURNITURE = [
  { id:"clock",       left:"41%", top:"10%", transparent:true },
  { id:"photostring", left:"39%", top:"16%", transparent:true, w:"clamp(56px,15vw,80px)", h:"clamp(20px,5vw,32px)" },
  { id:"board",       left:"73%", top:"51%", floor:true, transparent:true, w:"clamp(40px,11vw,62px)", h:"clamp(30px,8vw,50px)" },
  { id:"sofa",        left:"46%", top:"27%", transparent:true, w:"clamp(70px,20vw,100px)", h:"clamp(24px,7vw,40px)" },
  { id:"door",        left:"19%", top:"14%", transparent:true, h:"clamp(90px,25vw,150px)" },
  { id:"kitchendoor", left:"6%",  top:"35%", transparent:true, w:"clamp(28px,7vw,44px)", h:"clamp(50px,13vw,78px)" },
  { id:"gamepad",     left:"82%", top:"33%", transparent:true, w:"clamp(40px,11vw,64px)", h:"clamp(32px,9vw,56px)" },
  { id:"watchtv",     left:"46%", top:"38%", transparent:true, w:"clamp(50px,14vw,80px)", h:"clamp(20px,5vw,32px)" },
  { id:"record",      left:"92%", top:"79%", transparent:true, w:"clamp(32px,9vw,52px)", h:"clamp(44px,12vw,72px)" },
  { id:"kitchen",     left:"5%",  top:"51%", transparent:true, w:"clamp(22px,6vw,36px)", h:"clamp(80px,22vw,132px)" },
];

// ── 游戏面板 ──
function GamePanel({ theme: t }) {
  const [open, setOpen] = useState(null); // null | 'slot' | 'turtle' | 'bamboo' | 'guess'

  const GAMES = [
    { id:"jump",   emoji:"🎮", name:"跳一跳",  desc:"按住蓄力，松手起跳 ✨", href:"http://129.226.158.222:8000/" },
    { id:"slot",   emoji:"🎰", name:"老虎机",  desc:"转动命运 🔒" },
    { id:"turtle", emoji:"🐢", name:"抽王八",  desc:"别被留下乌龟牌" },
    { id:"bamboo", emoji:"🎴", name:"接竹竿",  desc:"同点接走，先出完的输" },
    { id:"guess",  emoji:"🗣️", name:"你说我猜", desc:"随机出词，描述给对方猜" },
    { id:"billiards", emoji:"🎱", name:"桌球", desc:"拖杆瞄准，收完自己那组打黑八" },
    { id:"crane",     emoji:"🧸", name:"娃娃机", desc:"时机一到，出手不留" },
    { id:"basket",    emoji:"🏀", name:"投篮机", desc:"蓄力出手，进框翻倍" },
  ];

  if (open === "slot") return (
    <div style={{ padding:"8px 16px 16px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={() => setOpen(null)} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:10, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <SlotGate theme={t} />
    </div>
  );

  if (open === "turtle") return (
    <div style={{ padding:"8px 16px 16px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={() => setOpen(null)} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:10, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <DrawTurtle theme={t} />
    </div>
  );

  if (open === "bamboo") return (
    <div style={{ padding:"8px 16px 16px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={() => setOpen(null)} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:10, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <BambooGame theme={t} />
    </div>
  );

  if (open === "guess") return (
    <div style={{ padding:"8px 16px 16px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={() => setOpen(null)} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:10, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <GuessGame theme={t} />
    </div>
  );

  if (open === "billiards") return (
    <div style={{ padding:"8px 16px 16px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={() => setOpen(null)} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:10, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <Billiards theme={t} />
    </div>
  );

  if (open === "crane") return (
    <div style={{ padding:"8px 16px 16px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={() => setOpen(null)} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:10, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <CraneGame theme={t} />
    </div>
  );

  if (open === "basket") return (
    <div style={{ padding:"8px 16px 16px", fontFamily:"'Noto Serif SC',serif" }}>
      <button onClick={() => setOpen(null)} style={{ background:"none", border:"none", color:t.textMuted, fontSize:12, cursor:"pointer", marginBottom:10, padding:0, display:"flex", alignItems:"center", gap:4 }}>← 返回</button>
      <BasketGame theme={t} />
    </div>
  );

  return (
    <div style={{ padding:"16px 16px 24px", fontFamily:"'Noto Serif SC',serif", display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ fontSize:14, fontWeight:600, color:t.text, textAlign:"center", marginBottom:6 }}>游戏区</div>
      {GAMES.map(g => g.href ? (
        <a key={g.id} href={g.href} target="_blank" rel="noopener noreferrer"
          style={{ textDecoration:"none", display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:t.surface, borderRadius:12, border:`1px solid ${t.surfaceBorder}` }}>
          <div style={{ fontSize:22 }}>{g.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:t.text, marginBottom:1 }}>{g.name}</div>
            <div style={{ fontSize:11, color:t.textMuted }}>{g.desc}</div>
          </div>
          <div style={{ fontSize:12, color:t.textMuted, opacity:.5 }}>→</div>
        </a>
      ) : (
        <button key={g.id} onClick={() => setOpen(g.id)}
          style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:t.surface, borderRadius:12, border:`1px solid ${t.surfaceBorder}`, cursor:"pointer", width:"100%", textAlign:"left" }}>
          <div style={{ fontSize:22 }}>{g.emoji}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:t.text, marginBottom:1 }}>{g.name}</div>
            <div style={{ fontSize:11, color:t.textMuted }}>{g.desc}</div>
          </div>
          <div style={{ fontSize:12, color:t.textMuted, opacity:.5 }}>→</div>
        </button>
      ))}
    </div>
  );
}

// ── 老虎机密码门 ──
function SlotGate({ theme: t }) {
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);
  const [open, setOpen] = useState(false);

  function attempt() {
    if (input.trim() === "K♡L") {
      setOpen(true);
      window.open("http://129.226.158.222:3000/", "_blank");
    } else {
      setWrong(true);
      setInput("");
      setTimeout(() => setWrong(false), 1200);
    }
  }

  if (open) return (
    <div style={{ padding:"12px 16px 8px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ textAlign:"center", fontSize:12, color:t.textMuted }}>已解锁，正在跳转……</div>
    </div>
  );

  return (
    <div style={{ padding:"12px 16px 8px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:10 }}>🔒 输入密码</div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === "Enter" && attempt()}
        placeholder="＿＿＿"
        style={{
          display:"block", width:"100%", boxSizing:"border-box",
          padding:"10px 14px", borderRadius:10, border:`1.5px solid ${wrong ? "#E87070" : t.surfaceBorder}`,
          background:t.surface, color:t.text, fontSize:15, textAlign:"center",
          fontFamily:"inherit", outline:"none", marginBottom:10,
          transition:"border-color .2s",
        }}
        autoFocus
      />
      <button onClick={attempt} style={{
        display:"block", width:"100%", padding:"10px", borderRadius:10,
        background:"linear-gradient(135deg,#E87070,#E870A8)", color:"#fff",
        border:"none", fontSize:13, cursor:"pointer", fontFamily:"inherit",
      }}>确认</button>
      {wrong && <div style={{ textAlign:"center", fontSize:11, color:"#E87070", marginTop:8 }}>不对哦</div>}
    </div>
  );
}

// ── 主组件 ──
export default function Room({ theme: t, bgmOn, setBgmOn, mode, onEnterPrivate, onEnterNuonuo, onEnterBedroom, onEnterKitchen }) {
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [weatherKey, setWeatherKey] = useState(null); // null=sunny; "cloudy"/"rain"/"rain-light" from API (TODO)
  const isDay = mode === "day";
  const hour = new Date().getHours();
  const isDusk = isDay && hour >= 17 && hour < 19;
  const isSleep = hour >= 22 || hour < 6;
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
        <div style={{ fontSize:36, marginBottom:14 }}>🛏️</div>
        <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:8 }}>卧室</div>
        <div style={{ fontSize:12, color:t.textMuted, lineHeight:2 }}>正在布置中……</div>
      </div>
    ),
    kitchen: (
      <div style={{ padding:"32px 24px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
        <div style={{ fontSize:36, marginBottom:14 }}>🍳</div>
        <div style={{ fontSize:14, fontWeight:600, color:t.text, marginBottom:8 }}>厨房</div>
        <div style={{ fontSize:12, color:t.textMuted, lineHeight:2 }}>正在布置中……</div>
      </div>
    ),
    gamepad: <GamePanel theme={t} />,
    watchtv: <WatchTogether theme={t} />,
  };

  function handleClick(id) {
    if (id === "door")        { onEnterPrivate(); return; }
    if (id === "kitchendoor") { onEnterBedroom(); return; }
    if (id === "kitchen")     { onEnterKitchen(); return; }
    if (id === "record")      { setBgmOn(!bgmOn); return; }
    setActive(id);
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      <RoomBg isDay={isDay} weatherKey={weatherKey} isDusk={isDusk} />
      <RoomDecor />

      {/* 左上 logo */}
      <div style={{ position:"absolute", top:14, left:16, zIndex:10, fontSize:11, color:t.text, opacity:.38, fontFamily:"'Noto Serif SC',serif", letterSpacing:".1em" }}>克 &amp; Lee</div>
      {/* 右下 日夜 */}
      <div style={{ position:"absolute", bottom:12, right:14, zIndex:10, fontSize:12, opacity:.4 }}>{isDay?"☀️":"🌙"}</div>

      {/* 糯糯 */}
      <NuonuoResident theme={t} onEnter={onEnterNuonuo} />

      {/* 图片对齐层：与图片完全重合，内部坐标 = 图片内百分比，不受屏幕高度影响 */}
      {/* 图片比例 941:1672，paddingBottom = 1672/941 = 177.7% */}
      <div style={{ position:"absolute", top:0, left:0, width:"100%", paddingBottom:"177.7%", zIndex:5, pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0 }}>
          <WeatherWindow isDusk={isDusk} weatherKey={weatherKey} />
          {/* 家具热点 */}
          {FURNITURE.filter(obj => !(obj.nightOnly && !isSleep)).map(obj => (
            <button
              key={obj.id}
              onClick={() => handleClick(obj.id)}
              onMouseEnter={e => { setHovered(obj.id); if (!obj.transparent) e.currentTarget.style.transform="translate(-50%,-50%) scale(1.08)"; }}
              onMouseLeave={e => { setHovered(null); e.currentTarget.style.transform="translate(-50%,-50%)"; }}
              style={{ position:"absolute", left:obj.left, top:obj.top, transform:"translate(-50%,-50%)", background:"none", border:"none", outline:"none", cursor:"pointer", zIndex:6, pointerEvents:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding: obj.transparent ? 0 : 4, borderRadius:8, transition:"transform .18s" }}
            >
              {!obj.transparent ? (
                <>
                  {{ clock:<WallClock isDay={isDay} c={c}/>, photostring:<PhotoString isDay={isDay} c={c}/>, board:<NoteBoard isDay={isDay} c={c}/>, gamepad:<TVArea isDay={isDay} c={c}/> }[obj.id]}
                </>
              ) : (
                <div style={{ position:"relative",
                  width:  obj.w || ((obj.id==="door"||obj.id==="kitchendoor") ? "clamp(40px,11vw,66px)" : "clamp(56px,26vw,148px)"),
                  height: obj.h || ((obj.id==="door"||obj.id==="kitchendoor") ? "clamp(80px,22vw,130px)" : "clamp(32px,9vw,56px)"),
                  borderRadius: (obj.id==="door"||obj.id==="kitchendoor") ? "4px 4px 0 0" : 6,
                  border: "none",
                }}>
                  {obj.id==="record" && bgmOn && (
                    <span style={{ position:"absolute", top:-14, right:0, fontSize:11, color:c.accent, animation:"pulse 1.2s ease-in-out infinite" }}>♫</span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

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
        @keyframes nnFloat  { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-3px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateX(-50%) translateY(4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
