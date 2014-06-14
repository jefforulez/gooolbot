
//
// gooolbot.js - https://github.com/jefforulez/gooolbot
//
// written by @jefforulez
//
//

'use strict' ;

var Hipchatter = require( 'hipchatter' )
var Twit = require('twit')

var config = require( 'config' )

config._gb = { follow : "89225092", screen_name : "UnivisionSports" }

var hipchatter = new Hipchatter( config.hipchat.auth_token )
var T          = new Twit( config.twitter )

var stream = T.stream( 'statuses/filter', { follow : config._gb.follow })

stream.on( 'tweet', function (tweet) {

	if ( tweet.user.screen_name == config._gb.screen_name ) 
	{
		console.log( "[debug] @" + tweet.user.screen_name + " : " + tweet.text )

		var regex = /(Go{4,}l)/
		var result = tweet.text.match( regex )
				
		if ( result == null ) {
			return
		}
		
		// debug
		console.log( tweet )

		var url = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str
		
		var message = result[0] + "!!!! " + tweet.text + "<a href=" + url + ">" + url + "</a>"

		for ( var room in config.hipchat.rooms )
		{
			hipchatter.notify(
				room.name,
				{
					token          : room.token,
					message        : message,
					message_format : 'html',
					notify         : true
				}, 
				function ( err ) { if ( err ) console.log( err ) }
			)
		}

	}
	
})
