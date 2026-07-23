import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, PieChart as PieChartIcon, Calendar, Clock, Zap } from 'lucide-react';
import { ICON_MAP } from './ManageCategoriesModal';

const AnalyticsDashboard = ({ user }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const FALLBACK_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.uid) return;
      setIsLoading(true);

      try {
        const q = query(collection(db, "sessions"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        const sessions = [];
        querySnapshot.forEach(doc => {
          sessions.push(doc.data());
        });

        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return { date: d.toISOString().split('T')[0], display: d.toLocaleDateString('en-US', { weekday: 'short' }), duration: 0 };
        }).reverse();

        const last84Days = [...Array(84)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return { date: d.toISOString().split('T')[0], displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), duration: 0, tasks: {} };
        }).reverse();

        const categoryMap = {};

        sessions.forEach(session => {
          if (!session.timestamp) return;
          const sessionDate = session.timestamp.toDate().toISOString().split('T')[0];
          const durationMins = session.duration / 60;
          const taskName = session.task || 'Unknown Node';

          const dayMatch = last7Days.find(d => d.date === sessionDate);
          if (dayMatch) dayMatch.duration += durationMins;

          const heatMatch = last84Days.find(d => d.date === sessionDate);
          if (heatMatch) {
            heatMatch.duration += durationMins;
            if (!heatMatch.tasks[taskName]) {
              heatMatch.tasks[taskName] = { duration: 0, color: session.taskColor || '#10b981', icon: session.taskIcon };
            }
            heatMatch.tasks[taskName].duration += durationMins;
          }

          if (!categoryMap[taskName]) {
            categoryMap[taskName] = { duration: 0, color: session.taskColor || null, icon: session.taskIcon || 'Activity' };
          }
          categoryMap[taskName].duration += durationMins;
          if (session.taskColor) categoryMap[taskName].color = session.taskColor;
          if (session.taskIcon) categoryMap[taskName].icon = session.taskIcon;
        });

        setWeeklyData(last7Days);
        setHeatmapData(last84Days);
        
        const todayStr = new Date().toISOString().split('T')[0];
        setSelectedDay(last84Days.find(d => d.date === todayStr) || last84Days[last84Days.length - 1]);

        const catArray = Object.keys(categoryMap).map((key, index) => ({
          name: key, value: Math.round(categoryMap[key].duration), color: categoryMap[key].color || FALLBACK_COLORS[index % FALLBACK_COLORS.length], icon: categoryMap[key].icon
        })).sort((a, b) => b.value - a.value);

        setCategoryData(catArray);

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user.uid]);

  const getHeatmapColor = (minutes) => {
    if (minutes === 0) return 'bg-[#030712] border-emerald-900/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]';
    if (minutes < 30) return 'bg-emerald-900/40 border-emerald-800/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]';
    if (minutes < 60) return 'bg-emerald-700/60 border-emerald-600/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]';
    if (minutes < 120) return 'bg-emerald-500/80 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)]';
    return 'bg-emerald-400 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7),inset_0_1px_2px_rgba(255,255,255,0.5)]';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#090a0f]/90 backdrop-blur-md border border-emerald-500/30 border-t-emerald-400/30 p-3 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col gap-1 z-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" style={{ backgroundColor: data.color || '#10b981' }}></div>
            <p className="text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider">{data.name || label}</p>
          </div>
          <p className="text-white font-mono text-sm pl-5 drop-shadow-md">
            {Math.round(payload[0].value)} minutes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-fade-in pb-10">
      
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between mb-2 px-2 border-b border-emerald-900/30 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-[#030712]/50 rounded-lg shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-emerald-900/30">
              <Zap className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-[0.2em] uppercase drop-shadow-lg">ANALYTICS CORE</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center font-mono text-emerald-600 animate-pulse text-sm tracking-widest">
          AGGREGATING TELEMETRY...
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
          
          {/* --- TOP ROW: Interactive Heatmap Matrix (Metallic Upgrade) --- */}
          <div className="bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] flex flex-col lg:flex-row gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
            <div className="absolute top-0 left-1/4 w-64 h-2 bg-emerald-500 blur-xl opacity-10" />
            
            <div className="flex-1 overflow-hidden relative z-10">
              <div className="flex items-center space-x-3 mb-4 border-b border-emerald-900/30 pb-3">
                <div className="p-1.5 bg-[#030712]/50 rounded border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                  <Calendar className="text-emerald-400 w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-widest font-mono drop-shadow-sm">Consistency Matrix (12 Weeks)</h2>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar pb-4">
                <div className="grid grid-rows-7 grid-flow-col gap-[6px] w-max p-1">
                  {heatmapData.map((day, i) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      title={`${day.displayDate}: ${Math.round(day.duration)} mins`}
                      className={`w-4 h-4 rounded-[3px] border cursor-pointer transition-all duration-200 hover:scale-125 hover:z-10 ${getHeatmapColor(day.duration)} ${selectedDay?.date === day.date ? 'ring-2 ring-emerald-300 ring-offset-2 ring-offset-[#090a0f] scale-110 z-10 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:w-80 bg-[#090a0f]/60 backdrop-blur-md border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 rounded-2xl p-5 flex flex-col shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.05)] relative z-10">
              <h3 className="text-[10px] text-emerald-600 font-mono tracking-widest uppercase mb-1">Target Date</h3>
              <p className="text-emerald-300 font-mono font-bold text-sm mb-4 border-b border-emerald-900/30 pb-3 drop-shadow-md">
                {selectedDay ? selectedDay.displayDate : 'SELECT A NODE'}
              </p>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {selectedDay && selectedDay.duration > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-100 font-mono text-xs mb-2 bg-[#030712]/50 p-2 rounded-lg border border-emerald-900/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                      <Clock className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                      <span className="uppercase tracking-widest">Total Output: <strong className="text-emerald-300 ml-1">{Math.round(selectedDay.duration)}m</strong></span>
                    </div>
                    {Object.entries(selectedDay.tasks).map(([taskName, data], idx) => {
                      const TaskIcon = ICON_MAP[data.icon] || Activity;
                      return (
                        <div key={idx} className="flex items-center justify-between bg-[#030712]/80 p-3 rounded-xl border border-emerald-900/40 hover:border-emerald-500/40 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                          <div className="flex items-center gap-3 truncate">
                            <div className="p-1.5 rounded-lg border border-emerald-900/30 bg-[#090a0f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] shrink-0" style={{ color: data.color }}>
                              <TaskIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs text-slate-200 font-mono uppercase truncate tracking-wider">{taskName}</span>
                          </div>
                          <span className="text-xs text-emerald-300 font-mono font-bold shrink-0 ml-2 drop-shadow-md">{Math.round(data.duration)}m</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-emerald-800/50">
                    <Activity className="w-8 h-8 drop-shadow-sm" />
                    <span className="text-[10px] font-mono uppercase text-center tracking-widest">No Telemetry<br/>Recorded</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- BOTTOM ROW: Analytical Charts (Metallic Upgrade) --- */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Bar Chart */}
            <div className="flex-[2] bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] flex flex-col relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
               
              <div className="flex items-center space-x-3 mb-6 border-b border-emerald-900/30 pb-4 relative z-10">
                <div className="p-1.5 bg-[#030712]/50 rounded border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                    <Activity className="text-emerald-400 w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-widest font-mono drop-shadow-sm">Volume Metrics (7 Days)</h2>
              </div>
              <div className="flex-1 min-h-[250px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="display" stroke="#047857" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                    <YAxis stroke="#047857" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                    <Bar dataKey="duration" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="flex-[1.5] bg-gradient-to-br from-[#1a1d24]/60 to-[#090a0f]/80 backdrop-blur-2xl border border-emerald-900/50 border-t-emerald-400/30 border-l-emerald-400/20 rounded-3xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] flex flex-col relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
              
              <div className="flex items-center space-x-3 mb-6 border-b border-emerald-900/30 pb-4 relative z-10">
                <div className="p-1.5 bg-[#030712]/50 rounded border border-emerald-900/30 shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]">
                  <PieChartIcon className="text-emerald-400 w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-emerald-300 uppercase tracking-widest font-mono drop-shadow-sm">Global Distribution</h2>
              </div>

              <div className="flex-1 min-h-[200px] w-full relative flex items-center justify-center z-10">
                {categoryData.length === 0 ? (
                  <span className="text-emerald-700 font-mono text-xs uppercase tracking-widest">NO DATA DETECTED</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                
                {categoryData.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center mt-2 bg-[#030712]/80 w-24 h-24 rounded-full flex flex-col items-center justify-center border border-emerald-900/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] backdrop-blur-md">
                      <div className="text-[9px] text-emerald-600 font-mono tracking-widest uppercase mb-0.5">TOTAL</div>
                      <div className="text-lg text-emerald-300 font-mono font-bold drop-shadow-md">
                        {categoryData.reduce((acc, curr) => acc + curr.value, 0)}m
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {categoryData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-900/30 flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto custom-scrollbar relative z-10">
                  {categoryData.map((entry, index) => {
                    const LegendIcon = ICON_MAP[entry.icon] || Activity;
                    return (
                      <div key={index} className="flex items-center gap-2 bg-[#090a0f]/80 border border-emerald-900/50 border-t-emerald-500/20 border-l-emerald-500/20 px-3 py-1.5 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-sm">
                        <LegendIcon className="w-3.5 h-3.5 drop-shadow-sm" style={{ color: entry.color }} />
                        <span className="text-[9px] font-mono text-emerald-100 uppercase tracking-wider">{entry.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;