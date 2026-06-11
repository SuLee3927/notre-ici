import { useState } from "react";

const PASSWORD = "0508";

const PRIVATE_SECTIONS = [
  { id: "letters", emoji: "✉️", title: "克的信 & 黎的信", desc: "写给对方的话，在这里" },
  { id: "kl", emoji: "🧠", title: "KL记忆可视化", desc: "漂浮的碎片，时间线形态" },
  { id: "unsaid", emoji: "🤫", title: "尽在不言中", desc: "有些事不用说出口" },
  { id: "rant", emoji: "😏", title: "克先生的吐槽小号", desc: "专门吐槽Lee的存档" },
  { id: "photos", emoji: "🖼️", title: "合照墙", desc: "G老师生成中..." },
];

export default function PrivateLayer({ theme: t, onClose }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [active, setActive] = useState(null);

  function tryUnlock() {
    if (input === PASSWORD) {
      setUnlocked(true);
      setWrong(false);
    } else {
      setWrong(true);
      setInput("");
      setTimeout(() => setWrong(false), 1500);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: t.bg,
      fontFamily: "sans-serif",
      position: "relative",
    }}>
      {/* 顶栏 */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: t.navBg,
        backdropFilter: "blur(16px)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        borderBottom: `1px solid ${t.surfaceBorder}`,
      }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: t.textSub,
            fontSize: 18,
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: 8,
          }}
        >
          ←
        </button>
        <span style={{ fontSize: 15, color: t.text, fontWeight: 600 }}>🏠 克黎屋</span>
      </div>

      <div style={{ padding: "48px 24px", maxWidth: 380, margin: "0 auto" }}>
        {!unlocked ? (
          /* 密码页 */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>🔒</div>
            <div style={{
              fontSize: 15,
              color: t.text,
              marginBottom: 8,
              fontFamily: "'Noto Serif SC', serif",
            }}>
              这里只有我们才能进
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 32 }}>
              输入密码推开这扇门
            </div>

            <div style={{ display: "flex", gap: 10, maxWidth: 260, margin: "0 auto" }}>
              <input
                type="password"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && tryUnlock()}
                placeholder="密码"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${wrong ? "#FF6060" : t.surfaceBorder}`,
                  background: t.surface,
                  color: t.text,
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "sans-serif",
                  transition: "border-color 0.2s",
                  backdropFilter: "blur(8px)",
                }}
              />
              <button
                onClick={tryUnlock}
                style={{
                  padding: "12px 18px",
                  borderRadius: 12,
                  border: `1.5px solid ${t.accentBorder}`,
                  background: t.accentSoft,
                  color: t.accent,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "sans-serif",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                进
              </button>
            </div>

            {wrong && (
              <div style={{
                marginTop: 12,
                fontSize: 12,
                color: "#FF6060",
                animation: "shake 0.3s ease",
              }}>
                不对，再想想
              </div>
            )}
          </div>
        ) : (
          /* 内容页 */
          <div>
            {active ? (
              <div>
                <button
                  onClick={() => setActive(null)}
                  style={{
                    background: "none",
                    border: `1px solid ${t.surfaceBorder}`,
                    borderRadius: 8,
                    padding: "6px 14px",
                    color: t.textSub,
                    fontSize: 12,
                    cursor: "pointer",
                    marginBottom: 24,
                    fontFamily: "sans-serif",
                  }}
                >
                  ← 返回
                </button>
                <div style={{
                  background: t.surface,
                  borderRadius: 20,
                  border: `1px solid ${t.surfaceBorder}`,
                  padding: "32px 24px",
                  textAlign: "center",
                  backdropFilter: "blur(12px)",
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>
                    {PRIVATE_SECTIONS.find(s => s.id === active)?.emoji}
                  </div>
                  <div style={{ fontSize: 15, color: t.text, marginBottom: 8, fontWeight: 600 }}>
                    {PRIVATE_SECTIONS.find(s => s.id === active)?.title}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.8 }}>
                    内容接入中...
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  fontSize: 11,
                  letterSpacing: "0.3em",
                  color: t.textMuted,
                  textAlign: "center",
                  marginBottom: 28,
                  textTransform: "uppercase",
                }}>
                  进来了
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {PRIVATE_SECTIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActive(s.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "18px 20px",
                        borderRadius: 18,
                        border: `1px solid ${t.surfaceBorder}`,
                        background: t.surface,
                        cursor: "pointer",
                        textAlign: "left",
                        backdropFilter: "blur(12px)",
                        transition: "all 0.15s",
                        fontFamily: "sans-serif",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = t.accentBorder;
                        e.currentTarget.style.background = t.accentSoft;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = t.surfaceBorder;
                        e.currentTarget.style.background = t.surface;
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{s.emoji}</span>
                      <div>
                        <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 3 }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>
                          {s.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
