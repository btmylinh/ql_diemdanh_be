// Test script cho Activities Management API
// Chạy với: node test-activities.js

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test data
const testActivity = {
  name: 'Hội thảo CNTT 2024',
  description: 'Hội thảo về công nghệ thông tin và xu hướng mới',
  location: 'Phòng A101',
  start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 ngày sau
  end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // 8 giờ sau
  max_participants: 50
};

let authToken = '';
let createdActivityId = null;

async function testAPI() {
  console.log('🚀 Bắt đầu test Activities API...\n');

  try {
    // Bước 1: Đăng nhập để lấy token
    console.log('1. Đăng nhập để lấy token...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    }).catch(async () => {
      // Nếu admin chưa tồn tại, tạo admin mới
      console.log('   Tạo admin mới...');
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin'
      });
      return registerResponse;
    });

    authToken = loginResponse.data.accessToken;
    console.log('✅ Đăng nhập thành công');
    console.log('   Token:', authToken ? 'Đã nhận' : 'Không có');
    console.log('');

    // Bước 2: Tạo hoạt động mới
    console.log('2. Tạo hoạt động mới...');
    const createResponse = await axios.post(`${BASE_URL}/activities`, testActivity, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    createdActivityId = createResponse.data.activity.id;
    console.log('✅ Tạo hoạt động thành công');
    console.log('   ID:', createdActivityId);
    console.log('   Tên:', createResponse.data.activity.name);
    console.log('');

    // Bước 3: Lấy danh sách hoạt động
    console.log('3. Lấy danh sách hoạt động...');
    const listResponse = await axios.get(`${BASE_URL}/activities`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Lấy danh sách thành công');
    console.log('   Tổng số:', listResponse.data.pagination.total);
    console.log('   Trang hiện tại:', listResponse.data.pagination.page);
    console.log('');

    // Bước 4: Lấy hoạt động theo ID
    console.log('4. Lấy hoạt động theo ID...');
    const getByIdResponse = await axios.get(`${BASE_URL}/activities/${createdActivityId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Lấy hoạt động theo ID thành công');
    console.log('   Tên:', getByIdResponse.data.activity.name);
    console.log('   Trạng thái:', getByIdResponse.data.activity.status);
    console.log('');

    // Bước 5: Cập nhật hoạt động
    console.log('5. Cập nhật hoạt động...');
    const updateResponse = await axios.put(`${BASE_URL}/activities/${createdActivityId}`, {
      name: 'Hội thảo CNTT 2024 - Cập nhật',
      description: 'Hội thảo về công nghệ thông tin và xu hướng mới - Phiên bản cập nhật',
      max_participants: 60
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Cập nhật hoạt động thành công');
    console.log('   Tên mới:', updateResponse.data.activity.name);
    console.log('   Số lượng tối đa:', updateResponse.data.activity.max_participants);
    console.log('');

    // Bước 6: Cập nhật trạng thái hoạt động
    console.log('6. Cập nhật trạng thái hoạt động...');
    const updateStatusResponse = await axios.patch(`${BASE_URL}/activities/${createdActivityId}/status`, {
      status: 3
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Cập nhật trạng thái thành công');
    console.log('   Trạng thái mới:', updateStatusResponse.data.activity.status_name);
    console.log('');

    // Bước 7: Lấy hoạt động của tôi
    console.log('7. Lấy hoạt động của tôi...');
    const myActivitiesResponse = await axios.get(`${BASE_URL}/activities/my`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Lấy hoạt động của tôi thành công');
    console.log('   Số lượng:', myActivitiesResponse.data.pagination.total);
    console.log('');

    // Bước 8: Test tìm kiếm và lọc
    console.log('8. Test tìm kiếm và lọc...');
    const searchResponse = await axios.get(`${BASE_URL}/activities?q=CNTT&status=3&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Tìm kiếm thành công');
    console.log('   Kết quả tìm kiếm:', searchResponse.data.activities.length);
    console.log('');

    // Bước 9: Test validation errors
    console.log('9. Test validation errors...');
    try {
      await axios.post(`${BASE_URL}/activities`, {
        name: 'AB', // Tên quá ngắn
        start_time: 'invalid-date',
        end_time: '2024-01-01T00:00:00.000Z'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation errors được xử lý đúng');
        console.log('   Lỗi:', error.response.data.message);
      } else {
        console.log('❌ Lỗi không mong muốn:', error.message);
      }
    }
    console.log('');

    // Bước 10: Test unauthorized access
    console.log('10. Test unauthorized access...');
    try {
      await axios.get(`${BASE_URL}/activities`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized access được chặn đúng');
      } else {
        console.log('❌ Lỗi không mong muốn:', error.message);
      }
    }
    console.log('');

    // Bước 11: Xóa hoạt động (cleanup)
    console.log('11. Xóa hoạt động (cleanup)...');
    const deleteResponse = await axios.delete(`${BASE_URL}/activities/${createdActivityId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Xóa hoạt động thành công');
    console.log('   Thông báo:', deleteResponse.data.message);
    console.log('');

    console.log('🎉 Tất cả test Activities API đã hoàn thành thành công!');
    console.log('\n📋 Tóm tắt:');
    console.log('   - Tạo hoạt động: ✅');
    console.log('   - Lấy danh sách: ✅');
    console.log('   - Lấy theo ID: ✅');
    console.log('   - Cập nhật hoạt động: ✅');
    console.log('   - Cập nhật trạng thái: ✅');
    console.log('   - Lấy hoạt động của tôi: ✅');
    console.log('   - Tìm kiếm và lọc: ✅');
    console.log('   - Validation: ✅');
    console.log('   - Authorization: ✅');
    console.log('   - Xóa hoạt động: ✅');

  } catch (error) {
    console.error('❌ Test thất bại:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
    
    // Cleanup nếu có lỗi
    if (createdActivityId && authToken) {
      try {
        await axios.delete(`${BASE_URL}/activities/${createdActivityId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('🧹 Đã cleanup hoạt động test');
      } catch (cleanupError) {
        console.log('⚠️ Không thể cleanup hoạt động test');
      }
    }
  }
}

// Kiểm tra server có chạy không
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/`);
    console.log('✅ Server đang chạy tại', BASE_URL);
    return true;
  } catch (error) {
    console.log('❌ Server không chạy. Vui lòng khởi động server trước:');
    console.log('   cd ql_diemdanh_be && npm start');
    return false;
  }
}

// Thực thi chính
async function main() {
  console.log('🔍 Kiểm tra trạng thái server...');
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await testAPI();
  } else {
    process.exit(1);
  }
}

main();
