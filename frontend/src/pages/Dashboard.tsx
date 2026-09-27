import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, prefix = '', suffix = '', isCurrency = false, isDanger = false, isSuccess = false }: any) => {
  let color = 'var(--text-main)';
  if (isSuccess || (isCurrency && value > 0)) color = 'var(--success)';
  if (isDanger || (isCurrency && value < 0)) color = 'var(--danger)';

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>{title}</h3>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>
        {prefix}{value}{suffix}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/analytics');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Loading...</div>;
  if (!data || data.error) return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>No trade data available yet. Please add a trade.</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Dashboard</h1>
        <Link to="/add-trade" className="btn btn-primary">+ Add Trade</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Trades" value={data.totalTrades} />
        <StatCard title="Win Rate" value={data.winRate.toFixed(2)} suffix="%" />
        <StatCard title="Net P&L" value={data.netPnl.toFixed(2)} prefix="$" isCurrency={true} />
        <StatCard title="Profit Factor" value={data.profitFactor === null ? 'N/A' : data.profitFactor.toFixed(2)} />
        <StatCard title="Winning Trades" value={data.winningTrades} isSuccess={true} />
        <StatCard title="Losing Trades" value={data.losingTrades} isDanger={true} />
        <StatCard title="Average Profit" value={data.averageProfit.toFixed(2)} prefix="$" isSuccess={true} />
        <StatCard title="Average Loss" value={data.averageLoss.toFixed(2)} prefix="$" isDanger={true} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Equity Curve</h2>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.equityCurve}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="cumulative_pnl" stroke="var(--primary)" fillOpacity={1} fill="url(#colorPnl)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
