import logging
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from config import BOT_TOKEN, SHINOBI_WEBAPP_URL
from database import init_db, get_or_create_player

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

GAMES = [
    ("Tic Tac Toe", "tictactoe"), ("Rock Paper Scissors", "rps"),
    ("Chess", "chess"), ("Snake", "snake"), ("2048", "2048"),
    ("Memory Match", "memory"), ("Word Scramble", "words"),
    ("Dice Battle", "dice"), ("Minesweeper", "mines"), ("Space Shooter", "shooter"),
    ("Slot Machine", "slots"), ("Roulette", "roulette"), ("Blackjack", "blackjack"),
    ("Lucky Wheel", "wheel"), ("High Low Dice", "highlow"),
]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    get_or_create_player(user.id, user.username or "", user.first_name or "Player")
    await update.message.reply_text(
        f"🎮 Welcome to GAMBLING UNIVERSE, {user.first_name}!\n\n"
        "Play games, earn virtual coins and gain XP.\n"
        "Use /games to see all games, /shinobi to launch 3D fighting, and /help for commands."
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎮 GAMBLING UNIVERSE HELP\n\n"
        "/start - Start the bot\n"
        "/games - Show all 15 games\n"
        "/shinobi - Launch 3D Shinobi Fight\n"
        "/profile - View your player profile\n"
        "/wallet - View your virtual coins\n"
        "/help - Show this help\n\n"
        "All coins are virtual. No real-money betting or cash withdrawal."
    )

async def games_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton(f"🎮 {name}", callback_data=f"game:{key}")]
        for name, key in GAMES
    ]
    await update.message.reply_text(
        "🎮 GAMBLING UNIVERSE — GAME CATALOG\n\nChoose a game:",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def shinobi_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not SHINOBI_WEBAPP_URL:
        await update.message.reply_text(
            "⚔️ 3D Shinobi Fight is built, but its Mini App URL is not configured yet. "
            "Set SHINOBI_WEBAPP_URL in your .env after enabling GitHub Pages."
        )
        return
    keyboard = [[InlineKeyboardButton(
        "⚔️ PLAY 3D SHINOBI FIGHT",
        web_app=WebAppInfo(url=SHINOBI_WEBAPP_URL)
    )]]
    await update.message.reply_text(
        "⚔️ AR 3D SHINOBI FIGHT\n\nEnter the battlefield and challenge the rival!",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def game_selected(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    key = query.data.split(":", 1)[1]
    selected = next((name for name, code in GAMES if code == key), None)
    if selected:
        await query.message.reply_text(
            f"🕹 {selected}\nThis game module is being prepared. Stay tuned!"
        )

def main():
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is missing. Add it to your .env file.")
    init_db()
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("games", games_command))
    app.add_handler(CommandHandler("shinobi", shinobi_command))
    app.add_handler(CallbackQueryHandler(game_selected, pattern=r"^game:"))
    logger.info("GAMBLING UNIVERSE bot is starting...")
    app.run_polling()

if __name__ == "__main__":
    main()
