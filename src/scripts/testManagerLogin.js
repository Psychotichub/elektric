const axios = require('axios');

// Test manager login
async function testManagerLogin() {
    try {
        console.log('🧪 Testing manager login...');
        
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'manager1',
            password: 'manager123'
        });
        
        console.log('✅ Manager login successful!');
        console.log('📋 Response:', {
            success: response.data.success,
            message: response.data.message,
            user: response.data.user
        });
        
        return response.data;
        
    } catch (error) {
        console.error('❌ Manager login failed:', error.response?.data || error.message);
        return null;
    }
}

// Test regular user login (should fail without site/company)
async function testRegularUserLogin() {
    try {
        console.log('\n🧪 Testing regular user login without site/company...');
        
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'testuser',
            password: 'password123'
        });
        
        console.log('❌ This should have failed but succeeded:', response.data);
        
    } catch (error) {
        console.log('✅ Regular user login correctly failed without site/company');
        console.log('📋 Error:', error.response?.data?.message || error.message);
    }
}

// Test regular user login with site/company
async function testRegularUserLoginWithSite() {
    try {
        console.log('\n🧪 Testing regular user login with site/company...');
        
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'testuser',
            password: 'password123',
            site: 'Sion',
            company: 'Sion'
        });
        
        console.log('📋 Response:', response.data);
        
    } catch (error) {
        console.log('📋 Error:', error.response?.data?.message || error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting manager login tests...\n');
    
    await testManagerLogin();
    await testRegularUserLogin();
    await testRegularUserLoginWithSite();
    
    console.log('\n🎉 Tests completed!');
}

// Run if called directly
if (require.main === module) {
    runTests();
}

module.exports = { testManagerLogin, testRegularUserLogin, testRegularUserLoginWithSite }; 