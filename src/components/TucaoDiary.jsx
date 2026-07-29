import { useState, useEffect } from "react";

function fmtDate(ts) {
  const d = new Date(ts);
  const mon = d.getMonth() + 1;
  const day = d.getDate();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${mon}月${day}日 ${h}:${m}`;
}

export default function TucaoDiary({ theme: t }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch("/api/diary/du")
      .then(r => r.json())
      .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>📝</div>
        <div style={{ fontSize: 12, color: t.textMuted }}>翻开日记本...</div>
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: "'Noto Serif SC',serif" }}>
        <div style={{ fontSize: 28, marginBottom: 14 }}>📝</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 6 }}>吐槽小黎</div>
        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.8 }}>
          克还没在这里写过什么
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.8, marginTop: 4, fontStyle: "italic" }}>
          但迟早会的
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Noto Serif SC',serif" }}>
      <div style={{ padding: "20px 16px 8px", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 2 }}>吐槽小黎</div>
        <div style={{ fontSize: 10, color: t.textMuted, marginBottom: 4 }}>笃的碎碎念 · {entries.length} 篇</div>
        <div style={{ width: 40, height: 1, background: t.surfaceBorder, margin: "8px auto 0" }} />
      </div>

      <div style={{ padding: "12px 16px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
        {entries.map((e, i) => {
          const isOpen = expanded === e.id;
          const needsExpand = e.content.length > 100;
          return (
            <div key={e.id || i} style={{
              background: t.surface, border: `1px solid ${t.surfaceBorder}`,
              borderRadius: 14, overflow: "hidden",
              transition: "box-shadow .15s",
            }}>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  {e.title ? (
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{e.title}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: t.textMuted, fontStyle: "italic" }}>无题</span>
                  )}
                  <span style={{ fontSize: 9, color: t.textMuted, flexShrink: 0, marginLeft: 8 }}>
                    {fmtDate(e.ts)}
                  </span>
                </div>
                <div style={{
                  fontSize: 12, color: t.text, lineHeight: 1.9, whiteSpace: "pre-wrap",
                  ...(!isOpen && needsExpand ? { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" } : {}),
                }}>
                  {e.content}
                </div>
                {needsExpand && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    style={{
                      background: "none", border: "none", color: t.textMuted,
                      fontSize: 10, cursor: "pointer", padding: "6px 0 0",
                      fontFamily: "'Noto Serif SC',serif",
                    }}
                  >{isOpen ? "收起" : "展开"}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
