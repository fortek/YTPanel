import mysql from 'mysql2/promise';

export const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'fort2007',
  database: 'ytpanel'
};

export const pool = mysql.createPool(dbConfig);

export const ensureConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL connection error:', error);
    return false;
  }
}; 