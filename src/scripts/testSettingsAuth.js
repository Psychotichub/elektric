const axios = require('axios');
require('dotenv').config();

// Test settings authentication and API endpoints
async function testSettingsAuth() {
    try {
        console.log('🧪 Testing Settings Authentication...\n');

        // Test 1: Try to access settings without token
        console.log('📋 Test 1: Access settings without token');
        try {
            const response = await axios.get('http://localhost:3000/api/settings/user-site-details');
            console.log('❌ Should have failed but got:', response.status);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Correctly rejected without token (401)');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test 2: Try to access settings with invalid token
        console.log('\n📋 Test 2: Access settings with invalid token');
        try {
            const response = await axios.get('http://localhost:3000/api/settings/user-site-details', {
                headers: {
                    'Authorization': 'Bearer invalid_token'
                }
            });
            console.log('❌ Should have failed but got:', response.status);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Correctly rejected invalid token (401)');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test 3: Test current-user endpoint
        console.log('\n📋 Test 3: Test current-user endpoint');
        try {
            const response = await axios.get('http://localhost:3000/api/auth/current-user', {
                headers: {
                    'Authorization': 'Bearer invalid_token'
                }
            });
            console.log('❌ Should have failed but got:', response.status);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Current-user endpoint correctly rejects invalid token (401)');
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n🎉 Settings authentication tests completed!');
        console.log('📝 Next steps:');
        console.log('1. Make sure you are logged in with a valid token');
        console.log('2. Check browser console for any JavaScript errors');
        console.log('3. Verify token is stored in localStorage/sessionStorage');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test
if (require.main === module) {
    testSettingsAuth();
}

module.exports = { testSettingsAuth }; 