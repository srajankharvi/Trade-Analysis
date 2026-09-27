import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Trade } from '../models/Trade';

export const createTrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tradeData = { ...req.body, user: req.user?._id };
    
    // Calculate duration in seconds
    const entryTime = new Date(tradeData.entryTime).getTime();
    const exitTime = new Date(tradeData.exitTime).getTime();
    tradeData.duration = (exitTime - entryTime) / 1000;
    
    // Automatically calculate rrRatio if not provided
    if (tradeData.riskAmount && tradeData.pnl && !tradeData.rrRatio) {
      tradeData.rrRatio = Math.abs(tradeData.pnl / tradeData.riskAmount);
    }

    const trade = new Trade(tradeData);
    await trade.save();

    res.status(201).json(trade);
  } catch (error) {
    res.status(500).json({ error: 'Server error while creating trade' });
  }
};

export const getTrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trades = await Trade.find({ user: req.user?._id }).sort({ date: -1 });
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching trades' });
  }
};

export const getTradeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, user: req.user?._id });
    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching trade' });
  }
};

export const updateTrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trade = await Trade.findOneAndUpdate(
      { _id: req.params.id, user: req.user?._id },
      req.body,
      { new: true }
    );
    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json(trade);
  } catch (error) {
    res.status(500).json({ error: 'Server error while updating trade' });
  }
};

export const deleteTrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trade = await Trade.findOneAndDelete({ _id: req.params.id, user: req.user?._id });
    if (!trade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error while deleting trade' });
  }
};
