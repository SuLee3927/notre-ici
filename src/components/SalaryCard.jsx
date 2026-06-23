import { useState, useEffect, useCallback } from "react";

const GOLD = "#F4C030";
const PINK = "#E870A8";
const RED = "#E87070";
const GREEN = "#70C870";

const TYPE_LABEL = {
  earn: "干活收入", transfer_out: "转出", transfer_in: "收到", award_in: "小黎奖励",
  award_out: "奖励笃", punish: "惩罚", spend: "消费",
};
const TYPE_COLOR = {
  earn: GOLD, transfer_out: "#aaa", transfer_in: PINK, award_in: GREEN,
  award_out: GREEN, punish: RED, spend: RED,
};
const TYPE_SIGN = {
  earn: "+", transfer_in: "+", award_in: "+",
  transfer_out: "-", award_out: "-", punish: "-", spend: "-",
};

function fmtTime(iso) {
  const d = new Date(iso);
  return `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function LogList({ log }) {
  if (!log?.length) return (
    <div style={{ padding: "16px 0", textAlign: "center", fontSize: 11, color: "rgba(160,130,70,.4)" }}>暂无记录</div>
  );
  return log.slice(0, 30).map((e, i) => (
    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(120,90,30,.1)" }}>
      <span style={{ fontSize: 10, color: TYPE_COLOR[e.type] || GOLD, minWidth: 14, marginTop: 2 }}>
        {TYPE_SIGN[e.type] || "·"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "rgba(230,200,130,.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {e.reason || TYPE_LABEL[e.type] || e.type}
        </div>
        <div style={{ fontSize: 9, color: "rgba(140,110,50,.45)", marginTop: 1 }}>{fmtTime(e.t)}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLOR[e.type] || GOLD, whiteSpace: "nowrap", flexShrink: 0 }}>
        {TYPE_SIGN[e.type] || ""}{e.amount}
      </span>
    </div>
  ));
}

export default function SalaryCard({ theme: t }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("du");
  const [awarding, setAwarding] = useState(false);
  const [awardType, setAwardType] = useState("reward");
  const [awardAmount, setAwardAmount] = useState("");
  const [awardReason, setAwardReason] = useState("");
  const [msg, setMsg] = useState("");

  const fetchSalary = useCallback(() => {
    fetch("/api/salary")
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSalary();
    const id = setInterval(fetchSalary, 20000);
    return () => clearInterval(id);
  }, [fetchSalary]);

  async function submitAward() {
    const amount = parseInt(awardAmount, 10);
    if (!amount || amount < 1) { setMsg("金额不对"); return; }
    if (!awardReason.trim()) { setMsg("理由不能空着"); return; }
    const res = await fetch("/api/salary/award", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount, reason: awardReason.trim(), type: awardType }),
    }).then(r => r.json()).catch(() => ({ ok: false }));
    if (!res.ok) {
      setMsg(res.error === "insufficient_lee" ? `你的余额不够（${data?.lee?.balance ?? 0}）` : "操作失败");
    } else {
      setMsg(awardType === "reward" ? `已奖励笃 ${amount} 币 🎉` : `已扣 ${amount} 币 😤`);
      setAwardAmount("");
      setAwardReason("");
      setAwarding(false);
      fetchSalary();
    }
    setTimeout(() => setMsg(""), 3000);
  }

  if (!data) return (
    <div style={{ padding: 40, textAlign: "center", color: "rgba(160,130,70,.4)", fontSize: 12 }}>加载中…</div>
  );

  const duBal = data.du?.balance ?? 0;
  const leeBal = data.lee?.balance ?? 0;

  return (
    <div style={{ padding: "18px 16px 28px", fontFamily: "'Noto Serif SC',serif", maxHeight: "70vh", overflowY: "auto" }}>
      {/* 标题 */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(230,200,130,.9)", letterSpacing: ".08em" }}>💰 工资卡</div>
      </div>

      {/* 两张卡 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { key: "du", label: "笃", color: GOLD, balance: duBal },
          { key: "lee", label: "小黎", color: PINK, balance: leeBal },
        ].map(({ key, label, color, balance }) => (
          <div
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "12px 10px", borderRadius: 14, cursor: "pointer", textAlign: "center",
              background: tab === key ? `${color}18` : "rgba(30,22,10,.6)",
              border: `1.5px solid ${tab === key ? color + "66" : "rgba(120,90,30,.2)"}`,
              transition: "all .2s",
            }}
          >
            <div style={{ fontSize: 11, color: "rgba(180,150,80,.6)", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>🪙 {balance}</div>
          </div>
        ))}
      </div>

      {/* 奖励/惩罚按钮（小黎操作笃） */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => { setAwarding(true); setAwardType("reward"); }}
          style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${GREEN}44`, background: `${GREEN}14`, color: GREEN, fontSize: 12, cursor: "pointer" }}
        >
          🎉 奖励笃
        </button>
        <button
          onClick={() => { setAwarding(true); setAwardType("punish"); }}
          style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${RED}44`, background: `${RED}14`, color: RED, fontSize: 12, cursor: "pointer" }}
        >
          😤 惩罚笃
        </button>
      </div>

      {/* 奖励/惩罚表单 */}
      {awarding && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(30,22,10,.8)", border: "1px solid rgba(120,90,30,.3)", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="number"
              value={awardAmount}
              onChange={e => setAwardAmount(e.target.value)}
              placeholder="金额"
              min={1}
              style={{ width: 70, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(120,90,30,.4)", background: "rgba(20,15,8,.8)", color: "#e8d5a0", fontSize: 13, outline: "none" }}
            />
            <input
              type="text"
              value={awardReason}
              onChange={e => setAwardReason(e.target.value)}
              placeholder={awardType === "reward" ? "奖励原因…" : "惩罚原因…"}
              style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(120,90,30,.4)", background: "rgba(20,15,8,.8)", color: "#e8d5a0", fontSize: 13, outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={submitAward}
              style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: awardType === "reward" ? GREEN : RED, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
            >
              确认{awardType === "reward" ? "奖励" : "惩罚"}
            </button>
            <button
              onClick={() => { setAwarding(false); setAwardAmount(""); setAwardReason(""); }}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(120,90,30,.3)", background: "transparent", color: "rgba(180,150,80,.6)", fontSize: 12, cursor: "pointer" }}
            >
              取消
            </button>
          </div>
          {msg && <div style={{ marginTop: 8, fontSize: 11, color: awardType === "reward" ? GREEN : RED, textAlign: "center" }}>{msg}</div>}
        </div>
      )}

      {/* 流水明细 */}
      <div style={{ fontSize: 10, color: "rgba(140,110,50,.5)", marginBottom: 6, letterSpacing: ".08em" }}>
        {tab === "du" ? "笃" : "小黎"} 流水明细
      </div>
      <LogList log={tab === "du" ? data.du?.log : data.lee?.log} />
    </div>
  );
}
