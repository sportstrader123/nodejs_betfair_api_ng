#!/usr/bin node

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
This is part one of a two part market data gathering bot. 
The program will login to your Betfair account via the API 
and then call the listMarketCatalogue API operation with filters 
created to request todays match odds markets for English Premiership 
football (competition ID = 10932509). The full JSON response will be 
written to a file. The reason that the bot has 2 parts is that 
the market PRICE update operation listMarketBook does not return
market or runner names, just IDs. In order to map these to selection
names, we require a persistent log of the listMarketCatalogue call
that DOES contain market, event and selection names.
While this could be done within a single script, if we do this in the
PRICE gathering script, the market data file could be overwritten if we 
had to restart it due to a crash etc. This is because listMarketCatalogue
only returns markets that are OPEN.

The program will use your login credentials, application key and 
key and certificate files that you will need to create
(or already have) in order to do so.
Full details of the non-interactive logon process can
be found here
https://docs.developer.betfair.com/pages/viewpage.action?pageId=3834909

The code is run from the commandline and requires 8 parameters. These are
1. Betfair account username
2. Betfair account password
3. Betfair account API application key.
4. Certificate file
5. Key file
6. YEAR of the target date for which game markets are required.
7. MONTH of the target date for which game markets are required. Valid range 1-12
8. DAY of the target date for which game markets are required. Valid range 1-31

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

var bfapi          = require("../betfair_api/betfairapi.js");
var market_filters = require("../betfair_api/market_filters.js");
var file_utils     = require('../utilities/file_utils.js'); 

var output_filename = "";

run();

//============================================================ 
function print_cli_params()
{
    console.log("[1] - Username/ID");
    console.log("[2] - Password");
    console.log("[3] - Application Key");
    console.log("[4] - Path To Cert File");
    console.log("[5] - Path To Key File");
    console.log("[6] - Year of target date for market acquisition");
    console.log("[7] - Month of target date for market acquisition");
    console.log("[8] - Day of target date for market acquisition");
}

//============================================================ 
function run() 
{
    // Retrieve command line parameters
    var cli_params = process.argv.slice(2); 
    if (cli_params.length != 8)
    {
        console.log("ERROR - insufficient arguments supplied. Required arguments are:");
        print_cli_params();
        process.exit(1);
    }
    let program_params = {};    
    program_params.id            = cli_params[0];
    program_params.pw            = cli_params[1];
    program_params.app_key       = cli_params[2];
    program_params.certfile      = cli_params[3];
    program_params.keyfile       = cli_params[4];
    
    let year  = parseInt(cli_params[5]);
    let month = parseInt(cli_params[6]);
    let day   = parseInt(cli_params[7]);
    
    // Do some rough date validity checking
    let today = new Date();
    if ((year < today.getFullYear()) || month < 1 || day < 1 || month > 12 || day > 31)
    {
        console.log("ERROR - supplied date parameters are invalid!\nProgram terminated.");
        process.exit(1);
    }
    
    // Create the output filename - this includes the target date
    output_filename = year + "_" + month + "_" + day + "_English_Premiership_markets.json";
    console.log("Output filename = " + output_filename);
    program_params.month = month - 1;
    program_params.year  = year;
    program_params.day   = day;
    
    bfapi.login(program_params,loginCallback);
}

//============================================================ 
function loginCallback(params)
{
    // Login callback - will be called when bfapi.login receives a response
    // from the API or encounters an error
    if (params.error === false)
    {
        console.log("Login successful!");
               
        // Create a market filters now to get the next 10 
        // UK greyhound race WIN markets
  
        // Create the filter to get the markets we want. We ask for first 10 greyhound WIN 
        // markets that start after the current time now.
            
        let comp_ids          = [10932509];      // English Premiereship football        
        let market_types      = ["MATCH_ODDS"];  // correct score and match odds markets
        const max_num_markets = 200;             // maximum of 200 markets 
        
        // Create start and end times to cover the year/month/day chosen by the user and 
        // stored in the program parameters argument to this function
        let end_date = new Date();
        end_date.setUTCFullYear(params.input_params.year,
                                params.input_params.month,
                                params.input_params.day);        
        end_date.setUTCHours(23);
        end_date.setUTCMinutes(59);
        end_date.setUTCSeconds(59);
        
        let start_date = new Date();
        start_date.setUTCFullYear(params.input_params.year,
                                  params.input_params.month,
                                  params.input_params.day);
        start_date.setUTCHours(0);
        start_date.setUTCMinutes(0);
        start_date.setUTCSeconds(0);    
        
        let start_date_string = start_date.toJSON();
        let end_date_string = end_date.toJSON();
        
        console.log("Getting markets that start between " + start_date + " and " + end_date);
        
        // Create market filter from the above data
        const filter = market_filters.createMarketFilterByCompIDs(comp_ids,
                                                                  market_types,
                                                                  start_date_string,
                                                                  end_date_string,
                                                                  max_num_markets);                                
   
        bfapi.listMarketCatalogue(params.session_id,
                                  params.app_key,
                                  filter,
                                  parseListMarketCatResponse);
    }
    else
    {
        console.log(params.error_message);
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
            file_utils.stringToFile(output_filename,JSON.stringify(response,null,"\t"));
            console.log("Market information written to " + output_filename);    
        }
    }
    else
    {
        console.log(response_params.error_message);
    }
}
