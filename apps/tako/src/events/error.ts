import { Events } from 'discord.js';
import { logger } from '../util/logger.ts';
import type { Event } from './index.ts';

export default {
	name: Events.Error,
	async execute(error) {
		logger.error(error.message);
	},
} satisfies Event<'error'>;
