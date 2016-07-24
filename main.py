#!/usr/bin/python
from bs4 import BeautifulSoup
import urllib.request
from selenium import webdriver

# Set up the webdriver with extensiosn
# options = webdriver.ChromeOptions() 
# options.add_extension("./optional-chromedriver-plugins/ublockorigin.crx")
# options.add_extension("./optional-chromedriver-plugins/blockimages.crx")
# options.add_extension("./optional-chromedriver-plugins/disableautoplay.crx")
# driver = webdriver.Chrome(chrome_options=options)
# driver.get("https://www.kissanime.to/Login")

ffprofile = webdriver.FirefoxProfile("./366j48ag.selenium")
driver= webdriver.Firefox(firefox_profile=ffprofile)

driver.get("https://www.kissanime.to/AnimeList")

# Get inputs for login + serach -- OUTDATED
# username = input("Username: ")
# password = getpass.getpass("Password: ")
# user_elem = driver.find_element_by_id("username")
# user_elem.send_keys(username)
# pass_elem = driver.find_element_by_id("password")
# pass_elem.send_keys(password)
# driver.find_element_by_id("btnSubmit").click()

# get keywords to search
keyword = input("Enter Search Terms: ")
print("Loading...")

# Send data
search_elem = driver.find_element_by_id("keyword")
search_elem.send_keys(keyword)

driver.find_element_by_id("imgSearch").click()
# check if you typed exact anime (kiss will forward to episodes page)
links = []
if("/Anime/" not in driver.current_url):
    # parse links
    soup = BeautifulSoup(driver.page_source, "html.parser")

    for a in soup.find_all('a', href=True):
        if "/Anime/" in a['href']:
            links.append(a['href'])

    # Get Input
    print("Enter which ones to download:")

    for i in range(0, len(links)):
        print("  " + str(i+1) + "  " + links[i][7:])
    print("--------------------------------------------------")

    num_string = input(">> ")

    # Map input to a list of ints
    nums = map(int, num_string.split(' '))

else:
    links = driver.current_url
    nums = [1]

# Cycle through the list of ints (Shows)
for which in nums:
    theName = links[which-1][7:]

    driver.get("https://kissanime.to" + links[which-1])

    #find all the episodes
    soup = BeautifulSoup(driver.page_source, "html.parser")
    episode_links = []
    for a in soup.find_all('a', href=True):
        if "/Episode-" in a['href'] and '?' in a['href']:
            episode_links.append(a['href'])
    
    episode_links.sort()
    print("Enter which ones to download (Press ENTER for all):")

    for i in range(0, len(episode_links)):
        print("  " + str(i+1) + "  " + episode_links[i][7:len(episode_links[i])-8])
    print("--------------------------------------------------")

    episodes_in = input(">> ") 
    if(episodes_in == ""):
        which_episodes = list(range(1, 1+len(episode_links)))
    else:
        if '-' in episodes_in:
            episode_range = list(map(int, episodes_in.split('-')))
            which_episodes = list(range(episode_range[0], episode_range[1]+1))
        else:
            which_episodes = list(map(int, episodes_in.split(' ')))

    print("Downloading episodes ",  which_episodes)

    # Cycle through the episodes and download one at a time

    for n in which_episodes:
        driver.get("https://kissanime.to"+ episode_links[n-1])

        soup = BeautifulSoup(driver.page_source, "html.parser")

        thelink = 0
        for a in soup.find_all('a', href=True):
            if "redirector.googlevideo.com" in a['href']:
                thelink = a['href']
                break
        filename = theName + "_" + str(n) + ".mp4"

        print("Downloading " + filename + "...")

        urllib.request.urlretrieve(thelink, filename) 


print("Done!")



