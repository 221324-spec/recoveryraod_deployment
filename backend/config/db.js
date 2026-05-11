const mongoose = require('mongoose');

// Avoid hanging requests when the DB is down/misconfigured.
mongoose.set('bufferCommands', false);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const dbConnect = async () => {
  let uri = process.env.MONGO_URI;

  if (!uri || String(uri).trim() === '') {
    console.error('❌ Missing MONGO_URI. Set it in environment variables.');
    process.exit(1);
  }

  // Strip any accidental surrounding quotes (common Render env var paste mistake)
  uri = uri.trim().replace(/^["']|["']$/g, '');

  // Log the URI shape (not the password) to help debug Render issues
  try {
    const parsed = new URL(uri);
    console.log(`🔍 MongoDB URI host: ${parsed.hostname} | DB: ${parsed.pathname} | Query: ${parsed.search}`);
  } catch {
    console.log('🔍 MongoDB URI format check skipped (not a standard URL)');
  }

  const options = {
    // Give Atlas 30 seconds to respond — essential on Render where network
    // latency to Atlas can be much higher than on localhost.
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    // These help Atlas SRV connections on cloud hosts
    family: 4, // Force IPv4 — Render containers sometimes have IPv6 issues with Atlas
  };

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`🔄 Connecting to MongoDB (Attempt ${attempt + 1}/${maxRetries})...`);
      await mongoose.connect(uri, options);
      console.log('✅ MongoDB connected successfully');
      return;
    } catch (err) {
      attempt++;
      // Log the full error to help diagnose Render-specific issues
      console.error(`❌ MongoDB connection error (Attempt ${attempt}): [${err.name}] ${err.message}`);

      if (attempt >= maxRetries) {
        console.error('❌ Fatal: Could not connect to MongoDB after multiple attempts.');
        console.error('💡 Render checklist:');
        console.error('   1. Atlas → Network Access → ALLOW ACCESS FROM ANYWHERE (0.0.0.0/0)');
        console.error('   2. Render env var MONGO_URI must NOT have quotes around it');
        console.error('   3. The & in the URI must be literal (not encoded) in Render dashboard');
        console.error('   4. Set NODE_ENV=production in Render env vars');
        process.exit(1);
      }

      // Exponential backoff: 2s, 4s, 8s, 16s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await sleep(delay);
    }
  }
};

module.exports = dbConnect;
