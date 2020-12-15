/*
Copyright © 2015-2016 ADP, LLC.

Licensed under the Apache License, Version 2.0 (the “License”);
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an “AS IS” BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied.  See the License for the specific language
governing permissions and limitations under the License.
*/

'use strict';

var express = require('express');
var router = express.Router();
var debug = require('./lib/debug');
var adpConnection = require('./index');

router.get('/callback', function callback(req, res){

	var connectionOpts = {
		clientId: '9da768af-1ef3-4783-b599-d637875a68e2',
		clientSecret: '524c0109-cdc4-46c0-973b-da2f7e6df88b',
		sslKeyPath: 'iatCerts/apiclient_iat.key',
		sslCertPath: 'iatCerts/apiclient_iat.pem',
		callbackUrl: 'http://localhost:8889/callback',
		granttype: 'authorization_code',
		apiUrl: 'https://api.adp.com',
		tokenUrl: 'https://api.adp.com/auth/oauth/v2/token',
		authorizationUrl: 'https://accounts.adp.com/auth/oauth/v2/authorize',
		authorizationCode: req.query.code
	};

	var conn = adpConnection.createConnection(connectionOpts);
	conn.connect(function connectCb(err) {
		if(err) {
			res.send('Not Connected');
		}else{
			res.send('Connected with token: ' + conn.accessToken);
		}
		res.end();
	});

});

router.get('/authenticate', function login(req, res) {
	var connectionOpts = {
		clientId: '9da768af-1ef3-4783-b599-d637875a68e2',
		clientSecret: '524c0109-cdc4-46c0-973b-da2f7e6df88b',
		sslKeyPath: 'iatCerts/iat.key',
		sslCertPath: 'iatCerts/iat.pem',
		granttype: 'authorization_code',
		callbackUrl: 'http://localhost:8889/callback',
		apiUrl: 'https://api.adp.com',
		tokenUrl: 'https://api.adp.com/auth/oauth/v2/token',
		authorizationUrl: 'https://accounts.adp.com/auth/oauth/v2/authorize'
	};
	var conn = adpConnection.createConnection(connectionOpts);
	var url = conn.getAuthorizationRequest();
	debug('Redirecting: ' + url);
	res.redirect(url);
});

module.exports = router;
