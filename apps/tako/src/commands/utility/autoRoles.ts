import type { ChatInputCommandInteraction } from 'discord.js';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import config from '../../../config.ts';
import prisma from '../../database.ts';
import i18n from '../../i18n.ts';
import { autoRolesFunc } from '../../util/autoRoles.ts';
import {
	createEmbed,
	getColor,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import type { Command } from '../index';

export default {
	data: new SlashCommandBuilder()
		.setName(i18n.t('autoRoles.name', { ns: 'utility' }))
		.setNameLocalizations(slashCommandTranslator('autoRoles.name', 'utility'))
		.setDescription(i18n.t('autoRoles.description', { ns: 'utility' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('autoRoles.description', 'utility'),
		)
		.setDMPermission(false)
		.setDefaultMemberPermissions(
			PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageGuild,
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18n.t('autoRoles.user.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('autoRoles.user.name', 'utility'),
				)
				.setDescription(i18n.t('autoRoles.user.description', { ns: 'utility' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('autoRoles.user.description', 'utility'),
				)
				.addRoleOption((option) =>
					option
						.setName(i18n.t('autoRoles.options.role.name', { ns: 'utility' }))
						.setNameLocalizations(
							slashCommandTranslator('autoRoles.options.role.name', 'utility'),
						)
						.setDescription(
							i18n.t('autoRoles.options.role.description', { ns: 'utility' }),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'autoRoles.options.role.description',
								'utility',
							),
						)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18n.t('autoRoles.bot.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('autoRoles.bot.name', 'utility'),
				)
				.setDescription(i18n.t('autoRoles.bot.description', { ns: 'utility' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('autoRoles.bot.description', 'utility'),
				)
				.addRoleOption((option) =>
					option
						.setName(i18n.t('autoRoles.options.role.name', { ns: 'utility' }))
						.setNameLocalizations(
							slashCommandTranslator('autoRoles.options.role.name', 'utility'),
						)
						.setDescription(
							i18n.t('autoRoles.options.role.description', { ns: 'utility' }),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'autoRoles.options.role.description',
								'utility',
							),
						)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18n.t('autoRoles.list.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('autoRoles.list.name', 'utility'),
				)
				.setDescription(i18n.t('autoRoles.list.description', { ns: 'utility' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('autoRoles.list.description', 'utility'),
				),
		)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === i18n.t('autoRoles.user.name', { ns: 'utility' })) {
			await autoRolesFunc(interaction, 'user');
		}

		if (subcommand === i18n.t('autoRoles.bot.name', { ns: 'utility' })) {
			await autoRolesFunc(interaction, 'bot');
		}

		if (subcommand === i18n.t('autoRoles.list.name', { ns: 'utility' })) {
			const data = await prisma.guild.findUnique({
				where: {
					id: interaction.guildId ?? undefined,
				},
				select: { autoRolesUser: true, autoRolesBot: true },
			});

			const userRoles: string[] = [];
			const botRoles: string[] = [];
			const lng = await getLanguage(interaction.guildId);

			for (const roleId of data?.autoRolesUser ?? []) {
				userRoles.push(`<@&${roleId}> (\`${roleId}\`)`);
			}

			for (const roleId of data?.autoRolesBot ?? []) {
				botRoles.push(`<@&${roleId}> (\`${roleId}\`)`);
			}

			await interaction.reply({
				embeds: [
					createEmbed({
						color: await getColor(interaction.guildId),
						fields: [
							{
								name:
									config.emojis.user +
									' ' +
									i18n.t('autoRoles.list.response.user', {
										ns: 'utility',
										lng,
										count: userRoles.length,
									}),
								value:
									userRoles.length > 0
										? userRoles.join('\n')
										: i18n.t('autoRoles.list.response.none', {
												ns: 'utility',
												lng,
											}),
							},
							{
								name:
									config.emojis.bot +
									' ' +
									i18n.t('autoRoles.list.response.bot', {
										ns: 'utility',
										lng,
										count: botRoles.length,
									}),
								value:
									botRoles.length > 0
										? botRoles.join('\n')
										: i18n.t('autoRoles.list.response.none', {
												ns: 'utility',
												lng,
											}),
							},
						],
						thumbnail:
							interaction.guild?.iconURL({ forceStatic: false, size: 256 }) ??
							undefined,
						title: i18n.t('autoRoles.list.response.title', {
							ns: 'utility',
							lng,
							guild: interaction.guild?.name,
						}),
					}),
				],
			});
			// List auto roles
		}
	},
} satisfies Command;
