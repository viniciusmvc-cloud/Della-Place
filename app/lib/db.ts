import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;

    if (!host || !user || !password || !database) {
      throw new Error(
        'Database environment variables not set. Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME',
      );
    }

    pool = mysql.createPool({
      host,
      port: Number(process.env.DB_PORT || 3306),
      user,
      password,
      database,
      connectionLimit: 5,
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: '+00:00',
    });
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T[]> {
  const conn = getPool();
  const [rows] = await conn.execute(sql, params as unknown[]);
  return rows as T[];
}

export async function queryOne<T = unknown>(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params: ReadonlyArray<unknown> = [],
): Promise<{ affectedRows: number; insertId: number }> {
  const conn = getPool();
  const [result] = await conn.execute(sql, params as unknown[]);
  const r = result as { affectedRows: number; insertId: number };
  return { affectedRows: r.affectedRows ?? 0, insertId: r.insertId ?? 0 };
}

export async function transaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
