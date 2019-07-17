#!/usr/bin node

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
This is a simple node.js script that will login to
your Betfair account via the Betfair API (via the 
non-interactive login). If successful, it will then
call the listEventTypes API operation and print to the 
console each listed event type ID, its name and the 
number of available markets for that event type.

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

var https = require('https');
var url = require('url'); 
var fs = require('fs');

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
    let id         = cli_params[0];
    let pw         = cli_params[1];
    let app_key    = cli_params[2];
    let cert_path  = cli_params[3];
    let key_path   = cli_params[4];
    
    login(id,pw,app_key,cert_path,key_path);
    
}

//============================================================ 
function parseListEventTypesResponse(data) 
{
    // Callback for when listEventTypes response is received
    // We parse the JSON response here.
    let todays_races = [];
    let todays_races_with_runners = [];
    let response = {};
    try
    {
        response = JSON.parse(data);
    }
    catch (ex)
    {
        console.error("Error parsing JSON response packet: " + ex.message);
        console.error("Offending packet content: " + data);
        return;
    }
    checkErrors(response);
    let eventlist = response.result;
    // Iterate over the items in the response and display 
    // the event type ID, name and the number of markets for each
    // event type
    for (let event of eventlist)
    {
        let evid = event.eventType.id;
        let evname = event.eventType.name;
        let mkcount = event.marketCount;
        console.log("   [" + evid + "]  " + evname + " (" + mkcount + " markets).");
    }
}

//============================================================ 
function getEventTypes(session_id, app_key) 
{
    // Create request options - the session token needs to be set here
    // as well as the application key
    let https_options = {
        hostname: 'api.betfair.com',
        port: 443,
        path: '/exchange/betting/json-rpc/v1',
        agent: new https.Agent(),
        method: 'POST',
        headers: {            
            'Accept': 'application/json',
            'Content-type' : 'application/json',
            'X-Authentication' : session_id,
            'Connection':'Keep-Alive',
            'X-Application' : app_key,
        }
    }
    
    // Have an empty filter for this request.
    let filter = '{"filter":{}}';

    // Create the JSON request - this involves setting the filter and the JSON-RPC interface method
    // - in this case we are calling the listEventTypes operation.
    let json_request = '{"jsonrpc":"2.0","method":"SportsAPING/v1.0/listEventTypes", "params": ' + filter + ', "id": 1}';
    
    // Create a string buffer to store the response we get back
    let response_buffer = '';
    
    // Create the HTTPS request now
    let req = https.request(https_options,function (res) {
        res.setEncoding('utf-8');
        res.on('data', function (chunk) {
            // Event handler for arrival of new data
            // Append the new data to the buffer
            response_buffer += chunk;
        });
        res.on('end', function() {
            // Event handler for end of data received.
            // When the transmission has ended we call the response
            // parser function
            parseListEventTypesResponse(response_buffer);
        });
        res.on('close', function(err) {
            // Socket close error handler
            console.log("Error - socket connection closed!");
            console.log(err);
        });    
    });
        
    // Send Json request object
    req.write(json_request, 'utf-8');
    req.end();
    req.on('error', function(e) {
        // error handler for request
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
                        console.log("Successfully logged in.");
                        // Store the session token. In this script we don't do anything with 
                        // it but in a full application this must be sent with every 
                        // API request we make to identify our session.
                        let sess_id = response.sessionToken;        
                                                                     
                        // Make the listEventTypes request
                        getEventTypes(sess_id, app_key);                  
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



//============================================================ 
function checkErrors(response) 
{
    // check for errors in response body
    if (response.error != null) 
    {
        // If the error object in the response contains only two fields it means that 
        // there is no detailed message of the exception thrown from API-NG
        if (Object.keys(response.error).length > 2) 
        {
            console.log("Error with request!!");
            console.log(JSON.stringify(response, null, '\t'));
            console.log("Exception Details: ");
            console.log(JSON.stringify(response.error.data.APINGException, null, '\t'));
        }
        // Exit program
        process.exit(1);
    }
}

