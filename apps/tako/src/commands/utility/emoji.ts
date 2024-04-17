import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import config from '../../../config.ts';
import i18next from '../../i18n.ts';
import {
	createEmbed,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import type { Command } from '../index.ts';

// Function to split a list into multiple lists with a maximum of 20 items each
function splitList(list: any[], size: number): any[][] {
	return list.reduce((acc, curr, index) => {
		if (index % size === 0) {
			acc.push([]);
		}

		acc[acc.length - 1].push(curr);
		return acc;
	}, []);
}

export default {
	data: new SlashCommandBuilder()
		.setName(i18next.t('emoji.name', { ns: 'utility' }))
		.setNameLocalizations(slashCommandTranslator('emoji.name', 'utility'))
		.setDescription(i18next.t('emoji.description', { ns: 'utility' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('emoji.description', 'utility'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(i18next.t('emoji.list.name', { ns: 'utility' }))
				.setNameLocalizations(
					slashCommandTranslator('emoji.list.name', 'utility'),
				)
				.setDescription(i18next.t('emoji.list.description', { ns: 'utility' }))
				.setDescriptionLocalizations(
					slashCommandTranslator('emoji.list.description', 'utility'),
				),
		)
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions)
		.toJSON(),
	async execute(interaction) {
		const lng = await getLanguage(interaction.guildId);

		if (!interaction.guild) {
			await interaction.reply({
				embeds: [
					createEmbed({
						color: config.colors.red,
						description: i18next.t('serverRequired.description', {
							ns: 'errors',
							lng,
						}),
						emoji: config.emojis.error,
						title: i18next.t('serverRequired.title', { ns: 'errors', lng }),
					}),
				],
				ephemeral: true,
			});
			return;
		}

		const emojis = await interaction.guild.emojis.fetch();

		const emojiList = emojis.map(
			(emoji) =>
				`${emoji} - \`<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>\``,
		);

		const splitEmojiLists = splitList(emojiList, 20);

		await interaction.reply({
			content: splitEmojiLists[0].join('\n'),
		});

		for (let index = 1; index < splitEmojiLists.length; index++) {
			await interaction.channel?.send({
				content: splitEmojiLists[index].join('\n'),
			});
		}
	},
} satisfies Command;
