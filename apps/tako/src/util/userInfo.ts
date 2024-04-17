import type {
	UserContextMenuCommandInteraction,
	CommandInteraction,
	GuildMemberRoleManager,
	User,
	UserFlagsBitField,
} from 'discord.js';
import prisma from '../database';
import i18next from '../i18n';
import { createEmbed, getBanner, getColor, getLanguage } from './general';

function handleFlags(flags: Readonly<UserFlagsBitField>, language: string) {
	const flagsArray = [];
	for (const [index, flag] of flags.toArray().entries()) {
		let addable = ', ';
		if (index === flags.toArray().length - 2) {
			addable = ' & ';
		}

		if (index === flags.toArray().length - 1) {
			addable = '';
		}

		flagsArray.push(
			i18next.t(`info.user.flag.${flag}`, { ns: 'info', lng: language }) +
				addable,
		);
	}

	if (flagsArray.length === 0)
		return i18next.t('info.user.noFlags', { ns: 'info', lng: language });
	return flagsArray.join('');
}

function handleRoles(roles: GuildMemberRoleManager, language: string) {
	const rolesArray = [];
	const sortedRoles = Array.from(
		roles.cache.sort((a, b) => b.position - a.position).values(),
	);
	const everyoneIndex = sortedRoles.indexOf(roles.guild.roles.everyone);
	if (everyoneIndex > -1) sortedRoles.splice(everyoneIndex, 1);

	for (const role of sortedRoles) {
		if (role === roles.guild.roles.everyone) continue;

		let addable = ', ';
		const index = sortedRoles.indexOf(role);

		if (index === sortedRoles.length - 2) {
			addable = ' & ';
		}

		if (index === sortedRoles.length - 1) {
			addable = '';
		}

		rolesArray.push(role.toString() + addable);
	}

	if (rolesArray.length === 0)
		return i18next.t('info.user.noRoles', { ns: 'info', lng: language });
	return rolesArray.join('');
}

export async function userInfo(
	interaction: CommandInteraction | UserContextMenuCommandInteraction,
	user: User,
) {
	const language = await getLanguage(interaction.guildId);
	const target = user;
	await target.fetch();
	const fields = [];
	const seperator = '\n**❯** ';

	const general = [
		'',
		i18next.t('info.user.username', {
			ns: 'info',
			lng: language,
			username: target.tag,
		}),
		i18next.t('info.user.id', { ns: 'info', lng: language, id: target.id }),
		i18next.t('info.user.flags', {
			ns: 'info',
			lng: language,
			flags: target.flags
				? handleFlags(target.flags, language)
				: i18next.t('info.user.noFlags', { ns: 'info', lng: language }),
		}),
	];

	if (target.createdTimestamp) {
		general.push(
			i18next.t('info.user.created', {
				ns: 'info',
				lng: language,
				date: `<t:${Math.round(target.createdTimestamp / 1_000)}:d>`,
				relative: `<t:${Math.round(target.createdTimestamp / 1_000)}:R>`,
			}),
		);
	}

	if (target.avatar) {
		general.push(
			i18next.t('info.user.avatar', { ns: 'info', lng: language }) +
				`[PNG](${target.avatarURL({ extension: 'png', size: 4_096 })}) | [JPG](${target.avatarURL(
					{
						extension: 'jpg',
						size: 4_096,
					},
				)})${
					target.avatar.startsWith('a_')
						? ''
						: ' | [WEBP](' +
							target.avatarURL({ extension: 'webp', size: 4_096 }) +
							')'
				}${
					target.avatar.startsWith('a_')
						? ' | [GIF](' +
							target.avatarURL({ forceStatic: false, size: 4_096 }) +
							')'
						: ''
				}`,
		);
	} else {
		general.push(
			i18next.t('info.user.avatar', { ns: 'info', lng: language }) +
				`[URL](${target.defaultAvatarURL})`,
		);
	}

	if (target.bannerURL()) {
		general.push(
			i18next.t('info.user.banner', { ns: 'info', lng: language }) +
				`[PNG](${target.bannerURL({ extension: 'png', size: 4_096 })}) | [JPG](${target.bannerURL(
					{
						extension: 'jpg',
						size: 4_096,
					},
				)})${
					target.banner?.startsWith('a_')
						? ''
						: ' | [WEBP](' +
							target.bannerURL({
								extension: 'webp',
								size: 4_096,
							}) +
							')'
				}${
					target.banner?.startsWith('a_')
						? ' | [GIF](' +
							target.bannerURL({
								forceStatic: false,
								size: 4_096,
							}) +
							')'
						: ''
				}`,
		);
	}

	fields.push({
		name: i18next.t('info.user.general', { ns: 'info', lng: language }),
		value: general.join(seperator),
	});

	const member = interaction.guild?.members.cache.get(target.id);
	if (member) {
		const server = [
			'',
			i18next.t('info.user.roles', {
				ns: 'info',
				lng: language,
				roles:
					handleRoles(member.roles, language) ??
					i18next.t('info.user.noRoles', { ns: 'info', lng: language }),
			}),
		];

		if (member.roles.cache.size > 1) {
			server.push(
				i18next.t('info.user.topRole', {
					ns: 'info',
					lng: language,
					role: member.roles.highest.id,
				}),
			);
			if (member.roles.hoist)
				server.push(
					i18next.t('info.user.hoistRole', {
						ns: 'info',
						lng: language,
						role: member.roles.hoist.id,
					}),
				);
		}

		if (member.joinedTimestamp) {
			server.push(
				i18next.t('info.user.joined', {
					ns: 'info',
					lng: language,
					date: `<t:${Math.round(member.joinedTimestamp / 1_000)}:d>`,
					relative: `<t:${Math.round(member.joinedTimestamp / 1_000)}:R>`,
				}),
			);
		}

		if (member.displayAvatarURL() !== target.displayAvatarURL()) {
			server.push(
				i18next.t('info.user.serverAvatar', { ns: 'info', lng: language }) +
					`[PNG](${member.displayAvatarURL({
						extension: 'png',
						size: 4_096,
					})}) | [JPG](${member.displayAvatarURL({
						extension: 'jpg',
						size: 4_096,
					})})${
						member.displayAvatarURL().includes('a_')
							? ''
							: ' | [WEBP](' +
								member.displayAvatarURL({ extension: 'webp', size: 4_096 }) +
								')'
					}${
						member.displayAvatarURL().includes('a_')
							? ' | [GIF](' +
								member.displayAvatarURL({ forceStatic: false, size: 4_096 }) +
								')'
							: ''
					}`,
			);
		}

		fields.push({
			name: i18next.t('info.user.server', { ns: 'info', lng: language }),
			value: server.join(seperator),
		});
	}

	const badges = await prisma.badge.findMany({
		where: { users: { has: target.id } },
	});
	if (badges) {
		const badgeArray = [''];
		for (const badge of badges) {
			badgeArray.push(
				`${badge.emoji} ${i18next.t(`${badge.name}.name`, { ns: 'badges', lng: language })}`,
			);
		}

		if (badgeArray.length > 1) {
			fields.push({
				name: i18next.t('info.user.badges', {
					ns: 'info',
					lng: language,
					client: interaction.client.user.displayName,
				}),
				value: badgeArray.join('\n'),
			});
		}
	}

	const embed = createEmbed({
		title: i18next.t('info.user.title', {
			ns: 'info',
			lng: language,
			user: target.displayName,
		}),
		description: i18next.t('info.user.embedDescription', {
			ns: 'info',
			lng: language,
			user: target.id,
		}),
		color: await getColor(interaction.guildId, target.id, interaction.client),
		fields,
		thumbnail:
			member?.displayAvatarURL({ size: 512 }) ??
			target.displayAvatarURL({ size: 512 }),
		image: (await getBanner(target.id)) ?? target.bannerURL({ size: 512 }),
	});
	await interaction.reply({ embeds: [embed] });
}
