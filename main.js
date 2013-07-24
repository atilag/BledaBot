/* Entry point */

var botModule = require('./bot.js');
var bot = new botModule.Bot();

bot.init();
bot.connect( { server: 'irc.mozilla.org', channels: ['#bleda', '#b2g', '#gaia', '#developers'], name: '_BledA_' } );
//bot.connect( { server: 'irc.mozilla.org', channels: ['#bleda'], name: '_BledA_' } );




