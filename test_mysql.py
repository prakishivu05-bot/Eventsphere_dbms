import mysql.connector
import sys

passwords_to_try = ['', 'root', 'password', 'admin', 'mysql', 'root123', 'admin123',
                    '1234', '12345', '123456', 'toor', 'Root@123', 'Admin@123',
                    'MySQL@123', 'eventsphere', 'bit', 'bitblr', 'event', 'events']

print("Testing MySQL root credentials...")

found = False
for pw in passwords_to_try:
    try:
        conn = mysql.connector.connect(
            host='127.0.0.1',
            port=3306,
            user='root',
            password=pw,
            connection_timeout=3
        )
        print(f"SUCCESS! Password is: '{pw}'")
        cur = conn.cursor()
        cur.execute("SHOW DATABASES")
        dbs = cur.fetchall()
        print(f"Existing databases: {[d[0] for d in dbs]}")
        cur.close()
        conn.close()
        found = True
        break
    except mysql.connector.Error as e:
        if e.errno == 1045:
            print(f"FAIL: '{pw}' - access denied")
        else:
            print(f"FAIL: '{pw}' - {e}")
    except Exception as e:
        print(f"ERROR: '{pw}' - {e}")

if not found:
    print("None of the common passwords worked.")
    sys.exit(1)
