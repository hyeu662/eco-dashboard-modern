import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Tooltip as LeafletTooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { ChevronDown, Activity, Wind, Trees, Target, DollarSign, Zap, TrendingUp, ShieldAlert, ListOrdered, Info, BrainCircuit, Target as TargetIcon } from "lucide-react";

/* ── Leaflet 기본 설정 ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── 🌳 둥글고 풍성한 나무 모양 커스텀 아이콘 ── */
const createTreeIcon = (color, size) => {
  return L.divIcon({
    html: `<div style="color: ${color}; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
            <svg viewBox="0 0 24 24" width="${size}" height="${size}">
              <path d="M11 22h2v-7h-2v7z" fill="#78350f" />
              <path d="M12 11c1.5 0 3-1 3-2.5S13.5 6 12 6s-3 1-3 2.5 1.5 2.5 3 2.5z" fill="currentColor" />
              <circle cx="8" cy="11.5" r="3.5" fill="currentColor" />
              <circle cx="16" cy="11.5" r="3.5" fill="currentColor" />
              <circle cx="12" cy="14" r="4" fill="currentColor" />
              <circle cx="12" cy="7" r="3.5" fill="currentColor" />
            </svg>
          </div>`,
    className: "custom-tree-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

/* ══════════════════════════════════════
    데이터 세팅 (실시설계 및 i-Tree 분석 기반)
══════════════════════════════════════ */
const REAL_SPECIES_DATA = [
  { name: "소나무", count: 258, storage: 3.36, sequestration: 0.395, countPct: 21.3, storagePct: 38.9, color: "#14532d" },
  { name: "이팝나무", count: 151, storage: 2.08, sequestration: 0.423, countPct: 12.4, storagePct: 24.1, color: "#166534" },
  { name: "느티나무", count: 139, storage: 1.31, sequestration: 0.130, countPct: 11.4, storagePct: 15.2, color: "#15803d" },
  { name: "왕벚나무", count: 110, storage: 0.54, sequestration: 0.160, countPct: 9.1, storagePct: 6.3, color: "#22c55e" },
  { name: "편백", count: 93, storage: 0.77, sequestration: 0.106, countPct: 7.7, storagePct: 8.9, color: "#4ade80" },
  { name: "기타 수종", count: 463, storage: 0.57, sequestration: 0.542, countPct: 38.1, storagePct: 6.6, color: "#94a3b8", desc: "갈참나무, 은행나무 등 총 16종" }
];

const CARBON_HOTSPOTS = [
  { id: 1, pos: [35.859, 129.213], type: "소나무 군락지", color: "#064e3b", size: 55, label: "상록 침엽수림: 탄소 저장 효율 매우 높음" },
  { id: 2, pos: [35.857, 129.214], type: "활엽수 완충숲", color: "#166534", size: 45, label: "낙엽 활엽수림: 대기 정화 및 격리 우수" },
  { id: 3, pos: [35.858, 129.212], type: "진입광장 경관숲", color: "#22c55e", size: 35, label: "경관 유도숲: 탄소 저장 보통" }
];

const POLLUTION_DATA = [
  { name: '오존', value: 162.4, color: '#3b82f6' },
  { name: '이산화질소', value: 38.7, color: '#60a5fa' },
  { name: '미세먼지', value: 11.2, color: '#93c5fd' },
  { name: '아황산가스', value: 10.5, color: '#bfdbfe' },
  { name: '일산화탄소', value: 4.1, color: '#dbeafe' }
];

const SCENARIO_DATA = {
  best: [{year:"현재",v:0.756},{year:"5년",v:3.07},{year:"10년",v:4.50},{year:"20년",v:7.26},{year:"30년",v:9.71}],
  base: [{year:"현재",v:0.756},{year:"5년",v:2.86},{year:"10년",v:3.93},{year:"20년",v:5.60},{year:"30년",v:6.84}],
  worst: [{year:"현재",v:0.756},{year:"5년",v:2.24},{year:"10년",v:2.47},{year:"20년",v:2.47},{year:"30년",v:2.12}]
};

/* ── 📍 행정구역 레이어 (파일 경로 수정) ── */
function BoundaryLayer() {
  const [gjData, setGjData] = useState(null);
  const [hsData, setHsData] = useState(null);
  useEffect(() => {
    fetch("./gyeongju.geojson").then(res => res.json()).then(data => setGjData(data)).catch(() => {});
    fetch("./hwangseong.geojson").then(res => res.json()).then(data => setHsData(data)).catch(() => {});
  }, []);
  return (
    <>
      {gjData && <GeoJSON data={gjData} style={{ color: "#64748b", weight: 2, fillColor: "transparent", dashArray: "10, 10" }} />}
      {hsData && <GeoJSON data={hsData} style={{ color: "#166534", weight: 3, fillColor: "#4ade80", fillOpacity: 0.1 }} />}
    </>
  );
}

/* ── 📊 수종 구성용 한글 툴팁 ── */
const CompositionTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: "#1e293b", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "12px", boxShadow: "0 10px 15px rgba(0,0,0,0.2)" }}>
        <p style={{ fontWeight: 800, color: data.color, marginBottom: 5 }}>{data.name}</p>
        <p>비중: {data.countPct}% ({data.count}주)</p>
        {data.desc && <p style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #475569", color: "#cbd5e1" }}>{data.desc}</p>}
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
  .menu-label:hover, .menu-label.active { color: var(--main); font-weight: 900; }
  .dropdown { position: absolute; top: 70px; right: 0; width: 200px; background: white; border: 1px solid #eee; border-radius: 0 0 12px 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); display: none; flex-direction: column; overflow: hidden; }
  .menu-item:hover .dropdown { display: flex; }
  .sub-btn { padding: 14px 20px; font-size: 13px; font-weight: 700; color: #64748b; text-align: left; border: none; background: none; cursor: pointer; }
  .sub-btn.active { color: var(--main); background: #f0fdf4; font-weight: 900; }
  .content { flex: 1; padding: 25px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
  .card { background: var(--glass); padding: 25px; border-radius: 20px; flex: 1; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
  .dashboard-grid { display: grid; grid-template-columns: 380px 1fr; gap: 20px; flex: 1; min-height: 0; }
  .rank-card { display: flex; align-items: center; gap: 15px; padding: 15px; background: white; border-radius: 12px; margin-bottom: 10px; border: 1px solid #f1f5f9; }
  .rank-num { width: 28px; height: 28px; background: var(--main); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; }
  .kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; }
  .kpi-box { background: white; padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #eee; }
  .leaflet-tooltip-own { background: #111827 !important; color: #fff !important; border: none !important; padding: 10px 14px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 13px !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5) !important; }
`;

export default function App() {
  const [page, setPage] = useState("OV");
  const [sub, setSub] = useState("summary");

  const handleNav = (p, s) => { setPage(p); setSub(s); };

  const scenarioConfig = {
    best: { color: "#10b981", label: "BEST CASE", icon: <Zap size={18}/> },
    base: { color: "#3b82f6", label: "BASE CASE", icon: <TrendingUp size={18}/> },
    worst: { color: "#ef4444", label: "WORST CASE", icon: <ShieldAlert size={18}/> }
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
              <button className={`sub-btn ${sub === "summary" ? "active" : ""}`} onClick={() => handleNav("OV", "summary")}>환경 데이터 요약</button>
              <button className={`sub-btn ${sub === "map" ? "active" : ""}`} onClick={() => handleNav("OV", "map")}>탄소 핫스팟 지도</button>
              <button className={`sub-btn ${sub === "dist" ? "active" : ""}`} onClick={() => handleNav("OV", "dist")}>수종 분포 분석</button>
            </div>
          </div>
          <div className="menu-item">
            <div className={`menu-label ${page === "RT" ? "active" : ""}`}>REAL-TIME DATA <ChevronDown size={14}/></div>
            <div className="dropdown">
              <button className={`sub-btn ${sub === "analysis" ? "active" : ""}`} onClick={() => handleNav("RT", "analysis")}>수종별 저장/격리량</button>
              <button className={`sub-btn ${sub === "eff" ? "active" : ""}`} onClick={() => handleNav("RT", "eff")}>식재 효율성 비교</button>
              <button className={`sub-btn ${sub === "diag" ? "active" : ""}`} onClick={() => handleNav("RT", "diag")}>AI 관리 진단</button>
            </div>
          </div>
          <div className="menu-item">
            <div className={`menu-label ${page === "PD" ? "active" : ""}`}>PREDICTION <ChevronDown size={14}/></div>
            <div className="dropdown">
              <button className={`sub-btn ${sub === "best" ? "active" : ""}`} onClick={() => handleNav("PD", "best")}>BEST 분석</button>
              <button className={`sub-btn ${sub === "base" ? "active" : ""}`} onClick={() => handleNav("PD", "base")}>BASE 분석</button>
              <button className={`sub-btn ${sub === "worst" ? "active" : ""}`} onClick={() => handleNav("PD", "worst")}>WORST 분석</button>
            </div>
          </div>
        </nav>
      </header>

      <main className="content">
        {page === "OV" && (
          <>
            {sub === "summary" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <h2 style={{color:'white', fontWeight:900, textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>환경 가치 요약 정보</h2>
                <div className="kpi-row">
                  {[{l:"총 수목 수",v:"1,214",u:"주",c:"#f0fdf4"},{l:"탄소 저장량",v:"8.63",u:"톤",c:"#f0f9ff"},{l:"연간 격리량",v:"1.756",u:"톤/년",c:"#fff7ed"},{l:"오염 제거량",v:"256.9",u:"lb/년",c:"#fdf2f8"},{l:"자산 가치",v:"89.1",u:"백만₩",c:"#f5f3ff"}].map((k,i)=>(
                    <div className="kpi-box" key={i} style={{backgroundColor:k.c}}>
                      <div style={{fontSize:12, fontWeight:800, color:'#64748b', marginBottom:10}}>{k.l}</div>
                      <div style={{fontSize:26, fontWeight:900}}>{k.v} <small style={{fontSize:14}}>{k.u}</small></div>
                    </div>
                  ))}
                </div>
                <div style={{display:'flex', gap:20, flex:1}}>
                  <div className="card" style={{flex:1.5}}>
                    <div style={{fontWeight:900, color:'var(--main)', marginBottom:15}}>대기 오염 물질 제거 현황 (lb/년)</div>
                    <ResponsiveContainer><BarChart data={POLLUTION_DATA}><XAxis dataKey="name" tick={{fontSize:12, fontWeight:700}}/><YAxis/><Tooltip/><Bar dataKey="value" name="제거량" radius={[5,5,0,0]}>{POLLUTION_DATA.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}</Bar></BarChart></ResponsiveContainer>
                  </div>
                  <div className="card" style={{flex:1, display:'flex', flexDirection:'column'}}>
                    <div style={{fontWeight:900, color:'var(--main)', marginBottom:20}}>주요 수종 탄소 저장 기여도 (%)</div>
                    <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly'}}>
                      {REAL_SPECIES_DATA.slice(0, 5).map((s, i) => (
                        <div key={i}>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:800}}><span>{s.name}</span><span>{s.storagePct}%</span></div>
                          <div style={{width:'100%', height:10, background:'#e2e8f0', borderRadius:5, marginTop:5, overflow:'hidden'}}><div style={{width:`${s.storagePct}%`, height:'100%', background:s.color}} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {sub === "map" && (
              <div className="card" style={{height:'100%', position: 'relative'}}>
                <div style={{position: 'absolute', top: 35, left: 35, zIndex: 1000, background: 'white', padding: '18px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: '1px solid #eee'}}>
                  <div style={{fontWeight: 900, color: 'var(--main)', marginBottom: 8, display:'flex', alignItems:'center', gap:5, fontSize: 16}}><TargetIcon size={18}/> 탄소 분석 시뮬레이션</div>
                  <div style={{fontSize: 12, color: '#64748b', lineHeight: 1.5}}>둥근 나무 아이콘에 마우스를 올리면<br/>구역별 상세 진단 결과가 나타납니다.</div>
                </div>
                <MapContainer center={[35.858, 129.213]} zoom={15} style={{height:'100%', borderRadius:12}}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <BoundaryLayer />
                  {CARBON_HOTSPOTS.map(spot => (
                    <Marker key={spot.id} position={spot.pos} icon={createTreeIcon(spot.color, spot.size)}>
                      <LeafletTooltip direction="top" offset={[0, -25]} opacity={1} className="leaflet-tooltip-own">
                        {spot.label}
                      </LeafletTooltip>
                      <Popup>
                        <div style={{padding: 5, minWidth: 150}}>
                          <strong style={{fontSize: 15, color: spot.color}}>{spot.type}</strong>
                          <p style={{marginTop: 8, fontSize: 13, lineHeight: 1.4, color: '#334155'}}>{spot.label}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {sub === "dist" && (
              <div className="dashboard-grid">
                <div className="card">
                  <div style={{fontWeight:900, color:'var(--main)', marginBottom:15}}>수목 점유 순위</div>
                  <div style={{overflowY:'auto', flex:1}}>
                    {REAL_SPECIES_DATA.map((s, i) => (
                      <div className="rank-card" key={i}><div className="rank-num">{i + 1}</div><div style={{flex:1}}><div style={{fontSize:15, fontWeight:800}}>{s.name}</div><div style={{fontSize:12, color:'#94a3b8'}}>{s.count} 주 식재됨</div></div><div style={{fontSize:17, fontWeight:900, color: s.color}}>{s.countPct}%</div></div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div style={{fontWeight:900, color:'var(--main)', marginBottom:15}}>전체 수종 구성 비중 (%)</div>
                  <ResponsiveContainer>
                    <BarChart data={REAL_SPECIES_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="name" tick={{fontSize:12, fontWeight:700}} axisLine={false} tickLine={false}/>
                      <YAxis hide/>
                      <Tooltip content={<CompositionTooltip />} cursor={{fill: '#f8fafc'}}/>
                      <Bar dataKey="countPct" name="비중" radius={[10,10,0,0]} barSize={45}>
                        {REAL_SPECIES_DATA.map((d,i)=><Cell key={i} fill={d.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {page === "RT" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <h2 style={{color:'white', fontWeight:900, textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>수종별 정밀 지표 및 관리 진단</h2>
            {sub === "analysis" && (
              <div className="card">
                <div style={{fontWeight:900, color:'var(--main)', marginBottom:20}}>수종별 총 저장량 및 연간 격리량 비교</div>
                <ResponsiveContainer><BarChart data={REAL_SPECIES_DATA}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:12, fontWeight:700}}/><YAxis/><Tooltip/><Legend/><Bar dataKey="storage" name="총 탄소 저장량 (톤)" fill="var(--main)"/><Bar dataKey="sequestration" name="연간 탄소 격리량 (톤/년)" fill="#3b82f6"/></BarChart></ResponsiveContainer>
              </div>
            )}
            {sub === "eff" && (
               <div className="card">
                 <div style={{fontWeight:900, color:'var(--main)', marginBottom:20}}>식재 수량 대비 탄소 기여 비중 분석</div>
                 <ResponsiveContainer><BarChart data={REAL_SPECIES_DATA}><XAxis dataKey="name" tick={{fontSize:12, fontWeight:700}}/><YAxis unit="%"/><Tooltip/><Legend/><Bar dataKey="countPct" name="전체 개체수 비중" fill="#cbd5e1"/><Bar dataKey="storagePct" name="탄소 기여도 비중" fill="var(--main)"/></BarChart></ResponsiveContainer>
               </div>
            )}
            {sub === "diag" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <div className="card" style={{ borderLeft: '12px solid #ef4444', justifyContent: 'center', height: '140px', flex: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ background: '#fee2e2', padding: 15, borderRadius: '50%' }}><BrainCircuit color="#ef4444" size={35}/></div>
                    <div><div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444' }}>AI 권고</div><div style={{ fontSize: 22, fontWeight: 900 }}>탄소 효율 극대화를 위해 느티나무 식재 확대가 필요합니다.</div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {page === "PD" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <h2 style={{color:'white', fontWeight:900, textShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>미래 예측: <span style={{color:scenarioConfig[sub].color}}>{scenarioConfig[sub].label}</span></h2>
            <div style={{display:'flex', gap:20, flex:1}}>
              <div className="card" style={{flex:1.5}}><ResponsiveContainer><AreaChart data={SCENARIO_DATA[sub]}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="year"/><YAxis domain={[0, 10]}/><Tooltip/><Area type="monotone" dataKey="v" stroke={scenarioConfig[sub].color} fill={scenarioConfig[sub].color} fillOpacity={0.15} strokeWidth={4}/></AreaChart></ResponsiveContainer></div>
              <div className="card" style={{flex:0.8, justifyContent:'center', textAlign:'center'}}>{scenarioConfig[sub].icon}<div style={{fontSize:16, color:'#64748b', marginTop:20}}>30년 후 예상 격리량</div><div style={{fontSize:48, fontWeight:900, color:scenarioConfig[sub].color}}>{SCENARIO_DATA[sub][4].v} <small style={{fontSize:22}}>톤/년</small></div></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}