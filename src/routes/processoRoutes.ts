import { Router } from 'express';
import { Db } from 'mongodb';
import { ProcessoController } from '../controllers/processoController';

export function createProcessoRoutes(db: Db): Router {
  const router = Router();
  const processoController = new ProcessoController(db);

  /**
   * @route GET /processos
   * @desc Lista processos salvos no banco com paginação e filtro
   * @query page - Página (padrão: 1)
   * @query limit - Limite por página (padrão: 10)
   * @query numeroProcesso - Filtro por número do processo (opcional)
   */
  router.get('/', async (req, res) => {
    await processoController.listarProcessos(req, res);
  });

  /**
   * @route GET /processos/buscar/:numeroProcesso
   * @desc Busca um processo no DataJud e salva no banco
   * @param numeroProcesso - Número do processo (formato: NNNNNNN-DD.AAAA.J.TR.OOOO)
   */
  router.get('/buscar/:numeroProcesso', async (req, res) => {
    await processoController.buscarProcesso(req, res);
  });

  /**
   * @route GET /processos/:numeroProcesso
   * @desc Obtém um processo específico do banco local
   * @param numeroProcesso - Número do processo
   */
  router.get('/:numeroProcesso', async (req, res) => {
    await processoController.obterProcesso(req, res);
  });

  /**
   * @route DELETE /processos/:numeroProcesso
   * @desc Remove um processo do banco
   * @param numeroProcesso - Número do processo
   */
  router.delete('/:numeroProcesso', async (req, res) => {
    await processoController.removerProcesso(req, res);
  });

  return router;
}
