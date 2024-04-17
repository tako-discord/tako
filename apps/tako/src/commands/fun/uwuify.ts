import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import Uwuifier from 'uwuifier';
import i18next from '../../i18n.ts';
import { slashCommandTranslator } from '../../util/general.ts';
import type { Command } from '../index.ts';

export default {
	data: new SlashCommandBuilder()
		.setName(i18next.t('uwuify.name', { ns: 'fun' }))
		.setNameLocalizations(slashCommandTranslator('uwuify.name', 'fun'))
		.setDescription(i18next.t('uwuify.description', { ns: 'fun' }))
		.addStringOption((option) =>
			option
				.setName(i18next.t('uwuify.options.message.name', { ns: 'fun' }))
				.setNameLocalizations(
					slashCommandTranslator('uwuify.options.message.name', 'fun'),
				)
				.setDescription(
					i18next.t('uwuify.options.message.description', { ns: 'fun' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('uwuify.options.message.description', 'fun'),
				)
				.setRequired(true),
		)
		.addNumberOption((option) =>
			option
				.setName(i18next.t('uwuify.options.stutters.name', { ns: 'fun' }))
				.setNameLocalizations(
					slashCommandTranslator('uwuify.options.stutters.name', 'fun'),
				)
				.setDescription(
					i18next.t('uwuify.options.stutters.description', { ns: 'fun' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('uwuify.options.stutters.description', 'fun'),
				),
		)
		.addNumberOption((option) =>
			option
				.setName(i18next.t('uwuify.options.faces.name', { ns: 'fun' }))
				.setNameLocalizations(
					slashCommandTranslator('uwuify.options.faces.name', 'fun'),
				)
				.setDescription(
					i18next.t('uwuify.options.faces.description', { ns: 'fun' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('uwuify.options.faces.description', 'fun'),
				),
		)
		.addNumberOption((option) =>
			option
				.setName(i18next.t('uwuify.options.actions.name', { ns: 'fun' }))
				.setNameLocalizations(
					slashCommandTranslator('uwuify.options.actions.name', 'fun'),
				)
				.setDescription(
					i18next.t('uwuify.options.actions.description', { ns: 'fun' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('uwuify.options.actions.description', 'fun'),
				),
		)
		.addNumberOption((option) =>
			option
				.setName(i18next.t('uwuify.options.exclamations.name', { ns: 'fun' }))
				.setNameLocalizations(
					slashCommandTranslator('uwuify.options.exclamations.name', 'fun'),
				)
				.setDescription(
					i18next.t('uwuify.options.exclamations.description', { ns: 'fun' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator(
						'uwuify.options.exclamations.description',
						'fun',
					),
				),
		)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		const message =
			interaction.options.getString(
				i18next.t('uwuify.options.message.name', { ns: 'fun' }),
			) ?? '';
		const stutters =
			interaction.options.getNumber(
				i18next.t('uwuify.options.stutters.name', { ns: 'fun' }),
			) ?? 10;
		const faces =
			interaction.options.getNumber(
				i18next.t('uwuify.options.faces.name', { ns: 'fun' }),
			) ?? 0;
		const actions =
			interaction.options.getNumber(
				i18next.t('uwuify.options.actions.name', { ns: 'fun' }),
			) ?? 5;
		const exclamations =
			interaction.options.getNumber(
				i18next.t('uwuify.options.exclamations.name', { ns: 'fun' }),
			) ?? 25;

		const uwuifier = new Uwuifier({
			spaces: {
				stutters: stutters / 100,
				faces: faces / 100,
				actions: actions / 100,
			},
			exclamations: exclamations / 100,
		});
		uwuifier.actions = uwuifier.actions.map((action) =>
			action.replaceAll('*', '***'),
		);

		await interaction.reply({
			content: uwuifier.uwuifySentence(message).replace('-', '~'),
		});
	},
} satisfies Command;
