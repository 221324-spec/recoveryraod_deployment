/**
 * Simulate a patient location update that triggers geo-fence alert
 * This will call the actual API endpoint and trigger real-time Socket.IO events
 * 
 * Usage: node simulate-location.js
 */

const http = require('http');

// Patient Usama's credentials and ID
const PATIENT_ID = '695d90818a01fdca0d92e180';

// Location inside the Downtown Bar District zone
const LOCATION = {
  patientId: PATIENT_ID,
  latitude: 31.5204,
  longitude: 74.3587,
  accuracy: 10,
  source: 'test-simulation'
};

async function getToken() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      email: 'usama@patient.com',
      password: 'patient123'
    });

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(data.token);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}

async function sendLocation(token) {
  return new Promise((resolve, reject) => {
    const locationData = JSON.stringify(LOCATION);

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/patient/location',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': locationData.length,
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        try {
          const data = JSON.parse(body);
          resolve(data);
        } catch (e) {
          console.log('Raw response:', body);
          resolve({ raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(locationData);
    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Logging in as Patient Usama...');
    const token = await getToken();
    
    if (!token) {
      console.log('❌ Failed to get token');
      return;
    }
    console.log('✅ Got auth token');

    console.log('\n📍 Sending location update (inside geo-fence zone)...');
    console.log('   Location:', LOCATION.latitude, LOCATION.longitude);
    
    const result = await sendLocation(token);
    console.log('\n📡 API Response:', JSON.stringify(result, null, 2));

    if (result.inGeoFence) {
      console.log('\n🚨 ALERT TRIGGERED!');
      console.log('   Patient entered geo-fence zones:', result.zones?.map(z => z.name).join(', '));
      console.log('\n👨‍⚕️ Supervisor should receive real-time notification via Socket.IO');
    } else {
      console.log('\n✅ Patient is not in any geo-fence zone');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
