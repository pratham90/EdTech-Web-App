/**
 * Script to fix the duplicate username index error
 * This removes the old username_1 unique index that's causing signup failures
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function fixUsernameIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Get all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Check if username_1 index exists
    const usernameIndex = indexes.find(idx => idx.name === 'username_1');
    
    if (usernameIndex) {
      console.log('\n🗑️  Found username_1 index. Dropping it...');
      await collection.dropIndex('username_1');
      console.log('✅ Successfully dropped username_1 index');
    } else {
      console.log('\n✅ No username_1 index found. Nothing to fix.');
    }

    // Verify indexes after
    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing index:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

fixUsernameIndex();

