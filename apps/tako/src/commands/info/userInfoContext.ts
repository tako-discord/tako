import type { UserContextMenuCommandInteraction } from 'discord.js';
import { ApplicationCommandType, ContextMenuCommandBuilder } from 'discord.js';
import i18next from '../../i18n.ts';
import { slashCommandTranslator } from '../../util/general.ts';
import { userInfo } from '../../util/userInfo.ts';
import type { Command } from '../index.ts';

export default {
	data: new ContextMenuCommandBuilder()
		.setName(i18next.t('info.user.context.name', { ns: 'info' }))
		.setNameLocalizations(
			slashCommandTranslator('info.user.context.name', 'info'),
		)
		.setType(ApplicationCommandType.User)
		.toJSON(),
	async execute(interaction: UserContextMenuCommandInteraction) {
		await userInfo(interaction, interaction.targetUser);
	},
} satisfies Command;
