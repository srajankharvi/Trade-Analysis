import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddTrade = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    type: 'Buy',
    strategy: '',
    entryTime: '',
    exitTime: '',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    stopLoss: '',
    takeProfit: '',
    riskAmount: '',
    pnl: '',
    status: 'Win',
    marketCondition: '',
    entryReason: '',
    exitReason: '',
    emotion: '',
    mistake: '',
    whatWentWell: '',
    whatCouldBeImproved: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate missing numeric values if possible
      const payload: any = { ...formData };
      ['entryPrice', 'exitPrice', 'quantity', 'stopLoss', 'takeProfit', 'riskAmount', 'pnl'].forEach(field => {
        if (payload[field]) payload[field] = parseFloat(payload[field]);
        else delete payload[field];
      });

      // Append date to time for entryTime and exitTime
      if (payload.entryTime && payload.exitTime) {
        payload.entryTime = new Date(`${payload.date}T${payload.entryTime}`).toISOString();
        payload.exitTime = new Date(`${payload.date}T${payload.exitTime}`).toISOString();
      }

      await axios.post('http://localhost:5000/api/trades', payload);
      navigate('/trades');
    } catch (error) {
      console.error(error);
      alert('Failed to add trade');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '2rem' }}>Add Trade</h1>
      
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Symbol/Market</label>
            <input type="text" name="symbol" value={formData.symbol} onChange={handleChange} className="input-field" placeholder="e.g. BTC/USD" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="input-field" required>
              <option value="Buy">Buy / Long</option>
              <option value="Sell">Sell / Short</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Strategy</label>
            <input type="text" name="strategy" value={formData.strategy} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Entry Time</label>
            <input type="time" name="entryTime" value={formData.entryTime} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Exit Time</label>
            <input type="time" name="exitTime" value={formData.exitTime} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Entry Price</label>
            <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Exit Price</label>
            <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Quantity</label>
            <input type="number" step="any" name="quantity" value={formData.quantity} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Profit/Loss ($)</label>
            <input type="number" step="any" name="pnl" value={formData.pnl} onChange={handleChange} className="input-field" required />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="input-field" required>
              <option value="Win">Win</option>
              <option value="Loss">Loss</option>
              <option value="Breakeven">Breakeven</option>
            </select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Risk Amount ($)</label>
            <input type="number" step="any" name="riskAmount" value={formData.riskAmount} onChange={handleChange} className="input-field" />
          </div>

        </div>

        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Journal</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Entry Reason</label>
            <textarea name="entryReason" value={formData.entryReason} onChange={handleChange} className="input-field" rows={3}></textarea>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>What went well?</label>
            <textarea name="whatWentWell" value={formData.whatWentWell} onChange={handleChange} className="input-field" rows={2}></textarea>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Mistakes / Could be improved</label>
            <textarea name="mistake" value={formData.mistake} onChange={handleChange} className="input-field" rows={2}></textarea>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Save Trade</button>
      </form>
    </div>
  );
};

export default AddTrade;
