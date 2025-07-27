require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

sendEmail({
  to: 'abhiabhishekbhajantri@gmail.com', // Use your own email to test
  subject: 'Test Email from Contractor Platform',
  text: 'This is a test email sent from Nodemailer and your platform!'
}).then(() => {
  console.log('Test email sent!');
  process.exit(0);
}).catch(err => {
  console.error('Error sending test email:', err);
  process.exit(1);
});
