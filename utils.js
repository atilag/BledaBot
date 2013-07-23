/* Utils */

function Utils() {

}

Utils.prototype = {

	CHECK_IS_UNDEFINED : function() {
		for(var i = 0; i < arguments.length; i++) {
			if( typeof arguments[i] == 'undefined' )
				return false;
		}

		return true;
	},

	CHEK_IS_STRING : function( variable ) {
		return (typeof variable === 'string');
	},

	CHECK_IS_FUNCTION : function( variable ) {
		return (typeof variable === 'function');
	}

};

exports.Utils = Utils;
