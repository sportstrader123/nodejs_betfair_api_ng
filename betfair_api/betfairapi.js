#!/usr/bin node

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
Module file with functions that invoke Betfair API operations

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

// import required packages
var fs = require('fs');
var url = require('url'); 
var https = require('https'); 

module.exports = {
	
	validateAPIResponse: function(response) {
		// If there was an error, we should get a betfair APINGException returned
		let success = true;
		if (response.error != null) 
		{
			success = true;
			// if error in response contains only two fields it means that there is no 
			// detailed message of exception thrown from API-NG
			//console.error("Error with request!!");
			//console.error(JSON.stringify(response, null, "\t"));
			console.log("Error with request!!");
			console.log("Error code: " + response.error.code);
			console.log("Message: " + response.error.message);
			if (Object.keys(response.error).length > 2) 
			{
				console.error("Exception Details: ");
				console.error(JSON.stringify(response.error.data.APINGException, null, "\t"));
			}
		}
		return success;
	},
	login : function(login_params,callback) {
		
		// Create an object to store parameters that will be passed 
		// to the callback function. These parameters include error 
		// state, message, HTTPS response status code, API login status 
		// returned by the login request (if we get a response back!)
		// and the session token if the login was successful.
		// We also store the application key from the input parameters
		// in the callback parameters in case the callback will be making
		// further API calls.
		
		// We will invoke the supplied callback function with the callback 
		// parameter object upon successful logon, or an exception or request
		// or response error occurs. Upon error, we populate the error_message
		// field with an informative error string.
		let callback_params = {};
		callback_params.response_status_code = 0;
		callback_params.login_status = 'ERROR';
		callback_params.session_id = '';
		callback_params.error = true;
		callback_params.error_message = '';
		callback_params.app_key = login_params.app_key;
		
		// Create URL object from the logon endpoint using the URL package
		// See this link:  https://nodejs.org/api/url.html#url_url 
		// for more details.
		const login_endpoint = "https://identitysso-cert.betfair.com/api/certlogin";
		let login_options = url.parse(login_endpoint);

		// We login with a HTTP POST request.
		// Set the header and options - including application key and the 
		// key file and cert file
		login_options.method = 'POST';
		login_options.port = 443;

		// Set the application key within the headers according to betfair documentation
		login_options.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Application': login_params.app_key
		};
		login_options.key = fs.readFileSync(login_params.keyfile);
		login_options.cert = fs.readFileSync(login_params.certfile);
		login_options.agent = new https.Agent(login_options);

		// Create a new https request object.
		let req = https.request(login_options, function(res) {    							
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
					const login_status = response.loginStatus;
					const response_code = res.statusCode;
					callback_params.login_status = login_status;
					callback_params.response_status_code = response_code; 
					if (200 === response_code)
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
							callback_params.session_id = response.sessionToken;
							callback_params.error = false;
							callback(callback_params);      							            
						}					
						else
						{
							callback_params.error_message = ("Login Failure. Reason: API loginStatus = " + login_status);
							callback(callback_params);    
						}	
					}		
					else
					{
						callback_params.error.message = ("Login Failure. Reason: HTTP response error code " + response_code);
						callback(callback_params);    
					}			
				}
				catch (e)
				{
					// JSON parser error - report the reason that the JSON was not
					// correctly parsed.
					callback_params.error_message = ("Login Failure. Reason: Exception caught (" + e.message + ")");
					callback(callback_params);    
				}
			});
			res.on('error', function(e) {
				// Error with response 
				callback_params.error_message = ("Login Failure. Reason: HTTPS response error (" + e.message + ")");				
				callback(callback_params);    
			});
		});

		// Create string that forms our request payload - this contains our login credentials
		let data = 'username=' + login_params.id + '&password=' + login_params.pw;

		// Post the request
		req.end(data);
		req.on('error', function(e) {
			// Error with the request
			callback_params.error_message = ("Login Failure. Reason: HTTPS request error (" + e.message + ")");			
			callback(callback_params);    
		});
	},
	
	listMarketCatalogue : function(params,callback) {
		// Input parameter params should contain two objects:
		// 1. https_options to create the https request with (contains app_key and session_id)
		// 2. market_filter (contains the market filter to apply to the request)
		
		let response_params = {};
		response_params.error = true;
		response_params.error_message = 'ERROR';
		response_params.data = '';
		response_params.https_options = params.https_options;
		
		let json_request = '{"jsonrpc":"2.0","method":"SportsAPING/v1.0/listMarketCatalogue", "params": ' + params.market_filter + ', "id": 1}';
		
		// Create a string buffer to store the response we get back
		let response_buffer = '';
		
		// Create the HTTPS request now
		let req = https.request(params.https_options,function (res) {
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
				response_params.data = response_buffer;
				response_params.error = false;
				response_params.error_message = "OK";
				callback(response_params);				
			});
			res.on('close', function(err) {
				// Socket close error handler				
				response_params.error_message = 'ERROR SOCKET CONNECTION CLOSED!';
				response_params.data = '';
				callback(response_params);
			});    
		});
			
		// Send Json request object
		req.write(json_request, 'utf-8');
		req.end();
		req.on('error', function(e) {
			// error handler for request			
			response_params.error_message = 'REQUEST ERROR: ' + e.message;
			response_params.data = '';
			callback(response_params);
		}); 		
	}
}
