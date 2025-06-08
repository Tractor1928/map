import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div 
      style={{
        display: 'inline-block',
        width: '20px',
        height: '20px',
        border: '2px solid #f3f3f3',
        borderTop: '2px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  );
};

export default LoadingSpinner; 