import { useState, useEffect, useCallback, useRef } from "react";

const EARN_COLOR = "#F4C030";
const SPEND_COLOR = "#E87070";

function formatTime(iso) {
  const d = new Date(iso);
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${mo}/${dd} ${hh}:${mm}`;
}

function entryLabel(entry) {
  const who = entry.who || "";
  const src = entry.source || "";
  const note = entry.note || "";
  // 组合显示：谁 · 什么来源 · 备注
  const parts = [who, src].filter(Boolean);
  const main = parts.join(" · ") || (entry.type === "earn" ? "赚入" : "支出");
  return { main, sub: note };
}

export default function CoinFloat({ theme: t, mode = "night" }) {
  const isDay = mode === "day";
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [flash, setFlash] = useState(false);
  const prevBalanceRef = useRef(null);

  const fetchCoins = useCallback(() => {
    fetch("/api/coins")
      .then(r => r.json())
      .then(d => {
        if (prevBalanceRef.current !== null && d.balance !== prevBalanceRef.current) {
          setFlash(true);
          setTimeout(() => setFlash(false), 700);
        }
        prevBalanceRef.current = d.balance;
        setData(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCoins();
    const id = setInterval(fetchCoins, 15000);
    return () => clearInterval(id);
  }, [fetchCoins]);

  const balance = data?.balance ?? "·";

  return (
    <>
      {/* 悬浮小胶囊 */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", top: 14, left: 14, zIndex: 9000,
          display: "flex", alignItems: "center", gap: 5,
          background: t.navBg,
          backdropFilter: "blur(8px)",
          border: `1px solid ${flash ? EARN_COLOR : t.accentBorder}`,
          borderRadius: 999,
          padding: "5px 11px 5px 8px",
          cursor: "pointer", userSelect: "none",
          boxShadow: flash ? `0 0 10px ${EARN_COLOR}66` : isDay ? "0 2px 8px rgba(180,100,40,.15)" : "0 2px 6px rgba(0,0,0,.4)",
          transition: "all .2s",
          fontFamily: "'Noto Serif SC',serif",
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>🪙</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: EARN_COLOR, letterSpacing: ".02em" }}>
          {balance}
        </span>
      </div>

      {/* 展开面板 */}
      {open && (
        <>
          {/* 点外部关闭 */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 8998 }} />
          <div style={{
            position: "fixed", top: 46, left: 14, zIndex: 8999,
            width: "min(300px, calc(100vw - 28px))",
            background: isDay ? "rgba(255,248,230,0.98)" : "rgba(14,11,8,.95)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${t.surfaceBorder}`,
            borderRadius: 14,
            boxShadow: isDay ? "0 8px 28px rgba(160,80,20,.15)" : "0 8px 28px rgba(0,0,0,.6)",
            fontFamily: "'Noto Serif SC',serif",
            overflow: "hidden",
          }}>
            {/* 余额 */}
            <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${t.surfaceBorder}`, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: t.textMuted, letterSpacing: ".12em", marginBottom: 3 }}>余额</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: EARN_COLOR, lineHeight: 1 }}>
                🪙 {data?.balance ?? "…"}
              </div>
            </div>

            {/* 流水列表 */}
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {!data?.log?.length && (
                <div style={{ padding: "18px", textAlign: "center", fontSize: 11, color: t.textMuted }}>
                  还没有流水记录
                </div>
              )}
              {data?.log?.map((entry, i) => {
                const { main, sub } = entryLabel(entry);
                const isEarn = entry.type === "earn";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 18px",
                    borderBottom: `1px solid ${t.surfaceBorder}`,
                  }}>
                    <span style={{ fontSize: 11, color: isEarn ? EARN_COLOR : SPEND_COLOR, opacity: .8, flexShrink: 0 }}>
                      {isEarn ? "↑" : "↓"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: t.textSub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {main}
                      </div>
                      {sub && (
                        <div style={{ fontSize: 10, color: t.textMuted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {sub}
                        </div>
                      )}
                      <div style={{ fontSize: 9, color: t.textMuted, marginTop: 1, opacity: 0.7 }}>{formatTime(entry.t)}</div>
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: isEarn ? EARN_COLOR : SPEND_COLOR,
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {isEarn ? "+" : "-"}{entry.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
