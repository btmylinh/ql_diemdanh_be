// Registrations API Tests
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

let authToken = '';
let activityId = null;

async function testRegistrations() {
  console.log('🚀 Registrations API Tests\n');

  try {
    // 1. Login
    console.log('1. Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'student@example.com',
      password: '123456'
    });
    authToken = loginResponse.data.accessToken;
    console.log('✅ Login OK');

    // 2. Get Activities
    console.log('2. Get Activities...');
    const activitiesResult = await axios.get(`${BASE_URL}/activities?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    activityId = activitiesResult.data.activities[0]?.id;
    console.log(activityId ? '✅ Activities OK' : '❌ Activities Failed');

    // 3. Register
    console.log('3. Register...');
    const registerResult = await axios.post(`${BASE_URL}/registrations`, {
      activityId: activityId
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(registerResult.status === 201 ? '✅ Register OK' : '❌ Register Failed');

    // 4. Get My Registrations
    console.log('4. My Registrations...');
    const myRegResult = await axios.get(`${BASE_URL}/registrations/my?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(myRegResult.status === 200 ? '✅ My Reg OK' : '❌ My Reg Failed');

    // 5. Cancel Registration
    console.log('5. Cancel Registration...');
    const cancelResult = await axios.delete(`${BASE_URL}/registrations/${activityId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(cancelResult.status === 200 ? '✅ Cancel OK' : '❌ Cancel Failed');

    console.log('\n🎉 Registrations Tests Completed!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testRegistrations();