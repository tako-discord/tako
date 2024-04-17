import emojiRegex from 'emoji-regex';

export function parseAutoReactEmojis(
	emojis: string,
	currentEmojis: string[] = [],
): string[] {
	const customEmojiRegex = /<(?<name>.+):(?<id>\d+)>/g;
	const unicodeEmojiRegex = emojiRegex();
	const result = [];

	if (currentEmojis) {
		result.push(...currentEmojis);
	}

	for (const match of emojis.matchAll(customEmojiRegex)) {
		if (match.groups?.id) {
			const emoji = `<${match.groups.name}:${match.groups.id}>`;
			if (currentEmojis.includes(emoji)) continue;
			result.push(`<${match.groups.name}:${match.groups.id}>`);
		}
	}

	for (const match of emojis.matchAll(unicodeEmojiRegex)) {
		const emoji = match[0];
		if (currentEmojis.includes(emoji)) continue;
		result.push(emoji);
	}

	return result;
}
