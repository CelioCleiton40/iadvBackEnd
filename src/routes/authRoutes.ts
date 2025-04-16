import { Router } from 'express';
import { login } from '../controllers/authController';
import { loginSchema, validate } from '../utils/validation';

const router = Router();

router.post('/login',validate(loginSchema), login);

export default router;