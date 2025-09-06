export interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run(): Promise<D1Result>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}

export interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  meta: D1Meta
  error?: string
}

export interface D1Meta {
  served_by: string
  duration: number
  changes: number
  last_row_id: number
  changed_db: boolean
  size_after: number
  rows_read: number
  rows_written: number
}

export interface D1ExecResult {
  count: number
  duration: number
}

export class D1DatabaseService {
  private db: D1Database

  constructor(database: D1Database) {
    this.db = database
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const stmt = this.db.prepare(sql)
    if (params) {
      stmt.bind(...params)
    }
    const result = await stmt.all<T>()
    return result.results
  }

  async queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const stmt = this.db.prepare(sql)
    if (params) {
      stmt.bind(...params)
    }
    return await stmt.first<T>()
  }

  async execute(sql: string, params?: any[]): Promise<D1Result> {
    const stmt = this.db.prepare(sql)
    if (params) {
      stmt.bind(...params)
    }
    return await stmt.run()
  }

  async batchExecute(queries: Array<{ sql: string; params?: any[] }>): Promise<D1Result[]> {
    const statements = queries.map(({ sql, params }) => {
      const stmt = this.db.prepare(sql)
      if (params) {
        stmt.bind(...params)
      }
      return stmt
    })
    return await this.db.batch(statements)
  }

  async createTable(tableName: string, columns: string): Promise<D1Result> {
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`
    return await this.execute(sql)
  }

  async insert(tableName: string, data: Record<string, any>): Promise<D1Result> {
    const columns = Object.keys(data).join(', ')
    const placeholders = Object.keys(data).map(() => '?').join(', ')
    const values = Object.values(data)
    
    const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`
    return await this.execute(sql, values)
  }

  async update(tableName: string, data: Record<string, any>, where: string, whereParams?: any[]): Promise<D1Result> {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ')
    const values = [...Object.values(data), ...(whereParams || [])]
    
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${where}`
    return await this.execute(sql, values)
  }

  async delete(tableName: string, where: string, whereParams?: any[]): Promise<D1Result> {
    const sql = `DELETE FROM ${tableName} WHERE ${where}`
    return await this.execute(sql, whereParams)
  }
}