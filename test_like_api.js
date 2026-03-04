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
      
      // Now toggle like
      const postId = 'ce724d9a-502d-4d09-8ceb-055ae42accd1'; // Post ID from user screenshot
      const toggleReq = http.request({
        hostname: 'localhost',
        port: 8080,
        path: `/api/v1/likes/post/${postId}/toggle`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (toggleRes) => {
        let toggleData = '';
        toggleRes.on('data', chunk => toggleData += chunk);
        toggleRes.on('end', () => {
          console.log("Toggle 1 Response:", toggleRes.statusCode, toggleData);
          
          // Toggle it again immediately to see the second failure
          const toggleReq2 = http.request({
            hostname: 'localhost',
            port: 8080,
            path: `/api/v1/likes/post/${postId}/toggle`,
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }, (toggleRes2) => {
            let toggleData2 = '';
            toggleRes2.on('data', chunk => toggleData2 += chunk);
            toggleRes2.on('end', () => {
              console.log("Toggle 2 Response:", toggleRes2.statusCode, toggleData2);
            });
          });
          toggleReq2.end();

        });
      });
      toggleReq.end();
    } catch(e) {
      console.log("Error parsing token", data, e);
    }
  });
});
req.write(loginData);
req.end();
