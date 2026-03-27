async function testAddStudent() {
  const reqBody = {
    name: 'Test Student',
    academicYear: '2026-2027',
    classId: 'C10',
    parentName: 'Test Parent',
    parentWhatsApp: '919876543299',
    enrollmentDate: new Date().toISOString().split('T')[0],
    subjects: ['M10'],
    photo: '',
    rollNumber: '26A1099'
  };

  try {
    const res = await fetch('http://localhost:3000/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
testAddStudent();
