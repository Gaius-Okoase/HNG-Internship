import jwt from 'jsonwebtoken';

export const generateAccessToken = (id: string, role: 'admin' | 'analyst') => {
  return jwt.sign({ id, role }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '3m',
  });
};

export const generateRefreshToken = (id: string, role: 'admin' | 'analyst') => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '5m',
  });
};
