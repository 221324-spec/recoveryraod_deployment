const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Project_db_user:Project123@mydatabase.ht9clnx.mongodb.net/RecoveryRoad?retryWrites=true&w=majority';

// Get email from command line argument
const emailToUpgrade = process.argv[2];

if (!emailToUpgrade) {
  console.error('❌ Usage: node upgrade-to-admin.js <email>');
  console.error('Example: node upgrade-to-admin.js admin@recovery.com');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✓ Connected to MongoDB');
    
    const User = require('./models/User');
    
    // Find user by email
    const user = await User.findOne({ email: emailToUpgrade.toLowerCase().trim() });
    
    if (!user) {
      console.error(`❌ User not found with email: ${emailToUpgrade}`);
      process.exit(1);
    }
    
    console.log(`\nFound user: ${user.name} (${user.email})`);
    console.log(`Current role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    
    // Upgrade to Admin
    user.role = 'Admin';
    user.isEmailVerified = true;
    user.isActive = true;
    user.status = 'active';
    
    await user.save();
    
    console.log('\n✅ Successfully upgraded to Admin role!');
    console.log(`New role: ${user.role}`);
    console.log(`Status: ${user.status}`);
    console.log('\n🔄 Log out and log back in to see admin dashboard');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  });
