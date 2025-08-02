import { Request, Response } from 'express';
  import { ProcessoService } from '../../services/dashboard/processoService';
  import { Processo } from '../../types/Processo';
  import { ProcessoSlim } from '../../types/ProcessoSlim';
  import { MovimentoAPI } from '../../types/Processo';
  import logger from '../../utils/logger';
  import { numeroProcessoSchema, listarProcessosSchema } from '../../schemas/processoSchema';

  /** * Controlador de processos.
   * Cada método valida entradas, delega ao service e centraliza tratamento de erro/retorno.
   */
  export class ProcessoController {
    constructor(private readonly processoService: ProcessoService) {}

    //#region Public Endpoints --------------------------------------------------

    /**
     * Busca processo no DataJud CNJ e registra/atualiza no banco.
     * Rick's comment: Portal interdimensional para dados jurídicos do CNJ
     */
    async buscarProcesso(req: Request, res: Response) {
      try {
        // Rick's comment: Validação do número do processo com schema Zod
        const { numeroProcesso } = req.params;
        const numeroValidado = numeroProcessoSchema.parse(numeroProcesso);
        
        logger.info(`[ProcessoController] Iniciando busca do processo: ${numeroValidado}`);
        
        const processo = await this.processoService.buscarERegistrar(numeroValidado);
        
        logger.info(`[ProcessoController] Processo ${numeroValidado} encontrado e retornado com sucesso`);
        res.status(200).json({
          success: true,
          message: 'Processo encontrado com sucesso',
          data: processo
        });
        return;
      } catch (err) {
        this.handleError(res, err as Error, {
          notFound: 'Processo não encontrado no DataJud CNJ.',
        });
        return;
      }
    }

    /**
     * Lista processos com paginação e filtro opcional por número.
     * Rick's comment: Listagem organizada dos processos do banco local
     */
    async listarProcessos(req: Request, res: Response) {
      try {
        // Rick's comment: Validação dos parâmetros de query com schema
        const queryValidada = listarProcessosSchema.parse(req.query);
        
        logger.info(`[ProcessoController] Listando processos - Página: ${queryValidada.page}, Limit: ${queryValidada.limit}`);
        
        const resultado = await this.processoService.listar(
          queryValidada.page, 
          queryValidada.limit, 
          queryValidada.numeroProcesso
        );
        
        logger.info(`[ProcessoController] Listagem concluída - ${resultado.total} processos encontrados`);
        res.status(200).json({
          success: true,
          message: `${resultado.total} processos encontrados`,
          ...resultado
        });
        return;
      } catch (err) {
        this.handleError(res, err as Error);
        return;
      }
    }

    /**
     * Obtém um processo já existente no banco pelo número.
     */
    async obterProcesso(req: Request, res: Response) {
      const { numeroProcesso } = req.params;
      if (!numeroProcesso) this.badRequest(res, 'Número do processo é obrigatório.');

      try {
        const processo = await this.processoService.obter(numeroProcesso);
        processo
          ? res.status(200).json(processo)
          : res.status(404).json({ error: 'Processo não encontrado no banco.' });
      } catch (err) {
        this.handleError(res, err as Error);
        return
      }
    }

    /**
     * Cadastra ou atualiza um processo já trazido pela API externa.
     */
    async salvarProcesso(req: Request, res: Response) {
      const processo: Processo = req.body;
      if (!processo?.numeroProcesso) this.badRequest(res, 'Número do processo é obrigatório.');

      try {
        const processoSlim = ProcessoController.converterParaSlim(processo);
        await this.processoService.salvar(processoSlim);
        res.status(200).json({ message: 'Processo salvo com sucesso.' });
      } catch (err) {
        this.handleError(res, err as Error);
      }
    }

    /**
     * Remove processo pelo número.
     */
    async removerProcesso(req: Request, res: Response) {
      const { numeroProcesso } = req.params;
      if (!numeroProcesso) this.badRequest(res, 'Número do processo é obrigatório.');

      try {
        const removido = await this.processoService.remover(numeroProcesso);
        removido
          ? res.status(200).json({ message: 'Processo removido com sucesso.' })
          : res.status(404).json({ error: 'Processo não encontrado.' });
      } catch (err) {
        this.handleError(res, err as Error);
      }
    }

    //#endregion

    //#region Private Helpers ---------------------------------------------------

    /** Validações de entrada. */
    private badRequest(res: Response, message: string) {
      return res.status(400).json({ error: message });
    }

    /**
     * Tratamento centralizado de exceções.
     * Se fornecido "notFound", converte mensagem específica em 404.
     */
    private handleError(
      res: Response,
      err: Error,
      options: { notFound?: string } = {}
    ) {
      // Rick's comment: Log detalhado do erro - porque debuggar sem logs é como viajar no tempo sem coordenadas
      logger.error(`[ProcessoController] Erro capturado:`, {
        message: err.message,
        stack: err.stack,
        name: err.name
      });

      // Rick's comment: Verificar diferentes tipos de erro para resposta adequada
      if (options.notFound && (err.message.includes('não encontrado') || err.message.includes('not found'))) {
        return res.status(404).json({ error: options.notFound });
      }

      if (err.message.includes('obrigatório') || err.message.includes('required')) {
        return res.status(400).json({ error: err.message });
      }

      if (err.message.includes('Timeout') || err.message.includes('timeout')) {
        return res.status(408).json({ error: 'Timeout na consulta. Tente novamente.' });
      }

      if (err.message.includes('autenticação') || err.message.includes('authentication')) {
        return res.status(401).json({ error: 'Erro de autenticação na API externa.' });
      }

      if (err.message.includes('limite') || err.message.includes('rate limit')) {
        return res.status(429).json({ error: 'Limite de requisições excedido. Tente novamente mais tarde.' });
      }

      // Rick's comment: Erro genérico - quando nem eu sei o que deu errado
      return res.status(500).json({ 
        error: 'Erro interno no servidor.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    /**
     * Converte um `Processo` completo vindo da API DataJud em `ProcessoSlim` para armazenamento.
     */
    private static converterParaSlim(processo: Processo): ProcessoSlim {
      const ultimoMovimento = processo.movimentos?.[0]; // assume ordenado decrescente por data

      return {
        numeroProcesso: processo.numeroProcesso,
        tribunal: processo.tribunal,
        classe: processo.classe?.nome ?? 'Não informada',
        grau: processo.grau,
        dataAjuizamento: processo.dataAjuizamento,
        ultimaAtualizacao: processo.dataHoraUltimaAtualizacao,
        assuntos: processo.assuntos?.map((a) => a.nome) ?? [],
        ultimoAndamento: {
          dataHora: ultimoMovimento?.dataHora ?? '',
          descricao: ultimoMovimento?.nome ?? 'Sem movimentações',
        },
        resultado: ProcessoController.obterResultado(processo.movimentos),
        transitoEmJulgado: ProcessoController.obterTransitoEmJulgado(processo.movimentos),
      };
    }

    private static obterResultado(movimentos: MovimentoAPI[]): string | undefined {
      const mov = movimentos?.find((m) =>
        ['julgado', 'sentença', 'decisão'].some((kw) => m.nome.toLowerCase().includes(kw))
      );
      return mov?.nome;
    }

    private static obterTransitoEmJulgado(movimentos: MovimentoAPI[]): string | undefined {
      const mov = movimentos?.find(
        (m) => m.nome.toLowerCase().includes('trânsito em julgado') || m.codigo === 10050
      );
      return mov?.dataHora;
    }

    //#endregion
  }
