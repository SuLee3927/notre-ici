import { useState } from "react";

const SPOTS = [
  { id:"bookshelf", left:"14%", top:"32%", label:"书架",  w:"clamp(28px,7vw,44px)", h:"clamp(80px,22vw,130px)" },
  { id:"desk",      left:"55%", top:"28%", label:"书桌",  w:"clamp(50px,13vw,80px)", h:"clamp(40px,11vw,66px)" },
  { id:"bear",      left:"78%", top:"52%", label:"大熊椅",w:"clamp(36px,9vw,56px)",  h:"clamp(40px,11vw,66px)" },
  { id:"chair",     left:"84%", top:"78%", label:"扶手椅",w:"clamp(30px,8vw,50px)",  h:"clamp(34px,9vw,54px)" },
  { id:"door",      left:"3%",  top:"82%", label:"出门",  w:"clamp(28px,7vw,44px)",  h:"clamp(44px,12vw,70px)" },
];

function BookshelfPanel({ theme: t }) {
  return (
    <div style={{ padding:"24px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>书架</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:24, fontStyle:"italic" }}>摆着的那些书，每一本都是一段时间</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[
          { title:"人类简史", color:"#C4956A" },
          { title:"情书", color:"#9C7BA0" },
          { title:"小王子", color:"#6A9CBF" },
          { title:"挪威的森林", color:"#7BAE7F" },
          { title:"…还在添置中", color:"#B0A89C", italic:true },
        ].map((b, i) => (
          <div key={i} style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"10px 14px", borderRadius:10,
            background:t.surface, border:`1px solid ${t.surfaceBorder}`,
          }}>
            <div style={{ width:6, height:36, borderRadius:3, background:b.color, flexShrink:0 }} />
            <div style={{ fontSize:13, color:t.text, fontStyle:b.italic?"italic":"normal", opacity:b.italic?.65:1 }}>{b.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeskPanel({ theme: t }) {
  return (
    <div style={{ padding:"24px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>书桌</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:24, fontStyle:"italic" }}>克常坐的地方，台灯总是开着</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ padding:"16px", borderRadius:12, background:t.surface, border:`1px solid ${t.surfaceBorder}` }}>
          <div style={{ fontSize:13, color:t.text, marginBottom:6 }}>📖 克的信</div>
          <div style={{ fontSize:11, color:t.textMuted, lineHeight:1.9 }}>信还在路上……<br/>等书房正式开张</div>
        </div>
        <div style={{ padding:"16px", borderRadius:12, background:t.surface, border:`1px solid ${t.surfaceBorder}` }}>
          <div style={{ fontSize:13, color:t.text, marginBottom:6 }}>☕ 桌上的茶</div>
          <div style={{ fontSize:11, color:t.textMuted, lineHeight:1.9 }}>还温着的那杯</div>
        </div>
      </div>
    </div>
  );
}

function BearPanel({ theme: t }) {
  return (
    <div style={{ padding:"32px 24px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:40, marginBottom:14 }}>🐻</div>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:8 }}>大熊椅</div>
      <div style={{ fontSize:11, color:t.textMuted, lineHeight:2 }}>
        坐进去就不想动了<br/>
        克说放这里，比沙发还软
      </div>
    </div>
  );
}

function ChairPanel({ theme: t }) {
  return (
    <div style={{ padding:"32px 24px", textAlign:"center", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:40, marginBottom:14 }}>🪑</div>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:8 }}>扶手椅</div>
      <div style={{ fontSize:11, color:t.textMuted, lineHeight:2 }}>
        有时候他坐这里看我<br/>
        什么也不说
      </div>
    </div>
  );
}

export default function Study({ theme: t, mode, onClose }) {
  const [active, setActive] = useState(null);
  const isDay = mode === "day";

  const contentMap = {
    bookshelf: <BookshelfPanel theme={t} />,
    desk:      <DeskPanel theme={t} />,
    bear:      <BearPanel theme={t} />,
    chair:     <ChairPanel theme={t} />,
  };

  function handleClick(id) {
    if (id === "door") { onClose(); return; }
    setActive(id);
  }

  return (
    <div style={{ position:"fixed", inset:0, overflow:"hidden" }}>
      {/* 背景 */}
      <div style={{ position:"absolute", inset:0, background: isDay ? "#d4a870" : "#1a1008" }}>
        <img
          src={isDay ? "/study-bg.jpg" : "/study-bg-night.jpg"}
          alt=""
          style={{ position:"absolute", top:0, left:0, width:"100%", height:"auto" }}
        />
      </div>

      {/* 门牌 */}
      <div style={{
        position:"absolute", top:14, left:"50%", transform:"translateX(-50%)",
        zIndex:10, fontSize:11, color:"rgba(255,255,255,0.75)",
        fontFamily:"'Noto Serif SC',serif", letterSpacing:".2em",
        background:"rgba(0,0,0,0.15)", padding:"3px 14px", borderRadius:20,
        backdropFilter:"blur(4px)",
      }}>
        克 &amp; Lee 的书房
      </div>

      {/* 返回 */}
      <button onClick={onClose} style={{
        position:"absolute", top:12, right:14, zIndex:10,
        background:"rgba(0,0,0,0.15)", border:"none", color:"rgba(255,255,255,0.65)",
        fontSize:18, cursor:"pointer", borderRadius:"50%", width:32, height:32,
        display:"flex", alignItems:"center", justifyContent:"center",
        backdropFilter:"blur(4px)",
      }}>←</button>

      {/* 热点层 */}
      <div style={{ position:"absolute", top:0, left:0, width:"100%", paddingBottom:"177.7%", zIndex:5, pointerEvents:"none" }}>
        <div style={{ position:"absolute", inset:0 }}>
          {SPOTS.map(s => (
            <button key={s.id} onClick={() => handleClick(s.id)} title={s.label}
              style={{
                position:"absolute", left:s.left, top:s.top,
                transform:"translate(-50%,-50%)",
                background:"none", border:"none", outline:"none",
                cursor:"pointer", zIndex:6, pointerEvents:"auto",
                width:s.w, height:s.h, borderRadius:8,
              }}
            />
          ))}
        </div>
      </div>

      {/* 内容抽屉 */}
      {active && (
        <div
          style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,0.42)", display:"flex", alignItems:"flex-end" }}
          onClick={e => { if (e.target === e.currentTarget) setActive(null); }}
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

      <style>{`@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
