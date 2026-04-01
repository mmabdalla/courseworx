const os = require('os');

/**
 * Get the server's local IP address for network access
 * @returns {string} The local IP address
 */
function getServerIP() {
  const interfaces = os.networkInterfaces();
  
  // Priority order: Wi-Fi, Ethernet, then any other non-internal interface
  const priorityInterfaces = ['Wi-Fi', 'Ethernet', 'Local Area Connection'];
  
  // First, try priority interfaces
  for (const interfaceName of priorityInterfaces) {
    if (interfaces[interfaceName]) {
      for (const iface of interfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
          return iface.address;
        }
      }
    }
  }
  
  // Then look for any non-internal IPv4 address (excluding APIPA)
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
        return iface.address;
      }
    }
  }
  
  // Fallback to localhost if no network interface found
  return 'localhost';
}

/**
 * Get the full frontend URL for QR codes
 * @param {number} port - The frontend port (default: 3000)
 * @returns {string} The full frontend URL
 */
function getFrontendURL(port = 3000) {
  const ip = getServerIP();
  return `http://${ip}:${port}`;
}

module.exports = {
  getServerIP,
  getFrontendURL
};


