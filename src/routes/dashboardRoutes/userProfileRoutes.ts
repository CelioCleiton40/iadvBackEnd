import { Router } from 'express';
import {
  fetchProfile,
  updateProfile,
  deleteProfileController,
  fetchProfileByProfileId
} from '../../controllers/dashboardController/userProfileController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { updateUserProfileSchema } from '../../schemas/userProfile';

const router = Router();

/**
 * Rota para buscar o perfil do usuário logado (GET /perfil)
 * - Protegida pelo middleware de autenticação.
 */
router.get('/perfil', authMiddleware, async (req, res, next) => {
  try {
    await fetchProfile(req, res); // Chama o controlador para buscar o perfil
  } catch (error) {
    next(error); // Passa o erro para o middleware de tratamento global
  }
});

/**
 * Rota para criar ou atualizar o perfil do usuário logado (PUT /perfil)
 * Rick's comment: PUT com validação Zod porque dados inválidos são o inferno.
 * - Protegida pelo middleware de autenticação.
 * - Valida os dados do perfil usando o schema `updateUserProfileSchema`.
 */
router.put('/perfil', authMiddleware, validateRequest(updateUserProfileSchema), async (req, res, next) => {
  try {
    await updateProfile(req, res); // Chama o controlador para criar/atualizar o perfil
  } catch (error) {
    next(error); // Passa o erro para o middleware de tratamento global
  }
});

/**
 * Rota para excluir o perfil do usuário logado (DELETE /perfil)
 * - Protegida pelo middleware de autenticação.
 */
router.delete('/perfil', authMiddleware, async (req, res, next) => {
  try {
    await deleteProfileController(req, res); // Chama o controlador para excluir o perfil
  } catch (error) {
    next(error); // Passa o erro para o middleware de tratamento global
  }
});

/**
 * Rota para buscar um perfil pelo profileId (GET /perfil/:profileId)
 * - Protegida pelo middleware de autenticação.
 */
router.get('/perfil/:profileId', authMiddleware, async (req, res, next) => {
  try {
    await fetchProfileByProfileId(req, res); // Chama o controlador para buscar o perfil pelo profileId
  } catch (error) {
    next(error); // Passa o erro para o middleware de tratamento global
  }
});

export default router;