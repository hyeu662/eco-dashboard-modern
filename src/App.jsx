import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { ChevronDown, Activity, Wind, Trees, Target, DollarSign, Zap, TrendingUp, ShieldAlert, ListOrdered, Info } from "lucide-react";

/* ── Leaflet 설정 ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ══════════════════════════════════════
    DATA CONFIGURATION
══════════════════════════════════════ */
const REAL_SPECIES_DATA = [
  { name: "소나무", count: 258, storage: 3.36, sequestration: 0.395, countPct: 21.3, storagePct: 38.9, color: "#14532d" },
  { name: "이팝나무", count: 151, storage: 2.08, sequestration: 0.423, countPct: 12.4, storagePct: 24.1, color: "#166534" },
  { name: "느티나무", count: 139, storage: 1.31, sequestration: 0.130, countPct: 11.4, storagePct: 15.2, color: "#15803d" },
  { name: "왕벚나무", count: 110, storage: 0.54, sequestration: 0.160, countPct: 9.1, storagePct: 6.3, color: "#22c55e" },
  { name: "편백", count: 93, storage: 0.77, sequestration: 0.106, countPct: 7.7, storagePct: 8.9, color: "#4ade80" },
  { 
    name: "기타 수종", 
    count: 463, 
    storage: 0.57, 
    sequestration: 0.542, 
    countPct: 38.1, 
    storagePct: 6.6, 
    color: "#94a3b8",
    desc: "갈참나무, 은행나무, 가중나무, 팽나무, 단풍나무, 굴참나무, 곰솔 등 총 16종" 
  }
];

const POLLUTION_DATA = [
  { name: '오존 (O3)', value: 162.4, color: '#3b82f6' },
  { name: '이산화질소 (NO2)', value: 38.7, color: '#60a5fa' },
  { name: '미세먼지 (PM2.5)', value: 11.2, color: '#93c5fd' },
  { name: '아황산가스 (SO2)', value: 10.5, color: '#bfdbfe' },
  { name: '일산화탄소 (CO)', value: 4.1, color: '#dbeafe' }
];

const SCENARIO_DATA = {
  best: [{year:"현재",v:0.756},{year:"5년",v:3.07},{year:"10년",v:4.50},{year:"20년",v:7.26},{year:"30년",v:9.71}],
  base: [{year:"현재",v:0.756},{year:"5년",v:2.86},{year:"10년",v:3.93},{year:"20년",v:5.60},{year:"30년",v:6.84}],
  worst: [{year:"현재",v:0.756},{year:"5년",v:2.24},{year:"10년",v:2.47},{year:"20년",v:2.47},{year:"30년",v:2.12}]
};

/* ── 커스텀 툴팁 컴포넌트 ── */
const CompositionTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: "#1e293b", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "12px", boxShadow: "0 10px 15px rgba(0,0,0,0.2)" }}>
        <p style={{ fontWeight: 800, marginBottom: "5px", color: data.color }}>{data.name}</p>
        <p>비중: {data.countPct}%</p>
        <p>개체수: {data.count} Trees</p>
        {data.desc && (
          <p style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #475569", color: "#cbd5e1", maxWidth: "200px", lineHeight: "1.4" }}>
            {data.desc}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const CSS = `
  :root { --main: #2d6a4f; --glass: rgba(255, 255, 255, 0.95); }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2560') center/cover; font-family: 'Pretendard', sans-serif; overflow: hidden; }
  .app-frame { display: flex; flex-direction: column; height: 100vh; width: 100vw; }
  .header { height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: white; border-bottom: 1px solid #ddd; z-index: 1000; }
  .logo { color: var(--main); font-weight: 900; font-size: 1.5rem; font-style: italic; }
  .nav-container { display: flex; gap: 40px; height: 100%; align-items: center; }
  .menu-item { position: relative; height: 100%; display: flex; align-items: center; cursor: pointer; }
  .menu-label { font-weight: 800; font-size: 14px; color: #475569; display: flex; align-items: center; gap: 5px; }
  .dropdown { position: absolute; top: 70px; right: 0; width: 180px; background: white; border: 1px solid #eee; border-radius: 0 0 12px 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: none; flex-direction: column; overflow: hidden; }
  .menu-item:hover .dropdown { display: flex; }
  .sub-btn { padding: 12px 20px; font-size: 12px; font-weight: 700; color: #64748b; text-align: left; border: none; background: none; cursor: pointer; }
  .sub-btn.active { color: var(--main); background: #f0fdf4; font-weight: 900; }
  .content { flex: 1; padding: 25px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
  .section-hd h2 { color: white !important; font-weight: 900; text-shadow: 0 2px 8px rgba(0,0,0,0.6); }
  .card { background: var(--glass); padding: 25px; border-radius: 20px; flex: 1; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
  .dashboard-grid { display: grid; grid-template-columns: 350px 1fr; gap: 20px; flex: 1; min-height: 0; }
  .rank-card { display: flex; align-items: center; gap: 15px; padding: 15px; background: white; border-radius: 12px; margin-bottom: 10px; border: 1px solid #f1f5f9; }
  .rank-num { width: 28px; height: 28px; background: var(--main); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; }
  .kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; }
  .kpi-box { background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #eee; }
`;

export default function App() {
  const [page, setPage] = useState("OV");
  const [sub, setSub] = useState("summary");

  const handleNav = (p, s) => { setPage(p); setSub(s); };

  const scenarioConfig = {
    best: { color: "#10b981", label: "BEST CASE (고사율 1.5%)", icon: <Zap size={18}/> },
    base: { color: "#3b82f6", label: "BASE CASE (고사율 3.0%)", icon: <TrendingUp size={18}/> },
    worst: { color: "#ef4444", label: "WORST CASE (고사율 8.0%)", icon: <ShieldAlert size={18}/> }
  };

  return (
    <div className="app-frame">
      <style>{CSS}</style>
      <header className="header">
        <div className="logo">ECO-VIEW</div>
        <nav className="nav-container">
          <div className="menu-item">
            <div className={`menu-label ${page === "OV" ? "active" : ""}`}>OVERVIEW <ChevronDown size={14}/></div>
            <div className="dropdown">
              <button className={`sub-btn ${sub === "summary" ? "active" : ""}`} onClick={() => handleNav("OV", "summary")}>현황 요약</button>
              <button className={`sub-btn ${sub === "map" ? "active" : ""}`} onClick={() => handleNav("OV", "map")}>위치 지도</button>
              <button className={`sub-btn ${sub === "dist" ? "active" : ""}`} onClick={() => handleNav("OV", "dist")}>수종 분포</button>
            </div>
          </div>
          <div className="menu-item">
            <div className={`menu-label ${page === "RT" ? "active" : ""}`}>REAL-TIME DATA <ChevronDown size={14}/></div>
            <div className="dropdown">
              <button className={`sub-btn ${sub === "analysis" ? "active" : ""}`} onClick={() => handleNav("RT", "analysis")}>수종별 탄소저장</button>
              <button className={`sub-btn ${sub === "eff" ? "active" : ""}`} onClick={() => handleNav("RT", "eff")}>수종 효율 비교</button>
            </div>
          </div>
          <div className="menu-item">
            <div className={`menu-label ${page === "PD" ? "active" : ""}`}>PREDICTION <ChevronDown size={14}/></div>
            <div className="dropdown">
              <button className={`sub-btn ${sub === "best" ? "active" : ""}`} onClick={() => handleNav("PD", "best")}>Best 분석</button>
              <button className={`sub-btn ${sub === "base" ? "active" : ""}`} onClick={() => handleNav("PD", "base")}>Base 분석</button>
              <button className={`sub-btn ${sub === "worst" ? "active" : ""}`} onClick={() => handleNav("PD", "worst")}>Worst 분석</button>
            </div>
          </div>
        </nav>
      </header>

      <main className="content">
        {page === "OV" && (
          <>
            {sub === "summary" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <h2 style={{color:'white', fontWeight:900, textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>현황 요약</h2>
                <div className="kpi-row">
                  {[{l:"총 수목 수",v:"1,214",u:"주",c:"#f0fdf4"},{l:"탄소 저장량",v:"8.63",u:"톤",c:"#f0f9ff"},{l:"연간 격리량",v:"1.756",u:"톤/년",c:"#fff7ed"},{l:"오염 제거량",v:"256.9",u:"lb/년",c:"#fdf2f8"},{l:"교체 가치",v:"89.1",u:"백만₩",c:"#f5f3ff"}].map((k,i)=>(
                    <div className="kpi-box" key={i} style={{backgroundColor:k.c}}>
                      <div style={{fontSize:12, fontWeight:800, color:'#64748b', marginBottom:10}}>{k.l}</div>
                      <div style={{fontSize:26, fontWeight:900}}>{k.v} <small style={{fontSize:14}}>{k.u}</small></div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', gap:20, flex:1}}>
                  <div className="card" style={{flex:1.5}}>
                    <div style={{fontWeight:900, color:'var(--main)', marginBottom:15}}>대기오염 제거 상세 (lb/년)</div>
                    <ResponsiveContainer><BarChart data={POLLUTION_DATA}><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis/><Tooltip/><Bar dataKey="value" radius={[5,5,0,0]}>{POLLUTION_DATA.map((entry, index) => (<Cell key={index} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer>
                  </div>
                  <div className="card" style={{flex:1, display:'flex', flexDirection:'column'}}>
                    <div style={{fontWeight:900, color:'var(--main)', marginBottom:20}}>수종별 탄소 저장 기여도 (%)</div>
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly'}}>
                      {REAL_SPECIES_DATA.slice(0, 5).map((s, i) => (
                        <div key={i}>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:13, fontWeight:800}}><span>{s.name}</span><span>{s.storagePct}%</span></div>
                          <div style={{width:'100%', height:10, background:'#e2e8f0', borderRadius:5, marginTop:5, overflow:'hidden'}}><div style={{width:`${s.storagePct}%`, height:'100%', background:s.color}} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {sub === "dist" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <h2 style={{color:'white', fontWeight:900, textShadow:'0 2px 8px rgba(0,0,0,0.4)'}}>수종별 분포 분석</h2>
                <div className="dashboard-grid">
                  {/* 왼쪽: 랭킹 리스트 (툴팁 제거하여 깔끔하게 복구) */}
                  <div className="card">
                    <div style={{fontWeight:900, color:'var(--main)', marginBottom:20, display:'flex', alignItems:'center', gap:8}}><ListOrdered size={20}/> 수종별 점유 순위</div>
                    <div style={{overflowY:'auto', flex:1}}>
                      {REAL_SPECIES_DATA.map((s, i) => (
                        <div className="rank-card" key={i}>
                          <div className="rank-num">{i + 1}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14, fontWeight:800}}>{s.name}</div>
                            <div style={{fontSize:11, color:'#94a3b8'}}>{s.count} Trees</div>
                          </div>
                          <div style={{fontSize:16, fontWeight:900, color: s.color}}>{s.countPct}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 오른쪽: 그래프 (막대에 마우스 올리면 수종 목록 툴팁 노출) */}
                  <div className="card">
                    <div style={{fontWeight:900, color:'var(--main)', marginBottom:20}}>수종 구성 비율 (%)</div>
                    <div style={{flex:1}}>
                      <ResponsiveContainer>
                        <BarChart data={REAL_SPECIES_DATA}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                          <XAxis dataKey="name" tick={{fontSize:12, fontWeight:700}} axisLine={false} tickLine={false}/>
                          <YAxis hide/>
                          <Tooltip content={<CompositionTooltip />} cursor={{fill: '#f8fafc'}}/>
                          <Bar dataKey="countPct" radius={[10,10,0,0]} barSize={40}>
                            {REAL_SPECIES_DATA.map((d,i)=><Cell key={i} fill={d.color}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{marginTop:20, padding:20, background:'#f8fafc', borderRadius:15, display:'flex', alignItems:'center', gap:15, border:'1px solid #eee'}}>
                      <div style={{background:'var(--main)', color:'white', padding:8, borderRadius:'50%'}}><Info size={18}/></div>
                      <div style={{fontSize:14, color:'#334155'}}>분석 결과, 상위 3개 수종이 전체의 45.1%를 점유하고 있습니다.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {sub === "map" && <div className="card" style={{height:'100%'}}><MapContainer center={[35.858, 129.213]} zoom={13} style={{height:'100%', borderRadius:12}}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[35.858, 129.213]} /></MapContainer></div>}
          </>
        )}

        {/* 📡 REAL-TIME & PREDICTION 로직 동일하게 유지 */}
        {page === "RT" && (
          <>
            <h2 style={{color:'white', fontWeight:900, textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>수종 정밀 분석</h2>
            {sub === "analysis" && <div className="card"><ResponsiveContainer><BarChart data={REAL_SPECIES_DATA}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="storage" name="저장량(톤)" fill="var(--main)"/><Bar dataKey="sequestration" name="격리량(톤/년)" fill="#3b82f6"/></BarChart></ResponsiveContainer></div>}
            {sub === "eff" && <div className="card"><div style={{fontWeight:800, marginBottom:20}}>개체수 대비 탄소 기여 분석</div><ResponsiveContainer><BarChart data={REAL_SPECIES_DATA}><XAxis dataKey="name"/><YAxis unit="%"/><Tooltip/><Legend/><Bar dataKey="countPct" name="개체수 비중" fill="#cbd5e1"/><Bar dataKey="storagePct" name="탄소 기여도" fill="var(--main)"/></BarChart></ResponsiveContainer></div>}
          </>
        )}
        {page === "PD" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <h2 style={{color:'white', fontWeight:900, textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>미래 예측: <span style={{color:scenarioConfig[sub].color}}>{scenarioConfig[sub].label}</span></h2>
            <div style={{display:'flex', gap:20, flex:1}}>
              <div className="card" style={{flex:1.5}}><ResponsiveContainer><AreaChart data={SCENARIO_DATA[sub]}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="year"/><YAxis domain={[0, 10]}/><Tooltip/><Area type="monotone" dataKey="v" stroke={scenarioConfig[sub].color} fill={scenarioConfig[sub].color} fillOpacity={0.1} strokeWidth={4}/></AreaChart></ResponsiveContainer></div>
              <div className="card" style={{flex:0.8, justifyContent:'center', textAlign:'center'}}>{scenarioConfig[sub].icon}<div style={{fontSize:14, color:'#64748b', marginTop:20}}>30년 후 예상 격리량</div><div style={{fontSize:48, fontWeight:900, color:scenarioConfig[sub].color}}>{SCENARIO_DATA[sub][4].v} <small style={{fontSize:20}}>톤/년</small></div></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}