import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const ConnectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/edtech';
        
        if (!mongoUri) {
            console.log('⚠️ MONGODB_URI not found in environment variables');
            console.log('💡 Using default: mongodb://localhost:27017/edtech');
        }
        
        const connect = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000, // 10 seconds to select server
            connectTimeoutMS: 10000, // 10 seconds to connect
            socketTimeoutMS: 30000, // 30 seconds for socket operations
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2, // Maintain at least 2 socket connections
        });
        
        console.log(`✅ MongoDB connected successfully`);
        console.log(`📊 Database: ${connect.connection.name}`);
        
        // Fix any old indexes (like username_1) after connection
        try {
            const db = mongoose.connection.db;
            const collection = db.collection('users');
            const indexes = await collection.indexes();
            
            // Check if username_1 index exists and drop it
            const usernameIndex = indexes.find(idx => idx.name === 'username_1');
            if (usernameIndex) {
                console.log('🗑️  Removing old username_1 index...');
                await collection.dropIndex('username_1');
                console.log('✅ Removed old username_1 index');
            }
        } catch (indexError) {
            // Index might not exist or already dropped, which is fine
            if (indexError.code !== 27 && !indexError.message.includes('not found')) {
                console.log('⚠️  Note: Could not check/fix indexes:', indexError.message);
            }
        }
    } catch (error) {
        console.log(`❌ Error connecting to MongoDB: ${error.message}`);
        console.log(`\n💡 Solutions:`);
        console.log(`   1. Make sure MongoDB is running locally: mongod`);
        console.log(`   2. Or update MONGODB_URI in .env file`);
        console.log(`   3. For MongoDB Atlas: Whitelist your IP address`);
        console.log(`   4. Check your connection string format\n`);
    }
}