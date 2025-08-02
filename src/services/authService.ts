import { client } from '../config/dataBase';
import { comparePasswords } from '../security/encryption';
import { generateToken } from '../security/jwt';

/**
 * Função para autenticar um usuário.
 * @param email - E-mail do usuário.
 * @param password - Senha fornecida pelo usuário.
 * @returns Um objeto contendo o token JWT e os dados do usuário.
 * @throws Erro em caso de falha na autenticação.
 */
export const loginUser = async (email: string, password: string) => {
  try {
    // Validação básica dos parâmetros
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    // Validação adicional do formato do e-mail
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Formato de e-mail inválido.');
    }

    // Busca o usuário pelo e-mail
    const user = await client
      .db('iadvdb')
      .collection('users')
      .findOne({ email });
    // Verifica se o usuário existe

    if (!user) {
      // Em produção, evite mensagens específicas para evitar ataques de enumeração de usuários
      console.warn('[loginUser] Usuário não encontrado:', email);
      throw new Error('Credenciais inválidas.');
    }

    // Compara a senha fornecida com a senha criptografada
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      console.warn('[loginUser] Senha inválida para o usuário:', email);
      throw new Error('Credenciais inválidas.');
    }

    // Gera o token JWT
    const token = generateToken({
      userId: user._id?.toString(), // Converte _id para string de forma segura
      email: user.email,
      role: user.role
    });

    // Retorna o token e os dados do usuário (sem a senha)
    return {
      token,
      user: {
        id: user._id?.toString(), // Garante que o ID seja uma string
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    // Log detalhado para depuração
    console.error('[loginUser] Erro ao autenticar usuário:', error);

    // Lança o erro novamente para ser tratado pelo controlador
    throw error;
  }
};