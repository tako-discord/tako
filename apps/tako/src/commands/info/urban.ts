import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import config from '../../../config.ts';
import type { UrbanDictionaryResponse } from '../../@types/apis';
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
		.setName(i18next.t('urban.name', { ns: 'info' }))
		.setNameLocalizations(slashCommandTranslator('urban.name', 'info'))
		.setDescription(i18next.t('urban.description', { ns: 'info' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('urban.description', 'info'),
		)
		.addStringOption((option) =>
			option
				.setName(i18next.t('urban.options.term.name', { ns: 'info' }))
				.setNameLocalizations(
					slashCommandTranslator('urban.options.term.name', 'info'),
				)
				.setDescription(
					i18next.t('urban.options.term.description', { ns: 'info' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('urban.options.term.description', 'info'),
				)
				.setRequired(true)
				.setAutocomplete(true),
		)
		.addBooleanOption((option) =>
			option
				.setName(i18next.t('urban.options.strict.name', { ns: 'info' }))
				.setNameLocalizations(
					slashCommandTranslator('urban.options.strict.name', 'info'),
				)
				.setDescription(
					i18next.t('urban.options.strict.description', { ns: 'info' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('urban.options.strict.description', 'info'),
				),
		)
		.addBooleanOption((option) =>
			option
				.setName(i18next.t('urban.options.matchCase.name', { ns: 'info' }))
				.setNameLocalizations(
					slashCommandTranslator('urban.options.matchCase.name', 'info'),
				)
				.setDescription(
					i18next.t('urban.options.matchCase.description', { ns: 'info' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('urban.options.matchCase.description', 'info'),
				),
		)
		.addBooleanOption((option) =>
			option
				.setName(i18next.t('urban.options.ephemeral.name', { ns: 'info' }))
				.setNameLocalizations(
					slashCommandTranslator('urban.options.ephemeral.name', 'info'),
				)
				.setDescription(
					i18next.t('urban.options.ephemeral.description', { ns: 'info' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator('urban.options.ephemeral.description', 'info'),
				),
		)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		let term = interaction.options.getString('term', true);
		let strict = interaction.options.getBoolean('strict') ?? false;
		let matchCase = interaction.options.getBoolean('matchCase') ?? false;
		const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
		await interaction.deferReply({ ephemeral });
		const lng = await getLanguage(
			interaction.guildId,
			interaction.user.id,
			true,
		);
		let index = 0;
		if (term.includes(' urbanApiDataIndex=')) {
			const splitted = term.split(' urbanApiDataIndex=');
			index = Number(splitted[1]);
			term = splitted[0];
			strict = false;
			matchCase = false;
		}

		const url = `${config.apis.urban}/search?term=${encodeURIComponent(term)}&limit=${
			index + 1
		}&strict=${strict}&matchCase=${matchCase}`;

		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
		let body: UrbanDictionaryResponse | null = null;
		try {
			body = await response.json();
		} catch {}

		if (!body) {
			await interaction.editReply({
				content: i18next.t('urban.error', { ns: 'info', lng, term }),
			});
			return;
		}

		if (body.statusCode !== 200) {
			await interaction.editReply({
				content: i18next.t('urban.error', {
					ns: 'info',
					context: body.statusCode.toString(),
					lng,
					term,
				}),
			});
			return;
		}

		const embed = createEmbed({
			author: {
				name: body.data[index].contributor.slice(0, 256),
				// eslint-disable-next-line @stylistic/max-len
				url: `https://www.urbandictionary.com/author.php?author=${encodeURIComponent(body.data[index].contributor)}`,
			},
			color: await getColor(interaction.guildId),
			title: body.data[index].word.slice(0, 256),
			description: body.data[index].meaning.slice(0, 4_096),
			fields: [
				{
					name: i18next.t('urban.example', { ns: 'info', lng }),
					value: body.data[index].example.slice(0, 1_024),
				},
			],
			footer: {
				text: i18next.t('urban.footer', {
					ns: 'info',
					lng,
					date: new Date(body.data[index].date),
				}),
			},
		});

		await interaction.editReply({ embeds: [embed] });
	},
	async autocomplete(interaction) {
		const term = interaction.options.getFocused();
		const url = `${config.apis.urban}/search?term=${encodeURIComponent(term)}&limit=25`;

		const options = [];

		const response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		});
		let body: UrbanDictionaryResponse | null = null;
		try {
			body = await response.json();
		} catch {}

		if (!body) {
			await interaction.respond([]);
			return;
		}

		if (body.statusCode !== 200) {
			await interaction.respond([]);
			return;
		}

		for (const definition of body.data) {
			options.push({
				name: `${definition.word} (${definition.contributor})`,
				value: `${term} urbanApiDataIndex=${body.data.indexOf(definition)}`,
			});
		}

		await interaction.respond(options.slice(0, 25));
	},
} satisfies Command;
