import type { Client } from 'discord.js';
import prisma from '../database';

export async function updateRoleBadge(
	name: string,
	role_id: string,
	guild_id: string,
	client: Client,
) {
	const guild = await client.guilds.fetch(guild_id);
	const role = await guild.roles.fetch(role_id);

	if (!role) return;

	// Fetch all members of the guild
	const members = await guild.members.fetch();
	const roleMembers = members
		.filter((member) => member.roles.cache.has(role_id))
		.map((member) => member.id);

	await prisma.badge.update({
		where: { name },
		data: {
			users: {
				set: roleMembers,
			},
		},
	});
}
