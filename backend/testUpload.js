import fs from 'fs';
import path from 'path';

async function run() {
  const tempFile = path.resolve('temp_test.png');
  fs.writeFileSync(tempFile, 'fake image content');
  
  try {
    const form = new FormData();
    const blob = new Blob([fs.readFileSync(tempFile)], { type: 'image/png' });
    form.append('images', blob, 'temp_test.png');
    
    console.log('Sending upload request to http://localhost:5000/api/upload/multiple...');
    const response = await fetch('http://localhost:5000/api/upload/multiple', {
      method: 'POST',
      body: form
    });
    
    const text = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Text:', text);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

run();
