const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testActivityId = null;
let testUserId = null;

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'password123',
  name: 'Test User',
  mssv: 'TEST001',
  class: 'TEST_CLASS'
};

const testActivity = {
  name: 'Test Activity for Registration',
  description: 'Test activity for registration testing',
  location: 'Test Location',
  start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
  max_participants: 5
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
  
  return true;
}

async function testRegisterActivity() {
  console.log('\n🧪 Testing: Register for activity');
  
  const result = await makeRequest('POST', '/registrations', {
    activityId: testActivityId
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Registration successful:', result.data);
    return result.data.registration.id;
  } else {
    console.error('❌ Registration failed:', result.error);
    return null;
  }
}

async function testRegisterDuplicate() {
  console.log('\n🧪 Testing: Register for same activity (duplicate)');
  
  const result = await makeRequest('POST', '/registrations', {
    activityId: testActivityId
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 409) {
    console.log('✅ Duplicate registration properly rejected');
    return true;
  } else {
    console.error('❌ Duplicate registration should have been rejected:', result);
    return false;
  }
}

async function testGetMyRegistrations() {
  console.log('\n🧪 Testing: Get my registrations');
  
  const result = await makeRequest('GET', '/registrations/my', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ My registrations retrieved:', result.data);
    return result.data.registrations.length > 0;
  } else {
    console.error('❌ Failed to get my registrations:', result.error);
    return false;
  }
}

async function testGetRegistrationById(registrationId) {
  console.log('\n🧪 Testing: Get registration by ID');
  
  const result = await makeRequest('GET', `/registrations/${registrationId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Registration by ID retrieved:', result.data);
    return true;
  } else {
    console.error('❌ Failed to get registration by ID:', result.error);
    return false;
  }
}

async function testCancelRegistration() {
  console.log('\n🧪 Testing: Cancel registration');
  
  const result = await makeRequest('DELETE', `/registrations/${testActivityId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Registration cancelled:', result.data);
    return true;
  } else {
    console.error('❌ Failed to cancel registration:', result.error);
    return false;
  }
}

async function testCancelNonExistentRegistration() {
  console.log('\n🧪 Testing: Cancel non-existent registration');
  
  const result = await makeRequest('DELETE', '/registrations/99999', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 404) {
    console.log('✅ Non-existent registration properly handled');
    return true;
  } else {
    console.error('❌ Non-existent registration should return 404:', result);
    return false;
  }
}

async function testRegisterInvalidActivity() {
  console.log('\n🧪 Testing: Register for invalid activity');
  
  const result = await makeRequest('POST', '/registrations', {
    activityId: 99999
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 404) {
    console.log('✅ Invalid activity properly handled');
    return true;
  } else {
    console.error('❌ Invalid activity should return 404:', result);
    return false;
  }
}

async function testRegisterWithoutAuth() {
  console.log('\n🧪 Testing: Register without authentication');
  
  const result = await makeRequest('POST', '/registrations', {
    activityId: testActivityId
  });
  
  if (!result.success && result.status === 401) {
    console.log('✅ Unauthenticated request properly rejected');
    return true;
  } else {
    console.error('❌ Unauthenticated request should return 401:', result);
    return false;
  }
}

async function testRegisterInvalidData() {
  console.log('\n🧪 Testing: Register with invalid data');
  
  const result = await makeRequest('POST', '/registrations', {
    // Missing activityId
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 400) {
    console.log('✅ Invalid data properly handled');
    return true;
  } else {
    console.error('❌ Invalid data should return 400:', result);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Cancel any remaining registrations
  if (testActivityId) {
    await makeRequest('DELETE', `/registrations/${testActivityId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });
  }
  
  console.log('✅ Cleanup completed');
}

async function runTests() {
  console.log('🚀 Starting Registration API Tests\n');
  
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
    { name: 'Register for activity', fn: testRegisterActivity },
    { name: 'Register duplicate', fn: testRegisterDuplicate },
    { name: 'Get my registrations', fn: testGetMyRegistrations },
    { name: 'Get registration by ID', fn: async () => {
      // Get existing registration ID from my registrations
      const myRegistrationsResult = await makeRequest('GET', '/registrations/my', null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (myRegistrationsResult.success && myRegistrationsResult.data.registrations.length > 0) {
        const registrationId = myRegistrationsResult.data.registrations[0].id;
        return await testGetRegistrationById(registrationId);
      }
      return false;
    }},
    { name: 'Cancel registration', fn: testCancelRegistration },
    { name: 'Cancel non-existent registration', fn: testCancelNonExistentRegistration },
    { name: 'Register invalid activity', fn: testRegisterInvalidActivity },
    { name: 'Register without auth', fn: testRegisterWithoutAuth },
    { name: 'Register invalid data', fn: testRegisterInvalidData }
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
