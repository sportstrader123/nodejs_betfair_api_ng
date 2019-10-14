#!/usr/bin node
"use strict";

/* IMPORTANT - PLEASE READ THE LICENSE TERMS BEFORE 
 * DECIDING IF YOU WISH TO MAKE USE OF THIS CODE

* Description
Module file with utility functions for reading/writing files

* DISCLAIMER: The code below is provided "as is". The author will accept 
* NO responsibility for ANY flaws in the code.
* This is not without risk, particularly if you run an insecure system and setup. 
* If you are not happy with this or ANY other aspect of what is written above 
* (including the license conditions) then PLEASE DO NOT RUN THE SCRIPT!
*/ 

var fs = require('fs');

module.exports = {
	
	stringToFile: function (filename, data) {
		// Async file write of supplied string to target filename. 
		// THIS WILL OVERWRITE THE FILE IF IT EXISTS ALREADY!		
		fs.writeFileSync(filename,data, function(err) {
			if (err)
			{
				console.log(err);
			}
		});
	},
	appendStringToFile: function (filename,data) {
		// Async appending of new string to existing file contents.
		// If file does not exist it is created
		fs.appendFile(filename,data, function (err) {
			if (err) 
			{
				console.log(err);
			}
		});
	},
	appendStringToFileSync: function (filename,data) {
		// Synchronous version of appendStringToFile
		fs.appendFileSync(filename,data, function (err) {
			if (err) 
			{
				console.log(err);
			}
		});
	}
}
