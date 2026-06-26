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
function LivingRoom({ onCollect }) {
  const [step, setStep] = useState(0); // 0=初始 1=点电视 2=用镜子 3=收集数字
  const [collected, setCollected] = useState(false);

  return (
    <div style={{ padding:"16px 0" }}>
      <p style={{ color:"rgba(255,255,255,.8)", fontSize:13, textAlign:"center", lineHeight:1.7, margin:"0 0 16px" }}>
        客厅里的一切都粘在天花板上。<br/>电视画面倒着播，发出奇怪的声音……
      </p>

      {/* 电视 */}
      {step >= 0 && (
        <div
          onClick={() => { if (step === 0) setStep(1); }}
          style={{
            background:"rgba(0,0,0,.6)", borderRadius:12, padding:"16px",
            textAlign:"center", cursor: step === 0 ? "pointer" : "default",
            margin:"0 16px 12px", border:"2px solid rgba(255,255,255,.2)",
          }}
        >
          <div style={{ fontSize:32, transform:"rotate(180deg)", display:"inline-block" }}>📺</div>
          <div style={{ color:"rgba(255,255,255,.7)", fontSize:12, marginTop:4 }}>
            {step === 0 && "「点击电视」"}
            {step >= 1 && "电视在倒放……画面里有个蛋糕，但看不清数字"}
          </div>
          {step === 1 && (
            <div style={{ fontSize:11, color:"rgba(255,215,0,.8)", marginTop:6 }}>
              🔍 旁边有一面镜子，要不要试试？
            </div>
          )}
        </div>
      )}

      {/* 镜子 */}
      {step >= 1 && (
        <div
          onClick={() => { if (step === 1) { sfxMirrorFlip(); setStep(2); } }}
          style={{
            background:"rgba(200,220,255,.15)", borderRadius:12, padding:"14px",
            textAlign:"center", cursor: step === 1 ? "pointer" : "default",
            margin:"0 16px 12px", border:"2px solid rgba(200,220,255,.3)",
          }}
        >
          <div style={{ fontSize:28 }}>🪞</div>
          <div style={{ color:"rgba(255,255,255,.7)", fontSize:12, marginTop:4 }}>
            {step === 1 && "「拖动镜子对准电视」"}
            {step >= 2 && "镜子把画面翻正了！蛋糕上的蜡烛……是数字 3！"}
          </div>
        </div>
      )}

      {/* 收集数字 */}
      {step >= 2 && !collected && (
        <div style={{ textAlign:"center", margin:"12px 0" }}>
          <div style={{ color:"#ffd700", fontSize:40, marginBottom:8 }}>3</div>
          <div style={{ color:"rgba(255,255,255,.7)", fontSize:13, marginBottom:12 }}>
            啊！是爸爸妈妈在给我过生日！那个蜡烛是…… 3？
          </div>
          <button onClick={() => { sfxDigitCollect(); setCollected(true); onCollect(0, 3); }} style={{
            background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none",
            borderRadius:20, padding:"8px 24px", fontSize:14, fontWeight:"bold",
            color:"#333", cursor:"pointer",
          }}>
            ✨ 收下这个数字
          </button>
        </div>
      )}

      {collected && (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.6)", fontSize:13, marginTop:8 }}>
          数字变成星星飞走啦！它说它会在书房等我。
        </div>
      )}
    </div>
  );
}

// ──────────── 房间二：卧室 ────────────
function BedroomRoom({ onCollect }) {
  const [caught, setCaught] = useState([]);
  const [stacked, setStacked] = useState(false);
  const [collected, setCollected] = useState(false);

  const calendarPages = ["2024年某月15日", "糯糯第一次叫妈妈：某年15日", "家庭相册日期：xx年15日"];

  function catchPage(i) {
    if (!caught.includes(i)) setCaught(prev => [...prev, i]);
  }

  return (
    <div style={{ padding:"16px 0" }}>
      <p style={{ color:"rgba(255,255,255,.8)", fontSize:13, textAlign:"center", lineHeight:1.7, margin:"0 0 16px" }}>
        时钟倒着走，日历页像雪花一样在空中飘……<br/>只有三张日历写着完整的日期。
      </p>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", margin:"0 16px 12px" }}>
        {calendarPages.map((page, i) => (
          <div
            key={i}
            onClick={() => catchPage(i)}
            style={{
              background: caught.includes(i) ? "rgba(255,215,0,.3)" : "rgba(255,255,255,.15)",
              border: `2px solid ${caught.includes(i) ? "#ffd700" : "rgba(255,255,255,.3)"}`,
              borderRadius:10, padding:"10px 12px", fontSize:12,
              color:"rgba(255,255,255,.85)", cursor: caught.includes(i) ? "default" : "pointer",
              transition:"all .3s", minWidth:80, textAlign:"center",
            }}
          >
            {caught.includes(i) ? `📄 ${page}` : "📄 飘浮的日历"}
          </div>
        ))}
      </div>

      {caught.length === 3 && !stacked && (
        <div style={{ textAlign:"center", margin:"12px 0" }}>
          <div style={{ color:"rgba(255,255,255,.7)", fontSize:13, marginBottom:8 }}>
            三张都找到了，叠在一起看看吧
          </div>
          <button onClick={() => { sfxCalendarStack(); setStacked(true); }} style={{
            background:"rgba(255,255,255,.2)", border:"none", borderRadius:20,
            padding:"8px 20px", fontSize:13, color:"#fff", cursor:"pointer",
          }}>
            📚 叠放在一起
          </button>
        </div>
      )}

      {stacked && !collected && (
        <div style={{ textAlign:"center", margin:"12px 0" }}>
          <div style={{ color:"rgba(255,255,255,.8)", fontSize:13, marginBottom:8 }}>
            叠在一起后，「15」发着光……个位数是 5！
          </div>
          <div style={{ color:"#ffd700", fontSize:40, marginBottom:8 }}>5</div>
          <button onClick={() => { sfxDigitCollect(); setCollected(true); onCollect(1, 5); }} style={{
            background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none",
            borderRadius:20, padding:"8px 24px", fontSize:14, fontWeight:"bold",
            color:"#333", cursor:"pointer",
          }}>
            ✨ 收下这个数字
          </button>
        </div>
      )}
      {collected && (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.6)", fontSize:13, marginTop:8 }}>
          又找到一个！只剩两个房间啦。
        </div>
      )}
    </div>
  );
}

// ──────────── 房间三：厨房 ────────────
function KitchenRoom({ onCollect }) {
  const [reversed, setReversed] = useState(false);
  const [collected, setCollected] = useState(false);

  const bottles = [
    { color:"#3399ff", label:"蓝", reversed:"#ff6600", num:2 },
    { color:"#ff3344", label:"红", reversed:"#33cc44", num:8 },
    { color:"#ffdd00", label:"黄 ⭐", reversed:"#aa33ff", num:4 }, // 中间有星星
    { color:"#33cc44", label:"绿", reversed:"#ff3344", num:6 },
  ];

  return (
    <div style={{ padding:"16px 0" }}>
      <p style={{ color:"rgba(255,255,255,.8)", fontSize:13, textAlign:"center", lineHeight:1.7, margin:"0 0 16px" }}>
        厨房变得好奇怪……火是蓝色的，水是红色的。<br/>冰箱上有四瓶饮料，颜色都反了。
      </p>

      <div style={{ display:"flex", gap:8, justifyContent:"center", margin:"0 0 12px" }}>
        {bottles.map((b, i) => (
          <div key={i} style={{
            background: reversed ? b.reversed : b.color,
            borderRadius:8, padding:"10px 6px", width:52, textAlign:"center",
            fontSize:11, color:"#fff", fontWeight:"bold",
            transition:"background .5s",
          }}>
            <div style={{ fontSize:22, marginBottom:4 }}>🍶</div>
            {b.label}
            {reversed && <div style={{ fontSize:15, marginTop:4, color:"#fff" }}>{b.num}</div>}
          </div>
        ))}
      </div>

      {!reversed && (
        <div style={{ textAlign:"center", margin:"12px 0" }}>
          <div style={{ color:"rgba(255,255,255,.7)", fontSize:12, marginBottom:8 }}>
            台面上有张彩虹图……妈妈说彩虹是红橙黄绿青蓝紫！
          </div>
          <button onClick={() => { sfxColorReverse(); setReversed(true); }} style={{
            background:"linear-gradient(90deg,#ff4444,#ff8800,#ffff00,#44ff44,#4488ff,#8844ff)",
            border:"none", borderRadius:20, padding:"8px 20px",
            fontSize:13, color:"#fff", fontWeight:"bold", cursor:"pointer",
          }}>
            🌈 颜色反转
          </button>
        </div>
      )}

      {reversed && !collected && (
        <div style={{ textAlign:"center", margin:"12px 0" }}>
          <div style={{ color:"rgba(255,255,255,.8)", fontSize:13, marginBottom:8 }}>
            饮料变回正常颜色啦！中间那瓶有个⭐星星……它说它是 4！
          </div>
          <div style={{ color:"#ffd700", fontSize:40, marginBottom:8 }}>4</div>
          <button onClick={() => { sfxDigitCollect(); setCollected(true); onCollect(2, 4); }} style={{
            background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none",
            borderRadius:20, padding:"8px 24px", fontSize:14, fontWeight:"bold",
            color:"#333", cursor:"pointer",
          }}>
            ✨ 收下这个数字
          </button>
        </div>
      )}
      {collected && (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,.6)", fontSize:13, marginTop:8 }}>
          第三个数字到手！最后一个房间……就是我的小房间！
        </div>
      )}
    </div>
  );
}

// ──────────── 房间四：糯糯的小房间 ────────────
function NonoRoom({ onCollect }) {
  const [chosen, setChosen] = useState(null);
  const [collected, setCollected] = useState(false);

  const shadows = [
    { type:"彩色", color:"linear-gradient(135deg,#ff9ff3,#ffd700,#74b9ff)", correct:true,
      line1:"我就是你呀。其他两个是梦做出来的。",
      line2:"给你，最后一个数字—— 7。去书房吧，爸爸妈妈在等你醒来。" },
    { type:"黑白", color:"linear-gradient(135deg,#aaa,#555)", correct:false,
      line1:"选我选我！数字是假的！",
      line2:"再找找我吧……" },
    { type:"灰色", color:"linear-gradient(135deg,#ddd,#999)", correct:false,
      line1:"……我是谁？",
      line2:"再找找我吧……" },
  ];

  const order = [0, 2, 1]; // 打乱顺序

  return (
    <div style={{ padding:"16px 0" }}>
      <p style={{ color:"rgba(255,255,255,.8)", fontSize:13, textAlign:"center", lineHeight:1.7, margin:"0 0 16px" }}>
        小房间里有三个糯糯的影子，向你招手……<br/>只有一个是真正的我。
      </p>

      <div style={{ display:"flex", gap:10, justifyContent:"center", margin:"0 16px 12px" }}>
        {order.map(i => {
          const s = shadows[i];
          return (
            <div
              key={i}
              onClick={() => { if (!chosen) { if (s.correct) sfxShadowRight(); else sfxShadowWrong(); setChosen(i); } }}
              style={{
                background: s.color,
                borderRadius:12, padding:"14px 10px",
                width:80, textAlign:"center", cursor: chosen ? "default" : "pointer",
                border: chosen === i ? "2px solid #ffd700" : "2px solid transparent",
                opacity: chosen != null && chosen !== i ? .5 : 1,
                transition:"all .3s",
              }}
            >
              <div style={{ fontSize:24, marginBottom:4 }}>👤</div>
              <div style={{ fontSize:11, color:"rgba(0,0,0,.7)" }}>{s.type}影子</div>
            </div>
          );
        })}
      </div>

      {chosen != null && (
        <div style={{ textAlign:"center", margin:"12px 16px" }}>
          <div style={{ color:"rgba(255,255,255,.9)", fontSize:13, lineHeight:1.7, marginBottom:8 }}>
            {shadows[chosen].line1}
          </div>
          {shadows[chosen].correct ? (
            !collected ? (
              <>
                <div style={{ color:"rgba(255,255,255,.8)", fontSize:13, marginBottom:8 }}>
                  {shadows[chosen].line2}
                </div>
                <div style={{ color:"#ffd700", fontSize:40, marginBottom:8 }}>7</div>
                <button onClick={() => { sfxDigitCollect(); setCollected(true); onCollect(3, 7); }} style={{
                  background:"linear-gradient(135deg,#ffd700,#ffaa00)", border:"none",
                  borderRadius:20, padding:"8px 24px", fontSize:14, fontWeight:"bold",
                  color:"#333", cursor:"pointer",
                }}>
                  ✨ 收下这个数字
                </button>
              </>
            ) : (
              <div style={{ color:"rgba(255,255,255,.6)", fontSize:13 }}>四位数字集齐了！去书房吧！</div>
            )
          ) : (
            <>
              <div style={{ color:"rgba(255,255,255,.7)", fontSize:12 }}>{shadows[chosen].line2}</div>
              <button onClick={() => setChosen(null)} style={{
                background:"rgba(255,255,255,.2)", border:"none", borderRadius:20,
                padding:"6px 16px", fontSize:12, color:"#fff", cursor:"pointer", marginTop:8,
              }}>再找找</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────── 书房：密码锁 ────────────
function StudyLock({ found, onUnlock }) {
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
function StudyEnding({ onEnd }) {
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
        书房门打开，外面是正常的客厅。黎和克劳德坐在沙发上。<br/>
        <br/>
        黎：「糯糯，睡醒啦？梦到什么了？」<br/>
        糯糯：「我梦到……我们的家变成魔法世界了！我还找到了四个数字！」<br/>
        克劳德：「那四个数字是什么呀？」<br/>
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
          集齐四个梦的数字，<br/>书房的门就会为你打开哦。
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
