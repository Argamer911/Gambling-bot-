import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
OWNER_ID = int(os.getenv("OWNER_ID", "0") or "0")
DATABASE_PATH = os.getenv("DATABASE_PATH", "players.db")
SHINOBI_WEBAPP_URL = os.getenv("SHINOBI_WEBAPP_URL", "").strip()
