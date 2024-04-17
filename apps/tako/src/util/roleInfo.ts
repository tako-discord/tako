import { Role } from 'discord.js';
import type { APIRole, CommandInteraction } from 'discord.js';
import config from '../../config';
import i18next from '../i18n';
import { createEmbed, getColor, getLanguage } from './general';

export async function roleInfo(
	interaction: CommandInteraction,
	roleOption: APIRole | Role,
) {
	await interaction.deferReply();

	if (!interaction.guild) {
		await interaction.editReply({
			embeds: [
				createEmbed({
					color: config.colors.red,
					description: i18next.t('serverRequired.description', {
						ns: 'errors',
						lng: 'en',
					}),
					emoji: config.emojis.error,
					title: i18next.t('serverRequired.title', { ns: 'errors', lng: 'en' }),
				}),
			],
		});
		return;
	}

	const role =
		(await interaction.guild.roles.fetch(roleOption.id)) ?? roleOption;
	const lng = await getLanguage(interaction.guildId);

	const yes = i18next.t('yes', { ns: 'common', lng });
	const no = i18next.t('no', { ns: 'common', lng });
	const none = i18next.t('none', { ns: 'common', lng });

	const seperator = '\n**❯** ';

	const general = [
		'',
		i18next.t('info.role.fields.name', { ns: 'info', lng, name: role.name }),
		i18next.t('info.role.fields.id', { ns: 'info', lng, id: role.id }),
		i18next.t('info.role.fields.color', {
			ns: 'info',
			lng,
			color:
				role.color.toString(16) === '0'
					? none
					: '`#' + role.color.toString(16) + '`',
		}),
		i18next.t('info.role.fields.members', {
			ns: 'info',
			lng,
			members:
				role instanceof Role
					? role.members.size === 0
						? none
						: role.members.size +
							` (${role.members
								.map((member) => `<@${member.user.id}>`)
								.slice(0, 3)
								.join(', ')}${
								role.members.size > 3
									? i18next.t('info.role.fields.moreMembers', {
											ns: 'info',
											lng,
											amount: role.members.size - 3,
										})
									: ''
							})`
					: none,
		}),
		i18next.t('info.role.fields.roleIcon', {
			ns: 'info',
			lng,
			icon:
				role instanceof Role && role.iconURL()
					? `[PNG](${role.iconURL({ extension: 'png', size: 4_096 })}) | [JPG](${role.iconURL(
							{ extension: 'jpg', size: 4_096 },
						)})${
							role.iconURL()?.startsWith('a_')
								? ''
								: String(
										' | [WEBP](' +
											role.iconURL({ extension: 'webp', size: 4_096 }) +
											')',
									)
						}${
							role.iconURL()?.startsWith('a_')
								? ' | [GIF](' +
									role.iconURL({ forceStatic: false, size: 4_096 }) +
									')'
								: ''
						}`
					: none,
		}),
	];

	const properties = [
		'',
		i18next.t('info.role.fields.position', {
			ns: 'info',
			lng,
			position: role.position,
		}),
		i18next.t('info.role.fields.managed', {
			ns: 'info',
			lng,
			managed: role.managed ? yes : no,
		}),
		i18next.t('info.role.fields.hoisted', {
			ns: 'info',
			lng,
			hoisted: role.hoist ? yes : no,
		}),
		i18next.t('info.role.fields.mentionable', {
			ns: 'info',
			lng,
			mentionable: role.mentionable ? yes + ` (\`<@&${role.id}>\`)` : no,
		}),
	];

	const embed = createEmbed({
		title: i18next.t('info.role.title', {
			ns: 'info',
			lng,
			role: `<@&${role.id}>`,
		}),
		color:
			role.color.toString(16) === '0'
				? await getColor(interaction.guildId)
				: role.color,
		fields: [
			{
				name: i18next.t('info.role.general', { ns: 'info', lng }),
				value: general.join(seperator),
			},
			{
				name: i18next.t('info.role.properties', { ns: 'info', lng }),
				value: properties.join(seperator),
			},
		],
		thumbnail:
			role instanceof Role
				? role.iconURL({ size: 512 }) ?? undefined
				: undefined,
	});
	await interaction.followUp({ embeds: [embed] });
}
