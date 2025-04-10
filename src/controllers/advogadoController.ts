import { Request, Response } from "express";
import { advogadoService } from "../services/advogadoService";

export const advogadoController = {
  async criar(req: Request, res: Response) {
    try {
      const id = await advogadoService.criar(req.body);
      res.status(201).json({ message: "Advogado criado com sucesso", id });
    } catch (err) {
      res.status(500).json({ error: "Erro ao criar advogado", details: err });
    }
  },

  async listar(req: Request, res: Response) {
    const advogados = await advogadoService.listarTodos();
    res.json(advogados);
  },

  async buscar (req: Request, res: Response) {
    try {
      const id = req.params.id;
      const advogado = await advogadoService.buscarPorId(id);
  
      if (!advogado) {
        res.status(404).json({ error: "Advogado não encontrado" });
        return; 
      }
  
      res.status(200).json(advogado); // sem "return"
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar advogado" });
    }
  },

  async atualizar(req: Request, res: Response) {
    const id = req.params.id;
    await advogadoService.atualizar(id, req.body);
    res.json({ message: "Advogado atualizado com sucesso" });
  },

  async deletar(req: Request, res: Response) {
    const id = req.params.id;
    await advogadoService.deletar(id);
    res.json({ message: "Advogado deletado com sucesso" });
  },
};
