# nodejs_betfair_api_ng

This project exists to provide a learning resource for people interested in developing automated betting
tools using the Betfair API. Contained within the repository are simple working examples of how to access 
Betfair via the API-NG (NOT the streaming API) using node.js scripts. Each script will focus on a particular 
API operation such as logging in, requesting market information for particular market filters, requesting 
market price information etc.

## Requirements

In order to make full use of this code, the following will be required:

* A valid Betfair account
* A Betfair API application key. There are 2 possible ways forward here:
	1. Free access using the DELAYED application key for your account.
	2. Purchase of a LIVE application key from Betfair at the current cost of £299. 
* An installation of node.js on your computer. How to do this will vary depending on your operating system. 
* Creation of a self signed SSL certificate to login to the account via the API non-interactive login mechanism. 

## API Keys, SSL certificates and Node.js installation

Betfair documentation on what application keys are and how to obtain them can be found [here](https://docs.developer.betfair.com/display/1smk3cen4v3lu3yomq5qye0ni/Application+Keys)

Information on SSL certificate creation and non-interactive login can be found [here](https://docs.developer.betfair.com/display/1smk3cen4v3lu3yomq5qye0ni/Non-Interactive+%28bot%29+login)

A good starting point for information on how to install node.js can be found [here](https://nodejs.org/en/)

Additionally, a tutorial on performing all of the above steps can be found at https://loydtrades.com/betfair-api-ng-certificates-keys/

## Betfair API documentation

For general information regarding the API more information please visit https://developer.betfair.com/en/get-started/

General API documentation including detailed descriptions of available API operations can be found at https://docs.developer.betfair.com/

## License

All source code within this project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.



   



