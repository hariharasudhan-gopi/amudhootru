const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Mock database to store user secrets
let users = {};

// Endpoint to generate a secret key and QR code for the user
app.post('/generate-secret', (req, res) => {
  const { userId } = req.body;

  // Generate a secret key
  const secret = speakeasy.generateSecret({ length: 20 });

  // Store the secret in the database (mocked here)
  users[userId] = {
    secret: secret.base32,
    isMFAEnabled: false
  };

  // Generate a QR code URL
  const qrCodeUrl = `otpauth://totp/MyApp:${userId}?secret=${secret.base32}&issuer=MyApp`;

  qrcode.toDataURL(qrCodeUrl, (err, dataUrl) => {
    if (err) {
      return res.status(500).send('Error generating QR code');
    }

    res.json({
      message: 'Secret generated successfully',
      qrCodeUrl: dataUrl,
      secret: secret.base32
    });
  });
});

// Endpoint to verify TOTP entered by the user
app.post('/verify-totp', (req, res) => {
  const { userId, token } = req.body;

  const user = users[userId];

  if (!user || !user.secret) {
    return res.status(400).send('User not found');
  }

  // Verify the TOTP entered by the user
  const isValid = speakeasy.totp.verify({
    secret: user.secret,
    encoding: 'base32',
    token: token
  });

  if (isValid) {
    user.isMFAEnabled = true; // MFA is enabled after verification
    res.json({ message: 'MFA successfully enabled' });
  } else {
    res.status(400).send('Invalid token');
  }
});

// Example to verify MFA on login
app.post('/login', (req, res) => {
  const { userId, password, token } = req.body;

  // Assume password is checked and user exists
  const user = users[userId];

  if (!user || !user.isMFAEnabled) {
    return res.status(400).send('MFA not enabled for user');
  }

  // Verify TOTP token during login
  const isValidToken = speakeasy.totp.verify({
    secret: user.secret,
    encoding: 'base32',
    token: token
  });

  if (isValidToken) {
    res.json({ message: 'Login successful' });
  } else {
    res.status(400).send('Invalid MFA token');
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
