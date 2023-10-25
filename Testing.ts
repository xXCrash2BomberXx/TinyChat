const { Client } = require('./TinyChat.js');
const { JSDOM } = require('jsdom');
const localCrypto = new (require("@peculiar/webcrypto").Crypto)();
const { readFileSync } = require('fs');

const generateClient: () => typeof Client = () => new Client(new JSDOM(readFileSync('./TinyChat.html')).window, localCrypto);

Promise.all(Object.entries({
	'createChatTest': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = localCrypto.randomUUID();
		await client.createChat(UUID, false);
		return client.getDocument().getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"></div><span class="message" id="${UUID}"></span><input type="text" class="sendBar"></details>`;
	},
	'renderTest': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = localCrypto.randomUUID();
		await client.createChat(UUID, false);
		client.getAESKeys()[UUID] = [localCrypto.getRandomValues(new Uint8Array(16)), await localCrypto.subtle.generateKey(
			{
				name: 'AES-CBC',
				length: 256,
			},
			true,
			['encrypt', 'decrypt'],
		)];
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = localCrypto.randomUUID();
		await client.render(UUID, {
			from: client.getID(),
			body: JSON.stringify(Array.from(new Uint8Array(await localCrypto.subtle.encrypt(
				{ name: 'AES-CBC', iv: client.getAESKeys()[UUID][0] },
				client.getAESKeys()[UUID][1],
				new Uint8Array(new TextEncoder().encode(messageBody)),
			)))),
			time: JSON.stringify(Array.from(new Uint8Array(await localCrypto.subtle.encrypt(
				{ name: 'AES-CBC', iv: client.getAESKeys()[UUID][0] },
				client.getAESKeys()[UUID][1],
				new Uint8Array(new TextEncoder().encode(messageTime)),
			)))),
			id: messageID,
			event: undefined,
			prev: undefined
		});
		return true;
	}
}).map(async ([key, value]: [string, () => Promise<boolean>]): Promise<void> => {
	if (!await value()) {
		console.error(`Failed Test: ${key}`);
		process.exit(1);
	} else
		console.log(`Passed Test: ${key}`);
})).then(() => process.exit(0));
