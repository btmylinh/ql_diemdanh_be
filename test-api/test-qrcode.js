const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testActivityId = null;
let testUserId = null;

// Test data
const testUser = {
  email: 'qrtest2@example.com',
  password: 'password123',
  name: 'QR Test User 2',
  mssv: 'QR002',
  class: 'QR_CLASS'
};

const testActivity = {
  name: 'QR Code Test Activity',
  description: 'Test activity for QR code generation',
  location: 'QR Test Location',
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

async function testGenerateQRCode() {
  console.log('\n🧪 Testing: Generate QR code for activity');
  
  const result = await makeRequest('POST', `/activities/${testActivityId}/qr-code`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ QR code generated successfully');
    console.log('QR Code Data:', result.data.qrCode.data);
    console.log('QR Code Image (Base64):', result.data.qrCode.image.substring(0, 50) + '...');
    return result.data.qrCode.data;
  } else {
    console.error('❌ Failed to generate QR code:', result.error);
    return null;
  }
}

async function testGetQRCode() {
  console.log('\n🧪 Testing: Get QR code for activity');
  
  const result = await makeRequest('GET', `/activities/${testActivityId}/qr-code`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ QR code retrieved successfully');
    console.log('Activity:', result.data.activity.name);
    console.log('QR Code Data:', result.data.qrCode.data);
    return result.data.qrCode.data;
  } else {
    console.error('❌ Failed to get QR code:', result.error);
    return null;
  }
}

async function testValidateQRCode(qrData) {
  console.log('\n🧪 Testing: Validate QR code');
  
  const result = await makeRequest('POST', '/activities/validate-qr', {
    qrData: qrData
  }, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ QR code validation successful');
    console.log('Validated Activity:', result.data.activity.name);
    return true;
  } else {
    console.error('❌ QR code validation failed:', result.error);
    return false;
  }
}

async function testValidateInvalidQRCode() {
  console.log('\n🧪 Testing: Validate invalid QR code');
  
  const invalidQRData = '{"type":"invalid","activityId":999,"activityName":"Fake Activity"}';
  
  const result = await makeRequest('POST', '/activities/validate-qr', {
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

async function testGenerateQRCodeWithoutPermission() {
  console.log('\n🧪 Testing: Generate QR code without permission');
  
  // Create another user
  const anotherUser = {
    email: 'anotheruser2@example.com',
    password: 'password123',
    name: 'Another User 2',
    mssv: 'AU002',
    class: 'AU_CLASS'
  };
  
  const registerResult = await makeRequest('POST', '/auth/register', anotherUser);
  if (registerResult.success) {
    const anotherToken = registerResult.data.accessToken;
    
    // Try to generate QR code for activity created by first user
    const result = await makeRequest('POST', `/activities/${testActivityId}/qr-code`, null, {
      'Authorization': `Bearer ${anotherToken}`
    });
    
    if (!result.success && result.status === 403) {
      console.log('✅ Permission properly denied');
      return true;
    } else {
      console.error('❌ Permission should have been denied:', result);
      return false;
    }
  } else {
    // Try to login if user already exists
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: anotherUser.email,
      password: anotherUser.password
    });
    
    if (loginResult.success) {
      const anotherToken = loginResult.data.accessToken;
      
      // Try to generate QR code for activity created by first user
      const result = await makeRequest('POST', `/activities/${testActivityId}/qr-code`, null, {
        'Authorization': `Bearer ${anotherToken}`
      });
      
      if (!result.success && result.status === 403) {
        console.log('✅ Permission properly denied');
        return true;
      } else {
        console.error('❌ Permission should have been denied:', result);
        return false;
      }
    }
  }
  
  return false;
}

async function testGenerateQRCodeForNonExistentActivity() {
  console.log('\n🧪 Testing: Generate QR code for non-existent activity');
  
  const result = await makeRequest('POST', '/activities/99999/qr-code', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (!result.success && result.status === 404) {
    console.log('✅ Non-existent activity properly handled');
    return true;
  } else {
    console.error('❌ Non-existent activity should return 404:', result);
    return false;
  }
}

async function testGetQRCodeForActivityWithoutQR() {
  console.log('\n🧪 Testing: Get QR code for activity without QR code');
  
  // Create a new activity without generating QR code
  const newActivity = {
    name: 'Activity Without QR',
    description: 'Test activity without QR code',
    location: 'Test Location',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    max_participants: 5
  };
  
  const createResult = await makeRequest('POST', '/activities', newActivity, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (createResult.success) {
    const newActivityId = createResult.data.activity.id;
    
    const result = await makeRequest('GET', `/activities/${newActivityId}/qr-code`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (!result.success && result.status === 404) {
      console.log('✅ Activity without QR code properly handled');
      return true;
    } else {
      console.error('❌ Activity without QR code should return 404:', result);
      return false;
    }
  }
  
  return false;
}

async function testQRCodeDataStructure() {
  console.log('\n🧪 Testing: QR code data structure');
  
  const result = await makeRequest('GET', `/activities/${testActivityId}/qr-code`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    const qrData = JSON.parse(result.data.qrCode.data);
    
    // Check required fields
    const requiredFields = ['type', 'activityId', 'activityName', 'startTime', 'endTime', 'timestamp', 'hash'];
    const missingFields = requiredFields.filter(field => !qrData[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ QR code data structure is correct');
      console.log('QR Data:', qrData);
      return true;
    } else {
      console.error('❌ QR code data missing fields:', missingFields);
      return false;
    }
  } else {
    console.error('❌ Failed to get QR code for structure test:', result.error);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  // Note: In a real scenario, you might want to delete test activities
  // For now, we'll just log completion
  console.log('✅ Cleanup completed');
}

async function runTests() {
  console.log('🚀 Starting QR Code API Tests\n');
  
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
    { name: 'Generate QR code', fn: testGenerateQRCode },
    { name: 'Get QR code', fn: testGetQRCode },
    { name: 'Validate QR code', fn: async () => {
      const qrData = await testGenerateQRCode();
      return qrData ? await testValidateQRCode(qrData) : false;
    }},
    { name: 'Validate invalid QR code', fn: testValidateInvalidQRCode },
    { name: 'Generate QR without permission', fn: testGenerateQRCodeWithoutPermission },
    { name: 'Generate QR for non-existent activity', fn: testGenerateQRCodeForNonExistentActivity },
    { name: 'Get QR for activity without QR', fn: testGetQRCodeForActivityWithoutQR },
    { name: 'QR code data structure', fn: testQRCodeDataStructure }
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
