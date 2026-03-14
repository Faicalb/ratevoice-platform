const axios = require('axios');

async function testCreateUser() {
  try {
    const response = await axios.post('http://localhost:3001/admin/users/create', {
      name: "Test Admin Node",
      email: "testadminnode@ratevoice.com",
      password: "password123",
      role: "SUPER_ADMIN"
    });
    console.log("Success:", response.data);
  } catch (error) {
    console.error("FULL ERROR:", error);
  }
}

testCreateUser();