import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { saveUserSettings, fetchUserSettings } from "../controllers/userSettingsController";

const router = Router();

/**
 * Rota para buscar as configurações do usuário.
 */
router.get("/settings", authMiddleware, fetchUserSettings);

/**
 * Rota para salvar ou atualizar as configurações do usuário.
 */
router.put("/settings", authMiddleware, saveUserSettings);

export default router;