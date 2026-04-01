const express = require('express');
const fs = require('fs');
const path = require('path');
const { auth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/logs
// @desc    Get backward-formatted system logs for the UI viewer
// @access  Private (Super Admin)
router.get('/logs', auth, requireSuperAdmin, async (req, res) => {
  try {
    const logPath = path.join(__dirname, '../logs/system.log');
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Check if the log file exists
    if (!fs.existsSync(logPath)) {
      return res.json({ logs: ['No logs found. System starting...'] });
    }

    // Read the log file and reverse the lines for newest-first viewing
    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim()).reverse();
    
    res.json({ logs: lines.slice(0, 200) }); // Send last 200 log entries
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs.' });
  }
});

// @route   POST /api/admin/logs/clear
// @desc    Clear the system logs
// @access  Private (Super Admin)
router.post('/logs/clear', auth, requireSuperAdmin, async (req, res) => {
  try {
    const logPath = path.join(__dirname, '../logs/system.log');
    fs.writeFileSync(logPath, ''); // Overwrite with empty
    res.json({ message: 'Logs cleared successfully.' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs.' });
  }
});

module.exports = router;
