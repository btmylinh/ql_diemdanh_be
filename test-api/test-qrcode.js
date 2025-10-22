// QR Code API Tests
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

let authToken = '';
let activityId = null;

async function testQRCode() {
  console.log('🚀 QR Code API Tests\n');

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
    const createResult = await axios.post(`${BASE_URL}/activities`, {
      name: 'QR Test Activity',
      description: 'Test activity for QR code testing',
      location: 'Test Location',
      start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      max_participants: 10
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    activityId = createResult.data.activity.id;
    console.log(createResult.status === 201 ? '✅ Create OK' : '❌ Create Failed');

    // 3. Generate QR Code
    console.log('3. Generate QR...');
    const qrResult = await axios.post(`${BASE_URL}/activities/${activityId}/qr-code`, {}, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(qrResult.status === 200 ? '✅ Generate OK' : '❌ Generate Failed');

    // 4. Validate QR Code
    console.log('4. Validate QR...');
    const validateResult = await axios.post(`${BASE_URL}/activities/validate-qr`, {
      qrData: qrResult.data.qrCode.data
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(validateResult.status === 200 ? '✅ Validate OK' : '❌ Validate Failed');

    // 5. Test Invalid QR
    console.log('5. Invalid QR...');
    const invalidResult = await axios.post(`${BASE_URL}/activities/validate-qr`, {
      qrData: 'invalid-qr-data'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(invalidResult.status === 400 ? '✅ Invalid QR OK' : '❌ Invalid QR Failed');

    // 6. Cleanup
    console.log('6. Cleanup...');
    const deleteResult = await axios.delete(`${BASE_URL}/activities/${activityId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log(deleteResult.status === 200 ? '✅ Cleanup OK' : '❌ Cleanup Failed');

    console.log('\n🎉 QR Code Tests Completed!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testQRCode();