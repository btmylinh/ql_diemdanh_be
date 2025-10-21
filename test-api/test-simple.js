const axios = require('axios');

async function testSimple() {
  try {
    console.log('🧪 Testing simple API call...');
    
    const response = await axios.get('http://localhost:3000/');
    console.log('✅ Root endpoint works:', response.data);
    
    // Test auth register
    const registerResponse = await axios.post('http://localhost:3000/auth/register', {
      email: 'simpletest@example.com',
      password: 'password123',
      name: 'Simple Test User',
      mssv: 'ST001',
      class: 'ST_CLASS'
    });
    
    console.log('✅ Register works:', registerResponse.data.message);
    
    const token = registerResponse.data.accessToken;
    
    // Test create activity
    const activityResponse = await axios.post('http://localhost:3000/activities', {
      name: 'Simple Test Activity',
      description: 'Test activity',
      location: 'Test Location',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
      max_participants: 5
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Create activity works:', activityResponse.data.message);
    
    const activityId = activityResponse.data.activity.id;
    
    // Test generate QR code
    const qrResponse = await axios.post(`http://localhost:3000/activities/${activityId}/qr-code`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Generate QR code works:', qrResponse.data.message);
    console.log('QR Data:', qrResponse.data.qrCode.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSimple();

