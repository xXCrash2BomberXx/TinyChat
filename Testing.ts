//@ts-ignore: 6200
const { Client } = require('./TinyChat.js');
const { JSDOM } = require('jsdom');
const localCrypto = new (require("@peculiar/webcrypto").Crypto)();
const { readFileSync } = require('fs');

/**
 * Message event used in {@link MessageData.event}.
 * @readonly
 * - {@link GroupRSAKeyRequest} - Requests the RSA public key from the recipient.
 * - {@link GroupRSAKeyShare} - Indicates an RSA public key is being sent unencrypted.
 * - {@link RSAKeyShare} - Indicates an RSA public key is being sent unencrypted.
 * - {@link AESKeyShare} - Indicates an AES key is being sent encrypted with the previously sent RSA public key.
 * @enum {number}
 */
const enum MessageDataEvent {
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
};

/**
 * Message event used in {@link MessageData.event}.
 * @readonly
 * - {@link Typing} - Indicates a user has started typing.
 * - {@link StopTyping} - Indicates a user has stopped typing without sending.
 * - {@link Edit} - Indicates a user has edited the message with ID {@link MessageData.id}.
 * - {@link Unsend} - Indicates a user has unsent the message with ID {@link MessageData.id}.
 * - {@link Delivered} - Indicates a message has been received.
 * - {@link File} - Indicates a file is being sent.
 * - {@link Location} - Indicates a location link is being sent.
 * @enum {number}
 */
enum EncryptedMessageDataEvent {
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

/**
 * Message effect used in {@link MessageData.effect}.
 * @readonly
 * @enum {number}
 */
const enum MessageDataEffects { };

/**
 * A message to be sent to a peer.
 * @property {string} from - The sender of the current {@link MessageData} object.
 * @property {string} body - The message being sent.
 * @property {MessageDataEvent=} event - Special event for a message.
 * @interface
 */
interface MessageData {
	/**
	 * The sender of the current {@link MessageData} object.
	 * @type {string}
	 * @name MessageData.from
	 */
	from: string,
	/**
	 * The message being sent.
	 * @type {any}
	 * @name MessageData.body
	 */
	body: any,
	/**
	 * Special event for a message.
	 * @type {MessageDataEvent?}
	 * @name MessageData.event
	 */
	event?: MessageDataEvent | undefined,
};


/**
 * A message to be sent to a peer.
 * @property {string} body - The message being sent.
 * @property {string} time - The locale string representation of the time the message is being sent at.
 * @property {string} id - The message ID.
 * @property {EncryptedMessageDataEvent=} event - Special event for a message.
 * @property {string=} prev - Message being replied to.
 * @property {MessageDataEffects=} effect - Message effect being applied.
 * @interface
 */
interface EncryptedMessageData {
	/**
	 * The message being sent.
	 * @type {any}
	 * @name MessageData.body
	 */
	body: any,
	/**
	 * The locale string representation of the time the message is being sent at.
	 * @type {string}
	 * @name MessageData.time
	 */
	time: string,
	/**
	 * The message ID.
	 * @type {string}
	 * @name MessageData.id
	 */
	id: string,
	/**
	 * Special event for a message.
	 * @type {MessageDataEvent?}
	 * @name MessageData.event
	 */
	event?: EncryptedMessageDataEvent | undefined,
	/**
	 * Message being replied to.
	 * @type {string?}
	 * @name MessageData.prev
	 */
	prev?: string | undefined,
	/**
	 * Message effect being applied.
	 * @type {MessageDataEffects?}
	 * @name MessageData.effect
	 */
	effect?: MessageDataEffects | undefined,
}

const generateClient: () => typeof Client = (): typeof Client => new Client(new JSDOM(readFileSync('./TinyChat.html')).window, localCrypto);

Promise.all(Object.entries({
	'createChatTest': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'ownTypingIndicatorReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
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
			body: await client.encryptAES(UUID, {
				body: messageBody,
				time: messageTime,
				id: messageID,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: messageID,
				event: EncryptedMessageDataEvent.Delivered,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="sent" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'editReceivedMessageSend': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: messageBody,
				time: messageTime,
				id: messageID,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		const messageBody2: string = 'test message 2';
		const messageTime2: string = new Date().toLocaleTimeString();
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, {
				body: messageBody2,
				time: messageTime2,
				id: messageID,
				event: EncryptedMessageDataEvent.Edit,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="received" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'unsendMessageSend': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, {
				body: messageBody,
				time: messageTime,
				id: messageID,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: messageID,
				event: EncryptedMessageDataEvent.Delivered,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: messageID,
				event: EncryptedMessageDataEvent.Unsend,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'unsendReceivedMessageSend': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: messageBody,
				time: messageTime,
				id: messageID,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(UUID, {
			from: client.id,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: messageID,
				event: EncryptedMessageDataEvent.Unsend,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="received" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
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
			body: await client.encryptAES(UUID, {
				body: messageBody,
				time: messageTime,
				id: messageID,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="received" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'basicMessageTypingReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: messageBody,
				time: messageTime,
				id: messageID,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="received" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'typingIndicatorReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="typing">Typing...</p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'doubleTypingIndicatorReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="typing">Typing...</p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'stopTypingIndicatorReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.StopTyping,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'stopTypingIndicatorNoTypingReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.StopTyping,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	/*
	'editSentMessageReceived': async (): Promise<boolean> => {
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
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, messageBody2),
			time: await client.encryptAES(UUID, messageTime2),
			id: messageID,
			event: MessageDataEvent.Edit,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="sent" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'editSentMessageTypingReceived': async (): Promise<boolean> => {
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
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Typing,
			prev: undefined
		});
		const messageBody2: string = 'test message 2';
		const messageTime2: string = new Date().toLocaleTimeString();
		await client.render(client.id, {
			from: UUID,
			body: await client.encryptAES(UUID, messageBody2),
			time: await client.encryptAES(UUID, messageTime2),
			id: messageID,
			event: MessageDataEvent.Edit,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="sent" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p><p class="typing">Typing...</p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'unsendSentMessageReceived': async (): Promise<boolean> => {
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
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Unsend,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="sent" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'unsendSentMessageTypingReceived': async (): Promise<boolean> => {
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
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Typing,
			prev: undefined
		});
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Unsend,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"><p class="sent" id="${messageID}">${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p><p class="typing">Typing...</p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'unsendMessageReceived': async (): Promise<boolean> => {
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
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Unsend,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'unsendMessageTypingReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		await client.createChat(UUID);
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: '',
			event: MessageDataEvent.Typing,
			prev: undefined
		});
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
		await client.render(client.id, {
			from: UUID,
			body: '',
			time: '',
			id: messageID,
			event: MessageDataEvent.Unsend,
			prev: undefined
		});
		return client.window.document.getElementById(UUID).parentElement.outerHTML === `<details open=""><summary>${UUID}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${UUID}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	*/
	'createGroupChatTest': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		const UUID2: string = client.randomUUID();
		//@ts-ignore: 2339
		const aesAccess: string = [UUID, UUID2].toSorted().join(',');
		await client.createChat(`${UUID}, ${UUID2}`);
		return client.window.document.getElementById(aesAccess).parentElement.outerHTML === `<details open=""><summary>${aesAccess}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${aesAccess}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'basicGroupMessageReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		const UUID2: string = client.randomUUID();
		//@ts-ignore: 2339
		const aesAccess: string = [UUID, UUID2].toSorted().join(',');
		await client.createChat(`${UUID}, ${UUID2}`);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(client.id, {
			from: `${UUID},${UUID2}`,
			body: await client.encryptAES(aesAccess, {
				body: messageBody,
				time: messageTime,
				id: messageID,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		const messageBody2: string = 'test message 2';
		const messageTime2: string = new Date().toLocaleTimeString();
		const messageID2: string = client.randomUUID();
		await client.render(client.id, {
			from: `${UUID2},${UUID}`,
			body: await client.encryptAES(aesAccess, {
				body: messageBody2,
				time: messageTime2,
				id: messageID2,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(aesAccess).parentElement.outerHTML === `<details open=""><summary>${aesAccess}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${aesAccess}"><p class="received" id="${messageID}"><small><small><small><u>${UUID}</u></small></small></small><br>${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p><p class="received" id="${messageID2}"><small><small><small><u>${UUID2}</u></small></small></small><br>${messageBody2} <small><small><small><i>${messageTime2}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'basicGroupMessageTypingReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		const UUID2: string = client.randomUUID();
		//@ts-ignore: 2339
		const aesAccess: string = [UUID, UUID2].toSorted().join(',');
		await client.createChat(`${UUID}, ${UUID2}`);
		await client.render(client.id, {
			from: `${UUID},${UUID2}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		const messageBody: string = 'test message';
		const messageTime: string = new Date().toLocaleTimeString();
		const messageID: string = client.randomUUID();
		await client.render(client.id, {
			from: `${UUID},${UUID2}`,
			body: await client.encryptAES(aesAccess, {
				body: messageBody,
				time: messageTime,
				id: messageID,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: `${UUID2},${UUID}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		const messageBody2: string = 'test message 2';
		const messageTime2: string = new Date().toLocaleTimeString();
		const messageID2: string = client.randomUUID();
		await client.render(client.id, {
			from: `${UUID2},${UUID}`,
			body: await client.encryptAES(aesAccess, {
				body: messageBody2,
				time: messageTime2,
				id: messageID2,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(aesAccess).parentElement.outerHTML === `<details open=""><summary>${aesAccess}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${aesAccess}"><p class="received" id="${messageID}"><small><small><small><u>${UUID}</u></small></small></small><br>${messageBody} <small><small><small><i>${messageTime}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p><p class="received" id="${messageID2}"><small><small><small><u>${UUID2}</u></small></small></small><br>${messageBody2} <small><small><small><i>${messageTime2}</i></small></small></small> <small><small><small><i>✓</i></small></small></small></p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'typingGroupIndicatorReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		const UUID2: string = client.randomUUID();
		//@ts-ignore: 2339
		const aesAccess: string = [UUID, UUID2].toSorted().join(',');
		await client.createChat(`${UUID}, ${UUID2}`);
		await client.render(client.id, {
			from: `${UUID},${UUID2}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: `${UUID2},${UUID}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(aesAccess).parentElement.outerHTML === `<details open=""><summary>${aesAccess}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${aesAccess}"><p class="typing">${UUID} is Typing...</p><p class="typing">${UUID2} is Typing...</p></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'stopTypingGroupIndicatorReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		const UUID2: string = client.randomUUID();
		//@ts-ignore: 2339
		const aesAccess: string = [UUID, UUID2].toSorted().join(',');
		await client.createChat(`${UUID}, ${UUID2}`);
		await client.render(client.id, {
			from: `${UUID},${UUID2}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: `${UUID2},${UUID}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: `${UUID},${UUID2}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.StopTyping,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: `${UUID2},${UUID}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.StopTyping,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(aesAccess).parentElement.outerHTML === `<details open=""><summary>${aesAccess}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${aesAccess}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
	'stopTypingGroupIndicatorNoTypingReceived': async (): Promise<boolean> => {
		const client: typeof Client = generateClient();
		const UUID: string = client.randomUUID();
		const UUID2: string = client.randomUUID();
		//@ts-ignore: 2339
		const aesAccess: string = [UUID, UUID2].toSorted().join(',');
		await client.createChat(`${UUID}, ${UUID2}`);
		await client.render(client.id, {
			from: `${UUID},${UUID2}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.StopTyping,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		await client.render(client.id, {
			from: `${UUID2},${UUID}`,
			body: await client.encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.StopTyping,
			} satisfies EncryptedMessageData),
		} satisfies MessageData);
		return client.window.document.getElementById(aesAccess).parentElement.outerHTML === `<details open=""><summary>${aesAccess}</summary><div class="chatButtonsContainer"><input type="button" value="Clear Chat Locally" class="chatButtons"><input type="button" value="Clear Chat Globally" class="chatButtons"><input type="button" value="Generate New AES Key" class="chatButtons"><input type="button" value="Upload File" class="chatButtons"><input type="button" value="Share Location" class="chatButtons"><label>Send Typing Indicators</label><input type="checkbox" class="chatButtons"></div><span class="message" id="${aesAccess}"></span><div class="chatButtonsContainer"><textarea class="sendBar"></textarea><input type="button" value=">" class="sendButton"></div></details>`;
	},
}).map(async ([key, value]: [string, () => Promise<boolean>]): Promise<void> => {
	if (!await value()) {
		console.error(`Failed Test: ${key}`);
		process.exit(1);
	} else
		console.log(`Passed Test: ${key}`);
})).then(() => process.exit(0));
