const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test database connection and log success
prisma.$connect()
  .then(() => {
    console.log('PostgreSQL database connected successfully');
  })
  .catch((error) => {
    console.error('Failed to connect to PostgreSQL database:', error);
  });

module.exports = prisma;
