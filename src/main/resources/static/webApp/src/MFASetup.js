import React, { useState } from 'react';
import axios from 'axios';

function MFASetup() {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [token, setToken] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const userId = 'user123'; // This could be dynamically set based on the logged-in user

  const handleGenerateSecret = async () => {
    try {
      const response = await axios.post('http://localhost:3000/generate-secret', { userId });
      setQrCodeUrl(response.data.qrCodeUrl);
      setSecret(response.data.secret);
    } catch (error) {
      console.error('Error generating secret:', error);
    }
  };

  const handleVerifyToken = async () => {
    try {
      const response = await axios.post('http://localhost:3000/verify-totp', {
        userId,
        token
      });
      setIsVerified(true);
      alert('MFA successfully enabled!');
    } catch (error) {
      alert('Invalid token');
    }
  };

  return (
    <div>
      <h1>Setup Multi-Factor Authentication (MFA)</h1>
      {!qrCodeUrl && (
        <button onClick={handleGenerateSecret}>Generate Secret</button>
      )}
      {qrCodeUrl && (
        <div>
          <h2>Scan this QR code with Google Authenticator:</h2>
          <img src={qrCodeUrl} alt="QR Code" />
        </div>
      )}

      {qrCodeUrl && !isVerified && (
        <div>
          <h3>Enter the code from Google Authenticator</h3>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter 6-digit code"
          />
          <button onClick={handleVerifyToken}>Verify</button>
        </div>
      )}

      {isVerified && <p>Your MFA setup is complete!</p>}
    </div>
  );
}

export default MFASetup;
