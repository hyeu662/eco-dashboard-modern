import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Tooltip as LeafletTooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";
import { ChevronDown, Zap, TrendingUp, ShieldAlert, BrainCircuit, Target as TargetIcon } from "lucide-react";

/* ── Leaflet 아이콘 설정 ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ── 🌳 둥근 나무 모양 커스텀 아이콘 ── */
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

/* ── 데이터 세팅 ── */
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

/* ── 📍 레이어 컴포넌트 (강력한 시각화 로직) ── */
function BoundaryLayer() {
  const [gjData, setGjData] = useState(null);
  const [hsData, setHsData] = useState(null);
  const [parkData, setParkData] = useState(null);

  useEffect(() => {
    const loadLayer = (url, setter) => {
      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error("File not found");
          return res.json();
        })
        .then(data => setter(data))
        .catch(err => console.warn(url + " 로드 실패:", err));
    };

    loadLayer("/gyeongju.geojson", setGjData);
    loadLayer("/hwangseong.geojson", setHsData);
    loadLayer("/hwang-park.geojson", setParkData);
  }, []);

  return (
    <>
      {/* 경주시: 진한 회색 점선으로 가독성 확보 */}
      {gjData && <GeoJSON data={gjData} style={{ color: "#475569", weight: 2, fillOpacity: 0, dashArray: "10, 10" }} />}
      {/* 황성동: 보라색 실선으로 구역 구분 */}
      {hsData && <GeoJSON data={hsData} style={{ color: "#6366f1", weight: 3, fillOpacity: 0 }} />}
      {/* 황성공원: 사용자가 직접 딴 정밀 구역 (가장 강조) */}
      {parkData && <GeoJSON data={parkData} style={{ color: "#064e3b", weight: 5, fillColor: "#22c55e", fillOpacity: 0.25 }} />}
    </>
  );
}

const CompositionTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: "#1e293b", color: "#fff", padding: "12px", borderRadius: "8px", fontSize: "12px" }}>
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
  .menu-label.active { color: var(--main); font-weight: 900; }
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
    {/* 📍 오른쪽 상단 안내 박스 (하단 문구 삭제 버전) */}
    <div style={{
      position: 'absolute', 
      top: 30, 
      right: 30, 
      zIndex: 1000, 
      background: 'rgba(255, 255, 255, 0.92)', 
      padding: '22px', 
      borderRadius: '16px', 
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)', 
      border: '1px solid rgba(255,255,255,0.4)', 
      backdropFilter: 'blur(10px)',
      minWidth: '240px'
    }}>
      <div style={{fontWeight: 900, color: 'var(--main)', marginBottom: 15, display:'flex', alignItems:'center', gap:8, fontSize: 16, borderBottom: '2px solid #f1f5f9', paddingBottom: '10px'}}>
        <TargetIcon size={20}/> 탄소 분석 레이어 가이드
      </div>
      
      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
        {/* 아이콘 색상 설명 */}
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{width: 14, height: 14, borderRadius: '50%', background: '#064e3b', border: '2px solid white', boxShadow: '0 0 0 1px #064e3b'}}></div>
          <div style={{fontSize: 13, fontWeight: 700, color: '#1e293b'}}>고효율 탄소 저장소 (소나무)</div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '2px solid white', boxShadow: '0 0 0 1px #22c55e'}}></div>
          <div style={{fontSize: 13, fontWeight: 700, color: '#1e293b'}}>일반 탄소 흡수원 (활엽수)</div>
        </div>

        {/* 경계선 설명 */}
        <div style={{marginTop: 8, paddingTop: 12, borderTop: '1px solid #f1f5f9'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6}}>
            <div style={{width: 20, height: 3, background: '#064e3b'}}></div>
            <div style={{fontSize: 12, color: '#475569'}}><b>공원 경계:</b> 정밀 사업 구역</div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6}}>
            <div style={{width: 20, height: 3, background: '#6366f1'}}></div>
            <div style={{fontSize: 12, color: '#475569'}}><b>행정 경계:</b> 황성동 라인</div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div style={{width: 20, height: 2, background: '#475569', borderBottom: '2px dashed #475569'}}></div>
            <div style={{fontSize: 12, color: '#475569'}}><b>광역 경계:</b> 경주시 라인</div>
          </div>
        </div>
      </div>
    </div>

    <MapContainer center={[35.858, 129.213]} zoom={15.5} style={{height:'100%', borderRadius:12}}>
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

        {/* ── 수종별 분석 (RT > analysis) 수정 코드 ── */}
{page === "RT" && sub === "analysis" && (
  <div className="card" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ fontWeight: 900, color: 'var(--main)', marginBottom: 20 }}>수종별 총 저장량 및 연간 격리량 비교</div>
    <div style={{ flex: 1, width: '100%', minHeight: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={REAL_SPECIES_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} interval={0} />
          <YAxis />
          <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}}/>
          <Legend verticalAlign="top" align="right" iconType="circle" height={36}/>
          <Bar dataKey="storage" name="총 탄소 저장량 (톤)" fill="var(--main)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="sequestration" name="연간 탄소 격리량 (톤/년)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

{/* ── 식재 효율성 비교 (RT > eff) 수정 코드 ── */}
{page === "RT" && sub === "eff" && (
  <div className="card" style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ fontWeight: 900, color: 'var(--main)', marginBottom: 20 }}>식재 수량 대비 탄소 기여 비중 분석</div>
    <div style={{ flex: 1, width: '100%', minHeight: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={REAL_SPECIES_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} interval={0} />
          <YAxis unit="%" />
          <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}}/>
          <Legend verticalAlign="top" align="right" iconType="circle" height={36}/>
          <Bar dataKey="countPct" name="전체 개체수 비중 (%)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="storagePct" name="탄소 기여도 비중 (%)" fill="var(--main)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

        {/* ── REAL-TIME: AI 관리 진단 (게이지+액션플랜 최적화) ── */}
{page === "RT" && sub === "diag" && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, color: 'white' }}>
    {/* 윗줄: AI 메인 진단 박스 */}
    <div className="card" style={{ borderLeft: '12px solid #ef4444', background: 'rgba(255,255,255,0.95)', flex: 'none', height: '110px', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ background: '#fee2e2', padding: 12, borderRadius: '50%' }}><BrainCircuit color="#ef4444" size={35} /></div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>AI CORE DIAGNOSIS</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b' }}>"생태 회복력 강화를 위한 느티나무 식재 확대 권고"</div>
        </div>
      </div>
    </div>

    {/* 중간줄: 점수 게이지 및 액션 플랜 (공간 최적화) */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px', flex: 1 }}>
      {/* 생태 건강성 점수 */}
      <div className="card" style={{ textAlign: 'center', justifyContent: 'center' }}>
        <div style={{ fontWeight: 900, color: 'var(--main)', marginBottom: 15, fontSize: 18 }}>종합 생태 건강 점수 (FHI)</div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <div style={{ width: 220, height: 220, borderRadius: '50%', border: '15px solid #e2e8f0', borderTopColor: '#10b981', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#1e293b' }}>82</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>우수</div>
            </div>
          </div>
        </div>
      </div>

      {/* 실행 계획 (꽉 채운 레이아웃) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 900, color: 'var(--main)', marginBottom: 20, fontSize: 18 }}>🌱 단계별 실행 계획 (Action Plan)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, justifyContent: 'space-between' }}>
          <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', borderLeft: '6px solid #3b82f6', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3b82f6' }}>STEP 1. 부지 정비</div>
            <div style={{ fontSize: 16, color: '#334155', marginTop: 8 }}>공원 내 북측 유휴지 토양 개량 및 식재 기반 조성</div>
          </div>
          <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '15px', borderLeft: '6px solid #10b981', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981' }}>STEP 2. 느티나무 보강</div>
            <div style={{ fontSize: 16, color: '#334155', marginTop: 8 }}>탄소 흡수량이 우수한 느티나무 성목 50주 추가 식재</div>
          </div>
          <div style={{ padding: '25px', background: 'var(--main)', borderRadius: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 0.8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, opacity: 0.9 }}>현재 격리량</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>1.756 <small>t/y</small></div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 300 }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, opacity: 0.9 }}>개선 후 예측</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>2.250 <small>t/y</small></div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: 18, fontWeight: 900 }}>+28%</div>
          </div>
        </div>
      </div>
    </div>

    {/* 하단: 실시간 분석 로그 */}
    <div style={{ background: 'rgba(0,0,0,0.7)', padding: '12px 25px', borderRadius: '30px', overflow: 'hidden', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'inline-block', animation: 'marquee 25s linear infinite', fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: '#4ade80' }}>[SYSTEM]</span> 황성공원 정밀 스캔 중... 소나무 광합성 효율 분석 완료... <span style={{ color: '#60a5fa', marginLeft: 40 }}>[ANALYSIS]</span> 활엽수 비중 보강 권고... <span style={{ color: '#fbbf24', marginLeft: 40 }}>[LOG]</span> 수목 건강성 지표 82% 도출...
      </div>
    </div>
    <style>{`@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
  </div>
)}

        {/* ── PREDICTION (미래 예측) 섹션: 가독성 및 태그 오류 완벽 교정 ── */}
        {page === "PD" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            <h2 style={{ color: 'white', fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              미래 예측: <span style={{ color: scenarioConfig[sub].color }}>{scenarioConfig[sub].label}</span>
            </h2>
            
            <div style={{ display: 'flex', gap: 20, flex: 1 }}>
              {/* 왼쪽: 예측 그래프 카드 (숫자 겹침 해결 및 여백 최적화) */}
              <div className="card" style={{ flex: 1.5, display: 'flex', flexDirection: 'column', padding: '25px 30px 20px 20px' }}>
                <div style={{ fontWeight: 900, color: 'var(--main)', marginBottom: 20 }}>
                  연도별 누적 탄소 격리량 시뮬레이션 (t/y)
                </div>
                <div style={{ flex: 1, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={SCENARIO_DATA[sub]} 
                      margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} 
                        axisLine={false} 
                        tickLine={false}
                        dy={10} 
                      />
                      <YAxis 
                        domain={[0, 10]} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                        axisLine={false} 
                        tickLine={false}
                        width={40} // 숫자가 표시될 충분한 공간 확보
                        dx={-5} // 숫자와 그래프 간격 미세 조정
                      />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="v" 
                        stroke={scenarioConfig[sub].color} 
                        fill={scenarioConfig[sub].color} 
                        fillOpacity={0.2} 
                        strokeWidth={4} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 오른쪽: 데이터 요약 리포트 */}
              <div className="card" style={{ flex: 0.8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '30px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: scenarioConfig[sub].color, marginBottom: 15 }}>
                    {React.cloneElement(scenarioConfig[sub].icon, { size: 54 })}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b' }}>{scenarioConfig[sub].label} 분석 리포트</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 5 }}>AI 엔진 미래 시뮬레이션</div>
                </div>

                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                  <div style={{ marginBottom: 15 }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>최종 목표 연도</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#1e293b' }}>식재 후 30년 경과 시점</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: '#64748b' }}>탄소 격리 효율 변화</span>
                        <span style={{ fontWeight: 800, color: scenarioConfig[sub].color }}>
                          +{((SCENARIO_DATA[sub][4].v / SCENARIO_DATA[sub][0].v) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${Math.min((SCENARIO_DATA[sub][4].v / 10) * 100, 100)}%`, 
                            height: '100%', 
                            background: scenarioConfig[sub].color 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  <div style={{ fontSize: 14, color: '#64748b', fontWeight: 700, marginBottom: 8 }}>30년 후 예상 연간 격리량</div>
                  <div style={{ fontSize: 52, fontWeight: 900, color: scenarioConfig[sub].color, letterSpacing: '-1px' }}>
                    {SCENARIO_DATA[sub][4].v} 
                    <small style={{ fontSize: 20, color: '#1e293b', marginLeft: 5 }}>t/y</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}