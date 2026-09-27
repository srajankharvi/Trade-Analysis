import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  symbol: string;
  type: 'Buy' | 'Sell';
  strategy: string; // Could be a reference to a Strategy collection later
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  riskAmount?: number;
  pnl: number;
  rrRatio?: number;
  marketCondition?: string;
  entryReason?: string;
  exitReason?: string;
  emotion?: string;
  mistake?: string;
  whatWentWell?: string;
  whatCouldBeImproved?: string;
  entryScreenshot?: string;
  exitScreenshot?: string;
  duration?: number; // in seconds
  status: 'Win' | 'Loss' | 'Breakeven';
}

const tradeSchema = new Schema<ITrade>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ['Buy', 'Sell'], required: true },
    strategy: { type: String, required: true },
    entryTime: { type: Date, required: true },
    exitTime: { type: Date, required: true },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    stopLoss: { type: Number },
    takeProfit: { type: Number },
    riskAmount: { type: Number },
    pnl: { type: Number, required: true },
    rrRatio: { type: Number },
    marketCondition: { type: String },
    entryReason: { type: String },
    exitReason: { type: String },
    emotion: { type: String },
    mistake: { type: String },
    whatWentWell: { type: String },
    whatCouldBeImproved: { type: String },
    entryScreenshot: { type: String },
    exitScreenshot: { type: String },
    duration: { type: Number },
    status: { type: String, enum: ['Win', 'Loss', 'Breakeven'], required: true },
  },
  { timestamps: true }
);

export const Trade = mongoose.model<ITrade>('Trade', tradeSchema);
