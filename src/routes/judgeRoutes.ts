import express from 'express';
import { getJuizData } from '../controllers/judgeController';

const router = express.Router();

router.get('/juiz/:id', getJuizData); // Exemplo: GET /api/juiz/123

export default router;