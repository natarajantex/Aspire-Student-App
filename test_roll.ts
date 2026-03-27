async function test() {
  const res = await fetch('http://localhost:3000/api/generate-roll-number?academicYear=2026-2027&classId=C10');
  const text = await res.text();
  console.log(res.status, text);
}
test();
