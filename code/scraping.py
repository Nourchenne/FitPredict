import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime

def scrape_financial_news(url="https://www.cnbc.com/finance/"):
    """
    Scrapes headlines and links from the CNBC Finance page.
    Objective: Extract data for sentiment analysis and market trend prediction.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    print(f"Fetching news from {url}...")
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to retrieve data. Status code: {response.status_code}")
        return None
    
    soup = BeautifulSoup(response.content, "html.parser")
    
    # Selecting the news cards - logic depends on the site's HTML structure
    # In CNBC, headlines are often in 'a' tags inside 'div' with specific classes
    news_items = []
    
    cards = soup.find_all("div", class_="Card-textContent")
    
    for card in cards:
        title_tag = card.find("a", class_="Card-title")
        time_tag = card.find("time")
        
        if title_tag:
            headline = title_tag.text.strip()
            link = title_tag["href"]
            timestamp = time_tag.text.strip() if time_tag else datetime.now().strftime("%Y-%m-%d")
            
            news_items.append({
                "headline": headline,
                "timestamp": timestamp,
                "link": link if link.startswith("http") else f"https://www.cnbc.com{link}"
            })
    
    return pd.DataFrame(news_items)

if __name__ == "__main__":
    df = scrape_financial_news()
    
    if df is not None and not df.empty:
        print(f"Successfully scraped {len(df)} news items.")
        print(df.head())
        
        # Save to data folder
        df.to_csv("data/financial_news.csv", index=False)
        print("Data saved to data/financial_news.csv")
    else:
        print("No news items found.")
