import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import config from '../../../config.ts';
import prisma from '../../database.ts';
import i18next from '../../i18n.ts';
import {
	createEmbed,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import { roleInfo } from '../../util/roleInfo.ts';
import { userInfo } from '../../util/userInfo.ts';
import type { Command } from '../index.ts';

export default {
	data: new SlashCommandBuilder()
		.setName(i18next.t('info.name', { ns: 'info' }))
		.setNameLocalizations(slashCommandTranslator('info.name', 'info'))
		.setDescription(i18next.t('info.description', { ns: 'info' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('info.description', 'info'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18next.t('info.user.name', { ns: 'info' }))
				.setNameLocalizations(slashCommandTranslator('info.user.name', 'info'))
				.setDescription(i18next.t('info.user.description', { ns: 'info' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('info.user.description', 'info'),
				)
				.addUserOption((option) =>
					option
						.setName(i18next.t('info.user.options.user.name', { ns: 'info' }))
						.setNameLocalizations(
							slashCommandTranslator('info.user.options.user.name', 'info'),
						)
						.setDescription(
							i18next.t('info.user.options.user.description', { ns: 'info' }),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'info.user.options.user.description',
								'info',
							),
						)
						.setRequired(false),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18next.t('info.badge.name', { ns: 'info' }))
				.setNameLocalizations(slashCommandTranslator('info.badge.name', 'info'))
				.setDescription(i18next.t('info.badge.description', { ns: 'info' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('info.badge.description', 'info'),
				)
				.addStringOption((option) =>
					option
						.setName(i18next.t('info.badge.options.badge.name', { ns: 'info' }))
						.setNameLocalizations(
							slashCommandTranslator('info.badge.options.badge.name', 'info'),
						)
						.setDescription(
							i18next.t('info.badge.options.badge.description', { ns: 'info' }),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'info.badge.options.badge.description',
								'info',
							),
						)
						.setAutocomplete(true)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18next.t('info.role.name', { ns: 'info' }))
				.setNameLocalizations(slashCommandTranslator('info.role.name', 'info'))
				.setDescription(i18next.t('info.role.description', { ns: 'info' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('info.role.description', 'info'),
				)
				.addRoleOption((option) =>
					option
						.setName(i18next.t('info.role.options.role.name', { ns: 'info' }))
						.setNameLocalizations(
							slashCommandTranslator('info.role.options.role.name', 'info'),
						)
						.setDescription(
							i18next.t('info.role.options.role.description', { ns: 'info' }),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'info.role.options.role.description',
								'info',
							),
						)
						.setRequired(true),
				),
		)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		if (
			interaction.options.getSubcommand() ===
			i18next.t('info.user.name', { ns: 'info' })
		) {
			const target =
				interaction.options.getUser(
					i18next.t('info.user.options.user.name', { ns: 'info' }),
				) ?? interaction.user;
			await userInfo(interaction, target);
		}

		if (
			interaction.options.getSubcommand() ===
			i18next.t('info.role.name', { ns: 'info' })
		) {
			await roleInfo(
				interaction,
				interaction.options.getRole(
					i18next.t('info.role.options.role.name', { ns: 'info' }),
					true,
				),
			);
		}

		if (
			interaction.options.getSubcommand() ===
			i18next.t('info.badge.name', { ns: 'info' })
		) {
			const badge =
				interaction.options.getString(
					i18next.t('info.badge.options.badge.name', { ns: 'info' }),
				) ?? undefined;
			const lng = await getLanguage(
				interaction.guildId,
				interaction.user.id,
				true,
			);

			const badgeData = await prisma.badge.findFirst({
				where: {
					name: badge,
				},
			});

			if (!badgeData) {
				await interaction.reply({
					embeds: [
						createEmbed({
							title: i18next.t('info.badge.notFound.title', { ns: 'info' }),
							description: i18next.t('info.badge.notFound.description', {
								ns: 'info',
								badge,
							}),
							color: config.colors.red,
						}),
					],
					ephemeral: true,
				});
				return;
			}

			await interaction.reply({
				embeds: [
					createEmbed({
						color: config.badges.find((badge) => badge.name === badgeData.name)
							?.color,
						description: i18next.t(`${badgeData.name}.description`, {
							ns: 'badges',
							lng,
							translationLink: config.links.translate.masked,
							donationLink: config.links.donate.masked,
						}),
						title: `${badgeData.emoji} ${i18next.t(`${badgeData.name}.name`, { ns: 'badges', lng })}`,
					}),
				],
			});
		}
	},
	async autocomplete(interaction) {
		const badges = await prisma.badge.findMany();
		const lng = await getLanguage(interaction.guildId, interaction.user.id);

		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filtered = [];

		for (const badge of badges) {
			const localizedBadgeName = i18next
				.t(`${badge.name}.name`, { ns: 'badges', lng })
				.toLowerCase();
			const englishBadgeName = i18next
				.t(`${badge.name}.name`, { ns: 'badges' })
				.toLowerCase();

			if (
				badge.name.startsWith(focusedValue) ||
				focusedValue === badge.emoji ||
				localizedBadgeName.startsWith(focusedValue) ||
				englishBadgeName.startsWith(focusedValue)
			) {
				filtered.push({
					name: `${i18next.t(`${badge.name}.name`, { ns: 'badges', lng })}`,
					value: badge.name,
				});
			}
		}

		await interaction.respond(
			filtered.map((choice) => ({ name: choice.name, value: choice.value })),
		);
	},
} satisfies Command;
