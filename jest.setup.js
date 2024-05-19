jest.setTimeout(300000); 
process.env.NODE_ENV = 'test';

jest.mock('./src/middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
      next();
    },
  }));
  
  