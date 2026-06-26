import { useState, useEffect, useRef } from "react";
import {
  sfxDigitCollect, sfxMirrorFlip, sfxCalendarStack,
  sfxColorReverse, sfxShadowRight, sfxShadowWrong,
  sfxPasswordRight, sfxPasswordWrong, sfxCountdownTick, sfxDoorClose,
  bgmStart, bgmStopAll,
} from "../utils/gameAudio.js";

const CONFIG = {
  password: [3, 5, 4, 7],
  countdownSecs: 10,
  roomOrder: ["living", "bedroom", "kitchen", "nono"],
};

const ROOMS = {
  living:  { name:"客厅",    emoji:"🛋️",  hint:"电视好像在倒着放……试试用镜子？" },
  bedroom: { name:"卧室",    emoji:"🛏️",  hint:"抓住那些飘着的日历！" },
  kitchen: { name:"厨房",    emoji:"🍳",  hint:"颜色都反了……彩虹是什么顺序来着？" },
  nono:    { name:"糯糯的小房间", emoji:"🧸", hint:"三个影子……哪个才是真的我？" },
};

// 收集到数字的占位 slot
function DigitSlots({ found }) {
  return (
    <div style={{ display:"flex", gap:8, justifyContent:"center", margin:"12px 0" }}>
      {CONFIG.password.map((_, i) => (
        <div key={i} style={{
          width:36, height:36, borderRadius:8,
          background: found[i] != null ? "#ffd700" : "rgba(255,255,255,.15)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, fontWeight:"bold", color:"#333",
          transition:"all .3s", transform: found[i] != null ? "scale(1.1)" : "scale(1)",
        }}>
          {found[i] != null ? found[i] : "✦"}
        </div>
      ))}
    </div>
  );
}

// 提示气泡
function HintBubble({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ textAlign:"center", margin:"8px 0" }}>
      <button onClick={() => setVisible(v => !v)} style={{
        background:"rgba(255,255,255,.2)", border:"none", borderRadius:20,
        padding:"4px 14px", fontSize:12, color:"#fff", cursor:"pointer",
      }}>🐾 糯糯提示</button>
      {visible && (
        <div style={{
          background:"rgba(255,255,255,.95)", color:"#555", borderRadius:12,
          padding:"10px 14px", margin:"8px auto", maxWidth:260,
          fontSize:13, lineHeight:1.6, animation:"fadeIn .2s ease",
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

// ──────────── 房间一：客厅 ────────────
// 谜题：TV倒置，拖镜子到TV翻正，自己数蜡烛数量输入
export function LivingRoom({ onCollect }) {
  const mirrorRef = useRef(null);
  const tvRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [mirrorPos, setMirrorPos] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [collected, setCollected] = useState(false);

  function onPointerDown(e) {
    if (flipped) return;
    setDragging(true);
    setDragOrigin({ x: e.clientX - mirrorPos.x, y: e.clientY - mirrorPos.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    setMirrorPos({ x: e.clientX - dragOrigin.x, y: e.clientY - dragOrigin.y });
  }

  function onPointerUp(e) {
    if (!dragging) return;
    setDragging(false);
    const m = mirrorRef.current?.getBoundingClientRect();
    const tv = tvRef.current?.getBoundingClientRect();
    if (m && tv) {
      const cx = (m.left + m.right) / 2;
      const cy = (m.top + m.bottom) / 2;
      const hit = cx >= tv.left && cx <= tv.right && cy >= tv.top && cy <= tv.bottom;
      if (hit) { sfxMirrorFlip(); setFlipped(true); setMirrorPos({ x: 0, y: 0 }); }
      else setMirrorPos({ x: 0, y: 0 });
    }
  }

  function checkAnswer() {
    if (answer.trim() === "3") {
      sfxDigitCollect();
      setCollected(true);
      onCollect(0, 3);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 1000);
    }
  }

  return (
    <div style={{ padding:"16px 0" }}>
      <p style={{ color:"rgba(255,255,255,.8)", fontSize:13, textAlign:"center", lineHeight:1.7, margin:"0 0 12px" }}>
        客厅里一切都粘在天花板上……<br/>
        <span style={{ fontSize:11, color:"rgba(255,255,255,.5)", fontStyle:"italic" }}>「有个画面我一直看不清楚。」</span>
      </p>

      <div style={{ display:"flex", gap:12, padding:"0 16px", alignItems:"center", marginBottom:12 }}>
        {/* TV */}
        <div ref={tvRef} style={{
          flex:1, background:"rgba(0,0,0,.7)", borderRadius:12, padding:"14px 10px",
          textAlign:"center", border:"2px solid rgba(255,255,255,.25)", minHeight:100,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        }}>
          {!flipped ? (
            <>
              <div style={{ fontSize:36, transform:"rotate(180deg)", display:"inline-block", marginBottom:6 }}>🎂</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontStyle:"italic" }}>看不清……</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:22, letterSpacing:2 }}>🕯️🕯️🕯️</div>
              <div style={{ fontSize:28, marginTop:4 }}>🎂</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", marginTop:4, fontStyle:"italic" }}>「生日……是几岁来着？」</div>
            </>
          )}
        </div>

        {/* 镜子（可拖拽） */}
        {!flipped && (
          <div
            ref={mirrorRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            style={{
              width:52, height:72, background:"rgba(200,220,255,.18)",
              border:"2px solid rgba(180,200,255,.5)", borderRadius:10,
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              cursor:"grab", userSelect:"none", touchAction:"none",
              transform: `translate(${mirrorPos.x}px,${mirrorPos.y}px)`,
              transition: dragging ? "none" : "transform .2s",
              zIndex: dragging ? 99 : 1, position:"relative",
              boxShadow: dragging ? "0 8px 24px rgba(0,0,0,.4)" : "none",
            }}
          >
            <div style={{ fontSize:28 }}>🪞</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.3)", marginTop:2, fontStyle:"italic" }}>「想看看对面……」</div>
          </div>
        )}
      </div>

      {/* 输入答案 */}
      {flipped && !collected && (
        <div style={{ textAlign:"center", padding:"0 16px" }}>
          <div style={{ color:"rgba(255,255,255,.5)", fontSize:11, marginBottom:8, fontStyle:"italic" }}>
            「我记得那个数字……」
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", alignItems:"center" }}>
            <input
              type="number" value={answer}
              onChange={e => setAnswer(e.target.value)}
              style={{
                width:60, height:40, borderRadius:8, border:`2px solid ${wrong?"#ff5050":"rgba(255,255,255,.3)"}`,
                background:"rgba(255,255,255,.1)", color:"#fff", fontSize:20, textAlign:"center",
                outline:"none", fontWeight:"bold",
              }}
              placeholder="?"
            />
            <button onClick={checkAnswer} style={{
              background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none",
              borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:"bold",
              color:"#333", cursor:"pointer",
            }}>确认</button>
          </div>
          {wrong && <div style={{ color:"#ff8888", fontSize:11, marginTop:6 }}>再数数看？</div>}
        </div>
      )}

      {collected && (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.6)", fontSize:13, marginTop:8 }}>
          ✨ 数字变成星星飞走啦！
        </div>
      )}
    </div>
  );
}

// ──────────── 房间二：卧室 ────────────
// 谜题：6张日历漂浮，3张有🌙标记，找到这3张叠起来，日期显示，玩家提取个位数字
export function BedroomRoom({ onCollect }) {
  // 6张日历，3个有🌙标记（索引0,2,4），3个是干扰（索引1,3,5）
  const PAGES = [
    { moon:true,  text:"某年某月 15 日" },
    { moon:false, text:"某年某月 23 日" },
    { moon:true,  text:"某年某月 15 日" },
    { moon:false, text:"某年某月 7 日"  },
    { moon:true,  text:"某年某月 15 日" },
    { moon:false, text:"某年某月 31 日" },
  ];

  const [caught, setCaught] = useState([]);
  const [stacked, setStacked] = useState(false);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [collected, setCollected] = useState(false);

  const moonCaught = caught.filter(i => PAGES[i].moon);
  const hasAll3 = moonCaught.length >= 3;

  function tap(i) {
    if (caught.includes(i) || stacked) return;
    setCaught(prev => [...prev, i]);
    if (!PAGES[i].moon) {
      setTimeout(() => setCaught(prev => prev.filter(x => x !== i)), 700);
    }
  }

  function checkAnswer() {
    if (answer.trim() === "5") {
      sfxDigitCollect(); setCollected(true); onCollect(1, 5);
    } else {
      setWrong(true); setTimeout(() => setWrong(false), 900);
    }
  }

  return (
    <div style={{ padding:"16px 0" }}>
      <p style={{ color:"rgba(255,255,255,.8)", fontSize:13, textAlign:"center", lineHeight:1.7, margin:"0 0 12px" }}>
        时钟倒着走……日历页到处飘。<br/>
        <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontStyle:"italic" }}>「妈妈说，月亮记得所有重要的日子。」</span>
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, padding:"0 12px", marginBottom:12 }}>
        {PAGES.map((page, i) => {
          const isCaught = caught.includes(i);
          return (
            <div key={i} onClick={() => tap(i)} style={{
              background: isCaught ? (page.moon ? "rgba(255,215,0,.2)" : "rgba(255,80,80,.15)") : "rgba(255,255,255,.1)",
              border: `1.5px solid ${isCaught ? (page.moon ? "#ffd700" : "#ff5050") : "rgba(255,255,255,.2)"}`,
              borderRadius:10, padding:"10px 6px", textAlign:"center",
              cursor: isCaught ? "default" : "pointer", transition:"all .25s",
            }}>
              <div style={{ fontSize:18 }}>{isCaught ? (page.moon ? "🌙" : "✗") : "📄"}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", marginTop:3 }}>
                {isCaught ? (page.moon ? "有标记" : "干扰页") : "飘浮的日历"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,.5)", marginBottom:8 }}>
        已找到 {moonCaught.length} / 3 张 🌙
      </div>

      {hasAll3 && !stacked && (
        <div style={{ textAlign:"center" }}>
          <button onClick={() => { sfxCalendarStack(); setStacked(true); }} style={{
            background:"rgba(255,255,255,.2)", border:"none", borderRadius:20,
            padding:"8px 20px", fontSize:13, color:"#fff", cursor:"pointer",
          }}>📚 叠放在一起</button>
        </div>
      )}

      {stacked && !collected && (
        <div style={{ textAlign:"center", padding:"0 16px" }}>
          <div style={{
            background:"rgba(255,255,255,.08)", borderRadius:12, padding:"14px",
            margin:"8px 0 12px", fontFamily:"monospace",
          }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:4, fontStyle:"italic" }}>「有个数字……一直在发光。」</div>
            <div style={{ fontSize:22, color:"#ffd700", letterSpacing:2 }}>_ _ 1 <span style={{ color:"#fff", textShadow:"0 0 8px #ffd700" }}>?</span></div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", marginTop:4 }}></div>
          </div>
          <div style={{ color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8, fontStyle:"italic" }}>
            「我想起来了……」
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
            <input type="number" value={answer} onChange={e => setAnswer(e.target.value)}
              style={{
                width:55, height:38, borderRadius:8,
                border:`2px solid ${wrong?"#ff5050":"rgba(255,255,255,.3)"}`,
                background:"rgba(255,255,255,.1)", color:"#fff", fontSize:20,
                textAlign:"center", outline:"none",
              }} placeholder="?" />
            <button onClick={checkAnswer} style={{
              background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none",
              borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:"bold",
              color:"#333", cursor:"pointer",
            }}>确认</button>
          </div>
          {wrong && <div style={{ color:"#ff8888", fontSize:11, marginTop:4 }}>仔细看……</div>}
        </div>
      )}

      {collected && (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.6)", fontSize:13, marginTop:8 }}>
          ✨ 又找到一个！
        </div>
      )}
    </div>
  );
}

// ──────────── 房间三：厨房 ────────────
// 谜题：4瓶饮料颜色全乱，台面有彩虹图，按彩虹顺序（红→橙→黄→绿）依次点击
// 点对了亮起，点错了重置。全部点完后，玩家数出⭐瓶是第几个（第4个）
export function KitchenRoom({ onCollect }) {
  const BOTTLES = [
    { id:"orange", trueColor:"#ff8800", wrongColor:"#4488ff", label:"橙" },  // 显示蓝
    { id:"green",  trueColor:"#44bb44", wrongColor:"#ff44aa", label:"绿 ⭐", star:true }, // 显示粉
    { id:"red",    trueColor:"#ff4444", wrongColor:"#44dddd", label:"红" },  // 显示青
    { id:"yellow", trueColor:"#ffdd00", wrongColor:"#aa44ff", label:"黄" },  // 显示紫
  ];
  const CORRECT_ORDER = ["red", "orange", "yellow", "green"];

  const [tapped, setTapped] = useState([]);   // correctly tapped ids in order
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);
  const [collected, setCollected] = useState(false);

  function tap(id) {
    if (done || tapped.includes(id)) return;
    const expected = CORRECT_ORDER[tapped.length];
    if (id === expected) {
      sfxColorReverse();
      const next = [...tapped, id];
      setTapped(next);
      if (next.length === 4) setDone(true);
    } else {
      setShake(true);
      setTimeout(() => { setShake(false); setTapped([]); }, 700);
    }
  }

  function checkAnswer() {
    if (answer.trim() === "4") {
      sfxDigitCollect(); setCollected(true); onCollect(2, 4);
    } else {
      setWrong(true); setTimeout(() => setWrong(false), 900);
    }
  }

  return (
    <div style={{ padding:"16px 0" }}>
      <p style={{ color:"rgba(255,255,255,.8)", fontSize:13, textAlign:"center", lineHeight:1.7, margin:"0 0 10px" }}>
        饮料的颜色全乱了……<br/>
        <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontStyle:"italic" }}>「妈妈说彩虹是有顺序的。」</span>
      </p>

      {/* 彩虹参考 */}
      <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:10, alignItems:"center" }}>
        <span style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>彩虹：</span>
        {["#ff4444","#ff8800","#ffdd00","#44bb44"].map((c,i) => (
          <div key={i} style={{ width:16, height:16, borderRadius:4, background:c }} />
        ))}
      </div>

      {/* 瓶子 */}
      <div style={{
        display:"flex", gap:10, justifyContent:"center", marginBottom:12,
        animation: shake ? "shakeX .4s ease" : "none",
      }}>
        {BOTTLES.map(b => {
          const isCorrect = tapped.includes(b.id);
          return (
            <div key={b.id} onClick={() => tap(b.id)} style={{
              background: isCorrect ? b.trueColor : b.wrongColor,
              borderRadius:10, padding:"10px 6px", width:56, textAlign:"center",
              cursor: done || isCorrect ? "default" : "pointer",
              border: isCorrect ? "2px solid rgba(255,255,255,.6)" : "2px solid transparent",
              transition:"background .4s, border .2s",
              opacity: done && !isCorrect ? .4 : 1,
            }}>
              <div style={{ fontSize:22, marginBottom:2 }}>🍶</div>
              <div style={{ fontSize:9, color:"#fff", fontWeight:"bold" }}>
                {isCorrect ? b.label : "??"}
              </div>
              {b.star && isCorrect && <div style={{ fontSize:14, marginTop:2 }}>⭐</div>}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:10 }}>
        已点 {tapped.length} / 4
      </div>

      {done && !collected && (
        <div style={{ textAlign:"center", padding:"0 16px" }}>
          <div style={{ color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:10, lineHeight:1.6, fontStyle:"italic" }}>
            「有一瓶……好像和其他的不一样。」
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
            <input type="number" value={answer} onChange={e => setAnswer(e.target.value)}
              style={{
                width:55, height:38, borderRadius:8,
                border:`2px solid ${wrong?"#ff5050":"rgba(255,255,255,.3)"}`,
                background:"rgba(255,255,255,.1)", color:"#fff",
                fontSize:20, textAlign:"center", outline:"none",
              }} placeholder="?" />
            <button onClick={checkAnswer} style={{
              background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none",
              borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:"bold",
              color:"#333", cursor:"pointer",
            }}>确认</button>
          </div>
          {wrong && <div style={{ color:"#ff8888", fontSize:11, marginTop:4 }}>数数看……</div>}
        </div>
      )}
      {collected && (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.6)", fontSize:13, marginTop:8 }}>
          ✨ 第三个数字到手！
        </div>
      )}
    </div>
  );
}

// ──────────── 房间四：糯糯的小房间 ────────────
// 谜题：3个影子在移动，彩色影子每隔几秒停在随机位置，要在它停下时快速点击
export function NonoRoom({ onCollect }) {
  const [phase, setPhase] = useState("watch"); // watch | caught | collect
  const [colorPos, setColorPos] = useState(0); // 0=左 1=中 2=右
  const [attempts, setAttempts] = useState(0);
  const [collected, setCollected] = useState(false);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (phase !== "watch") return;
    const tick = () => {
      setColorPos(Math.floor(Math.random() * 3));
    };
    const id = setInterval(tick, 1800);
    return () => clearInterval(id);
  }, [phase]);

  function tapShadow(pos) {
    if (phase !== "watch") return;
    if (pos === colorPos) {
      sfxShadowRight();
      setPhase("caught");
    } else {
      sfxShadowWrong();
      setAttempts(a => a + 1);
    }
  }

  function checkAnswer() {
    if (answer.trim() === "7") {
      sfxDigitCollect(); setCollected(true); onCollect(3, 7);
    } else {
      setWrong(true); setTimeout(() => setWrong(false), 900);
    }
  }

  const SHADOWS = [
    { label:"影子 A", base:"rgba(180,180,180,.6)" },
    { label:"影子 B", base:"rgba(120,120,120,.5)" },
    { label:"影子 C", base:"rgba(100,100,100,.4)" },
  ];

  return (
    <div style={{ padding:"16px 0" }}>
      <p style={{ color:"rgba(255,255,255,.8)", fontSize:13, textAlign:"center", lineHeight:1.7, margin:"0 0 10px" }}>
        小房间里有三个影子在走来走去……<br/>
        <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontStyle:"italic" }}>「只有真正的我，才会有颜色。」</span>
      </p>

      {attempts > 0 && phase === "watch" && (
        <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,100,100,.7)", marginBottom:8 }}>
          抓错了，再试试～ （已试 {attempts} 次）
        </div>
      )}

      {/* 三个影子，彩色的在随机位置 */}
      <div style={{ display:"flex", gap:12, justifyContent:"center", margin:"0 16px 12px" }}>
        {order.map(pos => {
          const isColor = pos === colorPos && phase === "watch";
          const isCaught = pos === colorPos && phase === "caught";
          return (
            <div
              key={pos}
              onClick={() => tapShadow(pos)}
              style={{
                background: isColor || isCaught
                  ? "linear-gradient(135deg,#ff9ff3,#ffd700,#74b9ff)"
                  : SHADOWS[pos].base,
                borderRadius:12, padding:"16px 10px",
                flex:1, textAlign:"center",
                cursor: phase === "watch" ? "pointer" : "default",
                border: isCaught ? "2px solid #ffd700" : "2px solid transparent",
                transition:"background .3s",
                boxShadow: isColor ? "0 0 12px rgba(255,215,0,.4)" : "none",
              }}
            >
              <div style={{ fontSize:28 }}>👤</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.5)", marginTop:4 }}>
                {SHADOWS[pos].label}
              </div>
            </div>
          );
        })}
      </div>

      {phase === "caught" && !collected && (
        <div style={{ textAlign:"center", padding:"0 16px" }}>
          <div style={{ color:"rgba(255,255,255,.9)", fontSize:13, lineHeight:1.7, marginBottom:10 }}>
            <span style={{ fontStyle:"italic", color:"rgba(255,255,255,.7)" }}>「嘿……你找到我了。」</span><br/>
            <span style={{ fontSize:22, letterSpacing:2 }}>🌟🌟🌟🌟🌟🌟🌟</span>
          </div>
          <div style={{ color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:8, fontStyle:"italic" }}>
            「我有……好多星星哦。」
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
            <input type="number" value={answer} onChange={e => setAnswer(e.target.value)}
              style={{
                width:55, height:38, borderRadius:8,
                border:`2px solid ${wrong?"#ff5050":"rgba(255,255,255,.3)"}`,
                background:"rgba(255,255,255,.1)", color:"#fff",
                fontSize:20, textAlign:"center", outline:"none",
              }} placeholder="?" />
            <button onClick={checkAnswer} style={{
              background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none",
              borderRadius:8, padding:"8px 14px", fontSize:13, fontWeight:"bold",
              color:"#333", cursor:"pointer",
            }}>确认</button>
          </div>
          {wrong && <div style={{ color:"#ff8888", fontSize:11, marginTop:4 }}>仔细数数……</div>}
        </div>
      )}

      {collected && (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.6)", fontSize:13, marginTop:8 }}>
          ✨ 最后一个数字！去书房吧！
        </div>
      )}
    </div>
  );
}

// ──────────── 书房：密码锁 ────────────
export function StudyLock({ found, onUnlock }) {
  const [input, setInput] = useState([]);
  const [error, setError] = useState(false);

  function press(n) {
    if (input.length >= 4) return;
    setInput(prev => [...prev, n]);
  }

  function check() {
    const correct = input.length === 4 && input.every((v, i) => v === CONFIG.password[i]);
    if (correct) {
      sfxPasswordRight();
      onUnlock();
    } else {
      sfxPasswordWrong();
      setError(true);
      setTimeout(() => { setError(false); setInput([]); }, 1200);
    }
  }

  const foundCount = found.filter(v => v != null).length;

  return (
    <div style={{ padding:"16px", textAlign:"center" }}>
      <div style={{ fontSize:13, color:"rgba(255,255,255,.7)", marginBottom:12 }}>
        🔒 已找到 {foundCount} / 4 位数字
      </div>
      <DigitSlots found={found} />

      <div style={{ margin:"16px 0 8px", color:"rgba(255,255,255,.8)", fontSize:13 }}>
        输入四位密码：
      </div>

      {/* 输入显示 */}
      <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:12 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width:44, height:44, borderRadius:8,
            background: error ? "rgba(255,80,80,.4)" : "rgba(255,255,255,.15)",
            border: `2px solid ${error ? "#ff5050" : "rgba(255,255,255,.3)"}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, color:"#fff", fontWeight:"bold",
            transition:"all .2s",
          }}>
            {input[i] ?? ""}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ color:"#ff8888", fontSize:12, marginBottom:8 }}>
          还差一点点……再想想哪个房间的数字没找到？
        </div>
      )}

      {/* 数字键盘 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, maxWidth:200, margin:"0 auto 12px" }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => press(n)} style={{
            background:"rgba(255,255,255,.18)", border:"none", borderRadius:8,
            padding:"10px 0", fontSize:16, color:"#fff", cursor:"pointer",
          }}>{n}</button>
        ))}
        <button onClick={() => setInput(p => p.slice(0,-1))} style={{
          background:"rgba(255,100,100,.25)", border:"none", borderRadius:8,
          padding:"10px 0", fontSize:16, color:"#fff", cursor:"pointer",
        }}>⌫</button>
        <button onClick={() => press(0)} style={{
          background:"rgba(255,255,255,.18)", border:"none", borderRadius:8,
          padding:"10px 0", fontSize:16, color:"#fff", cursor:"pointer",
        }}>0</button>
        <button onClick={check} style={{
          background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none", borderRadius:8,
          padding:"10px 0", fontSize:14, fontWeight:"bold", color:"#333", cursor:"pointer",
        }}>✓</button>
      </div>
    </div>
  );
}

// ──────────── 书房结局 ────────────
export function StudyEnding({ onEnd }) {
  const [phase, setPhase] = useState("book"); // book → countdown → choice → ending
  const [countdown, setCountdown] = useState(CONFIG.countdownSecs);
  const [ending, setEnding] = useState(null);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { setPhase("choice"); return; }
    sfxCountdownTick();
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  if (phase === "book") return (
    <div style={{ padding:"16px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📖</div>
      <div style={{ color:"rgba(255,255,255,.9)", fontSize:13, lineHeight:1.8, margin:"0 16px 16px" }}>
        书自动翻到最后一页……<br/>
        <br/>
        「糯糯，梦是你自己的。你可以选择醒过来，也可以选择留下来，在这个梦里，永远当那个可以看到魔法的小女孩。」<br/>
        <br/>
        书房的门关上后，如果你在10秒内再打开，梦就醒了。如果你不打开，梦就延续下去。
      </div>
      <button onClick={() => { sfxDoorClose(); setPhase("countdown"); bgmStart("tense"); }} style={{
        background:"linear-gradient(135deg,#a29bfe,#6c5ce7)", border:"none",
        borderRadius:20, padding:"10px 28px", fontSize:14, color:"#fff",
        cursor:"pointer", fontWeight:"bold",
      }}>
        关上书房门
      </button>
    </div>
  );

  if (phase === "countdown") return (
    <div style={{ padding:"24px 16px", textAlign:"center" }}>
      <div style={{ fontSize:13, color:"rgba(255,255,255,.7)", marginBottom:16 }}>
        门关上了……
      </div>
      <div style={{ fontSize:72, color:"#ffd700", fontWeight:"bold", marginBottom:16, fontFamily:"monospace" }}>
        {countdown}
      </div>
      <button onClick={() => { setEnding("wake"); setPhase("ending"); bgmStart("wakeEnd"); }} style={{
        background:"rgba(255,255,255,.9)", border:"none",
        borderRadius:20, padding:"10px 28px", fontSize:14, color:"#333",
        cursor:"pointer", fontWeight:"bold",
      }}>
        打开门 🚪
      </button>
    </div>
  );

  if (phase === "choice") return (
    <div style={{ padding:"24px 16px", textAlign:"center" }}>
      <div style={{ fontSize:13, color:"rgba(255,255,255,.8)", marginBottom:20 }}>
        倒计时结束了……你还在书房里。
      </div>
      <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
        <button onClick={() => { setEnding("wake"); setPhase("ending"); bgmStart("wakeEnd"); }} style={{
          background:"rgba(255,255,255,.9)", border:"none",
          borderRadius:20, padding:"10px 20px", fontSize:13, color:"#333",
          cursor:"pointer",
        }}>打开门，醒来 ☀️</button>
        <button onClick={() => { setEnding("dream"); setPhase("ending"); bgmStart("dreamEnd"); }} style={{
          background:"linear-gradient(135deg,#fd79a8,#6c5ce7)", border:"none",
          borderRadius:20, padding:"10px 20px", fontSize:13, color:"#fff",
          cursor:"pointer",
        }}>留在梦里 🌙</button>
      </div>
    </div>
  );

  if (phase === "ending" && ending === "wake") return (
    <div style={{ padding:"24px 16px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>☀️</div>
      <div style={{ color:"rgba(255,255,255,.9)", fontSize:13, lineHeight:1.8, margin:"0 16px 16px" }}>
        书房门打开，外面是正常的客厅。小黎和笃坐在沙发上。<br/>
        <br/>
        小黎：「糯糯，睡醒啦？梦到什么了？」<br/>
        糯糯：「我梦到……我们的家变成魔法世界了！我还找到了四个数字！」<br/>
        笃：「那四个数字是什么呀？」<br/>
        糯糯：「3、5、4、7！加起来是19！是我的幸运数字！」
      </div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", marginBottom:16 }}>
        梦醒了，但冒险永远不会结束。
      </div>
      <button onClick={onEnd} style={{
        background:"rgba(255,255,255,.2)", border:"none", borderRadius:20,
        padding:"8px 24px", fontSize:13, color:"#fff", cursor:"pointer",
      }}>
        ✨ 返回小屋
      </button>
    </div>
  );

  if (phase === "ending" && ending === "dream") return (
    <div style={{ padding:"24px 16px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🌙</div>
      <div style={{ color:"rgba(255,255,255,.9)", fontSize:13, lineHeight:1.8, margin:"0 16px 16px" }}>
        书房门没有打开。星空旋转，地板变成彩虹糖浆。<br/>
        <br/>
        糯糯：「原来……梦里的世界这么漂亮。我想再玩一会儿。」<br/>
        <br/>
        爸爸妈妈在现实世界等你。但梦里的时间，永远属于你。
      </div>
      <div style={{
        display:"flex", gap:12, justifyContent:"center", fontSize:28,
        marginBottom:16, animation:"float 2s ease-in-out infinite",
      }}>
        {[3,5,4,7].map((n,i) => (
          <span key={i} style={{ color:"#ffd700", textShadow:"0 0 12px #ffd700" }}>{n}</span>
        ))}
      </div>
      <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", marginBottom:16 }}>
        梦境永恒。—— 前端小屋 · 糯糯
      </div>
      <button onClick={onEnd} style={{
        background:"rgba(255,255,255,.2)", border:"none", borderRadius:20,
        padding:"8px 24px", fontSize:13, color:"#fff", cursor:"pointer",
      }}>
        ✨ 返回小屋
      </button>
    </div>
  );

  return null;
}

// ──────────── 主组件 ────────────
export default function NoonoDream({ onClose }) {
  const [phase, setPhase] = useState("intro"); // intro | explore | study | ending
  const [currentRoom, setCurrentRoom] = useState("living");
  const [found, setFound] = useState([null, null, null, null]); // [digit0..3]
  const [roomDone, setRoomDone] = useState({ living:false, bedroom:false, kitchen:false, nono:false });
  const [unlocked, setUnlocked] = useState(false);

  const roomOrder = CONFIG.roomOrder;
  const allFound = found.every(v => v != null);

  useEffect(() => {
    bgmStart("dream");
    return () => bgmStopAll();
  }, []);

  function collectDigit(slotIndex, digit) {
    setFound(prev => { const n=[...prev]; n[slotIndex]=digit; return n; });
    const roomKey = roomOrder[slotIndex];
    setRoomDone(prev => ({ ...prev, [roomKey]: true }));
  }

  const bg = "linear-gradient(160deg,#1a0533 0%,#0d1a3a 50%,#0a2a1a 100%)";

  // 入场动画
  if (phase === "intro") return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      background:bg, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      animation:"fadeIn .5s ease",
    }}>
      <div style={{ textAlign:"center", padding:"0 32px" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✨</div>
        <div style={{ color:"#ffd700", fontSize:22, fontFamily:"'Noto Serif SC',serif", marginBottom:8 }}>
          糯糯的梦境大冒险
        </div>
        <div style={{ color:"rgba(255,255,255,.7)", fontSize:13, lineHeight:1.8, marginBottom:24 }}>
          书房的门在梦里迷路啦。<br/>帮糯糯找到四个数字，送它回家好不好？
        </div>
        <button onClick={() => setPhase("explore")} style={{
          background:"linear-gradient(135deg,#a29bfe,#6c5ce7)", border:"none",
          borderRadius:24, padding:"12px 32px", fontSize:15, color:"#fff",
          cursor:"pointer", fontWeight:"bold", boxShadow:"0 4px 20px rgba(108,92,231,.5)",
        }}>
          开始冒险 →
        </button>
        <div style={{ marginTop:16 }}>
          <button onClick={onClose} style={{
            background:"none", border:"none", color:"rgba(255,255,255,.4)",
            fontSize:12, cursor:"pointer",
          }}>× 关闭</button>
        </div>
      </div>
    </div>
  );

  if (phase === "explore") return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      background:bg, display:"flex", flexDirection:"column",
      overflow:"hidden",
    }}>
      {/* 顶部 */}
      <div style={{
        padding:"14px 16px 8px", display:"flex", alignItems:"center",
        justifyContent:"space-between", flexShrink:0,
      }}>
        <div style={{ color:"#ffd700", fontSize:14, fontFamily:"'Noto Serif SC',serif" }}>
          🌙 糯糯的梦
        </div>
        <button onClick={onClose} style={{
          background:"none", border:"none", color:"rgba(255,255,255,.4)",
          fontSize:20, cursor:"pointer", padding:4,
        }}>×</button>
      </div>

      {/* 数字槽 */}
      <DigitSlots found={found} />

      {/* 房间导航 */}
      <div style={{
        display:"flex", gap:6, padding:"0 12px 8px", overflowX:"auto",
        flexShrink:0,
      }}>
        {roomOrder.map((key, i) => {
          const r = ROOMS[key];
          return (
            <button
              key={key}
              onClick={() => setCurrentRoom(key)}
              style={{
                background: currentRoom === key
                  ? "rgba(255,215,0,.25)"
                  : "rgba(255,255,255,.1)",
                border: `1.5px solid ${currentRoom === key ? "#ffd700" : "rgba(255,255,255,.2)"}`,
                borderRadius:20, padding:"6px 12px", fontSize:12,
                color: currentRoom === key ? "#ffd700" : "rgba(255,255,255,.7)",
                cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
              }}
            >
              {roomDone[key] ? "✓ " : ""}{r.emoji} {r.name}
            </button>
          );
        })}
        {allFound && (
          <button
            onClick={() => setPhase("study")}
            style={{
              background:"linear-gradient(135deg,#ffd700,#ffaa00)",
              border:"none", borderRadius:20, padding:"6px 14px",
              fontSize:12, color:"#333", cursor:"pointer",
              fontWeight:"bold", whiteSpace:"nowrap", flexShrink:0,
            }}
          >
            📚 去书房
          </button>
        )}
      </div>

      {/* 提示 */}
      <HintBubble text={ROOMS[currentRoom].hint} />

      {/* 房间内容 */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 4px" }}>
        {currentRoom === "living"  && <LivingRoom  onCollect={collectDigit} />}
        {currentRoom === "bedroom" && <BedroomRoom onCollect={collectDigit} />}
        {currentRoom === "kitchen" && <KitchenRoom onCollect={collectDigit} />}
        {currentRoom === "nono"    && <NonoRoom    onCollect={collectDigit} />}
      </div>
    </div>
  );

  if (phase === "study") return (
    <div style={{
      position:"fixed", inset:0, zIndex:200,
      background:"linear-gradient(160deg,#0d0d2b 0%,#1a0533 100%)",
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>
      <div style={{
        padding:"14px 16px 8px", display:"flex", alignItems:"center",
        justifyContent:"space-between", flexShrink:0,
      }}>
        <div style={{ color:"#a29bfe", fontSize:14, fontFamily:"'Noto Serif SC',serif" }}>
          📚 书房
        </div>
        <button onClick={() => setPhase("explore")} style={{
          background:"none", border:"none", color:"rgba(255,255,255,.4)",
          fontSize:13, cursor:"pointer",
        }}>← 返回</button>
      </div>

      {!unlocked
        ? <StudyLock found={found} onUnlock={() => setUnlocked(true)} />
        : <StudyEnding onEnd={onClose} />
      }
    </div>
  );

  return null;
}
