require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

console.log('sendEmail.js loaded');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Read company logo as base64 for embedding in email
let logoBase64 = '';
try {
  const logoPath = path.join(__dirname, '../../client/src/assets/company-logo.png');
  console.log('Logo path:', logoPath);
  logoBase64 = fs.readFileSync(logoPath, 'base64');
  console.log('Logo loaded, length:', logoBase64.length);
} catch (e) {
  console.error('Logo not loaded:', e);
}

module.exports = async function sendEmail({ to, subject, text, html, buttonText, buttonUrl, greeting, heading }) {
  // If html is not provided, create a modern dark-themed HTML template from text
  let htmlContent = html;
  if (!htmlContent && text) {
    const btnText = buttonText || 'View Job Details';
    const btnUrl = buttonUrl || '#';
    const greet = greeting ? `<p style='margin: 0 0 16px 0; font-size: 1.1em;'>${greeting}</p>` : '';
    const mainHeading = heading ? `<h1 style='margin: 0 0 16px 0; font-size: 1.6em; color: #fff;'>${heading}</h1>` : '';
    // Inline SVG banner (plants, JCB, and title)
    const svgBanner = `
      <div style='width:100%;background:linear-gradient(90deg,#a8e063 0%,#56ab2f 100%);padding:0;margin:0;'>
        <svg width="100%" height="80" viewBox="0 0 600 80" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:auto;">
          <rect width="600" height="80" fill="url(#bg)"/>
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
              <stop stop-color="#a8e063"/>
              <stop offset="1" stop-color="#56ab2f"/>
            </linearGradient>
          </defs>
          <!-- Simple JCB (excavator) icon -->
          <g>
            <rect x="60" y="50" width="60" height="20" rx="6" fill="#f4b400" stroke="#333" stroke-width="2"/>
            <rect x="110" y="40" width="20" height="20" rx="4" fill="#f4b400" stroke="#333" stroke-width="2"/>
            <rect x="120" y="60" width="30" height="8" rx="3" fill="#888" stroke="#333" stroke-width="2"/>
            <circle cx="70" cy="75" r="7" fill="#333"/>
            <circle cx="110" cy="75" r="7" fill="#333"/>
            <rect x="140" y="55" width="40" height="6" rx="3" fill="#888" stroke="#333" stroke-width="2"/>
            <rect x="180" y="50" width="30" height="6" rx="3" fill="#888" stroke="#333" stroke-width="2"/>
            <rect x="210" y="45" width="20" height="6" rx="3" fill="#888" stroke="#333" stroke-width="2"/>
          </g>
          <!-- Simple plants -->
          <g>
            <ellipse cx="500" cy="70" rx="18" ry="8" fill="#388e3c"/>
            <ellipse cx="520" cy="75" rx="10" ry="5" fill="#43a047"/>
            <ellipse cx="540" cy="70" rx="14" ry="7" fill="#66bb6a"/>
            <rect x="495" y="60" width="6" height="15" rx="2" fill="#795548"/>
            <rect x="535" y="62" width="4" height="12" rx="2" fill="#795548"/>
          </g>
          <!-- Title text -->
          <text x="300" y="45" text-anchor="middle" font-size="26" font-family="Arial, sans-serif" fill="#fff" font-weight="bold">Landclearing and Plantation 2025</text>
        </svg>
      </div>
    `;
    htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #181A1B; padding: 32px 0; min-height: 100vh;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #222;">
              <tr>
                <td style="background: #23272A; padding: 32px 0 0 0; text-align: center;">
                  ${logoBase64 ? `<img src='data:image/png;base64,${logoBase64}' alt='Company Logo' style='height: 64px; margin-bottom: 16px; display: block; margin-left: auto; margin-right: auto;'>` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding: 0;">${svgBanner}</td>
              </tr>
              <tr>
                <td style="padding: 40px 40px 32px 40px; font-family: Arial, sans-serif; color: #23272A; font-size: 17px;">
                  ${mainHeading}
                  ${greet}
                  <div style="color: #23272A; font-size: 1.1em; margin-bottom: 32px;">${text.replace(/\n/g, '<br>')}</div>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                    <tr>
                      <td align="center">
                        <a href="${btnUrl}" style="background: #4CAF50; color: #fff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 17px; display: inline-block;">${btnText}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background: #23272A; color: #bbb; padding: 18px 32px; text-align: center; font-size: 15px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; font-family: Arial, sans-serif;">
                  &copy; ${new Date().getFullYear()} Contractor Platform. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
    html: htmlContent
  });
};
