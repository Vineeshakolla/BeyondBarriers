#!/usr/bin/env python3
"""
Beyond Barriers - Developer CLI Management & Database Inspection Tool
Usage:
    python manage.py db-check
    python manage.py seed --reset-demo
"""

import sys
import os
import sqlite3
import argparse

PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.config import Config
from backend.database.db import execute_schema, seed_database

def check_db():
    db_path = Config.DATABASE_PATH
    exists = os.path.exists(db_path)
    size_bytes = os.path.getsize(db_path) if exists else 0
    size_kb = size_bytes / 1024

    print("\n" + "=" * 55)
    print(" BEYOND BARRIERS DATABASE CHECK")
    print("=" * 55)
    print(f"  Path:         {db_path}")
    print(f"  Status:       {'OK' if exists else 'MISSING'}")
    print(f"  Size:         {size_kb:.2f} KB")

    if not exists:
        print("=" * 55 + "\n")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Foreign key status
    cursor.execute('PRAGMA foreign_keys;')
    fk_row = cursor.fetchone()
    fk_enabled = bool(fk_row[0]) if fk_row else False
    print(f"  Foreign Keys: {'ON' if fk_enabled else 'OFF'}")

    # Schema version
    try:
        cursor.execute('SELECT value FROM system_meta WHERE key = ?', ('schema_version',))
        ver_row = cursor.fetchone()
        schema_version = ver_row['value'] if ver_row else '1'
    except Exception:
        schema_version = 'unknown'
    print(f"  Schema Ver:   {schema_version}")

    # Tables & Row Counts
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [r['name'] for r in cursor.fetchall() if not r['name'].startswith('sqlite_')]
    print(f"  Schema:       {len(tables)} tables")

    print("\n  Table Row Counts:")
    print("  " + "-" * 40)
    for tbl in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) as count FROM {tbl}")
            cnt = cursor.fetchone()['count']
            print(f"   * {tbl:<25}: {cnt:>5} rows")
        except Exception as e:
            print(f"   * {tbl:<25}: Error ({e})")

    conn.close()
    print("=" * 55 + "\n")

def seed_reset():
    db_path = Config.DATABASE_PATH
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"[RESET] Deleted database file: {db_path}")

    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON;')

    execute_schema(conn)
    seed_database(conn)
    conn.close()
    print("[SUCCESS] Database re-initialized and seeded with demo data successfully.")

def main():
    parser = argparse.ArgumentParser(description="Beyond Barriers CLI Tool")
    subparsers = parser.add_subparsers(dest='command', help='Sub-command help')

    db_check_parser = subparsers.add_parser('db-check', help='Inspect SQLite database status')
    
    seed_parser = subparsers.add_parser('seed', help='Seed management')
    seed_parser.add_argument('--reset-demo', action='store_true', help='Reset database and re-seed demo data')

    args = parser.parse_args()

    if args.command == 'db-check':
        check_db()
    elif args.command == 'seed':
        if args.reset_demo:
            seed_reset()
        else:
            print("Please specify --reset-demo flag to seed data.")
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
