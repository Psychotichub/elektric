const express = require('express');
const router = express.Router();
const dailyReportController = require('../controllers/dailyReportController');
const { getDailyReports, addDailyReport, updateDailyReport, deleteDailyReport, getDailyReportsByDate, getDailyReportsByDateRange } = dailyReportController;


router.get('/', getDailyReports);
router.post('/', addDailyReport);
router.put('/:id', updateDailyReport);
router.delete('/:id', deleteDailyReport);
router.get('/date/:date', getDailyReportsByDate);
router.get('/date-range', getDailyReportsByDateRange);

module.exports = router;
