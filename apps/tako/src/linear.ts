import { LinearClient } from '@linear/sdk';

export const linear = new LinearClient({
	apiKey: Bun.env.LINEAR,
});

export default linear;
