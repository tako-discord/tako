import { setInterval } from 'node:timers';
import { ActivityType, Events } from 'discord.js';
import { logger } from '../util/logger.ts';
import type { Event } from './index.ts';

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		logger.info(`Ready! Logged in as ${client.user.tag}`);

		setInterval(() => {
			const activities = [
				{
					activity: `Running on v${Bun.env.npm_package_version}`,
					type: ActivityType.Custom,
				},
				{ activity: `Using / Commands`, type: ActivityType.Custom },
				{
					activity: 'Need help? Run /help',
					type: ActivityType.Custom,
				},
			];

			const randomIndex = Math.floor(Math.random() * activities.length);

			client.user.setActivity(activities[randomIndex].activity, {
				type: activities[randomIndex].type,
			});
		}, 7_500);
	},
} satisfies Event<'ready'>;
