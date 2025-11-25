import mongoose from "mongoose";

const connectDB = async (url) => {
    try {
        console.log('🔌 Attempting to connect to MongoDB...');
        console.log('🔗 Connection URL:', url ? 'Provided' : 'Missing');
        
        if (!url) {
            throw new Error('MongoDB connection URL is required');
        }
        
        // Set up connection options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Increased to 10s
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            family: 4, // Force IPv4
        };

        console.log('🔄 Connecting to MongoDB...');
        const connection = await mongoose.connect(url, options);
        
        console.log('✅ MongoDB connected successfully');
        console.log(`   - Host: ${connection.connection.host}`);
        console.log(`   - Port: ${connection.connection.port}`);
        console.log(`   - Database: ${connection.connection.name}`);
        
        // Connection events
        mongoose.connection.on('connected', () => {
            console.log('🔗 Mongoose connected to DB');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  Mongoose disconnected');
        });
        
        // If the Node process ends, close the Mongoose connection
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('👋 Mongoose connection closed through app termination');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ MongoDB connection failed');
        console.error('Error details:', error.message);
        if (error.name === 'MongooseServerSelectionError') {
            console.error('This usually indicates that the MongoDB server is not running or not accessible');
            console.error('Please ensure MongoDB is running and the connection URL is correct');
        }
        console.error('Full error:', error);
        process.exit(1);
    }
};

export default connectDB;