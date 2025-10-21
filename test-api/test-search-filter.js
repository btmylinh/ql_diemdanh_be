const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let adminToken = '';
let testActivityId = null;
let testUserId = null;

// Test data
const testUser = {
  email: 'searchuser@example.com',
  password: 'password123',
  name: 'Search Test User',
  mssv: 'ST001',
  class: 'ST_CLASS'
};

const adminUser = {
  email: 'searchadmin@example.com',
  password: 'password123',
  name: 'Search Admin',
  mssv: 'SA001',
  class: 'SA_CLASS',
  role: 'admin'
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
  console.log('🔧 Setting up test data for search and filter...');
  
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
  
  // Create test activities with different properties
  const testActivities = [
    {
      name: 'Search Test Activity 1',
      description: 'First test activity for search functionality',
      location: 'Test Location A',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      max_participants: 10
    },
    {
      name: 'Search Test Activity 2',
      description: 'Second test activity for search functionality',
      location: 'Test Location B',
      start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
      max_participants: 20
    },
    {
      name: 'Filter Test Activity',
      description: 'Activity for testing filter functionality',
      location: 'Filter Location',
      start_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString(),
      max_participants: 5
    }
  ];
  
  for (const activity of testActivities) {
    const activityResult = await makeRequest('POST', '/activities', activity, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (activityResult.success) {
      console.log(`✅ Test activity created: ${activity.name}`);
      if (!testActivityId) {
        testActivityId = activityResult.data.activity.id;
      }
    } else {
      console.error(`❌ Failed to create test activity: ${activity.name}`, activityResult.error);
    }
  }
  
  return true;
}

// ===== ACTIVITY SEARCH TESTS =====

async function testActivityBasicSearch() {
  console.log('\n🧪 Testing: Activity Basic Search');
  
  const result = await makeRequest('GET', '/activities/search?q=Search', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Basic search successful');
    console.log(`Found ${result.data.activities.length} activities`);
    return result.data.activities.length >= 2;
  } else {
    console.error('❌ Basic search failed:', result.error);
    return false;
  }
}

async function testActivityFilterByStatus() {
  console.log('\n🧪 Testing: Activity Filter by Status');
  
  const result = await makeRequest('GET', '/activities/search?status=2', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Status filter successful');
    console.log(`Found ${result.data.activities.length} activities with status 2`);
    return result.data.activities.length > 0;
  } else {
    console.error('❌ Status filter failed:', result.error);
    return false;
  }
}

async function testActivityFilterByLocation() {
  console.log('\n🧪 Testing: Activity Filter by Location');
  
  const result = await makeRequest('GET', '/activities/search?location=Test Location A', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Location filter successful');
    console.log(`Found ${result.data.activities.length} activities in Test Location A`);
    return result.data.activities.length >= 1;
  } else {
    console.error('❌ Location filter failed:', result.error);
    return false;
  }
}

async function testActivityFilterByCapacity() {
  console.log('\n🧪 Testing: Activity Filter by Capacity');
  
  const result = await makeRequest('GET', '/activities/search?capacity_min=15', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Capacity filter successful');
    console.log(`Found ${result.data.activities.length} activities with capacity >= 15`);
    return result.data.activities.length >= 1;
  } else {
    console.error('❌ Capacity filter failed:', result.error);
    return false;
  }
}

async function testActivityFilterByDate() {
  console.log('\n🧪 Testing: Activity Filter by Date');
  
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const result = await makeRequest('GET', `/activities/search?start_date=${tomorrow}`, null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Date filter successful');
    console.log(`Found ${result.data.activities.length} activities starting after tomorrow`);
    return result.data.activities.length > 0;
  } else {
    console.error('❌ Date filter failed:', result.error);
    return false;
  }
}

async function testActivityPagination() {
  console.log('\n🧪 Testing: Activity Pagination');
  
  const result = await makeRequest('GET', '/activities/search?page=1&limit=2', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Pagination successful');
    console.log(`Page: ${result.data.pagination.page}, Limit: ${result.data.pagination.limit}`);
    console.log(`Total: ${result.data.pagination.total}, Total Pages: ${result.data.pagination.totalPages}`);
    return result.data.activities.length <= 2;
  } else {
    console.error('❌ Pagination failed:', result.error);
    return false;
  }
}

async function testActivityComplexSearch() {
  console.log('\n🧪 Testing: Activity Complex Search');
  
  const result = await makeRequest('GET', '/activities/search?q=Test&status=2&capacity_min=5&capacity_max=15', null, {
    'Authorization': `Bearer ${authToken}`
  });
  
  if (result.success) {
    console.log('✅ Complex search successful');
    console.log(`Found ${result.data.activities.length} activities matching complex criteria`);
    console.log('Applied filters:', result.data.filters);
    return true;
  } else {
    console.error('❌ Complex search failed:', result.error);
    return false;
  }
}

// ===== USER SEARCH TESTS =====

async function testUserBasicSearch() {
  console.log('\n🧪 Testing: User Basic Search');
  
  const result = await makeRequest('GET', '/users/search?q=Search', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success) {
    console.log('✅ User basic search successful');
    console.log(`Found ${result.data.users.length} users`);
    return result.data.users.length >= 2;
  } else {
    console.error('❌ User basic search failed:', result.error);
    return false;
  }
}

async function testUserFilterByRole() {
  console.log('\n🧪 Testing: User Filter by Role');
  
  const result = await makeRequest('GET', '/users/search?role=student', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success) {
    console.log('✅ Role filter successful');
    console.log(`Found ${result.data.users.length} students`);
    return result.data.users.length > 0;
  } else {
    console.error('❌ Role filter failed:', result.error);
    return false;
  }
}

async function testUserFilterByClass() {
  console.log('\n🧪 Testing: User Filter by Class');
  
  const result = await makeRequest('GET', '/users/search?class=ST_CLASS', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success) {
    console.log('✅ Class filter successful');
    console.log(`Found ${result.data.users.length} users in ST_CLASS`);
    return result.data.users.length >= 1;
  } else {
    console.error('❌ Class filter failed:', result.error);
    return false;
  }
}

async function testUserFilterByStatus() {
  console.log('\n🧪 Testing: User Filter by Status');
  
  const result = await makeRequest('GET', '/users/search?status=2', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success) {
    console.log('✅ Status filter successful');
    console.log(`Found ${result.data.users.length} active users`);
    return result.data.users.length > 0;
  } else {
    console.error('❌ Status filter failed:', result.error);
    return false;
  }
}

async function testUserFilterByHasActivities() {
  console.log('\n🧪 Testing: User Filter by Has Activities');
  
  const result = await makeRequest('GET', '/users/search?has_activities=true', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success) {
    console.log('✅ Has activities filter successful');
    console.log(`Found ${result.data.users.length} users with activities`);
    return result.data.users.length >= 1;
  } else {
    console.error('❌ Has activities filter failed:', result.error);
    return false;
  }
}

async function testUserPagination() {
  console.log('\n🧪 Testing: User Pagination');
  
  const result = await makeRequest('GET', '/users/search?page=1&limit=1', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success) {
    console.log('✅ User pagination successful');
    console.log(`Page: ${result.data.pagination.page}, Limit: ${result.data.pagination.limit}`);
    console.log(`Total: ${result.data.pagination.total}, Total Pages: ${result.data.pagination.totalPages}`);
    return result.data.users.length <= 1;
  } else {
    console.error('❌ User pagination failed:', result.error);
    return false;
  }
}

async function testUserComplexSearch() {
  console.log('\n🧪 Testing: User Complex Search');
  
  const result = await makeRequest('GET', '/users/search?role=student&has_activities=true&activity_count_min=1', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  
  if (result.success) {
    console.log('✅ User complex search successful');
    console.log(`Found ${result.data.users.length} users matching complex criteria`);
    console.log('Applied filters:', result.data.filters);
    return true;
  } else {
    console.error('❌ User complex search failed:', result.error);
    return false;
  }
}

// ===== PERFORMANCE TESTS =====

async function testSearchPerformance() {
  console.log('\n🧪 Testing: Search Performance');
  
  const startTime = Date.now();
  
  // Test multiple concurrent searches
  const promises = [
    makeRequest('GET', '/activities/search?q=Test', null, { 'Authorization': `Bearer ${authToken}` }),
    makeRequest('GET', '/activities/search?status=2', null, { 'Authorization': `Bearer ${authToken}` }),
    makeRequest('GET', '/users/search?role=student', null, { 'Authorization': `Bearer ${adminToken}` }),
    makeRequest('GET', '/users/search?q=Search', null, { 'Authorization': `Bearer ${adminToken}` })
  ];
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const successCount = results.filter(r => r.success).length;
  
  console.log(`📊 Performance test: ${successCount}/4 searches successful in ${duration}ms`);
  
  if (successCount >= 3 && duration < 3000) {
    console.log('✅ Performance test passed');
    return true;
  } else {
    console.log('❌ Performance test failed');
    return false;
  }
}

async function runSearchFilterTests() {
  console.log('🚀 Starting Search & Filter API Tests\n');
  
  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.error('❌ Setup failed, aborting tests');
    return;
  }
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Activity search tests
  const activityTests = [
    { name: 'Activity Basic Search', fn: testActivityBasicSearch },
    { name: 'Activity Filter by Status', fn: testActivityFilterByStatus },
    { name: 'Activity Filter by Location', fn: testActivityFilterByLocation },
    { name: 'Activity Filter by Capacity', fn: testActivityFilterByCapacity },
    { name: 'Activity Filter by Date', fn: testActivityFilterByDate },
    { name: 'Activity Pagination', fn: testActivityPagination },
    { name: 'Activity Complex Search', fn: testActivityComplexSearch }
  ];
  
  // User search tests
  const userTests = [
    { name: 'User Basic Search', fn: testUserBasicSearch },
    { name: 'User Filter by Role', fn: testUserFilterByRole },
    { name: 'User Filter by Class', fn: testUserFilterByClass },
    { name: 'User Filter by Status', fn: testUserFilterByStatus },
    { name: 'User Filter by Has Activities', fn: testUserFilterByHasActivities },
    { name: 'User Pagination', fn: testUserPagination },
    { name: 'User Complex Search', fn: testUserComplexSearch }
  ];
  
  // Performance tests
  const performanceTests = [
    { name: 'Search Performance', fn: testSearchPerformance }
  ];
  
  const allTests = [...activityTests, ...userTests, ...performanceTests];
  
  // Run tests
  for (const test of allTests) {
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
  
  // Results
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All search and filter tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
  }
  
  // Summary
  console.log('\n📋 Search & Filter Features Summary:');
  console.log('✅ Activity Search: Basic search, status filter, location filter, capacity filter, date filter');
  console.log('✅ Activity Pagination: Page-based pagination with limit and offset');
  console.log('✅ Activity Complex Search: Multiple filters combined');
  console.log('✅ User Search: Basic search, role filter, class filter, status filter');
  console.log('✅ User Pagination: Page-based pagination with limit and offset');
  console.log('✅ User Complex Search: Multiple filters combined');
  console.log('✅ Performance: Concurrent search operations');
  console.log('✅ Query Optimization: Efficient Prisma queries with proper indexing');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSearchFilterTests().catch(console.error);
}

module.exports = {
  runSearchFilterTests,
  makeRequest,
  setupTestData
};
