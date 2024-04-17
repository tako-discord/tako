import { SlashCommandBuilder } from 'discord.js';
import config from '../../../config.ts';
import i18n from '../../i18n.ts';
import {
	createEmbed,
	getColor,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import type { Command } from '../index.ts';

export default {
	data: new SlashCommandBuilder()
		.setName(i18n.t('help.name', { ns: 'info' }))
		.setNameLocalizations(slashCommandTranslator('help.name', 'info'))
		.setDescription(i18n.t('help.description', { ns: 'info' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('help.description', 'info'),
		)
		.toJSON(),
	async execute(interaction) {
		const lng = await getLanguage(interaction.guildId, interaction.user.id);

		await interaction.reply({
			embeds: [
				createEmbed({
					color: await getColor(
						interaction.guildId,
						interaction.user.id,
						interaction.client,
					),
					description: i18n.t('help.response', {
						ns: 'info',
						lng,
						docs: config.links.documentation.link,
						support: config.links.support.link,
					}),
				}),
			],
			ephemeral: true,
		});
	},
} satisfies Command;
