const User = require('../models/user');
const DailyReport = require('../models/dailyreport');
const Material = require('../models/material');
const Received = require('../models/received');
const TotalPrice = require('../models/totalPrice');
const MonthlyReport = require('../models/montlyreport');

// Get user's own company and site details
exports.getUserSiteDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user details
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get statistics for user's site
    const siteStats = await getSiteStatistics(user.site, user.company);

    res.status(200).json({
      success: true,
      userDetails: {
        username: user.username,
        role: user.role,
        site: user.site,
        company: user.company,
        createdAt: user.createdAt
      },
      siteStatistics: siteStats
    });

  } catch (error) {
    console.error('Get user site details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to get site statistics
async function getSiteStatistics(site, company) {
  try {
    const dailyReportsCount = await DailyReport.countDocuments({ site, company });
    const materialsCount = await Material.countDocuments({ site, company });
    const receivedItemsCount = await Received.countDocuments({ site, company });
    const totalPriceRecordsCount = await TotalPrice.countDocuments({ site, company });
    const monthlyReportsCount = await MonthlyReport.countDocuments({ site, company });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDailyReports = await DailyReport.countDocuments({
      site,
      company,
      date: { $gte: thirtyDaysAgo }
    });

    const recentReceivedItems = await Received.countDocuments({
      site,
      company,
      date: { $gte: thirtyDaysAgo }
    });

    return {
      totalRecords: {
        dailyReports: dailyReportsCount,
        materials: materialsCount,
        receivedItems: receivedItemsCount,
        totalPriceRecords: totalPriceRecordsCount,
        monthlyReports: monthlyReportsCount
      },
      recentActivity: {
        dailyReports: recentDailyReports,
        receivedItems: recentReceivedItems,
        period: 'Last 30 days'
      }
    };
  } catch (error) {
    console.error('Error getting site statistics:', error);
    return {
      totalRecords: {
        dailyReports: 0,
        materials: 0,
        receivedItems: 0,
        totalPriceRecords: 0,
        monthlyReports: 0
      },
      recentActivity: {
        dailyReports: 0,
        receivedItems: 0,
        period: 'Last 30 days'
      }
    };
  }
} 