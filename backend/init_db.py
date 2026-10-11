#!/usr/bin/env python3
"""
Beyond Barriers - Database Initialization CLI Tool
Initializes the SQLite schema and populates realistic mock seed data.
Usage:
    python backend/init_db.py           # Initialize schema and seed data
    python backend/init_db.py --reset   # Remove existing DB file and re-seed
    python backend/init_db.py --no-seed # Create empty schema without seed data
"""

import sys
import os
import sqlite3
import argparse

# Ensure root directory is on python sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.config import Config
from backend.database.db import execute_schema, seed_database

def main():
    parser = argparse.ArgumentParser(description="Beyond Barriers SQLite Database Initializer")
    parser.add_argument('--reset', action='store_true', help="Delete existing database before initialization")
    parser.add_argument('--no-seed', action='store_true', help="Create schema only without seed data")
    args = parser.parse_args()

    db_path = Config.DATABASE_PATH
    db_dir = os.path.dirname(db_path)

    if args.reset and os.path.exists(db_path):
        os.remove(db_path)
        print(f"[RESET] Removed existing database: {db_path}")

    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON;')

    print(f">> Executing schema from schema.sql...")
    execute_schema(conn)

    if not args.no_seed:
        print(f">> Loading seed data from seed_data.py...")
        seed_database(conn)

    # Print verification summary
    cursor = conn.cursor()
    tables = [
        'users', 'sessions', 'students', 'mentors', 'parents', 'administrators', 'subjects', 'modules',
        'student_modules', 'tests', 'test_questions', 'test_attempts', 'test_answers',
        'attendance', 'marks', 'resources', 'scholarships', 'career_fields',
        'career_roles', 'career_roadmap_steps', 'mentor_notes'
    ]

    print("\n" + "=" * 55)
    print(" BEYOND BARRIERS - DATABASE VERIFICATION SUMMARY")
    print("=" * 55)
    total_records = 0
    for tbl in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) as count FROM {tbl}")
            cnt = cursor.fetchone()['count']
            total_records += cnt
            print(f"  * {tbl:<25}: {cnt:>4} records")
        except Exception as e:
            print(f"  * {tbl:<25}: Error ({e})")

    print("-" * 55)
    print(f"  Total Seeded Records Across All Entities: {total_records}")
    print(f"  Database Location: {db_path}")
    print("=" * 55 + "\n")

    conn.close()

if __name__ == '__main__':
    main()
