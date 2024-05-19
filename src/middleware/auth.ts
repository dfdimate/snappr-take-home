import { Request, Response, NextFunction } from 'express';

const TOKEN = 'this-is-not-my-best-token-i-swear'; // Replace with your actual token

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // No token provided
  }

  if (token !== TOKEN) {
    return res.sendStatus(403); // Invalid token
  }

  next(); // Token is valid, proceed to the next middleware or route handler
}
