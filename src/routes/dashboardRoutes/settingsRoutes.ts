import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { validateRequest } from "../../middlewares/validateRequest";
import { 
  saveUserSettings, 
  fetchUserSettings, 
  deleteUserSettingsController,
  resetUserSettings 
} from "../../controllers/dashboardController/userSettingsController";
import { updateUserSettingsSchema } from "../../schemas/userSettingsSchema";

const router = Router();

/**
 * Rota para buscar as configurações do usuário.
 * Rick's comment: GET porque você quer ver suas configurações.
 */
router.get("/settings", authMiddleware, fetchUserSettings);

/**
 * Rota para salvar ou atualizar as configurações do usuário.
 * Rick's comment: PUT com validação porque dados inválidos são o inferno.
 */
router.put("/settings", authMiddleware, validateRequest(updateUserSettingsSchema), saveUserSettings);

/**
 * Rota para deletar as configurações do usuário.
 * Rick's comment: DELETE porque às vezes você quer começar do zero.
 */
router.delete("/settings", authMiddleware, deleteUserSettingsController);

/**
 * Rota para resetar configurações para os padrões.
 * Rick's comment: POST para reset porque é uma ação que cria algo novo.
 */
router.post("/settings/reset", authMiddleware, resetUserSettings);

export default router;