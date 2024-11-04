import { LavalinkPlayer, RoutePlanner, SessionInfo } from '../../src/node/Rest';

export const routePlannerResponse: () => RoutePlanner = () => ({
	// @ts-expect-error enums
	'class': 'RotatingNanoIpRoutePlanner',
	'details': {
		'ipBlock': {
			// @ts-expect-error enums
			'type': 'Inet6Address',
			'size': '1208925819614629174706176'
		},
		'failingAddresses': [
			{
				'failingAddress': '/1.0.0.0',
				'failingTimestamp': 1573520707545,
				'failingTime': 'Mon Nov 11 20:05:07 EST 2019'
			}
		],
		'blockIndex': '0',
		'currentAddressIndex': '36792023813'
	}
});

export const playerObjectResponse: (d?: Partial<LavalinkPlayer>) => LavalinkPlayer = () => ({
	'guildId': '...',
	'track': {
		'encoded': 'QAAAjQIAJVJpY2sgQXN0bGV5IC0gTmV2ZXIgR29ubmEgR2l2ZSBZb3UgVXAADlJpY2tBc3RsZXlWRVZPAAAAAAADPCAAC2RRdzR3OVdnWGNRAAEAK2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9ZFF3NHc5V2dYY1EAB3lvdXR1YmUAAAAAAAAAAA==',
		'info': {
			'identifier': 'dQw4w9WgXcQ',
			'isSeekable': true,
			'author': 'RickAstleyVEVO',
			'length': 212000,
			'isStream': false,
			'position': 60000,
			'title': 'Rick Astley - Never Gonna Give You Up',
			'uri': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
			'artworkUrl': 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
			'isrc': undefined,
			'sourceName': 'youtube'
		},
		'pluginInfo': {},
		'userData': {}
	},
	'volume': 100,
	'paused': false,
	'state': {
		'time': 1500467109,
		'position': 60000,
		'connected': true,
		'ping': 50
	},
	'voice': {
		'token': '...',
		'endpoint': '...',
		'sessionId': '...'
	},
	'filters': {}
});

export const sessionUpdateResponse: () => SessionInfo = () => ({
	'resumingKey': 'mock',
	'timeout': 60,
	resuming: false
});
