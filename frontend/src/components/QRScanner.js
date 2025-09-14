import React, { useState, useRef, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const QRScanner = ({ onScan, onClose, title = "Scan QR Code" }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia not supported');
      setHasPermission(false);
      setError('Camera access is not supported on this device');
      return;
    }

    // Request camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
      })
      .catch((err) => {
        console.error('Camera permission denied:', err);
        setHasPermission(false);
        setError('Camera access is required to scan QR codes');
      });
  }, []);

  const handleScan = (result) => {
    if (result && !scanned) {
      setScanned(true);
      try {
        // Check if it's a URL (new format) or JSON (old format)
        if (result.startsWith('http')) {
          // New URL format - extract session ID from URL
          const url = new URL(result);
          const pathParts = url.pathname.split('/');
          const sessionId = pathParts[pathParts.length - 1];
          
          if (sessionId) {
            onScan({ sessionId, url: result });
            toast.success('QR Code scanned successfully!');
          } else {
            throw new Error('Invalid QR code URL format');
          }
        } else {
          // Old JSON format - parse as JSON
          const qrData = JSON.parse(result);
          onScan(qrData);
          toast.success('QR Code scanned successfully!');
        }
      } catch (error) {
        console.error('Invalid QR code:', error);
        setError('Invalid QR code format');
        setScanned(false);
        toast.error('Invalid QR code format');
      }
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner error:', err);
    setError('Failed to scan QR code');
  };

  const resetScanner = () => {
    setScanned(false);
    setError(null);
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Access Required</h3>
            <p className="text-gray-600 mb-4">
              Please allow camera access to scan QR codes for attendance tracking.
            </p>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Requesting camera access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md mx-4 w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner */}
        <div className="p-4">
          {!scanned && !error && (
            <div className="relative">
              <QrReader
                onResult={handleScan}
                onError={handleError}
                style={{ width: '100%' }}
                constraints={{
                  facingMode: 'environment' // Use back camera on mobile
                }}
              />
              <div className="absolute inset-0 border-2 border-primary-500 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
              </div>
            </div>
          )}

          {scanned && (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-green-600 font-medium">QR Code Scanned Successfully!</p>
              <p className="text-gray-600 text-sm mt-2">Processing attendance...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={resetScanner}
                className="btn-secondary mt-4"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;


