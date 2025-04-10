import { client, connectToDatabase } from '../src/config/dataBase';

async function main() {
  try {
    // Conecta ao MongoDB
    await connectToDatabase();

    // Acessa a coleção "users"
    const usersCollection = client.db('iadvdb').collection('users');

    // Cria um novo usuário
    const newUser = await usersCollection.insertOne({
      email: 'test@example.com',
      password: 'password123',
      role: 'advogado',
      createdAt: new Date(),
    });

    console.log('Novo usuário criado:', newUser.insertedId);

    // Lista todos os usuários
    const allUsers = await usersCollection.find({}).toArray();
    console.log('Todos os usuários:', allUsers);
  } catch (error) {
    console.error('Erro ao interagir com o banco de dados:', error);
  } finally {
    // Fecha a conexão com o MongoDB
    await client.close();
  }
}

main();