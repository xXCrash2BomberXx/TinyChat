const { Client } = require('./TinyChat.js');
const { JSDOM } = require('jsdom');
const localCrypto = new (require("@peculiar/webcrypto").Crypto)();

var polyfills: any = {
	fetch: import('node-fetch'),
	WebSocket: require('ws'),
	WebRTC: require('wrtc'),
	FileReader: require('filereader')
};

const generateClient: () => typeof Client = () => new Client(JSDOM.fromFile('./TinyChat.html').window, localCrypto, localCrypto.randomUUID(), polyfills);

for (const [key, value] of Object.entries({
	createChatTest: (): boolean => {
		const client: typeof Client = generateClient();
		return true;
	}
}))
	if (!value()) {
		console.error(`Failed Test: ${key}`);
		process.exit(1);
	}
process.exit(0);
