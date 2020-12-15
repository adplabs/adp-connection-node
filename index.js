
var ADPConnection = require('./lib/adpConnection');

function createConnection(init) {
	return new ADPConnection(init);
}

module.exports = {
	createConnection: createConnection
};
