fetch('http://localhost:3000/api/auth/login/parent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobileNumber: '9876543210', password: 'password123' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
