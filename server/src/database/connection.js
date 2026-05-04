import sqlite3 from 'sqlite3';
import { env } from '../config/env.js';

sqlite3.verbose();

let database = null;

export function getDb() {
  if (!database) {
    database = new sqlite3.Database(env.databasePath);
    database.run('PRAGMA foreign_keys = ON');
  }

  return database;
}

export function exec(sql) {
  return new Promise((resolve, reject) => {
    getDb().exec(sql, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

export function closeDb() {
  if (!database) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    database.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      database = null;
      resolve();
    });
  });
}
