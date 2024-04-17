import { readdir } from 'node:fs/promises';
import { API } from '@discordjs/core/http-only';
import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import config from '../../../config.ts';
import i18next from '../../i18n.ts';
import { isDev } from '../../util/checks.ts';
import {
	createEmbed,
	getLanguage,
	slashCommandTranslator,
} from '../../util/general.ts';
import { loadCommands } from '../../util/loaders.ts';
import type { Command } from '../index.ts';

export default {
	data: new SlashCommandBuilder()
		.setName(i18next.t('sync.name', { ns: 'secret' }))
		.setNameLocalizations(slashCommandTranslator('sync.name', 'secret'))
		.setDescription(i18next.t('sync.description', { ns: 'secret' }))
		.setDescriptionLocalizations(
			slashCommandTranslator('sync.description', 'secret'),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.toJSON(),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const language = await getLanguage(
			interaction.guildId,
			interaction.user.id,
		);

		if (!isDev(interaction.user.id)) {
			const embed = createEmbed({
				color: 'red',
				description: i18next.t('checks.devOnly.title', {
					ns: 'errors',
					lng: language,
				}),
				emoji: config.emojis.error,
				title: i18next.t('checks.devOnly.title', {
					ns: 'errors',
					lng: language,
				}),
			});
			await interaction.editReply({ embeds: [embed] });
			return;
		}

		const commands = [];
		const commandData = [];

		const directory = `${import.meta.dir.slice(0, Math.max(0, import.meta.dir.length - 7))}`;
		for (const file of (await readdir(directory, { withFileTypes: true }))
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)) {
			commands.push(
				await loadCommands(Bun.pathToFileURL(`${directory}/${file}`)),
			);
		}

		for (const command of commands) {
			for (const cmd of [...command.values()].map((command) => command.data)) {
				commandData.push(cmd);
			}
		}

		const api = new API(interaction.client.rest);

		for (const command of commandData) {
			// @ts-expect-error This is not supported by discord.js yet
			commandData[commandData.indexOf(command)].integration_types = [0, 1];
			// @ts-expect-error This is not supported by discord.js yet
			commandData[commandData.indexOf(command)].contexts = [0, 1, 2];

			if (command.dm_permission === false) {
				// @ts-expect-error This is not supported by discord.js yet
				commandData[commandData.indexOf(command)].integration_types = [0];
			}
		}

		let result;
		if (config.dev && config.guilds.dev) {
			result = await api.applicationCommands.bulkOverwriteGuildCommands(
				Bun.env.APPLICATION_ID!,
				config.guilds.dev,
				commandData,
			);
		} else {
			result = await api.applicationCommands.bulkOverwriteGlobalCommands(
				Bun.env.APPLICATION_ID!,
				commandData,
			);
		}

		await interaction.editReply({
			content: `Successfully registered ${result.length} commands.${
				config.dev ? ` On the guild ${config.guilds.dev}` : ''
			}`,
		});
	},
} satisfies Command;
