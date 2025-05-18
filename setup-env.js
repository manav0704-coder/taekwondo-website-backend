/**
 * This script helps to set up the .env file for email configuration
 * 
 * Instructions:
 * 1. Create a .env file in the server directory
 * 2. For Gmail:
 *    - SMTP_HOST=smtp.gmail.com
 *    - SMTP_PORT=587
 *    - SMTP_SECURE=false
 *    - SMTP_USER=your-gmail-address
 *    - SMTP_PASSWORD=your-app-password (generate this in your Google account)
 * 
 * To generate an App Password for Gmail:
 * 1. Go to your Google Account → Security
 * 2. Under "Signing in to Google," select 2-Step Verification
 * 3. At the bottom of the page, select App passwords
 * 4. Click "Select app" and choose "Mail"
 * 5. Click "Select device" and choose "Other"
 * 6. Enter "Taekwondo Website" and click Generate
 * 7. Copy the generated password to SMTP_PASSWORD in your .env
 */

console.log('Email Configuration Instructions:');
console.log('--------------------------------');
console.log('1. Create a .env file in the server directory with the following content:');
console.log(`
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://your-mongodb-uri
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=30d

# CORS settings
CORS_ORIGINS=http://localhost:3000,http://localhost:5000,http://127.0.0.1:3000,http://192.168.1.100:3000

# Frontend URL for reset password links
FRONTEND_URL=http://localhost:3000

# Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Maharashtra Taekwondo Federation
`);

console.log('2. For Gmail, you need to create an App Password:');
console.log('   a. Go to your Google Account → Security');
console.log('   b. Under "Signing in to Google," select 2-Step Verification');
console.log('   c. At the bottom of the page, select App passwords');
console.log('   d. Click "Select app" and choose "Mail"');
console.log('   e. Click "Select device" and choose "Other"');
console.log('   f. Enter "Taekwondo Website" and click Generate');
console.log('   g. Copy the generated password to SMTP_PASSWORD in your .env'); 