// Auth API Tests
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  mssv: 'TEST001',
  class: 'CNTT01',
  phone: '0123456789',
  role: 'student'
};

async function testAuth() {
  console.log('🚀 Auth API Tests\n');

  try {
    // 1. Register
    console.log('1. Register...');
    const registerResult = await axios.post(`${BASE_URL}/auth/register`, testUser).catch(e => e.response);
    console.log(registerResult.status === 201 ? '✅ Register OK' : '❌ Register Failed');

    // 2. Login
    console.log('2. Login...');
    const loginResult = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    const token = loginResult.data.accessToken;
    console.log(token ? '✅ Login OK' : '❌ Login Failed');

    // 3. Profile
    console.log('3. Profile...');
    const profileResult = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(profileResult.status === 200 ? '✅ Profile OK' : '❌ Profile Failed');

    // 4. Update Profile
    console.log('4. Update Profile...');
    const updateResult = await axios.put(`${BASE_URL}/auth/me`, {
      phone: '0987654321'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(updateResult.status === 200 ? '✅ Update OK' : '❌ Update Failed');

    // 5. Change Password
    console.log('5. Change Password...');
    const changePassResult = await axios.put(`${BASE_URL}/auth/change-password`, {
      currentPassword: testUser.password,
      newPassword: 'newpassword123'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(changePassResult.status === 200 ? '✅ Change Pass OK' : '❌ Change Pass Failed');

    console.log('\n🎉 Auth Tests Completed!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testAuth();