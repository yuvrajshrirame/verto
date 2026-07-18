import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import PlayerStats from './PlayerStats';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, PieChart as PieChartIcon } from 'lucide-react';
import { ICON_MAP } from './ManageCategoriesModal';

const AnalyticsDashboard = ({ user }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback palette if older sessions don't have taskColor saved
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

        // --- 1. Process Weekly Data (Last 7 Days) ---
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return {
            date: d.toISOString().split('T')[0],
            display: d.toLocaleDateString('en-US', { weekday: 'short' }),
            duration: 0
          };
        }).reverse();

        sessions.forEach(session => {
          if (!session.timestamp) return;
          const sessionDate = session.timestamp.toDate().toISOString().split('T')[0];
          const dayMatch = last7Days.find(d => d.date === sessionDate);
          if (dayMatch) {
            dayMatch.duration += (session.duration / 60); 
          }
        });
        setWeeklyData(last7Days);

        // --- 2. Process Category Distribution (With Colors & Icons) ---
        const categoryMap = {};
        sessions.forEach(session => {
          const taskName = session.task || 'Unknown';
          if (!categoryMap[taskName]) {
            categoryMap[taskName] = {
              duration: 0,
              color: session.taskColor || null,
              icon: session.taskIcon || 'Activity'
            };
          }
          categoryMap[taskName].duration += (session.duration / 60);
          // If we found a color on a newer session, overwrite the null fallback
          if (session.taskColor) categoryMap[taskName].color = session.taskColor;
          if (session.taskIcon) categoryMap[taskName].icon = session.taskIcon;
        });

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


  // Custom Tooltip for Recharts to match Void Black aesthetic
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#030712]/95 border border-emerald-500/30 p-3 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-blur-md flex flex-col gap-1">
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
      
      {/* Top Section: The existing Player Profile XP component */}
      <div className="w-full max-w-3xl mx-auto mb-4">
        <PlayerStats uid={user.uid} />
      </div>

      <div className="w-full max-w-6xl mx-auto flex items-center justify-center mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-[0.2em] uppercase">ANALYTICS</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center font-mono text-emerald-700 animate-pulse text-sm">
          AGGREGATING TELEMETRY...
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-6 w-full max-w-6xl mx-auto">
          
          {/* Panel 1: Activity Bar Chart */}
          <div className="flex-[2] bg-[#030712]/80 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
            <div className="flex items-center space-x-2 mb-6 border-b border-emerald-900/30 pb-4">
              <Activity className="text-emerald-400 w-5 h-5" />
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest font-mono">Activity Flow</h2>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="display" stroke="#047857" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                  <YAxis stroke="#047857" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} />
                  {/* Subtle hover effect built into Recharts Bar */}
                  <Bar dataKey="duration" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Panel 2: Category Pie Chart */}
          <div className="flex-[1] bg-[#030712]/80 backdrop-blur-md border border-emerald-900/30 rounded-2xl p-6 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
            <div className="flex items-center space-x-2 mb-6 border-b border-emerald-900/30 pb-4">
              <PieChartIcon className="text-emerald-400 w-5 h-5" />
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest font-mono">Distribution</h2>
            </div>

            <div className="flex-1 min-h-[300px] w-full relative flex items-center justify-center">
              {categoryData.length === 0 ? (
                <span className="text-emerald-700 font-mono text-xs">NO DATA DETECTED</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              
              {/* Center decorative element */}
              {categoryData.length > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-[9px] text-emerald-700 font-mono tracking-widest uppercase mb-0.5">TOTAL</div>
                    <div className="text-xl text-emerald-400 font-mono font-bold">
                      {categoryData.reduce((acc, curr) => acc + curr.value, 0)}m
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Custom Dynamic Legend */}
            {categoryData.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {categoryData.map((entry, index) => {
                  const LegendIcon = ICON_MAP[entry.icon] || Activity;
                  return (
                    <div key={index} className="flex items-center gap-1.5 bg-[#090a0f] border border-emerald-900/40 px-2.5 py-1.5 rounded-lg">
                      <LegendIcon className="w-3 h-3" style={{ color: entry.color }} />
                      <span className="text-[10px] font-mono text-emerald-100 uppercase tracking-wider">{entry.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;