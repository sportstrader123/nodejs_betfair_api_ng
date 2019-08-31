#!/usr/bin node

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
This is a simple node.js script that will login to
your Betfair account via the Betfair API (via the 
non-interactive login). If successful, it will request 
the NEXT UK horserace market via the listMarketCatalogue 
API operation.
Finally it will retrieve and display the last traded price
of each runner via the listMarketBook API operation.

It will use your login credentials, application key and 
key and certificate files that you will need to create
(or already have) in order to do so.
Full details of the non-interactive logon process can
be found here
https://docs.developer.betfair.com/pages/viewpage.action?pageId=3834909

The code is run from the commandline and requires 5 parameters. These are
1. Betfair account username
2. Betfair account password
3. Betfair account API application key.
4. Certificate file
5. Key file

* DISCLAIMER: The code below is provided "as is" as a working example of how node.js 
* can be used to login to your Betfair account via the API-NG. 
* I am not a node.js expert and I will accept NO responsibility for ANY 
* flaws in the code. Please be aware that you will need to enter your username
* and password in plain text onto the command line. This is not without risk, particularly 
* if you run an insecure system and setup. If you are not happy with 
* this or ANY other aspect of what is written above (including the license conditions)
* then PLEASE DO NOT RUN THE SCRIPT!
*/ 

"use strict";

var bfapi = require("../betfair_api/betfairapi.js");
var market_filters = require("../betfair_api/market_filters.js");

let market = {};

run();

//============================================================ 
function print_cli_params()
{
    console.log("[1] - Username/ID");
    console.log("[2] - Password");
    console.log("[3] - Application Key");
    console.log("[4] - Path To Cert File");
    console.log("[5] - Path To Key File");
}

//============================================================ 
function run() 
{
    // Retrieve command line parameters
    var cli_params = process.argv.slice(2); 
    if (cli_params.length != 5)
    {
        console.log("Error - insufficient arguments supplied. Required arguments are:");
        print_cli_params();
        process.exit(1);
    }
    let login_params = {};    
    login_params.id            = cli_params[0];
    login_params.pw            = cli_params[1];
    login_params.app_key       = cli_params[2];
    login_params.certfile     = cli_params[3];
    login_params.keyfile      = cli_params[4];
    
    bfapi.login(login_params,loginCallback);
}

//============================================================ 
function loginCallback(login_response_params)
{
    // Login callback - will be called when bfapi.login receives a response
    // from the API or encounters an error
    if (login_response_params.error === false)
    {
        console.log("Login successful!");
        

        // Create a market filters now to get the next 10 
        // UK greyhound race WIN markets
  
        // Create the filter to get the markets we want. We ask for first 10 greyhound WIN 
        // markets that start after the current time now.
            
        let event_types = [7];                   // Horse racing event type only
        let countries = ["GB"];                  // GB markets ONLY
        let market_types = ["WIN"];              // WIN markets only
        let start_time = new Date().toJSON();    // start time is NOW
        let end_time = '';                       // no end time just market count limit
        const max_num_markets = 1;               // request ONE market only
        const filter = market_filters.createMarketFilter(event_types,
                                                         countries,
                                                         market_types,
                                                         start_time,
                                                         end_time,
                                                         max_num_markets);                                

        bfapi.listMarketCatalogue(login_response_params.session_id,
                                  login_response_params.app_key,
                                  filter,
                                  parseListMarketCatResponse);
    }
    else
    {
        console.log(login_response_params.error_message);
    }                                                                                                                    
}

//============================================================ 
function parseListMarketCatResponse(response_params) 
{
    // Callback for when listMarketCatalogue response is received
    // Input parameter response_params contains the following data:
    //    1. response_params.error - a boolean error flag
    //    2. response_params.error_message - string containing error details or "OK" when no error
    //    3. response_params.data - string containing the JSON response
    //    4. response_params.session_id - string storing session token value
    //    5. response_params.app_key - string storing application key
    if (response_params.error === false)
    {
        
        let response = {};
        try
        {
            response = JSON.parse(response_params.data);
        }
        catch (ex)
        {
            console.error("Error parsing JSON response packet: " + ex.message);
            console.error("Offending packet content: " + data);
            return;
        }
        if (bfapi.validateAPIResponse(response))
        {
            let result = response.result;            
            // We only ask for one market so we only expect one returned
            if (1 === result.length)                                
            {
                // populate the global market object with 
                // market information and runners
                market.id = result[0].marketId;
                market.marketName = result[0].event.name + ' ' + result[0].marketName;
                let starttime = new Date(result[0].marketStartTime);
                let tm = '';
                let vhour = starttime.getUTCHours();
                if (vhour < 10)
                {
                    tm += ('0' + vhour + ':');
                }
                else
                {
                    tm += (vhour + ':');
                }
                let vmin = starttime.getUTCMinutes();
                if (vmin < 10)
                {
                    tm += ('0' + vmin);
                }
                else
                {
                    tm += vmin;
                }
                
                market.startTime = tm
                market.type = result[0].description.marketType;    
                market.runners = [];
                                    
                let runner_array = result[0].runners; 
                console.log("Next market:");  
                console.log(market.startTime + ' - ' + market.marketName + ', ID = ' + market.id);  
                console.log("Runners:");  
                for (let j = 0; j < runner_array.length; j++)
                {
                    let selection = {};
                    selection.id = runner_array[j].selectionId;
                    selection.runnerName = runner_array[j].runnerName;
                    market.runners.push(selection);                    
                    console.log("\t" + selection.runnerName + ' = ' + selection.id);       
                }            
                
                // Make the listMarketBook call with the market ID we have
                getMarketPrices(market.id, response_params.session_id, response_params.app_key);
            }
            else
            {
                console.log("ERROR - unexpected number of markets returned by listMarketCatalogue!");            
            }
        }
        else
        {
            console.log("Error with listMarketCatalogue response packet!");            
        }
    }
    else
    {
        console.log(response_params.error_message);
    }
}


//============================================================ 
function parseListMarketBookResponse(response_params) 
{
    // Callback for when listMarketBook response is received
    // Input parameter response_params contains the following data:
    //    1. response_params.error - a boolean error flag
    //    2. response_params.error_message - string containing error details or "OK" when no error
    //    3. response_params.data - string containing the JSON response
    //    4. response_params.session_id - string storing session token value
    //    5. response_params.app_key - string storing application key
    if (response_params.error === false)
    {
        let response = {};
        try
        {
            response = JSON.parse(response_params.data);
        }
        catch (ex)
        {
            console.error("Error parsing JSON response packet: " + ex.message);
            console.error("Offending packet content: " + data);
            return;
        }
        if (bfapi.validateAPIResponse(response))
        {
            // We expect ONLY one market
            let result = response.result;
            if (1 === result.length)
            {            
                const market_book = result[0];
                // verify returned market ID matches the one we expect
                
                if (market_book.marketId === market.id)
                {
                    console.log("\nPrice and status information for market " + market.id);                
                    // Display last traded price (LPM) for each runner returned by the 
                    // operation as well as its current status.
                    if (market_book.status === "CLOSED")
                    {                    
                        console.log("Market is now CLOSED.");
                    }            
                    else
                    {                        
                        console.log("Market Status: " + market_book.status);
                        let runner_array = market_book.runners;                
                        const runner_count = runner_array.length;
                        for (let k = 0; k < market.runners.length; ++k)
                        {
                            for (let i = 0; i < runner_count; ++i)
                            {
                                if (runner_array[i].selectionId === market.runners[k].id)
                                {
                                    // Found runner 
                                    const runner_name = market.runners[k].runnerName;
                                    console.log("\t" + runner_name + " [" + runner_array[i].status + "] Last price traded: " + runner_array[i].lastPriceTraded);
                                    break;
                                }
                            }
                        }
                    }
                }
                else
                {
                    console.log("ERROR unexpected market ID returned by listMarketBook!");
                }            
            }
        }
    }
    else
    {
        console.log(response_params.error_message);
    }
}

//============================================================ 
function getMarketPrices(market_id, session_id, app_key) 
{     
    // We ONLY want market prices, not orders - so we dont need to send matchProjection 
    // or orderProjection, just priceProjection
    const num_markets = 1;
    
    // Create the filter
    let filters = '{"marketIds":["' + market_id + '"]';            
    filters += ',"priceProjection":{"priceData":["EX_ALL_OFFERS","EX_TRADED"],"virtualise":false}}';
        
    bfapi.listMarketBook(session_id, app_key, filters, parseListMarketBookResponse);        
}











