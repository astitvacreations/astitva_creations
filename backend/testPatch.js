// using native fetch

async function testPatch() {
  const url = 'http://localhost:5000/api/settings';
  
  // We need the admin token to bypass auth.
  // Wait, does updateSettings require auth?
  // settingRoutes.js: router.patch('/', updateSettings);
  // Is there auth middleware in backend/src/routes/settingRoutes.js?
  // No, in settingRoutes.js:
  // import express from 'express';
  // import { getSettings, updateSettings } from '../controllers/settingController.js';
  // const router = express.Router();
  // router.get('/', getSettings);
  // router.patch('/', updateSettings);
  // router.post('/', updateSettings);
  // export default router;
  // Wait, there is no auth middleware on updateSettings? Then anyone can update settings!
  
  const payload = {
    ownerImage: "https://images.unsplash.com/photo-1554048612-b6a3721eb6d3"
  };

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Returned ownerImage:", data.ownerImage);
  } catch (err) {
    console.error(err);
  }
}

testPatch();
