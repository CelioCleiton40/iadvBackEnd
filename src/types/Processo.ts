



export interface Processo {
  numeroProcesso: string;
  tribunal: string;
  grau: string;
  dataAjuizamento: string;
  dataHoraUltimaAtualizacao: string;
  classe: {
    codigo: number;
    nome: string;
  };
  sistema: {
    codigo: number;
    nome: string;
  };
  formato: {
    codigo: number;
    nome: string;
  };
  movimentos: {
    codigo: number;
    nome: string;
    dataHora: string;
    complementosTabelados?: {
      codigo: number;
      valor: number;
      nome: string;
      descricao: string;
    }[];
  }[];
  orgaoJulgador: {
    codigoMunicipioIBGE: number;
    codigo: number;
    nome: string;
  };
  assuntos: {
    codigo: number;
    nome: string;
  }[];
}
