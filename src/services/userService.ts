import bcrypt from 'bcrypt';
import { generateToken } from '../security/jwt';
import { client } from '../config/dataBase';
import { User } from '../models/userModel';
import { CreateUserInput } from '../types/userTypes';

const SALT_ROUNDS = 10;

const getUserCollection = () => client.db('iadvdb').collection<User>('users');

export const registerUser = async (userData: CreateUserInput): Promise<{ userId: string; token: string }> => {
  const usersCollection = getUserCollection();

  const existingUser = await usersCollection.findOne({ email: userData.email });
  if (existingUser) throw new Error('E-mail já está em uso.');

  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  const userToInsert: User = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
  };

  const result = await usersCollection.insertOne(userToInsert);

  const token = generateToken({ id: result.insertedId.toString(), email: userData.email });

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
