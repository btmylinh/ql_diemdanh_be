const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate QR code data for activity attendance
 * @param {number} activityId - Activity ID
 * @param {string} activityName - Activity name
 * @param {Date} startTime - Activity start time
 * @param {Date} endTime - Activity end time
 * @returns {string} QR code data string
 */
function generateQRData(activityId, activityName, startTime, endTime) {
  const qrData = {
    type: 'attendance',
    activityId: activityId,
    activityName: activityName,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    timestamp: new Date().toISOString(),
    // Add a simple hash for basic validation
    hash: generateHash(activityId, startTime, endTime)
  };
  
  return JSON.stringify(qrData);
}

/**
 * Generate a simple hash for QR code validation
 * @param {number} activityId - Activity ID
 * @param {Date} startTime - Activity start time
 * @param {Date} endTime - Activity end time
 * @returns {string} Hash string
 */
function generateHash(activityId, startTime, endTime) {
  const data = `${activityId}-${startTime.toISOString()}-${endTime.toISOString()}`;
  return crypto.createHash('md5').update(data).digest('hex').substring(0, 8);
}

/**
 * Generate QR code as base64 string
 * @param {string} data - Data to encode in QR code
 * @param {object} options - QR code options
 * @returns {Promise<string>} Base64 encoded QR code image
 */
async function generateQRCodeBase64(data, options = {}) {
  const defaultOptions = {
    type: 'png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256,
    errorCorrectionLevel: 'M'
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as buffer
 * @param {string} data - Data to encode in QR code
 * @param {object} options - QR code options
 * @returns {Promise<Buffer>} QR code image buffer
 */
async function generateQRCodeBuffer(data, options = {}) {
  const defaultOptions = {
    type: 'png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 256,
    errorCorrectionLevel: 'M'
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  
  try {
    const qrCodeBuffer = await QRCode.toBuffer(data, qrOptions);
    return qrCodeBuffer;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code for activity attendance
 * @param {object} activity - Activity object
 * @param {object} options - QR code options
 * @returns {Promise<object>} QR code data and base64 image
 */
async function generateActivityQRCode(activity, options = {}) {
  try {
    // Generate QR data
    const qrData = generateQRData(
      activity.id,
      activity.name,
      activity.startTime,
      activity.endTime
    );
    
    // Generate QR code image
    const qrCodeBase64 = await generateQRCodeBase64(qrData, options);
    
    return {
      data: qrData,
      image: qrCodeBase64,
      activityId: activity.id,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Activity QR code generation error:', error);
    throw new Error('Failed to generate activity QR code');
  }
}

/**
 * Validate QR code data
 * @param {string} qrDataString - QR code data string
 * @returns {object} Validation result
 */
function validateQRCodeData(qrDataString) {
  try {
    const qrData = JSON.parse(qrDataString);
    
    // Check required fields
    if (!qrData.type || qrData.type !== 'attendance') {
      return { valid: false, error: 'Invalid QR code type' };
    }
    
    if (!qrData.activityId || !qrData.activityName) {
      return { valid: false, error: 'Missing activity information' };
    }
    
    if (!qrData.startTime || !qrData.endTime) {
      return { valid: false, error: 'Missing time information' };
    }
    
    // Check if activity is still valid (not expired)
    const now = new Date();
    const endTime = new Date(qrData.endTime);
    
    if (now > endTime) {
      return { valid: false, error: 'Activity has ended' };
    }
    
    // Validate hash (optional, for basic security)
    const expectedHash = generateHash(
      qrData.activityId,
      new Date(qrData.startTime),
      new Date(qrData.endTime)
    );
    
    if (qrData.hash !== expectedHash) {
      return { valid: false, error: 'Invalid QR code hash' };
    }
    
    return {
      valid: true,
      data: qrData
    };
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' };
  }
}

/**
 * Generate QR code with custom styling for different activity types
 * @param {object} activity - Activity object
 * @param {string} style - Style type ('default', 'colorful', 'minimal')
 * @returns {Promise<object>} QR code data and image
 */
async function generateStyledQRCode(activity, style = 'default') {
  const styleOptions = {
    default: {
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 256
    },
    colorful: {
      color: { dark: '#2E7D32', light: '#E8F5E8' },
      width: 300
    },
    minimal: {
      color: { dark: '#424242', light: '#FAFAFA' },
      width: 200,
      margin: 0
    }
  };
  
  const options = styleOptions[style] || styleOptions.default;
  return await generateActivityQRCode(activity, options);
}

module.exports = {
  generateQRData,
  generateHash,
  generateQRCodeBase64,
  generateQRCodeBuffer,
  generateActivityQRCode,
  validateQRCodeData,
  generateStyledQRCode
};

