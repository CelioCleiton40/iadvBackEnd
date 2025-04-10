import { Router } from 'express';
import { login } from '../controllers/authController';
import { loginSchema, validate } from '../utils/validation';
import { setupSecurity } from '../middlewares/securityMiddleware';


const router = Router();


router.post('/login',validate(loginSchema), setupSecurity, login);

export default router;