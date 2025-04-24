export type StatusProcessual = "ativo" | "encerrado" | "arquivado";
export type FaseProcessual = "inicial" | "intermediária" | "recursal" | "final";
export type AreaDoDireito = "civil" | "criminal" | "trabalhista" | "tributário" | "família" | "outros";

export interface Caso {
  userId: string;
  numero: string;
  cliente: string;
  area: AreaDoDireito;
  fase: FaseProcessual;
  status: StatusProcessual;
  anexos: string[];
  createdAt?: string;
  updatedAt?: string;
}
