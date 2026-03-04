const http = require('http');

console.log("We need a token to test APIs properly, but let's see what a public request returns.");
const req = http.request('http://localhost:8080/api/v1/posts/test-find-all-post?page=0&size=5', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data.substring(0, 500)));
});
req.on('error', console.error);
req.end();
