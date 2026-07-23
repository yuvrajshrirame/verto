import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, PieChart as PieChartIcon, Calendar, Clock, Zap } from 'lucide-react';

// Assuming ICON_MAP is exported from your categories modal
import { ICON_MAP } from './ManageCategoriesModal';

const AnalyticsDashboard = ({ user }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback colors for categories without a saved color
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

        // 1. Process Weekly Bar Chart (Last 7 Days)
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return {
            date: d.toISOString().split('T')[0],
            display: d.toLocaleDateString('en-US', { weekday: 'short' }),
            duration: 0
          };
        }).reverse();

        // 2. Process Heatmap (Last 84 Days / 12 Weeks)
        const last84Days = [...Array(84)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return {
            date: d.toISOString().split('T')[0],
            displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            duration: 0,
            tasks: {}
          };
        }).reverse();

        // 3. Aggregate Data
        const categoryMap = {};

        sessions.forEach(session => {
          if (!session.timestamp) return;
          const sessionDate = session.timestamp.toDate().toISOString().split('T')[0];
          const durationMins = session.duration / 60;
          const taskName = session.task || 'Unknown Node';

          // Weekly Chart Aggregation
          const dayMatch = last7Days.find(d => d.date === sessionDate);
          if (dayMatch) dayMatch.duration += durationMins;

          // Heatmap Aggregation
          const heatMatch = last84Days.find(d => d.date === sessionDate);
          if (heatMatch) {
            heatMatch.duration += durationMins;
            if (!heatMatch.tasks[taskName]) {
              heatMatch.tasks[taskName] = { duration: 0, color: session.taskColor || '#10b981', icon: session.taskIcon };
            }
            heatMatch.tasks[taskName].duration += durationMins;
          }

          // Category Pie Chart Aggregation
          if (!categoryMap[taskName]) {
            categoryMap[taskName] = {
              duration: 0,
              color: session.taskColor || null,
              icon: session.taskIcon || 'Activity'
            };
          }
          categoryMap[taskName].duration += durationMins;
          if (session.taskColor) categoryMap[taskName].color = session.taskColor;
          if (session.taskIcon) categoryMap[taskName].icon = session.taskIcon;
        });

        setWeeklyData(last7Days);
        setHeatmapData(last84Days);
        
        // Auto-select today on the heatmap
        const todayStr = new Date().toISOString().split('T')[0];
        setSelectedDay(last84Days.find(d => d.date === todayStr) || last84Days[last84Days.length - 1]);

        // Format pie chart data
        const catArray = Object.keys(categoryMap).map((key, index) => ({
          name: key,
          value: Math.round(categoryMap[key].duration),
          color: categoryMap[key].color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
          icon: categoryMap[key].icon
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

  // Heatmap intensity calculator
  const getHeatmapColor = (minutes) => {
    if (minutes === 0) return 'bg-[#0f1117] border-emerald-900/30';
    if (minutes < 30) return 'bg-emerald-900/40 border-emerald-800/50';
    if (minutes < 60) return 'bg-emerald-700/60 border-emerald-600/50';
    if (minutes < 120) return 'bg-emerald-500/80 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    return 'bg-emerald-400 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.6)]';
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#030712]/95 border border-emerald-500/30 p-3 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.2)] backdrop-blur-md flex flex-col gap-1 z-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color || '#10b981' }}></div>
            <p className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">{data.name || label}</p>
          </div>
          <p className="text-emerald-100 font-mono text-sm pl-5">
            {Math.round(payload[0].value)} minutes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col gap-6 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between mb-2 px-2 border-b border-emerald-900/30 pb-4">
        <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-emerald-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-[0.2em] uppercase">ANALYTICS CORE</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center font-mono text-emerald-700 animate-pulse text-sm tracking-widest">
          AGGREGATING TELEMETRY...
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
          
          {/* --- TOP ROW: Interactive Heatmap Matrix --- */}
          <div className="bg-[#030712]/80 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl flex flex-col lg:flex-row gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-transparent to-transparent"></div>
            
            {/* Heatmap Grid */}
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center space-x-2 mb-4 border-b border-emerald-900/30 pb-3">
                <Calendar className="text-emerald-400 w-4 h-4" />
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Consistency Matrix (12 Weeks)</h2>
              </div>
              
              <div className="overflow-x-auto custom-scrollbar pb-4">
                <div className="grid grid-rows-7 grid-flow-col gap-[6px] w-max">
                  {heatmapData.map((day, i) => (
                    <div 
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      title={`${day.displayDate}: ${Math.round(day.duration)} mins`}
                      className={`w-4 h-4 rounded-[3px] border cursor-pointer transition-all duration-200 hover:scale-125 hover:z-10 ${getHeatmapColor(day.duration)} ${selectedDay?.date === day.date ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#030712]' : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Day Details Panel */}
            <div className="lg:w-80 bg-[#090a0f] border border-emerald-900/40 rounded-xl p-5 flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <h3 className="text-[10px] text-emerald-700 font-mono tracking-widest uppercase mb-1">Target Date</h3>
              <p className="text-emerald-400 font-mono font-bold text-sm mb-4 border-b border-emerald-900/30 pb-3">
                {selectedDay ? selectedDay.displayDate : 'SELECT A NODE'}
              </p>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {selectedDay && selectedDay.duration > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-100 font-mono text-xs mb-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span className="uppercase tracking-widest">Total Output: <strong className="text-emerald-400">{Math.round(selectedDay.duration)}m</strong></span>
                    </div>
                    {Object.entries(selectedDay.tasks).map(([taskName, data], idx) => {
                      const TaskIcon = ICON_MAP[data.icon] || Activity;
                      return (
                        <div key={idx} className="flex items-center justify-between bg-[#030712] p-3 rounded-lg border border-emerald-900/30 hover:border-emerald-700/50 transition-colors">
                          <div className="flex items-center gap-3 truncate">
                            <div className="p-1.5 rounded-md bg-[#0f1117] shrink-0" style={{ color: data.color }}>
                              <TaskIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs text-slate-300 font-mono uppercase truncate tracking-wider">{taskName}</span>
                          </div>
                          <span className="text-xs text-emerald-400 font-mono font-bold shrink-0 ml-2">{Math.round(data.duration)}m</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-emerald-800/50">
                    <Activity className="w-8 h-8" />
                    <span className="text-[10px] font-mono uppercase text-center tracking-widest">No Telemetry<br/>Recorded</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- BOTTOM ROW: Analytical Charts --- */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Area/Bar Chart - Weekly Volume */}
            <div className="flex-[2] bg-[#030712]/80 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl flex flex-col relative overflow-hidden">
              <div className="flex items-center space-x-2 mb-6 border-b border-emerald-900/30 pb-4">
                <Activity className="text-emerald-400 w-4 h-4" />
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Volume Metrics (7 Days)</h2>
              </div>
              <div className="flex-1 min-h-[250px] w-full">
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

            {/* Pie Chart - Task Distribution */}
            <div className="flex-[1.5] bg-[#030712]/80 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl flex flex-col relative overflow-hidden">
              <div className="flex items-center space-x-2 mb-6 border-b border-emerald-900/30 pb-4">
                <PieChartIcon className="text-emerald-400 w-4 h-4" />
                <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Global Distribution</h2>
              </div>

              <div className="flex-1 min-h-[200px] w-full relative flex items-center justify-center">
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
                
                {/* Center Total Overlay */}
                {categoryData.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center mt-2">
                      <div className="text-[9px] text-emerald-700 font-mono tracking-widest uppercase mb-0.5">TOTAL</div>
                      <div className="text-lg text-emerald-400 font-mono font-bold">
                        {categoryData.reduce((acc, curr) => acc + curr.value, 0)}m
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dynamic Legend */}
              {categoryData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-emerald-900/30 flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                  {categoryData.map((entry, index) => {
                    const LegendIcon = ICON_MAP[entry.icon] || Activity;
                    return (
                      <div key={index} className="flex items-center gap-1.5 bg-[#090a0f] border border-emerald-900/50 px-2 py-1.5 rounded-lg shadow-sm">
                        <LegendIcon className="w-3 h-3" style={{ color: entry.color }} />
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