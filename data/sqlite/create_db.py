import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'claude.db')

conn = sqlite3.connect(db_path)
conn.execute('''CREATE TABLE IF NOT EXISTS test_table (
    id INTEGER PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)''')
conn.execute("INSERT INTO test_table (name) VALUES ('initial_test')")
conn.commit()

tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print(f'Tables: {tables}')
print(f'SQLite DB created: {db_path}')
print(f'File size: {os.path.getsize(db_path)} bytes')
conn.close()
