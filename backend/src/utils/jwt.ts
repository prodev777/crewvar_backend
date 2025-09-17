import jwt from 'jsonwebtoken';

export const generateToken = (payload: any, expiresIn: string = '7d'): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return (jwt.sign as any)(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return (jwt.verify as any)(token, secret);
};
