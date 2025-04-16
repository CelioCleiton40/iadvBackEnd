import { ObjectId } from 'mongodb';

export interface IUserProfile {
  _id?: ObjectId;
  userId: string;
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento?: Date;
  estadoCivil?: string;
  numeroOAB?: string;
  seccional?: string;
  areasAtuacao?: string;
  escritorio?: string;
  dataInscricaoOAB?: Date;
  situacao?: string;
  createdAt: Date;
  updatedAt: Date;
}
