const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../../middleware/auth');

router.get('/overview', authenticate, analyticsController.getOverview);
router.get('/traffic-sources', authenticate, analyticsController.getTrafficSources);
router.get('/hourly', authenticate, analyticsController.getHourlyDistribution);
router.get('/locations', authenticate, analyticsController.getLocationData);
router.get('/visitors', authenticate, analyticsController.getRecentVisitors);
router.get('/stats', authenticate, analyticsController.getStats);
router.get('/stats/date-range', authenticate, analyticsController.getDateRangeStats);
router.get('/click-through-rate', authenticate, analyticsController.getClickThroughRate);
router.post('/track/visitor', analyticsController.trackVisitor);
router.post('/track/pageview', analyticsController.trackPageView);
router.post('/track/click', analyticsController.trackClick);
router.post('/stats/daily', authenticate, analyticsController.updateDailyStat);

module.exports = router;