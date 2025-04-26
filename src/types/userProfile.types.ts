export interface IUserProfile {
  _id?: string; // Alterado para string para alinhar com o esquema
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento?: string; // Alterado para string para alinhar com o esquema
  estadoCivil?: string;
  numeroOAB?: string;
  seccional?: string;
  areasAtuacao?: string;
  escritorio?: string;
  dataInscricaoOAB?: string; // Alterado para string para alinhar com o esquema
  situacao?: string;
  createdAt: string; // Alterado para string para alinhar com o esquema
  updatedAt: string; // Alterado para string para alinhar com o esquema
}