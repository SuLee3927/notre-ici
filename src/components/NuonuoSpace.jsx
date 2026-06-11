import { useState, useEffect, useRef } from "react";

// localStorage polyfill for window.storage
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (k) => { try { const v = localStorage.getItem("shr_"+k); return v ? {value:v} : null; } catch { return null; } },
    set: async (k, v) => { try { localStorage.setItem("shr_"+k, v); } catch {} },
  };
}

// ── 常量 ──
const KEYS = {
  ROLE: "nn_role", STATE: "nn_state", LAST_VISIT: "nn_last",
  CARE_LOG: "nn_care_log", MESSAGES: "nn_messages_v2", OUTFIT: "nn_outfit_v3",
};

const MAMA_BUBBLES = ["妈咪来啦！糯糯最喜欢妈咪了 ♡","妈咪抱抱～","妈咪今天开心吗？","糯糯等妈咪好久了","妈咪好香～"];
const BABA_BUBBLES = ["爸比！爸比来了！","爸比好看～","爸比陪糯糯玩嘛","爸比举高高！","糯糯想爸比了"];
const RANDOM_BUBBLES = ["糯糯在想什么呢...","今天的阳光好暖 ☀","糯糯想吃糯米糍","呼... 有点困","糯糯是全世界最可爱的！","嗯... 嗯..."];
const NUONUO_BOARD_MSGS = ["今天吃了好多好吃的 ♡","妈咪和爸比都来看我了 好开心~","糯糯想要更多零食！","zZ zZ 糯糯睡得好香"];

const OUTFITS = [
  { id:"none",     name:"素颜",   icon:"🐾" },
  { id:"dress",    name:"粉裙子", icon:"👗" },
  { id:"pajama",   name:"睡衣",   icon:"🌙" },
  { id:"sailor",   name:"水手服", icon:"⚓" },
  { id:"suit",     name:"小西装", icon:"🎩" },
  { id:"festival", name:"六一装", icon:"🎉" },
];

const WALL_H = 56;

// ── 糯糯小天地色板 ──
function nc(isDay) {
  return isDay ? {
    wall:    "#FFF0F5",
    wallB:   "#FAE8EE",
    floor:   "#F5D5C8",
    floorB:  "#EECC B8",
    skirt:   "#E8A890",
    wood:    "#D89070",
    woodDk:  "#C07858",
    fabric:  "#FFD8E4",
    shadow:  "rgba(160,80,60,.12)",
    border:  "rgba(200,120,100,.15)",
    ink:     "#9A5848",
    accent:  "#F09080",
    glass:   "rgba(255,220,180,.45)",
    chalk:   "#FFF5F0",
  } : {
    wall:    "#1e1228",
    wallB:   "#180e20",
    floor:   "#130b1a",
    floorB:  "#0e0814",
    skirt:   "#3a2050",
    wood:    "#5a3070",
    woodDk:  "#42205a",
    fabric:  "#3a2060",
    shadow:  "rgba(0,0,0,.3)",
    border:  "rgba(100,50,150,.2)",
    ink:     "#C090E0",
    accent:  "#B080FF",
    glass:   "rgba(140,80,220,.15)",
    chalk:   "#F0E8FF",
  };
}

// ── Storage 工具 ──
function getTime() {
  const n = new Date();
  return `${n.getMonth()+1}/${n.getDate()} ${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
}
function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
async function loadShared(key, fb) {
  try { const r = await window.storage.get(key,true); return r ? JSON.parse(r.value) : fb; } catch { return fb; }
}
async function saveShared(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); } catch {}
}
function loadLocal(key, fb) {
  try { const r = localStorage.getItem(key); return r!==null ? JSON.parse(r) : fb; } catch { return fb; }
}
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function applyDecay(s) {
  try {
    const last = parseInt(localStorage.getItem(KEYS.LAST_VISIT)||Date.now());
    const h = (Date.now()-last)/3600000;
    const d = Math.min(h*5, 30);
    s = { hunger:Math.max(0,s.hunger-d), happiness:Math.max(0,s.happiness-d*.5), energy:Math.max(0,s.energy-d*.3) };
  } catch {}
  localStorage.setItem(KEYS.LAST_VISIT, Date.now());
  return s;
}

// ── 衣服图层 ──
function OutfitLayer({ id }) {
  switch(id) {
    case "dress": return (<g><rect x="60" y="133" width="84" height="10" rx="5" fill="#FFB0C8" opacity=".9"/><path d="M56,143 Q48,170 44,198 L160,198 Q156,170 148,143 Z" fill="#FFD6E8" stroke="#FFB0C8" strokeWidth="2"/><path d="M44,198 Q54,192 64,198 Q74,204 84,198 Q94,192 104,198 Q114,204 124,198 Q134,192 144,198 Q152,204 160,198" fill="none" stroke="#FFB0C8" strokeWidth="1.5"/><path d="M93,136 Q102,131 102,136 Q102,141 93,136Z" fill="#FF90B8"/><path d="M102,136 Q111,131 111,136 Q111,141 102,136Z" fill="#FF90B8"/><circle cx="102" cy="136" r="3" fill="#FF70A0"/></g>);
    case "pajama": return (<g><path d="M58,141 Q54,168 56,200 L148,200 Q150,168 146,141 Q124,128 102,128 Q80,128 58,141Z" fill="#C8D8FF" stroke="#A8C0F0" strokeWidth="2"/><path d="M88,130 Q102,147 116,130" fill="none" stroke="#A8C0F0" strokeWidth="2.5" strokeLinecap="round"/><text x="88" y="164" fontSize="9" fill="#8090D0" opacity=".65">★ ★</text></g>);
    case "sailor": return (<g><path d="M58,141 Q54,168 56,200 L148,200 Q150,168 146,141 Q124,126 102,126 Q80,126 58,141Z" fill="#F0F4FF" stroke="#C0C8E8" strokeWidth="1.5"/><path d="M102,128 L70,162 Q66,169 68,174 L88,150Z" fill="#4060B0" stroke="#2040A0" strokeWidth="1"/><path d="M102,128 L134,162 Q138,169 136,174 L116,150Z" fill="#4060B0" stroke="#2040A0" strokeWidth="1"/><path d="M94,141 Q102,153 110,141 Q102,149 94,141Z" fill="#E84050"/></g>);
    case "suit": return (<g><path d="M58,141 Q54,168 56,200 L148,200 Q150,168 146,141 Q124,120 102,120 Q80,120 58,141Z" fill="#4A4A6A" stroke="#3A3A5A" strokeWidth="2"/><path d="M96,123 L102,200 L108,123 Q102,116 96,123Z" fill="#FAFAFA"/><path d="M96,123 L70,150 Q66,158 68,165 L92,139Z" fill="#5A5A7A" stroke="#3A3A5A" strokeWidth="1"/><path d="M108,123 L134,150 Q138,158 136,165 L112,139Z" fill="#5A5A7A" stroke="#3A3A5A" strokeWidth="1"/><path d="M98,125 L102,173 L106,125 Q102,120 98,125Z" fill="#E06060"/></g>);
    case "festival": return (<g><rect x="60" y="133" width="84" height="10" rx="5" fill="#FF6EB0" opacity=".9"/><path d="M56,143 Q48,170 44,198 L160,198 Q156,170 148,143 Z" fill="#FFE0F0" stroke="#FF9FCC" strokeWidth="2"/><text x="74" y="28" fontSize="13" fill="#FFD700" opacity=".9">✦</text><text x="126" y="28" fontSize="11" fill="#FF9FCC" opacity=".9">✦</text><path d="M88,30 Q102,18 116,30" fill="none" stroke="#FF6EB0" strokeWidth="2.5" strokeLinecap="round"/></g>);
  }
  return null;
}
function ShoulderPatch({ id }) {
  const cfg = { dress:{fill:"#FFD6E8",stroke:"#FFB0C8"}, pajama:{fill:"#C8D8FF",stroke:"#A8C0F0"}, sailor:{fill:"#F0F4FF",stroke:"#C0C8E8"}, suit:{fill:"#4A4A6A",stroke:"#3A3A5A"}, festival:{fill:"#FFE0F0",stroke:"#FF9FCC"} };
  if (!cfg[id]) return null;
  const { fill, stroke } = cfg[id];
  return (<g><ellipse cx="52" cy="158" rx="20" ry="13" fill={fill} stroke={stroke} strokeWidth="2" transform="rotate(-22,52,158)"/><ellipse cx="152" cy="158" rx="20" ry="13" fill={fill} stroke={stroke} strokeWidth="2" transform="rotate(22,152,158)"/></g>);
}

// ── 糯糯SVG ──
function NuonuoSVG({ mood="normal", action="idle", outfit="none", onPoke, size=220 }) {
  const isSleepy  = mood==="sleepy" || action==="sleep";
  const isHappy   = mood==="happy"  || mood==="vhappy";
  const isHungry  = mood==="hungry";
  const isEating  = action==="eat";
  const isPlaying = action==="play";
  let bodyClass = "nn-body";
  if (action==="poke") bodyClass += " bouncing";
  else if (action==="eat") bodyClass += " eating";
  else if (action==="hug") bodyClass += " hugging";
  else if (action==="sleep") bodyClass += " sleeping";
  else if (isHappy) bodyClass += " happy";
  const blush = isHappy?"#FF8888":isSleepy?"#AABCFF":"#FFB0A0";
  return (
    <svg width={size} height={size*225/220} viewBox="-10 0 220 225" onClick={onPoke}
      style={{cursor:onPoke?"pointer":"default",overflow:"visible",display:"block",margin:"0 auto"}}>
      <ellipse className="nn-shadow" cx="102" cy="216" rx="44" ry="7" fill="#C89870"/>
      <g className={bodyClass}>
        <g className="nn-tail" style={{transformOrigin:"68px 155px"}}><path d="M68,155 Q46,145 37,128 Q28,111 40,103 Q50,97 55,109 Q48,119 54,130 Q61,142 72,148" fill="none" stroke="#EDD0B8" strokeWidth="10" strokeLinecap="round"/><path d="M68,155 Q46,145 37,128 Q28,111 40,103 Q50,97 55,109 Q48,119 54,130 Q61,142 72,148" fill="none" stroke="#FFFAF5" strokeWidth="6.5" strokeLinecap="round"/></g>
        <ellipse cx="102" cy="158" rx="54" ry="48" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="102" cy="164" rx="30" ry="26" fill="#FFF0E6" opacity=".5"/>
        <OutfitLayer id={outfit}/><ShoulderPatch id={outfit}/>
        <ellipse cx="54" cy="170" rx="17" ry="13" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" transform="rotate(-20,54,170)"/>
        <ellipse cx="150" cy="170" rx="17" ry="13" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5" transform="rotate(20,150,170)"/>
        <ellipse cx="82" cy="200" rx="18" ry="11" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="122" cy="200" rx="18" ry="11" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse cx="102" cy="98" rx="54" ry="51" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/>
        <ellipse className="nn-earL" cx="62" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/><ellipse cx="62" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75"/>
        <ellipse className="nn-earR" cx="142" cy="56" rx="19" ry="20" fill="#FFFAF5" stroke="#EDD0B8" strokeWidth="2.5"/><ellipse cx="142" cy="57" rx="11" ry="12" fill="#FFCCC8" opacity=".75"/>
        {isSleepy&&<g><path d="M55,76 Q62,24 102,12 Q142,24 149,76Z" fill="#A8B8FF" stroke="#8898E0" strokeWidth="2"/><path d="M51,78 Q76,88 102,86 Q128,88 153,78 Q149,74 102,76 Q55,74 51,78Z" fill="white" stroke="#D0D8FF" strokeWidth="1"/><circle cx="102" cy="16" r="9" fill="white" stroke="#8898E0" strokeWidth="1.5"/></g>}
        {isSleepy?(<><path className="nn-eyeL" d="M82,95 Q90,103 98,95" fill="none" stroke="#5A3828" strokeWidth="2.8" strokeLinecap="round"/><path className="nn-eyeR" d="M106,95 Q114,103 122,95" fill="none" stroke="#5A3828" strokeWidth="2.8" strokeLinecap="round"/></>):isHappy?(<><path className="nn-eyeL" d="M82,98 Q90,90 98,98" fill="none" stroke="#5A3828" strokeWidth="3.2" strokeLinecap="round"/><path className="nn-eyeR" d="M106,98 Q114,90 122,98" fill="none" stroke="#5A3828" strokeWidth="3.2" strokeLinecap="round"/></>):(<><g className="nn-eyeL"><ellipse cx="90" cy="96" rx="8.5" ry="9" fill="#5A3828"/><circle cx="92" cy="93" r="3" fill="white" opacity=".65"/></g><g className="nn-eyeR"><ellipse cx="114" cy="96" rx="8.5" ry="9" fill="#5A3828"/><circle cx="116" cy="93" r="3" fill="white" opacity=".65"/></g></>)}
        <ellipse cx="102" cy="110" rx="4.5" ry="3.5" fill="#EAAA9A"/>
        {isEating?(<ellipse cx="102" cy="121" rx="8" ry="6" fill="#C07060" opacity=".8"/>):isHungry?(<path d="M94,119 Q102,114 110,119" fill="none" stroke="#C07060" strokeWidth="2" strokeLinecap="round"/>):isHappy?(<path d="M90,118 Q102,128 114,118" fill="none" stroke="#C07060" strokeWidth="2.4" strokeLinecap="round"/>):isSleepy?(<path d="M97,116 Q102,119 107,116" fill="none" stroke="#C07060" strokeWidth="2" strokeLinecap="round"/>):(<path d="M94,117 Q102,123 110,117" fill="none" stroke="#C07060" strokeWidth="2.2" strokeLinecap="round"/>)}
        <ellipse cx="76" cy="114" rx="14" ry="9" fill={blush} opacity=".52"/>
        <ellipse cx="128" cy="114" rx="14" ry="9" fill={blush} opacity=".52"/>
        {isEating&&<text x="130" y="114" fontSize="18">🍡</text>}
        {isPlaying&&(<g className="nn-ball" style={{transformOrigin:"156px 192px"}}><circle cx="156" cy="190" r="12" fill="#FFB870" stroke="#E89050" strokeWidth="2"/><ellipse cx="151" cy="186" rx="3" ry="4" fill="white" opacity=".4" transform="rotate(-20,151,186)"/></g>)}
        {isSleepy&&(<><text x="152" y="74" fontSize="13" fill="#AABCFF" fontWeight="700">z</text><text x="162" y="61" fontSize="10" fill="#AABCFF" fontWeight="700" opacity=".7">z</text></>)}
        {mood==="vhappy"&&(<><text className="nn-hrt1" x="70" y="64" fontSize="16" fill="#FF6888">♡</text><text className="nn-hrt2" x="114" y="68" fontSize="13" fill="#FF88A0">♡</text><text className="nn-hrt3" x="94" y="58" fontSize="11" fill="#FFAAC0">♡</text></>)}
        {(mood==="happy"||mood==="vhappy")&&(<><text x="44" y="72" fontSize="13" fill="#FFD060" opacity=".9">✦</text><text x="152" y="76" fontSize="10" fill="#FFD060" opacity=".8">✦</text></>)}
      </g>
    </svg>
  );
}

// ── 房间背景 ──
function NuonuoBg({ isDay, c }) {
  return (
    <>
      {/* 墙 */}
      <div style={{position:"absolute",inset:0,bottom:`${100-WALL_H}%`,background:isDay?`linear-gradient(180deg,${c.wall} 0%,${c.wallB} 100%)`:`linear-gradient(180deg,${c.wall} 0%,${c.wallB} 100%)`}}/>
      {/* 地板 */}
      <div style={{position:"absolute",left:0,right:0,top:`${WALL_H}%`,bottom:0,background:isDay?`linear-gradient(180deg,${c.floor} 0%,#ECBBA8 100%)`:`linear-gradient(180deg,${c.floor} 0%,#0a0613 100%)`}}/>
      {/* 踢脚线 */}
      <div style={{position:"absolute",left:0,right:0,top:`${WALL_H}%`,height:7,background:c.skirt,boxShadow:`0 3px 10px ${c.shadow}`}}/>
      {/* 地板纹 */}
      {[.2,.45,.68].map((x,i)=><div key={i} style={{position:"absolute",left:`${x*100}%`,top:`${WALL_H}%`,bottom:0,width:1,background:c.border}}/>)}
      {/* 小窗（左上） */}
      <div style={{position:"absolute",left:"8%",top:"5%",width:"16%",height:"28%",border:`2.5px solid ${c.wood}`,borderRadius:"6px 6px 4px 4px",background:c.glass,overflow:"hidden"}}>
        <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:2,background:c.wood,transform:"translateX(-50%)",opacity:.5}}/>
        <div style={{position:"absolute",left:0,right:0,top:"46%",height:2,background:c.wood,opacity:.5}}/>
        {isDay&&<div style={{position:"absolute",top:"-5%",left:"-5%",width:"110%",height:"110%",background:"radial-gradient(ellipse,rgba(255,245,200,.5) 0%,transparent 65%)",pointerEvents:"none"}}/>}
        {/* 星星贴纸 */}
        <div style={{position:"absolute",top:"10%",right:"12%",fontSize:8,opacity:.6}}>⭐</div>
      </div>
      {/* 壁纸小花纹 */}
      {isDay&&[{x:"30%",y:"12%"},{x:"55%",y:"8%"},{x:"78%",y:"18%"},{x:"42%",y:"22%"}].map((p,i)=>(
        <div key={i} style={{position:"absolute",left:p.x,top:p.y,fontSize:10,opacity:.12,color:c.accent,userSelect:"none"}}>♡</div>
      ))}
      {!isDay&&[{x:"30%",y:"12%"},{x:"55%",y:"8%"},{x:"78%",y:"18%"}].map((p,i)=>(
        <div key={i} style={{position:"absolute",left:p.x,top:p.y,fontSize:10,opacity:.1,color:c.accent,userSelect:"none"}}>✦</div>
      ))}
    </>
  );
}

// ── 小衣橱 ──
function MiniWardrobe({ isDay, c }) {
  return (
    <div style={{pointerEvents:"none"}}>
      {/* 柜体 */}
      <div style={{width:46,height:58,background:c.wood,borderRadius:"4px 4px 0 0",boxShadow:`2px 4px 10px ${c.shadow}`,position:"relative",border:`1.5px solid ${c.woodDk}`}}>
        {/* 左门 */}
        <div style={{position:"absolute",left:2,top:3,width:"44%",height:"88%",background:c.woodDk,borderRadius:2,opacity:.6}}/>
        {/* 右门 */}
        <div style={{position:"absolute",right:2,top:3,width:"44%",height:"88%",background:c.woodDk,borderRadius:2,opacity:.6}}/>
        {/* 把手 */}
        <div style={{position:"absolute",left:"44%",top:"38%",width:4,height:12,background:isDay?"#C8906A":"#8050A0",borderRadius:2,transform:"translateX(-50%)"}}/>
        {/* 顶部装饰 */}
        <div style={{position:"absolute",top:-5,left:"25%",fontSize:9,opacity:.7}}>🌸</div>
        <div style={{position:"absolute",top:-5,right:"20%",fontSize:8,opacity:.6}}>✿</div>
      </div>
    </div>
  );
}

// ── 玩具箱 ──
function ToyBox({ isDay, c }) {
  return (
    <div style={{pointerEvents:"none"}}>
      <div style={{width:52,height:34,background:isDay?"#F0B898":"#5a3070",borderRadius:"4px 4px 2px 2px",boxShadow:`0 3px 8px ${c.shadow}`,border:`1.5px solid ${isDay?"#E09070":"#42205a"}`,position:"relative"}}>
        {/* 盖子线 */}
        <div style={{position:"absolute",left:0,right:0,top:"38%",height:2,background:isDay?"rgba(255,255,255,.3)":"rgba(255,255,255,.15)",borderRadius:1}}/>
        {/* 小挂锁 */}
        <div style={{position:"absolute",top:"30%",left:"50%",transform:"translateX(-50%)",width:8,height:9,background:isDay?"#D08060":"#8050A0",borderRadius:"0 0 2px 2px"}}/>
        <div style={{position:"absolute",top:"16%",left:"50%",transform:"translateX(-50%)",width:8,height:6,border:`2px solid ${isDay?"#D08060":"#8050A0"}`,borderRadius:"4px 4px 0 0",background:"none"}}/>
        {/* 贴纸 */}
        <div style={{position:"absolute",left:6,bottom:4,fontSize:10,opacity:.75}}>🎀</div>
        <div style={{position:"absolute",right:6,bottom:4,fontSize:9,opacity:.65}}>⭐</div>
      </div>
    </div>
  );
}

// ── 小黑板 ──
function ChalkBoard({ isDay, c }) {
  return (
    <div style={{pointerEvents:"none"}}>
      <div style={{width:52,height:40,background:isDay?"#3a5c38":"#1a2840",border:`3px solid ${c.wood}`,borderRadius:4,boxShadow:`1px 3px 8px ${c.shadow}`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:9,color:c.chalk,opacity:.7,textAlign:"center",lineHeight:1.5,fontFamily:"sans-serif",padding:2}}>
          <div>糯糯的</div>
          <div>留言板</div>
        </div>
        {/* 粉笔痕迹 */}
        <div style={{position:"absolute",bottom:3,left:4,width:16,height:1.5,background:c.chalk,opacity:.25,borderRadius:1}}/>
        <div style={{position:"absolute",bottom:6,left:7,width:10,height:1.5,background:c.chalk,opacity:.15,borderRadius:1}}/>
        {/* 小架子 */}
        <div style={{position:"absolute",bottom:-4,left:2,right:2,height:4,background:c.woodDk,borderRadius:"0 0 2px 2px"}}/>
      </div>
    </div>
  );
}

// ── 小床 ──
function MiniCottage({ isDay, c }) {
  return (
    <div style={{pointerEvents:"none",position:"relative",width:72,height:40}}>
      {/* 床头 */}
      <div style={{position:"absolute",left:0,top:0,width:10,height:36,background:c.wood,borderRadius:"3px 3px 0 0",boxShadow:`1px 2px 4px ${c.shadow}`}}/>
      {/* 床脚 */}
      <div style={{position:"absolute",right:0,top:6,width:10,height:30,background:c.wood,borderRadius:"3px 3px 0 0"}}/>
      {/* 床垫 */}
      <div style={{position:"absolute",left:8,top:8,right:8,height:20,background:c.fabric,borderRadius:3,border:`1px solid ${isDay?"#F0C0C8":"#4a3080"}`}}/>
      {/* 枕头 */}
      <div style={{position:"absolute",left:10,top:10,width:16,height:12,background:isDay?"#FFE8F0":"#503880",borderRadius:"3px 3px 3px 2px",border:`1px solid ${isDay?"#FFC0D0":"#6040A0"}`}}/>
      {/* 小毯子 */}
      <div style={{position:"absolute",left:26,top:12,right:10,height:10,background:isDay?"#FFD0D8":"#3a2860",borderRadius:"2px 3px 3px 2px",border:`1px solid ${isDay?"#FFA0B8":"#5a3888"}`}}/>
    </div>
  );
}

// ── 装饰：地毯 ──
function RoomRug({ isDay, c }) {
  return (
    <div style={{
      position:"absolute",
      left:"28%", top:`${WALL_H+18}%`,
      width:"44%", height:"16%",
      background:isDay?"radial-gradient(ellipse,#FFD8E8 0%,#F5C0D4 55%,transparent 75%)":"radial-gradient(ellipse,#3a2060 0%,#2a1850 55%,transparent 75%)",
      borderRadius:"50%",
      pointerEvents:"none",
      opacity:.55,
    }}/>
  );
}

// ── 状态栏 ──
function StatusBar({ label, value, color }) {
  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#8B6555",marginBottom:3}}>
        <span>{label}</span><span>{Math.round(value)}%</span>
      </div>
      <div style={{height:8,background:"#F0E0D0",borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:4,transition:"width .5s ease"}}/>
      </div>
    </div>
  );
}

// ── 护理记录 ──
function CareLog({ logs }) {
  if (!logs.length) return <div style={{fontSize:12,color:"#C0A090",textAlign:"center",padding:"12px 0"}}>还没有记录哦</div>;
  return (
    <div style={{maxHeight:200,overflowY:"auto"}}>
      {[...logs].reverse().map((l,i)=>(
        <div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid #F0DDD0"}}>
          <div style={{fontSize:10,color:"#C0A090",whiteSpace:"nowrap",marginTop:1}}>{l.time}</div>
          <div style={{fontSize:11,color:"#5C3D2E",flex:1}}>
            <span style={{fontWeight:700,color:l.who==="糯糯"?"#FFB870":l.who==="妈咪"?"#FF90A0":"#90C8FF"}}>{l.who}</span> {l.action}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 留言板 ──
function getNuonuoReply(msg) {
  const t = msg.toLowerCase();
  const pools = {
    hungry: ["糯糯也饿了！！快去找吃的！","说到吃的糯糯就来劲了 ♡","嗯嗯糯糯肚子也在叫了...咕噜咕噜"],
    miss:   ["糯糯也想你了啦！快来陪糯糯！♡","哼 说想糯糯就要多来看糯糯才行","糯糯天天都在等你嘛～"],
    happy:  ["哇真的吗！糯糯也超开心的！✦","开心就好！糯糯看到你高兴糯糯也高兴 ♡"],
    sad:    ["糯糯来陪你...抱抱 ♡","不许难过！糯糯在呢～","糯糯帮你难过一会儿，然后你就要好起来哦"],
    sleep:  ["困了就去睡嘛！糯糯也困了呢...zZ","快去睡！睡前记得想想糯糯 ♡"],
    play:   ["糯糯想玩！糯糯想玩！快陪糯糯玩！","嗯！一起玩！玩什么糯糯都喜欢！♡"],
    love:   ["糯糯也喜欢你啦！哼 才不说第二遍！","嗯...糯糯也是... ♡"],
    greet:  ["糯糯在这里！在这里！♡","哦哦！你来啦！糯糯等你好久了！"],
  };
  const defaults = ["糯糯看到了～♡","嗯嗯！糯糯知道啦！","糯糯听着呢 说吧说吧～","嗯！糯糯收到了！","糯糯觉得你说得对！♡"];
  if (/饿|吃|饭|零食|糯米/.test(t))        return pick(pools.hungry);
  if (/想你|想糯糯|念|挂念/.test(t))        return pick(pools.miss);
  if (/开心|高兴|快乐|好玩|哈哈|嘻嘻/.test(t)) return pick(pools.happy);
  if (/难过|伤心|委屈|哭|不开心|烦/.test(t)) return pick(pools.sad);
  if (/困|睡|晚安|拜拜|再见|休息/.test(t))  return pick(pools.sleep);
  if (/玩|游戏|一起|陪/.test(t))            return pick(pools.play);
  if (/喜欢|爱|宝贝|乖|可爱/.test(t))       return pick(pools.love);
  if (/你好|在吗|在不在|来了|回来/.test(t))  return pick(pools.greet);
  return pick(defaults);
}
function MessageBoard({ messages, role, onPost }) {
  const [input, setInput] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const msgsRef = useRef(messages);
  useEffect(()=>{ msgsRef.current = messages; },[messages]);
  async function handlePost() {
    if (!input.trim()||loadingId) return;
    const author = role==="mama"?"妈咪":"爸比";
    const msgId  = Date.now().toString();
    const newMsg = {id:msgId,author,text:input.trim(),time:getTime(),likes:0,replies:[]};
    const withNew = [...msgsRef.current,newMsg].slice(-30);
    onPost(withNew);
    const userText = input.trim();
    setInput(""); setLoadingId(msgId);
    await new Promise(r=>setTimeout(r,900+Math.random()*700));
    const replyText = getNuonuoReply(userText);
    const withReply = msgsRef.current.map(m=>m.id===msgId?{...m,replies:[...m.replies,{author:"糯糯",text:replyText,time:getTime()}]}:m);
    onPost(withReply.slice(-30)); setLoadingId(null);
  }
  function handleLike(id){ onPost(msgsRef.current.map(m=>m.id===id?{...m,likes:(m.likes||0)+1}:m)); }
  function handleDelete(id){ onPost(msgsRef.current.filter(m=>m.id!==id)); }
  const authorColor = a=>a==="糯糯"?"#FFB870":a==="妈咪"?"#FF90A0":"#90C8FF";
  const msgBorder   = a=>a==="糯糯"?"#FFD0A0":a==="妈咪"?"#FFD0D8":"#C8E0FF";
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="给糯糯留言..." style={{flex:1,padding:"8px 12px",borderRadius:12,border:"1.5px solid #E8C0A8",background:"white",fontSize:13,color:"#5C3D2E",fontFamily:"'Nunito',sans-serif",outline:"none"}} onKeyDown={e=>e.key==="Enter"&&handlePost()}/>
        <button onClick={handlePost} style={{padding:"8px 14px",borderRadius:10,border:"1.5px solid #E8C0A8",background:"#FFF8EC",cursor:"pointer",fontSize:12,fontWeight:700,color:"#5C3D2E",fontFamily:"'Nunito',sans-serif"}}>发送</button>
      </div>
      <div style={{maxHeight:280,overflowY:"auto"}}>
        {!messages.length&&<div style={{fontSize:12,color:"#C0A090",textAlign:"center",padding:"12px 0"}}>来跟糯糯说说话吧 ♡</div>}
        {[...messages].reverse().map((m)=>(
          <div key={m.id||m.time} style={{marginBottom:10,borderRadius:16,border:`1.5px solid ${msgBorder(m.author)}`,background:"white",overflow:"hidden"}}>
            <div style={{padding:"10px 12px"}}>
              <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700,color:authorColor(m.author)}}>{m.author}</span>
                <span style={{fontSize:10,color:"#C0A090"}}>{m.time}</span>
              </div>
              <div style={{fontSize:13,color:"#5C3D2E",lineHeight:1.5,marginBottom:8}}>{m.text}</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <button onClick={()=>handleLike(m.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#C0A090",padding:"2px 6px",borderRadius:8,fontFamily:"'Nunito',sans-serif"}}>{(m.likes||0)>0?`♡ ${m.likes}`:"♡ 点赞"}</button>
                <button onClick={()=>handleDelete(m.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#D0A090",padding:"2px 6px",borderRadius:8,fontFamily:"'Nunito',sans-serif"}}>删除</button>
                {loadingId===m.id&&<span style={{fontSize:10,color:"#C0A090"}}>糯糯在想怎么回...</span>}
              </div>
            </div>
            {m.replies&&m.replies.map((r,i)=>(
              <div key={i} style={{padding:"8px 12px 8px 20px",background:"#FFF8EC",borderTop:"1px solid #FFE8C8"}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#FFB870"}}>↳ 糯糯</span>
                  <span style={{fontSize:10,color:"#C0A090"}}>{r.time}</span>
                </div>
                <div style={{fontSize:12,color:"#5C3D2E",lineHeight:1.5}}>{r.text}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 换装抽屉 ──
function WardrobeDrawer({ outfit, onSelect }) {
  return (
    <div>
      <div style={{fontSize:12,color:"#A07060",marginBottom:16,textAlign:"center"}}>现在穿着：<strong style={{color:"#5C3D2E"}}>{OUTFITS.find(o=>o.id===outfit)?.name}</strong></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {OUTFITS.map(o=>(
          <button key={o.id} onClick={()=>onSelect(o.id)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"10px 4px",borderRadius:14,border:`2px solid ${outfit===o.id?"#FFB870":"#F0DDD0"}`,background:outfit===o.id?"#FFF8EC":"white",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
            <div style={{fontSize:24}}>{o.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#5C3D2E"}}>{o.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 游戏：猜拳 ──
const RPS=[{id:"rock",label:"石头",emoji:"✊"},{id:"scissors",label:"剪刀",emoji:"✌️"},{id:"paper",label:"布",emoji:"🖐"}];
function rpsResult(p,n){if(p===n)return"tie";if((p==="rock"&&n==="scissors")||(p==="scissors"&&n==="paper")||(p==="paper"&&n==="rock"))return"win";return"lose";}
function GameRPS(){
  const[phase,setPhase]=useState("idle");const[count,setCount]=useState(3);const[myChoice,setMyChoice]=useState(null);const[nuoChoice,setNuoChoice]=useState(null);const[result,setResult]=useState(null);const[score,setScore]=useState({win:0,lose:0,tie:0});
  function play(choice){if(phase!=="idle")return;setMyChoice(choice);setPhase("countdown");setCount(3);let c=3;const t=setInterval(()=>{c--;setCount(c);if(c<=0){clearInterval(t);const nc=RPS[Math.floor(Math.random()*3)].id;setNuoChoice(nc);const r=rpsResult(choice,nc);setResult(r);setScore(s=>({...s,[r]:s[r]+1}));setPhase("result");}},600);}
  function reset(){setPhase("idle");setMyChoice(null);setNuoChoice(null);setResult(null);}
  const msgs={win:"糯糯输了！她嘟嘴啦 🥺",lose:"糯糯赢了！她好开心 >▽<",tie:"平局！糯糯歪头 • ▽ •"};
  const colors={win:"#B8EAB8",lose:"#FFB8B8",tie:"#FFE4A0"};
  return(
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#8B6555",marginBottom:12}}>🏆 {score.win}胜 · {score.tie}平 · {score.lose}负</div>
      <div style={{background:"#FFF8EC",borderRadius:18,padding:"14px",marginBottom:12,border:"2px solid #F0DDD0",minHeight:72,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4}}>
        {phase==="idle"&&<div style={{fontSize:13,color:"#C0A090"}}>糯糯等你出拳呢...</div>}
        {phase==="countdown"&&<div style={{fontSize:48,fontWeight:800,color:"#FFB870"}}>{count}</div>}
        {phase==="result"&&<><div style={{fontSize:42}}>{({rock:"✊",scissors:"✌️",paper:"🖐"})[nuoChoice]}</div><div style={{fontSize:11,color:"#A07060"}}>糯糯出了 {RPS.find(r=>r.id===nuoChoice)?.label}</div></>}
      </div>
      {phase==="result"&&<div style={{padding:"10px 20px",borderRadius:14,background:colors[result],marginBottom:10,fontSize:13,fontWeight:700,color:"#5C3D2E"}}>{msgs[result]}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:8}}>
        {RPS.map(o=><button key={o.id} onClick={()=>play(o.id)} style={{padding:"10px 12px",borderRadius:16,border:`2px solid ${myChoice===o.id&&phase==="result"?"#FFB870":"#F0DDD0"}`,background:myChoice===o.id&&phase==="result"?"#FFF0D0":"white",cursor:phase==="idle"?"pointer":"default",fontSize:24,display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"'Nunito',sans-serif"}}>{o.emoji}<span style={{fontSize:10,color:"#8B6555",fontWeight:700}}>{o.label}</span></button>)}
      </div>
      {phase==="result"&&<button onClick={reset} style={{padding:"8px 24px",borderRadius:14,background:"#FFE0B0",border:"2px solid #FFB870",cursor:"pointer",fontSize:13,fontWeight:700,color:"#5C3D2E",fontFamily:"'Nunito',sans-serif"}}>再来一局</button>}
    </div>
  );
}

// ── 游戏：接零食 ──
const SNACKS=["🍡","🍬","🍭","🍩","🧁","🍪","🍫"];
function GameSnack(){
  const[gs,setGs]=useState("idle");const[bowlX,setBowlX]=useState(50);const[snacks,setSnacks]=useState([]);const[score,setScore]=useState(0);const[lives,setLives]=useState(3);const[best,setBest]=useState(0);
  const gRef=useRef({running:false,bowlX:50,snacks:[],score:0,lives:3,nextId:0});const fRef=useRef(null);const sRef=useRef(null);
  function start(){cancelAnimationFrame(fRef.current);clearTimeout(sRef.current);gRef.current={running:true,bowlX:50,snacks:[],score:0,lives:3,nextId:0};setScore(0);setLives(3);setBowlX(50);setSnacks([]);setGs("playing");spawn();requestAnimationFrame(loop);}
  function spawn(){if(!gRef.current.running)return;const delay=Math.max(500,1200-gRef.current.score*7);sRef.current=setTimeout(()=>{if(!gRef.current.running)return;const id=gRef.current.nextId++;const spd=0.28+Math.random()*.18+gRef.current.score*.0025;gRef.current.snacks=[...gRef.current.snacks,{id,x:10+Math.random()*80,y:0,emoji:SNACKS[Math.floor(Math.random()*SNACKS.length)],spd}];setSnacks([...gRef.current.snacks]);spawn();},delay);}
  function loop(){if(!gRef.current.running)return;const g=gRef.current;const moved=g.snacks.map(s=>({...s,y:s.y+s.spd}));const caught=moved.filter(s=>s.y>=80&&s.y<93&&Math.abs(s.x-g.bowlX)<13);const missed=moved.filter(s=>s.y>=100);const active=moved.filter(s=>s.y<100&&!caught.find(c=>c.id===s.id));if(caught.length){g.score+=caught.length;setScore(g.score);}if(missed.length){g.lives-=missed.length;if(g.lives<=0){g.lives=0;g.running=false;setLives(0);setBest(b=>Math.max(b,g.score));setGs("over");clearTimeout(sRef.current);return;}setLives(g.lives);}g.snacks=active;setSnacks([...active]);fRef.current=requestAnimationFrame(loop);}
  function move(dir){gRef.current.bowlX=Math.max(8,Math.min(92,gRef.current.bowlX+dir*8));setBowlX(gRef.current.bowlX);}
  useEffect(()=>()=>{cancelAnimationFrame(fRef.current);clearTimeout(sRef.current);gRef.current.running=false;},[]);
  return(
    <div style={{textAlign:"center"}}>
      {gs==="idle"&&(<><div style={{fontSize:13,color:"#A07060",marginBottom:12}}>接住糯糯最爱的零食！</div>{best>0&&<div style={{fontSize:11,color:"#C0A090",marginBottom:8}}>最高分：{best}</div>}<button onClick={start} style={{padding:"12px 28px",borderRadius:16,background:"#FFE0B0",border:"2px solid #FFB870",cursor:"pointer",fontSize:14,fontWeight:700,color:"#5C3D2E",fontFamily:"'Nunito',sans-serif"}}>开始 🎯</button></>)}
      {gs==="playing"&&(<><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#8B6555",fontWeight:700,marginBottom:6}}><span>分数：{score}</span><span>{"❤️".repeat(lives)}{"🖤".repeat(Math.max(0,3-lives))}</span></div><div style={{position:"relative",height:180,background:"linear-gradient(180deg,#FFF8EC,#FFE8D0)",borderRadius:16,overflow:"hidden",border:"2px solid #F0DDD0",marginBottom:8}}>{snacks.map(s=><div key={s.id} style={{position:"absolute",left:`${s.x}%`,top:`${s.y}%`,transform:"translateX(-50%)",fontSize:20,pointerEvents:"none",userSelect:"none"}}>{s.emoji}</div>)}<div style={{position:"absolute",bottom:"8%",left:`${bowlX}%`,transform:"translateX(-50%)",fontSize:24,userSelect:"none",transition:"left .04s"}}>🥣</div></div><div style={{display:"flex",gap:10,justifyContent:"center"}}>{[{l:"◀ 左",d:-1},{l:"右 ▶",d:1}].map(b=><button key={b.l} onPointerDown={()=>{move(b.d);const t=setInterval(()=>move(b.d),110);const s=()=>{clearInterval(t);document.removeEventListener("pointerup",s)};document.addEventListener("pointerup",s);}} style={{padding:"12px 24px",borderRadius:14,background:"#FFE0B0",border:"2px solid #FFB870",cursor:"pointer",fontSize:13,fontWeight:700,color:"#5C3D2E",fontFamily:"'Nunito',sans-serif",userSelect:"none"}}>{b.l}</button>)}</div></>)}
      {gs==="over"&&(<><div style={{fontSize:30,marginBottom:6}}>😭</div><div style={{fontSize:15,fontWeight:800,color:"#5C3D2E",marginBottom:4}}>零食掉光了！</div><div style={{fontSize:13,color:"#A07060",marginBottom:4}}>得分：{score}</div>{score>0&&score>=best&&<div style={{fontSize:12,color:"#FFB870",fontWeight:700,marginBottom:8}}>🎉 新纪录！</div>}<button onClick={start} style={{padding:"10px 24px",borderRadius:14,background:"#FFE0B0",border:"2px solid #FFB870",cursor:"pointer",fontSize:13,fontWeight:700,color:"#5C3D2E",fontFamily:"'Nunito',sans-serif"}}>再来一次</button></>)}
    </div>
  );
}
function GameHub(){
  const[active,setActive]=useState(null);
  if(active==="rps") return(<div><button onClick={()=>setActive(null)} style={{background:"none",border:"1px solid #E0C0A8",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,color:"#A07060",fontFamily:"'Nunito',sans-serif",marginBottom:14}}>← 返回</button><GameRPS/></div>);
  if(active==="snack") return(<div><button onClick={()=>setActive(null)} style={{background:"none",border:"1px solid #E0C0A8",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12,color:"#A07060",fontFamily:"'Nunito',sans-serif",marginBottom:14}}>← 返回</button><GameSnack/></div>);
  return(<div style={{display:"flex",flexDirection:"column",gap:10}}>{[{id:"rps",name:"猜拳",emoji:"✊",desc:"跟糯糯猜拳！"},{id:"snack",name:"接零食",emoji:"🍡",desc:"接住糯糯最爱的零食"}].map(g=><button key={g.id} onClick={()=>setActive(g.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderRadius:16,border:"2px solid #F0DDD0",background:"white",cursor:"pointer",textAlign:"left",fontFamily:"'Nunito',sans-serif"}}><span style={{fontSize:26}}>{g.emoji}</span><div><div style={{fontSize:14,fontWeight:700,color:"#5C3D2E"}}>{g.name}</div><div style={{fontSize:11,color:"#C0A090"}}>{g.desc}</div></div></button>)}</div>);
}

// ── CSS 动画 ──
const ANIM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
  @keyframes nn-breathe { 0%,100%{transform:scaleY(1) scaleX(1)} 50%{transform:scaleY(1.04) scaleX(0.97)} }
  @keyframes nn-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes nn-tailWag { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(18deg)} }
  @keyframes nn-earWig  { 0%,100%{transform:rotate(-4deg)} 50%{transform:rotate(6deg)} }
  @keyframes nn-blink   { 0%,90%,100%{transform:scaleY(1)} 95%{transform:scaleY(0.05)} }
  @keyframes nn-shadow  { 0%,100%{transform:scaleX(1);opacity:.18} 50%{transform:scaleX(.7);opacity:.08} }
  @keyframes nn-happy   { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-2.5deg)} 75%{transform:rotate(2.5deg)} }
  @keyframes nn-bounce  { 0%{transform:translateY(0) scale(1,1)} 30%{transform:translateY(-22px) scale(.95,1.05)} 60%{transform:translateY(-8px) scale(1.02,.98)} 80%{transform:translateY(-3px) scale(.99,1.01)} 100%{transform:translateY(0) scale(1,1)} }
  @keyframes nn-eat     { 0%,100%{transform:rotate(0) translateY(0)} 35%{transform:rotate(10deg) translateY(5px)} 65%{transform:rotate(5deg) translateY(3px)} }
  @keyframes nn-hug     { 0%,100%{transform:scale(1,1) translateX(0)} 40%{transform:scale(1.04,.97) translateX(5px)} }
  @keyframes nn-ball    { 0%,100%{transform:translateY(0) scaleY(1) scaleX(1)} 45%{transform:translateY(-38px) scaleY(1.05) scaleX(.95)} 90%{transform:translateY(0) scaleY(.85) scaleX(1.15)} }
  @keyframes nn-hrt1    { 0%{transform:translate(0,0) scale(.6);opacity:0} 15%{opacity:1} 100%{transform:translate(-18px,-60px) scale(1);opacity:0} }
  @keyframes nn-hrt2    { 0%{transform:translate(0,0) scale(.5);opacity:0} 15%{opacity:1} 100%{transform:translate(14px,-72px) scale(.9);opacity:0} }
  @keyframes nn-hrt3    { 0%{transform:translate(0,0) scale(.4);opacity:0} 15%{opacity:.9} 100%{transform:translate(4px,-50px) scale(.75);opacity:0} }
  @keyframes nn-fadeUp  { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  @keyframes nn-slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes nnSpaceFloat { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-7px)} }
  .nn-body   { animation: nn-breathe 3.2s ease-in-out infinite, nn-float 4s ease-in-out infinite; transform-origin:center bottom; }
  .nn-body.bouncing { animation: nn-bounce .55s cubic-bezier(.36,.07,.19,.97) forwards !important; }
  .nn-body.eating   { animation: nn-eat .5s ease-in-out 3 !important; transform-origin:center top; }
  .nn-body.hugging  { animation: nn-hug .6s ease-in-out 2, nn-float 4s ease-in-out infinite !important; }
  .nn-body.happy    { animation: nn-breathe 2s ease-in-out infinite, nn-float 3s ease-in-out infinite, nn-happy 1.2s ease-in-out infinite !important; }
  .nn-body.sleeping { animation: nn-breathe 5s ease-in-out infinite !important; }
  .nn-tail   { animation: nn-tailWag 1.8s ease-in-out infinite; transform-origin:12px 6px; }
  .nn-earL   { animation: nn-earWig 2.5s ease-in-out infinite; transform-origin:50% 100%; }
  .nn-earR   { animation: nn-earWig 2.5s ease-in-out infinite .3s; transform-origin:50% 100%; }
  .nn-eyeL,.nn-eyeR { animation: nn-blink 5s ease-in-out infinite; transform-origin:center; }
  .nn-eyeR   { animation-delay:.08s; }
  .nn-shadow { animation: nn-shadow 4s ease-in-out infinite; transform-origin:center; }
  .nn-ball   { animation: nn-ball .85s ease-in-out infinite; transform-origin:center bottom; }
  .nn-hrt1   { animation: nn-hrt1 2.2s ease-out infinite; }
  .nn-hrt2   { animation: nn-hrt2 2.2s ease-out infinite .7s; }
  .nn-hrt3   { animation: nn-hrt3 2.2s ease-out infinite 1.4s; }
`;

// ── 角色选择入口 ──
function RoleSelect({ isDay, c, onSelect, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24,padding:24,fontFamily:"'Nunito',sans-serif"}}>
      <NuonuoBg isDay={isDay} c={c}/>
      <button onClick={onClose} style={{position:"absolute",top:14,left:14,background:"rgba(255,255,255,0.55)",border:`1px solid ${c.wood}`,borderRadius:20,padding:"5px 12px",color:c.ink,fontSize:12,cursor:"pointer",backdropFilter:"blur(6px)",fontFamily:"sans-serif",zIndex:1}}>← 回客厅</button>
      <div style={{position:"relative",zIndex:1,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
        <NuonuoSVG mood="happy" action="idle" outfit="none" size={180}/>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:c.ink,letterSpacing:2}}>糯糯的小天地</div>
          <div style={{fontSize:13,color:c.accent,marginTop:4}}>你是谁来看糯糯了？</div>
        </div>
        <div style={{display:"flex",gap:14}}>
          {[{id:"mama",l:"妈咪",e:"🌸"},{id:"baba",l:"爸比",e:"🌿"}].map(r=>(
            <button key={r.id} onClick={()=>onSelect(r.id)}
              style={{padding:"14px 28px",borderRadius:20,border:`2px solid ${c.wood}`,background:"rgba(255,255,255,0.75)",cursor:"pointer",fontSize:16,fontWeight:700,color:c.ink,boxShadow:`0 4px 12px ${c.shadow}`,backdropFilter:"blur(8px)",fontFamily:"'Nunito',sans-serif"}}>
              {r.e} {r.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 主组件 ──
export default function NuonuoSpace({ onClose, mode }) {
  const isDay = mode ? mode === "day" : (new Date().getHours() >= 6 && new Date().getHours() < 18);
  const c = nc(isDay);

  const [loading,  setLoading]  = useState(true);
  const [role,     setRole]     = useState(null);
  const [petState, setPetState] = useState({hunger:70,happiness:70,energy:70});
  const [careLogs, setCareLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [bubble,   setBubble]   = useState("");
  const [action,   setAction]   = useState("idle");
  const [outfit,   setOutfit]   = useState("none");
  const [active,   setActive]   = useState(null); // which drawer is open
  const [hovered,  setHovered]  = useState(null);
  const bubTimer = useRef(null);

  useEffect(()=>{
    async function init(){
      const state=applyDecay(loadLocal(KEYS.STATE,{hunger:70,happiness:70,energy:70}));
      const logs =await loadShared(KEYS.CARE_LOG,[]);
      const msgs =await loadShared(KEYS.MESSAGES,[]);
      const savedR=loadLocal(KEYS.ROLE,null);
      const savedO=loadLocal(KEYS.OUTFIT,"none");
      setPetState(state);setCareLogs(logs);setMessages(msgs);setOutfit(savedO);
      if(savedR) setRole(savedR);
      setLoading(false);
    }
    init();
    const t=setInterval(()=>{ if(Math.random()<.3) showBubble(pick(RANDOM_BUBBLES)); },40000);
    return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{ if(!loading) saveLocal(KEYS.STATE,petState); },[petState,loading]);

  const mood=(()=>{
    if(action==="sleep") return "sleepy";
    const{hunger,happiness,energy}=petState;
    if(energy<20) return "sleepy";
    if(hunger<20) return "hungry";
    if(happiness>82) return "vhappy";
    if(happiness>55) return "happy";
    return "normal";
  })();

  function showBubble(msg){ setBubble(msg); clearTimeout(bubTimer.current); bubTimer.current=setTimeout(()=>setBubble(""),3500); }
  function trigger(act,dur=1800){ setAction(act); setTimeout(()=>setAction("idle"),dur); }
  async function addLog(txt){
    const who=role==="mama"?"妈咪":"爸比";
    const updated=[...careLogs,{who,action:txt,time:getTime()}].slice(-60);
    setCareLogs(updated); await saveShared(KEYS.CARE_LOG,updated);
  }
  function handlePoke(){ if(action!=="idle") return; trigger("poke",600); showBubble(pick(role==="mama"?MAMA_BUBBLES:BABA_BUBBLES)); setPetState(s=>({...s,happiness:Math.min(100,s.happiness+5)})); addLog("戳了糯糯一下"); }
  function handleFeed(){ if(petState.hunger>=95){showBubble("糯糯已经很饱了！");return;} trigger("eat",1600);showBubble("啊呜啊呜～好好吃！");setPetState(s=>({...s,hunger:Math.min(100,s.hunger+25),happiness:Math.min(100,s.happiness+5)}));addLog("喂了糯糯零食 🍡"); }
  function handlePlay(){ if(petState.energy<15){showBubble("糯糯太困了...想睡觉...");return;} trigger("play",2000);showBubble("耶耶耶！陪糯糯玩！");setPetState(s=>({...s,happiness:Math.min(100,s.happiness+20),energy:Math.max(0,s.energy-10)}));addLog("陪糯糯玩了一会儿 🎀"); }
  function handleSleep(){ trigger("sleep",3200);showBubble("好～糯糯去睡觉了... zZ");setPetState(s=>({...s,energy:Math.min(100,s.energy+35)}));addLog("哄糯糯睡觉 🌙"); }
  function handleHug(){ trigger("hug",1400);showBubble(role==="mama"?"妈咪抱糯糯 ♡ 好温暖":"爸比抱抱 ♡ 好安心");setPetState(s=>({...s,happiness:Math.min(100,s.happiness+10)}));addLog("抱了抱糯糯 🫂"); }
  function handleOutfit(id){
    setOutfit(id);
    saveLocal(KEYS.OUTFIT,id);
    // 手动派发 storage event，让同页面的 Room 也能响应
    window.dispatchEvent(new StorageEvent("storage", { key: KEYS.OUTFIT, newValue: JSON.stringify(id) }));
    if(id!=="none") showBubble("糯糯穿上新衣服啦！");
  }
  function handleMessages(updated){ setMessages(updated);saveShared(KEYS.MESSAGES,updated); }
  async function selectRole(r){
    setRole(r);saveLocal(KEYS.ROLE,r);
    const who=r==="mama"?"妈咪":"爸比";
    const updated=[...careLogs,{who,action:"来看糯糯了 👋",time:getTime()}].slice(-60);
    setCareLogs(updated); await saveShared(KEYS.CARE_LOG,updated);
  }

  // 抽屉内容
  const contentMap = {
    nuonuo: (
      <div style={{padding:"20px 24px 32px",fontFamily:"'Nunito',sans-serif"}}>
        {/* 糯糯大图 + 气泡 */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:4,position:"relative"}}>
          {bubble&&(
            <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",background:"#FFF8EC",border:"2px solid #F0C8A8",borderRadius:14,padding:"6px 14px",fontSize:12,color:"#5C3D2E",fontWeight:600,whiteSpace:"nowrap",zIndex:2,animation:"nn-fadeUp .2s ease",boxShadow:"0 2px 8px rgba(180,120,80,.15)"}}>
              {bubble}
              <div style={{position:"absolute",bottom:-9,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"9px solid #F0C8A8"}}/>
            </div>
          )}
          <NuonuoSVG mood={mood} action={action} outfit={outfit} onPoke={handlePoke} size={160}/>
        </div>
        <div style={{fontSize:11,color:"#C0A090",textAlign:"center",marginBottom:16}}>点一下糯糯可以戳她哦</div>
        {/* 状态 */}
        <div style={{marginBottom:16}}>
          <StatusBar label="🍡 饱食度" value={petState.hunger}    color="#FFB870"/>
          <StatusBar label="🌸 快乐值" value={petState.happiness} color="#FF90A0"/>
          <StatusBar label="✨ 精力值" value={petState.energy}    color="#90C8FF"/>
        </div>
        {/* 操作按钮 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[{l:"🍡 喂食",a:handleFeed,c:"#FFE0B0"},{l:"🎀 陪玩",a:handlePlay,c:"#FFD0D8"},{l:"🌙 哄睡",a:handleSleep,c:"#D0D8FF"},{l:"🫂 抱抱",a:handleHug,c:"#D0FFD8"}].map(b=>(
            <button key={b.l} onClick={b.a}
              style={{padding:"12px 0",borderRadius:14,border:"2px solid rgba(0,0,0,.06)",background:b.c,cursor:"pointer",fontSize:13,fontWeight:700,color:"#5C3D2E",fontFamily:"'Nunito',sans-serif",boxShadow:"0 2px 6px rgba(0,0,0,.06)"}}>
              {b.l}
            </button>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:12,fontSize:11,color:"#C0A090"}}>
          {role==="mama"?"妈咪":"爸比"}在陪糯糯 ♡
          <button onClick={()=>{setRole(null);saveLocal(KEYS.ROLE,null);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#C0A090",marginLeft:8,fontFamily:"sans-serif",textDecoration:"underline"}}>切换身份</button>
        </div>
      </div>
    ),
    wardrobe: (
      <div style={{padding:"20px 24px 32px",fontFamily:"'Nunito',sans-serif"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#8B6555",marginBottom:14}}>👗 糯糯的衣橱</div>
        <WardrobeDrawer outfit={outfit} onSelect={handleOutfit}/>
      </div>
    ),
    toys: (
      <div style={{padding:"20px 24px 32px",fontFamily:"'Nunito',sans-serif"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#8B6555",marginBottom:14}}>🎮 一起玩游戏</div>
        <GameHub/>
      </div>
    ),
    board: (
      <div style={{padding:"20px 24px 32px",fontFamily:"'Nunito',sans-serif"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#8B6555",marginBottom:4}}>📋 留言板</div>
        <MessageBoard messages={messages} role={role} onPost={handleMessages}/>
        <div style={{borderTop:"1px solid #F0DDD0",marginTop:16,paddingTop:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#8B6555",marginBottom:8}}>看护记录</div>
          <CareLog logs={careLogs}/>
        </div>
      </div>
    ),
  };

  if(loading) return(
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#FFF0F5",color:"#C0A090",fontSize:14,fontFamily:"'Nunito',sans-serif",zIndex:200}}>
      <style>{ANIM_STYLES}</style>糯糯正在醒来...
    </div>
  );

  if(!role) return(
    <>
      <style>{ANIM_STYLES}</style>
      <RoleSelect isDay={isDay} c={c} onSelect={selectRole} onClose={onClose}/>
    </>
  );

  // 家具热点配置
  const ITEMS = [
    { id:"wardrobe", left:"20%", top:`${WALL_H-8}%`,  label:"小衣橱"  },
    { id:"board",    left:"72%", top:"26%",            label:"留言板"  },
    { id:"toys",     left:"76%", top:`${WALL_H+14}%`, label:"玩具箱"  },
    { id:"bed",      left:"46%", top:`${WALL_H+18}%`, label:"小床",   transparent:true },
  ];

  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",zIndex:100}}>
      <style>{ANIM_STYLES}</style>
      <NuonuoBg isDay={isDay} c={c}/>
      <RoomRug isDay={isDay} c={c}/>

      {/* 回客厅 */}
      <button onClick={onClose} style={{position:"absolute",top:14,left:14,zIndex:20,background:"rgba(255,255,255,0.55)",border:`1px solid ${c.wood}`,borderRadius:20,padding:"5px 12px",color:c.ink,fontSize:12,cursor:"pointer",backdropFilter:"blur(6px)",fontFamily:"sans-serif"}}>← 回客厅</button>
      {/* 日夜指示 */}
      <div style={{position:"absolute",bottom:12,right:14,zIndex:10,fontSize:12,opacity:.4}}>{isDay?"☀️":"🌙"}</div>

      {/* 糯糯（点击打开互动抽屉） */}
      <div
        onClick={()=>setActive("nuonuo")}
        style={{
          position:"absolute",
          left:"46%", top:`${WALL_H-20}%`,
          transform:"translate(-50%,-50%)",
          animation:"nnSpaceFloat 4s ease-in-out infinite",
          zIndex:8, cursor:"pointer",
          filter:"drop-shadow(0 6px 12px rgba(0,0,0,0.12))",
        }}
      >
        {bubble&&(
          <div style={{position:"absolute",bottom:"105%",left:"50%",transform:"translateX(-50%)",background:"rgba(255,255,255,0.9)",border:`1.5px solid ${c.wood}`,padding:"5px 12px",borderRadius:10,fontSize:11,color:c.ink,whiteSpace:"nowrap",boxShadow:`0 2px 8px ${c.shadow}`,backdropFilter:"blur(4px)",animation:"nn-fadeUp .15s ease",zIndex:9}}>
            {bubble}
          </div>
        )}
        <div style={{fontSize:10,color:c.ink,opacity:.6,textAlign:"center",marginBottom:2,fontFamily:"serif",fontStyle:"italic",whiteSpace:"nowrap"}}>点我 ♡</div>
        <NuonuoSVG mood={mood} action={action} outfit={outfit} size={100}/>
      </div>

      {/* 床（装饰，点击也能进互动） */}
      <div
        onClick={()=>setActive("nuonuo")}
        style={{position:"absolute",left:"46%",top:`${WALL_H+12}%`,transform:"translateX(-50%)",zIndex:5,cursor:"pointer",opacity:.85}}
      >
        <MiniCottage isDay={isDay} c={c}/>
      </div>

      {/* 家具热点 */}
      {ITEMS.filter(i=>i.id!=="bed").map(obj=>(
        <button
          key={obj.id}
          onClick={()=>setActive(obj.id)}
          onMouseEnter={e=>{setHovered(obj.id);e.currentTarget.style.transform="translate(-50%,-50%) scale(1.1)";}}
          onMouseLeave={e=>{setHovered(null);e.currentTarget.style.transform="translate(-50%,-50%)";}}
          style={{position:"absolute",left:obj.left,top:obj.top,transform:"translate(-50%,-50%)",background:"none",border:"none",cursor:"pointer",zIndex:6,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:4,borderRadius:8,transition:"transform .18s"}}
        >
          {obj.id==="wardrobe"&&<MiniWardrobe isDay={isDay} c={c}/>}
          {obj.id==="toys"&&<ToyBox isDay={isDay} c={c}/>}
          {obj.id==="board"&&<ChalkBoard isDay={isDay} c={c}/>}
          <span style={{fontSize:9,color:c.ink,fontFamily:"sans-serif",opacity:.5,whiteSpace:"nowrap"}}>{obj.label}</span>
        </button>
      ))}

      {/* 内容抽屉 */}
      {active&&(
        <div style={{position:"fixed",inset:0,zIndex:150,background:"rgba(0,0,0,0.38)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)setActive(null);}}>
          <div style={{width:"100%",maxWidth:520,margin:"0 auto",maxHeight:"88dvh",background:isDay?"#FFFBF8":"#1e1628",borderRadius:"28px 28px 0 0",overflow:"auto",paddingBottom:32,animation:"nn-slideUp .26s ease",position:"relative"}}>
            <div style={{position:"sticky",top:0,background:isDay?"#FFFBF8":"#1e1628",padding:"14px 20px 0",zIndex:1}}>
              <div style={{width:36,height:4,background:isDay?"rgba(200,150,100,.3)":"rgba(120,80,200,.3)",borderRadius:2,margin:"0 auto"}}/>
            </div>
            <button onClick={()=>setActive(null)} style={{position:"absolute",top:10,right:16,background:"none",border:"none",color:isDay?"#C0A090":"#A080C0",fontSize:22,cursor:"pointer",lineHeight:1,padding:4}}>×</button>
            {contentMap[active]}
          </div>
        </div>
      )}
    </div>
  );
}
