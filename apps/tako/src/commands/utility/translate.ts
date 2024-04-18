import type { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import { isLangCode } from 'is-language-code';
import { languages } from '../../@types/utility.ts';
import i18next from '../../i18n.ts';
import {
	createEmbed,
	getColor,
	getLanguage,
	slashCommandTranslator,
	translate,
} from '../../util/general.ts';
import type { Command } from '../index.ts';
import config from '../../../config.ts';
import { title } from 'process';

export default {
	data: new SlashCommandBuilder()
		.setName(i18next.t('translate.name', { ns: 'utility' }))
		.setNameLocalizations(slashCommandTranslator('translate.name', 'utility'))
		.setDescription(i18next.t('translate.description', { ns: 'utility' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('translate.description', 'utility'),
		)
		.addStringOption((option) =>
			option
				.setName(i18next.t('translate.options.text.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('translate.options.text.name', 'utility'),
				)
				.setDescription(
					i18next.t('translate.options.text.description', { ns: 'utility' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator(
						'translate.options.text.description',
						'utility',
					),
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName(
					i18next.t('translate.options.language.name', { ns: 'utility' }),
				)
				.setNameLocalizations(
					slashCommandTranslator('translate.options.language.name', 'utility'),
				)
				.setDescription(
					i18next.t('translate.options.language.description', {
						ns: 'utility',
					}),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator(
						'translate.options.language.description',
						'utility',
					),
				)
				.setAutocomplete(true),
		)
		.addStringOption((option) =>
			option
				.setName(i18next.t('translate.options.source.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('translate.options.source.name', 'utility'),
				)
				.setDescription(
					i18next.t('translate.options.source.description', { ns: 'utility' }),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator(
						'translate.options.source.description',
						'utility',
					),
				)
				.setAutocomplete(true),
		)
		.addBooleanOption((option) =>
			option
				.setName(
					i18next.t('translate.options.ephemeral.name', { ns: 'utility' }),
				)
				.setNameLocalizations(
					slashCommandTranslator('translate.options.ephemeral.name', 'utility'),
				)
				.setDescription(
					i18next.t('translate.options.ephemeral.description', {
						ns: 'utility',
					}),
				)
				.setDescriptionLocalizations(
					slashCommandTranslator(
						'translate.options.ephemeral.description',
						'utility',
					),
				),
		)
		.toJSON(),
	async execute(interaction: ChatInputCommandInteraction) {
		const text = interaction.options.getString('text', true);
		const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
		const lng =
			interaction.options.getString('language') ??
			(await getLanguage(interaction.guildId, interaction.user.id, !ephemeral));
		const source = interaction.options.getString('source');

		if (!isLangCode(lng).res || (source && !isLangCode(source).res)) {
			const invalidLanguage = createEmbed({
				color: 'red',
				title: i18next.t('language.invalidLanguage.title', {
					ns: 'errors',
					lng,
				}),
				description: i18next.t('language.invalidLanguage.description', {
					ns: 'errors',
					lng,
				}),
				emoji: config.emojis.error,
			});
			await interaction.reply({
				embeds: [invalidLanguage],
				ephemeral: true,
			});
			return;
		}

		await interaction.deferReply({ ephemeral });

		const color = await getColor(
			interaction.guildId,
			!interaction.guild || ephemeral ? interaction.user.id : undefined,
			interaction.client,
		);
		const description = `${await translate(text, lng, source ?? 'auto')}
		
		\` ${source ?? 'auto'} \` ${config.emojis.pagination.next} \` ${lng} \``;

		const translation = createEmbed({
			color,
			description,
		});

		await interaction.followUp({
			embeds: [translation],
			ephemeral,
		});
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const filtered = [];
		for (const key in languages) {
			if (Object.hasOwn(languages, key)) {
				// @ts-expect-error This value cannot be undefined, because the key is directly from the object.
				const value: string = languages[key];
				if (
					value.toLowerCase().includes(focusedValue.toLowerCase()) ||
					key.toLowerCase().includes(focusedValue.toLowerCase())
				) {
					filtered.push({ name: value, value: key });
				}
			}
		}

		const limited = filtered.slice(0, 25);
		await interaction.respond(limited);
	},
} satisfies Command;
