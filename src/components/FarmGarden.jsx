import { useState, useEffect, useCallback } from "react";

const CROPS = [
  { id:"tomato",   emoji:"🍅", name:"番茄",   grow:20*60*1000 },
  { id:"egg",      emoji:"🥚", name:"鸡蛋",   grow:40*60*1000 },
  { id:"broccoli", emoji:"🥦", name:"西兰花", grow:25*60*1000 },
  { id:"spring",   emoji:"🧅", name:"葱",     grow:15*60*1000 },
  { id:"lettuce",  emoji:"🥬", name:"生菜",   grow:18*60*1000 },
  { id:"chili",    emoji:"🌶️", name:"辣椒",  grow:30*60*1000 },
  { id:"garlic",   emoji:"🧄", name:"大蒜",   grow:20*60*1000 },
  { id:"rice",     emoji:"🌾", name:"大米",   grow:25*60*1000 },
  { id:"pork",     emoji:"🍖", name:"猪肉",   grow:60*60*1000 },
];

const PLOT_COUNT = 4;
const FARM_KEY = "farm_state";
const QTY_KEY  = "kitchen_qty";

const DEFAULT_STATE = {
  plots: Array.from({ length: PLOT_COUNT }, () => ({ crop: null, plantedAt: null })),
};

function loadFarm() {
  try { return JSON.parse(localStorage.getItem(FARM_KEY)) || DEFAULT_STATE; }
  catch { return DEFAULT_STATE; }
}
function saveFarm(s) { localStorage.setItem(FARM_KEY, JSON.stringify(s)); }
function loadQty() {
  try { return JSON.parse(localStorage.getItem(QTY_KEY)) || {}; }
  catch { return {}; }
}
function saveQty(q) { localStorage.setItem(QTY_KEY, JSON.stringify(q)); }

function isReady(plot) {
  if (!plot.crop || !plot.plantedAt) return false;
  const crop = CROPS.find(c => c.id === plot.crop);
  return crop && Date.now() - plot.plantedAt >= crop.grow;
}

function timeLeft(plot) {
  if (!plot.crop || !plot.plantedAt) return 0;
  const crop = CROPS.find(c => c.id === plot.crop);
  if (!crop) return 0;
  return Math.max(0, crop.grow - (Date.now() - plot.plantedAt));
}

function fmtTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (m >= 60) return `${Math.floor(m/60)}小时${m%60}分`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

// 浣熊偷菜概率：收成超时15分钟后，有25%被偷
function raccoonStole(plot) {
  if (!plot.crop || !plot.plantedAt) return false;
  const crop = CROPS.find(c => c.id === plot.crop);
  if (!crop) return false;
  const overdue = Date.now() - plot.plantedAt - crop.grow;
  if (overdue < 15 * 60 * 1000) return false;
  return Math.random() < 0.25;
}

function PlotCard({ plot, index, theme: t, onPlant, onHarvest }) {
  const [ms, setMs] = useState(() => timeLeft(plot));
  const ready = isReady(plot);
  const growing = plot.crop && !ready;
  const crop = plot.crop ? CROPS.find(c => c.id === plot.crop) : null;

  useEffect(() => {
    if (!growing) return;
    const id = setInterval(() => setMs(timeLeft(plot)), 1000);
    return () => clearInterval(id);
  }, [plot, growing]);

  return (
    <div onClick={() => {
      if (!plot.crop) onPlant(index);
      else if (ready) onHarvest(index);
    }} style={{
      flex:"1 1 calc(50% - 6px)", minWidth:0,
      background: ready ? "rgba(120,200,100,0.13)" : t.surface,
      border:`1.5px solid ${ready ? "rgba(100,180,80,0.45)" : growing ? "rgba(180,160,100,0.3)" : t.surfaceBorder}`,
      borderRadius:14, padding:"14px 10px",
      cursor: plot.crop ? (ready ? "pointer" : "default") : "pointer",
      textAlign:"center", transition:"all 0.2s",
      position:"relative", overflow:"hidden",
    }}>
      {!plot.crop && (
        <>
          <div style={{ fontSize:22, marginBottom:4, opacity:0.4 }}>🌱</div>
          <div style={{ fontSize:11, color:t.textMuted }}>空地</div>
          <div style={{ fontSize:10, color:t.textMuted, marginTop:2, opacity:0.6 }}>点击种植</div>
        </>
      )}
      {growing && crop && (
        <>
          <div style={{ fontSize:24, marginBottom:4, opacity:0.7 }}>🌱</div>
          <div style={{ fontSize:11, color:t.textMuted }}>{crop.emoji} {crop.name}</div>
          <div style={{ fontSize:10, color:"#b8956a", marginTop:4 }}>{fmtTime(ms)}</div>
        </>
      )}
      {ready && crop && (
        <>
          <div style={{ fontSize:28, marginBottom:4 }}>{crop.emoji}</div>
          <div style={{ fontSize:11, color:"#5a9a45", fontWeight:600 }}>{crop.name}</div>
          <div style={{ fontSize:10, color:"#5a9a45", marginTop:2 }}>可以收啦 ✓</div>
        </>
      )}
    </div>
  );
}

function SeedPicker({ theme: t, onPick, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-end",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width:"100%", maxWidth:520, margin:"0 auto",
        background:t.bg, borderRadius:"24px 24px 0 0",
        padding:"20px 16px 40px",
        animation:"slideUp .22s ease",
      }}>
        <div style={{ width:36, height:4, background:t.surfaceBorder, borderRadius:2, margin:"0 auto 18px" }} />
        <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>选种子</div>
        <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:18 }}>种什么？</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
          {CROPS.map(c => (
            <div key={c.id} onClick={() => onPick(c.id)} style={{
              padding:"10px 12px", borderRadius:12, textAlign:"center",
              border:`1.5px solid ${t.surfaceBorder}`,
              background:"transparent", cursor:"pointer",
              minWidth:52,
            }}>
              <div style={{ fontSize:22 }}>{c.emoji}</div>
              <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>{c.name}</div>
              <div style={{ fontSize:9, color:t.textMuted, marginTop:1, opacity:0.7 }}>
                {c.grow >= 3600000 ? `${c.grow/3600000}小时` : `${c.grow/60000}分钟`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FarmGarden({ theme: t }) {
  const [farm, setFarm] = useState(loadFarm);
  const [picking, setPicking] = useState(null); // plot index being planted
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function handlePlant(index) {
    setPicking(index);
  }

  function handleSeed(cropId) {
    const next = { ...farm, plots: farm.plots.map((p, i) =>
      i === picking ? { crop: cropId, plantedAt: Date.now() } : p
    )};
    saveFarm(next);
    setFarm(next);
    setPicking(null);
    const crop = CROPS.find(c => c.id === cropId);
    showToast(`${crop.emoji} ${crop.name} 种下去了 🌱`);
  }

  function handleHarvest(index) {
    const plot = farm.plots[index];
    const crop = CROPS.find(c => c.id === plot.crop);
    if (!crop) return;

    if (raccoonStole(plot)) {
      // 浣熊偷了
      const next = { ...farm, plots: farm.plots.map((p, i) =>
        i === index ? { crop: null, plantedAt: null } : p
      )};
      saveFarm(next);
      setFarm(next);
      showToast("😭 被浣熊偷走了！！");
      return;
    }

    // 正常收获 → 加入厨房库存
    const qty = loadQty();
    qty[crop.id] = (qty[crop.id] || 0) + 1;
    saveQty(qty);

    const next = { ...farm, plots: farm.plots.map((p, i) =>
      i === index ? { crop: null, plantedAt: null } : p
    )};
    saveFarm(next);
    setFarm(next);
    showToast(`${crop.emoji} 收获了一份${crop.name}！放进厨房了`);
  }

  return (
    <div style={{ padding:"20px 16px 36px", fontFamily:"'Noto Serif SC',serif", position:"relative" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>窗外菜园</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:4, fontStyle:"italic" }}>
        厨房窗户外面那一片
      </div>
      <div style={{ fontSize:10, color:t.textMuted, textAlign:"center", marginBottom:20, opacity:0.7 }}>
        收成放进厨房 · 小心浣熊
      </div>

      {/* 地块 */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:24 }}>
        {farm.plots.map((plot, i) => (
          <PlotCard key={i} plot={plot} index={i} theme={t}
            onPlant={handlePlant} onHarvest={handleHarvest} />
        ))}
      </div>

      {/* 浣熊提示 */}
      <div style={{
        padding:"10px 14px", background:"rgba(180,140,80,0.08)",
        border:"1px solid rgba(180,140,80,0.2)", borderRadius:10,
        fontSize:10, color:t.textMuted, textAlign:"center", lineHeight:1.8,
      }}>
        🦝 附近有浣熊出没<br/>熟了别放太久，它会来偷的
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
          background:"rgba(0,0,0,0.75)", color:"#fff",
          padding:"10px 20px", borderRadius:20, fontSize:13,
          whiteSpace:"nowrap", zIndex:300, pointerEvents:"none",
          animation:"fadeIn .2s ease",
        }}>{toast}</div>
      )}

      {/* 种子选择器 */}
      {picking !== null && (
        <SeedPicker theme={t} onPick={handleSeed} onClose={() => setPicking(null)} />
      )}

      <style>{`
        @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
    </div>
  );
}
