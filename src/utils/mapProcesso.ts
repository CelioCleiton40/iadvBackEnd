// util/mapProcesso.ts
import { Processo } from '../types/Processo';
import { ProcessoSlim } from '../types/ProcessoSlim';

/**
 * Recebe o hit bruto da API Elastic e devolve ProcessoSlim.
 */
export function mapApiToSlim(hit: any): ProcessoSlim {
  const p: Processo = hit._source;

  // assuntos só com o nome
  const assuntos = p.assuntos?.map(a => a.nome.trim()) ?? [];

  // ordena movimentos por data decrescente
  const movOrdenados = [...p.movimentos].sort(
    (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
  );

  const ultimo = movOrdenados[0];
  const resultadoMov = movOrdenados.find(m => m.codigo === 221);  // “Procedência em Parte”
  const transitoMov  = movOrdenados.find(m => m.codigo === 848);  // “Trânsito em julgado”

  return {
    numeroProcesso      : p.numeroProcesso,
    tribunal            : p.tribunal,
    classe              : p.classe.nome,
    grau                : p.grau,
    dataAjuizamento     : p.dataAjuizamento.slice(0, 10),          // yyyy-MM-dd
    ultimaAtualizacao   : p.dataHoraUltimaAtualizacao.slice(0, 10),
    assuntos,
    ultimoAndamento     : {
      dataHora  : ultimo.dataHora,
      descricao : ultimo.nome
    },
    resultado           : resultadoMov?.nome,
    transitoEmJulgado   : transitoMov?.dataHora?.slice(0, 10)
  };
}
