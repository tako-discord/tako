import { Events } from 'discord.js';
import prisma from '../database.ts';
import type { Event } from './index.ts';

export default {
	name: Events.GuildMemberAdd,
	async execute(member) {
		const data = await prisma.guild.findUnique({
			where: {
				id: member.guild.id,
			},
			select: { autoRolesUser: true, autoRolesBot: true },
		});
		if (!data) return;

		for (const role of member.user.bot
			? data.autoRolesBot
			: data.autoRolesUser) {
			try {
				await member.roles.add(role);
			} catch (error) {
				if ((error as any).code === 10_011) {
					const updatedAutoRoles = member.user.bot
						? data.autoRolesBot.filter((ro) => ro !== role)
						: data.autoRolesUser.filter((ro) => ro !== role);
					await prisma.guild.update({
						where: {
							id: member.guild.id,
						},
						data: {
							autoRolesBot: member.user.bot
								? updatedAutoRoles
								: data.autoRolesBot,
							autoRolesUser: member.user.bot
								? data.autoRolesUser
								: updatedAutoRoles,
						},
					});
				}
			}
		}
	},
} satisfies Event<'guildMemberAdd'>;
