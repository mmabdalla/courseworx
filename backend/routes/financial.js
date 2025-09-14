const express = require('express');
const { auth } = require('../middleware/auth');
const { Enrollment, Course, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const router = express.Router();

// Include currency routes from financial plugin
const currencyRoutes = require('../plugins/financial-plugin/routes/currencies');
router.use('/', currencyRoutes);

// Get financial dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Calculate total revenue from enrollments
    const totalRevenue = await Enrollment.sum('paymentAmount', {
      where: {
        status: 'active',
        paymentAmount: { [Op.gt]: 0 }
      }
    }) || 0;

    // Count total payments
    const totalPayments = await Enrollment.count({
      where: {
        status: 'active',
        paymentAmount: { [Op.gt]: 0 }
      }
    });

    // Count active users (users with at least one enrollment)
    const activeUsers = await User.count({
      include: [{
        model: Enrollment,
        as: 'enrollments',
        where: { status: 'active' },
        required: true
      }]
    });

    // Calculate conversion rate (enrollments vs total users)
    const totalUsers = await User.count();
    const conversionRate = totalUsers > 0 ? (totalPayments / totalUsers) * 100 : 0;

    // Get recent activity (recent enrollments)
    const recentActivity = await Enrollment.findAll({
      where: {
        status: 'active',
        paymentAmount: { [Op.gt]: 0 }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      }, {
        model: Course,
        as: 'course',
        attributes: ['title']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const formattedActivity = recentActivity.map(enrollment => ({
      description: `${enrollment.user.firstName} ${enrollment.user.lastName} enrolled in ${enrollment.course.title}`,
      amount: enrollment.paymentAmount,
      timestamp: enrollment.createdAt.toLocaleDateString()
    }));

    res.json({
      totalRevenue,
      totalPayments,
      activeUsers,
      conversionRate,
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get payments data
router.get('/payments', auth, async (req, res) => {
  try {
    const payments = await Enrollment.findAll({
      where: {
        status: 'active',
        paymentAmount: { [Op.gt]: 0 }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const formattedPayments = payments.map(enrollment => ({
      id: enrollment.id,
      userName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
      amount: enrollment.paymentAmount,
      status: enrollment.status,
      createdAt: enrollment.createdAt
    }));

    res.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Error fetching payments data:', error);
    res.status(500).json({ error: 'Failed to fetch payments data' });
  }
});

// Get revenue data
router.get('/revenue', auth, async (req, res) => {
  try {
    // Total revenue
    const totalRevenue = await Enrollment.sum('paymentAmount', {
      where: {
        status: 'active',
        paymentAmount: { [Op.gt]: 0 }
      }
    }) || 0;

    // Monthly revenue (current month)
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthlyRevenue = await Enrollment.sum('paymentAmount', {
      where: {
        status: 'active',
        paymentAmount: { [Op.gt]: 0 },
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    }) || 0;

    // Calculate growth rate (simplified - compare with previous month)
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const previousMonthRevenue = await Enrollment.sum('paymentAmount', {
      where: {
        status: 'active',
        paymentAmount: { [Op.gt]: 0 },
        createdAt: {
          [Op.between]: [previousMonthStart, previousMonthEnd]
        }
      }
    }) || 0;

    const growthRate = previousMonthRevenue > 0 
      ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    // Top courses by revenue
    const topCourses = await Enrollment.findAll({
      attributes: [
        'courseId',
        [sequelize.fn('SUM', sequelize.col('paymentAmount')), 'revenue']
      ],
      where: {
        status: 'active',
        paymentAmount: { [Op.gt]: 0 }
      },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['title']
      }],
      group: ['courseId', 'course.id'],
      order: [[sequelize.literal('revenue'), 'DESC']],
      limit: 5
    });

    const formattedTopCourses = topCourses.map(item => ({
      title: item.course.title,
      revenue: parseFloat(item.dataValues.revenue)
    }));

    res.json({
      totalRevenue,
      monthlyRevenue,
      growthRate,
      topCourses: formattedTopCourses
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

// Test route to verify basic functionality
router.get('/test', auth, async (req, res) => {
  try {
    res.json({ 
      message: 'Financial routes working',
      userId: req.user.id,
      userRole: req.user.role
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ error: 'Test route failed' });
  }
});

// Get trainer earnings
router.get('/earnings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching earnings for user:', userId);
    
    // Get courses created by the trainer
    const trainerCourses = await Course.findAll({
      where: { trainerId: userId },
      attributes: ['id', 'title']
    });
    
    console.log('Found courses:', trainerCourses.length);
    
    if (trainerCourses.length === 0) {
      return res.json({
        totalEarnings: 0,
        monthlyEarnings: 0,
        courseEarnings: [],
        recentEarnings: []
      });
    }
    
    const courseIds = trainerCourses.map(course => course.id);
    console.log('Course IDs:', courseIds);
    
    // Calculate total earnings from enrollments in trainer's courses
    const totalEarnings = await Enrollment.sum('paymentAmount', {
      where: {
        courseId: { [Op.in]: courseIds },
        status: 'active',
        paymentAmount: { [Op.gt]: 0 }
      }
    }) || 0;
    
    console.log('Total earnings:', totalEarnings);
    
    // Calculate monthly earnings (current month)
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthlyEarnings = await Enrollment.sum('paymentAmount', {
      where: {
        courseId: { [Op.in]: courseIds },
        status: 'active',
        paymentAmount: { [Op.gt]: 0 },
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    }) || 0;
    
    console.log('Monthly earnings:', monthlyEarnings);
    
    // Get earnings by course - simplified approach
    const courseEarnings = [];
    for (const course of trainerCourses) {
      const courseEarning = await Enrollment.sum('paymentAmount', {
        where: {
          courseId: course.id,
          status: 'active',
          paymentAmount: { [Op.gt]: 0 }
        }
      }) || 0;
      
      const enrollmentCount = await Enrollment.count({
        where: {
          courseId: course.id,
          status: 'active',
          paymentAmount: { [Op.gt]: 0 }
        }
      });
      
      courseEarnings.push({
        courseId: course.id,
        courseTitle: course.title,
        earnings: parseFloat(courseEarning),
        enrollmentCount: enrollmentCount
      });
    }
    
    console.log('Course earnings query completed');
    
    const formattedCourseEarnings = courseEarnings.sort((a, b) => b.earnings - a.earnings);
    
    // Get recent earnings (last 10 enrollments) - simplified
    const recentEarnings = await Enrollment.findAll({
      where: {
        courseId: { [Op.in]: courseIds },
        status: 'active',
        paymentAmount: { [Op.gt]: 0 }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log('Recent earnings query completed');
    
    const formattedRecentEarnings = [];
    for (const enrollment of recentEarnings) {
      const user = await User.findByPk(enrollment.userId, {
        attributes: ['firstName', 'lastName']
      });
      const course = await Course.findByPk(enrollment.courseId, {
        attributes: ['title']
      });
      
      formattedRecentEarnings.push({
        id: enrollment.id,
        studentName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        courseTitle: course ? course.title : 'Unknown Course',
        amount: enrollment.paymentAmount,
        date: enrollment.createdAt
      });
    }
    
    res.json({
      totalEarnings,
      monthlyEarnings,
      courseEarnings: formattedCourseEarnings,
      recentEarnings: formattedRecentEarnings
    });
  } catch (error) {
    console.error('Error fetching trainer earnings:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch trainer earnings' });
  }
});

// Get trainer payouts
router.get('/payouts', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // For now, return empty payouts array since payout system is not implemented
    // This would typically include payout history, pending payouts, etc.
    res.json({
      payouts: [],
      totalPaid: 0,
      pendingAmount: 0,
      nextPayoutDate: null
    });
  } catch (error) {
    console.error('Error fetching trainer payouts:', error);
    res.status(500).json({ error: 'Failed to fetch trainer payouts' });
  }
});

module.exports = router;
