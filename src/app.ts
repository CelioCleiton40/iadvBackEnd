import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';


import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import { connectToDatabase } from './config/dataBase';

dotenv.config(); // Carrega variáveis do .env

const app = express();

// Segurança
app.use(helmet()); // Protege contra cabeçalhos maliciosos
app.use(cors()); // Permite acesso de outros domínios
app.use(express.json()); // Suporte para JSON


// Rate limiting para evitar brute-force e abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rotas
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);

// Inicialização do servidor
const PORT = process.env.PORT || 3000;
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});

export default app;
