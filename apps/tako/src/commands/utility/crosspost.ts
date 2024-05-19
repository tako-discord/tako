import type { ChatInputCommandInteraction } from 'discord.js';
import {
	ChannelType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from 'discord.js';
import config from '../../../config.ts';
import prisma from '../../database.ts';
import i18next from '../../i18n.ts';
import {
	createEmbed,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import type { Command } from '../index.ts';

export default {
	data: new SlashCommandBuilder()
		.setName(i18next.t('crosspost.name', { ns: 'utility' }))
		.setNameLocalizations(slashCommandTranslator('crosspost.name', 'utility'))
		.setDescription(i18next.t('crosspost.description', { ns: 'utility' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('crosspost.description', 'utility'),
		)
		.addChannelOption((option) =>
			option
				.setName(i18next.t('crosspost.options.channel.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('crosspost.options.channel.name', 'utility'),
				)
				.setDescription(
					i18next.t('crosspost.options.channel.description', { ns: 'utility' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator(
						'crosspost.options.channel.description',
						'utility',
					),
				)
				.addChannelTypes(ChannelType.GuildAnnouncement),
		)
		.addBooleanOption((option) =>
			option
				.setName(i18next.t('crosspost.options.state.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('crosspost.options.state.name', 'utility'),
				)
				.setDescription(
					i18next.t('crosspost.options.state.description', { ns: 'utility' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator(
						'crosspost.options.state.description',
						'utility',
					),
				),
		)
		.setDefaultMemberPermissions(
			PermissionFlagsBits.ManageChannels | PermissionFlagsBits.ManageMessages,
		)
		.setDMPermission(false)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		const channel =
			interaction.options.getChannel('channel') ?? interaction.channel;
		const existingData = await prisma.channel.findFirst({
			where: { id: channel?.id },
			select: { crosspost: true },
		});
		const state =
			interaction.options.getBoolean('state') ??
			!existingData?.crosspost ??
			true;
		const lng = await getLanguage(
			interaction.guildId,
			interaction.user.id,
			true,
		);

		if (channel?.type !== ChannelType.GuildAnnouncement) {
			await interaction.reply({
				embeds: [
					createEmbed({
						color: config.colors.red,
						description: i18next.t(
							'crosspost.errors.invalidChannel.description',
							{
								ns: 'utility',
								lng,
							},
						),
						emoji: config.emojis.error,
						title: i18next.t('crosspost.errors.invalidChannel.title', {
							ns: 'utility',
							lng,
						}),
					}),
				],
				ephemeral: true,
			});
			return;
		}

		await prisma.channel.upsert({
			where: { id: channel.id },
			create: {
				id: channel.id,
				crosspost: state,
			},
			update: {
				crosspost: state,
			},
		});

		await interaction.reply({
			embeds: [
				createEmbed({
					color: state ? config.colors.green : config.colors.red,
					description: i18next.t(
						'crosspost.success' +
							(state ? '.enabled' : '.disabled') +
							'.description',
						{
							ns: 'utility',
							lng,
							channel: channel.id,
						},
					),
					emoji: state ? config.emojis.success : config.emojis.error,
					title: i18next.t(
						'crosspost.success' + (state ? '.enabled' : '.disabled') + '.title',
						{
							ns: 'utility',
							lng,
							channel: channel.id,
						},
					),
				}),
			],
			ephemeral: true,
		});
	},
} satisfies Command;
