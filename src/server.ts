import app from './app';
import { PORT, JWT_SECRET, DATABASE_URL } from './config/env';
import logger from './utils/logger';
import { connectToDatabase, disconnectFromDatabase } from './config/dataBase';

const DEFAULT_JWT = 'changeme';

async function iniciarServidor() {
  try {
    // Ambiente
    logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);

    // Verificações críticas
    if (!JWT_SECRET || JWT_SECRET === DEFAULT_JWT) {
      logger.error('JWT_SECRET não configurado ou usando valor padrão inseguro.');
      process.exit(1);
    }

    if (!DATABASE_URL) {
      logger.error('DATABASE_URL não configurada.');
      process.exit(1);
    }

    // Conectar ao banco
    await connectToDatabase();
    logger.info('Conexão com o banco de dados estabelecida.');

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`Servidor rodando em: http://localhost:${PORT}`);
    });

    // Encerramento gracioso
    const gracefulShutdown = async (signal: NodeJS.Signals) => {
      logger.warn(`Sinal recebido: ${signal}. Encerrando servidor...`);

      const shutdownTimeout = setTimeout(() => {
        logger.error('Forçando encerramento do servidor após timeout.');
        process.exit(1);
      }, 10000); // 10 segundos

      try {
        await disconnectFromDatabase();
        logger.info('Banco de dados desconectado.');

        server.close(() => {
          clearTimeout(shutdownTimeout);
          logger.info('Servidor encerrado com sucesso.');
          process.exit(0);
        });
      } catch (error) {
        logger.error('Erro ao encerrar servidor:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    logger.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
}

iniciarServidor();
