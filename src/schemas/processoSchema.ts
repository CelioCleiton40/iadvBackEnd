import { z } from 'zod';

/**
 * Rick's comment: Schema de validação para processos jurídicos
 * Porque até no multiverso jurídico precisamos de padrões
 */

// Regex para validar número de processo CNJ
// Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
const NUMERO_PROCESSO_REGEX = /^\d{7}-\d{2}\.\d{4}\.[1-9]\.(\d{2})\.(\d{4})$/;

/**
 * Schema para validação de número de processo CNJ
 * Formato padrão: 0000000-00.0000.0.00.0000
 */
export const numeroProcessoSchema = z.string()
  .min(1, 'Número do processo é obrigatório')
  .regex(NUMERO_PROCESSO_REGEX, {
    message: 'Número de processo inválido. Use o formato: 0000000-00.0000.0.00.0000'
  })
  .transform(numero => numero.trim());

/**
 * Schema para busca de processo
 */
export const buscarProcessoSchema = z.object({
  numeroProcesso: numeroProcessoSchema
});

/**
 * Schema para listagem de processos com paginação
 */
export const listarProcessosSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  numeroProcesso: z.string().optional()
}).refine(data => {
  return data.page >= 1 && data.limit >= 1 && data.limit <= 100;
}, {
  message: 'Page deve ser >= 1 e limit deve estar entre 1 e 100'
});

/**
 * Schema para processo completo (vindo da API CNJ)
 */
export const processoCompletoSchema = z.object({
  numeroProcesso: numeroProcessoSchema,
  classe: z.object({
    codigo: z.number(),
    nome: z.string()
  }),
  sistema: z.object({
    codigo: z.number(),
    nome: z.string()
  }),
  formato: z.object({
    codigo: z.number(),
    nome: z.string()
  }),
  tribunal: z.string(),
  grau: z.string(),
  dataAjuizamento: z.string(),
  dataHoraUltimaAtualizacao: z.string(),
  movimentos: z.array(z.object({
    codigo: z.number(),
    nome: z.string(),
    dataHora: z.string(),
    complementosTabelados: z.array(z.object({
      codigo: z.number(),
      valor: z.number(),
      nome: z.string(),
      descricao: z.string()
    })).optional()
  })),
  orgaoJulgador: z.object({
    nome: z.string()
  }),
  assuntos: z.array(z.object({
    nome: z.string()
  }))
});

/**
 * Schema para processo slim (armazenado no banco)
 */
export const processoSlimSchema = z.object({
  numeroProcesso: numeroProcessoSchema,
  tribunal: z.string(),
  classe: z.string(),
  grau: z.string(),
  dataAjuizamento: z.string(),
  ultimaAtualizacao: z.string(),
  assuntos: z.array(z.string()),
  ultimoAndamento: z.object({
    dataHora: z.string(),
    descricao: z.string()
  }),
  resultado: z.string().optional(),
  transitoEmJulgado: z.string().optional(),
  ultimaConsulta: z.string().optional()
});

/**
 * Tipos TypeScript derivados dos schemas
 */
export type NumeroProcesso = z.infer<typeof numeroProcessoSchema>;
export type BuscarProcessoInput = z.infer<typeof buscarProcessoSchema>;
export type ListarProcessosInput = z.infer<typeof listarProcessosSchema>;
export type ProcessoCompleto = z.infer<typeof processoCompletoSchema>;
export type ProcessoSlimInput = z.infer<typeof processoSlimSchema>;