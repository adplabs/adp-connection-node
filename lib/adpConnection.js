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

var authenticate = require('./authenticate');
var debug = require('./debug');
var uuid = require('uuid');
var config = require('../config/default');
var ConfigurationException = require('adp-core').configurationException;

/**
@class ADPConnection
@description Connection object for access to ADP APIs.
*/
function ADPConnection(connConfig) {
	var auth;
	/**
	@private
	@type {string}
	@memberof ADPConnection
	@description Value for the grant type associated with the {@link ADPConnection} instance.
	*/
	this.granttype = connConfig.granttype;

	/**
	@private
	@type {object}
	@memberof ADPConnection
	@description Connection configuration object.
	*/
	this.connType = this.connType = (function connTypeCb() {
		var out = {};
		Object.keys(config.connection).forEach(function keysCb(key) {
			out[key] = config.connection[key];
		});
		Object.keys(connConfig).forEach(function keysCb(key) {
			out[key] = connConfig[key];
		});
		return out;
	})();

	/**
	@private
	@type {string}
	@memberof ADPConnection
	@description State value for mananging multiple connections.
	*/
	this.state = uuid.v4();

	/**
	@memberof ADPConnection
	@description Connect to ADP. This step is required to obtain the access token which is required to make API calls.
	@param cb {function} Callback function to execute upon successful connection or upon exception during connection routine.
	@listens tokenRefresh
	@returns {void}
	*/
	this.connect = function connect(cb) {
		if(!this.connType) {
			return cb(new ConfigurationException({description: 'Uninitialized connection', message: 'Please initialize connection with connection config object.'}), null);
		}
		this.cb = cb;
		auth = authenticate(this.connType);
		auth.connect(function initCb(err, token) {
			if(err) {
				debug('Error authenticating.' + err);
			}
			if(token) {
				this.accessToken = token.access_token;
				debug('Access Token: ' + this.accessToken);
			}
			return this.cb(err, null);
		}.bind(this));
	};

	/**
	@memberof ADPConnection
	@description Disconnect this instance of ADPConnection. This method will disconnect revoke the access token.
	@returns disconnected {boolean}
	*/
	this.disconnect = function disconnect() {
		delete this.accessToken;
		var date = new Date();
		date.setHours(date.getHours() - 100);
		auth.tokenExpiration = date;
		return true;
	};

	/**
	@memberof ADPConnection
	@description Obtains the token expiration from the authorization module.
	@returns Expiration {date}
	*/
	this.getExpiration = function getExpiration() {
		return auth.tokenExpiration;
	};

	/**
	@memberof ADPConnection
	@description Obtains the token expiration from the authorization module and calculates based on current date/time.
	@returns {boolean}
	*/
	this.isConnected = function isConnected() {
		return auth.tokenExpiration > new Date() ? true : false;
	};

	/**
	@memberof ADPConnection
	@description Returns an object which can be used to reestablish a connection.
	@returns {object}
	*/
	this.getReconnectionObject = function getReconnectionObject() {
		return {
			connType: this.connType,
			accessToken: this.accessToken,
			tokenExpiration: auth.tokenExpiration
		};
	};

	/**
	@memberof ADPConnection
	@description Allows reconnection using reconnection object.
	@params reconnectionObject {object} Object containing connection configuration.
	@returns {void}
	*/
	this.reconnect = function reconnect(reconnectionObject, cb) {
		if(reconnectionObject.tokenExpiration < new Date()) {
			return cb(new ConfigurationException({description: 'Token has expired. Reconnection not possible.', message: 'Token has expired. Reconnection not possible.'}));
		}
		this.connType = reconnectionObject.connType;
		auth = authenticate(this.connType);
		this.accessToken = reconnectionObject.accessToken;
		auth.tokenExpiration = reconnectionObject.tokenExpiration;
		cb(undefined, this);
	};

	/**
	@memberof ADPConnection
	@description Helper function to return the authorization endpoint + query string parameters for making an authorization code request.
	@returns url {string} Url to perform redirect to authorization end point.
	*/
	this.getAuthorizationRequest = function getAuthorizationRequest() {
		if(!this.connType.clientId) {
			throw new ConfigurationException({description: 'Missing client id information.'});
		}
		if(!this.connType.callbackUrl) {
			throw new ConfigurationException({description: 'Missing callback url information.'});
		}

		return encodeURI(
			this.connType.authorizationUrl +
			'?client_id=' + this.connType.clientId +
			'&response_type=code' +
			'&redirect_uri=' + this.connType.callbackUrl +
			'&scope=openid' +
			'&state=' + this.state);
	};

}

module.exports = ADPConnection;
