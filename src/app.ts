import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { setupSecurity } from './middlewares/securityMiddleware';
import { connectToDatabase } from './config/dataBase';
import settingsRoutes from './routes/settingsRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import userProfileRoutes from './routes/userProfileRoutes';

dotenv.config(); // Carrega variáveis do .env

const app = express();

// Segurança
app.use(helmet()); // Protege contra cabeçalhos maliciosos
app.use(cors({
  origin: "http://10.0.0.159:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); // Permite acesso de outros domínios
app.use(express.json()); // Suporte para JSON

// Rate limiting para evitar brute-force e abuso
setupSecurity(app); // Middlewares de segurança personalizados

// Registro das rotas de configurações
app.use("/api", settingsRoutes);

// Rotas
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', userProfileRoutes);

// Middleware de erros global (capture de erros não tratados)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err); // Log do erro para depuração
  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Erro interno no servidor.';
  res.status(statusCode).json({ message });
});

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1); // Encerra o processo se a conexão falhar
  });

export default app;
