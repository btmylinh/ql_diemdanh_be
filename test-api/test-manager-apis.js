// Manager API Tests
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const managerCredentials = { email: 'manager@example.com', password: '123456' };
let authToken = '';

const makeRequest = async (method, endpoint, data = null) => {
  try {
    const response = await axios({
      method, url: `${BASE_URL}${endpoint}`,
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      data
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
};

const testActivity = {
  name: 'Test Activity Manager',
  description: 'Test activity created by manager',
  location: 'Test Location',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
  max_participants: 50,
  training_points: 10
};

async function testManagerAPIs() {
  console.log('🚀 Manager API Tests\n');

  try {
    // 1. Login
    console.log('1. Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, managerCredentials);
    authToken = loginResponse.data.accessToken;
    console.log('✅ Login OK');

    // 2. Profile
    console.log('2. Profile...');
    const meResult = await makeRequest('GET', '/auth/me');
    console.log(meResult.success ? '✅ Profile OK' : '❌ Profile Failed');

    // 3. My Activities
    console.log('3. My Activities...');
    const myActivitiesResult = await makeRequest('GET', '/activities/my?page=1&limit=10');
    console.log(myActivitiesResult.success ? '✅ Activities OK' : '❌ Activities Failed');

    // 4. Create Activity
    console.log('4. Create Activity...');
    const createActivityResult = await makeRequest('POST', '/activities', testActivity);
    let activityId = createActivityResult.data.activity?.id;
    console.log(createActivityResult.success ? '✅ Create OK' : '❌ Create Failed');

    // 5. Get Activity
    console.log('5. Get Activity...');
    const getActivityResult = await makeRequest('GET', `/activities/${activityId}`);
    console.log(getActivityResult.success ? '✅ Get OK' : '❌ Get Failed');

    // 6. Update Activity
    console.log('6. Update Activity...');
    const updateActivityResult = await makeRequest('PUT', `/activities/${activityId}`, {
      ...testActivity,
      name: 'Updated Test Activity',
      training_points: 15
    });
    console.log(updateActivityResult.success ? '✅ Update OK' : '❌ Update Failed');

    // 7. Update Status
    console.log('7. Update Status...');
    const updateStatusResult = await makeRequest('PATCH', `/activities/${activityId}/status`, { status: 1 });
    console.log(updateStatusResult.success ? '✅ Status OK' : '❌ Status Failed');

    // 8. Generate QR
    console.log('8. Generate QR...');
    const qrResult = await makeRequest('POST', `/activities/${activityId}/qr-code`);
    console.log(qrResult.success ? '✅ QR OK' : '❌ QR Failed');

    // 9. Get Registrations
    console.log('9. Get Registrations...');
    const regResult = await makeRequest('GET', `/activities/${activityId}/registrations`);
    console.log(regResult.success ? '✅ Registrations OK' : '❌ Registrations Failed');

    // 10. Get Registration Stats
    console.log('10. Registration Stats...');
    const regStatsResult = await makeRequest('GET', `/activities/${activityId}/registrations/stats`);
    console.log(regStatsResult.success ? '✅ Stats OK' : '❌ Stats Failed');

    // 11. Export Registrations
    console.log('11. Export Registrations...');
    const exportResult = await makeRequest('GET', `/activities/${activityId}/registrations/export`);
    console.log(exportResult.success ? '✅ Export OK' : '❌ Export Failed');

    // 12. Get All Registrations
    console.log('12. All Registrations...');
    const allRegResult = await makeRequest('GET', '/registrations?page=1&limit=10');
    console.log(allRegResult.success ? '✅ All Reg OK' : '❌ All Reg Failed');

    // 13. Get Attendances
    console.log('13. Get Attendances...');
    const attResult = await makeRequest('GET', `/attendances/activity/${activityId}`);
    console.log(attResult.success ? '✅ Attendances OK' : '❌ Attendances Failed');

    // 14. Get Attendance Stats
    console.log('14. Attendance Stats...');
    const attStatsResult = await makeRequest('GET', `/attendances/activity/${activityId}/stats`);
    console.log(attStatsResult.success ? '✅ Att Stats OK' : '❌ Att Stats Failed');

    // 15. Manual Check-in
    console.log('15. Manual Check-in...');
    const checkinResult = await makeRequest('POST', '/attendances/checkin-manual', {
      activityId: activityId,
      userId: 1
    });
    console.log(checkinResult.success ? '✅ Check-in OK' : '❌ Check-in Failed');

    // 16. Cleanup
    console.log('16. Cleanup...');
    const deleteResult = await makeRequest('DELETE', `/activities/${activityId}`);
    console.log(deleteResult.success ? '✅ Cleanup OK' : '❌ Cleanup Failed');

    console.log('\n🎉 Manager API Tests Completed!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testManagerAPIs();