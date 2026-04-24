require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('SOFTBRICKSAI DATABASE MIGRATION');
    console.log('========================================');
    console.log('Running migrations...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(sql);
    
    console.log('✅ All tables created/verified successfully.');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📊 TABLES IN DATABASE:');
    console.log('========================================');
    tables.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    console.log('========================================');
    console.log(`✅ ${tables.rows.length} tables present`);
    
    const columns = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'page_views'
      ORDER BY column_name
    `);
    
    console.log('\n📋 PAGE_VIEWS COLUMNS:');
    console.log('========================================');
    columns.rows.forEach((col) => {
      console.log(`   - ${col.column_name}`);
    });
    console.log('========================================');
    
    const hasReferrer = columns.rows.some(col => col.column_name === 'referrer');
    if (hasReferrer) {
      console.log('✅ referrer column EXISTS in page_views table');
    } else {
      console.log('❌ referrer column MISSING in page_views table - adding now');
      await client.query('ALTER TABLE page_views ADD COLUMN IF NOT EXISTS referrer VARCHAR(500)');
      console.log('✅ referrer column added successfully');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('========================================\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('Error details:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();