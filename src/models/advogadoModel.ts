import { ObjectId } from "mongodb";

export interface Advogado {
    _id?: ObjectId; // ou ObjectId se preferir usar diretamente
    nome: string;
    cpf: string;
    email: string;
    telefone: string;
    dataNascimento?: string;
    estadoCivil?: string;
  
    oabNumero: string;
    oabSeccional: string;
    areasAtuacao?: string;
    escritorio?: string;
    dataInscricaoOAB?: string;
    situacao?: string;
  
    senhaHash: string;
    criadoEm?: Date;
    atualizadoEm?: Date;
  }
  