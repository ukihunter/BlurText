const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function addTestUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/blurtext');
    console.log('Connected to MongoDB');
    
    const UserSchema = new mongoose.Schema({
      username: String,
      password: String,
      createdAt: { type: Date, default: Date.now },
      isAnonymous: { type: Boolean, default: true }
    });
    
    const User = mongoose.model('User', UserSchema);
    
    // Create a few test users if they don't exist
    const testUsers = [
      { username: 'alice123', password: await bcrypt.hash('password123', 10) },
      { username: 'bob456', password: await bcrypt.hash('password123', 10) },
      { username: 'charlie789', password: await bcrypt.hash('password123', 10) },
      { username: 'diana101', password: await bcrypt.hash('password123', 10) },
      { username: 'eve202', password: await bcrypt.hash('password123', 10) }
    ];
    
    for (const user of testUsers) {
      const existing = await User.findOne({ username: user.username });
      if (!existing) {
        await new User(user).save();
        console.log('Created user:', user.username);
      } else {
        console.log('User already exists:', user.username);
      }
    }
    
    const count = await User.countDocuments();
    console.log('Total users in database:', count);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestUsers();
