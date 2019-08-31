#!/usr/bin node

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
This is a simple node.js script that provides an example 
of how to list markets specific to a competition type.
The program will login to your Betfair account via the API 
and then call the listMarketCatalogue API operation with filters 
created to request todays match odds and correct score markets for 
US Major League Football competition (ID = 141). For each market
the start time, marked ID, market name and market type will be
printed to console.

The program will use your login credentials, application key and 
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

"use strict"

var bfapi = require("../betfair_api/betfairapi.js");
var market_filters = require("../betfair_api/market_filters.js");

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
            
        let comp_ids = [141];                                // US Major league football        
        let market_types = ["MATCH_ODDS","CORRECT_SCORE"];   // correct score and match odds markets
        const max_num_markets = 200;                         // maximum of 200 markets 
        
        // Create start and end times to cover the current day (in UTC time zone)    
        let date = new Date();
        date.setUTCHours(23);
        date.setUTCMinutes(59);
        date.setUTCSeconds(59);
        let end_date = date.toJSON();
        date.setUTCHours(0);
        date.setUTCMinutes(0);
        date.setUTCSeconds(0);    
        let start_date = date.toJSON();
        
        // Create market filter from the above data
        const filter = market_filters.createMarketFilterByCompIDs(comp_ids,
                                                                  market_types,
                                                                  start_date,
                                                                  end_date,
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
            let market_array_length = result.length;
            console.log("Response contains " + market_array_length + " markets:");
            for (let i = 0; i < market_array_length; i++) 
            {
                let market = {};
                market.id = result[i].marketId;
                market.marketName = result[i].event.name + ' - ' + result[i].marketName;
                
                let starttime = new Date(result[i].marketStartTime);
                market.type = result[i].description.marketType;    
                market.numSelections = result[i].runners.length;            
                let market_string = (starttime.toTimeString() + " : " + market.id + " (" + market.marketName + ") : [" + market.type + "]");    
                console.log(market_string);
            }          
        }
    }
    else
    {
        console.log(response_params.error_message);
    }
}
