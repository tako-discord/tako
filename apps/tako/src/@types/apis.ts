// Urban Dictionary
export type UrbanDictionaryResponse = {
	data: {
		contributor: string;
		date: string;
		example: string;
		meaning: string;
		word: string;
	}[];
	found?: boolean;
	message?: string;
	params?: {
		limit: string;
		matchCase: string;
		multiPage: string;
		page: string;
		scrapeType: string;
		strict: string;
	};
	statusCode: number;
	term: string;
	totalPages?: number;
};

// Lingva Translate
type DefinitionsGroup = {
	list: {
		definition: string;
		example: string;
		field?: string;
		synonyms: string[];
	}[];
	type: string;
};

type ExtraTranslationsGroup = {
	list: {
		article?: string;
		frequency: number;
		meanings: string[];
		word: string;
	}[];
	type: string;
};

type TranslationInfo = {
	definitions: DefinitionsGroup[];
	detectedSource?: string;
	examples: string[];
	extraTranslations: ExtraTranslationsGroup[];
	pronunciation: {
		query?: string;
		translation?: string;
	};
	similar: string[];
};

export type LingvaTranslateResponse = {
	info?: TranslationInfo;
	translation: string;
};

// DeepL
const CommonLanguageCodes = [
	'bg',
	'cs',
	'da',
	'de',
	'el',
	'es',
	'et',
	'fi',
	'fr',
	'hu',
	'id',
	'it',
	'ja',
	'ko',
	'lt',
	'lv',
	'nb',
	'nl',
	'pl',
	'ro',
	'ru',
	'sk',
	'sl',
	'sv',
	'tr',
	'uk',
	'zh',
] as const;

export const DeeplTargetLanguageCodes = [
	...CommonLanguageCodes,
	'en-GB',
	'en-US',
	'pt-BR',
	'pt-PT',
	'en',
	'pt',
] as const;

export type DeeplTargetLanguageCode = (typeof DeeplTargetLanguageCodes)[number];
