async function run() {
  console.log("Sending...");
  const start = Date.now();
  try {
    const res = await fetch('https://astitva-creations.onrender.com/api/bookings/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: "Test",
        email: "test@test.com",
        phone: "1234567890",
        selectedEvents: ["wedding"]
      })
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Time: ${Date.now() - start}ms`);
    console.log(text);
  } catch(e) {
    console.error("Error:", e);
  }
}
run();
