import pino from 'pino';
import config from '../../config';

// Flush the log file
const file = Bun.file('./app.log');
await Bun.write(file, '');

const transport = pino.transport({
	targets: [
		{
			target: 'pino-pretty',
			level: config.dev ? 'debug' : 'info',
			options: {
				destination: 'app.log',
				colorize: false,
				sync: true,
			},
		},
	],
});

export const logger = pino(transport);
