import { Request, Response } from 'express';
import { Db } from 'mongodb';
import { buscarERegistrarProcesso } from '../services/datajudService';
import { Processo } from '../types/Processo';

export class ProcessoController {
  constructor(private db: Db) {}

  /**
   * Busca um processo pelo número
   */
  async buscarProcesso(req: Request, res: Response): Promise<void> {
    try {
      const { numeroProcesso } = req.params;

      if (!numeroProcesso) {
        res.status(400).json({
          error: 'Número do processo é obrigatório',
          message: 'Informe o número do processo na URL'
        });
        return;
      }

      // Validação básica do formato do número do processo
      const numeroLimpo = numeroProcesso.replace(/\D/g, '');
      if (numeroLimpo.length !== 20) {
        res.status(400).json({
          error: 'Formato inválido',
          message: 'O número do processo deve conter 20 dígitos'
        });
        return;
      }

      const processo = await buscarERegistrarProcesso(this.db, numeroProcesso);

      res.status(200).json({
        success: true,
        data: processo,
        message: 'Processo encontrado com sucesso'
      });

    } catch (error: any) {
      console.error('Erro ao buscar processo:', error);

      if (error.message === 'Processo não encontrado') {
        res.status(404).json({
          error: 'Processo não encontrado',
          message: 'Não foi possível encontrar um processo com este número'
        });
        return;
      }

      if (error.response?.status === 401) {
        res.status(401).json({
          error: 'Erro de autenticação',
          message: 'Chave de API inválida ou expirada'
        });
        return;
      }

      if (error.response?.status === 429) {
        res.status(429).json({
          error: 'Limite de requisições excedido',
          message: 'Muitas requisições. Tente novamente em alguns minutos'
        });
        return;
      }

      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro inesperado ao buscar o processo'
      });
    }
  }

  /**
   * Lista processos salvos no banco
   */
  async listarProcessos(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, numeroProcesso } = req.query;
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      let filter = {};
      if (numeroProcesso) {
        filter = {
          numeroProcesso: { $regex: numeroProcesso, $options: 'i' }
        };
      }

      const processos = await this.db
        .collection<Processo>('processos')
        .find(filter)
        .skip(skip)
        .limit(limitNum)
        .sort({ _id: -1 })
        .toArray();

      const total = await this.db
        .collection<Processo>('processos')
        .countDocuments(filter);

      res.status(200).json({
        success: true,
        data: processos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });

    } catch (error: any) {
      console.error('Erro ao listar processos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro ao listar os processos'
      });
    }
  }

  /**
   * Obtém um processo específico do banco
   */
  async obterProcesso(req: Request, res: Response): Promise<void> {
    try {
      const { numeroProcesso } = req.params;

      const processo = await this.db
        .collection<Processo>('processos')
        .findOne({ numeroProcesso });

      if (!processo) {
        res.status(404).json({
          error: 'Processo não encontrado',
          message: 'Processo não encontrado no banco de dados local'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: processo
      });

    } catch (error: any) {
      console.error('Erro ao obter processo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro ao obter o processo'
      });
    }
  }

  /**
   * Remove um processo do banco
   */
  async removerProcesso(req: Request, res: Response): Promise<void> {
    try {
      const { numeroProcesso } = req.params;

      const result = await this.db
        .collection<Processo>('processos')
        .deleteOne({ numeroProcesso });

      if (result.deletedCount === 0) {
        res.status(404).json({
          error: 'Processo não encontrado',
          message: 'Processo não encontrado no banco de dados'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Processo removido com sucesso'
      });

    } catch (error: any) {
      console.error('Erro ao remover processo:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro ao remover o processo'
      });
    }
  }
}