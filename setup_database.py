"""
EventSphere MySQL Setup Script
==============================
Reads database.sql and executes it against a real MySQL server.

Usage (will prompt for password if not given):
  python setup_database.py
  python setup_database.py --password YOUR_PASSWORD
  python setup_database.py --host localhost --user root --password secret
"""

import os
import sys
import argparse
import getpass
import mysql.connector
from mysql.connector import errorcode

# ── Argument Parsing ────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="EventSphere MySQL Database Setup")
parser.add_argument("--host",     default=os.getenv("DB_HOST", "localhost"))
parser.add_argument("--port",     default=int(os.getenv("DB_PORT", "3306")), type=int)
parser.add_argument("--user",     default=os.getenv("DB_USER", "root"))
parser.add_argument("--password", default=os.getenv("DB_PASSWORD", None),
                    help="MySQL password (will prompt if omitted)")
args = parser.parse_args()

# Prompt interactively if no password given
if args.password is None:
    args.password = getpass.getpass(
        f"Enter MySQL password for {args.user}@{args.host}: "
    )

SQL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.sql")

# ── Banner ──────────────────────────────────────────────────────────────────────
print("=" * 60)
print("  EventSphere DBMS -- MySQL Database Setup")
print("=" * 60)
print(f"  Host     : {args.host}:{args.port}")
print(f"  User     : {args.user}")
print(f"  SQL File : {SQL_FILE}")
print()

# ── Connect to MySQL (no database selected yet) ─────────────────────────────────
try:
    conn = mysql.connector.connect(
        host=args.host,
        port=args.port,
        user=args.user,
        password=args.password,
        autocommit=True,
    )
    print("  Connected to MySQL server successfully!")
except mysql.connector.Error as err:
    print(f"  ERROR: Cannot connect to MySQL: {err.msg}")
    print()
    print("  Possible fixes:")
    print("    1. Make sure MySQL80 service is running")
    print("    2. Check your password and re-run:")
    print("       python setup_database.py --password YOUR_PASSWORD")
    sys.exit(1)

# ── Read SQL File ───────────────────────────────────────────────────────────────
if not os.path.exists(SQL_FILE):
    print(f"  ERROR: database.sql not found at {SQL_FILE}")
    sys.exit(1)

with open(SQL_FILE, "r", encoding="utf-8") as f:
    raw_sql = f.read()

# ── Parse SQL into individual statements ────────────────────────────────────────
# Handles DELIMITER $$ blocks for triggers/procedures
statements  = []
current     = []
delimiter   = ";"
in_compound = False   # inside a $$ block

for line in raw_sql.splitlines():
    stripped = line.strip()

    # Skip pure comment lines
    if stripped.startswith("--") or stripped == "":
        continue

    # Handle DELIMITER switch
    if stripped.upper().startswith("DELIMITER"):
        new_delim = stripped.split()[1]
        if new_delim == "$$":
            in_compound = True
        elif new_delim == ";":
            in_compound = False
        continue

    current.append(line)

    if in_compound:
        # End of compound statement
        if stripped.endswith("$$"):
            # Remove trailing $$ from last line
            current[-1] = current[-1].rstrip()[:-2]
            stmt = "\n".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
    else:
        # Normal statement ends with semicolon
        joined = "\n".join(current)
        if joined.rstrip().endswith(";"):
            stmt = joined.rstrip().rstrip(";").strip()
            if stmt:
                statements.append(stmt)
            current = []

# ── Execute Statements ──────────────────────────────────────────────────────────
cursor = conn.cursor()
success_count = 0
fail_count    = 0

IGNORE_ERRNOS = {
    errorcode.ER_DB_DROP_EXISTS,        # DROP DATABASE IF EXISTS when DB absent
    errorcode.ER_BAD_TABLE_ERROR,       # DROP TABLE IF NOT EXISTS
}

for stmt in statements:
    stripped_upper = stmt.strip().upper()
    if not stripped_upper:
        continue
    try:
        # Use multi=True so we can handle multi-result statements
        for _ in cursor.execute(stmt, multi=True):
            pass
        success_count += 1

        # Print progress for key DDL statements
        if "CREATE DATABASE" in stripped_upper:
            print("  [OK] Database created: eventsphere_db")
        elif "CREATE TABLE" in stripped_upper:
            tbl = [t for t in stmt.split() if t not in
                   ("CREATE","TABLE","IF","NOT","EXISTS","create","table","if","not","exists")][0].strip("`(")
            print(f"  [OK] Table created  : {tbl}")
        elif "CREATE TRIGGER" in stripped_upper:
            parts = stmt.split()
            idx = next(i for i, w in enumerate(parts) if w.upper() == "TRIGGER")
            print(f"  [OK] Trigger created: {parts[idx+1]}")
        elif "CREATE PROCEDURE" in stripped_upper:
            parts = stmt.split()
            idx = next(i for i, w in enumerate(parts) if w.upper() == "PROCEDURE")
            print(f"  [OK] Procedure      : {parts[idx+1].split('(')[0]}")
        elif "CREATE" in stripped_upper and "VIEW" in stripped_upper:
            parts = stmt.split()
            idx = next(i for i, w in enumerate(parts) if w.upper() == "VIEW")
            print(f"  [OK] View created   : {parts[idx+1]}")
        elif stripped_upper.startswith("INSERT INTO"):
            tbl = stmt.split()[2].strip("`")
            print(f"  [OK] Data inserted  : {tbl}")

    except mysql.connector.Error as err:
        if err.errno in IGNORE_ERRNOS:
            pass
        else:
            print(f"  [!!] Error: {err.msg}  (errno={err.errno})")
            print(f"       Statement: {stmt[:80]}...")
            fail_count += 1

cursor.close()
conn.close()

# ── Summary ─────────────────────────────────────────────────────────────────────
print()
print(f"  Done: {success_count} statements executed | {fail_count} error(s)")

if fail_count == 0:
    print()
    print("=" * 60)
    print("  eventsphere_db is LIVE in MySQL!")
    print()
    print("  Tables   : Users, Events, Registrations, Payments,")
    print("             Attendance, Certificates, Volunteers,")
    print("             Event_Log, Payment_Audit")
    print()
    print("  Triggers : trg_generate_certificate")
    print("             trg_audit_event_update")
    print("             trg_audit_payment_success")
    print()
    print("  Procedures: GetParticipantCount()")
    print("              GetRevenueSummary()")
    print("              GetEventDetails(p_event_id)")
    print()
    print("  Views    : EventParticipationView")
    print("             CertificateStatusView")
    print("=" * 60)
    print()
    print("  Next -- verify inside MySQL Workbench:")
    print("    USE eventsphere_db;")
    print("    SHOW TABLES;")
    print("    SELECT * FROM Events;")
    print("    CALL GetParticipantCount();")
    print("    SELECT * FROM EventParticipationView;")
    print()
    print("  Or test Python connection:")
    print(f"    set DB_PASSWORD={args.password}")
    print("    python db_connection.py")
else:
    print(f"\n  {fail_count} error(s) occurred -- review the output above.")
    sys.exit(1)
