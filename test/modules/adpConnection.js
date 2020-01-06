'use strict';
var should = require('chai').should();
var ADPConnection = require('../../lib/adpConnection');
var mockServer = require('../lib/mockServer');
var connectOpts = {
	clientId: 'testclientid',
	clientSecret: 'testclientsecret',
	sslCertPath: 'iatCerts/apiclient_iat.pem',
	sslKeyPath: 'iatCerts/apiclient_iat.key',
	callbackUrl: 'http://localhost:8889/callback',
	granttype: 'client_credentials',
	apiUrl: 'http://localhost:55555/api',
	tokenUrl: 'http://localhost:55555/token',
	authorizationUrl: 'http://localhost:55555/authorize'
};
var validUrl = require('valid-url');
var connection;
var reconnectionObj;
var ConfigurationException = require('adp-core').configurationException;

describe('ADPConnection Tests - clean tests:', function describeCb(){

	before(function beforeCb(done) {
		connection = new ADPConnection(connectOpts);
		mockServer.start(done);
	});

	after(function afterCb(done) {
		mockServer.stop(done);
	});

	it('Provides getAuthorizationRequest method and returns valid URL.', function itCb(done) {
		(typeof connection.getAuthorizationRequest).should.equal('function');
		try {
			var url = connection.getAuthorizationRequest();
			(typeof validUrl.isUri(url)).should.not.equal(undefined);
		} catch(e) {
			'Error creating url'.should.equal('No error creating url');
		}
		done();
	});

	it('Allows connection.', function itCb(done) {
		connection.connect(function connectCb(err) {
			if(err) {
				'Error connecting'.should.equal('No Error Connecting');
			}
			done();
		});
	});

	it('Provides connection status correctly.', function itCb(done) {
		(typeof connection.isConnected).should.equal('function');
		(connection.isConnected()).should.equal(true);
		done();
	});

	it('Provides connection expiration correctly.', function itCb(done) {
		(typeof connection.getExpiration).should.equal('function');
		(connection.getExpiration() instanceof Date).should.equal(true);
		done();
	});

	it('Provides access to reconnection object.', function itCb(done) {
		(typeof connection.getReconnectionObject).should.equal('function');
		reconnectionObj = connection.getReconnectionObject();
		try{
			JSON.stringify(reconnectionObj);
			'ReconnectionObj is valid JSON object'.should.equal('ReconnectionObj is valid JSON object');
		} catch(e) {
			'ReconnectionObj is not valid JSON object'.should.equal('ReconnectionObj is valid JSON object');
		}
		done();
	});

	it('Provides method to reconnect.', function itCb(done) {
		(typeof connection.reconnect).should.equal('function');
		connection.reconnect(reconnectionObj, function reconnectCb(err) {
			if(err) {
				'Reconnect is not successful'.should.equal('Reconnect is successful');
			} else {
				'Reconnect is successful'.should.equal('Reconnect is successful');
			}
			done();
		});
	});

	it('Accepts reconnection that has not expired', function itCb(done) {
		const comingSoon = new Date((new Date()).getTime() + 60000);
		reconnectionObj = connection.getReconnectionObject();
		reconnectionObj.tokenExpiration = comingSoon.toISOString();

		connection.reconnect(reconnectionObj, function reconnectCb(err) {
			should.not.exist(err);
			done();
		});
	});

	it('Rejects expired reconnection', function itCb(done) {
		const justPast = new Date((new Date()).getTime() - 60000);
		reconnectionObj = connection.getReconnectionObject();
		reconnectionObj.tokenExpiration = justPast.toISOString();

		connection.reconnect(reconnectionObj, function reconnectCb(err) {
			(err instanceof ConfigurationException).should.equal(true);
			done();
		});
	});

	it('Provides method to disconnect.', function itCb(done) {
		(typeof connection.disconnect).should.equal('function');
		(connection.disconnect()).should.equal(true);
		done();
	});

});

describe('ADPConnection tests - authorization code specific', function descibeCb() {
	var authCodeConnection;

	before(function beforeCb(done) {
		authCodeConnection = new ADPConnection({
			clientId: 'testclientid',
			clientSecret: 'testclientsecret',
			sslCertPath: 'iatCerts/apiclient_iat.pem',
			sslKeyPath: 'iatCerts/apiclient_iat.key',
			callbackUrl: 'http://localhost:8889/callback',
			granttype: 'authorization_code',
			apiUrl: 'http://localhost:55555/api',
			tokenUrl: 'http://localhost:55555/token',
			authorizationUrl: 'http://localhost:55555/authorize'
		});
		mockServer.start(done);
	});

	after(function afterCb(done) {
		mockServer.stop(done);
	});

	it('Allows connection.', function itCb(done) {
		mockServer.resetLoop();
		authCodeConnection.connect(function connectCb(err) {
			if(err) {
				'Error connecting'.should.equal('No Error Connecting');
			}
			done();
		});
	});

	it('Provides successful reconnection after expiration.', function itCb(done) {

		mockServer.resetLoop();
		var authCodeReconnectionObj = authCodeConnection.getReconnectionObject();
		authCodeReconnectionObj.tokenExpiration = new Date('01/01/2000');

		(typeof connection.reconnect).should.equal('function');
		authCodeConnection.reconnect(authCodeReconnectionObj, function reconnectCb(err) {
			if(err) {
				'Reconnect is not successful'.should.equal('Reconnect is successful');
			} else {
				'Reconnect is successful'.should.equal('Reconnect is successful');
			}
			done();
		});
	});

});

describe('ADPConnection tests - failures', function describeCb() {

	before(function beforeCb(done) {
		mockServer.start(done);
	});

	after(function afterCb(done) {
		mockServer.stop(done);
	});

	it('Fails connect with invalid certs.', function itCb(done) {
		var badConnectOpts = {
			clientId: 'e62f181c-3233-4636-bb82-9be5c9f3e3e0',
			clientSecret: 'fbce97f8-5d3a-42cc-a774-9126c5270625',
			sslCertPath: 'invalid/apiclient_iat.pem',
			sslKeyPath: 'invalid/apiclient_iat.key',
			callbackUrl: 'http://localhost:8889/callback',
			granttype: 'client_credentials',
			apiUrl: 'http://localhost:55555/api',
			tokenUrl: 'http://localhost:55555/token',
			authorizationUrl: 'http://localhost:55555/authorize'
		};
		var badConnection = new ADPConnection(badConnectOpts);
		badConnection.connect(function connectCb(err) {
			err.description.should.equal('Invalid cert path');
			done();
		});
	});

	it('Fails getAuthorizationRequest when missing clientId.', function itCb(done) {
		var badConnectOpts = {
			clientSecret: 'fbce97f8-5d3a-42cc-a774-9126c5270625',
			sslCertPath: 'iatCerts/apiclient_iat.pem',
			sslKeyPath: 'iatCerts/apiclient_iat.key',
			callbackUrl: 'http://localhost:8889/callback',
			apiUrl: 'http://localhost:55555/api',
			tokenUrl: 'http://localhost:55555/token',
			authorizationUrl: 'http://localhost:55555/authorize'
		};
		var badConnection = new ADPConnection(badConnectOpts);
		try {
			badConnection.getAuthorizationRequest();
			'No error creating url'.should.equal('Error creating url');
		} catch(e) {
			'Error creating url'.should.equal('Error creating url');
		}
		done();
	});

	it('Fails getAuthorizationRequest when missing callbackUrl.', function itCb(done) {
		var badConnectOpts = {
			clientId: 'e62f181c-3233-4636-bb82-9be5c9f3e3e0',
			clientSecret: 'fbce97f8-5d3a-42cc-a774-9126c5270625',
			sslCertPath: 'iatCerts/apiclient_iat.pem',
			sslKeyPath: 'iatCerts/apiclient_iat.key',
			apiUrl: 'http://localhost:55555/api',
			tokenUrl: 'http://localhost:55555/token',
			authorizationUrl: 'http://localhost:55555/authorize'
		};
		var badConnection = new ADPConnection(badConnectOpts);
		try {
			badConnection.getAuthorizationRequest();
			'No error creating url'.should.equal('Error creating url');
		} catch(e) {
			console.log(e);
			'Error creating url'.should.equal('Error creating url');
		}
		done();
	});

	it('Fails to connect when missing configuration.', function itCb(done) {
		var badConnectOpts = {
			clientId: 'e62f181c-3233-4636-bb82-9be5c9f3e3e0',
			clientSecret: 'fbce97f8-5d3a-42cc-a774-9126c5270625',
			sslCertPath: 'iatCerts/apiclient_iat.pem',
			sslKeyPath: 'iatCerts/apiclient_iat.key',
			callbackUrl: 'http://localhost:8889/callback',
			granttype: 'client_credentials',
			apiUrl: 'http://localhost:55555/api',
			tokenUrl: 'http://localhost:55555/token',
			authorizationUrl: 'http://localhost:55555/authorize'
		};
		var badConnection = new ADPConnection(badConnectOpts);
		delete badConnection.connType;
		badConnection.connect(function connectCb(err) {
			err.message.should.equal('Please initialize connection with connection config object.');
			done();
		});
	});

	it('Fails to connect with bad configuration.', function itCb(done) {
		var badConnectOpts = {
			clientId: 'BAD_VALUE',
			clientSecret: 'fbce97f8-5d3a-42cc-a774-9126c5270625',
			sslCertPath: 'iatCerts/apiclient_iat.pem',
			sslKeyPath: 'iatCerts/apiclient_iat.key',
			callbackUrl: 'http://localhost:8889/callback',
			granttype: 'client_credentials',
			apiUrl: 'http://localhost:55555/api',
			tokenUrl: 'http://localhost:55555/token',
			authorizationUrl: 'http://localhost:55555/authorize'
		};
		var badConnection = new ADPConnection(badConnectOpts);
		badConnection.connect(function connectCb(err) {
			err.message.should.equal('Unknown Authentication Error');
			done();
		});
	});

	it('Fails to connect with an expired token.', function itCb(done) {
		var goodConnectOpts = {
			clientId: 'e62f181c-3233-4636-bb82-9be5c9f3e3e0',
			clientSecret: 'fbce97f8-5d3a-42cc-a774-9126c5270625',
			sslCertPath: 'iatCerts/apiclient_iat.pem',
			sslKeyPath: 'iatCerts/apiclient_iat.key',
			callbackUrl: 'http://localhost:8889/callback',
			granttype: 'client_credentials',
			apiUrl: 'http://localhost:55555/api',
			tokenUrl: 'http://localhost:55555/token',
			authorizationUrl: 'http://localhost:55555/authorize'
		};
		var goodConnection = new ADPConnection(goodConnectOpts);
		goodConnection.connect(function connectCb() {
			reconnectionObj = goodConnection.getReconnectionObject();
			reconnectionObj.tokenExpiration = new Date('01/01/2000');
			goodConnection.reconnect(reconnectionObj, function reconnectCb(err) {
				err.message.should.equal('Token has expired. Reconnection not possible.');
				done();
			});
		});
	});
});
