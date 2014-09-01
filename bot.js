/* Bot Interface */

var util = require('util'),
	events = require('events'),
	irc = require('irc'),
	config = require('./config.js'),
	aws = require('aws-sdk'),
	bbdd = require('mongodb');


aws.config.loadFromPath('./aws-credentials.json');
aws.config.update({region: 'us-west-2'});

var sns = new aws.SNS();


/* This helper class implements bot events */
function BotEventUtils(bot) {
	this._bot = bot;
	this._textEvents = [];
	events.EventEmitter.call(this);
}

util.inherits(BotEventUtils, events.EventEmitter);

BotEventUtils.prototype.textEventsHub = function textEventsHub(from, to, text, message) {

	//Someone is writting me a query...
	if( to == this._bot.getName() ) {
		this.emit("query", from, text, message );
	}

	var self = this;
	
	for(var i = 0; i < self._textEvents.length; i++) {
		for(var e = 0; e < self._textEvents[i].pattern.length; e++) {
			//Loop through the event patterns looking for a match on the message.
			if( text.indexOf(self._textEvents[i].pattern[e]) != -1 ) {
				//Ok, we have a match! Let's fire the eventl
				this.emit(this._textEvents[i].event, this._textEvents[i].users, from, to, text, message );
				//We just want one event per message, stop iterating through events.
				return;
			}	
		}
	}
}

/* This event will be fired when the event data is read from the DDBB */
BotEventUtils.prototype.eventsLoadedHandler = function eventsLoadedHandler(eventsLoaded) {
	this._textEvents = eventsLoaded;
	var self = this;
	for(var i = 0; i < eventsLoaded.length; i++ ) {
		this.on( eventsLoaded[i].event, this[eventsLoaded[i].callback] );
	}

	this.on("query", this.queryEventHandler );
}

/*	This event object consists of: 
	{
		event : 'ping', //The name of the event
		pattern : ['pong'], //An array of strings that matches on a message being read from the irc,
							//therefore an event can be fired. 
		users: ['_AtilA_','jgomez'], //An array that contains the users that will recieve a notification of an event. 
									 //Example:
									 //If someone writes a message in a channel that contains the word 'ping' and one of the users 
									 //in the array, this user will receive a notification telling him that "nickname" has "pinged" him.
		callback: pingEventHandler  //This the name of the callback function that will be called when this event is fired.
									 	
	}
*/
BotEventUtils.prototype.pingEventHandler = function pingEventHandler() {
	var usersRegistered = arguments[0];
	var from = arguments[1] || "from?";
	var channel = arguments[2] || "channel?";
	var fullText = arguments[3] || "text?";

	usersRegistered.forEach( function(user) {
		debugger;
		if( fullText.indexOf(user) != -1 ){
			var notificationText = "Bot PING Notification: " + channel + " : " + from + " pinged you";
			this._sendNotification(from, channel, notificationText, fullText);
		}

	}, this);
}


/*	This event object consists of: 
	{
		event : 'pong', //The name of the event
		pattern : ['pong'], //An array of strings that matches on a message being read from the irc,
							//therefore an event can be fired. 
		users: ['_AtilA_','jgomez'], //An array that contains the users that will recieve a notification of an event. 
									 //Example:
									 //If someone writes a message in a channel that contains the word 'pong' and one of the users 
									 //in the array, this user will receive a notification telling him that "nickname" has "ponged" him.
		callback: pongEventHandler  //This the name of the callback function that will be called when this event is fired.
									 	
	}
*/
BotEventUtils.prototype.pongEventHandler = function pongEventHandler() {
		var usersRegistered = arguments[0];
		var from = arguments[1] || "from?";
		var channel = arguments[2] || "channel?";
		var fullText = arguments[3] || "text?";
		usersRegistered.forEach( function(user) {
			if( fullText.indexOf(user) != -1 ){
				var notificationText = "Bot PONG Notification: " + channel + " : " + from + " answered your ping request.";
				this._sendNotification(from, channel, notificationText, fullText);
			}
		}, this);
}

/*	This event object consists of: 
	{
		event : 'mention', //The name of the event
		pattern : ['_AtilA_','jgomez'], //An array of strings that matches on a message being read from the irc,
										//therefore an event can be fired. In the example, if a message contains any of the words
										//in the array, a 'mention' event will be fired.
		users: ['_AtilA_','jgomez'], //An array that contains the users that will recieve a notification of an event. For mention
									//event, pattern array and users array must have the same values.
									//Example:
									//If someone writes a message in a channel that contains one of the pattern words and the user 
									//being mentioned is in the users array too, this will trigger a mention event so a notification 
									//in his email.	
		callback: mentionEventHandler  //This the name of the callback function that will be called when this event is fired.
	}
*/	
BotEventUtils.prototype.mentionEventHandler = function mentionEventHandler () {
	var usersRegistered = arguments[0];
	var from = arguments[1] || "from?";
	var channel = arguments[2] || "channel?";
	var fullText = arguments[3] || "text?";
	usersRegistered.forEach( function(user) {
		if( fullText.indexOf(user) != -1 ){
			var notificationText = "Bot MENTION Notification: " + channel + " : " + from + " mention you!!";
			this._sendNotification(from, channel, notificationText, fullText);
		}
	},this);
}

BotEventUtils.prototype.joinEventHandler = function joinEventHandler() {
		
}

BotEventUtils.prototype.partEventHandler = function partEventHandler() {

}

BotEventUtils.prototype.queryEventHandler = function queryEventHandler(from, text, message) {
		this._sendNotification(from, "Query", "Bot QUERY Notification from " + from, text);
		this._bot.say(from, "Hi " + from + ", I'm just a bot. If you have any questions about me, please ask _AtilA_. Thks!");
}

BotEventUtils.prototype._awsResponseHandler = function _awsResponseHandler(error, data) {
	if( error )	{
		throw error;
	} else {
		console.log("Notification sent with messageID = " + data.MessageId);
	}
}

BotEventUtils.prototype._sendNotification = function _sendNotification(from, channel, notificationText, fullText) {	
		var params = {
			TopicArn : "arn:aws:sns:us-west-2:423077365911:Bot_Notifications",
			//TargetArn : "arn:aws:sns:us-west-2:423077365911:Bot_Notifications:d3fe5d8b-0510-40bd-a053-6520291dbcfa",
			Message : channel + " : <" + from + "> " + fullText,
			Subject: notificationText
		};

		var self = this;
		sns.publish(params, self._awsResponseHandler );
}



function Bot(){
	this.name = "_BledA_";
	this._botEventUtils = new BotEventUtils(this);
	events.EventEmitter.call(this);
}

util.inherits(Bot, events.EventEmitter);


Bot.prototype.init = function () {
	var self = this;
	this.on( "eventsLoaded", self._botEventUtils.eventsLoadedHandler.bind(self._botEventUtils) );
	self._loadEvents();
}

Bot.prototype.connect = function ( params ) {
	params.server = config.server || params.server;
	params.name = config.name || params.name;
	params.channels = config.channels || params.channels;

	var bot = new irc.Client( params.server, params.name, { channels: params.channels } );

	var self = this;
	/* Set handlers for events */
	bot.addListener("message", self._botEventUtils.textEventsHub.bind(self._botEventUtils));
	bot.addListener("join", self._botEventUtils.joinEventHandler);
	bot.addListener("part", self._botEventUtils.partEventHandler);

	this.name = params.name;
	this._bot = bot;
}

Bot.prototype.say = function say(to, text){
	this._bot.say(to, text);
}

Bot.prototype.getName = function getName() {
	return this.name;
}

Bot.prototype._loadEvents = function () {
	var server = new bbdd.Server("127.0.0.1", 27017, {});
	var dbTest = new bbdd.Db('test', server, {safe:false});
	var self = this;

	dbTest.open(function (error, client) {
		if (error) {
			console.log("_loadEvents(): ERROR: DDBB problem!: error = " + error );
			throw error;
		}
		var collection = new bbdd.Collection(client, 'eventos');
		collection.find().toArray(function(err, docs) {
			if(error) {
				console.log("_loadEvents(): ERROR: Couldn't find events in the DDBB: error = " + error);
				throw err;
			}
			self.emit("eventsLoaded", docs);
		});
	});
}


exports.Bot = Bot;
