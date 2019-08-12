#!/usr/bin node

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
This is a simple node.js script that will login to
your Betfair account via the Betfair API (via the 
non-interactive login). If successful, it will then
call the listMarketCatalogue API operation with filters 
created to request the next 10 British Greyhound WIN 
markets that start AFTER the time the request is made.
When the response is received, the start time, name and 
Betfair ID of each market is printed to the console. 
Under each market the name and Betfair ID of each runner
is printed.

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
var https = require('https');

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
    login_params.id        	= cli_params[0];
    login_params.pw        	= cli_params[1];
    login_params.app_key   	= cli_params[2];
    login_params.certfile 	= cli_params[3];
    login_params.keyfile  	= cli_params[4];
    
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
		
		let https_options = {
			hostname: 'api.betfair.com',
			port: 443,
			path: '/exchange/betting/json-rpc/v1',
			agent: new https.Agent(),
			method: 'POST',
			headers: {            
				'Accept': 'application/json',
				'Content-type' : 'application/json',
				'X-Authentication' : login_response_params.session_id,
				'Connection':'Keep-Alive',
				'X-Application' : login_response_params.app_key,
			}
		}
		// Create a market filters now to get the next 10 
		// UK greyhound race WIN markets
  
		// Create the filter to get the markets we want. We ask for first 10 greyhound WIN 
		// markets that start after the current time now.
		    
		let event_types = [4339];				// Greyhound event type only
		let countries = ["GB"];					// GB markets ONLY
		let market_types = ["WIN"];				// WIN markets only
		let start_time = new Date().toJSON();	// start time is NOW
		let end_time = ''; 						// no end time just market count limit
		const max_num_markets = 10;				// maximum of 10 markets 
		const filter = market_filters.createListMarketCatFilter(event_types,
																countries,
																market_types,
																start_time,
																end_time,
																max_num_markets);								
		let list_mkt_cat_params = {};
		list_mkt_cat_params.https_options = https_options;
		list_mkt_cat_params.market_filter = filter;
		bfapi.listMarketCatalogue(list_mkt_cat_params,parseListMarketCatResponse);
	}
	else
	{
		console.log(login_response_params.error_message);
	}																													
}

//============================================================ 
function parseListMarketCatResponse(response_params) 
{
	if (response_params.error === false)
	{
		// Callback for when listMarketCatalogue response is received
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
			
			// check for zero length - indicates racing done for the day.
			for (let i = 0; i < market_array_length; i++) 
			{
				let market = {};
				market.id = result[i].marketId;
				market.marketName = result[i].event.name + ' ' + result[i].marketName;
				let starttime = new Date(result[i].marketStartTime);
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
				market.type = result[i].description.marketType;	
				market.numSelections = result[i].runners.length;			
				let market_string = (market.startTime + ' - ' + market.marketName + ', ID = ' + market.id);	
						
				console.log(market_string);
				for (let jk = 0; jk < market.numSelections; jk++)
				{
					let selection = {};
					selection.id = result[i].runners[jk].selectionId;
					selection.runnerName = result[i].runners[jk].runnerName;
					let runner_string = ("\t" + selection.runnerName + ' = ' + selection.id);		
					console.log(runner_string);
				}			
			}
		}
	}
	else
	{
		console.log(response_params.error_message);
	}
}












