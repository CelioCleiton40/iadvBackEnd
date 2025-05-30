export interface Estatisticas {
  procedentes: number;
  parciais: number;
  improcedentes: number;
}

export type TipoDecisao = 'Procedente' | 'Improcedente' | 'Parcialmente Procedente';

export interface DecisaoRecente {
  tipo: TipoDecisao;
  processo: string;
  data: string;
}

export interface JuizData {
  id: string; // Adicionado para compatibilidade com o serviço
  jurisprudencia: string[];
  estatisticas: Estatisticas;
  tempoMedio: string;
  processos: number;
  decisoesRecentes: DecisaoRecente[];
  tendencias: string[];
  alertas: string[];
}