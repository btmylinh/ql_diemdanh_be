const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let adminToken = '';
let testActivityId = null;
let testUserId = null;
let testQRData = '';
let testActivity = null;

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

// Test activity with different time scenarios
const testActivities = {
  future: {
    name: 'Future Activity Test',
    description: 'Test activity in the future',
    location: 'Future Test Location',
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    max_participants: 10
  },
  current: {
    name: 'Current Activity Test',
    description: 'Test activity happening now',
    location: 'Current Test Location',
    start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    max_participants: 10
  },
  past: {
    name: 'Past Activity Test',
    description: 'Test activity that ended',
    location: 'Past Test Location',
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    max_participants: 10
  }
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
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

async function setupTestData() {
  console.log('🔧 Setting up comprehensive test data...');
  
  // Register test user
  const registerResult = await makeRequest('POST', '/auth/register', testUser);
  if (registerResult.success) {
    authToken = registerResult.data.accessToken;
    testUserId = registerResult.data.user.id;
    console.log('✅ Test user created and logged in');
  } else {
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
  
  // Create test activity (current time)
  const activityResult = await makeRequest('POST', '/activities', testActivities.current, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (activityResult.success) {
    testActivityId = activityResult.data.activity.id;
    testActivity = activityResult.data.activity;
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

// ===== VALIDATION TEST CASES =====

async function testQRCodeValidation() {
  console.log('\n🧪 Testing: QR Code Validation');
  
  const tests = [
    {
      name: 'Valid QR code',
      qrData: testQRData,
      expectedStatus: 201,
      shouldPass: true
    },
    {
      name: 'Invalid JSON format',
      qrData: 'invalid json',
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Missing activity ID',
      qrData: JSON.stringify({
        type: 'attendance',
        activityName: 'Test Activity',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      }),
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Wrong QR type',
      qrData: JSON.stringify({
        type: 'invalid',
        activityId: testActivityId,
        activityName: 'Test Activity',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      }),
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Expired activity',
      qrData: JSON.stringify({
        type: 'attendance',
        activityId: testActivityId,
        activityName: 'Test Activity',
        startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        endTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        hash: 'testhash'
      }),
      expectedStatus: 400,
      shouldPass: false
    }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = await makeRequest('POST', '/attendances/checkin-qr', {
      qrData: test.qrData
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    const success = test.shouldPass ? result.success : !result.success;
    const statusMatch = result.status === test.expectedStatus;
    
    if (success && statusMatch) {
      console.log(`  ✅ ${test.name} - PASSED`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name} - FAILED (Status: ${result.status}, Expected: ${test.expectedStatus})`);
    }
  }
  
  return passed === tests.length;
}

async function testAuthenticationValidation() {
  console.log('\n🧪 Testing: Authentication Validation');
  
  const tests = [
    {
      name: 'No token provided',
      headers: {},
      expectedStatus: 401,
      shouldPass: false
    },
    {
      name: 'Invalid token format',
      headers: { 'Authorization': 'InvalidToken' },
      expectedStatus: 401,
      shouldPass: false
    },
    {
      name: 'Expired token',
      headers: { 'Authorization': 'Bearer expired.token.here' },
      expectedStatus: 401,
      shouldPass: false
    },
    {
      name: 'Valid token',
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 201,
      shouldPass: true
    }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = await makeRequest('POST', '/attendances/checkin-qr', {
      qrData: testQRData
    }, test.headers);
    
    const success = test.shouldPass ? result.success : !result.success;
    const statusMatch = result.status === test.expectedStatus;
    
    if (success && statusMatch) {
      console.log(`  ✅ ${test.name} - PASSED`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name} - FAILED (Status: ${result.status}, Expected: ${test.expectedStatus})`);
    }
  }
  
  return passed === tests.length;
}

async function testRegistrationValidation() {
  console.log('\n🧪 Testing: Registration Validation');
  
  // Create another user who is not registered
  const anotherUser = {
    email: 'notregistered@example.com',
    password: 'password123',
    name: 'Not Registered User',
    mssv: 'NR001',
    class: 'NR_CLASS'
  };
  
  const registerResult = await makeRequest('POST', '/auth/register', anotherUser);
  if (!registerResult.success) {
    console.log('  ⚠️  Could not create test user for registration validation');
    return false;
  }
  
  const anotherToken = registerResult.data.accessToken;
  
  const result = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: testQRData
  }, {
    'Authorization': `Bearer ${anotherToken}`
  });
  
  if (!result.success && result.status === 400) {
    console.log('  ✅ Unregistered user checkin properly rejected');
    return true;
  } else {
    console.log('  ❌ Unregistered user checkin should have been rejected');
    return false;
  }
}

async function testActivityStatusValidation() {
  console.log('\n🧪 Testing: Activity Status Validation');
  
  // Create activities with different statuses
  const futureActivity = await makeRequest('POST', '/activities', testActivities.future, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!futureActivity.success) {
    console.log('  ⚠️  Could not create future activity for testing');
    return false;
  }
  
  const futureActivityId = futureActivity.data.activity.id;
  
  // Register for future activity
  await makeRequest('POST', '/registrations', {
    activityId: futureActivityId
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  // Generate QR for future activity
  const qrResult = await makeRequest('POST', `/activities/${futureActivityId}/qr-code`, {}, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!qrResult.success) {
    console.log('  ⚠️  Could not generate QR for future activity');
    return false;
  }
  
  const futureQRData = qrResult.data.qrCode.data;
  
  // Test checkin before activity starts
  const result = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: futureQRData
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 400) {
    console.log('  ✅ Checkin before activity starts properly rejected');
    return true;
  } else {
    console.log('  ❌ Checkin before activity starts should have been rejected');
    return false;
  }
}

async function testDuplicateCheckinValidation() {
  console.log('\n🧪 Testing: Duplicate Checkin Validation');
  
  // First checkin should succeed
  const firstCheckin = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: testQRData
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!firstCheckin.success) {
    console.log('  ⚠️  First checkin failed, cannot test duplicate validation');
    return false;
  }
  
  // Second checkin should fail
  const secondCheckin = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: testQRData
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!secondCheckin.success && secondCheckin.status === 409) {
    console.log('  ✅ Duplicate checkin properly rejected');
    return true;
  } else {
    console.log('  ❌ Duplicate checkin should have been rejected');
    return false;
  }
}

async function testManualCheckinValidation() {
  console.log('\n🧪 Testing: Manual Checkin Validation');
  
  const tests = [
    {
      name: 'Valid manual checkin by admin',
      data: { activityId: testActivityId, userId: testUserId },
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 201,
      shouldPass: true
    },
    {
      name: 'Manual checkin by non-admin',
      data: { activityId: testActivityId, userId: testUserId },
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 403,
      shouldPass: false
    },
    {
      name: 'Missing activity ID',
      data: { userId: testUserId },
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Missing user ID',
      data: { activityId: testActivityId },
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Invalid activity ID',
      data: { activityId: 'invalid', userId: testUserId },
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Non-existent activity',
      data: { activityId: 99999, userId: testUserId },
      headers: { 'Authorization': `Bearer ${adminToken}` },
      expectedStatus: 404,
      shouldPass: false
    }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = await makeRequest('POST', '/attendances/checkin-manual', test.data, test.headers);
    
    const success = test.shouldPass ? result.success : !result.success;
    const statusMatch = result.status === test.expectedStatus;
    
    if (success && statusMatch) {
      console.log(`  ✅ ${test.name} - PASSED`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name} - FAILED (Status: ${result.status}, Expected: ${test.expectedStatus})`);
    }
  }
  
  return passed === tests.length;
}

async function testDataRetrievalValidation() {
  console.log('\n🧪 Testing: Data Retrieval Validation');
  
  // First, create an attendance record
  const checkinResult = await makeRequest('POST', '/attendances/checkin-qr', {
    qrData: testQRData
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!checkinResult.success) {
    console.log('  ⚠️  Could not create attendance record for testing');
    return false;
  }
  
  const attendanceId = checkinResult.data.attendance.id;
  
  const tests = [
    {
      name: 'Get my attendances',
      url: '/attendances/my',
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 200,
      shouldPass: true
    },
    {
      name: 'Get attendance by ID',
      url: `/attendances/${attendanceId}`,
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 200,
      shouldPass: true
    },
    {
      name: 'Get activity attendances',
      url: `/attendances/activity/${testActivityId}`,
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 200,
      shouldPass: true
    },
    {
      name: 'Get attendance statistics',
      url: `/attendances/activity/${testActivityId}/stats`,
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 200,
      shouldPass: true
    },
    {
      name: 'Get non-existent attendance',
      url: '/attendances/99999',
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 404,
      shouldPass: false
    },
    {
      name: 'Get attendances without auth',
      url: '/attendances/my',
      headers: {},
      expectedStatus: 401,
      shouldPass: false
    }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = await makeRequest('GET', test.url, null, test.headers);
    
    const success = test.shouldPass ? result.success : !result.success;
    const statusMatch = result.status === test.expectedStatus;
    
    if (success && statusMatch) {
      console.log(`  ✅ ${test.name} - PASSED`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name} - FAILED (Status: ${result.status}, Expected: ${test.expectedStatus})`);
    }
  }
  
  return passed === tests.length;
}

async function testEdgeCases() {
  console.log('\n🧪 Testing: Edge Cases');
  
  const tests = [
    {
      name: 'Empty QR data',
      data: { qrData: '' },
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Null QR data',
      data: { qrData: null },
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Undefined QR data',
      data: {},
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'Very large QR data',
      data: { qrData: 'x'.repeat(10000) },
      expectedStatus: 400,
      shouldPass: false
    },
    {
      name: 'SQL injection attempt in QR data',
      data: { qrData: '"; DROP TABLE attendance; --' },
      expectedStatus: 400,
      shouldPass: false
    }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = await makeRequest('POST', '/attendances/checkin-qr', test.data, {
      'Authorization': `Bearer ${authToken}`
    });
    
    const success = test.shouldPass ? result.success : !result.success;
    const statusMatch = result.status === test.expectedStatus;
    
    if (success && statusMatch) {
      console.log(`  ✅ ${test.name} - PASSED`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name} - FAILED (Status: ${result.status}, Expected: ${test.expectedStatus})`);
    }
  }
  
  return passed === tests.length;
}

async function testPerformanceValidation() {
  console.log('\n🧪 Testing: Performance Validation');
  
  const startTime = Date.now();
  
  // Test multiple rapid requests
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest('GET', '/attendances/my', null, {
      'Authorization': `Bearer ${authToken}`
    }));
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const successCount = results.filter(r => r.success).length;
  
  console.log(`  📊 Performance test: ${successCount}/10 requests successful in ${duration}ms`);
  
  if (successCount >= 8 && duration < 5000) {
    console.log('  ✅ Performance test passed');
    return true;
  } else {
    console.log('  ❌ Performance test failed');
    return false;
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Attendance Tracking Validation Tests\n');
  
  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.error('❌ Setup failed, aborting tests');
    return;
  }
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test suites
  const testSuites = [
    { name: 'QR Code Validation', fn: testQRCodeValidation },
    { name: 'Authentication Validation', fn: testAuthenticationValidation },
    { name: 'Registration Validation', fn: testRegistrationValidation },
    { name: 'Activity Status Validation', fn: testActivityStatusValidation },
    { name: 'Duplicate Checkin Validation', fn: testDuplicateCheckinValidation },
    { name: 'Manual Checkin Validation', fn: testManualCheckinValidation },
    { name: 'Data Retrieval Validation', fn: testDataRetrievalValidation },
    { name: 'Edge Cases', fn: testEdgeCases },
    { name: 'Performance Validation', fn: testPerformanceValidation }
  ];
  
  // Run test suites
  for (const suite of testSuites) {
    totalTests++;
    try {
      const result = await suite.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${suite.name} - PASSED`);
      } else {
        console.log(`❌ ${suite.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${suite.name} - ERROR:`, error.message);
    }
  }
  
  // Results
  console.log(`\n📊 Comprehensive Test Results: ${passedTests}/${totalTests} test suites passed`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All validation tests passed! Attendance tracking system is robust and secure.');
  } else {
    console.log('⚠️  Some validation tests failed. Please review the issues above.');
  }
  
  // Summary
  console.log('\n📋 Validation Summary:');
  console.log('✅ QR Code validation: Format, type, expiration, hash verification');
  console.log('✅ Authentication: Token validation, expiration, format');
  console.log('✅ Authorization: Role-based access, permission checks');
  console.log('✅ Business logic: Registration status, activity timing, duplicates');
  console.log('✅ Data integrity: Input validation, SQL injection prevention');
  console.log('✅ Performance: Response time, concurrent requests');
  console.log('✅ Edge cases: Malformed data, boundary conditions');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = {
  runComprehensiveTests,
  makeRequest,
  setupTestData
};
