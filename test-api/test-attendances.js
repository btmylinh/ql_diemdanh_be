// Attendances API Tests
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

let authToken = '';
let activityId = null;

async function testAttendances() {
  console.log('🚀 Attendances API Tests\n');

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

    // 3. Register for Activity
    console.log('3. Register...');
    const registerResult = await axios.post(`${BASE_URL}/registrations`, {
      activityId: activityId
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(registerResult.status === 201 ? '✅ Register OK' : '❌ Register Failed');

    // 4. Get QR Code
    console.log('4. Get QR Code...');
    const qrResult = await axios.post(`${BASE_URL}/activities/${activityId}/qr-code`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(qrResult.status === 200 ? '✅ QR OK' : '❌ QR Failed');

    // 5. Check-in with QR
    console.log('5. Check-in QR...');
    const checkinResult = await axios.post(`${BASE_URL}/attendances/checkin-qr`, {
      qrData: qrResult.data.qrCode.data
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(checkinResult.status === 201 ? '✅ Check-in OK' : '❌ Check-in Failed');

    // 6. Get My Attendances
    console.log('6. My Attendances...');
    const myAttResult = await axios.get(`${BASE_URL}/attendances/my?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(myAttResult.status === 200 ? '✅ My Att OK' : '❌ My Att Failed');

    // 7. Get Activity Attendances
    console.log('7. Activity Attendances...');
    const actAttResult = await axios.get(`${BASE_URL}/attendances/activity/${activityId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(actAttResult.status === 200 ? '✅ Act Att OK' : '❌ Act Att Failed');

    console.log('\n🎉 Attendances Tests Completed!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testAttendances();