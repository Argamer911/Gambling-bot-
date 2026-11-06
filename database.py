import sqlite3
from config import DATABASE_PATH

def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def init_db():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS players (
                user_id INTEGER PRIMARY KEY,
                username TEXT DEFAULT '',
                first_name TEXT DEFAULT 'Player',
                coins INTEGER DEFAULT 1000,
                xp INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                games_played INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

def get_or_create_player(user_id, username="", first_name="Player"):
    with get_connection() as connection:
        connection.execute(
            """INSERT OR IGNORE INTO players
               (user_id, username, first_name) VALUES (?, ?, ?)""",
            (user_id, username, first_name),
        )
        return connection.execute(
            "SELECT * FROM players WHERE user_id = ?", (user_id,)
        ).fetchone()
