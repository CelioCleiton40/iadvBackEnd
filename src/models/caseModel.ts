import { ObjectId } from 'mongodb';

export interface Caso {
  _id?: ObjectId;
  nome: string;
  descricao: string;
  categoria: string;
  imagem?: string; // URL ou base64, se preferir
  data?: Date;
  local?: string;
  criadoPor?: ObjectId; // referência ao usuário que criou
  criadoEm?: Date;
  atualizadoEm?: Date;
}
