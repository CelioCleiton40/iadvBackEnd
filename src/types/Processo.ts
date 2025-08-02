export interface Processo {
  numeroProcesso: string;
  classe: { codigo: number; nome: string };
  sistema: { codigo: number; nome: string };
  formato: { codigo: number; nome: string };
  tribunal: string;
  grau: string;
  dataAjuizamento: string;          // ISO
  dataHoraUltimaAtualizacao: string;// ISO
  movimentos: MovimentoAPI[];
  orgaoJulgador: { nome: string };
  assuntos: { nome: string }[];
  // … outros campos se precisar
}

export interface MovimentoAPI {
  codigo: number;
  nome: string;
  dataHora: string;                 // ISO
  complementosTabelados?: {
    codigo: number;
    valor: number;
    nome: string;
    descricao: string;
  }[];
}