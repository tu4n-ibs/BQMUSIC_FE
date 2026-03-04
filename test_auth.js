const http = require('http');

const loginData = JSON.stringify({ email: 'admin@bqmusic.com', password: 'admin' });

const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const token = JSON.parse(data).data.token || JSON.parse(data).data;
      console.log("Got token");
      
      const testReq = http.request({
        hostname: 'localhost',
        port: 8080,
        path: `/api/v1/posts/test-find-all-post?page=0&size=5`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (testRes) => {
        let testData = '';
        testRes.on('data', chunk => testData += chunk);
        testRes.on('end', () => {
          console.log("Response:", testRes.statusCode, testData);
        });
      });
      testReq.end();
    } catch(e) {
      console.log("Error parsing token", data, e);
    }
  });
});
req.write(loginData);
req.end();
