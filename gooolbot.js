
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

var Scores = {} ;

//
// startup
//

console.log( "starting gooolbot...." )

//
// hipchat
//

var hipchatter = new Hipchatter( config.hipchat.auth_token )

hipchatter.rooms(
	function( err, remote_rooms )
	{
		// fatal error
		if ( err ) { console.log( "[hipchat] err : " + err ) ; process.exit( 1 ) }

		// report on configured rooms
		for ( var room in config.hipchat.rooms )
		{
			var configured_name = config.hipchat.rooms[room].name

			for ( var remote in remote_rooms )
			{
				if ( configured_name == remote_rooms[remote].name ) {
					console.log( "[hipchat] found room: " + configured_name )
				}
			}
		}
	}
)

function _hipchatSendMessageToRooms( message )
{
	for ( var room in config.hipchat.rooms )
	{
		var r = config.hipchat.rooms[room]
	
		hipchatter.notify(
			r.name,
			{
				token          : r.token,
				message        : message,
				message_format : 'html',
				notify         : true,
				color          : 'green' // for brasil. and all the money #fifa makes
			}, 
			function ( err ) { 
				if ( err ) { console.log( "[hipchat] " + r.name + " : " + err ) ; return } 
				console.log( "[hipchat] " + r.name + " : " + message )
			}
		)
	}
	
	return
}

//
// twitter
//

var T = new Twit( config.twitter )

var stream = T.stream( 'statuses/filter', { follow : config._gb.follow } )

stream.on( 'tweet', function (tweet) {

	if ( tweet.user.screen_name == config._gb.screen_name ) 
	{
		// log all @UnivisionSports tweets so we know gooolbot is alive
		console.log( "[twitter] @" + tweet.user.screen_name + " : " + tweet.text )

		// detect goal

		var regex_goal = /(Go{4,}l|¡GOLAZO|¡GOL!)/
		var result_goal = tweet.text.match( regex_goal )
				
		if ( result_goal == null ) {
			return
		}
		
		// check for duplicate score
		
		var regex_score = /(#\w+\s*\d+\s*-\s*\d+\s*#\w+)/
		var result_score = tweet.text.match( regex_score )
		
		if ( result_score != null )
		{
			var s = result_score.replace( " ", "" ) ;
			
			// skip this score if it was already seen
			if ( s in Scores ) {
				console.log( "[twitter] DUPE SCORE? " + tweet.text )
				return
			}
			
			Scores[ s ] = 1 ;
		}
		
		// dump the whole goool tweet for debugging
		console.log( tweet )

		var url = "https://twitter.com/" + tweet.user.screen_name + "/status/" + tweet.id_str
		
		var message = result_goal[0] + "!!!! " 
		            + tweet.text 
		            + " <a href=" + url + ">" + url + "</a>"
		            ;


		// send hipchat message
		_hipchatSendMessageToRooms( message )

		// play sound
		_soundPlay()
	}
	
})

//
// sound
//

var fs = require( 'fs' )

function _soundPlay()
{
	if ( ! config.gooolbot.sound ) { return }

	try 
	{
		var Speaker = require( 'speaker' )
	
		var speaker = new Speaker({
			channels: 2,
			bitDepth: 16,
			sampleRate: 44100
		})

		fs.createReadStream( "./media/gooolbot-signed-16bit.pcm" ).pipe( speaker )
	}
	catch ( ex )
	{
		console.log( "sound not supported" ) ;
		console.log( ex ) ;
	}

}
