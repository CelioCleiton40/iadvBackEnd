import { Db } from 'mongodb';
import { buscarERegistrarProcesso } from './datajudService';      // já existente
import { ProcessoSlim } from '../../types/ProcessoSlim';

interface Listagem<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProcessoService {
  /** Nome da coleção no MongoDB (pode vir por DI, env, etc.) */
  private readonly collectionName = 'processos_slim';

  constructor(private readonly db: Db) {}

  /** -----------------------------------------------------------
   *  1. Busca na API, converte em DTO e faz upsert no Mongo
   * ----------------------------------------------------------*/
  async buscarERegistrar(numeroProcesso: string): Promise<ProcessoSlim> {
    return await buscarERegistrarProcesso(this.db, numeroProcesso);
  }

  /** -----------------------------------------------------------
   *  2. Listagem paginada e opcionalmente filtrada
   * ----------------------------------------------------------*/
  async listar(
    page = 1,
    limit = 10,
    numeroProcesso?: string
  ): Promise<Listagem<ProcessoSlim>> {
    const filtro = numeroProcesso ? { numeroProcesso } : {};
    const col = this.db.collection<ProcessoSlim>(this.collectionName);

    const data = await col
      .find(filtro)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ ultimaAtualizacao: -1 }) // mais recentes primeiro
      .toArray();

    const total = await col.countDocuments(filtro);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /** -----------------------------------------------------------
   *  3. Obtém um processo específico pelo número
   * ----------------------------------------------------------*/
  async obter(numeroProcesso: string): Promise<ProcessoSlim | null> {
    return await this.db
      .collection<ProcessoSlim>(this.collectionName)
      .findOne({ numeroProcesso });
  }

  /** -----------------------------------------------------------
   *  4. Salva (upsert) um ProcessoSlim recebido via API interna
   * ----------------------------------------------------------*/
  async salvar(processo: ProcessoSlim): Promise<void> {
    await this.db
      .collection<ProcessoSlim>(this.collectionName)
      .updateOne(
        { numeroProcesso: processo.numeroProcesso },
        { $set: processo },
        { upsert: true }
      );
  }

  /** -----------------------------------------------------------
   *  5. Remove um processo; retorna true se removeu
   * ----------------------------------------------------------*/
  async remover(numeroProcesso: string): Promise<boolean> {
    const result = await this.db
      .collection<ProcessoSlim>(this.collectionName)
      .deleteOne({ numeroProcesso });

    return result.deletedCount === 1;
  }
}
