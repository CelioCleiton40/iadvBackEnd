import { Request, Response } from 'express';
import { fetchJuizFromExternalApi } from '../services/judgeService';

export async function getJuizData(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const data = await fetchJuizFromExternalApi(id);
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Erro ao buscar dados do juiz:', error.message);
    res.status(500).json({ error: 'Não foi possível carregar os dados do juiz.' });
  }
}