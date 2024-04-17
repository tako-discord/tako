import type { MessageContextMenuCommandInteraction } from 'discord.js';
import {
	ActionRowBuilder,
	ApplicationCommandType,
	ButtonBuilder,
	ButtonStyle,
	ContextMenuCommandBuilder,
} from 'discord.js';
import config from '../../../config.ts';
import prisma from '../../database.ts';
import i18next from '../../i18n.ts';
import {
	createEmbed,
	getColor,
	getLanguage,
	slashCommandTranslator,
	translate,
} from '../../util/general.ts';
import type { Command } from '../index.ts';

export default {
	data: new ContextMenuCommandBuilder()
		.setName(i18next.t('quickTranslate.name', { ns: 'utility' }))
		.setNameLocalizations(
			slashCommandTranslator('quickTranslate.name', 'utility'),
		)
		.setType(ApplicationCommandType.Message)
		.toJSON(),
	async execute(interaction: MessageContextMenuCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const lng = await getLanguage(interaction.guildId, interaction.user.id);
		const message = interaction.targetMessage;

		const tooltip =
			(
				await prisma.user.findFirst({
					select: { quickTranslateTooltip: true },
					where: { id: interaction.user.id },
				})
			)?.quickTranslateTooltip ?? true;
		if (tooltip) {
			await prisma.user.upsert({
				where: { id: interaction.user.id },
				update: { quickTranslateTooltip: false },
				create: { id: interaction.user.id, quickTranslateTooltip: false },
			});
		}

		const command =
			'/' +
			i18next.t('changeLanguage.name', { ns: 'utility', lng }) +
			' ' +
			i18next.t('changeLanguage.personal.name', { ns: 'utility', lng });

		if (!message.content) {
			const embed = createEmbed({
				color: config.colors.red,
				title: i18next.t('quickTranslate.noContent', { ns: 'utility', lng }),
				emoji: config.emojis.error,
			});
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		const translation = await translate(message.content, lng, 'auto');
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setURL(message.url)
				.setLabel(i18next.t('quickTranslate.original', { ns: 'utility', lng }))
				.setStyle(ButtonStyle.Link),
		);

		const embed = createEmbed({
			author: {
				name: message.author.tag,
				iconURL: message.author.displayAvatarURL(),
			},
			color: await getColor(interaction.guildId, interaction.user.id),
			description: translation,
			footer: tooltip
				? {
						text: i18next.t('quickTranslate.tooltip', {
							ns: 'utility',
							lng,
							command,
						}),
					}
				: null,
		});
		await interaction.editReply({ embeds: [embed], components: [row] });
	},
} satisfies Command;
