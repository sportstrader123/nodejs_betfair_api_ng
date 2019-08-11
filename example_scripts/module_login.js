#!/usr/bin node

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
This is a simple node.js script that will login to
your Betfair account via the Betfair API (via the 
non-interactive login).
This is very similar to the login.js but aims to show the use of 
callback functions and modules.

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
// Packages required
var bfapi = require("../betfair_api/betfairapi.js");

run_login();

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
function run_login() 
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
    
    bfapi.login(login_params,login_callback);
}

//============================================================ 
function login_callback(params)
{
	if (params.error === false)
	{
		console.log("Login successful!");
	}
	else
	{		
		console.log(params.error_message);
	}
}
