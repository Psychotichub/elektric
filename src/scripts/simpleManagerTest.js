const axios = require('axios');

async function testManagerLogin() {
    try {
        console.log('🧪 Testing manager login...');
        
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'manager1',
            password: 'manager123'
        }, {
            timeout: 5000
        });
        
        console.log('✅ Manager login successful!');
        console.log('📋 Response:', response.data);
        
    } catch (error) {
        console.error('❌ Manager login failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testManagerLogin(); 