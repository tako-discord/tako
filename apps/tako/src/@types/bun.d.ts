declare module 'bun' {
	type Env = {
		APPLICATION_ID: string;
		DATABASE_URL: string;
		DEEPL_API_KEY: string;
		DISCORD_TOKEN: string;
		LINEAR: string | undefined;
		NODE_ENV: 'development' | 'production' | undefined;
	};
}
