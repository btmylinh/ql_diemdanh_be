const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let adminToken = '';
let testActivityId = null;
let testUserId = null;
let testQRData = '';

// Test data
const testUser = {
  email: 'attendanceuser@example.com',
  password: 'password123',
  name: 'Attendance Test User',
  mssv: 'AT001',
  class: 'AT_CLASS'
};

const adminUser = {
  email: 'attendanceadmin@example.com',
  password: 'password123',
  name: 'Attendance Admin',
  mssv: 'AA001',
  class: 'AA_CLASS',
  role: 'admin'
};

const testActivity = {
  name: 'Attendance Test Activity',
  description: 'Test activity for attendance tracking',
  location: 'Attendance Test Location',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
  max_participants: 10
};

async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.log('Request error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  // Register test user
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  if (registerResult.success) {
    authToken = registerResult.data.accessToken;
    testUserId = registerResult.data.user.id;
    console.log('✅ Test user created and logged in');
  } else {
    // Try to login if user already exists
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    if (loginResult.success) {
      authToken = loginResult.data.accessToken;
      testUserId = loginResult.data.user.id;
      console.log('✅ Test user logged in');
    } else {
      console.error('❌ Failed to setup test user:', loginResult.error);
      return false;
    }
  }
  
  // Register admin user
  const adminRegisterResult = await makeRequest('POST', '/auth/register', adminUser);
  if (adminRegisterResult.success) {
    adminToken = adminRegisterResult.data.accessToken;
    console.log('✅ Admin user created and logged in');
  } else {
    // Try to login if admin already exists
    const adminLoginResult = await makeRequest('POST', '/auth/login', {
      email: adminUser.email,
      password: adminUser.password
    });
    if (adminLoginResult.success) {
      adminToken = adminLoginResult.data.accessToken;
      console.log('✅ Admin user logged in');
    } else {
      console.error('❌ Failed to setup admin user:', adminLoginResult.error);
      return false;
    }
  }
  
  // Create test activity
  const activityResult = await makeRequest('POST', '/activities', testActivity, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (activityResult.success) {
    testActivityId = activityResult.data.activity.id;
    console.log('✅ Test activity created');
  } else {
    console.error('❌ Failed to create test activity:', activityResult.error);
    return false;
  }
  
  // Register user for activity
  const registrationResult = await makeRequest('POST', '/registrations', {
    activityId: testActivityId
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (registrationResult.success) {
    console.log('✅ User registered for activity');
  } else {
    console.error('❌ Failed to register for activity:', registrationResult.error);
    return false;
  }
  
  // Generate QR code for activity
  const qrResult = await makeRequest('POST', `/activities/${testActivityId}/qr-code`, {}, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (qrResult.success) {
    testQRData = qrResult.data.qrCode.data;
    console.log('✅ QR code generated for activity');
  } else {
    console.error('❌ Failed to generate QR code:', qrResult.error);
    return false;
  }
  
  return true;
}

async function testCheckinQR() {
  console.log('\n🧪 Testing: Check in via QR code');
  
  const result = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: testQRData
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ QR checkin successful');
    console.log('Attendance:', result.data.attendance);
    return result.data.attendance.id;
  } else {
    console.error('❌ QR checkin failed:', result.error);
    return null;
  }
}

async function testCheckinQRDuplicate() {
  console.log('\n🧪 Testing: Check in via QR code (duplicate)');
  
  const result = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: testQRData
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 409) {
    console.log('✅ Duplicate checkin properly rejected');
    return true;
  } else {
    console.error('❌ Duplicate checkin should have been rejected:', result);
    return false;
  }
}

async function testCheckinQRInvalid() {
  console.log('\n🧪 Testing: Check in with invalid QR code');
  
  const invalidQRData = '{"type":"invalid","activityId":999,"activityName":"Fake Activity"}';
  
  const result = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: invalidQRData
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 400) {
    console.log('✅ Invalid QR code properly rejected');
    return true;
  } else {
    console.error('❌ Invalid QR code should have been rejected:', result);
    return false;
  }
}

async function testCheckinManual() {
  console.log('\n🧪 Testing: Manual check in');
  
  const result = await makeRequest('POST', '/attendances/checkin-manual', {
    activityId: testActivityId,
    userId: testUserId
  }, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success) {
    console.log('✅ Manual checkin successful');
    console.log('Attendance:', result.data.attendance);
    return true;
  } else {
    console.error('❌ Manual checkin failed:', result.error);
    return false;
  }
}

async function testGetMyAttendances() {
  console.log('\n🧪 Testing: Get my attendances');
  
  const result = await makeRequest('GET', '/attendances/my', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ My attendances retrieved');
    console.log('Attendances count:', result.data.attendances.length);
    return result.data.attendances.length > 0;
  } else {
    console.error('❌ Failed to get my attendances:', result.error);
    return false;
  }
}

async function testGetAttendanceById(attendanceId) {
  console.log('\n🧪 Testing: Get attendance by ID');
  
  const result = await makeRequest('GET', `/attendances/${attendanceId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Attendance by ID retrieved');
    console.log('Attendance:', result.data.attendance);
    return true;
  } else {
    console.error('❌ Failed to get attendance by ID:', result.error);
    return false;
  }
}

async function testGetActivityAttendances() {
  console.log('\n🧪 Testing: Get activity attendances');
  
  const result = await makeRequest('GET', `/attendances/activity/${testActivityId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Activity attendances retrieved');
    console.log('Attendances count:', result.data.attendances.length);
    return result.data.attendances.length > 0;
  } else {
    console.error('❌ Failed to get activity attendances:', result.error);
    return false;
  }
}

async function testGetAttendanceStats() {
  console.log('\n🧪 Testing: Get attendance statistics');
  
  const result = await makeRequest('GET', `/attendances/activity/${testActivityId}/stats`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Attendance statistics retrieved');
    console.log('Stats:', result.data.statistics);
    return true;
  } else {
    console.error('❌ Failed to get attendance statistics:', result.error);
    return false;
  }
}

async function testCheckinWithoutRegistration() {
  console.log('\n🧪 Testing: Check in without registration');
  
  // Create another user who is not registered
  const anotherUser = {
    email: 'notregistered@example.com',
    password: 'password123',
    name: 'Not Registered User',
    mssv: 'NR001',
    class: 'NR_CLASS'
  };
  
  const registerResult = await makeRequest('POST', '/auth/register', anotherUser);
  if (registerResult.success) {
    const anotherToken = registerResult.data.accessToken;
    
    const result = await makeRequest('POST', '/attendances/checkin-qr', {
      qrData: testQRData
    }, {
      'Authorization': `Bearer ${anotherToken}`
    });
    
    if (!result.success && result.status === 400) {
      console.log('✅ Checkin without registration properly rejected');
      return true;
    } else {
      console.error('❌ Checkin without registration should have been rejected:', result);
      return false;
    }
  }
  
  return false;
}

async function testCheckinWithoutAuth() {
  console.log('\n🧪 Testing: Check in without authentication');
  
  const result = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: testQRData
  });
  
  if (!result.success && result.status === 401) {
    console.log('✅ Unauthenticated checkin properly rejected');
    return true;
  } else {
    console.error('❌ Unauthenticated checkin should have been rejected:', result);
    return false;
  }
}

async function testManualCheckinWithoutPermission() {
  console.log('\n🧪 Testing: Manual check in without permission');
  
  const result = await makeRequest('POST', '/attendances/checkin-manual', {
    activityId: testActivityId,
    userId: testUserId
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 403) {
    console.log('✅ Manual checkin without permission properly rejected');
    return true;
  } else {
    console.error('❌ Manual checkin without permission should have been rejected:', result);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Note: In a real scenario, you might want to delete test data
  // For now, we'll just log completion
  console.log('✅ Cleanup completed');
}

async function runTests() {
  console.log('🚀 Starting Attendance Tracking API Tests\n');
  
  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.error('❌ Setup failed, aborting tests');
    return;
  }
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test cases
  const tests = [
    { name: 'Check in via QR code', fn: testCheckinQR },
    { name: 'Check in QR duplicate', fn: testCheckinQRDuplicate },
    { name: 'Check in with invalid QR', fn: testCheckinQRInvalid },
    { name: 'Manual check in', fn: testCheckinManual },
    { name: 'Get my attendances', fn: testGetMyAttendances },
    { name: 'Get attendance by ID', fn: async () => {
      const attendanceId = await testCheckinQR();
      return attendanceId ? await testGetAttendanceById(attendanceId) : false;
    }},
    { name: 'Get activity attendances', fn: testGetActivityAttendances },
    { name: 'Get attendance statistics', fn: testGetAttendanceStats },
    { name: 'Check in without registration', fn: testCheckinWithoutRegistration },
    { name: 'Check in without auth', fn: testCheckinWithoutAuth },
    { name: 'Manual check in without permission', fn: testManualCheckinWithoutPermission }
  ];
  
  // Run tests
  for (const test of tests) {
    totalTests++;
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name} - PASSED`);
      } else {
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR:`, error.message);
    }
  }
  
  // Cleanup
  await cleanup();
  
  // Results
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  makeRequest,
  setupTestData
};
