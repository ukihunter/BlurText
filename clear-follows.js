const mongoose = require('mongoose');

async function clearFollows() {
  try {
    await mongoose.connect('mongodb://localhost:27017/blurtext');
    
    const UserFollows = mongoose.model('UserFollows', new mongoose.Schema({
      username: String,
      followedUsers: [String]
    }));
    
    // Clear follows for testuser1 to test the limit
    const result = await UserFollows.updateOne(
      { username: 'testuser1' },
      { $set: { followedUsers: [] } }
    );
    
    console.log('Cleared follows for testuser1:', result);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

clearFollows();
