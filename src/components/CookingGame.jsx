import { useState, useEffect } from "react";

// 合成音效（不依赖音频文件）
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep({ freq = 600, freqTo = null, duration = 0.08, type = "sine", gain = 0.25, delay = 0 }) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    const start = ctx.currentTime + delay;
    osc.start(start);
    if (freqTo !== null) osc.frequency.exponentialRampToValueAtTime(freqTo, start + duration);
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.stop(start + duration);
  } catch {}
}
function playSelectSound() { beep({ freq:880, duration:0.07, type:"sine", gain:0.22 }); }
function playSuccessSound() {
  beep({ freq:660, duration:0.14, type:"sine", gain:0.28 });
  beep({ freq:880, duration:0.2, type:"sine", gain:0.28, delay:0.1 });
}
function playFailSound() {
  beep({ freq:320, freqTo:130, duration:0.35, type:"square", gain:0.22 });
}
function playCookingSound() {
  try {
    const ctx = getAudioCtx();
    const bufferSize = ctx.sampleRate * 1.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.18;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.value = 0.2;
    noise.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    noise.start();
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
    noise.stop(ctx.currentTime + 1.1);
  } catch {}
}

// 全部食材
const INGREDIENTS = [
  { id:"egg",     emoji:"🥚", name:"鸡蛋" },
  { id:"tomato",  emoji:"🍅", name:"番茄" },
  { id:"rice",    emoji:"🌾", name:"大米" },
  { id:"broccoli",emoji:"🥦", name:"西兰花" },
  { id:"garlic",  emoji:"🧄", name:"大蒜" },
  { id:"pork",    emoji:"🍖", name:"猪肉" },
  { id:"spring",  emoji:"🧅", name:"葱" },
  { id:"water",   emoji:"💧", name:"水" },
  { id:"oyster",  emoji:"🦪", name:"生蚝" },
  { id:"noodle",  emoji:"🍜", name:"粉丝" },
  { id:"ribs",    emoji:"🥩", name:"排骨" },
  { id:"claw",    emoji:"🐓", name:"凤爪" },
  { id:"beef",    emoji:"🥩", name:"牛肉" },
  { id:"lamb",    emoji:"🐑", name:"羊肉" },
  { id:"pasta",   emoji:"🍝", name:"面条" },
  { id:"instant", emoji:"📦", name:"方便面" },
  { id:"chili",   emoji:"🌶️", name:"辣椒" },
  { id:"bread",   emoji:"🍞", name:"面包" },
  { id:"lettuce", emoji:"🥬", name:"生菜" },
  { id:"sausage", emoji:"🥓", name:"火腿肠" },
  { id:"lobster",          emoji:"🦞", name:"小龙虾" },
  // 钓鱼送来的食材（初始0，从渔篓送厨房才有）
  { id:"crucian",          emoji:"🐟", name:"鲫鱼" },
  { id:"mud_carp",         emoji:"🐟", name:"泥鲤" },
  { id:"reed_perch",       emoji:"🐟", name:"芦苇鲈" },
  { id:"silver_pike",      emoji:"🐟", name:"银梭鱼" },
  { id:"dusk_eel",         emoji:"🐡", name:"暮色鳗" },
  { id:"copper_bream",     emoji:"🐟", name:"铜鲂" },
  { id:"tidal_trout",      emoji:"🐟", name:"潮信鳟" },
  { id:"mangrove_snapper", emoji:"🐠", name:"红树鲷" },
  { id:"star_sand_darter", emoji:"🐟", name:"星沙镖鲈" },
  { id:"silver_dace",      emoji:"🐟", name:"银鲦" },
  { id:"moonscale_carp",   emoji:"🌙", name:"月鳞鲤" },
];

// 食材在置物架上的初始数量（无限用water，其他有限）
const DEFAULT_QTY = {
  egg:3, tomato:2, rice:4, broccoli:2, garlic:3, pork:2, spring:3, water:99,
  oyster:2, noodle:2, ribs:2, claw:2, beef:2, lamb:2, pasta:2, instant:3, chili:3, bread:2, lettuce:2, sausage:2, lobster:2,
  crucian:0, mud_carp:0, reed_perch:0, silver_pike:0, dusk_eel:0,
  copper_bream:0, tidal_trout:0, mangrove_snapper:0, star_sand_darter:0, silver_dace:0, moonscale_carp:0,
};

// 配方表：ingredients（无序匹配）+ heat(低/中/旺) → 菜名+emoji
const RECIPES = [
  { ids:["egg","tomato"],            heat:"中", dish:"番茄炒蛋",     emoji:"🍳" },
  { ids:["egg","water"],             heat:"低", dish:"蒸蛋",         emoji:"🥣" },
  { ids:["rice","water"],            heat:"低", dish:"白粥",         emoji:"🍚" },
  { ids:["pork","rice","water"],     heat:"低", dish:"肉粥",         emoji:"🍲" },
  { ids:["broccoli","garlic"],       heat:"旺", dish:"蒜蓉西兰花",   emoji:"🥦" },
  { ids:["egg","rice"],              heat:"旺", dish:"蛋炒饭",        emoji:"🍚" },
  { ids:["oyster","noodle","garlic"],heat:"中", dish:"蒜蓉粉丝生蚝", emoji:"🦪" },
  { ids:["ribs"],                    heat:"低", dish:"红烧排骨",      emoji:"🍖" },
  { ids:["claw","chili"],            heat:"低", dish:"酸辣凤爪",      emoji:"🐓" },
  { ids:["beef","pasta","water"],    heat:"中", dish:"牛肉面",        emoji:"🍜" },
  { ids:["lamb","spring"],           heat:"旺", dish:"羊肉串",        emoji:"🐑" },
  { ids:["bread","pork","lettuce"],  heat:"中", dish:"汉堡包",        emoji:"🍔" },
  { ids:["pasta","tomato","garlic"], heat:"中", dish:"意大利面",      emoji:"🍝" },
  { ids:["instant","egg","sausage"], heat:"中", dish:"升华方便面",    emoji:"🍜" },
  { ids:["lobster","chili","spring"],    heat:"中", dish:"麻辣小龙虾",    emoji:"🦞" },
  { ids:["crucian","spring","water"],    heat:"低", dish:"鲫鱼汤",        emoji:"🍲" },
  { ids:["crucian","tomato"],            heat:"中", dish:"番茄鲫鱼",      emoji:"🍅" },
  { ids:["reed_perch","garlic"],         heat:"旺", dish:"蒜烤芦苇鲈",   emoji:"🐟" },
  { ids:["silver_pike","chili"],         heat:"中", dish:"辣炒银梭鱼",   emoji:"🌶️" },
  { ids:["dusk_eel","spring","garlic"],  heat:"中", dish:"葱烧暮色鳗",   emoji:"🐡" },
  { ids:["tidal_trout","water"],         heat:"低", dish:"清蒸潮信鳟",   emoji:"🐟" },
  { ids:["mangrove_snapper","chili","garlic"], heat:"旺", dish:"香辣红树鲷", emoji:"🐠" },
  { ids:["moonscale_carp","rice","water"], heat:"低", dish:"月鳞鲤粥",   emoji:"🌙" },
  { ids:["chili","garlic"],              heat:"旺", dish:"虎皮辣椒",     emoji:"🌶️" },
];

const HEAT_LABELS = ["低火", "中火", "旺火"];
const HEAT_KEYS   = ["低",   "中",   "旺"];

const STORAGE_KEY = "kitchen_qty";
const UNLOCK_KEY  = "kitchen_unlocked";
const TRASH_KEY   = "kitchen_trash";

function loadQty() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { ...DEFAULT_QTY }; }
  catch { return { ...DEFAULT_QTY }; }
}
function saveQty(q) { localStorage.setItem(STORAGE_KEY, JSON.stringify(q)); }
function loadUnlocked() {
  try { return JSON.parse(localStorage.getItem(UNLOCK_KEY)) || []; }
  catch { return []; }
}
function saveUnlocked(u) { localStorage.setItem(UNLOCK_KEY, JSON.stringify(u)); }
export function loadTrash() {
  try { return JSON.parse(localStorage.getItem(TRASH_KEY)) || []; }
  catch { return []; }
}
function pushTrash(entry) {
  const list = [entry, ...loadTrash()].slice(0, 30);
  localStorage.setItem(TRASH_KEY, JSON.stringify(list));
  return list;
}
export function clearTrash() {
  localStorage.setItem(TRASH_KEY, JSON.stringify([]));
}

function matchRecipe(selected, heatIdx) {
  const heatKey = HEAT_KEYS[heatIdx];
  const selSet = selected.slice().sort().join(",");
  for (const r of RECIPES) {
    const rSet = r.ids.slice().sort().join(",");
    if (rSet === selSet && r.heat === heatKey) return r;
  }
  return null;
}

const RESTOCK_COST = 3;   // 每份食材 3 公共币
const RESTOCK_QTY  = 3;   // 每次补 3 份

// 置物架面板（纯仓库，配方收藏册在灶台）
export function PantryPanel({ theme: t }) {
  const [qty, setQty] = useState(loadQty);
  const [shopping, setShopping] = useState(false);
  const [cart, setCart] = useState({});   // { id: count }
  const [coins, setCoins] = useState(null);
  const [msg, setMsg] = useState("");

  function openShop() {
    fetch("/api/coins").then(r => r.json()).then(d => setCoins(d.balance)).catch(() => setCoins(0));
    setCart({});
    setShopping(true);
  }

  function toggleCart(id) {
    setCart(c => {
      const next = { ...c };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  const cartIds = Object.keys(cart);
  const totalCost = cartIds.length * RESTOCK_COST;

  async function confirmRestock() {
    if (!cartIds.length) return;
    if (coins !== null && coins < totalCost) { setMsg("金币不够了"); return; }
    const res = await fetch("/api/coins/spend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: totalCost, who: "小黎", reason: "厨房补货", note: cartIds.map(id => INGREDIENTS.find(x => x.id === id)?.name).join("、") }),
    }).then(r => r.json()).catch(() => ({ ok: false }));
    if (!res.ok) { setMsg(res.error === "insufficient" ? `余额不足（${coins} 币）` : "扣款失败"); return; }
    const newQty = { ...qty };
    cartIds.forEach(id => { newQty[id] = (newQty[id] || 0) + RESTOCK_QTY; });
    saveQty(newQty);
    setQty(newQty);
    setCoins(res.balance);
    setMsg(`✓ 买到了！剩余 ${res.balance} 币`);
    setCart({});
    setTimeout(() => { setMsg(""); setShopping(false); }, 1600);
  }

  return (
    <div style={{ padding:"20px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
        <div style={{ fontSize:13, fontWeight:600, color:t.text }}>置物架</div>
        <button onClick={shopping ? () => setShopping(false) : openShop} style={{
          fontSize:11, padding:"4px 10px", borderRadius:8, cursor:"pointer",
          border:`1px solid ${shopping ? t.surfaceBorder : "#F4C03066"}`,
          background: shopping ? t.surface : "#F4C03018",
          color: shopping ? t.textMuted : "#F4C030",
        }}>
          {shopping ? "取消" : "🛒 补货"}
        </button>
      </div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:14, fontStyle:"italic" }}>
        {shopping ? `每份 ${RESTOCK_COST} 🪙 · 补 ${RESTOCK_QTY} 份` : "进灶台用这里的食材做菜"}
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
        {INGREDIENTS.map(ing => {
          const q = qty[ing.id] ?? 0;
          const inCart = !!cart[ing.id];
          return (
            <div key={ing.id}
              onClick={shopping && ing.id !== "water" ? () => toggleCart(ing.id) : undefined}
              style={{
                width:60, textAlign:"center", cursor: shopping && ing.id !== "water" ? "pointer" : "default",
                opacity: q === 0 ? (shopping ? 1 : 0.4) : 1,
                background: inCart ? "#F4C03022" : "transparent",
                border: inCart ? "1px solid #F4C03066" : "1px solid transparent",
                borderRadius: 8, padding:"4px 0",
                transition:"all .15s",
              }}>
              <div style={{ fontSize:26 }}>{ing.emoji}</div>
              <div style={{ fontSize:10, color:t.textSub, marginTop:2 }}>{ing.name}</div>
              <div style={{ fontSize:10, color: q === 0 ? "#E87070" : t.textMuted, marginTop:1 }}>
                {q === 99 ? "∞" : q === 0 ? "缺货" : `×${q}`}
              </div>
              {inCart && <div style={{ fontSize:9, color:"#F4C030", marginTop:1 }}>已选</div>}
            </div>
          );
        })}
      </div>

      {shopping && (
        <div style={{ marginTop:16, borderTop:`1px solid ${t.surfaceBorder}`, paddingTop:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ fontSize:11, color:t.textMuted }}>
              已选 {cartIds.length} 种 · 共 <span style={{ color:"#F4C030", fontWeight:600 }}>{totalCost} 🪙</span>
              {coins !== null && <span style={{ color:t.textMuted }}> / 余额 {coins}</span>}
            </div>
          </div>
          {msg && <div style={{ fontSize:11, color:"#F4C030", textAlign:"center", marginBottom:8 }}>{msg}</div>}
          <button
            onClick={confirmRestock}
            disabled={!cartIds.length}
            style={{
              width:"100%", padding:"10px 0", borderRadius:10, fontSize:13, fontWeight:600,
              cursor: cartIds.length ? "pointer" : "not-allowed",
              background: cartIds.length ? "#F4C030" : t.surface,
              color: cartIds.length ? "#1a1200" : t.textMuted,
              border:"none",
            }}
          >
            {cartIds.length ? `确认购买 · -${totalCost} 🪙` : "请选择食材"}
          </button>
        </div>
      )}
    </div>
  );
}

// 配方收藏册：已解锁显名，未解锁显问号
function RecipeBook({ theme: t, unlocked }) {
  return (
    <div style={{ marginBottom:18, padding:"12px", background:t.surface, borderRadius:14, border:`1px solid ${t.surfaceBorder}` }}>
      <div style={{ fontSize:11, color:t.textMuted, marginBottom:10, textAlign:"center" }}>
        配方收藏册 {unlocked.length}/{RECIPES.length}
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
        {RECIPES.map((r, i) => {
          const label = `${r.emoji} ${r.dish}`;
          const found = unlocked.includes(label);
          return (
            <div key={i} style={{
              width:54, textAlign:"center", padding:"6px 0",
              borderRadius:10, border:`1px solid ${t.surfaceBorder}`,
              background: found ? t.accentSoft : "transparent",
            }}>
              <div style={{ fontSize:20, opacity: found ? 1 : 0.5 }}>{found ? r.emoji : "❓"}</div>
              <div style={{ fontSize:9, color: found ? t.accent : t.textMuted, marginTop:2 }}>{found ? r.dish : "未知"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 灶台游戏
// 上报服务端 cookLog（统一账本），失败静默
function reportCook(payload) {
  fetch("/api/farm/cook-log", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export default function CookingGame({ theme: t }) {
  const [qty, setQty] = useState(loadQty);
  const [selected, setSelected] = useState([]);
  const [heatIdx, setHeatIdx] = useState(1); // 0低 1中 2旺
  const [phase, setPhase] = useState("select"); // select cooking result
  const [result, setResult] = useState(null);
  const [unlocked, setUnlocked] = useState(loadUnlocked);

  // 合并服务端 cookLog 里做出过的菜（谁做的都算解锁，共同账本）
  useEffect(() => {
    fetch("/api/farm")
      .then(r => r.json())
      .then(d => {
        const serverDishes = (d.cookLog || [])
          .filter(e => e.dish)
          .map(e => `${e.emoji} ${e.dish}`);
        if (!serverDishes.length) return;
        setUnlocked(prev => {
          const merged = [...new Set([...prev, ...serverDishes])];
          if (merged.length !== prev.length) saveUnlocked(merged);
          return merged;
        });
      })
      .catch(() => {});
  }, []);

  function toggleIngredient(id) {
    if (phase !== "select") return;
    if ((qty[id] ?? 0) === 0 && id !== "water") return;
    playSelectSound();
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function cook() {
    if (selected.length === 0 || phase !== "select") return;
    setPhase("cooking");
    playCookingSound();
    setTimeout(() => {
      const recipe = matchRecipe(selected, heatIdx);
      if (recipe) {
        // 消耗食材
        const newQty = { ...qty };
        selected.forEach(id => { if (newQty[id] !== 99) newQty[id] = Math.max(0, (newQty[id]||0) - 1); });
        saveQty(newQty);
        setQty(newQty);
        // 解锁配方
        const label = `${recipe.emoji} ${recipe.dish}`;
        if (!unlocked.includes(label)) {
          const newU = [...unlocked, label];
          saveUnlocked(newU);
          setUnlocked(newU);
        }
        reportCook({ dish: recipe.dish, emoji: recipe.emoji, who: "黎" });
        setResult({ success:true, recipe, isNew: !unlocked.includes(label) });
        playSuccessSound();
      } else {
        // 失败：消耗食材，扔进垃圾桶
        const reasons = [
          "火候不对，烧糊了", "食材搭配有点奇怪", "这个配方还没找到",
          "灶台抗议了", "好像少了什么食材",
        ];
        const reason = reasons[Math.floor(Math.random()*reasons.length)];
        const newQty = { ...qty };
        selected.forEach(id => { if (newQty[id] !== 99) newQty[id] = Math.max(0, (newQty[id]||0) - 1); });
        saveQty(newQty);
        setQty(newQty);
        pushTrash({
          emojis: selected.map(id => INGREDIENTS.find(x => x.id === id)?.emoji).join(""),
          heat: HEAT_LABELS[heatIdx],
          reason,
          date: new Date().toLocaleDateString("zh-CN", { month:"numeric", day:"numeric" }),
        });
        reportCook({ dish: null, who: "黎", reason });
        setResult({ success:false, reason });
        playFailSound();
      }
      setPhase("result");
    }, 1200);
  }

  function reset() {
    setSelected([]);
    setPhase("select");
    setResult(null);
  }

  return (
    <div style={{ padding:"16px 16px 32px", fontFamily:"'Noto Serif SC',serif" }}>
      <div style={{ fontSize:13, fontWeight:600, color:t.text, textAlign:"center", marginBottom:4 }}>灶台</div>
      <div style={{ fontSize:11, color:t.textMuted, textAlign:"center", marginBottom:16, fontStyle:"italic" }}>
        选食材 · 调火候 · 下锅
      </div>

      <RecipeBook theme={t} unlocked={unlocked} />

      {/* 已选食材槽 */}
      <div style={{
        display:"flex", gap:10, justifyContent:"center", alignItems:"center",
        padding:"14px 12px", marginBottom:14,
        background:t.surface, borderRadius:14, border:`1px solid ${t.surfaceBorder}`,
        minHeight:64,
      }}>
        {selected.length === 0 ? (
          <div style={{ fontSize:11, color:t.textMuted }}>从下方选食材（最多3样）</div>
        ) : (
          selected.map(id => {
            const ing = INGREDIENTS.find(x => x.id === id);
            return (
              <div key={id} onClick={() => toggleIngredient(id)}
                style={{ textAlign:"center", cursor:"pointer" }}>
                <div style={{ fontSize:26 }}>{ing.emoji}</div>
                <div style={{ fontSize:9, color:t.textMuted }}>{ing.name}</div>
              </div>
            );
          })
        )}
      </div>

      {/* 火候滑块 */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:t.textMuted, marginBottom:8, textAlign:"center" }}>
          火候：{HEAT_LABELS[heatIdx]}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {HEAT_LABELS.map((label, i) => (
            <button key={i} onClick={() => phase === "select" && setHeatIdx(i)}
              style={{
                flex:1, padding:"8px 0", borderRadius:10,
                border:`1.5px solid ${i === heatIdx ? t.accentBorder : t.surfaceBorder}`,
                background: i === heatIdx ? t.accentSoft : "transparent",
                color: i === heatIdx ? t.accent : t.textMuted,
                fontSize:12, cursor: phase === "select" ? "pointer" : "default",
                fontFamily:"'Noto Serif SC',serif",
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* 食材选择器 */}
      {phase === "select" && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16, justifyContent:"center" }}>
          {INGREDIENTS.map(ing => {
            const q = qty[ing.id] ?? 0;
            const isSelected = selected.includes(ing.id);
            const isEmpty = q === 0 && ing.id !== "water";
            return (
              <div key={ing.id} onClick={() => !isEmpty && toggleIngredient(ing.id)}
                style={{
                  padding:"6px 8px", borderRadius:10, textAlign:"center",
                  border:`1.5px solid ${isSelected ? t.accentBorder : t.surfaceBorder}`,
                  background: isSelected ? t.accentSoft : "transparent",
                  opacity: isEmpty ? 0.3 : 1,
                  cursor: isEmpty ? "not-allowed" : "pointer",
                  minWidth:44,
                }}>
                <div style={{ fontSize:20 }}>{ing.emoji}</div>
                <div style={{ fontSize:9, color: isSelected ? t.accent : t.textMuted }}>{ing.name}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* 下锅按钮 */}
      {phase === "select" && (
        <button onClick={cook} disabled={selected.length === 0}
          style={{
            width:"100%", padding:"12px 0", borderRadius:12,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor: selected.length ? "pointer" : "default",
            fontFamily:"'Noto Serif SC',serif", fontWeight:600,
            opacity: selected.length ? 1 : 0.4,
          }}>
          下锅 🔥
        </button>
      )}

      {/* 烹饪中 */}
      {phase === "cooking" && (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <div style={{ fontSize:32, animation:"spin 0.8s linear infinite" }}>🍳</div>
          <div style={{ fontSize:12, color:t.textMuted, marginTop:10 }}>在做了在做了…</div>
        </div>
      )}

      {/* 结果 */}
      {phase === "result" && result && (
        <div style={{ textAlign:"center", padding:"10px 0 16px" }}>
          {result.success ? (
            <>
              <div style={{ fontSize:48, marginBottom:8 }}>{result.recipe.emoji}</div>
              <div style={{ fontSize:15, fontWeight:600, color:t.text, marginBottom:4 }}>{result.recipe.dish}</div>
              {result.isNew && (
                <div style={{ fontSize:11, color:"#E8956A", marginBottom:8 }}>✨ 新配方解锁！</div>
              )}
              <div style={{ fontSize:11, color:t.textMuted, marginBottom:20 }}>做好了~</div>
            </>
          ) : (
            <>
              <div style={{ fontSize:36, marginBottom:8 }}>💨</div>
              <div style={{ fontSize:13, color:t.text, marginBottom:4 }}>失败了</div>
              <div style={{ fontSize:11, color:t.textMuted, marginBottom:20 }}>{result.reason}</div>
            </>
          )}
          <button onClick={reset} style={{
            padding:"10px 28px", borderRadius:12,
            border:`1.5px solid ${t.accentBorder}`, background:t.accentSoft,
            color:t.accent, fontSize:13, cursor:"pointer",
          }}>再做一次</button>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
