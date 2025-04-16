import { Router } from 'express';
import { fetchProfile, updateProfile } from '../controllers/userProfileController';
import { authMiddleware } from '../middlewares/authMiddleware'; // Middleware que verifica o token
import { validate } from '../utils/validation'; // Função genérica de validação
import { advogadoSchema } from '../utils/validation'; // Schema de validação do perfil

const router = Router();

// Rota para buscar perfil (GET /perfil)
router.get('/perfil', authMiddleware, async (req, res, next) => {
    try {
        await fetchProfile(req, res);  // Chama o controlador para buscar o perfil
    } catch (error) {
        next(error); // Passa o erro para o middleware de tratamento global
    }
});

// Rota para criar ou atualizar perfil (PUT /perfil)
router.put('/perfil', authMiddleware, validate(advogadoSchema), async (req, res, next) => {
    try {
        await updateProfile(req, res);  // Chama o controlador para atualizar o perfil
    } catch (error) {
        next(error); // Passa o erro para o middleware de tratamento global
    }
});

export default router;
