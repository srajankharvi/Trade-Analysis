import { Router } from 'express';
import { createTrade, getTrades, getTradeById, updateTrade, deleteTrade } from '../controllers/trade';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createTrade);
router.get('/', getTrades);
router.get('/:id', getTradeById);
router.put('/:id', updateTrade);
router.delete('/:id', deleteTrade);

export default router;
