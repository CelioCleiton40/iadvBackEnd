import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { setupSecurity } from "./middlewares/securityMiddleware";
import { connectToDatabase } from "./config/dataBase";
import settingsRoutes from "./routes/dashboardRoutes/settingsRoutes";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import userProfileRoutes from "./routes/dashboardRoutes/userProfileRoutes";
import judgeRouter from "./routes/dashboardRoutes/judgeRoutes";
import { createProcessoRoutes } from "./routes/dashboardRoutes/processoRoutes";
import { appointmentRoutes } from "./routes/dashboardRoutes/appointmentRoutes";
import { notificationRoutes } from "./routes/dashboardRoutes/notificationRoutes";
import { NotificationScheduler } from "./jobs/notificationScheduler";

dotenv.config(); // Carrega variáveis do .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-content-type-options",
    ],
  })
);
app.use(express.json());

// Segurança
setupSecurity(app);

// Agendamento
const scheduler = new NotificationScheduler();
scheduler.start();

// Inicialização
async function startServer() {
  try {
    const database = await connectToDatabase();

    // Rotas
    app.use("/api", settingsRoutes);
    app.use("/api", userRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api", userProfileRoutes);
    app.use("/api/magistrados", judgeRouter);
    app.use("/api/appointments", appointmentRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/processos", createProcessoRoutes(database));

    // Inicia servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    process.exit(1);
  }
}

startServer();

// Middleware global de erros
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);
    const statusCode = (err as any).statusCode || 500;
    const message = err.message || "Erro interno no servidor.";
    res.status(statusCode).json({ message });
  }
);

export default app;
