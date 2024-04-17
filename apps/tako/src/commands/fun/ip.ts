import { faker } from '@faker-js/faker';
import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import prisma from '../../database.ts';
import i18next from '../../i18n.ts';
import {
	createEmbed,
	getColor,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import type { Command } from '../index.ts';

export default {
	data: new SlashCommandBuilder()
		.setName(i18next.t('ip.name', { ns: 'fun' }))
		.setNameLocalizations(slashCommandTranslator('ip.name', 'fun'))
		.setDescription(i18next.t('ip.description', { ns: 'fun' }))
		.addUserOption((option) =>
			option
				.setName(i18next.t('ip.options.user.name', { ns: 'fun' }))
				.setNameLocalizations(
					slashCommandTranslator('ip.options.user.name', 'fun'),
				)
				.setDescription(i18next.t('ip.options.user.description', { ns: 'fun' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('ip.options.user.description', 'fun'),
				)
				.setRequired(false),
		)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		const user =
			interaction.options.getUser(
				i18next.t('ip.options.user.name', { ns: 'fun' }),
			) ?? interaction.user;
		const lng = await getLanguage(interaction.guildId);
		const data = await prisma.user.findFirst({
			where: {
				id: user.id,
			},
		});
		const ip = data?.ip ?? faker.internet.ipv4();

		if (!data?.ip) {
			await prisma.user.upsert({
				where: {
					id: user.id,
				},
				update: {
					ip,
				},
				create: {
					id: user.id,
					ip,
				},
			});
		}

		const embed = createEmbed({
			author: {
				name: i18next.t('ip.embed.author', {
					ns: 'fun',
					lng,
					user: user.displayName,
				}),
				iconURL: user.displayAvatarURL(),
			},
			color: await getColor(interaction.guildId, user.id, interaction.client),
			description: `\`${ip}\``,
			footer: { text: i18next.t('ip.embed.footer', { ns: 'fun', lng }) },
		});

		await interaction.reply({ embeds: [embed] });
	},
} satisfies Command;
