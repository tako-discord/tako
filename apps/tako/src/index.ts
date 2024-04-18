import { readdir } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';
import { Client, GatewayIntentBits } from 'discord.js';
import config from '../config';
import prisma from './database.ts';
import { updateRoleBadge } from './util/badges.ts';
import { loadCommands, loadEvents } from './util/loaders.ts';
import { logger } from './util/logger.ts';
import { registerEvents } from './util/registerEvents.ts';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
	],
});

// Badges
client.on('ready', async () => {
	const guild_id = config.dev ? config.guilds.dev : config.guilds.main;
	for (const badge of config.badges) {
		await prisma.badge.upsert({
			where: { name: badge.name },
			update: {
				emoji: badge.emoji,
			},
			create: {
				name: badge.name,
				emoji: badge.emoji,
			},
		});

		await updateRoleBadge(badge.name, badge.role, guild_id, client);
	}
});

// Commands and Events
const commandArray = [];
for (const dir of (
	await readdir(`${import.meta.dir}/commands`, { withFileTypes: true })
)
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => dirent.name)) {
	commandArray.push(
		await loadCommands(Bun.pathToFileURL(`${import.meta.dir}/commands/${dir}`)),
	);
}

const commands = new Map();
for (const cmd of commandArray) {
	for (const [key, value] of cmd) {
		commands.set(key, value);
	}
}

const events = await loadEvents(new URL('events/', import.meta.url));
registerEvents(client, commands, events);

// Error Handling
process.on('unhandledRejection', (reason, promise) => {
	if (reason === undefined) {
		// If reason is undefined, log a specific message
		logger.error('Unhandled promise rejection with no reason provided');
		return;
	}

	if (reason instanceof Error) {
		// If reason is an instance of Error, log the error message and stack trace
		logger.error(`${reason.message} Stack Trace: ${reason.stack}`);
		return;
	}

	// If reason is not undefined but not an instance of Error, log the reason directly
	logger.error(`Reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
	logger.error(`${error.message} ${error.stack}`);
});

void client.login(Bun.env.DISCORD_TOKEN);
