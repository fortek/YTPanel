import { pool } from './mysql-config';

export interface CookieData {
  name: string;
  cookies: string[];
  emails: (string | null)[];
}

export const saveCookiesToMySQL = async (data: CookieData) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Создаем таблицу если не существует
      await connection.query(`
        CREATE TABLE IF NOT EXISTS cookie_lists (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) UNIQUE,
          total INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS cookies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          list_id INT,
          email VARCHAR(255),
          cookie TEXT,
          FOREIGN KEY (list_id) REFERENCES cookie_lists(id)
        )
      `);

      // Сохраняем метаданные списка
      const [listResult] = await connection.query(
        'INSERT INTO cookie_lists (name, total) VALUES (?, ?)',
        [data.name, data.cookies.length]
      );

      const listId = (listResult as any).insertId;

      // Сохраняем куки
      const values = data.cookies.map((cookie, i) => [
        listId,
        data.emails[i] || null,
        cookie
      ]);

      await connection.query(
        'INSERT INTO cookies (list_id, email, cookie) VALUES ?',
        [values]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error saving cookies to MySQL:', error);
    return false;
  }
};

export const getCookiesFromMySQL = async (name: string) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [lists] = await connection.query(
        'SELECT * FROM cookie_lists WHERE name = ?',
        [name]
      );

      if (!(lists as any[]).length) {
        return null;
      }

      const list = (lists as any[])[0];

      const [cookies] = await connection.query(
        'SELECT email, cookie FROM cookies WHERE list_id = ?',
        [list.id]
      );

      return {
        name,
        createdAt: list.created_at,
        total: list.total,
        cookies: (cookies as any[]).map(c => ({
          email: c.email,
          cookie: c.cookie
        }))
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting cookies from MySQL:', error);
    return null;
  }
};

export const deleteListFromMySQL = async (idOrName: string) => {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [lists] = await connection.query(
        'SELECT id FROM cookie_lists WHERE id = ? OR name = ?',
        [idOrName, idOrName]
      );
      if (!(lists as any[]).length) {
        await connection.rollback();
        return true;
      }
      const listId = (lists as any[])[0].id;
      await connection.query(
        'DELETE FROM cookies WHERE list_id = ?',
        [listId]
      );
      await connection.query(
        'DELETE FROM cookie_lists WHERE id = ?',
        [listId]
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting list from MySQL:', error);
    return false;
  }
};

export const renameListInMySQL = async (oldIdOrName: string, newName: string) => {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Пытаемся найти по id или по name
      const [lists] = await connection.query(
        'SELECT id FROM cookie_lists WHERE id = ? OR name = ?',
        [oldIdOrName, oldIdOrName]
      );
      if (!(lists as any[]).length) {
        await connection.rollback();
        return false;
      }
      const listId = (lists as any[])[0].id;
      const [result] = await connection.query(
        'UPDATE cookie_lists SET name = ? WHERE id = ?',
        [newName, listId]
      );
      if ((result as any).affectedRows === 0) {
        await connection.rollback();
        return false;
      }
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error renaming list in MySQL:', error);
    return false;
  }
}; 