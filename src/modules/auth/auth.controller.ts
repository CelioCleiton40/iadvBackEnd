import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../user/user.model';
import { comparePassword } from '../../utils/hash';
import { generateTokens, verifyRefreshToken } from '../../utils/jwt';
import { isValidEmail, isStrongPassword, isValidCPF, isValidOABNumber } from '../../utils/validator';

interface RegisterRequest extends FastifyRequest {
  body: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    oabNumber?: string;
    role?: 'admin' | 'lawyer' | 'client';
  };
}

interface LoginRequest extends FastifyRequest {
  body: {
    email: string;
    password: string;
  };
}

interface RefreshTokenRequest extends FastifyRequest {
  body: {
    refreshToken: string;
  };
}

export async function register(request: RegisterRequest, reply: FastifyReply) {
  try {
    const { name, email, password, cpf, oabNumber, role } = request.body;
    
    // Validate input
    if (!name || !email || !password || !cpf) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }
    
    if (!isValidEmail(email)) {
      return reply.status(400).send({ error: 'Invalid email format' });
    }
    
    if (!isStrongPassword(password)) {
      return reply.status(400).send({ 
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character' 
      });
    }
    
    if (!isValidCPF(cpf)) {
      return reply.status(400).send({ error: 'Invalid CPF format' });
    }
    
    if (oabNumber && !isValidOABNumber(oabNumber)) {
      return reply.status(400).send({ error: 'Invalid OAB number format' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { cpf }] 
    });
    
    if (existingUser) {
      return reply.status(409).send({ error: 'User already exists' });
    }
    
    // Create new user
    const userRole = role || (oabNumber ? 'lawyer' : 'client');
    
    const user = new User({
      name,
      email,
      password,
      cpf,
      oabNumber,
      role: userRole
    });
    
    await user.save();
    
    // Generate tokens
    const tokens = generateTokens(request.server, { userId: user._id });
    
    return reply.status(201).send({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}

export async function login(request: LoginRequest, reply: FastifyReply) {
  try {
    const { email, password } = request.body;
    
    // Validate input
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const tokens = generateTokens(request.server, { userId: user._id });
    
    return reply.send({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}

export async function refreshToken(request: RefreshTokenRequest, reply: FastifyReply) {
  try {
    const { refreshToken } = request.body;
    
    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(request.server, refreshToken);
    
    // Check if user exists
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(request.server, { userId: user._id });
    
    return reply.send(tokens);
  } catch (error) {
    request.log.error(error);
    return reply.status(401).send({ error: 'Invalid refresh token' });
  }
}