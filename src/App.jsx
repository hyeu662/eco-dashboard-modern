import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TreeDeciduous, Leaf, Wind, Activity, LayoutDashboard, Database, Zap } from 'lucide-react';

const monthlyData = [
  { name: '1월', value: 400, index: 65 }, { name: '3월', value: 600, index: 72 },
  { name: '5월', value: 500, index: 78 }, { name: '7월', value: 900, index: 85 },
  { name: '9월', value: 750, index: 82 }, { name: '11월', value: 850, index: 90 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');

  const TabButton = ({ name, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
        activeTab === name 
        ? 'bg-[#588157] text-white shadow-lg scale-105' 
        : 'bg-white/50 text-[#1A2421] hover:bg-white/80 backdrop-blur-sm'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div 
      className="min-h-screen p-8 font-sans relative overflow-hidden text-[#1A2421]" 
      style={{ 
        backgroundImage: `url('/forest.png')`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat' 
      }}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header - [탄소 저감 모니터링] 삭제 */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-10 bg-[#588157] rounded-full"></div>
            <h1 className="text-4xl font-black tracking-tight leading-none">Carbon Reduction Monitoring</h1>
          </div>
          {/* Nav - (개요), (실시간 데이터), (예측 분석) 삭제 */}
          <nav className="flex gap-3">
            <TabButton name="Overview" icon={LayoutDashboard} label="Overview" />
            <TabButton name="Real-time" icon={Database} label="Real-time Data" />
            <TabButton name="Prediction" icon={Activity} label="Prediction" />
          </nav>
        </header>

        <main>
          {/* 1. Overview 탭 (카드 내 한국어 유지) */}
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
              <div className="lg:col-span-4 grid grid-cols-1 gap-4">
                {/* 수목 면적 */}
                <div className="bg-white/80 p-5 rounded-3xl shadow-lg border border-white flex items-center gap-5 backdrop-blur-md">
                  <div className="p-3 bg-[#588157]/10 rounded-2xl"><TreeDeciduous className="text-[#588157]" size={28} /></div>
                  <div>
                    <div className="text-xs font-bold text-[#588157] opacity-70 uppercase">Forest Area <span className="text-[10px] font-normal">(수목 면적)</span></div>
                    <div className="text-2xl font-black">1,240 ha</div>
                  </div>
                </div>
                {/* 탄소 저장량 */}
                <div className="bg-[#588157] p-5 rounded-3xl shadow-lg text-white flex items-center gap-5">
                  <div className="p-3 bg-white/20 rounded-2xl"><Leaf className="text-white" size={28} /></div>
                  <div>
                    <div className="text-xs font-bold opacity-70 uppercase">Carbon Saved <span className="text-[10px] font-normal text-white/80">(탄소 저장량)</span></div>
                    <div className="text-2xl font-black">850 T</div>
                  </div>
                </div>
                {/* 미세먼지 저감 */}
                <div className="bg-white/80 p-5 rounded-3xl shadow-lg border border-white flex items-center gap-5 backdrop-blur-md">
                  <div className="p-3 bg-[#588157]/10 rounded-2xl"><Wind className="text-[#588157]" size={28} /></div>
                  <div>
                    <div className="text-xs font-bold text-[#588157] opacity-70 uppercase">Dust Reduction <span className="text-[10px] font-normal">(미세먼지 저감)</span></div>
                    <div className="text-2xl font-black">1.2 T/Y</div>
                  </div>
                </div>
                {/* 에너지 가치 */}
                <div className="bg-[#588157] p-5 rounded-3xl shadow-lg text-white flex items-center gap-5">
                  <div className="p-3 bg-white/20 rounded-2xl"><Zap className="text-white" size={28} /></div>
                  <div>
                    <div className="text-xs font-bold opacity-70 uppercase">Energy Value <span className="text-[10px] font-normal text-white/80">(에너지 가치)</span></div>
                    <div className="text-2xl font-black">$6.5 M</div>
                  </div>
                </div>
              </div>

              {/* 오른쪽 메인 그래프 */}
              <div className="lg:col-span-8 bg-white/60 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-lg border border-white/50 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Environmental Index <span className="text-sm font-normal text-[#588157] ml-2">(종합 환경 지수)</span></h3>
                    <p className="text-xs text-[#588157] font-bold">Monthly efficiency tracking (월별 효율 추적)</p>
                  </div>
                  <div className="bg-white/80 px-4 py-1.5 rounded-xl shadow-sm border border-[#588157]/10 text-xs font-bold text-[#588157]">Growth: +12.5%</div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <AreaChart data={monthlyData}><defs><linearGradient id="colorOverview" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#588157" stopOpacity={0.3}/><stop offset="95%" stopColor="#588157" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#588157" strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#588157', fontSize: 12}} />
                    <YAxis hide /><Tooltip contentStyle={{borderRadius: '20px', border: 'none'}} />
                    <Area type="monotone" dataKey="index" stroke="#588157" strokeWidth={4} fill="url(#colorOverview)" /></AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 2. Real-time Data 탭 */}
          {activeTab === 'Real-time' && (
            <div className="bg-white/80 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md border border-white animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Database className="text-[#588157]" /> Live Sensor Stream <span className="text-lg font-normal text-[#588157]">(실시간 센서 데이터)</span>
              </h2>
              <div className="h-96 w-full text-[#1A2421]">
                <ResponsiveContainer>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE0CF" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '15px', border: 'none'}} />
                    <Bar dataKey="value" fill="#588157" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 3. Prediction 탭 */}
          {activeTab === 'Prediction' && (
            <div className="bg-[#1A2421]/90 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-md text-white animate-in zoom-in duration-500">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#A3B18A]">
                <Activity size={24} /> 2026 Forecast Model <span className="text-lg font-normal text-[#A3B18A]/80">(2026 예측 모델)</span>
              </h2>
              <div className="h-96 w-full">
                <ResponsiveContainer>
                  <AreaChart data={monthlyData}>
                    <defs><linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#A3B18A" stopOpacity={0.8}/><stop offset="95%" stopColor="#A3B18A" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="name" stroke="#A3B18A" /><YAxis stroke="#A3B18A" />
                    <Tooltip contentStyle={{backgroundColor: '#1A2421', border: '1px solid #2D3A35'}} />
                    <Area type="monotone" dataKey="value" stroke="#A3B18A" fill="url(#predGrad)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}