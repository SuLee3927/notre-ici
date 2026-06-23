import { useState, useEffect, useCallback } from "react";

const EARN_COLOR = "#F4C542";
const SPEND_COLOR = "#E87070";

function formatTime(iso) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${min}`;
}

export default function CoinFloat({ theme: t }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [flash, setFlash] = useState(false);
  const prevBalance = useState(null);

  const fetchCoins = useCallback(() => {
    fetch("/api/coins")
      .then(r => r.json())
      .then(d => {
        if (prevBalance[0] !== null && d.balance !== prevBalance[0]) {
          setFlash(true);
          setTimeout(() => setFlash(false), 600);
        }
        prevBalance[1](d.balance);
        setData(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCoins();
    const id = setInterval(fetchCoins, 15000);
    return () => clearInterval(id);
  }, [fetchCoins]);

  const balance = data?.balance ?? "…";

  return (
    <>
      {/* 悬浮按钮 */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", top: 16, left: 16, zIndex: 9000,
          display: "flex", alignItems: "center", gap: 6,
          background: open ? "#2a2018" : "#1a1410",
          border: `1.5px solid ${flash ? EARN_COLOR : "#5a4a2a"}`,
          borderRadius: 999, padding: "8px 14px",
          cursor: "pointer", userSelect: "none",
          boxShadow: flash ? `0 0 12px ${EARN_COLOR}88` : "0 2px 8px rgba(0,0,0,.5)",
          transition: "all .25s",
          fontFamily: "'Noto Serif SC',serif",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>🪙</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: EARN_COLOR, minWidth: 20, textAlign: "right" }}>
          {balance}
        </span>
      </div>

      {/* 展开面板 */}
      {open && (
        <div style={{
          position: "fixed", top: 60, left: 16, zIndex: 8999,
          width: "min(320px, calc(100vw - 48px))",
          background: "#12100e",
          border: "1px solid #3a2e1a",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,.7)",
          fontFamily: "'Noto Serif SC',serif",
          overflow: "hidden",
        }}>
          {/* 余额头部 */}
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #2a2010", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6a5a3a", letterSpacing: ".1em", marginBottom: 4 }}>当前余额</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: EARN_COLOR, lineHeight: 1 }}>
              🪙 {data?.balance ?? "…"}
            </div>
          </div>

          {/* 流水 */}
          <div style={{ maxHeight: 280, overflowY: "auto", padding: "8px 0" }}>
            {!data?.log?.length && (
              <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: "#5a4a2a" }}>
                还没有流水记录
              </div>
            )}
            {data?.log?.map((entry, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 20px",
                borderBottom: "1px solid #1e1a10",
              }}>
                <span style={{ fontSize: 14 }}>{entry.type === "earn" ? "↑" : "↓"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#c8b890", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {entry.note || entry.source || (entry.type === "earn" ? "赚入" : "消费")}
                  </div>
                  <div style={{ fontSize: 10, color: "#5a4a2a", marginTop: 1 }}>{formatTime(entry.t)}</div>
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: entry.type === "earn" ? EARN_COLOR : SPEND_COLOR,
                  whiteSpace: "nowrap",
                }}>
                  {entry.type === "earn" ? "+" : "-"}{entry.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
