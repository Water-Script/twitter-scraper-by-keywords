# twitter-scraper-by-keywords

## **IMPORTANT**
1. Create an empty folder in the main directory called *"csvResult"*.
2. Change the values in the `.env` file to match your bot!!!
3. You MUST have Node.JS installed! (*Download version 16.15.0*)
> https://nodejs.org/en/

## Configs
- All configs are located in `src/config.json`  
- If you want to change the keywords, you can alter them in `src/keywords.json`.

## Running
- Go into the src folder and double click on the file called *"run.bat"*.
- The command prompt should open up and automatically start installing things the first time it is run. After that, it will start scraping twitter for tweets.
- Don't be alarmed by yellow text, it is red text that is bad.
- If there is a rate limit error, don't be alarmed. It just means that we picked up too many tweets in this time period. This will happen randomly since we can't control how many tweets we have to look through to find something viable. To fix, we just have to wait a few minutes for the limit to reset. You will have to run the program again.
- If you get the green success text at the bottom you can either close the window or press any key to exit the command prompt. The resulting CSV file is in the "csvResults" folder and is numbered starting at 0. 0 is the oldest CSV file. Feel free to delete the *CSV Files* if you no longer need them.

## Importing the CSV file to a Google Sheet
1. Go to file
2. Click import
3. Select Upload
4. Select the CSV file on your PC
5. Press the blue "Select" button
6. Under the "Import location" dropdown, select "Append to current sheet"
7. Under the "Separator type" dropdown, select "Comma"
8. Press "Import data"!
