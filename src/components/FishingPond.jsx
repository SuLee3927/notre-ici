import { useState, useEffect, useRef } from "react";

const COOKABLE = new Set([
  "crucian","mud_carp","reed_perch","silver_pike","dusk_eel",
  "copper_bream","tidal_trout","mangrove_snapper","star_sand_darter",
  "silver_dace","moonscale_carp",
]);

export default function FishingPond({ theme: t, onBack, onBackKitchen }) {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState("fish");
  const [discovery, setDiscovery] = useState({});
  const [catchList, setCatchList] = useState([]);
  const [kitchenMsg, setKitchenMsg] = useState("");
  const [exchangeCoins, setExchangeCoins] = useState(1);
  const [exchangePts, setExchangePts] = useState(100);
  const [exchangeMsg, setExchangeMsg] = useState("");
  const [exchangeWho, setExchangeWho] = useState("黎");
  const [balances, setBalances] = useState({ lee: null, du: null });
  const [bottleOpen, setBottleOpen] = useState(false);
  const [bottleText, setBottleText] = useState("");
  const [bottleWho, setBottleWho] = useState("黎");
  const [bottleMsg, setBottleMsg] = useState("");
  const outputRef = useRef(null);

  useEffect(() => {
    runCmd("status");
    fetchLog();
    fetchDiscovery();
    fetchLeeBal();
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  async function fetchDiscovery() {
    try {
      const r = await fetch("/api/fishing/discovery");
      const d = await r.json();
      setDiscovery(d || {});
    } catch {}
  }

  async function fetchLeeBal() {
    try {
      const r = await fetch("/api/salary");
      const d = await r.json();
      setBalances({ lee: d.lee?.balance ?? null, du: d.du?.balance ?? null });
    } catch {}
  }

  async function doExchangeBuy() {
    setExchangeMsg("");
    const coins = Math.max(1, Math.floor(exchangeCoins));
    try {
      const r = await fetch("/api/fishing/exchange/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ coins, who: exchangeWho }),
      });
      const d = await r.json();
      if (!d.ok) { setExchangeMsg(`❌ ${d.error || "失败"}`); return; }
      setExchangeMsg(`✅ 花${d.coins_spent}私密币 → +${d.pts_gained}点（现有${d.pts_now}点）`);
      fetchLeeBal();
      runCmd("status");
    } catch { setExchangeMsg("❌ 连接失败"); }
  }

  async function doExchangeSell() {
    setExchangeMsg("");
    const pts = Math.max(100, Math.floor(exchangePts / 100) * 100);
    try {
      const r = await fetch("/api/fishing/exchange/sell", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pts, who: exchangeWho }),
      });
      const d = await r.json();
      if (!d.ok) { setExchangeMsg(`❌ ${d.error || "失败"}`); return; }
      setExchangeMsg(`✅ ${d.pts_spent}点 → +${d.coins_gained}私密币（还剩${d.pts_now}点）`);
      fetchLeeBal();
      runCmd("status");
    } catch { setExchangeMsg("❌ 连接失败"); }
  }

  async function fetchCatchList() {
    try {
      const r = await fetch("/api/fishing/catch-list");
      const d = await r.json();
      setCatchList(d.items || []);
    } catch {}
  }

  async function sendToKitchen(instance_id, name) {
    setKitchenMsg("");
    try {
      const r = await fetch("/api/fishing/to-kitchen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instance_id, who: "黎" }),
      });
      const d = await r.json();
      if (!d.ok) {
        setKitchenMsg(`❌ ${d.error || "失败"}`);
        return;
      }
      // 更新 localStorage kitchen_qty
      try {
        const stored = JSON.parse(localStorage.getItem("kitchen_qty") || "{}");
        const key = d.fish_id;
        stored[key] = (stored[key] || 0) + 1;
        localStorage.setItem("kitchen_qty", JSON.stringify(stored));
      } catch {}
      setKitchenMsg(`✅ ${name} 已送到厨房`);
      fetchCatchList();
    } catch {
      setKitchenMsg("❌ 连接失败");
    }
  }

  async function fetchLog() {
    try {
      const r = await fetch("/api/fishing/log");
      const d = await r.json();
      setLog(Array.isArray(d) ? d.slice(-30).reverse() : []);
    } catch {}
  }

  function cleanFishText(text, command) {
    text = text.replace(/\n?📊 \{.*\}$/m, "");
    text = text.replace(/💡[^。\n]*。?\n?/g, "");
    const cmd = (command || "").trim().split(" ")[0].toLowerCase();
    if (cmd === "shop") {
      text = text.replace(/^【商店】（buy <id> \[数量\]）/m, "【商店】（购买：buy 商品ID 数量）");
      text = text.replace(/^([a-z_]+)　/gm, "");
      text = text.replace(/\bdive\b/g, "潜水(dive)");
      text = text.replace(/\blook\b/g, "查看(look)");
    }
    return text;
  }

  async function runCmd(command) {
    setLoading(true);
    try {
      const r = await fetch("/api/fishing/cmd", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ command, who: "黎" }),
      });
      const d = await r.json();
      let text = cleanFishText(d.text || "", command);
      setOutput(text);
      fetchLog();
      fetchDiscovery();
    } catch (e) {
      setOutput("连接失败：" + e.message);
    }
    setLoading(false);
  }

  async function sendBottle() {
    if (!bottleText.trim()) return;
    setBottleMsg("");
    try {
      const r = await fetch("/api/fishing/bottle/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: bottleText.trim(), author: bottleWho === "笃" ? "笃" : "黎" }),
      });
      const d = await r.json();
      if (d.ok) {
        setBottleMsg(`投进去了 🫙 池塘里现在有 ${d.total} 封纸条`);
        setBottleText("");
        setTimeout(() => setBottleOpen(false), 1800);
      } else {
        setBottleMsg(d.error || "投瓶失败");
      }
    } catch (e) {
      setBottleMsg("网络错误：" + e.message);
    }
  }

  const quickBtns = [
    { label: "🎣 抛竿", cmd: "cast" },
    { label: "🎣×5", cmd: "cast 5" },
    { label: "🎣×10 遇新停", cmd: "cast 10 stop=new" },
    { label: "📊 状态", cmd: "status" },
    { label: "🛒 商店", cmd: "shop" },
    { label: "🎒 渔篓", tab: "bag" },
    { label: "📖 图鉴", cmd: "encyclopedia" },
    { label: "🗺️ 钓点", cmd: "goto" },
    { label: "🫙 投瓶", action: () => setBottleOpen(v => !v) },
  ];

  const btnStyle = {
    padding: "8px 12px",
    background: t.surface,
    border: `1.5px solid ${t.surfaceBorder || "rgba(80,140,200,0.3)"}`,
    borderRadius: 10,
    fontSize: 11,
    color: t.text,
    cursor: "pointer",
    transition: "all 0.15s",
    flexShrink: 0,
  };

  return (
    <div style={{ padding: "16px 14px 30px", fontFamily: "'Noto Serif SC',serif", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div onClick={onBack} style={{
          fontSize: 11, color: t.textMuted, cursor: "pointer", padding: "4px 8px",
          border: `1px solid ${t.surfaceBorder || "rgba(140,120,80,0.2)"}`, borderRadius: 8,
        }}>← 菜园</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>🎣 笃之塘</div>
        {onBackKitchen ? (
          <div onClick={onBackKitchen} style={{
            fontSize: 11, color: t.textMuted, cursor: "pointer", padding: "4px 8px",
            border: `1px solid ${t.surfaceBorder || "rgba(140,120,80,0.2)"}`, borderRadius: 8,
          }}>厨房 →</div>
        ) : <div style={{ width: 50 }} />}
      </div>

      <div style={{ fontSize: 10, color: t.textMuted, textAlign: "center", marginBottom: 14, fontStyle: "italic" }}>
        菜地旁边的一汪池塘，水面偶有涟漪
      </div>

      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 14,
      }}>
        {quickBtns.map(b => (
          <div key={b.label} onClick={() => {
            if (b.action) { b.action(); return; }
            if (loading) return;
            if (b.tab) { setTab(b.tab); if (b.tab === "bag") fetchCatchList(); }
            else runCmd(b.cmd);
          }} style={{ ...btnStyle, opacity: (loading && !b.action) ? 0.5 : 1 }}>{b.label}</div>
        ))}
      </div>

      <div ref={outputRef} style={{
        background: "rgba(20,30,40,0.6)",
        border: "1px solid rgba(80,140,200,0.2)",
        borderRadius: 12,
        padding: "14px 12px",
        minHeight: 200,
        maxHeight: 360,
        overflowY: "auto",
        fontSize: 12,
        color: "#e8e0d0",
        lineHeight: 1.7,
        whiteSpace: "pre-wrap",
        fontFamily: "'Noto Serif SC', serif",
        marginBottom: 14,
      }}>
        {loading ? "钓鱼中…" : (output || "加载中…")}
      </div>

      <CommandInput onSubmit={runCmd} loading={loading} theme={t} />

      <div style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 8 }}>
        {[
          { id: "fish", label: "快捷操作" },
          { id: "bag", label: "🎒 渔篓" },
          { id: "log", label: "钓鱼记录" },
          { id: "disc", label: "首钓记录" },
        ].map(tb => (
          <div key={tb.id} onClick={() => setTab(tb.id)} style={{
            flex: 1, textAlign: "center", padding: "6px 0",
            fontSize: 11, fontWeight: tab === tb.id ? 600 : 400,
            color: tab === tb.id ? t.text : t.textMuted,
            borderBottom: tab === tb.id ? `2px solid rgba(80,140,200,0.6)` : "2px solid transparent",
            cursor: "pointer",
          }}>{tb.label}</div>
        ))}
      </div>

      {tab === "fish" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { name: "普通蚯蚓 ×5", price: "50点", desc: "最朴素的蚯蚓，胜在便宜", cmd: "buy basic_worm 5" },
            { name: "夜光饵 ×3", price: "105点", desc: "对夜行性鱼类格外有吸引力", cmd: "buy glow_bait 3" },
            { name: "氧气瓶 ×1", price: "45点", desc: "一瓶可潜水一次，水下有专属鱼", cmd: "buy oxygen" },
          ].map(b => (
            <div key={b.cmd} onClick={() => !loading && runCmd(b.cmd)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px",
              background: t.surface,
              border: `1.5px solid ${t.surfaceBorder || "rgba(80,140,200,0.3)"}`,
              borderRadius: 12,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.15s",
            }}>
              <div>
                <div style={{ fontSize: 12, color: t.text, fontWeight: 500 }}>{b.name}</div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{b.desc}</div>
              </div>
              <div style={{
                fontSize: 11, color: "rgba(200,170,100,.85)",
                background: "rgba(200,170,100,.1)",
                border: "1px solid rgba(200,170,100,.2)",
                borderRadius: 8, padding: "3px 8px", flexShrink: 0,
              }}>{b.price}</div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {[
              { label: "🤿 潜水", cmd: "dive" },
              { label: "💰 全部卖出", cmd: "sell all" },
            ].map(b => (
              <div key={b.cmd} onClick={() => !loading && runCmd(b.cmd)} style={{
                ...btnStyle, flex: 1, textAlign: "center", fontSize: 11, padding: "8px",
                opacity: loading ? 0.5 : 1,
              }}>{b.label}</div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: "12px 14px", background: t.surface, borderRadius: 12, border: `1.5px solid ${t.surfaceBorder || "rgba(80,140,200,0.2)"}` }}>
            <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>💱 点数 ⇄ 私密币</span>
              <div style={{ display: "flex", gap: 4 }}>
                {["黎", "笃"].map(w => (
                  <div key={w} onClick={() => setExchangeWho(w)} style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer",
                    background: exchangeWho === w ? "rgba(80,140,200,.25)" : "transparent",
                    border: `1px solid ${exchangeWho === w ? "rgba(80,140,200,.5)" : "rgba(120,100,60,.2)"}`,
                    color: exchangeWho === w ? "rgba(160,200,240,.9)" : t.textMuted,
                  }}>{w}</div>
                ))}
                {balances[exchangeWho === "黎" ? "lee" : "du"] !== null && (
                  <span style={{ fontSize: 9, color: t.textMuted, marginLeft: 4, lineHeight: "20px" }}>
                    {balances[exchangeWho === "黎" ? "lee" : "du"]}币
                  </span>
                )}
              </div>
            </div>
            {exchangeMsg && (
              <div style={{ fontSize: 10, color: exchangeMsg.startsWith("✅") ? "rgba(160,220,130,.9)" : "rgba(220,120,100,.9)", marginBottom: 8, lineHeight: 1.5 }}>
                {exchangeMsg}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: t.textMuted, flexShrink: 0 }}>买入</span>
              <input type="number" min="1" value={exchangeCoins} onChange={e => setExchangeCoins(Number(e.target.value))}
                style={{ width: 48, padding: "4px 6px", background: "rgba(20,30,40,0.5)", border: `1px solid rgba(80,140,200,0.3)`, borderRadius: 6, fontSize: 11, color: t.text, textAlign: "center" }} />
              <span style={{ fontSize: 10, color: t.textMuted }}>私密币 → {exchangeCoins * 50}点</span>
              <div onClick={doExchangeBuy} style={{ marginLeft: "auto", fontSize: 10, padding: "4px 10px", background: "rgba(80,140,200,.15)", border: "1px solid rgba(80,140,200,.3)", borderRadius: 8, cursor: "pointer", color: "rgba(160,200,240,.9)", flexShrink: 0 }}>充值</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: t.textMuted, flexShrink: 0 }}>变现</span>
              <input type="number" min="100" step="100" value={exchangePts} onChange={e => setExchangePts(Number(e.target.value))}
                style={{ width: 56, padding: "4px 6px", background: "rgba(20,30,40,0.5)", border: `1px solid rgba(80,140,200,0.3)`, borderRadius: 6, fontSize: 11, color: t.text, textAlign: "center" }} />
              <span style={{ fontSize: 10, color: t.textMuted }}>点 → {Math.floor(exchangePts / 100)}私密币</span>
              <div onClick={doExchangeSell} style={{ marginLeft: "auto", fontSize: 10, padding: "4px 10px", background: "rgba(180,140,60,.12)", border: "1px solid rgba(180,140,60,.3)", borderRadius: 8, cursor: "pointer", color: "rgba(220,180,100,.9)", flexShrink: 0 }}>变现</div>
            </div>
            <div style={{ fontSize: 9, color: "rgba(120,100,60,.5)", marginTop: 8 }}>1私密币=50点｜100点=1私密币</div>
          </div>
        </div>
      )}

      {tab === "log" && (
        <div style={{
          maxHeight: 180, overflowY: "auto",
          borderRadius: 10, border: `1px solid ${t.surfaceBorder || "rgba(140,120,80,0.15)"}`,
          padding: "6px 10px",
        }}>
          {(() => {
            const ACTION_ZH = { cast: "抛竿", "cast 5": "抛竿×5", "cast 10 stop=new": "抛竿×10", dive: "潜水", c: "抛竿" };
            const fishLog = log.filter(e => {
              const a = (e.action || "").toLowerCase();
              return a.startsWith("cast") || a.startsWith("dive") || a === "c";
            });
            if (fishLog.length === 0) return <div style={{ fontSize: 11, color: t.textMuted, padding: 8, textAlign: "center" }}>还没有钓鱼记录</div>;
            return fishLog.map((entry, i) => {
              const actionZh = ACTION_ZH[entry.action] || (entry.action?.startsWith("cast") ? "抛竿" : entry.action);
              const detail = (entry.detail || "").replace(/💡[\s\S]*/g, "").trim();
              const hasFish = detail && !detail.startsWith("🎣");
              return (
                <div key={i} style={{
                  padding: "4px 0",
                  borderBottom: i < fishLog.length - 1 ? `1px solid rgba(120,90,30,.08)` : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "rgba(200,170,100,.75)" }}>
                      {entry.who === "笃" ? "🎣" : "🐟"} {entry.who} · {actionZh}
                    </span>
                    <span style={{ fontSize: 9, color: "rgba(140,110,50,.45)", marginLeft: 8, flexShrink: 0 }}>
                      {entry.ts?.slice(5, 16).replace("T", " ")}
                    </span>
                  </div>
                  {hasFish && (
                    <div style={{ fontSize: 10, color: "rgba(180,160,120,.6)", marginTop: 2, paddingLeft: 18 }}>
                      {detail}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {tab === "bag" && (
        <div style={{
          borderRadius: 10, border: `1px solid ${t.surfaceBorder || "rgba(140,120,80,0.15)"}`,
          padding: "8px 10px",
        }}>
          {kitchenMsg && (
            <div style={{ fontSize: 11, color: "rgba(180,220,160,.9)", padding: "4px 0 6px", textAlign: "center" }}>
              {kitchenMsg}
            </div>
          )}
          {catchList.length === 0 ? (
            <div style={{ fontSize: 11, color: t.textMuted, padding: 8, textAlign: "center" }}>渔篓是空的</div>
          ) : (
            catchList.map((item, i) => {
              const cookable = COOKABLE.has(item.fish_id);
              return (
                <div key={item.instance_id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 2px",
                  borderBottom: i < catchList.length - 1 ? `1px solid rgba(120,90,30,.08)` : "none",
                }}>
                  <div>
                    <span style={{ fontSize: 12, color: t.text }}>{item.name}</span>
                    <span style={{ fontSize: 10, color: t.textMuted, marginLeft: 6 }}>
                      {item.size}cm · {item.value}点
                    </span>
                  </div>
                  {cookable && (
                    <div onClick={() => sendToKitchen(item.instance_id, item.name)} style={{
                      fontSize: 10, padding: "3px 8px",
                      background: "rgba(180,220,120,.12)",
                      border: "1px solid rgba(180,220,120,.3)",
                      borderRadius: 8, cursor: "pointer", flexShrink: 0,
                      color: "rgba(180,220,120,.9)",
                    }}>送厨房🍳</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "disc" && (
        <div style={{
          maxHeight: 180, overflowY: "auto",
          borderRadius: 10, border: `1px solid ${t.surfaceBorder || "rgba(140,120,80,0.15)"}`,
          padding: "6px 10px",
        }}>
          {Object.keys(discovery).length === 0 && (
            <div style={{ fontSize: 11, color: t.textMuted, padding: 8, textAlign: "center" }}>
              还没有首钓记录，去抛竿试试
            </div>
          )}
          {Object.entries(discovery).sort((a, b) => a[1].ts?.localeCompare(b[1].ts)).map(([fish, info], i) => (
            <div key={fish} style={{
              padding: "5px 0",
              borderBottom: i < Object.keys(discovery).length - 1 ? `1px solid rgba(120,90,30,.08)` : "none",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 11, color: "rgba(200,170,100,.85)" }}>
                🆕 {fish}
              </span>
              <span style={{ fontSize: 10, color: "rgba(180,160,120,.6)" }}>
                {info.who === "笃" ? "🎣" : "🐟"} {info.who} · {info.ts?.slice(5, 16).replace("T", " ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {bottleOpen && (
        <div style={{
          margin: "10px 0",
          background: t.surface,
          border: `1px solid ${t.surfaceBorder || "rgba(140,120,80,0.2)"}`,
          borderRadius: 12,
          padding: "12px 14px",
          animation: "fadeIn .2s",
        }}>
          <div style={{ fontSize: 12, color: t.text, marginBottom: 8, fontWeight: 600 }}>🫙 投一张纸条进池塘</div>
          <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 8, fontStyle: "italic" }}>
            钓鱼时偶尔会被人捞到，和内置的纸条混在一起随机出现
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {["黎", "笃"].map(w => (
              <div key={w} onClick={() => setBottleWho(w)} style={{
                padding: "4px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                background: bottleWho === w ? "rgba(80,140,200,0.25)" : "transparent",
                border: `1px solid ${bottleWho === w ? "rgba(80,140,200,0.5)" : t.surfaceBorder || "rgba(140,120,80,0.2)"}`,
                color: t.text,
              }}>{w}</div>
            ))}
          </div>
          <textarea
            value={bottleText}
            onChange={e => setBottleText(e.target.value)}
            placeholder="写点什么塞进去…（最多200字）"
            maxLength={200}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(0,0,0,0.15)",
              border: `1px solid ${t.surfaceBorder || "rgba(140,120,80,0.2)"}`,
              borderRadius: 8, padding: "8px 10px",
              fontSize: 11, color: t.text, resize: "none", outline: "none",
              fontFamily: "'Noto Serif SC',serif", lineHeight: 1.6,
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <div style={{ fontSize: 10, color: t.textMuted }}>{bottleText.length}/200</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div onClick={() => { setBottleOpen(false); setBottleMsg(""); }} style={{
                padding: "5px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                border: `1px solid ${t.surfaceBorder || "rgba(140,120,80,0.2)"}`, color: t.textMuted,
              }}>取消</div>
              <div onClick={sendBottle} style={{
                padding: "5px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                background: "rgba(80,140,200,0.2)", border: "1px solid rgba(80,140,200,0.4)", color: t.text,
              }}>投进去</div>
            </div>
          </div>
          {bottleMsg && <div style={{ fontSize: 11, color: "rgba(120,180,120,0.9)", marginTop: 6 }}>{bottleMsg}</div>}
        </div>
      )}

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
    </div>
  );
}

function CommandInput({ onSubmit, loading, theme: t }) {
  const [val, setVal] = useState("");

  function handle(e) {
    e.preventDefault();
    if (!val.trim() || loading) return;
    onSubmit(val.trim());
    setVal("");
  }

  return (
    <form onSubmit={handle} style={{ display: "flex", gap: 8 }}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="输入指令 (cast / buy / goto / sell ...)"
        style={{
          flex: 1,
          padding: "8px 12px",
          background: t.surface,
          border: `1.5px solid ${t.surfaceBorder || "rgba(80,140,200,0.3)"}`,
          borderRadius: 10,
          fontSize: 11,
          color: t.text,
          outline: "none",
          fontFamily: "'Noto Serif SC',serif",
        }}
      />
      <button type="submit" disabled={loading} style={{
        padding: "8px 16px",
        background: "rgba(80,140,200,0.2)",
        border: `1.5px solid rgba(80,140,200,0.4)`,
        borderRadius: 10,
        fontSize: 11,
        color: t.text,
        cursor: loading ? "wait" : "pointer",
        fontFamily: "'Noto Serif SC',serif",
      }}>执行</button>
    </form>
  );
}
