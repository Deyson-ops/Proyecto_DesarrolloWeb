import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any; // o un tipo más específico que desees usar
    }
  }
}
