// delete Peer.prototype.connect;
if (!Peer)
	//@ts-ignore: 2300
	var Peer = class {
		id: string = '';
		//@ts-ignore: 6133
		on(event: string, callback: (param?: any) => void) { }
	};
if (!Array.prototype.toSorted)
	Array.prototype.toSorted = function (compareFn?: ((a: any, b: any) => number) | undefined): Array<any> { return [...this].sort(compareFn); };

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

class Client {
	#eventID: string | HTMLInputElement | undefined = undefined;
	/**
	 * Message ID of the message being edited.
	 * @type {string?}
	 */
	#editing: string | undefined = undefined;

	/**
	 * Message ID of the message being replied to.
	 * @type {string?}
	 */
	#replying: string | undefined = undefined;

	/**
	 * Message ID of the message being reacted to.
	 * @type {string?}
	 */
	#reacting: string | undefined = undefined;

	/**
	 * RSA public and private key pair.
	 * @type {Promise<CryptoKeyPair>}
	 */
	#keyPair: Promise<CryptoKeyPair>;

	/**
	 * AES keys for the active conversations.
	 * @type { { [string]: [Uint8Array, CryptoKey] } }
	 */
	#aesKeys: { [id: string]: [Uint8Array, CryptoKey] } = {};

	/**
	 * Diffie-Hellman keys for the active conversations.
	 * @type { { [string]: CryptoKeyPair } }
	 */
	#dhKeys: { [id: string]: { [id: string]: CryptoKeyPair } } = {};

	/**
	 * User connection to the server
	 * @type {Peer}
	 * @readonly
	 */
	#peer: Peer;

	/**
	 * Window container to modify the DOM of
	 * @type {Window}
	 * @readonly
	 */
	#window: Window;

	/**
	 * Crypto library to use for encryption/decryption
	 * @type {Crypto}
	 * @readonly
	 */
	#crypto: Crypto;

	constructor(w: Window, crypto?: Crypto) {
		this.#window = w;
		this.#crypto = crypto ? crypto : w.crypto;
		this.#keyPair = this.#generateRSA();
		this.#peer = new Peer('connect' in Peer.prototype ? this.#window.localStorage.getItem('tinychat_id') || undefined : undefined);
		this.#peer.on('connection', (dataConnection: DataConnection): void => dataConnection.on('data', async (data: string): Promise<void> => {
			console.log(`RECEIVED: ${data}`);
			const messageData: MessageData = JSON.parse(data);
			if (messageData.from.split(',')[0] === dataConnection.peer)
				await this.#render(this.#peer.id, messageData);
		}));
		if (!('connect' in Peer.prototype))
			this.#peer.id = this.#randomUUID();

		/**
		 * Waits for the client to connect to the server and refreshes the client id.
		 */
		const check: () => void = (): void => {
			if (this.#peer.id) {
				(this.#window.document.getElementById('id') as HTMLSpanElement).innerHTML += `User ID: ${this.#peer.id}`;
				if ('connect' in Peer.prototype) {
					this.#window.localStorage.setItem('tinychat_id', this.#peer.id);
					for (const key of JSON.parse(this.#window.localStorage.getItem('tinychat_history') || '[]') as Array<string>)
						this.createChat(key, true);
				}
				return;
			}
			setTimeout(check, 50);
		};
		check();
	}

	/**
	 * Waits for an AES key to be established with the recipient.
	 * @param to  - The recipient ID to start a conversation with.
	 * @returns {Promise<void>} a `Promise<void>` that resolves when an AES key has been established.
	 */
	async #aesKeyEstablished(to: string): Promise<void> {
		return new Promise((resolve: (value: (void | Promise<void>)) => void): void => {
			const client: Client = this;
			function check() {
				if (client.#aesKeys[to])
					resolve();
				else
					setTimeout(check, 50);
			}
			check();
		});
	}

	/**
	 * Creates a new conversation with the provded `string` ID of a client.
	 * @param {string} to - The recipient ID to start a conversation with.
	 * @param {boolean} [establishKey = true] - Whether or not to establish a new AES key.
	 * @returns {Promise<HTMLSpanElement>} a `Promise<HTMLSpanElement>` that resolves to the newly created `HTMLSpanElement` for the conversation.
	 */
	async createChat(to: string, establishKey: boolean = true): Promise<HTMLSpanElement> {
		let split: Array<string> = to.split(',').map((x: string): string => x.trim());
		const aesAccess: string = split.toSorted().join(',');
		split[0] = this.#peer.id;

		const duplicateCheck: HTMLSpanElement | null = this.#getConversationByID(aesAccess);
		if (duplicateCheck) {
			(duplicateCheck.nextSibling as HTMLInputElement).focus();
			return duplicateCheck;
		}

		if ('connect' in Peer.prototype) {
			const history: Array<string> = JSON.parse(this.#window.localStorage.getItem('tinychat_history') || '[]') as Array<string>;
			if (!history.includes(to)) {
				history.push(to);
				this.#window.localStorage.setItem('tinychat_history', JSON.stringify(history));
			}
		}

		const collapsible: HTMLDetailsElement = this.#window.document.createElement('details');
		collapsible.open = true;
		this.#window.document.body.insertAdjacentElement('beforeend', collapsible);
		const summary: HTMLUnknownElement = this.#window.document.createElement('summary');
		summary.innerHTML = aesAccess;
		collapsible.insertAdjacentElement('afterbegin', summary);
		const chatButtons: HTMLDivElement = this.#window.document.createElement('div');
		chatButtons.className = 'chatButtonsContainer';

		const clearChatLocal: HTMLInputElement = this.#window.document.createElement('input');
		clearChatLocal.value = 'Clear Chat Locally';
		clearChatLocal.type = 'button';
		clearChatLocal.className = 'chatButtons';
		clearChatLocal.onclick = (ev: MouseEvent): void => {
			ev.preventDefault();
			clearChatLocal.parentElement?.nextSibling?.childNodes.forEach((value: ChildNode): void => { clearChatLocal.parentElement?.nextSibling?.removeChild(value); });
		};
		chatButtons.insertAdjacentElement('beforeend', clearChatLocal);

		const clearChatGlobal: HTMLInputElement = this.#window.document.createElement('input');
		clearChatGlobal.value = 'Clear Chat Globally';
		clearChatGlobal.type = 'button';
		clearChatGlobal.className = 'chatButtons';
		clearChatGlobal.onclick = (ev: MouseEvent): void => {
			ev.preventDefault();
			clearChatGlobal.parentElement?.nextSibling?.childNodes.forEach(async (value: ChildNode): Promise<void> => {
				if ((value as HTMLParagraphElement).className === 'sent') {
					const body: string = await this.#encryptAES(aesAccess, {
						body: '',
						time: '',
						id: (value as HTMLParagraphElement).id,
						event: EncryptedMessageDataEvent.Unsend,
					} satisfies EncryptedMessageData);
					split.forEach(async (_: string, i: number): Promise<void> => {
						const split2: Array<string> = aesAccess.split(',');
						const trueFrom2: string = split2[i];
						split2.splice(i, 1);
						split2.unshift(this.#peer.id);
						await this.#send(trueFrom2, {
							from: split2.join(','),
							body: body,
						}, i === 0);
					});
				}
			});
		};
		chatButtons.insertAdjacentElement('beforeend', clearChatGlobal);

		const generateNewAESKeyButton: HTMLInputElement = this.#window.document.createElement('input');
		generateNewAESKeyButton.value = 'Generate New AES Key';
		generateNewAESKeyButton.type = 'button';
		generateNewAESKeyButton.className = 'chatButtons';
		generateNewAESKeyButton.onclick = async (ev: MouseEvent): Promise<void> => {
			ev.preventDefault();
			if ('connect' in Peer.prototype) {
				sendBar.readOnly = true;
				for (const elem of chatButtons.children as unknown as Array<HTMLInputElement>)
					elem.disabled = true;
				sendButton.disabled = true;
				delete this.#aesKeys[aesAccess];
				const exported: string = await this.#exportRSAKey();
				split.forEach(async (_: string, i: number): Promise<void> => {
					const split2: Array<string> = aesAccess.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: exported,
						event: MessageDataEvent.RSAKeyShare,
					}, i === 0);
				});
				await this.#aesKeyEstablished(aesAccess);
				sendBar.readOnly = false;
				for (const elem of chatButtons.children as unknown as Array<HTMLInputElement>)
					elem.disabled = false;
				sendButton.disabled = false;
			} else
				this.#aesKeys[aesAccess] = await this.#generateAES();
		};
		chatButtons.insertAdjacentElement('beforeend', generateNewAESKeyButton);

		const uploadFile: HTMLInputElement = this.#window.document.createElement('input');
		uploadFile.value = 'Upload File';
		uploadFile.type = 'button';
		uploadFile.className = 'chatButtons';
		uploadFile.onclick = async (ev: MouseEvent): Promise<void> => {
			ev.preventDefault();
			this.#eventID = uploadFile;
			this.schedule(0);
		};
		uploadFile.oncontextmenu = (ev: MouseEvent): void => this.#openSending(ev);
		uploadFile.ontouchstart = (ev: TouchEvent): void => this.#openSending(ev);
		chatButtons.insertAdjacentElement('beforeend', uploadFile);

		const shareLocation: HTMLInputElement = this.#window.document.createElement('input');
		shareLocation.value = 'Share Location';
		shareLocation.type = 'button';
		shareLocation.className = 'chatButtons';
		shareLocation.onclick = async (ev: MouseEvent): Promise<void> => {
			ev.preventDefault();
			this.#eventID = shareLocation;
			this.schedule(0);
		};
		shareLocation.oncontextmenu = (ev: MouseEvent): void => this.#openSending(ev);
		shareLocation.ontouchstart = (ev: TouchEvent): void => this.#openSending(ev);
		chatButtons.insertAdjacentElement('beforeend', shareLocation);

		const sendTypingLabel: HTMLLabelElement = this.#window.document.createElement('label');
		sendTypingLabel.innerHTML = 'Send Typing Indicators';
		sendTypingLabel.onclick = (): void => { if (!sendTyping.disabled) sendTyping.checked = !sendTyping.checked; };
		chatButtons.insertAdjacentElement('beforeend', sendTypingLabel);
		const sendTyping: HTMLInputElement = this.#window.document.createElement('input');
		sendTyping.type = 'checkbox';
		sendTyping.className = 'chatButtons';
		chatButtons.insertAdjacentElement('beforeend', sendTyping);
		sendTyping.checked = true;

		collapsible.insertAdjacentElement('beforeend', chatButtons);
		const el: HTMLSpanElement = this.#window.document.createElement('span');
		el.className = 'message';
		el.id = aesAccess;
		collapsible.insertAdjacentElement('beforeend', el);

		const sendButtons: HTMLDivElement = this.#window.document.createElement('div');
		sendButtons.className = 'chatButtonsContainer';

		const sendBar: HTMLTextAreaElement = this.#window.document.createElement('textarea');
		sendBar.className = 'sendBar';
		sendBar.onkeydown = async (event: KeyboardEvent): Promise<void> => {
			if (sendBar.value.length === 0 && event.key.length === 1 && sendTyping.checked) {
				const body: string = await this.#encryptAES(aesAccess, {
					body: '',
					time: '',
					id: '',
					event: EncryptedMessageDataEvent.Typing,
				} satisfies EncryptedMessageData);
				split.forEach(async (_: string, i: number): Promise<void> => {
					const split2: Array<string> = aesAccess.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: body,
					}, i === 0);
				});
			} else if (sendBar.value.length === 1 && event.key === 'Backspace' && !this.#editing) {
				const body: string = await this.#encryptAES(aesAccess, {
					body: '',
					time: '',
					id: '',
					event: EncryptedMessageDataEvent.StopTyping,
				} satisfies EncryptedMessageData);
				split.forEach(async (_: string, i: number): Promise<void> => {
					const split2: Array<string> = aesAccess.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: body,
					}, i === 0);
				});
			} else if (sendBar.value.length && event.key === 'Enter' && event.shiftKey)
				sendButton.click();
			sendBar.style.height = '';
			sendBar.style.height = sendBar.scrollHeight + 'px';
		};
		sendButtons.insertAdjacentElement('beforeend', sendBar);

		const sendButton: HTMLInputElement = this.#window.document.createElement('input');
		sendButton.value = '>';
		sendButton.type = 'button';
		sendButton.className = 'sendButton';
		sendButton.onclick = async (ev: MouseEvent): Promise<void> => {
			ev.preventDefault();
			this.#eventID = aesAccess;
			this.schedule(0);
		};
		sendButton.oncontextmenu = (ev: MouseEvent): void => this.#openSending(ev);
		sendButton.ontouchstart = (ev: TouchEvent): void => this.#openSending(ev);
		sendButtons.insertAdjacentElement('beforeend', sendButton);

		collapsible.insertAdjacentElement('beforeend', sendButtons);

		if (establishKey)
			if ('connect' in Peer.prototype) {
				sendBar.readOnly = true;
				for (const elem of chatButtons.children as unknown as Array<HTMLInputElement>)
					elem.disabled = true;
				sendButton.disabled = true;
				delete this.#aesKeys[aesAccess];
				const exported: string = await this.#exportRSAKey();
				split.forEach(async (_: string, i: number): Promise<void> => {
					const split2: Array<string> = aesAccess.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: exported,
						event: MessageDataEvent.RSAKeyShare,
					}, i === 0);
				});
				await this.#aesKeyEstablished(aesAccess);
				sendBar.readOnly = false;
				for (const elem of chatButtons.children as unknown as Array<HTMLInputElement>)
					elem.disabled = false;
				sendButton.disabled = false;
			} else
				this.#aesKeys[aesAccess] = await this.#generateAES();

		sendBar.focus();
		return el;
	}

	/**
	 * Render a message on the UI.
	 * @param {string} to - The recipient ID associated with the message.
	 * @param {MessageData} messageData - Message to render.
	 */
	async #render(to: string, messageData: MessageData): Promise<void> {
		const split: Array<string> = messageData.from.split(',');
		const trueFrom: string = split[0];
		let aesAccess: string;
		if (to !== this.#peer.id) {
			split[0] = to;
			aesAccess = split.toSorted().join(',');
		} else {
			aesAccess = split.toSorted().join(',');
			split[0] = to;
		}
		let el: HTMLSpanElement | null = this.#getConversationByID(aesAccess);
		if (!el)
			el = await this.createChat(messageData.from, false);
		let iter: HTMLParagraphElement;
		const paragraph: HTMLParagraphElement = this.#window.document.createElement('p');
		let parsed: Array<string>;
		switch (messageData.event) {
			case MessageDataEvent.RSAKeyShare:
				if (to !== this.#peer.id)
					break;
				if (!this.#dhKeys[aesAccess])
					this.#dhKeys[aesAccess] = {};
				this.#dhKeys[aesAccess][trueFrom] = await this.#generateDH();
				await this.#send(trueFrom, {
					from: split.join(','),
					body: JSON.stringify([
						await this.#exportRSAKey(),
						await this.#encryptRSA(await this.#importRSAKey(messageData.body), await this.#exportDHKey(this.#dhKeys[aesAccess][trueFrom].publicKey)),
					]),
					event: MessageDataEvent.DHKeyShare,
				});
				break;
			case MessageDataEvent.DHKeyShare:
				if (to !== this.#peer.id)
					break;
				if (!this.#aesKeys[aesAccess])
					this.#aesKeys[aesAccess] = await this.#generateAES();
				if (!this.#dhKeys[aesAccess])
					this.#dhKeys[aesAccess] = {};
				this.#dhKeys[aesAccess][trueFrom] = await this.#generateDH();
				parsed = JSON.parse(messageData.body);
				const rsaPub: CryptoKey = await this.#importRSAKey(parsed[0]);
				await this.#exportAESKey([this.#aesKeys[aesAccess][0], await this.#xorAESKeys(await this.#deriveDH(this.#dhKeys[aesAccess][trueFrom].privateKey, await this.#importDHKey(await this.#decryptRSA(parsed[1]))), this.#aesKeys[aesAccess][1])]);
				await this.#send(trueFrom, {
					from: split.join(','),
					body: JSON.stringify([
						await this.#encryptRSA(rsaPub, await this.#exportDHKey(this.#dhKeys[aesAccess][trueFrom].publicKey)),
						await this.#encryptRSA(rsaPub, await this.#exportAESKey([this.#aesKeys[aesAccess][0], await this.#xorAESKeys(await this.#deriveDH(this.#dhKeys[aesAccess][trueFrom].privateKey, await this.#importDHKey(await this.#decryptRSA(parsed[1]))), this.#aesKeys[aesAccess][1])]))]),
					event: MessageDataEvent.AESKeyShare,
				});
				delete this.#dhKeys[aesAccess][trueFrom];
				if (!Object.keys(this.#dhKeys[aesAccess]).length)
					delete this.#dhKeys[aesAccess];
				break;
			case MessageDataEvent.AESKeyShare:
				if (to !== this.#peer.id)
					break;
				parsed = JSON.parse(messageData.body);
				this.#aesKeys[aesAccess] = await this.#importAESKey(await this.#decryptRSA(parsed[1]));
				this.#aesKeys[aesAccess][1] = await this.#xorAESKeys(await this.#deriveDH(this.#dhKeys[aesAccess][trueFrom].privateKey, await this.#importDHKey(await this.#decryptRSA(parsed[0]))), this.#aesKeys[aesAccess][1]);
				delete this.#dhKeys[aesAccess][trueFrom];
				if (!Object.keys(this.#dhKeys[aesAccess]).length)
					delete this.#dhKeys[aesAccess];
				break;
			default:
				const decryptedMessageData: EncryptedMessageData = await this.#decryptAES(aesAccess, messageData.body);
				switch (decryptedMessageData.event) {
					case EncryptedMessageDataEvent.Typing:
						if (to !== this.#peer.id)
							break;
						paragraph.innerHTML = ((split.length > 1) ? trueFrom + ' is ' : '') + 'Typing...';
						paragraph.className = 'typing';
						iter = el.lastChild as HTMLParagraphElement;
						while (iter && iter.className === 'typing')
							if (iter.innerHTML === paragraph.innerHTML)
								return;
							else
								iter = iter.previousSibling as HTMLParagraphElement;
						el.insertAdjacentElement('beforeend', paragraph);
						break;
					case EncryptedMessageDataEvent.StopTyping:
						if (to !== this.#peer.id)
							break;
						if (el.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
							iter = el.lastChild as HTMLParagraphElement;
							while (iter && iter.className === 'typing')
								if (iter.innerHTML === ((split.length > 1) ? trueFrom + ' is ' : '') + 'Typing...') {
									el.removeChild(iter);
									break;
								} else
									iter = iter.previousSibling as HTMLParagraphElement;
						}
						break;
					case EncryptedMessageDataEvent.Delivered:
						let i: number;
						for (i = el.children.length - 1; i >= 0; i--)
							if (el.children[i].id === decryptedMessageData.id && !el.children[i].innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>'))
								break;
						if (el.children[i])
							el.children[i].insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
						break;
					case EncryptedMessageDataEvent.Edit:
						iter = this.#getMessageByID(decryptedMessageData.id, aesAccess) as HTMLParagraphElement;
						if (((to === this.#peer.id) === (iter.className === 'sent')) ||
							((split.length > 1) ? (to === this.#peer.id && ((['receivedReply', 'sentReply'].includes((iter.firstChild as HTMLElement).className) ? iter.firstChild?.nextSibling : iter.firstChild) as HTMLElement).innerText !== trueFrom) : false))
							break;
						this.#window.document.querySelectorAll(`[id='${decryptedMessageData.id}']`).forEach(async (el: any): Promise<void> => {
							if ((el.firstChild as HTMLElement).tagName === el.tagName)
								while (el.firstChild.nextSibling)
									el.removeChild(el.firstChild.nextSibling);
							else
								while (el.firstChild)
									el.removeChild(el.firstChild);
							el.insertAdjacentHTML('beforeend', `${to === this.#peer.id && split.length > 1 ? `<small><small><small><u>${trueFrom}</u></small></small></small><br>` : ''
								}${decryptedMessageData.body} <small><small><small><i>${decryptedMessageData.time}</i></small></small></small>`);
						});

						if (to === this.#peer.id && el.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
							iter = el.lastChild as HTMLParagraphElement;
							while (iter && iter.className === 'typing')
								if (iter.innerHTML === ((split.length > 1) ? trueFrom + ' is ' : '') + 'Typing...') {
									el.removeChild(iter);
									break;
								} else
									iter = iter.previousSibling as HTMLParagraphElement;
						}

						if (to === this.#peer.id)
							await this.#send(trueFrom, {
								from: split.join(','),
								body: await this.#encryptAES(aesAccess, {
									body: '',
									time: '',
									id: decryptedMessageData.id,
									event: EncryptedMessageDataEvent.Delivered,
								} satisfies EncryptedMessageData),
							});
						break;
					case EncryptedMessageDataEvent.Unsend:
						Array.from(this.#window.document.querySelectorAll(`[id='${decryptedMessageData.id}']`)).forEach((iter: Element): void => {
							if (((to === this.#peer.id) === ['sent', 'sentReply'].includes(iter.className)) ||
								((split.length > 1) ? (to === this.#peer.id && ((['receivedReply', 'sentReply'].includes((iter.firstChild as HTMLElement).className) ? iter.firstChild?.nextSibling : iter.firstChild) as HTMLElement).innerText !== trueFrom) : false))
								return;
							while (iter.previousSibling && !(iter.previousSibling as HTMLElement).className)
								iter.parentElement?.removeChild(iter.previousSibling as ChildNode);
							iter.parentElement?.removeChild(iter as ChildNode);

							if (to === this.#peer.id && el?.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
								iter = el.lastChild as HTMLParagraphElement;
								while (iter && iter.className === 'typing')
									if (iter.innerHTML === ((split.length > 1) ? trueFrom + ' is ' : '') + 'Typing...') {
										el.removeChild(iter);
										break;
									} else
										iter = iter.previousSibling as HTMLParagraphElement;
							}
						});
						break;
					case EncryptedMessageDataEvent.File:
						const data: Array<any> = JSON.parse(decryptedMessageData.body);
						data[1] = data[1].split(',');
						const blob: Blob = new Blob([new Uint8Array(atob(data[1][1]).split('').map(char => char.charCodeAt(0)))], { type: 'application/octet-stream' });
						await new Promise((resolve: (value: (void | Promise<void>)) => void): void => {
							const image: HTMLImageElement = new Image();
							image.onload = (): void => {
								image.onclick = (ev: MouseEvent): void => ev.stopPropagation();
								image.oncontextmenu = (ev: MouseEvent): void => ev.stopPropagation();
								paragraph.insertAdjacentElement('beforeend', image);
								resolve();
							};
							image.onerror = (): void => {
								const downloadLink: HTMLAnchorElement = this.#window.document.createElement('a');
								downloadLink.href = URL.createObjectURL(blob);
								downloadLink.download = data[0];
								downloadLink.innerHTML = data[0];
								downloadLink.onclick = (ev: MouseEvent): void => ev.stopPropagation();
								paragraph.insertAdjacentElement('beforeend', downloadLink);
								resolve();
							}
							image.src = URL.createObjectURL(blob);
						});
						paragraph.className = to !== this.#peer.id ? 'sent' : 'received';
						paragraph.id = decryptedMessageData.id;
						paragraph.insertAdjacentHTML('beforeend', ` <small><small><small><i>${decryptedMessageData.time}</i></small></small></small>`);
						paragraph.ontouchstart = (ev: TouchEvent): void => this.openContext(paragraph, ev);
						paragraph.oncontextmenu = (ev: MouseEvent): void => this.openContext(paragraph, ev);
						if (decryptedMessageData.prev) {
							const prev: HTMLParagraphElement = this.#getMessageByID(decryptedMessageData.prev) as HTMLParagraphElement;
							const reply: HTMLParagraphElement = this.#window.document.createElement('p');
							reply.className = prev.className + 'Reply';
							reply.id = prev.id;
							reply.innerHTML = `<small><small>${prev.innerHTML}</small></small>`;
							const nextChild: HTMLElement | undefined = reply.firstChild?.firstChild as HTMLElement | undefined;
							if ((nextChild?.firstChild as HTMLElement).tagName === reply.tagName)
								nextChild?.removeChild(nextChild?.firstChild as HTMLElement);
							paragraph.insertAdjacentElement('afterbegin', reply);
						}
						if (el.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
							let iter: HTMLParagraphElement = el.lastChild as HTMLParagraphElement;
							while (iter.previousSibling && (iter.previousSibling as HTMLParagraphElement).className === 'typing')
								iter = iter.previousSibling as HTMLParagraphElement;
							el.insertBefore(paragraph, iter);
						} else
							el.insertAdjacentElement('beforeend', paragraph);
						if (to === this.#peer.id)
							await this.#send(trueFrom, {
								from: split.join(','),
								body: await this.#encryptAES(aesAccess, {
									body: '',
									time: '',
									id: decryptedMessageData.id,
									event: EncryptedMessageDataEvent.Delivered,
								} satisfies EncryptedMessageData),
							});
						break;
					case EncryptedMessageDataEvent.Location:
						paragraph.innerHTML = `${to === this.#peer.id && split.length > 1 ? `<small><small><small><u>${trueFrom}</u></small></small></small><br>` : ''}<a href="${decryptedMessageData.body
							}">Location</a> <small><small><small><i>${decryptedMessageData.time}</i></small></small></small>`;
						paragraph.className = to !== this.#peer.id ? 'sent' : 'received';
						paragraph.id = decryptedMessageData.id;
						(paragraph.querySelector('a') as HTMLAnchorElement).onclick = (ev: MouseEvent): void => {
							ev.preventDefault();
							ev.stopPropagation();
							this.#window.open(decryptedMessageData.body);
						};
						paragraph.ontouchstart = (ev: TouchEvent): void => this.openContext(paragraph, ev);
						paragraph.oncontextmenu = (ev: MouseEvent): void => this.openContext(paragraph, ev);
						if (decryptedMessageData.prev) {
							const prev: HTMLParagraphElement = this.#getMessageByID(decryptedMessageData.prev) as HTMLParagraphElement;
							const reply: HTMLParagraphElement = this.#window.document.createElement('p');
							reply.className = prev.className + 'Reply';
							reply.id = prev.id;
							reply.innerHTML = `<small><small>${prev.innerHTML}</small></small>`;
							const nextChild: HTMLElement | undefined = reply.firstChild?.firstChild as HTMLElement | undefined;
							if ((nextChild?.firstChild as HTMLElement).tagName === reply.tagName)
								nextChild?.removeChild(nextChild?.firstChild as HTMLElement);
							paragraph.insertAdjacentElement('afterbegin', reply);
						}
						if (el.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
							let iter: HTMLParagraphElement = el.lastChild as HTMLParagraphElement;
							while (iter.previousSibling && (iter.previousSibling as HTMLParagraphElement).className === 'typing')
								iter = iter.previousSibling as HTMLParagraphElement;
							el.insertBefore(paragraph, iter);
						} else
							el.insertAdjacentElement('beforeend', paragraph);

						if (to === this.#peer.id)
							await this.#send(trueFrom, {
								from: split.join(','),
								body: await this.#encryptAES(aesAccess, {
									body: '',
									time: '',
									id: decryptedMessageData.id,
									event: EncryptedMessageDataEvent.Delivered,
								} satisfies EncryptedMessageData),
							});
						break;
					default:
						paragraph.innerHTML = `${to === this.#peer.id && split.length > 1 ? `<small><small><small><u>${trueFrom}</u></small></small></small><br>` : ''}${decryptedMessageData.body
							} <small><small><small><i>${decryptedMessageData.time}</i></small></small></small>`;
						paragraph.className = to !== this.#peer.id ? 'sent' : 'received';
						if (to === this.#peer.id && el.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
							iter = el.lastChild as HTMLParagraphElement;
							while (iter && iter.className === 'typing')
								if (iter.innerHTML === ((split.length > 1) ? trueFrom + ' is ' : '') + 'Typing...') {
									el.removeChild(iter);
									break;
								} else
									iter = iter.previousSibling as HTMLParagraphElement;
						}
						paragraph.id = decryptedMessageData.id;
						paragraph.ontouchstart = (ev: TouchEvent): void => this.openContext(paragraph, ev);
						paragraph.oncontextmenu = (ev: MouseEvent): void => this.openContext(paragraph, ev);
						if (decryptedMessageData.prev) {
							const prev: HTMLParagraphElement = this.#getMessageByID(decryptedMessageData.prev) as HTMLParagraphElement;
							const reply: HTMLParagraphElement = this.#window.document.createElement('p');
							reply.className = prev.className + 'Reply';
							reply.id = prev.id;
							reply.innerHTML = `<small><small>${prev.innerHTML}</small></small>`;
							const nextChild: HTMLElement | undefined = reply.firstChild?.firstChild as HTMLElement | undefined;
							if ((nextChild?.firstChild as HTMLElement).tagName === reply.tagName)
								nextChild?.removeChild(nextChild?.firstChild as HTMLElement);
							paragraph.insertAdjacentElement('afterbegin', reply);
						}
						if (el.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
							let iter: HTMLParagraphElement = el.lastChild as HTMLParagraphElement;
							while (iter.previousSibling && (iter.previousSibling as HTMLParagraphElement).className === 'typing')
								iter = iter.previousSibling as HTMLParagraphElement;
							el.insertBefore(paragraph, iter);
						} else
							el.insertAdjacentElement('beforeend', paragraph);

						if (to === this.#peer.id)
							await this.#send(trueFrom, {
								from: split.join(','),
								body: await this.#encryptAES(aesAccess, {
									body: '',
									time: '',
									id: decryptedMessageData.id,
									event: EncryptedMessageDataEvent.Delivered,
								} satisfies EncryptedMessageData),
							});
						break;
				}
		}
	}

	/**
	 * Send a new message to the provided `string` ID of a client.
	 * @param {string} to - The recipient ID to send the message to.
	 * @param {MessageData} messageData - {@link MessageData} object to send to the recipient.
	 * @param {boolean} [isFirst = true] - If a message needs to be added to the UI after sending.
	 */
	async #send(to: string, messageData: MessageData, isFirst: boolean = true): Promise<void> {
		return new Promise((resolve: (value: (void | Promise<void>)) => void): void => {
			if ('connect' in Peer.prototype) {
				const conn: DataConnection = this.#peer.connect(to);
				conn.on('open', async (): Promise<void> => {
					const data: string = JSON.stringify(messageData);
					if (isFirst)
						await this.#render(to, messageData);
					conn.send(data);
					console.log(`SENT: ${data}`);
					resolve();
				});
			} else
				this.#render(to, messageData).then((): void => resolve());
		});
	}

	/**
	 * Send a new reaction.
	 * @param {string} reaction - The reaction to send to the client.
	 */
	async react(reaction: string): Promise<void> {
		const aesAccess: string = (this.#getMessageByID(this.#reacting as string)?.parentElement?.parentElement?.firstChild as HTMLElement).innerHTML;
		const split: Array<string> = aesAccess.split(',');
		const body: string = await this.#encryptAES(aesAccess, {
			body: reaction,
			time: (this.#editing ? 'edited at ' : '') + new Date().toLocaleTimeString(),
			id: this.#randomUUID(aesAccess),
			prev: this.#reacting,
		} satisfies EncryptedMessageData);
		split.forEach(async (_: string, i: number): Promise<void> => {
			const split2: Array<string> = aesAccess.split(',');
			const trueFrom2: string = split2[i];
			split2.splice(i, 1);
			split2.unshift(this.#peer.id);
			await this.#send(trueFrom2, {
				from: split2.join(','),
				body: body,
			}, i === 0);
		});
		this.#reacting = undefined;
	}

	/**
	 * Opens the message scheduling context menu.
	 * @param {MouseEvent | TouchEvent} ev - The click event that opened the menu.
	 */
	#openSending(ev: MouseEvent | TouchEvent): void {
		ev.preventDefault();
		(this.#window.document.getElementById('receivedMenu') as HTMLDivElement).style.display = 'none';
		(this.#window.document.getElementById('sentMenu') as HTMLDivElement).style.display = 'none';
		(this.#window.document.getElementById('reactionMenu') as HTMLDivElement).style.display = 'none';

		this.#eventID = ev.target as HTMLInputElement;
		const menu: HTMLDivElement = this.#window.document.getElementById('scheduleMenu') as HTMLDivElement;
		menu.style.display = 'block';
		if (ev instanceof MouseEvent) {
			menu.style.left = ev.pageX + 'px';
			menu.style.top = ev.pageY + 'px';
		} else {
			menu.style.left = ev.targetTouches[ev.targetTouches.length - 1].pageX + 'px';
			menu.style.top = ev.targetTouches[ev.targetTouches.length - 1].pageY + 'px';
		}
	}

	/**
	 * Schedules the message that is being typed.
	 * @param {number | undefined} [seconds = undefined] - Number of seconds to wait before sending (Will prompt if not provided).
	 */
	async schedule(seconds: number | undefined = undefined): Promise<void> {
		return new Promise(async (resolve: (value: (void | Promise<void>)) => void): Promise<void> => {
			if (!this.#eventID)
				resolve();
			if (seconds === undefined) {
				let input: string | null;
				do {
					input = this.#window.prompt('Duration (seconds)');
					if (!input)
						return;
					try {
						seconds = parseInt(input);
					} catch (e) { }
				} while (!seconds);
			}
			if (typeof this.#eventID === 'string' || (typeof this.#eventID === 'object' && this.#eventID.className === 'sendButton')) {
				const sendBar: HTMLInputElement = (typeof this.#eventID === 'object' ? this.#eventID.previousSibling : this.#getConversationByID(this.#eventID)?.nextSibling?.firstChild) as HTMLInputElement;
				const sendButton: HTMLInputElement = sendBar.nextSibling as HTMLInputElement;
				const collapsible: HTMLDetailsElement = sendBar.parentElement?.parentElement as HTMLDetailsElement;
				const aesAccess: string = (collapsible?.firstChild as HTMLElement).innerHTML;
				const split: Array<string> = aesAccess.split(',');
				const chatButtons: HTMLDivElement = collapsible.firstChild?.nextSibling as HTMLDivElement;
				if ((sendBar.value || this.#editing) && !sendBar.readOnly) {
					sendBar.readOnly = true;
					for (const elem of chatButtons.children as unknown as Array<HTMLInputElement>)
						elem.disabled = true;
					sendButton.disabled = true;
					if (this.#replying) {
						const prev: HTMLSpanElement = this.#getMessageByID(this.#replying, aesAccess) as HTMLSpanElement;
						if (prev.parentElement?.parentElement === collapsible) {
							if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>⏎<\/i>(<\/small>){3}$/g)) {
								prev.removeChild(prev.lastChild);
								prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
							}
						} else {
							if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>⏎<\/i>(<\/small>){3}$/g)) {
								prev.removeChild(prev.lastChild);
								prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
							}
							this.#replying = undefined;
						}
					}
					if (this.#editing) {
						const prev: HTMLSpanElement = this.#getMessageByID(this.#editing, aesAccess) as HTMLSpanElement;
						if (prev.parentElement?.parentElement !== collapsible) {
							if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✎<\/i>(<\/small>){3}$/g)) {
								prev.removeChild(prev.lastChild);
								prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
								(prev.parentNode?.nextSibling?.firstChild as HTMLInputElement).value = '';
							}
							this.#editing = undefined;
						}
					}
					const body: string | undefined = sendBar.value.replaceAll('\n', '</br>');
					const event: EncryptedMessageDataEvent | undefined = this.#editing ? EncryptedMessageDataEvent.Edit : undefined;
					sendBar.value = '';
					sendBar.readOnly = false;
					sendButton.disabled = false;
					const prev: string | undefined = this.#replying;
					this.#replying = undefined;
					const messageID: string = this.#editing || this.#randomUUID(aesAccess);
					this.#editing = undefined;
					for (const elem of chatButtons.children as unknown as Array<HTMLInputElement>)
						elem.disabled = false;
					const encryptedBody: string = await this.#encryptAES(aesAccess, {
						body: '',
						time: '',
						id: '',
						event: EncryptedMessageDataEvent.StopTyping,
					} satisfies EncryptedMessageData);
					split.forEach(async (_: string, i: number): Promise<void> => {
						const split2: Array<string> = aesAccess.split(',');
						const trueFrom2: string = split2[i];
						split2.splice(i, 1);
						split2.unshift(this.#peer.id);
						await this.#send(trueFrom2, {
							from: split2.join(','),
							body: encryptedBody,
						}, i === 0);
					});
					this.#window.setTimeout(async (): Promise<void> => {
						const encryptedBody: string = await this.#encryptAES(aesAccess, {
							body: body,
							time: (event === EncryptedMessageDataEvent.Edit ? 'edited at ' : '') + new Date().toLocaleTimeString(),
							id: messageID,
							event: event,
							prev: prev,
						} satisfies EncryptedMessageData);
						split.forEach(async (_: string, i: number): Promise<void> => {
							const split2: Array<string> = aesAccess.split(',');
							const trueFrom2: string = split2[i];
							split2.splice(i, 1);
							split2.unshift(this.#peer.id);
							await this.#send(trueFrom2, {
								from: split2.join(','),
								body: encryptedBody,
							}, i === 0);
						});
						resolve();
					}, seconds * 1000);
				}
			} else if (typeof this.#eventID === 'object') {
				const aesAccess: string = (this.#eventID?.parentElement?.parentElement?.firstChild as HTMLElement).innerHTML;
				const split: Array<string> = aesAccess.split(',');
				if (this.#replying) {
					const prev: HTMLSpanElement = this.#getMessageByID(this.#replying, aesAccess) as HTMLSpanElement;
					if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>⏎<\/i>(<\/small>){3}$/g)) {
						prev.removeChild(prev.lastChild);
						prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
					}
				}
				const prev: string | undefined = this.#replying;
				this.#replying = undefined;
				switch (this.#eventID.value) {
					case 'Upload File':
						const input = this.#window.document.createElement('input');
						input.type = 'file';
						input.onchange = (): void => {
							if (input.files) {
								const reader: FileReader = new FileReader();
								reader.readAsDataURL(input.files[0]);
								reader.onload = async (): Promise<void> => {
									const message: string = JSON.stringify([input.value.replace(/.*[\/\\]/, ''), reader.result as string]);
									this.#window.setTimeout(async (): Promise<void> => {
										const body: string = await this.#encryptAES(aesAccess, {
											body: message,
											time: new Date().toLocaleTimeString(),
											id: this.#randomUUID(aesAccess),
											event: EncryptedMessageDataEvent.File,
											prev: prev,
										} satisfies EncryptedMessageData);
										split.forEach(async (_: string, i: number): Promise<void> => {
											const split2: Array<string> = aesAccess.split(',');
											const trueFrom2: string = split2[i];
											split2.splice(i, 1);
											split2.unshift(this.#peer.id);
											await this.#send(trueFrom2, {
												from: split2.join(','),
												body: body,
											}, i === 0);
										});
										resolve();
									}, seconds as number * 1000);
								};
							}
						};
						input.click();
						break;
					case 'Share Location':
						navigator.geolocation.getCurrentPosition(async (position: GeolocationPosition): Promise<void> => {
							this.#window.setTimeout(async (): Promise<void> => {
								const body: string = await this.#encryptAES(aesAccess, {
									body: `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`,
									time: new Date().toLocaleTimeString(),
									id: this.#randomUUID(aesAccess),
									event: EncryptedMessageDataEvent.Location,
									prev: prev,
								} satisfies EncryptedMessageData);
								split.forEach(async (_: string, i: number): Promise<void> => {
									const split2: Array<string> = aesAccess.split(',');
									const trueFrom2: string = split2[i];
									split2.splice(i, 1);
									split2.unshift(this.#peer.id);
									await this.#send(trueFrom2, {
										from: split2.join(','),
										body: body,
									}, i === 0);
								});
								resolve();
							}, seconds as number * 1000);
							this.#replying = undefined;
						}, function (error) {
							console.error("Error getting current position:", error);
							resolve();
						});
						break;
					default:
						break;
				}
			}
		});
	}

	/**
	 * Opens the message action context menu.
	 * @param {HTMLParagraphElement} paragraph - The paragraph element being clicked on.
	 * @param {MouseEvent | TouchEvent} ev - The click event that opened the menu.
	 */
	openContext(paragraph: HTMLParagraphElement, ev: MouseEvent | TouchEvent): void {
		ev.preventDefault();
		(this.#window.document.getElementById('scheduleMenu') as HTMLDivElement).style.display = 'none';
		(this.#window.document.getElementById('receivedMenu') as HTMLDivElement).style.display = 'none';
		(this.#window.document.getElementById('sentMenu') as HTMLDivElement).style.display = 'none';
		(this.#window.document.getElementById('reactionMenu') as HTMLDivElement).style.display = 'none';

		const opt: string = paragraph.className + 'Menu';
		this.#eventID = paragraph.id;
		const menu: HTMLDivElement = this.#window.document.getElementById(opt) as HTMLDivElement;
		menu.style.display = 'block';
		if (ev instanceof MouseEvent) {
			menu.style.left = ev.pageX + 'px';
			menu.style.top = ev.pageY + 'px';
		} else {
			menu.style.left = ev.targetTouches[ev.targetTouches.length - 1].pageX + 'px';
			menu.style.top = ev.targetTouches[ev.targetTouches.length - 1].pageY + 'px';
		}
	}

	/**
	 * Opens the reaction context menu.
	 */
	openReacting(): void {
		if (!this.#eventID)
			return;
		this.#reacting = this.#eventID as string;
		const prevMenu: HTMLDivElement = this.#window.document.getElementById(this.#getMessageByID(this.#eventID as string)?.className + 'Menu') as HTMLDivElement;
		const menu: HTMLDivElement = this.#window.document.getElementById('reactionMenu') as HTMLDivElement;
		menu.style.display = 'block';
		menu.style.left = prevMenu.style.left;
		menu.style.top = prevMenu.style.top;
		prevMenu.style.display = 'none';
	}

	/**
	 * Marks a message for replying.
	 */
	markReply(): void {
		if (!this.#eventID)
			return;
		const paragraph: HTMLParagraphElement = this.#getMessageByID(this.#eventID as string) as HTMLParagraphElement;
		if (this.#editing) {
			const prev: HTMLSpanElement = this.#getMessageByID(this.#editing) as HTMLSpanElement;
			if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✎<\/i>(<\/small>){3}$/g)) {
				prev.removeChild(prev.lastChild);
				prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
				(prev.parentNode?.nextSibling?.firstChild as HTMLInputElement).value = '';
			}
			this.#editing = undefined;
		} else if (this.#replying) {
			const prev: HTMLSpanElement = this.#getMessageByID(this.#replying) as HTMLSpanElement;
			if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>⏎<\/i>(<\/small>){3}$/g)) {
				prev.removeChild(prev.lastChild);
				prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
			}
		}
		if (this.#replying !== paragraph.id) {
			this.#replying = paragraph.id;
			if (paragraph.lastChild && (paragraph.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✓<\/i>(<\/small>){3}$/g)) {
				paragraph.removeChild(paragraph.lastChild);
				paragraph.insertAdjacentHTML('beforeend', ' <small><small><small><i>⏎</i></small></small></small>');
			} else
				throw new Error('Cannot Reply to Non-Delivered Message.');
		} else
			this.#replying = undefined;
		(paragraph.parentNode?.nextSibling?.firstChild as HTMLInputElement).focus();
	}

	/**
	 * Marks a message for editing.
	 */
	async markEdit(): Promise<void> {
		if (!this.#eventID)
			return;
		const paragraph: HTMLParagraphElement = this.#getMessageByID(this.#eventID as string) as HTMLParagraphElement;
		if (paragraph.className !== 'sent')
			return;
		const aesAccess: string = (paragraph.parentElement?.parentElement?.firstChild as HTMLElement).innerHTML;
		if (this.#replying) {
			const prev: HTMLSpanElement = this.#getMessageByID(this.#replying) as HTMLSpanElement;
			if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>⏎<\/i>(<\/small>){3}$/g)) {
				prev.removeChild(prev.lastChild);
				prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
			}
			this.#replying = undefined;
		} else if (this.#editing) {
			const prev: HTMLSpanElement = this.#getMessageByID(this.#editing) as HTMLSpanElement;
			if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✎<\/i>(<\/small>){3}$/g)) {
				prev.removeChild(prev.lastChild);
				prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
				(prev.parentNode?.nextSibling?.firstChild as HTMLInputElement).value = '';
			}
		}
		if (this.#editing !== this.#eventID) {
			this.#editing = paragraph.id;
			if (paragraph.lastChild && (paragraph.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✓<\/i>(<\/small>){3}$/g)) {
				(paragraph.parentNode?.nextSibling?.firstChild as HTMLInputElement).value = Array.from(paragraph.childNodes).slice((paragraph.firstChild as HTMLElement).tagName === paragraph.tagName ? 1 : 0, -3).map((value: ChildNode): string => (value as HTMLElement).tagName === 'BR' ? '\n' : (value as Text).data).join('').slice(0, -1);
				paragraph.removeChild(paragraph.lastChild);
				paragraph.insertAdjacentHTML('beforeend', ' <small><small><small><i>✎</i></small></small></small>');
			} else
				throw new Error('Cannot Edit Non-Delivered Message.');

			const body: string = await this.#encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.Typing,
			} satisfies EncryptedMessageData);
			(paragraph.parentElement?.parentElement?.firstChild as Element).innerHTML.split(',').forEach(async (_: string, i: number): Promise<void> => {
				const split2: Array<string> = (paragraph.parentElement?.parentElement?.firstChild as Element).innerHTML.split(',');
				const trueFrom2: string = split2[i];
				split2.splice(i, 1);
				split2.unshift(this.#peer.id);
				await this.#send(trueFrom2, {
					from: split2.join(','),
					body: body,
				}, i === 0);
			});
		} else {
			this.#editing = undefined;
			const body: string = await this.#encryptAES(aesAccess, {
				body: '',
				time: '',
				id: '',
				event: EncryptedMessageDataEvent.StopTyping,
			} satisfies EncryptedMessageData);
			(paragraph.parentElement?.parentElement?.firstChild as Element).innerHTML.split(',').forEach(async (_: string, i: number): Promise<void> => {
				const split2: Array<string> = (paragraph.parentElement?.parentElement?.firstChild as Element).innerHTML.split(',');
				const trueFrom2: string = split2[i];
				split2.splice(i, 1);
				split2.unshift(this.#peer.id);
				await this.#send(trueFrom2, {
					from: split2.join(','),
					body: body,
				}, i === 0);
			});
		}

		(paragraph.parentNode?.nextSibling?.firstChild as HTMLInputElement).focus();
	}

	/**
	 * Unsends the message that has been marked for unsending.
	 */
	async unsend(): Promise<void> {
		if (!this.#eventID)
			return;
		const paragraph: HTMLParagraphElement = this.#getMessageByID(this.#eventID as string) as HTMLParagraphElement;
		if (paragraph.className !== 'sent')
			return;
		const aesAccess: string = (paragraph.parentElement?.parentElement?.firstChild as HTMLElement).innerHTML;
		const body: string = await this.#encryptAES(aesAccess, {
			body: '',
			time: '',
			id: this.#eventID as string,
			event: EncryptedMessageDataEvent.Unsend,
		} satisfies EncryptedMessageData);
		aesAccess.split(',').forEach(async (_: string, i: number): Promise<void> => {
			const split2: Array<string> = aesAccess.split(',');
			const trueFrom2: string = split2[i];
			split2.splice(i, 1);
			split2.unshift(this.#peer.id);
			await this.#send(trueFrom2, {
				from: split2.join(','),
				body: body,
			}, i === 0);
		});
	}

	/**
	 * Generate a random UUID not in use.
	 * @param {string?} conversationID - UUID `string` of the conversation to generate a UUID for.
	 * @returns {string} a `string` of the unused UUID.
	 */
	#randomUUID(conversationID: string | undefined = undefined): string {
		let UUID: string;
		do {
			UUID = this.#crypto.randomUUID();
		} while (conversationID ? this.#window.document.getElementById(conversationID)?.querySelector(`[id='${UUID}']`) : this.#window.document.getElementById(UUID));
		return UUID;
	}

	/**
	 * Generate a new Diffie-Hellman key.
	 * @returns {Promise<CryptoKeyPair>} a `Promise<CryptoKeyPair>` of the Diffie-Hellman Key.
	 */
	async #generateDH(): Promise<CryptoKeyPair> {
		return this.#crypto.subtle.generateKey(
			{ name: 'ECDH', namedCurve: 'P-256' },
			true,
			['deriveKey']
		);
	}

	/**
	 * Exports an RSA `CryptoKey` into a `Promise<string>` that resolves to a `string` representation.
	 * @param {CryptoKey} key - RSA `CryptoKey` to convert to a `string`.
	 * @returns {Promise<string>} `Promise<string>` that resolves to the `string` representation of an RSA `CryptoKey`.
	 */
	async #exportDHKey(key: CryptoKey): Promise<string> {
		return this.#window.btoa(String.fromCharCode.apply(null, new Uint8Array(await this.#crypto.subtle.exportKey('spki', key)) as unknown as Array<number>));
	}

	/**
	 * Imports an RSA `CryptoKey` into a `Promise<CryptoKey>` from a `string` that resolves to the RSA `CryptoKey`.
	 * @param {string} pem - `string` to convert to an RSA `CryptoKey`.
	 * @returns {Promise<CryptoKey>} `Promise<CryptoKey>` that resolves to the RSA `CryptoKey` from the `string` representation.
	 */
	async #importDHKey(pem: string): Promise<CryptoKey> {
		return this.#crypto.subtle.importKey(
			'spki',
			Uint8Array.from(this.#window.atob(pem), (c: string): number => c.charCodeAt(0)),
			{ name: 'ECDH', namedCurve: 'P-256' },
			true,
			[],
		);
	}

	/**
	 * Generate a new AES key from a Diffie-Hellman Key Share.
	 * @param {CryptoKey} localPrivateKey - Local Private Diffie-Hellman Key.
	 * @param {CryptoKey} remotePublicKey - Remote Public Diffie-Hellman Key.
	 * @returns {Promise<CryptoKeyPair>} a `Promise<CryptoKeyPair>` of the Diffie-Hellman Key.
	 */
	async #deriveDH(localPrivateKey: CryptoKey, remotePublicKey: CryptoKey): Promise<CryptoKey> {
		return this.#crypto.subtle.deriveKey(
			{ name: 'ECDH', public: remotePublicKey },
			localPrivateKey,
			{ name: 'AES-CBC', length: 256 },
			true,
			['encrypt', 'decrypt']
		);
	}

	/**
	 * XOR two AES Keys for a One-Time-Pad AES Key.
	 * @param {CryptoKey} key1 - AES Key
	 * @param {CryptoKey} key2 - AES Key
	 * @returns {Promise<CryptoKey>} a `Promise<CryptoKey>` of the One-Time-Pad AES Key.
	 */
	async #xorAESKeys(key1: CryptoKey, key2: CryptoKey): Promise<CryptoKey> {
		const key1Array: Uint8Array = new Uint8Array(await this.#crypto.subtle.exportKey("raw", key1));
		const key2Array: Uint8Array = new Uint8Array(await this.#crypto.subtle.exportKey("raw", key2));
		const resultArray: Uint8Array = new Uint8Array(key1Array.length);
		for (let i = 0; i < key1Array.length; i++)
			resultArray[i] = key1Array[i] ^ key2Array[i];
		return this.#crypto.subtle.importKey("raw", resultArray, { name: "AES-CBC", length: 256 }, true, ["encrypt", "decrypt"]);
	}

	/**
	 * Generate a new AES key.
	 * @returns {Promise<[Uint8Array, CryptoKey]>} a `Promise<[Uint8Array, CryptoKey]>` of the AES Key.
	 */
	async #generateAES(): Promise<[Uint8Array, CryptoKey]> {
		return [this.#crypto.getRandomValues(new Uint8Array(16)), await this.#crypto.subtle.generateKey(
			{ name: 'AES-CBC', length: 256 },
			true,
			['encrypt', 'decrypt'])];
	}

	/**
	 * Exports an AES `CryptoKey` into a `Promise<string>` that resolves to a `string` representation.
	 * @param {CryptoKey} key - AES `CryptoKey` to convert to a `string`.
	 * @returns {Promise<string>} `Promise<string>` that resolves to the `string` representation of an RSA `CryptoKey`.
	 */
	async #exportAESKey(key: [Uint8Array, CryptoKey]): Promise<string> {
		return JSON.stringify([
			Array.from(key[0]),
			this.#window.btoa(String.fromCharCode.apply(null, new Uint8Array(await this.#crypto.subtle.exportKey('raw', key[1])) as unknown as Array<number>))]);
	}

	/**
	 * Imports an AES `CryptoKey` into a `Promise<CryptoKey>` from a `string` that resolves to the AES `CryptoKey`.
	 * @param {string} pem - `string` to convert to an AES `CryptoKey`.
	 * @returns {Promise<CryptoKey>} `Promise<CryptoKey>` that resolves to the AES `CryptoKey` from the `string` representation.
	 */
	async #importAESKey(pem: string): Promise<[Uint8Array, CryptoKey]> {
		const parsed: [Array<number>, string] = JSON.parse(pem);
		return [new Uint8Array(parsed[0]), await this.#crypto.subtle.importKey(
			'raw',
			Uint8Array.from(this.#window.atob(parsed[1]), (c: string): number => c.charCodeAt(0)),
			{ name: 'AES-CBC', length: 256 },
			true,
			['encrypt', 'decrypt'])];
	}

	/**
	 * Encrypt a message with an AES key.
	 * @param {string} aesAccess - AES Key ID.
	 * @param {string} message - Message to Encrypt.
	 * @returns {string} a `string` of the Encrypted message.
	 */
	async #encryptAES(aesAccess: string, message: any): Promise<string> {
		return message ? this.#window.btoa(String.fromCharCode.apply(null,
			new Uint8Array(await this.#crypto.subtle.encrypt(
				{ name: 'AES-CBC', iv: this.#aesKeys[aesAccess][0] },
				this.#aesKeys[aesAccess][1],
				new TextEncoder().encode(JSON.stringify(message))
			)) as unknown as Array<number>)) : JSON.stringify(message);
	}

	/**
	 * Decrypt a message with an AES key.
	 * @param {string} aesAccess - AES Key ID.
	 * @param {string} message - Message to Decrypt.
	 * @returns {string} a `string` of the Decrypted message.
	 */
	async #decryptAES(aesAccess: string, message: string): Promise<EncryptedMessageData> {
		return message ? JSON.parse(new TextDecoder().decode(
			await this.#crypto.subtle.decrypt(
				{ name: 'AES-CBC', iv: this.#aesKeys[aesAccess][0] },
				this.#aesKeys[aesAccess][1],
				Uint8Array.from(this.#window.atob(message), (c: string): number => c.charCodeAt(0))
			)
		)) : JSON.parse(message);
	}

	/**
	 * Generate a new RSA key.
	 * @returns {Promise<CryptoKeyPair>} a `Promise<CryptoKeyPair>` of the RSA Key.
	 */
	async #generateRSA(): Promise<CryptoKeyPair> {
		return this.#crypto.subtle.generateKey(
			{
				name: 'RSA-OAEP',
				modulusLength: 4096,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: 'SHA-256',
			},
			true,
			['encrypt', 'decrypt']);
	}

	/**
	 * Exports an RSA `CryptoKey` into a `Promise<string>` that resolves to a `string` representation.
	 * @returns {Promise<string>} `Promise<string>` that resolves to the `string` representation of an RSA `CryptoKey`.
	 */
	async #exportRSAKey(): Promise<string> {
		return this.#window.btoa(String.fromCharCode.apply(null, new Uint8Array(await this.#crypto.subtle.exportKey('spki', (await this.#keyPair).publicKey)) as unknown as Array<number>));
	}

	/**
	 * Imports an RSA `CryptoKey` into a `Promise<CryptoKey>` from a `string` that resolves to the RSA `CryptoKey`.
	 * @param {string} pem - `string` to convert to an RSA `CryptoKey`.
	 * @returns {Promise<CryptoKey>} `Promise<CryptoKey>` that resolves to the RSA `CryptoKey` from the `string` representation.
	 */
	async #importRSAKey(pem: string): Promise<CryptoKey> {
		return this.#crypto.subtle.importKey(
			'spki',
			Uint8Array.from(this.#window.atob(pem), (c: string): number => c.charCodeAt(0)),
			{ name: 'RSA-OAEP', hash: 'SHA-256' },
			true,
			['encrypt'],
		);
	}

	/**
	 * Encrypt an AES Key with an RSA Public Key.
	 * @param {CryptoKey} publicKey - RSA Public Key to Encrypt with.
	 * @param {string} message - Message to Encrypt.
	 * @returns {string} a `string` of the Encrypted message.
	 */
	async #encryptRSA(publicKey: CryptoKey, message: string): Promise<string> {
		return message ? this.#window.btoa(
			String.fromCharCode.apply(null, 
				new Uint8Array(
					await this.#crypto.subtle.encrypt(
						{ name: "RSA-OAEP" },
						publicKey,
						new TextEncoder().encode(message)
					)
				) as unknown as Array<number>
			)
		) : message;
	}

	/**
	 * Decrypt a message with an RSA key.
	 * @param {string} message - Message to Decrypt.
	 * @returns {string} a `string` of the Decrypted message.
	 */
	async #decryptRSA(message: string): Promise<string> {
		return message ? new TextDecoder().decode(
			await crypto.subtle.decrypt(
				{ name: "RSA-OAEP" },
				(await this.#keyPair).privateKey,
				Uint8Array.from(atob(message), (c: string): number => c.charCodeAt(0))
			)
		) : message;
	}

	#getConversationByID(aesAccess: string): HTMLSpanElement | null {
		let el: HTMLSpanElement | null = null;
		this.#window.document.querySelectorAll(`[id='${aesAccess}']`).forEach((value: Element): void => {
			if (el === null && value.className === 'message')
				el = value as HTMLSpanElement;
		});
		return el;
	}

	#getMessageByID(id: string, aesAccess: string | undefined = undefined): HTMLParagraphElement | null {
		let el: HTMLSpanElement | null = null;
		if (aesAccess === undefined) {
			this.#window.document.querySelectorAll(`[id='${id}']`).forEach((value: Element): void => {
				if (el === null && ['sent', 'received'].includes(value.className))
					el = value as HTMLSpanElement;
			});
			return el;
		}
		this.#window.document.querySelectorAll(`[id='${aesAccess}']`).forEach((value: Element): void => {
			if (el === null && value.className === 'message')
				el = value as HTMLSpanElement;
		});
		return el ? (el as HTMLSpanElement).querySelector(`[id='${id}']`) : null;
	}

	get window(): Window {
		if ('connect' in Peer.prototype)
			throw new Error('Cannot get Window in secure context.');
		return this.#window;
	}

	get id(): string {
		if ('connect' in Peer.prototype)
			throw new Error('Cannot get Peer ID in secure context.');
		return this.#peer.id;
	}

	get render(): (to: string, messageData: MessageData) => Promise<void> {
		if ('connect' in Peer.prototype)
			throw new Error('Cannot get Render in secure context.');
		return this.#render;
	}

	get randomUUID(): () => string {
		if ('connect' in Peer.prototype)
			throw new Error('Cannot get Random UUID in secure context.');
		return this.#randomUUID;
	}

	get encryptAES(): (aesAccess: string, message: string) => Promise<string> {
		if ('connect' in Peer.prototype)
			throw new Error('Cannot get Encrypt AES in secure context.');
		return this.#encryptAES;
	}
}

try {
	//@ts-ignore: 2580
	module.exports = {
		Client
	};
} catch (e) { }
