import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, subDays, eachDayOfInterval, startOfWeek } from 'date-fns';

const Analytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/analytics');
        setData(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;
  if (!data || data.error) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>No data available.</div>;

  // Generate heatmap grid (last 365 days)
  const today = new Date();
  const startDate = subDays(today, 364);
  const days = eachDayOfInterval({ start: startDate, end: today });
  
  const heatmapMap = new Map(data.heatmapData.map((d: any) => [d.date, d.count]));

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '2rem' }}>Advanced Analytics</h1>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Trading Activity (Last 365 Days)</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* We simplify the calendar just by stacking weeks into columns for simplicity of rendering */}
          {Array.from({ length: 52 }).map((_, weekIndex) => (
            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayOffset = weekIndex * 7 + dayIndex;
                if (dayOffset >= days.length) return null;
                const currentDate = days[dayOffset];
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const count = heatmapMap.get(dateStr) || 0;
                
                return (
                  <div
                    key={dateStr}
                    className="heatmap-cell"
                    data-level={getLevel(count)}
                    title={`${dateStr}: ${count} trades`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Less 
          <div className="heatmap-cell" data-level="0" style={{ backgroundColor: 'var(--bg-hover)' }}></div>
          <div className="heatmap-cell" data-level="1"></div>
          <div className="heatmap-cell" data-level="2"></div>
          <div className="heatmap-cell" data-level="3"></div>
          <div className="heatmap-cell" data-level="4"></div>
          More
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
         <div className="glass-panel" style={{ padding: '2rem' }}>
           <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Performance Highlights</h3>
           <ul style={{ listStyle: 'none', padding: 0 }}>
             <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
               <span>Best Trade</span>
               <span style={{ color: 'var(--success)', fontWeight: 600 }}>${data.bestTrade.toFixed(2)}</span>
             </li>
             <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
               <span>Worst Trade</span>
               <span style={{ color: 'var(--danger)', fontWeight: 600 }}>${data.worstTrade.toFixed(2)}</span>
             </li>
             <li style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
               <span>Average Duration (min)</span>
               <span style={{ fontWeight: 600 }}>{(data.averageTradeDuration / 60).toFixed(2)}</span>
             </li>
           </ul>
         </div>
      </div>
    </div>
  );
};

export default Analytics;
