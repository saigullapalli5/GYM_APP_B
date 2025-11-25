import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment Variables:');
console.log('---------------------');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
console.log(`PORT: ${process.env.PORT || 'Not set'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Not set'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
console.log('---------------------');

if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI is not set in .env file');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully!');
