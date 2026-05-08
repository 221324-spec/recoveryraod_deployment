const mongoose = require('mongoose');

// Avoid hanging requests when the DB is down/misconfigured.
mongoose.set('bufferCommands', false);

const dbConnect = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/recoveryroad';
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && (!process.env.MONGO_URI || String(process.env.MONGO_URI).trim() === '')) {
    console.error('❌ Missing MONGO_URI in production environment. Set it in Render service env vars.');
    process.exit(1);
  }
  
  // Set connection options with shorter timeout for faster failure detection
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    connectTimeoutMS: 10000,
  };
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri, options);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);

    // In production we require a database connection.
    // Exiting here makes Render show a clear deploy/runtime failure rather than timing out later.
    if (isProd) {
      console.error('❌ Fatal: cannot start without MongoDB in production.');
      process.exit(1);
    }
    
    // If Atlas fails, try local MongoDB
    if (uri.includes('mongodb+srv') || uri.includes('mongodb.net')) {
      console.log('🔄 Attempting to connect to local MongoDB...');
      try {
        await mongoose.connect('mongodb://localhost:27017/recoveryroad', options);
        console.log('✅ Connected to local MongoDB');
      } catch (localErr) {
        console.error('❌ Local MongoDB also failed:', localErr.message);
        console.log('⚠️ Server will continue without database. Some features may not work.');
        console.log('');
        console.log('💡 To fix this:');
        console.log('   1. Go to MongoDB Atlas → Network Access → Add IP Address');
        console.log('   2. Click "ALLOW ACCESS FROM ANYWHERE" or add your current IP');
        console.log('   3. Wait 1 minute and restart the server');
        console.log('');
      }
    } else {
      console.log('⚠️ Server will continue without database. Some features may not work.');
    }
  }
};

module.exports = dbConnect;
