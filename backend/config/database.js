const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = 'sqlite';
let mysqlPool = null;
let sqliteDb = null;

// Helper to check if MySQL is configured in env
const isMySQLConfigured = () => {
  return process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;
};

// Initialize DB Connections
const initDatabase = async () => {
  if (isMySQLConfigured()) {
    try {
      console.log('🔄 Attempting to connect to MySQL database...');
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });
      
      // Test the connection
      const connection = await mysqlPool.getConnection();
      console.log('💚 [DB CONNECTED] Successfully connected to MySQL 8.0 server on ' + process.env.DB_HOST);
      connection.release();
      dbType = 'mysql';
      return { type: 'mysql', db: mysqlPool };
    } catch (error) {
      console.warn('⚠️ MySQL Connection failed: ' + error.message);
      console.warn('🔄 Falling back to local SQLite database...');
    }
  }

  // SQLite Fallback
  dbType = 'sqlite';
  const dbPath = path.resolve(__dirname, '../../medisense.db');
  console.log(`📂 [DB LOCAL] Initializing SQLite database at: ${dbPath}`);
  
  return new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Failed to open SQLite database: ' + err.message);
        reject(err);
      } else {
        console.log('💚 [DB CONNECTED] Successfully initialized local SQLite database.');
        resolve({ type: 'sqlite', db: sqliteDb });
      }
    });
  });
};

// Unified Query Handler for GET/SELECT (returns array of rows)
const query = (sql, params = []) => {
  // Convert MySQL standard queries to SQLite syntax where required
  let processedSql = sql;
  if (dbType === 'sqlite') {
    // Replace MySQL specific functions if any
    processedSql = sql.replace(/NOW\(\)/gi, "datetime('now', 'localtime')");
  }

  if (dbType === 'mysql') {
    return mysqlPool.execute(processedSql, params).then(([rows]) => rows);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(processedSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

// Unified Execute Handler for INSERT/UPDATE/DELETE
const execute = (sql, params = []) => {
  let processedSql = sql;
  if (dbType === 'sqlite') {
    processedSql = sql.replace(/NOW\(\)/gi, "datetime('now', 'localtime')");
  }

  if (dbType === 'mysql') {
    return mysqlPool.execute(processedSql, params).then(([result]) => {
      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    });
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(processedSql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            insertId: this.lastID,
            affectedRows: this.changes
          });
        }
      });
    });
  }
};

// Unified Transaction Handler
const transaction = async (callback) => {
  if (dbType === 'mysql') {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Create a localized runner for queries within transaction
      const txRunner = {
        query: (sql, params = []) => connection.execute(sql, params).then(([rows]) => rows),
        execute: (sql, params = []) => connection.execute(sql, params).then(([result]) => ({
          insertId: result.insertId,
          affectedRows: result.affectedRows
        }))
      };

      const result = await callback(txRunner);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } else {
    // SQLite transaction
    return new Promise((resolve, reject) => {
      sqliteDb.serialize(async () => {
        sqliteDb.run('BEGIN TRANSACTION', async (err) => {
          if (err) return reject(err);
          
          try {
            const txRunner = {
              query: (sql, params = []) => new Promise((res, rej) => {
                sqliteDb.all(sql.replace(/NOW\(\)/gi, "datetime('now', 'localtime')"), params, (e, rows) => {
                  if (e) rej(e); else res(rows || []);
                });
              }),
              execute: (sql, params = []) => new Promise((res, rej) => {
                sqliteDb.run(sql.replace(/NOW\(\)/gi, "datetime('now', 'localtime')"), params, function (e) {
                  if (e) rej(e); else res({ insertId: this.lastID, affectedRows: this.changes });
                });
              })
            };

            const result = await callback(txRunner);
            sqliteDb.run('COMMIT', (commitErr) => {
              if (commitErr) reject(commitErr);
              else resolve(result);
            });
          } catch (execErr) {
            sqliteDb.run('ROLLBACK', () => {
              reject(execErr);
            });
          }
        });
      });
    });
  }
};

module.exports = {
  initDatabase,
  query,
  execute,
  transaction,
  getDbType: () => dbType,
  getSqliteDb: () => sqliteDb
};
