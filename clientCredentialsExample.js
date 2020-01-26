'use strict';

process.env.NODE_DEBUG = 'adp-connection';

var debug = require('./lib/debug');
var adpConnection = require('./index');

var connectionOpts = {
	clientId: '88a73992-07f2-4714-ab4b-de782acd9c4d',
	clientSecret: 'a130adb7-aa51-49ac-9d02-0d4036b63541',
	granttype: 'client_credentials',
	sslCertPath: 'iatCerts/apiclient_iat.pem',
	sslKeyPath: 'iatCerts/apiclient_iat.key',
	apiUrl: 'https://api.adp.com',
	tokenUrl: 'https://api.adp.com/auth/oauth/v2/token',
	authorizationUrl: 'https://accounts.adp.com/auth/oauth/v2/authorize'
};

var conn = adpConnection.createConnection(connectionOpts);
function connectionComplete(err) {
	if(err) {
		debug('Not Connected');
	}else{
		debug('Connected with token: ' + conn.accessToken);
	}
}
conn.connect(connectionComplete);

