import { Router } from 'express';
import { Db } from 'mongodb';
import { ProcessoController } from '../../controllers/dashboardController/processoController';
import { ProcessoService } from '../../services/dashboard/processoService';
import { authMiddleware } from '../../middlewares/authMiddleware';

export function createProcessoRoutes(db: Db): Router {
  const router = Router();

  const processoService = new ProcessoService(db);
  const controller = new ProcessoController(processoService);

router.get('/', controller.listarProcessos.bind(controller));
router.get('/_search/:numeroProcesso', controller.buscarProcesso.bind(controller));
router.get('/:numeroProcesso', controller.obterProcesso.bind(controller));
router.post('/', controller.salvarProcesso.bind(controller));
router.delete('/:numeroProcesso', controller.removerProcesso.bind(controller));

  return router;
}
