process.env.NODE_ENV = 'test';
// Ensure env variables are read without redundant self-assignment
void process.env.JWT_SECRET;
void process.env.DB_NAME;
void process.env.MONGO_URI;

