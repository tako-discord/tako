const config = {
	// With this enabled, the app will sync all commands only to the dev guild, to prevent rate limiting
	dev: Bun.env.NODE_ENV === 'development' || false,
	guilds: {
		main: '952558753859919922',
		dev: '884046271176912917',
	},
	// * These people have access to the secret category (sync etc.)
	devs: ['751092600890458203'],
	// Default Colors for embeds etc.
	colors: {
		primary: 0x299ba3,
		accent: 0x5bd79d,
		green: 0x40b056,
		yellow: 0xf0e34c,
		red: 0xea4d4d,
	},
	// This will be used for creating issues using the feedback command
	// * Only needed when a Linear Token is set in the .env
	linear: {
		team: 'Bot Devs',
		label: 'Feedback',
	},
	// All emojis used in the app. The src/assets folder contains all the emojis used in the app.
	emojis: {
		success: '<:success:1228641837095456778>',
		error: ' <:error:1228641823686131732>',
		user: '<:user:1228641944058597396>',
		bot: '<:bot:1228641822142763018>',
		ping: {
			green: '<:pingGreen:1228641831630143508>',
			yellow: '<:pingYellow:1228641834843242496>',
			red: '<:pingRed:1228641833396080680>',
		},
		pagination: {
			first: '<:paginationFirst:1228641825204605038>',
			previous: '<:paginationPrevious:1228641829860413483>',
			next: '<:paginationNext:1228641828161454131>',
			last: '<:paginationLast:1228641826693447743>',
		},
	} as const,
	apis: {
		urban: 'https://unofficialurbandictionaryapi.com/api',
		lingva: 'https://tl.tako-bot.com/api/v1',
		deepl: {
			free: 'https://api-free.deepl.com/v2',
			pro: 'https://api.deepl.com/v2',
		},
	},
	links: {
		support: {
			link: 'https://discord.gg/vHhE78Fu6v',
			masked: '[Support Server](https://discord.gg/vHhE78Fu6v)',
		},
		donate: {
			link: 'https://opencollective.com/tako',
			masked: '[OpenCollective](https://opencollective.com/tako)',
		},
		translate: {
			link: 'https://translate.tako-bot.com',
			masked: '[Crowdin](https://translate.tako-bot.com)',
		},
		documentation: {
			link: 'https://docs.tako-bot.com',
			masked: '[Documentation](https://docs.tako-bot.com)',
		},
	},
	badges: [
		{
			name: 'alpha_tester',
			emoji: '<:alphaTester:1228655287313895514>',
			role: '969306314981376071',
			color: 0xf0e34c,
		},
		{
			name: 'translator',
			emoji: '<:translator:1228655292024225864>',
			role: '980904580286140426',
			color: 0x3498db,
		},
		{
			name: 'donator',
			emoji: '<:donator:1228655290317148210> ',
			role: '969286409200468028',
			color: 0x9b59b6,
		},
		{
			name: 'core_developer',
			emoji: '<:coreDeveloper:1228655288593289266>',
			role: '969285824107642990',
			color: 0x299ba3,
		},
	],
};

export default config;
