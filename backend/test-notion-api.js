const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });
    req.on('error', reject);
    
    // Write post data if provided
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test the notion databases API directly
async function testNotionAPI() {
  try {
    // First, let's test the GitHub OAuth dev mode login
    console.log('Testing GitHub OAuth dev mode login...');
    const authData = JSON.stringify({
      username: 'testuser',
      password: 'testpass'
    });
    
    const authResponse = await makeRequest({
       hostname: 'localhost',
       port: 3007,
       path: '/auth/github-mock',
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Content-Length': Buffer.byteLength(authData)
       }
     }, authData);
    
    console.log('Auth response status:', authResponse.statusCode);
    console.log('Auth response:', authResponse.data);
    
    if (authResponse.statusCode !== 200) {
      throw new Error('Auth failed');
    }
    
    const token = authResponse.data.token;
    console.log('Got token:', token);
    
    // Now test the notion databases API
    console.log('\nTesting Notion databases API...');
    const notionResponse = await makeRequest({
      hostname: 'localhost',
      port: 3007,
      path: '/notion/databases',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Notion databases status:', notionResponse.statusCode);
    console.log('Notion databases response:', notionResponse.data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testNotionAPI();