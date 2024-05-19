import { ChannelType, Events } from 'discord.js';
import prisma from '../database.ts';
import type { Event } from './index.ts';

export default {
	name: Events.MessageCreate,
	async execute(message) {
		// Crosspost
		if (message.channel.type === ChannelType.GuildAnnouncement) {
			const data = await prisma.channel.findFirst({
				where: { id: message.channelId },
				select: { crosspost: true },
			});

			if (data?.crosspost) {
				await message.crosspost();
			}
		}

		// Auto-react
		const isForum =
			message.channel.isThread() &&
			(message.channel.parent?.type === ChannelType.GuildForum ||
				message.channel.parent?.type === ChannelType.GuildMedia);

		const data = await prisma.channel.findFirst({
			where: {
				id: isForum ? message.channel.parent?.id : message.channelId,
			},
			select: { autoReact: true },
		});
		const autoReact = data?.autoReact;

		if (!autoReact || autoReact.length === 0) return;

		for (const emoji of autoReact) {
			await message.react(emoji).catch(async (error) => {
				if (error.code === 10_014) {
					const updatedAutoReact = autoReact.filter((em) => em !== emoji);
					await prisma.channel.update({
						where: { id: message.channelId },
						data: { autoReact: updatedAutoReact },
					});
				}
			});
		}
	},
} satisfies Event<'messageCreate'>;
