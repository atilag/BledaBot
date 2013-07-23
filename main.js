/* Entry point */

var botModule = require('./bot.js');
var bot = new botModule.Bot();

bot.init();
bot.connect( { server: 'irc.mozilla.org', channels: ['#bleda', '#b2g'], name: '_BledA_' } );




