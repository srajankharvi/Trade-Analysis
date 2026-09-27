import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Trades = () => {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/trades');
        setTrades(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '2rem' }}>Trade History</h1>
      
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Date</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Symbol</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Type</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Strategy</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Entry Price</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Exit Price</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Net P&L</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No trades recorded yet.</td>
              </tr>
            ) : (
              trades.map((trade) => (
                <tr key={trade._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background-color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '1rem' }}>{format(new Date(trade.date), 'MMM dd, yyyy')}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{trade.symbol}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: trade.type === 'Buy' ? 'var(--success-light)' : 'var(--danger-light)', color: trade.type === 'Buy' ? 'var(--success)' : 'var(--danger)' }}>
                      {trade.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{trade.strategy}</td>
                  <td style={{ padding: '1rem' }}>${trade.entryPrice.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>${trade.exitPrice.toFixed(2)}</td>
                  <td style={{ padding: '1rem', color: trade.pnl > 0 ? 'var(--success)' : trade.pnl < 0 ? 'var(--danger)' : 'var(--text-main)', fontWeight: 600 }}>
                    {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: trade.status === 'Win' ? 'var(--success-light)' : trade.status === 'Loss' ? 'var(--danger-light)' : 'rgba(255,255,255,0.1)', color: trade.status === 'Win' ? 'var(--success)' : trade.status === 'Loss' ? 'var(--danger)' : 'var(--text-main)' }}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Trades;
