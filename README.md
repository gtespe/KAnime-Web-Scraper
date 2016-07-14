# Web_Scraper

By Grant Espe

This program is used to download anime in bulk off of www.kissanime.to

To Run, Simply execute ./getAnime.sh
    this will launch a chrome webdriver in a hidden xvfb window

Dependencies:

    Firefox (default)
    OR Chrome Webdriver:
        https://sites.google.com/a/chromium.org/chromedriver/downloads

    xvfb:
        install with your prefered package manager

    python dependencies:
        
        Selenium:
            sudo pip install selenium
        
        BeautifulSoup:
            sudo pip install BeautifulSoup

You also need a kissanime account to run this script
    (Your username and password are never logged)
