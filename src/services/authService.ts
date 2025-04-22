import { client } from '../config/dataBase';
import { comparePasswords } from '../security/encryption';
import { generateToken } from '../security/jwt';


// Função para autenticar um usuário
export const loginUser = async (email: string, password: string) => {
  try {
    // Validação básica
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    // Busca o usuário pelo e-mail
    const user = await client
      .db('iadvdb')
      .collection('users')
      .findOne({ email });

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    // Compara a senha fornecida com a senha criptografada
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Senha inválida.');
    }

    // Gera o token JWT
    const token = generateToken({ id: user._id?.toString(), email: user.email, role: user.role });

    // Retorna o token e os dados do usuário (sem a senha)
    return {
      token,
      user: {
        id: user._id?.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    throw error;
  }
};