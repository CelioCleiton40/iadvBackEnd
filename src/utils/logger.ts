import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// Configuração de transporte para arquivos rotacionados
const fileTransport = new DailyRotateFile({
  filename: "logs/application-%DATE%.log", // Nome do arquivo com data
  datePattern: "YYYY-MM-DD", // Padrão de data
  zippedArchive: true, // Compacta logs antigos
  maxSize: "20m", // Tamanho máximo por arquivo
  maxFiles: "14d", // Mantém logs por 14 dias
});

// Configuração do Winston
const logger = winston.createLogger({
  level: "info", // Nível mínimo de log
  format: winston.format.combine(
    winston.format.timestamp(), // Adiciona timestamp
    winston.format.json() // Formato JSON
  ),
  transports: [
    // Logs no console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Colore logs no console
        winston.format.simple() // Formato simplificado
      ),
    }),
    // Logs em arquivos rotacionados
    fileTransport,
  ],
});

// Exporta o logger configurado
export default logger;