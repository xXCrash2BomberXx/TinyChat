const { Client } = require('./TinyChat.js');
const { JSDOM } = require('jsdom');
const localCrypto = new (require("@peculiar/webcrypto").Crypto)();
const { readFileSync } = require('fs');

/**
 * Message event used in {@link MessageData.event}.
 * @readonly
 * - {@link Typing} - Indicates a user has started typing.
 * - {@link StopTyping} - Indicates a user has stopped typing without sending.
 * - {@link Edit} - Indicates a user has edited the message with ID {@link MessageData.id}.
 * - {@link Unsend} - Indicates a user has unsent the message with ID {@link MessageData.id}.
 * - {@link Delivered} - Indicates a message has been received.
 * - {@link GroupRSAKeyRequest} - Requests the RSA public key from the recipient.
 * - {@link GroupRSAKeyShare} - Indicates an RSA public key is being sent unencrypted.
 * - {@link RSAKeyShare} - Indicates an RSA public key is being sent unencrypted.
 * - {@link AESKeyShare} - Indicates an AES key is being sent encrypted with the previously sent RSA public key.
 * @enum {number}
 */
const enum MessageDataEvent {
	/**
	 * Indicates a user has started typing.
	 * @name MessageDataEvent.Typing
	 */
	Typing,
	/**
	 * Indicates a user has stopped typing without sending.
	 * @name MessageDataEvent.StopTyping
	 */
	StopTyping,
	/**
	 * Indicates a user has edited the message with ID {@link MessageData.id}.
	 * @name MessageDataEvent.Edit
	 */
	Edit,
	/**
	 * Indicates a user has unsent the message with ID {@link MessageData.id}.
	 * @name MessageDataEvent.Unsend
	 */
	Unsend,
	/**
	 * Indicates a message has been received.
	 * @name MessageDataEvent.Delivered
	 */
	Delivered,
	/**
	 * Indicates an RSA public key is being sent unencrypted.
	 * @name MessageDataEvent.RSAKeyShare
	 */
	RSAKeyShare,
	/**
	 * Indicates a Diffie-Hellman public key is being sent encrypted with the previously sent RSA Public key.
	 * @name MessageDataEvent.RSAKeyShare
	 */
	DHKeyShare,
	/**
	 * Indicates an AES key is being sent encrypted with the previously sent RSA public key.
	 * @name MessageDataEvent.AESKeyShare
	 */
	AESKeyShare,
	/**
	 * Indicates a file is being sent.
	 * @name MessageDataEvent.File
	 */
	File,
	/**
	 * Indicates the location being sent.
	 * @name MessageDataEvent.Location
	 */
	Location,
};

const generateClient: () => typeof Client = () => new Client(new JSDOM(readFileSync('./TinyChat.html')).window, localCrypto);

Promise.all(Object.entries({
	'createChatTest': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'basicMessageSend': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, messageBody),
			time: await client.encryptAES(UUID, messageTime),
			id: messageID,
			event: undefined,
			prev: undefined
		});
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Delivered,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="sent" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'basicMessageReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, messageBody),
			time: await client.encryptAES(UUID, messageTime),
			id: messageID,
			event: undefined,
			prev: undefined
		});
		await client.render(UUID, {
			from: client.id,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Delivered,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="received" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	/*
	'editMessageSend': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		let messageBody: string = 'test message';
		let messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, messageBody),
			time: await client.encryptAES(UUID, messageTime),
			id: messageID,
			event: undefined,
			prev: undefined
		});
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Delivered,
			prev: undefined
		});
		messageBody = 'test message 2';
		messageTime = new Date().toLocaleTimeString();
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, messageBody),
			time: await client.encryptAES(UUID, messageTime),
			id: messageID,
			event: MessageDataEvent.Edit,
			prev: undefined
		});
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Delivered,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="sent" id="${messageID}">${messageBody} <small><small><small><i>edited ${messageTime}</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	*/
	'unsendMessageSend': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, messageBody),
			time: await client.encryptAES(UUID, messageTime),
			id: messageID,
			event: undefined,
			prev: undefined
		});
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Delivered,
			prev: undefined
		});
		await client.render(UUID, {
			from: client.id,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Unsend,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	/*
	'replySentMessageSend': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, messageBody),
			time: await client.encryptAES(UUID, messageTime),
			id: messageID,
			event: undefined,
			prev: undefined
		});
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Delivered,
			prev: undefined
		});
		const messageBody2: string = 'test message 2';
		const messageTime2: string = new Date().toLocaleTimeString();
		const messageID2: string = client.randomUUID();
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, messageBody2),
			time: await client.encryptAES(UUID, messageTime2),
			id: messageID2,
			event: undefined,
			prev: await client.encryptAES(UUID, messageID)
		});
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID2,
			event: MessageDataEvent.Delivered,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="sent" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small><p class="sent" id="${messageID2}"><p class="sentReply" id="${messageID}"><small><small>${messageBody} <small><small><small><i>${messageTime}</i></small></small></small>   <small><small><small><i>✓</i></small></small></small></small></small></p>${messageBody2} <small><small><small><i>${messageTime2}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	*/
}).map(async ([key, value]: [string, () => Promise<boolean>]): Promise<void> => {
	if (!await value()) {
		console.error(`Failed Test: ${key}`);
		process.exit(1);
	} else
		console.log(`Passed Test: ${key}`);
})).then(() => process.exit(0));
