// Test script for account deletion functionality
const testAccountDeletion = async () => {
  try {
    // Test with correct password
    console.log('Testing account deletion with password...');
    
    const response = await fetch('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth=valid_jwt_token_here' // This would need a real JWT token
      },
      body: JSON.stringify({
        password: 'password123' // Assuming this is the correct password for testing
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);

    if (response.ok) {
      console.log('✅ Account deletion successful!');
      console.log('Deleted items:', result.deleted);
    } else {
      console.log('❌ Account deletion failed:', result.error);
    }
  } catch (error) {
    console.error('Error testing account deletion:', error);
  }
};

// Run the test
testAccountDeletion();
