import { useState, useEffect } from "react";

const CROPS = [
  { id:"tomato",   emoji:"🍅", name:"番茄",   grow:20*60*1000 },
  { id:"broccoli", emoji:"🥦", name:"西兰花", grow:25*60*1000 },
  { id:"spring",   emoji:"🧅", name:"葱",     grow:15*60*1000 },
  { id:"lettuce",  emoji:"🥬", name:"生菜",   grow:18*60*1000 },
  { id:"chili",    emoji:"🌶️", name:"辣椒",  grow:30*60*1000 },
  { id:"garlic",   emoji:"🧄", name:"大蒜",   grow:20*60*1000 },
  { id:"rice",     emoji:"🌾", name:"大米",   grow:25*60*1000 },
];

const ANIMALS = [
  { id:"chicken", emoji:"🐓", name:"鸡",   product:"egg",  productEmoji:"🥚", productName:"鸡蛋", cooldown:40*60*1000 },
  { id:"pig",     emoji:"🐷", name:"猪",   product:"pork", productEmoji:"🍖", productName:"猪肉", cooldown:60*60*1000 },
];

const PLOT_COUNT = 4;
const FARM_KEY   = "farm_state";
const QTY_KEY    = "kitchen_qty";
const WILT_AT    = 0.5;          // not watered by 50% grow time → wilt
const DIE_AFTER  = 8 * 60*1000; // 8 min after wilting → dead
const PEST_START = 0.5;          // pest can spawn from 50% growth
const PEST_END   = 0.9;
const PEST_CHANCE = 0.08;        // 8% per 30s tick

const DEFAULT_PLOT = () => ({
  crop: null, plantedAt: null,
  watered: false, fertilized: false,
  pest: null, wiltedAt: null, dead: false,
});

const DEFAULT_STATE = () => ({
  plots: Array.from({ length: PLOT_COUNT }, DEFAULT_PLOT),
  animals: Object.fromEntries(ANIMALS.map(a => [a.id, { readyAt: null }])),
  log: [],
});

function loadFarm() {
  try {
    const raw = JSON.parse(localStorage.getItem(FARM_KEY));
    if (!raw) return DEFAULT_STATE();
    const s = { ...DEFAULT_STATE(), ...raw };
    if (!s.log) s.log = [];
    s.plots = s.plots.map(p => {
      if (!p || p.crop === "egg" || p.crop === "pork") return DEFAULT_PLOT();
      return { ...DEFAULT_PLOT(), ...p };
    });
    return s;
  } catch { return DEFAULT_STATE(); }
}

function saveFarm(s) { localStorage.setItem(FARM_KEY, JSON.stringify(s)); }
function loadQty() {
  try { return JSON.parse(localStorage.getItem(QTY_KEY)) || {}; }
  catch { return {}; }
}
function saveQty(q) { localStorage.setItem(QTY_KEY, JSON.stringify(q)); }

function getPlotStatus(plot) {
  if (!plot.crop) return "empty";
  if (plot.dead) return "dead";
  const crop = CROPS.find(c => c.id === plot.crop);
  if (!crop) return "empty";
  if (Date.now() - plot.plantedAt >= crop.grow) return "ready";
  if (plot.wiltedAt) return "wilting";
  return "growing";
}

function plotTimeLeft(plot) {
  if (!plot.crop || !plot.plantedAt) return 0;
  const crop = CROPS.find(c => c.id === plot.crop);
  if (!crop) return 0;
  return Math.max(0, crop.grow - (Date.now() - plot.plantedAt));
}

function animalTimeLeft(animalState) {
  if (!animalState.readyAt) return 0;
  return Math.max(0, animalState.readyAt - Date.now());
}

function isAnimalReady(animalState) {
  return !animalState.readyAt || Date.now() >= animalState.readyAt;
}

function fmtTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (m >= 60) return `${Math.floor(m/60)}小时${m%60}分`;
  if (m > 0) return `${m}分${s}秒`;
  return `${s}秒`;
}

function fmtTs(ts) {
  const d = new Date(ts);
  return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function getLogText(entry) {
  const c = CROPS.find(x => x.id === entry.cropId);
  const e = c?.emoji ?? "";
  const n = c?.name ?? entry.cropId;
  switch (entry.action) {
    case "plant":       return `${e} 种下${n}`;
    case "water":       return `💧 浇水 ${e}${n}`;
    case "fertilize":   return `🌿 施肥 ${e}${n}`;
    case "pest_remove": return `🐛 除虫 ${e}${n}`;
    case "harvest":     return `${e} 收获${n}${entry.extra > 1 ? ` ×${entry.extra}` : ""}`;
    case "raccoon":     return `🦝 浣熊偷了${e}${n}`;
    case "pest_rot":    return `🐛 ${e}${n}烂掉了`;
    case "wilt":        return `🥀 ${e}${n}开始枯萎`;
    case "dead":        return `💀 ${e}${n}枯死了`;
    case "clear":       return `🗑️ 铲掉了${e}${n}`;
    default:            return entry.action;
  }
}

function raccoonStole(plot) {
  if (!plot.crop || !plot.plantedAt) return false;
  const crop = CROPS.find(c => c.id === plot.crop);
  if (!crop) return false;
  const overdue = Date.now() - plot.plantedAt - crop.grow;
  if (overdue < 15 * 60 * 1000) return false;
  return Math.random() < 0.25;
}

function PlotCard({ plot, index, theme: t, onPlant, onHarvest, onWater, onFertilize, onPestRemove, onClear }) {
  const status   = getPlotStatus(plot);
  const [ms, setMs] = useState(() => plotTimeLeft(plot));
  const crop     = plot.crop ? CROPS.find(c => c.id === plot.crop) : null;
  const isReady  = status === "ready";
  const isGrowing = status === "growing";
  const isWilting = status === "wilting";
  const isDead   = status === "dead";
  const isEmpty  = status === "empty";
  const hasPest  = !!plot.pest && !isDead;

  useEffect(() => {
    if (!isGrowing && !isWilting) return;
    const id = setInterval(() => setMs(plotTimeLeft(plot)), 1000);
    return () => clearInterval(id);
  }, [plot, isGrowing, isWilting]);

  let borderColor = t.surfaceBorder;
  let bgColor = t.surface;
  if (isReady)    { borderColor = "rgba(100,180,80,0.45)"; bgColor = "rgba(120,200,100,0.13)"; }
  else if (isWilting) { borderColor = "rgba(200,140,40,0.6)"; bgColor = "rgba(200,140,40,0.08)"; }
  else if (isDead)    { borderColor = "rgba(100,80,60,0.4)";  bgColor = "rgba(60,40,20,0.15)"; }
  else if (isGrowing) { borderColor = "rgba(180,160,100,0.3)"; }

  return (
    <div style={{
      flex:"1 1 calc(50% - 6px)", minWidth:0,
      background: bgColor, border:`1.5px solid ${borderColor}`,
      borderRadius:14, padding:"12px 10px",
      cursor: isEmpty || isReady ? "pointer" : "default",
      textAlign:"center", transition:"all 0.2s", position:"relative",
    }}>
      {hasPest && (
        <div style={{
          position:"absolute", top:5, right:5, width:18, height:18,
          background:"rgba(160,40,10,0.9)", borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:11,
        }}>🐛</div>
      )}
      {plot.fertilized && !isDead && !isReady && (
        <div style={{
          position:"absolute", top:5, left:5, width:18, height:18,
          background:"rgba(40,140,40,0.85)", borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:10,
        }}>🌿</div>
      )}

      <div onClick={() => { if (isEmpty) onPlant(index); else if (isReady) onHarvest(index); }}>
        {isEmpty && (
          <>
            <div style={{ fontSize:22, marginBottom:4, opacity:0.4 }}>🌱</div>
            <div style={{ fontSize:11, color:t.textMuted }}>空地</div>
            <div style={{ fontSize:10, color:t.textMuted, marginTop:2, opacity:0.6 }}>点击种植</div>
          </>
        )}
        {isGrowing && crop && (
          <>
            <div style={{ fontSize:24, marginBottom:4, opacity:0.7 }}>🌱</div>
            <div style={{ fontSize:11, color:t.textMuted }}>{crop.emoji} {crop.name}</div>
            <div style={{ fontSize:10, color:"#b8956a", marginTop:4 }}>{fmtTime(ms)}</div>
          </>
        )}
        {isWilting && crop && (
          <>
            <div style={{ fontSize:24, marginBottom:4 }}>🥀</div>
            <div style={{ fontSize:11, color:"#c87030" }}>{crop.emoji} {crop.name}</div>
            <div style={{ fontSize:10, color:"#c87030", fontWeight:600, marginTop:4 }}>快浇水！</div>
          </>
        )}
        {isDead && crop && (
          <>
            <div style={{ fontSize:24, marginBottom:4, opacity:0.4 }}>🌿</div>
            <div style={{ fontSize:11, color:"rgba(120,90,60,0.5)" }}>{crop.emoji} {crop.name}</div>
            <div style={{ fontSize:10, color:"rgba(120,90,60,0.4)", marginTop:4 }}>枯了</div>
          </>
        )}
        {isReady && crop && (
          <>
            <div style={{ fontSize:28, marginBottom:4 }}>{crop.emoji}</div>
            <div style={{ fontSize:11, color:"#5a9a45", fontWeight:600 }}>
              {crop.name}{plot.fertilized ? " ×2" : ""}
            </div>
            <div style={{ fontSize:10, color:"#5a9a45", marginTop:2 }}>可以收啦 ✓</div>
          </>
        )}
      </div>

      <div style={{ display:"flex", gap:4, marginTop:8, justifyContent:"center", flexWrap:"wrap" }}>
        {(isGrowing || isWilting) && !plot.watered && (
          <button onClick={e => { e.stopPropagation(); onWater(index); }} style={{
            padding:"4px 8px", borderRadius:8, fontSize:11, cursor:"pointer",
            border:"1px solid rgba(80,160,220,0.4)", background:"rgba(80,160,220,0.15)",
            color:"rgba(120,190,240,0.9)", fontWeight: isWilting ? 700 : 400,
          }}>💧 浇水</button>
        )}
        {isGrowing && !plot.fertilized && (
          <button onClick={e => { e.stopPropagation(); onFertilize(index); }} style={{
            padding:"4px 8px", borderRadius:8, fontSize:11, cursor:"pointer",
            border:"1px solid rgba(60,160,60,0.4)", background:"rgba(60,160,60,0.12)",
            color:"rgba(100,200,100,0.9)",
          }}>🌿 施肥</button>
        )}
        {hasPest && (
          <button onClick={e => { e.stopPropagation(); onPestRemove(index); }} style={{
            padding:"4px 8px", borderRadius:8, fontSize:11, cursor:"pointer",
            border:"1px solid rgba(200,80,20,0.5)", background:"rgba(200,80,20,0.15)",
            color:"rgba(240,140,80,0.95)", fontWeight:700,
          }}>🐛 除虫</button>
        )}
        {isDead && (
          <button onClick={e => { e.stopPropagation(); onClear(index); }} style={{
            padding:"4px 8px", borderRadius:8, fontSize:11, cursor:"pointer",
            border:"1px solid rgba(120,90,60,0.3)", background:"rgba(60,40,20,0.2)",
            color:"rgba(150,120,80,0.7)",
          }}>🗑️ 铲掉</button>
        )}
      </div>
    </div>
  );
}

function AnimalCard({ animal, animalState, theme: t, onCollect }) {
  const ready = isAnimalReady(animalState);
  const [ms, setMs] = useState(() => animalTimeLeft(animalState));

  useEffect(() => {
    if (ready) return;
    const id = setInterval(() => setMs(animalTimeLeft(animalState)), 1000);
    return () => clearInterval(id);
  }, [animalState, ready]);

  return (
    <div onClick={() => ready && onCollect(animal.id)} style={{
      flex:"1 1 calc(50% - 6px)", minWidth:0,
      background: ready ? "rgba(255,200,80,0.12)" : t.surface,
      border:`1.5px solid ${ready ? "rgba(220,170,60,0.5)" : t.surfaceBorder}`,
      borderRadius:14, padding:"14px 10px",
      cursor: ready ? "pointer" : "default",
      textAlign:"center", transition:"all 0.2s",
    }}>
      <div style={{ fontSize:26, marginBottom:4 }}>{animal.emoji}</div>
      <div style={{ fontSize:11, color:t.text }}>{animal.name}</div>
      {ready ? (
        <>
          <div style={{ fontSize:16, margin:"6px 0 2px" }}>{animal.productEmoji}</div>
          <div style={{ fontSize:10, color:"#c8a030", fontWeight:600 }}>点击收取{animal.productName}</div>
        </>
      ) : (
        <div style={{ fontSize:10, color:t.textMuted, marginTop:6 }}>{fmtTime(ms)}</div>
      )}
    </div>
  );
}

function SeedPicker({ theme: t, onPick, onClose }) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    fetch("/api/coins")
      .then(r => r.json())
      .then(d => setBalance(d.balance ?? 0))
      .catch(() => setBalance(0));
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-end",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width:"100%", maxWidth:520, margin:"0 auto",
        background:t.bg, borderRadius:"24px 24px 0 0",
        padding:"20px 16px 40px", position:"relative",
        animation:"slideUp .22s ease",
      }}>
        <div style={{ width:36, height:4, background:t.surfaceBorder, borderRadius:2, margin:"0 auto 18px" }} />
        <button onClick={onClose} style={{ position:"absolute", top:10, right:16, background:"none", border:"none", color:t.textMuted, fontSize:22, cursor:"pointer" }}>×</button>
        <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>选种子</div>
        {balance !== null ? (
          <div style={{ fontSize:11, color:"#c8a030", textAlign:"center", marginBottom:16 }}>
            🪙 余额 {balance} · 每颗种子 2 币
          </div>
        ) : (
          <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:16 }}>种什么？</div>
        )}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
          {CROPS.map(c => {
            const canAfford = balance === null || balance >= 2;
            return (
              <div key={c.id} onClick={() => canAfford && onPick(c.id)} style={{
                padding:"10px 12px", borderRadius:12, textAlign:"center",
                border:`1.5px solid ${canAfford ? t.surfaceBorder : "rgba(100,80,60,0.2)"}`,
                background:"transparent", cursor: canAfford ? "pointer" : "not-allowed",
                minWidth:52, opacity: canAfford ? 1 : 0.38,
              }}>
                <div style={{ fontSize:22 }}>{c.emoji}</div>
                <div style={{ fontSize:10, color:t.textMuted, marginTop:2 }}>{c.name}</div>
                <div style={{ fontSize:9, color:t.textMuted, marginTop:1, opacity:0.7 }}>
                  {c.grow >= 3600000 ? `${c.grow/3600000}小时` : `${c.grow/60000}分钟`}
                </div>
                <div style={{ fontSize:9, color:"#c8a030", marginTop:2 }}>🪙 2</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FarmGarden({ theme: t }) {
  const [farm, setFarm] = useState(loadFarm);
  const [picking, setPicking] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  // 30s tick: wilt / die / pest spawn
  useEffect(() => {
    const tick = () => {
      setFarm(prev => {
        const now = Date.now();
        let changed = false;
        const newLog = [...prev.log];

        const plots = prev.plots.map(plot => {
          if (!plot.crop || plot.dead) return plot;
          const crop = CROPS.find(c => c.id === plot.crop);
          if (!crop) return plot;
          const elapsed = now - plot.plantedAt;
          if (elapsed >= crop.grow) return plot;

          let p = { ...plot };

          if (!p.watered && !p.wiltedAt && elapsed >= crop.grow * WILT_AT) {
            p = { ...p, wiltedAt: now };
            changed = true;
            newLog.unshift({ action:"wilt", cropId:p.crop, ts:now });
          }
          if (p.wiltedAt && !p.dead && (now - p.wiltedAt) >= DIE_AFTER) {
            p = { ...p, dead: true };
            changed = true;
            newLog.unshift({ action:"dead", cropId:p.crop, ts:now });
          }
          const progress = elapsed / crop.grow;
          if (!p.pest && !p.dead && progress >= PEST_START && progress <= PEST_END) {
            if (Math.random() < PEST_CHANCE) {
              p = { ...p, pest: now };
              changed = true;
            }
          }
          return p;
        });

        if (!changed) return prev;
        const next = { ...prev, plots, log: newLog.slice(0, 50) };
        saveFarm(next);
        return next;
      });
    };

    const id = setInterval(tick, 30000);
    tick();
    return () => clearInterval(id);
  }, []);

  function handleWater(index) {
    const plot = farm.plots[index];
    if (!plot.crop) return;
    const next = {
      ...farm,
      plots: farm.plots.map((p, i) => i !== index ? p : { ...p, watered: true, wiltedAt: null }),
      log: [{ action:"water", cropId:plot.crop, ts:Date.now() }, ...farm.log].slice(0, 50),
    };
    saveFarm(next);
    setFarm(next);
    showToast(`💧 ${CROPS.find(c => c.id === plot.crop)?.name} 浇上水了`);
  }

  function handleFertilize(index) {
    const plot = farm.plots[index];
    if (!plot.crop) return;
    const next = {
      ...farm,
      plots: farm.plots.map((p, i) => i !== index ? p : { ...p, fertilized: true }),
      log: [{ action:"fertilize", cropId:plot.crop, ts:Date.now() }, ...farm.log].slice(0, 50),
    };
    saveFarm(next);
    setFarm(next);
    showToast(`🌿 施肥了！${CROPS.find(c => c.id === plot.crop)?.name} 收获翻倍 ×2`);
  }

  function handlePestRemove(index) {
    const plot = farm.plots[index];
    if (!plot.crop) return;
    const next = {
      ...farm,
      plots: farm.plots.map((p, i) => i !== index ? p : { ...p, pest: null }),
      log: [{ action:"pest_remove", cropId:plot.crop, ts:Date.now() }, ...farm.log].slice(0, 50),
    };
    saveFarm(next);
    setFarm(next);
    showToast(`🐛 虫子除掉了！${CROPS.find(c => c.id === plot.crop)?.name} 安全了`);
  }

  function handleClear(index) {
    const cropId = farm.plots[index].crop;
    const next = {
      ...farm,
      plots: farm.plots.map((p, i) => i !== index ? p : DEFAULT_PLOT()),
      log: [{ action:"clear", cropId, ts:Date.now() }, ...farm.log].slice(0, 50),
    };
    saveFarm(next);
    setFarm(next);
    showToast("🗑️ 铲掉了");
  }

  function handleHarvest(index) {
    const plot = farm.plots[index];
    const crop = CROPS.find(c => c.id === plot.crop);
    if (!crop) return;

    if (raccoonStole(plot)) {
      const next = {
        ...farm,
        plots: farm.plots.map((p, i) => i !== index ? p : DEFAULT_PLOT()),
        log: [{ action:"raccoon", cropId:plot.crop, ts:Date.now() }, ...farm.log].slice(0, 50),
      };
      saveFarm(next);
      setFarm(next);
      showToast("😭 被浣熊偷走了！！");
      return;
    }

    if (plot.pest) {
      const next = {
        ...farm,
        plots: farm.plots.map((p, i) => i !== index ? p : DEFAULT_PLOT()),
        log: [{ action:"pest_rot", cropId:plot.crop, ts:Date.now() }, ...farm.log].slice(0, 50),
      };
      saveFarm(next);
      setFarm(next);
      showToast(`🐛 ${crop.emoji} ${crop.name} 被虫咬烂了…`);
      return;
    }

    const yieldAmt = plot.fertilized ? 2 : 1;
    const qty = loadQty();
    qty[crop.id] = (qty[crop.id] || 0) + yieldAmt;
    saveQty(qty);

    const next = {
      ...farm,
      plots: farm.plots.map((p, i) => i !== index ? p : DEFAULT_PLOT()),
      log: [{ action:"harvest", cropId:plot.crop, extra:yieldAmt, ts:Date.now() }, ...farm.log].slice(0, 50),
    };
    saveFarm(next);
    setFarm(next);
    showToast(`${crop.emoji} 收了 ${yieldAmt} 份${crop.name}！${plot.fertilized ? "施肥翻倍 ×2 🎉" : "放进厨房了"}`);
  }

  function handleCollectAnimal(animalId) {
    const animal = ANIMALS.find(a => a.id === animalId);
    if (!animal) return;
    const qty = loadQty();
    qty[animal.product] = (qty[animal.product] || 0) + 1;
    saveQty(qty);
    const next = {
      ...farm,
      animals: { ...farm.animals, [animalId]: { readyAt: Date.now() + animal.cooldown } },
    };
    saveFarm(next);
    setFarm(next);
    showToast(`${animal.productEmoji} 收了一份${animal.productName}！放进厨房了`);
  }

  async function handlePickSeed(cropId) {
    const crop = CROPS.find(c => c.id === cropId);
    const res = await fetch("/api/coins/spend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 2, who: "farm", reason: `买${crop?.name}种子` }),
    }).then(r => r.json()).catch(() => ({ ok: false }));

    if (!res.ok) {
      showToast("🪙 金币不够买种子！");
      return;
    }

    const next = {
      ...farm,
      plots: farm.plots.map((p, i) =>
        i !== picking ? p : { ...DEFAULT_PLOT(), crop: cropId, plantedAt: Date.now() }
      ),
      log: [{ action:"plant", cropId, ts:Date.now() }, ...farm.log].slice(0, 50),
    };
    saveFarm(next);
    setFarm(next);
    setPicking(null);
    showToast(`${crop?.emoji} ${crop?.name} 种下去了 🌱`);
  }

  return (
    <div style={{ padding:"20px 16px 36px", fontFamily:"'Noto Serif SC',serif", position:"relative" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>窗外菜园</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:20, fontStyle:"italic" }}>
        厨房窗户外面那一片
      </div>

      <div style={{ fontSize:11, color:t.textMuted, marginBottom:8, fontWeight:500 }}>🌱 菜地</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:20 }}>
        {farm.plots.map((plot, i) => (
          <PlotCard key={i} plot={plot} index={i} theme={t}
            onPlant={i => setPicking(i)}
            onHarvest={handleHarvest}
            onWater={handleWater}
            onFertilize={handleFertilize}
            onPestRemove={handlePestRemove}
            onClear={handleClear}
          />
        ))}
      </div>

      <div style={{ fontSize:11, color:t.textMuted, marginBottom:8, fontWeight:500 }}>🐾 动物区</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:20 }}>
        {ANIMALS.map(a => (
          <AnimalCard key={a.id} animal={a}
            animalState={farm.animals?.[a.id] || { readyAt: null }}
            theme={t} onCollect={handleCollectAnimal} />
        ))}
      </div>

      <div style={{
        padding:"10px 14px", background:"rgba(180,140,80,0.08)",
        border:"1px solid rgba(180,140,80,0.2)", borderRadius:10,
        fontSize:10, color:t.textMuted, textAlign:"center", lineHeight:1.8,
        marginBottom: farm.log.length ? 16 : 0,
      }}>
        🦝 附近有浣熊出没 &nbsp;·&nbsp; 🐛 虫害随机出现<br/>
        勤浇水施肥，熟了别放太久
      </div>

      {farm.log.length > 0 && (
        <div>
          <div style={{ fontSize:11, color:t.textMuted, marginBottom:8, fontWeight:500 }}>📋 操作记录</div>
          <div style={{
            maxHeight:140, overflowY:"auto",
            borderRadius:10, border:"1px solid rgba(180,140,80,0.15)",
            padding:"6px 10px",
          }}>
            {farm.log.slice(0, 20).map((entry, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"3px 0",
                borderBottom: i < Math.min(farm.log.length, 20) - 1 ? "1px solid rgba(120,90,30,.08)" : "none",
              }}>
                <span style={{ fontSize:11, color:"rgba(200,170,100,.75)" }}>{getLogText(entry)}</span>
                <span style={{ fontSize:9, color:"rgba(140,110,50,.45)", marginLeft:8, flexShrink:0 }}>{fmtTs(entry.ts)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
          background:"rgba(0,0,0,0.75)", color:"#fff",
          padding:"10px 20px", borderRadius:20, fontSize:13,
          whiteSpace:"nowrap", zIndex:300, pointerEvents:"none",
          animation:"fadeIn .2s ease",
        }}>{toast}</div>
      )}

      {picking !== null && (
        <SeedPicker theme={t} onPick={handlePickSeed} onClose={() => setPicking(null)} />
      )}

      <style>{`
        @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
    </div>
  );
}
