import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError, ZodSchema } from "zod";
import logger from "../utils/logger";

export const validateRequest = (schema: ZodSchema): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`Erro de validação nos campos: ${error.errors.map(e => e.path.join(".")).join(", ")}`);
        res.status(400).json({
          error: "Dados inválidos",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
        return; // Impede que o next seja chamado após enviar resposta
      }

      next(error);
    }
  };
};
