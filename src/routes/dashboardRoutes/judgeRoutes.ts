import { Router } from 'express';
import {
  getMagistrado,
  listMagistrados,
  saveMagistrado,
  getMagistradoProcessos,
  getMagistradoEstatisticas,
  getMagistradoCache,
  deleteMagistradoCache,
  getMagistradosFrontendFormat,
  getJuizData // Rick: Compatibilidade com rota antiga
} from '../../controllers/dashboardController/judgeController';
import { authMiddleware } from '../../middlewares/authMiddleware';

/**
 * Rick: Rotas para gerenciar magistrados - seguindo padrões REST e PJe
 * Todas as rotas protegidas por autenticação
 */

const router = Router();

// Rick: Aplica autenticação em todas as rotas
router.use(authMiddleware);

/**
 * @route GET /api/magistrados/frontend
 * @desc Retorna magistrados no formato específico do frontend
 * @desc Usa dados reais do banco ou exemplos se não houver dados
 */
router.get('/frontend', getMagistradosFrontendFormat);

/**
 * @route GET /api/magistrados
 * @desc Lista magistrados por tribunal
 * @query tribunal - Código do tribunal (default: tjmg)
 * @query limit - Limite de resultados (default: 50)
 * @query offset - Offset para paginação (default: 0)
 * @query format - Formato de retorno (frontend|raw, default: frontend)
 * @header x-api-key - Chave de API do DataJud (opcional)
 */
router.get('/', listMagistrados);

/**
 * @route GET /api/magistrados/:id
 * @desc Busca dados de um magistrado específico
 * @param id - ID do magistrado
 * @query tribunal - Código do tribunal (default: tjmg)
 * @query forceRefresh - Força atualização dos dados (default: false)
 * @header x-api-key - Chave de API do DataJud (opcional)
 * @access Private
 */
router.get('/:id', getMagistrado);

/**
 * @route POST /api/magistrados
 * @desc Salva dados de magistrado no banco
 * @body JuizData - Dados completos do magistrado
 * @access Private
 */
router.post('/', saveMagistrado);

/**
 * @route GET /api/magistrados/:id/processos
 * @desc Busca processos de um magistrado específico
 * @param id - ID do magistrado
 * @query tribunal - Código do tribunal (default: tjmg)
 * @query limit - Limite de resultados (default: 100)
 * @header x-api-key - Chave de API do DataJud (opcional)
 * @access Private
 */
router.get('/:id/processos', getMagistradoProcessos);

/**
 * @route GET /api/magistrados/:id/estatisticas
 * @desc Busca estatísticas detalhadas de um magistrado
 * @param id - ID do magistrado
 * @query tribunal - Código do tribunal (default: tjmg)
 * @header x-api-key - Chave de API do DataJud (opcional)
 * @access Private
 */
router.get('/:id/estatisticas', getMagistradoEstatisticas);

/**
 * @route GET /api/magistrados/:id/cache
 * @desc Busca dados do magistrado apenas do cache local
 * @param id - ID do magistrado
 * @access Private
 */
router.get('/:id/cache', getMagistradoCache);

/**
 * @route DELETE /api/magistrados/:id/cache
 * @desc Remove dados do magistrado do cache local
 * @param id - ID do magistrado
 * @access Private
 */
router.delete('/:id/cache', deleteMagistradoCache);

// Rick: Rota de compatibilidade com sistema antigo
/**
 * @route GET /api/juiz/:id
 * @desc Busca dados do magistrado (formato legado)
 * @param id - ID do magistrado
 * @access Private
 * @deprecated Use GET /api/magistrados/:id instead
 */
router.get('/juiz/:id', getJuizData);

export default router;

/**
 * Rick: Exemplos de uso das rotas
 * 
 * 1. Listar magistrados do TRF1:
 *    GET /api/magistrados?tribunal=trf1&limit=20
 * 
 * 2. Buscar magistrado específico:
 *    GET /api/magistrados/joao-batista-prata-braga?tribunal=trf1
 * 
 * 3. Forçar atualização dos dados:
 *    GET /api/magistrados/joao-batista-prata-braga?forceRefresh=true
 * 
 * 4. Salvar magistrado no banco:
 *    POST /api/magistrados
 *    Body: { id: "magistrado-123", jurisprudencia: [...], ... }
 * 
 * 5. Buscar processos do magistrado:
 *    GET /api/magistrados/joao-batista-prata-braga/processos?limit=50
 * 
 * 6. Buscar estatísticas:
 *    GET /api/magistrados/joao-batista-prata-braga/estatisticas
 * 
 * 7. Verificar cache:
 *    GET /api/magistrados/joao-batista-prata-braga/cache
 * 
 * 8. Limpar cache:
 *    DELETE /api/magistrados/joao-batista-prata-braga/cache
 */