import { Router } from "express";
import { advogadoController } from "../controllers/advogadoController";
import { validateRequest } from "../middlewares/validateRequest";
import { authMiddleware } from "../middlewares/authMiddleware";
import { authorizeRoles } from "../middlewares/authorizeRoles";
import { advogadoSchema } from "../utils/validation";

const router = Router();

// Apenas "procuradoria" pode criar novos advogados
router.post(
  "/",
  authMiddleware,
  authorizeRoles("procuradoria"),
  validateRequest(advogadoSchema),
  advogadoController.criar
);

// Apenas usuários autenticados podem visualizar
router.get("/", authMiddleware, advogadoController.listar);

// Apenas "magistrado" pode buscar detalhes
router.get("/:id", authMiddleware, authorizeRoles("magistrado"), advogadoController.buscar);

// Atualização permitida para "procuradoria"
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("procuradoria"),
  validateRequest(advogadoSchema.partial()),
  advogadoController.atualizar
);

// Apenas "procuradoria" pode deletar
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("procuradoria"),
  advogadoController.deletar
);

export default router;
