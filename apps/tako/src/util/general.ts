import { setTimeout } from 'node:timers';
import { FastText } from '@rafaelkallis/fasttext';
import type { Client } from 'discord.js';
import { EmbedBuilder, Locale } from 'discord.js';
import config from '../../config.ts';
import type {
	LingvaTranslateResponse,
	DeeplTargetLanguageCode,
} from '../@types/apis';
import { DeeplTargetLanguageCodes } from '../@types/apis';
import type { EmbedOptions } from '../@types/general';
import prisma from '../database.ts';
import i18next from '../i18n.ts';

export function createEmbed({
	author,
	color = 'primary',
	description,
	emoji,
	fields,
	footer,
	image,
	thumbnail,
	timestamp,
	title,
}: EmbedOptions) {
	const embed = new EmbedBuilder().setColor(
		typeof color === 'string' ? config.colors[color] : color,
	);

	// This is the logic behind using the titles as a description and optionally also adding an emoji.
	// That will fix the issue of the emoji and title not being vertically aligned.
	const formattedEmoji = emoji ? '### ' + emoji + ' ' : '';
	const title_start = emoji ? '' : '### ';
	const formattedDescription = `${formattedEmoji}${title ? title_start + title + '\n' : ''}${description ?? ''}`;

	// The previous title logic, if we want to revert back to it.
	//
	// if (title && emoji) embed.setTitle(`${emoji} ${title}`);
	// if (title && !emoji) embed.setTitle(title);
	// if (description) embed.setDescription(description);
	if (emoji || title || description) embed.setDescription(formattedDescription);
	if (fields) embed.setFields(fields);
	if (thumbnail) embed.setThumbnail(thumbnail);
	if (image) embed.setImage(image);
	if (timestamp) embed.setTimestamp(timestamp);
	if (footer) embed.setFooter(footer);
	if (author) embed.setAuthor(author);

	return embed;
}

export async function getColor(
	guildId: string | null,
	userId?: string,
	client?: Client,
) {
	let color = config.colors.primary;
	if (guildId) {
		const guild = await prisma.guild.findFirst({ where: { id: guildId } });
		if (guild?.color) color = guild.color;
	}

	if (userId) {
		const user = await prisma.user.findFirst({ where: { id: userId } });

		if (!user?.color && client) {
			const user = await client.users.fetch(userId, { force: true });
			if (user) color = user.accentColor ?? color;
			return color;
		}

		color = user?.color ?? color;
	}

	return color;
}

export async function getLanguage(
	guildId: string | null,
	userId?: string,
	prioritizeGuild = false,
) {
	let language = 'en';

	if (guildId) {
		const guild = await prisma.guild.findFirst({ where: { id: guildId } });
		if (guild?.language) language = guild.language;
	}

	if (userId && !(prioritizeGuild && guildId)) {
		const user = await prisma.user.findFirst({ where: { id: userId } });
		if (user?.language) language = user.language;
	}

	return language;
}

export function slashCommandTranslator(key: string, ns: string) {
	const translation: { [index: string]: string } = {};
	const locales = Object.values(Locale);

	for (const locale of locales) {
		translation[locale] = i18next.t(key, { ns, lng: locale });
	}

	return translation;
}

export async function getBanner(userId: string) {
	const user = await prisma.user.findFirst({ where: { id: userId } });
	return user?.background;
}

export async function translate(
	message: string,
	target: string,
	source: string = 'auto',
) {
	let translation = message;
	const timeout = 3_000;
	const timeoutPromise = new Promise<Response>((resolve) => {
		setTimeout(resolve, timeout);
	});
	const response = await Promise.race([
		fetch(
			config.apis.lingva +
				`/${source}/${target}/${encodeURIComponent(message)}`,
		),
		timeoutPromise,
	]);
	let detected = null;

	let lingva: LingvaTranslateResponse | null = null;
	if (response && response.status === 200) {
		try {
			lingva = await response.json();
			translation = lingva?.translation ?? message;
		} catch {}
	}

	if (lingva?.info?.detectedSource) {
		detected = lingva.info.detectedSource;
	}

	if (
		!detected ||
		(DeeplTargetLanguageCodes.includes(
			detected.toLowerCase() as DeeplTargetLanguageCode,
		) &&
			DeeplTargetLanguageCodes.includes(
				target.toLowerCase() as DeeplTargetLanguageCode,
			))
	) {
		const key = Bun.env.DEEPL_API_KEY;
		if (key) {
			const url =
				(key.endsWith(':fx') ? config.apis.deepl.free : config.apis.deepl.pro) +
				'/translate';
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `DeepL-Auth-Key ${key}`,
				},
				body: JSON.stringify({
					text: [message],
					target_lang: target,
					source_lang: source === 'auto' ? null : source.split('-')[0],
				}),
			});

			let deepl = null;
			if (response.status === 200) {
				try {
					deepl = await response.json();
				} catch {}
			}

			translation =
				deepl.translations[0].text ?? lingva?.translation ?? message;
		}
	}

	return translation;
}

const fastText = await FastText.from(
	Bun.pathToFileURL('lid.176.bin').toString().split('file://').pop() ?? '',
);

export async function detect(text: string) {
	const predictions = await fastText.predict(text);
	const [[label, prob]] = predictions;
	return { label, prob };
}
