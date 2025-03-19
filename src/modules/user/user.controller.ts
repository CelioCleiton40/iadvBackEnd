import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from './user.model';

interface GetUserRequest extends FastifyRequest {
  user: {
    userId: string;
  };
}

export async function getUserProfile(request: GetUserRequest, reply: FastifyReply) {
  try {
    const userId = request.user.userId;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return reply.send(user);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}

export async function updateUserProfile(request: GetUserRequest, reply: FastifyReply) {
  try {
    const userId = request.user.userId;
    const updateData = request.body as Partial<IUser>;
    
    // Prevent updating sensitive fields
    delete updateData.password;
    delete updateData.role;
    delete updateData.isActive;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return reply.send(updatedUser);
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}