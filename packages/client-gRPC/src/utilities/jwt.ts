// jwtUtils.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = "your_secret_key";

export const generateToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

export const validateToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};
