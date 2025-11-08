import http from 'http';

const postData = JSON.stringify({
  franchise_code: 'FR002',
  franchise_name: 'Test Franchise 2',
  owner_name: 'Owner Name',
  email: 'test2@example.com',
  phone: '9876543210',
  address: '123 Test Street',
  city: 'Test City',
  state: 'TS',
  pincode: '123456',
  status: 'active'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/franchises',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJmcmFuY2hpc2VJZCI6MywiaWF0IjoxNzYyNTkyOTg3LCJleHAiOjE3NjI2NzkzODd9.wU_dgM9T4kwxcdjjZcty7AQNNxn--BLKZXggr5PZ1S0'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:');
    console.log(JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.write(postData);
req.end();
