import type {
	ApplicationCommandOptionAllowedChannelTypes,
	ChatInputCommandInteraction,
} from 'discord.js';
import {
	ChannelType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js';
import i18next from 'i18next';
import config from '../../../config.ts';
import prisma from '../../database.ts';
import i18n from '../../i18n.ts';
import { parseAutoReactEmojis } from '../../util/emojis.ts';
import {
	createEmbed,
	getColor,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import type { Command } from '../index.ts';

const validChannels: ApplicationCommandOptionAllowedChannelTypes[] = [
	ChannelType.GuildText,
	ChannelType.GuildAnnouncement,
	ChannelType.GuildMedia,
	ChannelType.GuildForum,
	ChannelType.PublicThread,
	ChannelType.AnnouncementThread,
	ChannelType.PrivateThread,
];

export default {
	data: new SlashCommandBuilder()
		.setName(i18n.t('autoReact.name', { ns: 'utility' }))
		.setNameLocalizations(slashCommandTranslator('autoReact.name', 'utility'))
		.setDescription(i18n.t('autoReact.description', { ns: 'utility' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('autoReact.description', 'utility'),
		)
		.setDefaultMemberPermissions(
			PermissionFlagsBits.AddReactions |
				PermissionFlagsBits.ManageGuildExpressions,
		)
		.setDMPermission(false)
		// ADD
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18n.t('autoReact.add.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('autoReact.add.name', 'utility'),
				)
				.setDescription(i18n.t('autoReact.add.description', { ns: 'utility' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('autoReact.add.description', 'utility'),
				)
				.addStringOption((option) =>
					option
						.setName(
							i18n.t('autoReact.add.options.emoji.name', { ns: 'utility' }),
						)
						.setNameLocalizations(
							slashCommandTranslator(
								'autoReact.add.options.emoji.name',
								'utility',
							),
						)
						.setDescription(
							i18n.t('autoReact.add.options.emoji.description', {
								ns: 'utility',
							}),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'autoReact.add.options.emoji.description',
								'utility',
							),
						)
						.setRequired(true),
				)
				.addChannelOption((option) =>
					option
						.setName(
							i18next.t('autoReact.add.options.channel.name', {
								ns: 'utility',
							}),
						)
						.setNameLocalizations(
							slashCommandTranslator(
								'autoReact.add.options.channel.name',
								'utility',
							),
						)
						.setDescription(
							i18next.t('autoReact.add.options.channel.description', {
								ns: 'utility',
							}),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'autoReact.add.options.channel.description',
								'utility',
							),
						)
						.addChannelTypes(...validChannels),
				),
		)
		// REMOVE
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18n.t('autoReact.remove.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('autoReact.remove.name', 'utility'),
				)
				.setDescription(
					i18n.t('autoReact.remove.description', { ns: 'utility' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('autoReact.remove.description', 'utility'),
				)
				.addStringOption((option) =>
					option
						.setName(
							i18n.t('autoReact.remove.options.emoji.name', { ns: 'utility' }),
						)
						.setNameLocalizations(
							slashCommandTranslator(
								'autoReact.remove.options.emoji.name',
								'utility',
							),
						)
						.setDescription(
							i18n.t('autoReact.remove.options.emoji.description', {
								ns: 'utility',
							}),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'autoReact.remove.options.emoji.description',
								'utility',
							),
						)
						.setAutocomplete(true)
						.setRequired(true),
				)
				.addChannelOption((option) =>
					option
						.setName(
							i18next.t('autoReact.remove.options.channel.name', {
								ns: 'utility',
							}),
						)
						.setNameLocalizations(
							slashCommandTranslator(
								'autoReact.remove.options.channel.name',
								'utility',
							),
						)
						.setDescription(
							i18next.t('autoReact.remove.options.channel.description', {
								ns: 'utility',
							}),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'autoReact.remove.options.channel.description',
								'utility',
							),
						)
						.addChannelTypes(...validChannels),
				),
		)
		// LIST
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18n.t('autoReact.list.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('autoReact.list.name', 'utility'),
				)
				.setDescription(i18n.t('autoReact.list.description', { ns: 'utility' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('autoReact.list.description', 'utility'),
				)
				.addChannelOption((option) =>
					option
						.setName(
							i18next.t('autoReact.list.options.channel.name', {
								ns: 'utility',
							}),
						)
						.setNameLocalizations(
							slashCommandTranslator(
								'autoReact.list.options.channel.name',
								'utility',
							),
						)
						.setDescription(
							i18next.t('autoReact.list.options.channel.description', {
								ns: 'utility',
							}),
						)
						.setDescriptionLocalizations(
							slashCommandTranslator(
								'autoReact.list.options.channel.description',
								'utility',
							),
						)
						.addChannelTypes(...validChannels),
				),
		)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		const lng = await getLanguage(interaction.guildId, interaction.user.id);

		if (subcommand === 'add') {
			const emoji = interaction.options.getString(
				i18next.t('autoReact.add.options.emoji.name', { ns: 'utility' }),
				true,
			);
			const channel =
				interaction.options.getChannel(
					i18next.t('autoReact.add.options.channel.name', { ns: 'utility' }),
				) ?? interaction.channel;
			if (
				!channel ||
				!validChannels.includes(
					channel.type as ApplicationCommandOptionAllowedChannelTypes,
				)
			) {
				await interaction.reply({
					embeds: [
						createEmbed({
							color: config.colors.red,
							description: i18next.t('autoReact.noTextChannel', {
								ns: 'errors',
								lng,
							}),
							emoji: config.emojis.error,
						}),
					],
					ephemeral: true,
				});
				return;
			}

			// Get the current autoReact emojis
			const currentEmojis = await prisma.channel.findUnique({
				where: {
					id: channel.id,
				},
				select: {
					autoReact: true,
				},
			});

			// Add all emojis to the array, both custom and unicode using regex
			const emojis = parseAutoReactEmojis(emoji, currentEmojis?.autoReact);

			// Add the emojis to the database
			await prisma.channel.upsert({
				where: {
					id: channel.id,
				},
				update: {
					autoReact: emojis,
				},
				create: {
					id: channel.id,
					autoReact: emojis,
				},
			});

			if (emojis.length >= 20) {
				await interaction.reply({
					embeds: [
						createEmbed({
							color: config.colors.red,
							description: i18next.t('autoReact.maxEmojis', {
								ns: 'errors',
								lng,
							}),
							emoji: config.emojis.error,
						}),
					],
				});
				return;
			}

			const embed = createEmbed({
				title: i18next.t('autoReact.add.title', { ns: 'utility', lng }),
				description: i18next.t('autoReact.add.response', {
					ns: 'utility',
					lng,
					channel: channel.id,
					emojis: emojis.join(', '),
				}),
				color: config.colors.green,
				emoji: config.emojis.success,
			});
			await interaction.reply({ embeds: [embed], ephemeral: true });
		}

		if (subcommand === 'remove') {
			const emoji = interaction.options.getString(
				i18next.t('autoReact.remove.options.emoji.name', { ns: 'utility' }),
				true,
			);
			const channel =
				interaction.options.getChannel(
					i18next.t('autoReact.remove.options.channel.name', { ns: 'utility' }),
				) ?? interaction.channel;

			if (!channel) {
				await interaction.reply({
					embeds: [
						createEmbed({
							color: config.colors.red,
							description: i18next.t('autoReact.noTextChannel', {
								ns: 'errors',
								lng,
							}),
							emoji: config.emojis.error,
						}),
					],
					ephemeral: true,
				});
				return;
			}

			const emojisToRemove = parseAutoReactEmojis(emoji);

			// Get the current autoReact emojis
			const currentEmojis = await prisma.channel.findUnique({
				where: {
					id: channel?.id,
				},
				select: {
					autoReact: true,
				},
			});

			// Remove the emojis from the database
			const emojis =
				currentEmojis?.autoReact.filter((em) => !emojisToRemove.includes(em)) ??
				[];

			await prisma.channel.upsert({
				where: {
					id: channel.id,
				},
				update: {
					autoReact: emojis,
				},
				create: {
					id: channel.id,
					autoReact: emojis,
				},
			});

			const description =
				emojis.length === 0
					? i18next.t('autoReact.remove.response', {
							ns: 'utility',
							lng,
							channel: channel.id,
						})
					: i18next.t('autoReact.add.response', {
							ns: 'utility',
							lng,
							emojis: emojis.join(', '),
							channel: channel.id,
						});

			const embed = createEmbed({
				title: i18next.t('autoReact.remove.title', {
					ns: 'utility',
					lng,
				}),
				description,
				color: config.colors.green,
				emoji: config.emojis.success,
			});
			await interaction.reply({ embeds: [embed], ephemeral: true });
		}

		if (subcommand === 'list') {
			const channel =
				interaction.options.getChannel(
					i18next.t('autoReact.add.options.channel.name', { ns: 'utility' }),
				) ?? interaction.channel;

			if (!channel) {
				await interaction.reply({
					embeds: [
						createEmbed({
							color: config.colors.red,
							description: i18next.t('autoReact.noTextChannel', {
								ns: 'errors',
								lng,
							}),
							emoji: config.emojis.error,
						}),
					],
					ephemeral: true,
				});
				return;
			}

			const data = await prisma.channel.findFirst({
				where: { id: channel.id },
				select: { autoReact: true },
			});

			if (!data?.autoReact || data.autoReact.length === 0) {
				await interaction.reply({
					embeds: [
						createEmbed({
							color: config.colors.red,
							emoji: config.emojis.error,
							description: i18next.t('autoReact.noEmojis', {
								ns: 'errors',
								lng,
								channel: channel.id,
							}),
						}),
					],
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
						title: i18next.t('autoReact.list.response', {
							ns: 'utility',
							lng,
							channel: channel.id,
						}),
						description: data?.autoReact.join(', '),
					}),
				],
				ephemeral: true,
			});
		}
	},
	async autocomplete(interaction) {
		const current = interaction.options.getFocused();
		const currentEmojis = await prisma.channel.findFirst({
			where: { id: interaction.channelId },
			select: { autoReact: true },
		});
		const result = [];

		for (const emoji of currentEmojis?.autoReact ?? []) {
			if (emoji.includes(current)) {
				result.push({ name: emoji, value: emoji });
			}
		}

		await interaction.respond(result);
	},
} satisfies Command;
