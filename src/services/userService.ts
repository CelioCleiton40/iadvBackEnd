import bcrypt from 'bcrypt';
import { generateToken } from '../security/jwt';
import { client } from '../config/dataBase';
import { User } from '../models/userModel';
import { CreateUserInput, UserRole } from '../types/userTypes';

const SALT_ROUNDS = 10;

const getUserCollection = () => client.db('iadvdb').collection<User>('users');

export const registerUser = async (
  userData: CreateUserInput
): Promise<{ userId: string; token: string }> => {
  const usersCollection = getUserCollection();

  // Verifica se já existe um usuário com o mesmo e-mail
  const existingUser = await usersCollection.findOne({ email: userData.email });
  if (existingUser) throw new Error('E-mail já está em uso.');

  // Hash da senha
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  // Cria o objeto de usuário a ser salvo
  const userToInsert: User = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
  };

  // Insere no banco de dados
  const result = await usersCollection.insertOne(userToInsert);

  // Gera token com os campos exigidos pela interface UserPayload
  const token = generateToken({
    userId: result.insertedId.toString(),
    email: userData.email,
    role: userData.role as UserRole // ou outro valor padrão
  });

  return {
    userId: result.insertedId.toString(),
    token,
  };
};

export const getUsers = async (): Promise<User[]> => {
  const usersCollection = getUserCollection();

  const users = await usersCollection
    .find({}, { projection: { password: 0 } }) // Nunca retorna senha
    .toArray();

  return users;
};
