import express from 'express';
import { createUser, listUsers } from '../controllers/userController';
import { validateRequest } from '../middlewares/validateRequest';
import { createUserSchema } from '../schemas/userSchema';

const router = express.Router();

// Criar um novo usuário
router.post('/users', validateRequest(createUserSchema), createUser);

// Listar todos os usuários
router.get('/users', listUsers);

export default router;
