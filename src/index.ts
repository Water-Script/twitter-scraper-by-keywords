import TwitterApi, {ApiResponseError, TwitterV2IncludesHelper} from "twitter-api-v2";
import TwitterApiRateLimitPlugin from "@twitter-api-v2/plugin-rate-limit";
import dotenv from "dotenv";
import {words as keywords} from "./keywords.json";
import config from "./config.json";
import {promises as fs} from "fs";
import chalk from "chalk";

interface UserData {
    tweetText: string;
    tweetId: string;
    tweetUrl: string;
    userId: string;
    userUrl: string;
    username: string;
    displayName: string;
}

dotenv.config();

async function arrayToCsv(data: UserData[]) {
    if (!data[0]) {  // Sanity check.
        //console.error(chalk.red("NO DATA PASSED INTO FUNCTION.\nTHIS SHOULD NOT BE RUNNING!"));
        //process.exit();
        throw new Error("NO DATA PASSED INTO JSON TO CSV FUNCTION. THIS SHOULD NEVER HAPPEN!");
    }

    let csv = data.map(row => Object.values(row));
    csv.unshift(Object.keys(data[0]));
    let csvStr = `"${csv.join('"\n"').replace(/,/g, '","')}"`;
    
    try {
        const affex: number = (await fs.readdir("./csvResult")).length;
        await fs.writeFile(`./csvResult/data_${affex}.csv`, csvStr, "utf-8");
    } catch(err) {
        throw err;
    }
}

const rateLimitPlugin = new TwitterApiRateLimitPlugin();
const client = new TwitterApi(process.env.BEARER_TOKEN as string, {plugins: [rateLimitPlugin]});
//const client = new TwitterApi(process.env.BEARER_TOKEN as string);
let userData: UserData[] = [];
let ids: string[] = [];
let totalSearches: number = 0;

// A solution to waiting until everything completes in a current iteration
// before continuing; an async friendly .forEach() implemenation.
keywords.reduce(async function(promise, word) {
    await promise;
    console.log(`Searching for ${word}...`);

    if (totalSearches >= config.TotalMaxSearchRequests) {
        console.log(chalk.redBright("  > Max searches reached."));
        console.log(`Requests: ${totalSearches}\nMax: ${config.TotalMaxSearchRequests}`);
        return;  // We can't break out of the function so we just have to exit early.
    }
    
    let tweetsSaved: number = 0;
    let tweets = await client.v2.search(word, {
        "tweet.fields": ["author_id", "lang", "in_reply_to_user_id", "referenced_tweets"],
        "user.fields": ["name", "username", "url", "id"],
        "expansions": ["author_id"]
    });

    //do {  // This allows us to get the next page if we still have enough requests left.
    while (tweetsSaved < config.MaxTweetsPerKeyword && totalSearches < config.TotalMaxSearchRequests) {
        const includes = new TwitterV2IncludesHelper(tweets);
        totalSearches += 10;
        //let limit = await rateLimitPlugin.v2.getRateLimit("users/me");

        for (const tweet of tweets) {
            const user = includes.userById(tweet?.author_id ?? "");

            // Throw out the tweet if we won't be able to use it.
            if (tweet.lang != "en" || !tweet.author_id || tweet.referenced_tweets?.[0] || !user
                || ids.indexOf(tweet.id) !== -1)
            {
                continue;
            }

            let data: UserData = {
                tweetText: tweet.text.replace(/(\\n|\n)/g, " ").replace(/('|"|,|???|???|???|???)/g, ""),  // Remove newlines and quotes.
                tweetId: tweet.id,
                tweetUrl: `https://twitter.com/i/web/status/${tweet.id}`,
                userId: user.id,
                userUrl: user.url || `https://twitter.com/${user?.username}`,
                username: `@${user.username}`,
                displayName: user.name
            };
            tweetsSaved++;
            userData.push(data);
            ids.push(tweet.id);

            if (tweetsSaved >= config.MaxTweetsPerKeyword) {
                break;
            }
        }

        if (tweetsSaved < config.MaxTweetsPerKeyword) {  // If we didn't break out of the loop, get the next page of results.
            console.log("  > Fetching next page...");

            try {
                tweets = await tweets.next();
            } catch (error) {
                if (error instanceof ApiResponseError && error.rateLimitError && error.rateLimit) {
                    //const resetIn = (error.rateLimit.reset * 1000) - Date.now();
                    console.error(chalk.red(`RATE LIMIT ERROR: ${error.rateLimit.reset}`));

                    // if (resetIn <= 60) {
                    //     console.log(chalk.yellow("AUTO WAITING FOR RESTART"));
                    //     await wait(resetIn);
                    // } else {
                    //     process.exit();
                    // }
                    process.exit();
                } else {
                    //throw error;
                    console.error(chalk.red(error));
                    process.exit();
                }
            }
        } else {
            console.log(chalk.yellow(`  > Reached max tweets for this keyword. (${tweetsSaved}/${config.MaxTweetsPerKeyword})`));
            break;
        }
    //} while (totalSearches < config.TotalMaxSearchRequests);
    }
}, Promise.resolve()).then(function() {
    // Since we can't use top-level await with ts-node using commonJS, we just have
    // to use.then() on the promise.
    console.log(chalk.green("Finished searching for tweets."));
    arrayToCsv(userData);
    console.log(chalk.green("csv file created!"));
}).catch(function(err) {
    console.error(chalk.red(err));
});