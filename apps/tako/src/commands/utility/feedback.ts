import type {
	ModalActionRowComponentBuilder,
	ChatInputCommandInteraction,
} from 'discord.js';
import {
	ActionRowBuilder,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import config from '../../../config.ts';
import i18n from '../../i18n.ts';
import linear from '../../linear.ts';
import {
	createEmbed,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import type { Command } from '../index.ts';

let priority = 0;

export default {
	data: new SlashCommandBuilder()
		.setName(i18n.t('feedback.name', { ns: 'utility' }))
		.setNameLocalizations(slashCommandTranslator('feedback.name', 'utility'))
		.setDescription(i18n.t('feedback.description', { ns: 'utility' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('feedback.description', 'utility'),
		)
		.addNumberOption((option) =>
			option
				.setName(i18n.t('feedback.options.priority.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('feedback.options.priority.name', 'utility'),
				)
				.setDescription(
					i18n.t('feedback.options.priority.description', { ns: 'utility' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator(
						'feedback.options.priority.description',
						'utility',
					),
				)
				.addChoices(
					{
						name: i18n.t('feedback.options.priority.choices.none', {
							ns: 'utility',
						}),
						value: 0,
						name_localizations: slashCommandTranslator(
							'feedback.options.priority.choices.none',
							'utility',
						),
					},
					{
						name: i18n.t('feedback.options.priority.choices.low', {
							ns: 'utility',
						}),
						value: 4,
						name_localizations: slashCommandTranslator(
							'feedback.options.priority.choices.low',
							'utility',
						),
					},
					{
						name: i18n.t('feedback.options.priority.choices.normal', {
							ns: 'utility',
						}),
						value: 3,
						name_localizations: slashCommandTranslator(
							'feedback.options.priority.choices.normal',
							'utility',
						),
					},
					{
						name: i18n.t('feedback.options.priority.choices.high', {
							ns: 'utility',
						}),
						value: 2,
						name_localizations: slashCommandTranslator(
							'feedback.options.priority.choices.high',
							'utility',
						),
					},
					{
						name: i18n.t('feedback.options.priority.choices.urgent', {
							ns: 'utility',
						}),
						value: 1,
						name_localizations: slashCommandTranslator(
							'feedback.options.priority.choices.urgent',
							'utility',
						),
					},
				),
		)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		const lng = await getLanguage(interaction.guildId, interaction.user.id);
		priority =
			interaction.options.getNumber(
				i18n.t('feedback.options.priority.name', { ns: 'utility' }),
			) ?? 0;

		const modal = new ModalBuilder()
			.setCustomId(i18n.t('feedback.name', { ns: 'utility' }))
			.setTitle(i18n.t('feedback.modal.title', { ns: 'utility', lng }))
			.addComponents(
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId(
							i18n.t('feedback.modal.feedbackTitle.id', { ns: 'utility' }),
						)
						.setLabel(
							i18n.t('feedback.modal.feedbackTitle.label', {
								ns: 'utility',
								lng,
							}),
						)
						.setPlaceholder(
							i18n.t('feedback.modal.feedbackTitle.placeholder', {
								ns: 'utility',
								lng,
							}),
						)
						.setRequired(true)
						.setStyle(TextInputStyle.Short),
				),
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					new TextInputBuilder()
						.setCustomId(i18n.t('feedback.modal.message.id', { ns: 'utility' }))
						.setLabel(
							i18n.t('feedback.modal.message.label', { ns: 'utility', lng }),
						)
						.setPlaceholder(
							i18n.t('feedback.modal.message.placeholder', {
								ns: 'utility',
								lng,
							}),
						)
						.setRequired(true)
						.setStyle(TextInputStyle.Paragraph),
				),
			);

		await interaction.showModal(modal);
	},
	async modalSubmit(interaction) {
		const lng = await getLanguage(interaction.guildId, interaction.user.id);
		const title = interaction.fields.getTextInputValue(
			i18n.t('feedback.modal.feedbackTitle.id', { ns: 'utility' }),
		);
		const description =
			interaction.fields.getTextInputValue(
				i18n.t('feedback.modal.message.id', { ns: 'utility' }),
			) + `\n\nFeedback by ${interaction.user.tag}`;

		const labels = await linear.issueLabels();
		const label = labels.nodes.find((lab) => lab.name === config.linear.label);

		const teams = await linear.teams();
		const team = teams.nodes.find((tea) => tea.name === config.linear.team);

		if (team?.id) {
			const embed = createEmbed({
				color: config.colors.green,
				title: i18n.t('feedback.modal.response.title', { ns: 'utility', lng }),
				emoji: config.emojis.success,
			});

			await interaction.reply({
				embeds: [embed],
				ephemeral: true,
			});

			await linear.createIssue({
				teamId: team.id,
				title,
				description,
				priority,
				labelIds: label?.id ? [label.id] : undefined,
			});

			return;
		}

		const embed = createEmbed({
			color: config.colors.red,
			title: i18n.t('feedback.modal.error.title', { ns: 'utility', lng }),
			description: i18n.t('feedback.modal.error.description', {
				ns: 'utility',
				lng,
				supportServer: config.links.support.link,
			}),
			emoji: config.emojis.error,
		});

		await interaction.reply({
			embeds: [embed],
			ephemeral: true,
		});
	},
} satisfies Command;
