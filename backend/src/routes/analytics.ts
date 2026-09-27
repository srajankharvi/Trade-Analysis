import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Trade } from '../models/Trade';
import axios from 'axios';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trades = await Trade.find({ user: req.user?._id });
    
    // Map trades to the format expected by Python service
    const formattedTrades = trades.map(t => ({
      id: t._id.toString(),
      date: t.date.toISOString(),
      symbol: t.symbol,
      type: t.type,
      strategy: t.strategy,
      entryTime: t.entryTime.toISOString(),
      exitTime: t.exitTime.toISOString(),
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      quantity: t.quantity,
      pnl: t.pnl,
      status: t.status,
      duration: t.duration,
      rrRatio: t.rrRatio
    }));

    const response = await axios.post(`${process.env.PYTHON_SERVICE_URL}/analytics`, { trades: formattedTrades });
    
    res.json(response.data);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
