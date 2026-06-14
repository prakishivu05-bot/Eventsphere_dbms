"""
EventSphere MySQL Connection Module
====================================
Real MySQL database connection using mysql-connector-python.
Replaces the in-memory TypeScript simulation (dbEngine.ts).

Usage:
  from db_connection import get_connection, execute_query, execute_procedure
"""

import os
import mysql.connector
from mysql.connector import pooling

# ── Configuration ──────────────────────────────────────────────────────────────
# Set these via environment variables or a .env file.
DB_HOST     = os.getenv("DB_HOST",     "localhost")
DB_PORT     = int(os.getenv("DB_PORT", "3306"))
DB_USER     = os.getenv("DB_USER",     "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")          # <-- SET YOUR PASSWORD HERE
DB_NAME     = os.getenv("DB_NAME",     "eventsphere_db")

# ── Connection Pool ─────────────────────────────────────────────────────────────
_pool: pooling.MySQLConnectionPool | None = None


def _init_pool() -> pooling.MySQLConnectionPool:
    """Initialize the MySQL connection pool (called once)."""
    return pooling.MySQLConnectionPool(
        pool_name="eventsphere_pool",
        pool_size=5,
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci",
        autocommit=False,
    )


def get_connection() -> mysql.connector.connection.MySQLConnectionAbstract:
    """Return a pooled MySQL connection."""
    global _pool
    if _pool is None:
        _pool = _init_pool()
    return _pool.get_connection()


# ── Query Helpers ───────────────────────────────────────────────────────────────

def execute_query(query: str, params: tuple = (), commit: bool = False):
    """
    Execute a SQL query (SELECT / INSERT / UPDATE / DELETE).

    Returns:
      - list[dict]  for SELECT queries
      - int         (lastrowid or rowcount) for write queries when commit=True
    """
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    result = None
    try:
        cursor.execute(query, params)
        if commit:
            conn.commit()
            result = cursor.lastrowid if cursor.lastrowid else cursor.rowcount
        else:
            result = cursor.fetchall()
    except mysql.connector.Error as err:
        conn.rollback()
        raise RuntimeError(f"[MySQL Error] {err.msg} (errno={err.errno})") from err
    finally:
        cursor.close()
        conn.close()
    return result


def execute_procedure(proc_name: str, params: tuple = ()) -> list:
    """
    Call a MySQL Stored Procedure and return combined result rows.

    Example:
      rows = execute_procedure("GetParticipantCount")
      rows = execute_procedure("GetEventDetails", (1,))
    """
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    result = []
    try:
        cursor.callproc(proc_name, params)
        for rs in cursor.stored_results():
            result.extend(rs.fetchall())
    except mysql.connector.Error as err:
        raise RuntimeError(f"[MySQL Procedure Error] {err.msg}") from err
    finally:
        cursor.close()
        conn.close()
    return result


# ── Quick connection test ───────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"Connecting to MySQL at {DB_HOST}:{DB_PORT} as '{DB_USER}' ...")
    try:
        rows = execute_query("SELECT VERSION() AS version, DATABASE() AS db_name")
        print(f"  ✓ Connected!  MySQL version: {rows[0]['version']}")
        print(f"  ✓ Active database: {rows[0]['db_name']}")

        # Test stored procedures
        print("\n--- Stored Procedure: GetParticipantCount ---")
        pc = execute_procedure("GetParticipantCount")
        print(pc)

        print("\n--- Stored Procedure: GetRevenueSummary ---")
        rs = execute_procedure("GetRevenueSummary")
        print(rs)

        print("\n--- Stored Procedure: GetEventDetails (all) ---")
        ed = execute_procedure("GetEventDetails", (0,))
        for e in ed:
            print(f"  Event #{e['event_id']}: {e['event_name']} | "
                  f"Registered: {e['registered_count']} | Status: {e['status']}")

        print("\n--- View: EventParticipationView ---")
        vr = execute_query("SELECT * FROM EventParticipationView")
        for row in vr:
            print(f"  {row['event_name']}: {row['participants_count']} participants, "
                  f"{row['attendance_count']} present")

        print("\n--- View: CertificateStatusView ---")
        cv = execute_query("SELECT * FROM CertificateStatusView")
        for row in cv:
            print(f"  {row['student_name']} ({row['usn']}) — {row['event_name']} — "
                  f"{row['certificate_status']}")

        print("\n✓ All database objects verified successfully!")

    except Exception as e:
        print(f"\n✗ Connection failed: {e}")
        print("\nTROUBLESHOOTING:")
        print("  1. Make sure MySQL80 service is running (Services app)")
        print("  2. Set DB_PASSWORD environment variable or edit db_connection.py directly")
        print("  3. Run the database.sql script first in MySQL Workbench")
