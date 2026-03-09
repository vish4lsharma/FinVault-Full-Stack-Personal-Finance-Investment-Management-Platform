import os
import time
import requests
import psycopg2
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv
import smtplib
from email.message import EmailMessage
import logging
import signal

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/finvault")
API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")

def get_db_connection():
    return psycopg2.connect(DB_URL)

def send_email_alert(to_email, ticker, current_price, target_price, alert_type):
    msg = EmailMessage()
    msg.set_content(f"Alert! {ticker} has crossed your target price of {target_price}. Current Price: {current_price}")
    msg['Subject'] = f"Stock Alert for {ticker}"
    msg['From'] = os.getenv("SMTP_USER", "noreply@finvault.com")
    msg['To'] = to_email

    try:
        s = smtplib.SMTP(os.getenv("SMTP_SERVER", "smtp.gmail.com"), int(os.getenv("SMTP_PORT", 587)))
        s.starttls()
        s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        s.send_message(msg)
        s.quit()
        logger.info(f"Email sent to {to_email} for {ticker}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

def check_stock_prices():
    logger.info("Checking stock prices...")
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT sa.id, sa.user_id, sa.ticker, sa.target_price, sa.alert_type, u.email 
            FROM stock_alerts sa 
            JOIN users u ON sa.user_id = u.id 
            WHERE sa.is_active = true
        """)
        alerts = cur.fetchall()
        
        # Group by ticker to minimize API calls
        tickers = set(alert[2] for alert in alerts)
        prices = {}
        
        for ticker in tickers:
            backoff = 1
            for _ in range(3):
                try:
                    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={ticker}&apikey={API_KEY}"
                    res = requests.get(url, timeout=10).json()
                    
                    if "Global Quote" in res and "05. price" in res["Global Quote"]:
                        prices[ticker] = float(res["Global Quote"]["05. price"])
                        break
                    elif "Note" in res:
                        logger.warning("Rate limit hit, backing off...")
                        time.sleep(backoff)
                        backoff *= 2
                    else:
                        logger.error(f"Failed to get price for {ticker}: {res}")
                        break
                except Exception as e:
                    logger.error(f"Request failed for {ticker}: {e}")
                    time.sleep(backoff)
                    backoff *= 2
                    
        for alert in alerts:
            alert_id, user_id, ticker, target_price, alert_type, email = alert
            if ticker in prices:
                current_price = prices[ticker]
                triggered = False
                
                if alert_type == 'above' and current_price >= target_price:
                    triggered = True
                elif alert_type == 'below' and current_price <= target_price:
                    triggered = True
                    
                if triggered:
                    send_email_alert(email, ticker, current_price, target_price, alert_type)
                    cur.execute("UPDATE stock_alerts SET is_active = false WHERE id = %s", (alert_id,))
                    conn.commit()
                    
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error checking stock prices: {e}")

if __name__ == "__main__":
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_stock_prices, IntervalTrigger(minutes=60))
    scheduler.start()
    
    logger.info("Stock alert scheduler started. Press Ctrl+C to exit.")
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(2)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        logger.info("Scheduler shut down.")
