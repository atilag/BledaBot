/* Localization */

var config = require('./config.js');

function L10n() {
	
}

L10n.prototype = {

	getMessage : function ( key ) {
		//TODO: Consultar en BBDD
		return key;
	}
	
};

exports.L10n = L10n;