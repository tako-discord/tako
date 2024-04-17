import type { ChatInputCommandInteraction } from 'discord.js';
import config from '../../config';
import prisma from '../database';
import i18n from '../i18n';
import { createEmbed, getColor, getLanguage } from './general';

export async function autoRolesFunc(
	interaction: ChatInputCommandInteraction,
	type: 'bot' | 'user',
) {
	// Safe to return nothing, as the command is disabled in non-guild installation contexts
	if (!interaction.guildId) return;

	const data = await prisma.guild.findUnique({
		where: {
			id: interaction.guildId,
		},
	});

	const role = interaction.options.getRole('role', true);
	const roleList =
		(type === 'user' ? data?.autoRolesUser : data?.autoRolesBot) ?? [];
	const lng = await getLanguage(interaction.guildId, interaction.user.id);
	let removed = false;

	if (roleList.includes(role.id)) {
		roleList.splice(roleList.indexOf(role.id), 1);
		removed = true;
	} else {
		roleList.push(role.id);
	}

	if (type === 'user') {
		await prisma.guild.upsert({
			where: {
				id: interaction.guildId,
			},
			update: {
				autoRolesUser: roleList,
			},
			create: {
				id: interaction.guildId,
				autoRolesUser: roleList,
			},
		});
	} else {
		await prisma.guild.upsert({
			where: {
				id: interaction.guildId,
			},
			update: {
				autoRolesBot: roleList,
			},
			create: {
				id: interaction.guildId,
				autoRolesBot: roleList,
			},
		});
	}

	await interaction.reply({
		embeds: [
			createEmbed({
				color: await getColor(
					interaction.guildId,
					undefined,
					interaction.client,
				),
				description: i18n.t(
					`autoRoles.response.description${removed ? 'Removed' : ''}`,
					{
						ns: 'utility',
						lng,
						role: role.id,
						type: i18n.t(`autoRoles.types.${type}`, { ns: 'utility', lng }),
						guild: interaction.guild?.name,
					},
				),
				emoji: config.emojis.success,
				title: i18n.t(`autoRoles.response.title${removed ? 'Removed' : ''}`, {
					ns: 'utility',
					lng,
					role: role.id,
				}),
			}),
		],
		ephemeral: true,
	});
}
