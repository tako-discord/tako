import type { ILogObj, ILogObjMeta } from 'tslog';
import { Logger } from 'tslog';
import config from '../../config.ts';

const file = Bun.file('./bot.log');
await Bun.write(file, '');
const writer = file.writer();

export const logger: Logger<ILogObj> = new Logger({
	minLevel: config.dev ? 2 : 3,
	type: 'hidden',
});

logger.attachTransport(async (logObj: ILogObj & ILogObjMeta) => {
	writer.ref();
	writer.write(
		`${logObj._meta.date.toUTCString()} | ${logObj._meta.logLevelName} | ${JSON.stringify(
			logObj[0],
		)}\n`,
	);
	await writer.flush();
	writer.unref();
});
