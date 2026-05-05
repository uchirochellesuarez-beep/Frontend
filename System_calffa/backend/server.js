// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const farmerRoutes = require('./routes/farmers');
const authRoutes = require('./routes/auth');
const blockchainRoutes = require('./routes/blockchain');
const barangayRoutes = require('./routes/barangays');
const activityLogsRoutes = require('./routes/activity-logs');
const contributionsRoutes = require('./routes/contributions');
const loansRoutes = require('./routes/loans');
const loanPaymentsRoutes = require('./routes/loan-payments');
const mlAssessmentsRoutes = require('./routes/ml-assessments');
const machineryRoutes = require('./routes/machinery');
const machineryFinancialRoutes = require('./routes/machinery-financial');
const notificationsRoutes = require('./routes/notifications');
const testNotificationsRoutes = require('./routes/test-notifications');
const farmerIncomeRoutes = require('./routes/farmer-income');
const newsRoutes = require('./routes/news');
const shareCapitalRoutes = require('./routes/share-capital');
const { startNotificationScheduler } = require('./scheduler/notification-scheduler');


const app = express();
app.use(bodyParser.json());

// Configure CORS more securely: allow specific origin in production via FRONTEND_ORIGIN.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: FRONTEND_ORIGIN }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Use farmer routes
app.use('/api/farmers', farmerRoutes);
// Authentication routes (Google OAuth)
app.use('/api/auth', authRoutes);
// Blockchain routes
app.use('/api/blockchain', blockchainRoutes);
// Barangay routes
app.use('/api/barangays', barangayRoutes);
// Activity logs routes
app.use('/api/activity-logs', activityLogsRoutes);
// Financial routes
app.use('/api/contributions', contributionsRoutes);
app.use('/api/share-capital', shareCapitalRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/loan-payments', loanPaymentsRoutes);
app.use('/api/ml-assessments', mlAssessmentsRoutes);
// Machinery routes
app.use('/api/machinery', machineryRoutes);
app.use('/api/machinery-financial', machineryFinancialRoutes);
// Notification routes
app.use('/api/notifications', notificationsRoutes);
app.use('/api/test-notifications', testNotificationsRoutes);
// Farmer income routes
app.use('/api/farmer-income', farmerIncomeRoutes);
// News and announcement routes
app.use('/api', newsRoutes);


const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚜 Farmer backend running on http://localhost:${PORT}`);
    console.log(`📝 Registration endpoint: http://localhost:${PORT}/api/farmers/register`);
    // Start the notification scheduler
    startNotificationScheduler();
  });
} else {
  module.exports = app;
}
