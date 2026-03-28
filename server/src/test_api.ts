import axios from 'axios';

async function testApi() {
  try {
    const res = await axios.post('http://localhost:3001/api/reviews', {
      code: "console.log('test');",
      language: 'javascript',
      source_type: 'paste'
    }, {
      headers: {
        // We'd need an actual JWT or bypass auth to test the API directly...
        // Let's just create a test JWT or modify the authenticate middleware temporarily
      }
    });
    console.log(res.data);
  } catch (err: any) {
    console.error("API error status:", err.response?.status);
    console.error("API error data:", err.response?.data);
  }
}
testApi();
