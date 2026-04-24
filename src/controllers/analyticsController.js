const { validationResult } = require('express-validator');
const pool = require('../../config/db');
const { logActivity } = require('../../utils/logger');

const analyticsController = {
  async getOverview(req, res) {
    try {
      const summaryResult = await pool.query(`
        SELECT 
          COALESCE(SUM(visitors), 0) as total_visitors,
          COALESCE(SUM(page_views), 0) as total_page_views,
          COALESCE(AVG(bounce_rate), 0) as avg_bounce_rate,
          COALESCE(AVG(avg_session_duration), 0) as avg_session_duration,
          COALESCE(SUM(new_users), 0) as total_new_users
        FROM daily_stats 
        WHERE stat_date >= NOW() - INTERVAL '30 days'
      `);
      
      const recentStatsResult = await pool.query(`
        SELECT stat_date as date, visitors, page_views
        FROM daily_stats 
        ORDER BY stat_date DESC 
        LIMIT 7
      `);
      
      const topPagesResult = await pool.query(`
        SELECT 
          page_path as page,
          COUNT(*) as views,
          COUNT(DISTINCT visitor_id) as unique_visitors
        FROM page_views 
        WHERE viewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 5
      `);
      
      const deviceResult = await pool.query(`
        SELECT 
          COALESCE(device, 'Unknown') as name,
          COUNT(*) as value
        FROM visitors 
        WHERE visited_at >= NOW() - INTERVAL '30 days'
        GROUP BY device
        ORDER BY value DESC
      `);
      
      const totalValue = deviceResult.rows.reduce((sum, row) => sum + parseInt(row.value), 0);
      const deviceData = deviceResult.rows.map(row => ({
        name: row.name.charAt(0).toUpperCase() + row.name.slice(1),
        value: parseInt(row.value),
        percentage: totalValue > 0 ? (parseInt(row.value) / totalValue) * 100 : 0,
        color: row.name.toLowerCase() === 'desktop' ? '#3B82F6' : 
               row.name.toLowerCase() === 'mobile' ? '#10B981' : 
               row.name.toLowerCase() === 'tablet' ? '#F59E0B' : '#6B7280'
      }));
      
      const activityResult = await pool.query(`
        (SELECT 
          'blog_post' as type,
          bp.title as title,
          bp.created_at as created_at
        FROM blog_posts bp
        WHERE bp.status = 'published'
        ORDER BY bp.created_at DESC
        LIMIT 3)
        UNION ALL
        (SELECT 
          'team_member' as type,
          tm.name as title,
          tm.created_at as created_at
        FROM team_members tm
        ORDER BY tm.created_at DESC
        LIMIT 3)
        UNION ALL
        (SELECT 
          'message' as type,
          m.subject as title,
          m.created_at as created_at
        FROM messages m
        WHERE m.status = 'unread'
        ORDER BY m.created_at DESC
        LIMIT 3)
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return `${seconds} seconds ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        return `${days} days ago`;
      };
      
      const recentActivity = activityResult.rows.map(row => ({
        action: row.type === 'blog_post' ? `New blog post published: ${row.title}` :
                row.type === 'team_member' ? `Team member added: ${row.title}` :
                `New message received: ${row.title}`,
        time: getTimeAgo(row.created_at),
        icon: row.type
      }));
      
      const responseData = {
        summary: {
          total_visitors: parseInt(summaryResult.rows[0].total_visitors),
          total_page_views: parseInt(summaryResult.rows[0].total_page_views),
          avg_bounce_rate: parseFloat(summaryResult.rows[0].avg_bounce_rate),
          avg_session_duration: parseFloat(summaryResult.rows[0].avg_session_duration),
          total_new_users: parseInt(summaryResult.rows[0].total_new_users)
        },
        recent_stats: recentStatsResult.rows.reverse(),
        top_pages: topPagesResult.rows,
        device_breakdown: deviceData,
        recent_activity: recentActivity
      };
      
      res.json({ success: true, data: responseData });
    } catch (error) {
      console.error('Get overview error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch overview data: ' + error.message });
    }
  },

  async getTrafficSources(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          CASE 
            WHEN referrer IS NULL THEN 'Direct'
            WHEN referrer LIKE '%google%' THEN 'Organic Search'
            WHEN referrer LIKE '%facebook%' OR referrer LIKE '%twitter%' OR referrer LIKE '%linkedin%' THEN 'Social Media'
            ELSE 'Referral'
          END as source,
          COUNT(*) as visitors
        FROM page_views
        WHERE viewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY source
      `);
      
      const colors = {
        'Organic Search': '#3B82F6',
        'Direct': '#10B981',
        'Social Media': '#F59E0B',
        'Referral': '#EF4444'
      };
      
      const data = result.rows.map(row => ({
        source: row.source,
        visitors: parseInt(row.visitors),
        color: colors[row.source] || '#6B7280'
      }));
      
      res.json({ success: true, data: data });
    } catch (error) {
      console.error('Get traffic sources error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch traffic sources' });
    }
  },

  async getHourlyDistribution(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          EXTRACT(HOUR FROM viewed_at) as hour,
          COUNT(*) as visitors
        FROM page_views
        WHERE viewed_at >= NOW() - INTERVAL '7 days'
        GROUP BY hour
        ORDER BY hour
      `);
      
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        visitors: 0
      }));
      
      result.rows.forEach(row => {
        hourlyData[parseInt(row.hour)].visitors = parseInt(row.visitors);
      });
      
      res.json({ success: true, data: hourlyData });
    } catch (error) {
      console.error('Get hourly distribution error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch hourly distribution' });
    }
  },

  async getLocationData(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          country,
          COUNT(*) as visitors
        FROM visitors
        WHERE visited_at >= NOW() - INTERVAL '30 days' AND country IS NOT NULL
        GROUP BY country
        ORDER BY visitors DESC
        LIMIT 10
      `);
      
      const total = result.rows.reduce((sum, row) => sum + parseInt(row.visitors), 0);
      const data = result.rows.map(row => ({
        country: row.country,
        visitors: parseInt(row.visitors),
        percentage: total > 0 ? (parseInt(row.visitors) / total) * 100 : 0
      }));
      
      res.json({ success: true, data: data });
    } catch (error) {
      console.error('Get location data error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch location data' });
    }
  },

  async getRecentVisitors(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const result = await pool.query(`
        SELECT 
          v.id,
          v.ip_address as ip,
          CONCAT(COALESCE(v.country, 'Unknown'), ', ', COALESCE(v.city, 'Unknown')) as location,
          v.device,
          v.browser,
          v.visited_at as visitedat,
          COALESCE(
            (SELECT COUNT(*) FROM page_views WHERE visitor_id = v.id),
            0
          ) as pages_visited
        FROM visitors v
        ORDER BY v.visited_at DESC
        LIMIT $1
      `, [limit]);
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get recent visitors error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch recent visitors' });
    }
  },

  async getStats(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 365;
      const offset = parseInt(req.query.offset) || 0;
      
      const stats = await pool.query(
        `SELECT * FROM daily_stats 
         ORDER BY stat_date DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      const summary = await pool.query(`
        SELECT 
          COALESCE(SUM(visitors), 0) as total_visitors,
          COALESCE(SUM(page_views), 0) as total_page_views,
          COALESCE(AVG(bounce_rate), 0) as avg_bounce_rate,
          COALESCE(AVG(avg_session_duration), 0) as avg_session_duration
        FROM daily_stats 
        WHERE stat_date >= NOW() - INTERVAL '30 days'
      `);
      
      const today = await pool.query(
        'SELECT * FROM daily_stats WHERE stat_date = CURRENT_DATE'
      );
      
      res.json({ 
        success: true, 
        data: {
          summary: {
            total_visitors: parseInt(summary.rows[0].total_visitors),
            total_page_views: parseInt(summary.rows[0].total_page_views),
            avg_bounce_rate: parseFloat(summary.rows[0].avg_bounce_rate),
            avg_session_duration: parseFloat(summary.rows[0].avg_session_duration)
          },
          today: today.rows[0] || null,
          daily_stats: stats.rows
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
  },

  async getDateRangeStats(req, res) {
    try {
      const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
      
      const stats = await pool.query(
        `SELECT * FROM daily_stats 
         WHERE stat_date BETWEEN $1 AND $2 
         ORDER BY stat_date ASC`,
        [startDate, endDate]
      );
      
      res.json({ success: true, data: stats.rows });
    } catch (error) {
      console.error('Get date range stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch statistics for date range' });
    }
  },

  async trackVisitor(req, res) {
    try {
      const result = await pool.query(
        `INSERT INTO visitors (ip_address, country, city, device, browser, os, is_returning)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.body.ip_address || req.ip,
          req.body.country || null,
          req.body.city || null,
          req.body.device || null,
          req.body.browser || null,
          req.body.os || null,
          req.body.is_returning || false
        ]
      );
      
      res.status(201).json({ success: true, data: result.rows[0], message: 'Visitor tracked successfully' });
    } catch (error) {
      console.error('Track visitor error:', error);
      res.status(500).json({ success: false, error: 'Failed to track visitor' });
    }
  },

  async trackPageView(req, res) {
    try {
      const result = await pool.query(
        `INSERT INTO page_views (visitor_id, page_path, referrer, time_on_page, bounced)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          req.body.visitor_id,
          req.body.page_path,
          req.body.referrer || null,
          req.body.time_on_page || 0,
          req.body.bounced || false
        ]
      );
      
      res.status(201).json({ success: true, data: result.rows[0], message: 'Page view tracked successfully' });
    } catch (error) {
      console.error('Track page view error:', error);
      res.status(500).json({ success: false, error: 'Failed to track page view' });
    }
  },

  async trackClick(req, res) {
    try {
      const result = await pool.query(
        `INSERT INTO click_events (visitor_id, element_id, element_type, element_text, page_path)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          req.body.visitor_id,
          req.body.element_id || null,
          req.body.element_type || null,
          req.body.element_text || null,
          req.body.page_path || null
        ]
      );
      
      res.status(201).json({ success: true, data: result.rows[0], message: 'Click tracked successfully' });
    } catch (error) {
      console.error('Track click error:', error);
      res.status(500).json({ success: false, error: 'Failed to track click' });
    }
  },

  async getClickThroughRate(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      
      const result = await pool.query(`
        SELECT 
          COUNT(DISTINCT ce.visitor_id) as total_clicks,
          COUNT(DISTINCT v.id) as total_visitors,
          CASE 
            WHEN COUNT(DISTINCT v.id) > 0 
            THEN (COUNT(DISTINCT ce.visitor_id)::float / COUNT(DISTINCT v.id)::float) * 100 
            ELSE 0 
          END as click_through_rate
        FROM visitors v
        LEFT JOIN click_events ce ON v.id = ce.visitor_id AND ce.created_at >= NOW() - INTERVAL '$1 days'
        WHERE v.visited_at >= NOW() - INTERVAL '$1 days'
      `, [days]);
      
      res.json({ 
        success: true, 
        data: {
          click_through_rate: parseFloat(result.rows[0].click_through_rate).toFixed(2),
          total_clicks: parseInt(result.rows[0].total_clicks),
          total_visitors: parseInt(result.rows[0].total_visitors)
        }
      });
    } catch (error) {
      console.error('Get click-through rate error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch click-through rate' });
    }
  },

  async updateDailyStat(req, res) {
    try {
      const date = req.body.date || new Date().toISOString().split('T')[0];
      const result = await pool.query(
        `INSERT INTO daily_stats (stat_date, visitors, page_views, sessions, bounce_rate, avg_session_duration, new_users)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (stat_date) 
         DO UPDATE SET
           visitors = EXCLUDED.visitors,
           page_views = EXCLUDED.page_views,
           sessions = EXCLUDED.sessions,
           bounce_rate = EXCLUDED.bounce_rate,
           avg_session_duration = EXCLUDED.avg_session_duration,
           new_users = EXCLUDED.new_users
         RETURNING *`,
        [
          date,
          req.body.visitors || 0,
          req.body.page_views || 0,
          req.body.sessions || 0,
          req.body.bounce_rate || 0,
          req.body.avg_session_duration || 0,
          req.body.new_users || 0
        ]
      );
      
      await logActivity({
        adminId: req.admin.id,
        action: 'UPDATE_DAILY_STAT',
        entity: 'daily_stats',
        details: { date: date },
        ip: req.ip
      });
      
      res.json({ success: true, data: result.rows[0], message: 'Daily stat updated successfully' });
    } catch (error) {
      console.error('Update daily stat error:', error);
      res.status(500).json({ success: false, error: 'Failed to update daily stat' });
    }
  }
};

module.exports = analyticsController;