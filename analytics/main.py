from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np

app = FastAPI()

class Trade(BaseModel):
    id: str
    date: str
    symbol: str
    type: str
    strategy: str
    entryTime: str
    exitTime: str
    entryPrice: float
    exitPrice: float
    quantity: float
    pnl: float
    status: str
    duration: Optional[float] = None
    rrRatio: Optional[float] = None

class AnalyticsRequest(BaseModel):
    trades: List[Trade]

@app.post("/analytics")
def calculate_analytics(req: AnalyticsRequest):
    if not req.trades:
        return {"error": "No trades provided"}

    df = pd.DataFrame([t.dict() for t in req.trades])
    
    # Basic Stats
    total_trades = len(df)
    winning_trades = len(df[df['status'] == 'Win'])
    losing_trades = len(df[df['status'] == 'Loss'])
    
    win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
    
    total_profit = df[df['pnl'] > 0]['pnl'].sum()
    total_loss = df[df['pnl'] < 0]['pnl'].sum()
    net_pnl = total_profit + total_loss
    
    average_profit = df[df['pnl'] > 0]['pnl'].mean() if winning_trades > 0 else 0
    average_loss = df[df['pnl'] < 0]['pnl'].mean() if losing_trades > 0 else 0
    
    profit_factor = abs(total_profit / total_loss) if total_loss != 0 else float('inf')
    
    best_trade = df['pnl'].max() if total_trades > 0 else 0
    worst_trade = df['pnl'].min() if total_trades > 0 else 0
    
    avg_duration = df['duration'].mean() if 'duration' in df and not df['duration'].isnull().all() else 0
    
    # Equity Curve
    df = df.sort_values(by='date')
    df['cumulative_pnl'] = df['pnl'].cumsum()
    equity_curve = df[['date', 'cumulative_pnl']].to_dict(orient='records')
    
    # Daily PnL
    df['date_only'] = pd.to_datetime(df['date']).dt.date
    daily_pnl = df.groupby('date_only')['pnl'].sum().reset_index()
    daily_pnl['date_only'] = daily_pnl['date_only'].astype(str)
    daily_pnl_chart = daily_pnl.rename(columns={'date_only': 'date'}).to_dict(orient='records')
    
    # Daily Heatmap
    daily_counts = df.groupby('date_only').size().reset_index(name='count')
    daily_counts['date'] = daily_counts['date_only'].astype(str)
    heatmap_data = daily_counts[['date', 'count']].to_dict(orient='records')
    
    return {
        "totalTrades": total_trades,
        "winningTrades": winning_trades,
        "losingTrades": losing_trades,
        "winRate": win_rate,
        "totalProfit": total_profit,
        "totalLoss": total_loss,
        "netPnl": net_pnl,
        "averageProfit": average_profit,
        "averageLoss": average_loss,
        "profitFactor": profit_factor,
        "bestTrade": best_trade,
        "worstTrade": worst_trade,
        "averageTradeDuration": avg_duration,
        "equityCurve": equity_curve,
        "dailyPnl": daily_pnl_chart,
        "heatmapData": heatmap_data
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
