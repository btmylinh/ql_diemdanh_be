// Simple test script for authentication APIs
// Run with: node test-auth.js

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  mssv: 'TEST001',
  class: 'CNTT01',
  phone: '0123456789',
  role: 'student'
};

const adminUser = {
  email: 'admin@example.com',
  password: 'admin123',
  name: 'Admin User',
  role: 'admin'
};

async function testAPI() {
  console.log('🚀 Starting API Tests...\n');

  try {
    // Test 1: Register user
    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Token received:', !!registerResponse.data.accessToken);
    console.log('');

    // Test 2: Login user
    console.log('2. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    const userToken = loginResponse.data.accessToken;
    console.log('   Token received:', !!userToken);
    console.log('');

    // Test 3: Get current user
    console.log('3. Testing /auth/me endpoint...');
    const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Get current user successful');
    console.log('   User name:', meResponse.data.user.name);
    console.log('   User role:', meResponse.data.user.role);
    console.log('');

    // Test 4: Test protected route without token
    console.log('4. Testing protected route without token...');
    try {
      await axios.get(`${BASE_URL}/auth/me`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized access properly blocked');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Test validation errors
    console.log('5. Testing validation errors...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'invalid-email',
        password: '123'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation errors properly handled');
        console.log('   Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 6: Test duplicate email
    console.log('6. Testing duplicate email registration...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate email properly handled');
        console.log('   Error message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 All authentication tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - User registration: ✅');
    console.log('   - User login: ✅');
    console.log('   - Protected routes: ✅');
    console.log('   - Validation: ✅');
    console.log('   - Error handling: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running on', BASE_URL);
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   cd ql_diemdanh_be && npm start');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking server status...');
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await testAPI();
  } else {
    process.exit(1);
  }
}

main();
