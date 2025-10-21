const { generateActivityQRCode, validateQRCodeData } = require('../src/utils/qrcode');

async function testQRUtility() {
  console.log('🧪 Testing QR Code Utility Functions\n');
  
  try {
    // Test data
    const testActivity = {
      id: 1,
      name: 'Test Activity',
      startTime: new Date('2025-10-13T10:00:00Z'),
      endTime: new Date('2025-10-13T12:00:00Z')
    };
    
    console.log('1. Testing generateActivityQRCode...');
    const qrResult = await generateActivityQRCode(testActivity);
    console.log('✅ QR Code generated successfully');
    console.log('QR Data:', qrResult.data);
    console.log('QR Image (first 50 chars):', qrResult.image.substring(0, 50) + '...');
    
    console.log('\n2. Testing validateQRCodeData...');
    const validation = validateQRCodeData(qrResult.data);
    console.log('Validation result:', validation);
    
    if (validation.valid) {
      console.log('✅ QR Code validation successful');
    } else {
      console.log('❌ QR Code validation failed:', validation.error);
    }
    
    console.log('\n3. Testing invalid QR code...');
    const invalidValidation = validateQRCodeData('{"invalid": "data"}');
    console.log('Invalid validation result:', invalidValidation);
    
    if (!invalidValidation.valid) {
      console.log('✅ Invalid QR code properly rejected');
    } else {
      console.log('❌ Invalid QR code should have been rejected');
    }
    
  } catch (error) {
    console.error('❌ Error testing QR utility:', error);
  }
}

testQRUtility();

