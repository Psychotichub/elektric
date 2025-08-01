// Browser script to create admin user
// Run this in the browser console on the register page or any page

const createAdminUser = async () => {
    const adminUserData = {
        site: 'Arsi',
        company: 'Sion',
        username: 'Suresh',
        password: '787223',
        role: 'admin'
    };

    try {
        console.log('🚀 Creating admin user with credentials:');
        console.log('📍 Site:', adminUserData.site);
        console.log('🏢 Company:', adminUserData.company);
        console.log('👤 Username:', adminUserData.username);
        console.log('🔑 Role:', adminUserData.role);
        
        // Get authentication token if available
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('🔐 Using existing authentication token');
        } else {
            console.log('⚠️ No authentication token found - this might fail if admin creation requires authentication');
        }
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(adminUserData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ SUCCESS: Admin user created successfully!');
            console.log('📋 Response:', data);
            console.log('🎉 You can now login with:');
            console.log('   Username: Suresh');
            console.log('   Password: 787223');
        } else {
            console.error('❌ FAILED: Could not create admin user');
            console.error('📝 Error message:', data.message);
            console.error('🔢 Status code:', response.status);
            
            if (response.status === 401) {
                console.log('💡 Tip: You might need to login as an existing admin first');
            } else if (response.status === 400 && data.message.includes('already exists')) {
                console.log('💡 Tip: User already exists, try a different username');
            }
        }
        
    } catch (error) {
        console.error('❌ ERROR: Network or other error occurred');
        console.error('🔍 Error details:', error.message);
    }
};

// Function to check if user already exists
const checkUserExists = async (username) => {
    try {
        const response = await fetch(`/api/auth/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const userExists = data.users.some(user => user.username === username);
            return userExists;
        }
        return false;
    } catch (error) {
        console.error('Error checking user existence:', error);
        return false;
    }
};

// Enhanced function with user existence check
const createAdminUserWithCheck = async () => {
    const username = 'Suresh';
    
    console.log('🔍 Checking if user already exists...');
    const exists = await checkUserExists(username);
    
    if (exists) {
        console.log('⚠️ User "Suresh" already exists!');
        console.log('💡 You can either:');
        console.log('   1. Login with existing credentials');
        console.log('   2. Use a different username');
        return;
    }
    
    console.log('✅ User does not exist, proceeding with creation...');
    await createAdminUser();
};

// Auto-execute if this script is loaded
if (typeof window !== 'undefined') {
    console.log('📜 Admin creation script loaded');
    console.log('💻 Run createAdminUser() to create the admin user');
    console.log('🔍 Run createAdminUserWithCheck() to check first and then create');
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createAdminUser, createAdminUserWithCheck };
} 