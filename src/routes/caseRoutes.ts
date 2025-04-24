import { Router } from 'express';
import { 
  createCaso, 
  getCasosByUserId, 
  getCasoById, 
  updateCaso, 
  deleteCaso 
} from '../controllers/caseController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../utils/validation';
import { createCasoSchema } from '../schemas/caseSchema';

const router = Router();

// Rota para criar um caso (POST /casos)
router.post('/casos', authMiddleware, validate(createCasoSchema), async (req, res, next) => {
  try {
    await createCaso(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Rota para listar todos os casos do usuário (GET /casos)
router.get('/casos', authMiddleware, async (req, res, next) => {
  try {
    await getCasosByUserId(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Rota para buscar um caso específico pelo ID (GET /casos/:id)
router.get('/casos/:id', authMiddleware, async (req, res, next) => {
  try {
    await getCasoById(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Rota para atualizar um caso (PUT /casos/:id)
router.put('/casos/:id', authMiddleware, validate(createCasoSchema), async (req, res, next) => {
  try {
    await updateCaso(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Rota para excluir um caso (DELETE /casos/:id)
router.delete('/casos/:id', authMiddleware, async (req, res, next) => {
  try {
    await deleteCaso(req, res, next);
  } catch (error) {
    next(error);
  }
});

export default router;