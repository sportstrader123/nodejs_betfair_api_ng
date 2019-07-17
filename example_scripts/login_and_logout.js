#!/usr/bin node

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
This is a simple node.js script that will login to
your Betfair account via the Betfair API (via the 
non-interactive login) and then logout again.
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

"use strict"
// Packages required
var https = require('https');
var fs = require('fs');
var url = require('url'); 

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
    let id          = cli_params[0];
    let pw          = cli_params[1];
    let app_key     = cli_params[2];
    let cert_path   = cli_params[3];
    let key_path    = cli_params[4];
    
    login(id,pw,app_key,cert_path,key_path);
}

//============================================================ 
function logout(session_id)
{
	console.log("Attempting to logout...");
	let logout_endpoint = 'https://identitysso.betfair.com/api/logout';
	
	let logout_options = url.parse(logout_endpoint);
	
	logout_options.method = 'POST';
    logout_options.port = 443;
    
    // Need to populate the header with the session token that we obtained at login
	logout_options.headers = {
		'Accept': 'application/json',
		'X-Authentication' : session_id        
    };
    
    logout_options.agent = new https.Agent(logout_options);

    // Create a new https request object.
    let req = https.request(logout_options, function(res) {    
		// Display the https request status code
        console.log("HTTP status code:", res.statusCode);
            
        // Create string to store the API response data
        let responseData = "";
        res.on('data', function(new_data) {
            // New data arrived - append to existing string buffer
            responseData += new_data;
        });
        res.on('end', function() {
            // On end handler. Fires when the response has been fully received
            try
            {
                // Parse the response JSON
                let response = JSON.parse(responseData);
                if (200 === res.statusCode)
                {
                    // Received HTTP status code 200. 
                    // The response is a JSON object that contains a status
                    // code.
                    if ("SUCCESS" === response.status)
                    {
                        // Logged out successfully!!                                                            
                        console.log("Logout sucessful!");
                    }
                    else
                    {
                        // Logoout unsuccessful - display status and error 
                        console.log("Logout attempt failed, response status = " + response.status + ", error = " + response.error);                        
                    }
                }
                else
                {
                    // Logout failed. Report the HTTP error status code
                    console.error("Logout attempt failed! HTTP status code = " + res.statusCode);
                }
            }
            catch (e)
            {
                // JSON parser error - report the reason that the JSON was not
                // correctly parsed.
                console.error("JSON parse error: " + e.message);
            }
        });
        res.on('error', function(e) {
            // Error with response - dump to console.
            console.error(e);
        });
    });
    
    // Post the request
    req.end();
    req.on('error', function(e) {
        // Error with the request  - dump to console.
        console.log('Problem with request: ' + e.message);
    });

}

//============================================================ 
function login(id,pw,app_key,cert_path,key_path)
{
	console.log("Attempting to login...");
    let login_endpoint = "https://identitysso-cert.betfair.com/api/certlogin";
    
    // Create URL object from the logon endpoint using the URL package
    // See this link:  https://nodejs.org/api/url.html#url_url 
    // for more details.
    let login_options = url.parse(login_endpoint);

    // We login with a HTTP POST request.
    // Set the header and options - including application key and the 
    // key file and cert file
    login_options.method = 'POST';
    login_options.port = 443;

    // Set the application key within the headers according to betfair documentation
    login_options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Application': app_key
    };
    login_options.key = fs.readFileSync(key_path);
    login_options.cert = fs.readFileSync(cert_path);
    login_options.agent = new https.Agent(login_options);

    // Create a new https request object.
    let req = https.request(login_options, function(res) {   
		// Display the https request status code 
        console.log("HTTP status code:", res.statusCode);
            
        // Create string to store the API response data
        let responseData = "";
        res.on('data', function(new_data) {
            // New data arrived - append to existing string buffer
            responseData += new_data;
        });
        res.on('end', function() {
            // On end handler. Fires when the response has been fully received
            try
            {
                // Parse the response JSON
                let response = JSON.parse(responseData);
                if (200 === res.statusCode)
                {
                    // Received HTTP status code 200. 
                    // The response is a JSON object that contains a status
                    // code. If login was successful, it also includes a session token.                    
                    // See Betfair documentation on the non-interactive login for more
                    // details
                    if ("SUCCESS" === response.loginStatus)
                    {
                        // Successful logon!!                                    
                        // Store the session token. In this script we don't do anything with 
                        // it but in a full application this must be sent with every 
                        // API request we make to identify our session.
                        let sess_id = response.sessionToken;        
                                            
                        // That is it! We have successfully logged on
                        console.log("Successfully logged in.");      
                        
                        // Now we have successfully logged in we will try to logout
                        logout(sess_id);                  
                    }
                    else
                    {
                        // Logon unsuccessful - API indicates a logon error - display it
                        console.log("Login attempt failed. API loginStatus " + response.loginStatus);
                    }
                }
                else
                {
                    // Login failed. Report the HTTP error status code
                    console.error("Login failed! HTTP status code = " + res.statusCode);
                }
            }
            catch (e)
            {
                // JSON parser error - report the reason that the JSON was not
                // correctly parsed.
                console.error("JSON parse error: " + e.message);
            }
        });
        res.on('error', function(e) {
            // Error with response - dump to console.
            console.error(e);
        });
    });

    // Create string that forms our request payload - this contains our login credentials
    let data = 'username=' + id + '&password=' + pw;

    // Post the request
    req.end(data);
    req.on('error', function(e) {
        // Error with the request  - dump to console.
        console.log('Problem with request: ' + e.message);
    });
}
