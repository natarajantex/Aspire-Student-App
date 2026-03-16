fetch('http://localhost:3000/api/auth/login/staff', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@aspire.com', password: 'password123' })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
