import React from 'react';

const EnvTest: React.FC = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '10px' }}>
      <h3>Environment Variable Test</h3>
      <p><strong>VITE_API_BASE_URL:</strong> {apiUrl || 'NOT FOUND'}</p>
      <p><strong>Test concatenation:</strong> {`${apiUrl}/customers`}</p>
      <p><strong>Full URL for upload:</strong> {`${apiUrl}/upload-xml`}</p>
    </div>
  );
};

export default EnvTest;
