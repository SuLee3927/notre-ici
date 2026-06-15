export default function Study({ theme: t, mode, onClose }) {
  const isDay = mode === "day";

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

      {/* 布置中提示 */}
      <div style={{
        position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
        zIndex:10, textAlign:"center", fontFamily:"'Noto Serif SC',serif",
        color:"rgba(255,255,255,0.55)", pointerEvents:"none",
      }}>
        <div style={{ fontSize:13, letterSpacing:".15em" }}>布置中……</div>
      </div>

      <style>{`@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
