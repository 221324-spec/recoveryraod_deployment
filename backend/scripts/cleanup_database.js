require('dotenv').config();
const mongoose = require('mongoose');

const CONNECTION_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

const getPrimaryUri = () => process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/recoveryroad';

const connectToDatabase = async () => {
  const primaryUri = getPrimaryUri();

  try {
    await mongoose.connect(primaryUri, CONNECTION_OPTIONS);
    console.log(`✅ Connected to MongoDB (${primaryUri.includes('mongodb+srv') || primaryUri.includes('mongodb.net') ? 'cloud' : 'local'})`);
    return;
  } catch (primaryError) {
    console.error('❌ Primary MongoDB connection failed:', primaryError.message);

    if (primaryUri.includes('mongodb+srv') || primaryUri.includes('mongodb.net')) {
      const fallbackUri = 'mongodb://localhost:27017/recoveryroad';
      console.log('🔄 Attempting local MongoDB fallback...');
      await mongoose.connect(fallbackUri, CONNECTION_OPTIONS);
      console.log('✅ Connected to local MongoDB fallback');
      return;
    }

    throw primaryError;
  }
};

const cleanDatabase = async () => {
  await connectToDatabase();

  try {
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('MongoDB connection is not available');
    }

    const collectionInfos = await db.listCollections().toArray();
    const collectionNames = collectionInfos
      .map((info) => info.name)
      .filter((name) => !name.startsWith('system.'));

    console.log(`\n📦 Found ${collectionNames.length} collection(s) to clean`);

    if (collectionNames.length === 0) {
      console.log('No user collections found. Nothing to delete.');
      return;
    }

    let deletedCollections = 0;
    let deletedDocuments = 0;

    for (const collectionName of collectionNames) {
      const collection = db.collection(collectionName);
      const countBefore = await collection.countDocuments({});

      if (countBefore === 0) {
        console.log(`- ${collectionName}: already empty`);
        continue;
      }

      const result = await collection.deleteMany({});
      deletedCollections += 1;
      deletedDocuments += result.deletedCount || 0;
      console.log(`- ${collectionName}: deleted ${result.deletedCount}/${countBefore} document(s)`);
    }

    console.log(`\n✅ Cleanup complete. Cleared ${deletedCollections} collection(s) and removed ${deletedDocuments} document(s).`);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  cleanDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to clean database:', err.message);
      process.exit(1);
    });
}

module.exports = cleanDatabase;