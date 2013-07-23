/* Config */

var util = require('util'),
	events = require('events');

/* TODO: Singleton? */
function Config() {
	events.EventEmitter.call(this);
	this.channels = ["#bleda"];
	//this.server: "irc.arrakis.es",
	this.server = "irc.mozilla.org";
	this.name = "_BledA_";
}

util.inherits(Config, events.EventEmitter);

Config.prototype.init = function init() {
	

}


exports.Config = Config;