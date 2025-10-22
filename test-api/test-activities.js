// Activities API Tests
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const testActivity = {
  name: 'Test Activity 2024',
  description: 'Test activity for API testing',
  location: 'Test Location',
  start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
  max_participants: 50,
  training_points: 10
};

let authToken = '';
let createdActivityId = null;

async function testActivities() {
  console.log('🚀 Activities API Tests\n');

  try {
    // 1. Login
    console.log('1. Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'manager@example.com',
      password: '123456'
    });
    authToken = loginResponse.data.accessToken;
    console.log('✅ Login OK');

    // 2. Create Activity
    console.log('2. Create Activity...');
    const createResult = await axios.post(`${BASE_URL}/activities`, testActivity, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    createdActivityId = createResult.data.activity.id;
    console.log(createResult.status === 201 ? '✅ Create OK' : '❌ Create Failed');

    // 3. Get Activity
    console.log('3. Get Activity...');
    const getResult = await axios.get(`${BASE_URL}/activities/${createdActivityId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(getResult.status === 200 ? '✅ Get OK' : '❌ Get Failed');

    // 4. Update Activity
    console.log('4. Update Activity...');
    const updateResult = await axios.put(`${BASE_URL}/activities/${createdActivityId}`, {
      ...testActivity,
      name: 'Updated Test Activity'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(updateResult.status === 200 ? '✅ Update OK' : '❌ Update Failed');

    // 5. Update Status
    console.log('5. Update Status...');
    const statusResult = await axios.patch(`${BASE_URL}/activities/${createdActivityId}/status`, {
      status: 1
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(statusResult.status === 200 ? '✅ Status OK' : '❌ Status Failed');

    // 6. Generate QR
    console.log('6. Generate QR...');
    const qrResult = await axios.post(`${BASE_URL}/activities/${createdActivityId}/qr-code`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(qrResult.status === 200 ? '✅ QR OK' : '❌ QR Failed');

    // 7. Validate QR
    console.log('7. Validate QR...');
    const validateResult = await axios.post(`${BASE_URL}/activities/validate-qr`, {
      qrData: qrResult.data.qrCode.data
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(validateResult.status === 200 ? '✅ Validate OK' : '❌ Validate Failed');

    // 8. Get My Activities
    console.log('8. My Activities...');
    const myResult = await axios.get(`${BASE_URL}/activities/my?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(myResult.status === 200 ? '✅ My Activities OK' : '❌ My Activities Failed');

    // 9. Cleanup
    console.log('9. Cleanup...');
    const deleteResult = await axios.delete(`${BASE_URL}/activities/${createdActivityId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(deleteResult.status === 200 ? '✅ Cleanup OK' : '❌ Cleanup Failed');

    console.log('\n🎉 Activities Tests Completed!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testActivities();