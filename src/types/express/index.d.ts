import { UserPayload } from '../../security/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}