export interface ProcessoSlim {
  /** número completo, já com máscara se desejar */
  numeroProcesso: string;
  tribunal: string;
  classe: string;
  grau: string;

  /** datas sempre em ISO (yyyy-MM-dd ou yyyy-MM-ddTHH:mm) */
  dataAjuizamento: string;
  ultimaAtualizacao: string;

  /** lista de assuntos apenas com o nome */
  assuntos: string[];

  /** andamento mais recente */
  ultimoAndamento: {
    dataHora: string;
    descricao: string;
  };

  /** situação, se existir */
  resultado?: string;
  transitoEmJulgado?: string;
}
