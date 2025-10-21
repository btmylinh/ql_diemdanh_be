const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function debugTest() {
  console.log('🔍 Debugging attendance tracking...');
  
  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server connection...');
    const healthCheck = await axios.get(`${BASE_URL}/health`).catch(() => null);
    if (healthCheck) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server is not running or health endpoint not available');
    }
    
    // Test 2: Test user registration
    console.log('\n2. Testing user registration...');
    const testUser = {
      email: 'debuguser@example.com',
      password: 'password123',
      name: 'Debug User',
      mssv: 'DU001',
      class: 'DU_CLASS'
    };
    
    const registerResult = await axios.post(`${BASE_URL}/auth/register`, testUser).catch(e => e.response);
    if (registerResult.status === 201) {
      console.log('✅ User registration successful');
      const authToken = registerResult.data.accessToken;
      
      // Test 3: Create activity
      console.log('\n3. Testing activity creation...');
      const activity = {
        name: 'Debug Activity',
        description: 'Debug test activity',
        location: 'Debug Location',
        start_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        max_participants: 10
      };
      
      const activityResult = await axios.post(`${BASE_URL}/activities`, activity, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }).catch(e => e.response);
      
      if (activityResult.status === 201) {
        console.log('✅ Activity creation successful');
        const activityId = activityResult.data.activity.id;
        
        // Test 4: Register for activity
        console.log('\n4. Testing activity registration...');
        const regResult = await axios.post(`${BASE_URL}/registrations`, {
          activityId: activityId
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }).catch(e => e.response);
        
        if (regResult.status === 201) {
          console.log('✅ Activity registration successful');
          
          // Test 5: Generate QR code
          console.log('\n5. Testing QR code generation...');
          const qrResult = await axios.post(`${BASE_URL}/activities/${activityId}/qr-code`, {}, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          }).catch(e => e.response);
          
          if (qrResult.status === 200) {
            console.log('✅ QR code generation successful');
            const qrData = qrResult.data.qrCode.data;
            console.log('QR Data:', qrData);
            
            // Test 6: Validate QR data
            console.log('\n6. Testing QR data validation...');
            const { validateQRCodeData } = require('./src/utils/qrcode');
            const validation = validateQRCodeData(qrData);
            console.log('QR Validation result:', validation);
            
            // Test 7: Try checkin
            console.log('\n7. Testing checkin...');
            const checkinResult = await axios.post(`${BASE_URL}/attendances/checkin-qr`, {
              qrData: qrData
            }, {
              headers: { 'Authorization': `Bearer ${authToken}` }
            }).catch(e => e.response);
            
            console.log('Checkin result status:', checkinResult.status);
            console.log('Checkin result data:', checkinResult.data);
            
          } else {
            console.log('❌ QR code generation failed:', qrResult.data);
          }
        } else {
          console.log('❌ Activity registration failed:', regResult.data);
        }
      } else {
        console.log('❌ Activity creation failed:', activityResult.data);
      }
    } else {
      console.log('❌ User registration failed:', registerResult.data);
    }
    
  } catch (error) {
    console.error('❌ Debug test error:', error.message);
  }
}

debugTest();


