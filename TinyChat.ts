if (!Peer)
	//@ts-ignore: 2300
	var Peer = class {
		id: string = '';
		on(event: string, callback: (param?: any) => void) { }
	};
if (!Array.prototype.toSorted)
	Array.prototype.toSorted = function (compareFn?: ((a: any, b: any) => number) | undefined): Array<any> { return [...this].sort(compareFn); };

/**
 * Message event used in {@link MessageData.event}.
 * @readonly
 * - {@link Typing} - Indicates a user has started typing.
 * - {@link StopTyping} - Indicates a user has stopped typing without sending.
 * - {@link Edit} - Indicates a user has edited the message with ID {@link MessageData.id}.
 * - {@link Unsend} - Indicates a user has unsent the message with ID {@link MessageData.id}.
 * - {@link Delivered} - Indicates a message has been recieved.
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
	 * Indicates a message has been recieved.
	 * @name MessageDataEvent.Delivered
	 */
	Delivered,
	/**
	 * Requests the RSA public key from the recipient.
	 * @name MessageDataEvent.GroupRSAKeyRequest
	 */
	GroupRSAKeyRequest,
	/**
	 * Sends the RSA public key in reply to a key request.
	 * @name MessageDataEvent.GroupRSAKeyShare
	 */
	GroupRSAKeyShare,
	/**
	 * Indicates an RSA public key is being sent unencrypted.
	 * @name MessageDataEvent.RSAKeyShare
	 */
	RSAKeyShare,
	/**
	 * Indicates an AES key is being sent encrypted with the previously sent RSA public key.
	 * @name MessageDataEvent.AESKeyShare
	 */
	AESKeyShare,
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
 * @property {string} time - The locale string representation of the time the message is being sent at.
 * @property {string} id - The message ID.
 * @property {MessageDataEvent=} event - Special event for a message.
 * @property {string=} prev - Message being replied to.
 * @property {MessageDataEffects=} effect - Message effect being applied.
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
	 * @type {string}
	 * @name MessageData.body
	 */
	body: string,
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
	event?: MessageDataEvent | undefined,
	/**
	 * Message being replied to.
	 * @type {string?}
	 * @name MessageData.prev
	 */
	prev?: string,
	/**
	 * Message effect being applied.
	 * @type {MessageDataEffects?}
	 * @name MessageData.effect
	 */
	effect?: MessageDataEffects,
};

class Client {
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
	 * Exports an RSA `CryptoKey` into a `Promise<string>` that resolves to a `string` representation.
	 * @param {CryptoKey} key - RSA `CryptoKey` to convert to a `string`.
	 * @returns {Promise<string>} `Promise<string>` that resolves to the `string` representation of an RSA `CryptoKey`.
	 */
	async #exportRSAKey(key: CryptoKey): Promise<string> {
		return this.#window.btoa(String.fromCharCode.apply(null, new Uint8Array(await this.#crypto.subtle.exportKey("spki", key)) as unknown as Array<number>));
	}

	/**
	 * Converts a `string` into an `ArrayBuffer`.
	 * @param {string} str - `string` to convert to an `ArrayBuffer`.
	 * @returns {ArrayBuffer} `ArrayBuffer` representation of the provded `string`.
	 */
	#str2ab(str: string): ArrayBuffer {
		const buf: ArrayBuffer = new ArrayBuffer(str.length);
		const bufView: Uint8Array = new Uint8Array(buf);
		for (let i: number = 0, strLen = str.length; i < strLen; i++)
			bufView[i] = str.charCodeAt(i);
		return buf;
	}

	/**
	 * Imports an RSA `CryptoKey` into a `Promise<CryptoKey>` from a `string` that resolves to the RSA `CryptoKey`.
	 * @param {string} pem - `string` to convert to an RSA `CryptoKey`.
	 * @returns {Promise<CryptoKey>} `Promise<CryptoKey>` that resolves to the RSA `CryptoKey` from the `string` representation.
	 */
	async #importRSAKey(pem: string): Promise<CryptoKey> {
		return this.#crypto.subtle.importKey(
			'spki',
			this.#str2ab(this.#window.atob(pem)),
			{
				name: 'RSA-OAEP',
				hash: 'SHA-256',
			},
			true,
			['encrypt'],
		);
	}

	/**
	 * User connection to the server
	 * @type {Peer}
	 * @readonly
	 */
	#peer: Peer = new Peer();

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
		this.#peer.on('connection', (dataConnection: DataConnection): void => dataConnection.on('data', async (data: string): Promise<void> => {
			console.log(`RECEIVED: ${data}`);
			const messageData: MessageData = JSON.parse(data);
			await this.#render(this.#peer.id, messageData);
		}));

		/**
		 * Waits for the client to connect to the server and refreshes the client id.
		 */
		const check: () => void = (): void => {
			if (this.#peer.id) {
				(this.#window.document.getElementById('id') as HTMLSpanElement).innerHTML += `User ID: ${this.#peer.id}`;
				return;
			}
			setTimeout(check, 50);
		}
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
		const trueFrom: string = split[0];
		split[0] = this.#peer.id;

		const duplicateCheck: HTMLSpanElement | undefined = this.#window.document.getElementById(aesAccess) as HTMLSpanElement | undefined;
		if (duplicateCheck) {
			(duplicateCheck.nextSibling as HTMLInputElement).focus();
			return duplicateCheck;
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
		}
		chatButtons.insertAdjacentElement('beforeend', clearChatLocal);

		const clearChatGlobal: HTMLInputElement = this.#window.document.createElement('input');
		clearChatGlobal.value = 'Clear Chat Globally';
		clearChatGlobal.type = 'button';
		clearChatGlobal.className = 'chatButtons';
		clearChatGlobal.onclick = (ev: MouseEvent): void => {
			ev.preventDefault();
			clearChatGlobal.parentElement?.nextSibling?.childNodes.forEach(async (value: ChildNode): Promise<void> => {
				for (let i: number = 0; i < split.length; i++) {
					let split2: Array<string> = aesAccess.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: '',
						time: '',
						id: (value as HTMLParagraphElement).id,
						event: MessageDataEvent.Unsend
					}, i === 0);
				}
			});
		}
		chatButtons.insertAdjacentElement('beforeend', clearChatGlobal);

		const generateNewAESKeyButton: HTMLInputElement = this.#window.document.createElement('input');
		generateNewAESKeyButton.value = 'Generate New AES Key';
		generateNewAESKeyButton.type = 'button';
		generateNewAESKeyButton.className = 'chatButtons';
		generateNewAESKeyButton.onclick = async (ev: MouseEvent): Promise<void> => {
			ev.preventDefault();
			sendBar.readOnly = true;
			delete this.#aesKeys[aesAccess];
			await this.#send(trueFrom, {
				from: split.join(','),
				body: await this.#exportRSAKey((await this.#keyPair).publicKey),
				time: '',
				id: '',
				event: MessageDataEvent.RSAKeyShare,
			});
			await this.#aesKeyEstablished(aesAccess);
			sendBar.readOnly = false;
		};
		chatButtons.insertAdjacentElement('beforeend', generateNewAESKeyButton);

		collapsible.insertAdjacentElement('beforeend', chatButtons);
		const el: HTMLSpanElement = this.#window.document.createElement('span');
		el.className = 'message';
		el.id = aesAccess;
		collapsible.insertAdjacentElement('beforeend', el);

		const sendBar: HTMLTextAreaElement = this.#window.document.createElement('textarea');
		sendBar.className = 'sendBar';
		sendBar.onkeydown = async (event: KeyboardEvent): Promise<void> => {
			if (event.key === 'Enter' && !event.shiftKey && (sendBar.value || this.#editing) && !sendBar.readOnly) {
				sendBar.readOnly = true;
				if (sendBar.value)
					sendBar.value = await this.#encryptAES(aesAccess, sendBar.value.replaceAll('\n', '</br>'));
				if (this.#replying) {
					const prev: HTMLSpanElement = this.#window.document.getElementById(this.#replying) as HTMLSpanElement;
					if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>⏎<\/i>(<\/small>){3}$/g)) {
						prev.removeChild(prev.lastChild);
						prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
					}
					this.#replying = await this.#encryptAES(aesAccess, this.#replying);
				}

				const messageID: string = this.#editing ? this.#editing : this.#randomUUID();
				const messagetime: string = await this.#encryptAES(aesAccess, (this.#editing ? 'edited at ' : '') + new Date().toLocaleTimeString());
				for (let i: number = 0; i < split.length; i++) {
					let split2: Array<string> = aesAccess.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: sendBar.value,
						time: messagetime,
						id: messageID,
						event: this.#editing ? (sendBar.value ? MessageDataEvent.Edit : MessageDataEvent.Unsend) : undefined,
						prev: this.#replying,
					}, i === 0);
				}

				sendBar.value = '';
				sendBar.readOnly = false;
				this.#replying = undefined;
				this.#editing = undefined;
			} else if (sendBar.value.length === 0 && event.key.length === 1)
				for (let i: number = 0; i < split.length; i++) {
					let split2: Array<string> = aesAccess.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: '',
						time: '',
						id: '',
						event: MessageDataEvent.Typing,
					}, i === 0);
				}
			else if (sendBar.value.length === 1 && event.key === 'Backspace' && !this.#editing)
				for (let i: number = 0; i < split.length; i++) {
					let split2: Array<string> = aesAccess.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: '',
						time: '',
						id: '',
						event: MessageDataEvent.StopTyping,
					}, i === 0);
				}
		};
		collapsible.insertAdjacentElement('beforeend', sendBar);

		if (establishKey)
			if ('connect' in Peer.prototype) {
				sendBar.readOnly = true;
				delete this.#aesKeys[aesAccess];
				await this.#send(trueFrom, {
					from: split.join(','),
					body: await this.#exportRSAKey((await this.#keyPair).publicKey),
					time: '',
					id: '',
					event: MessageDataEvent.RSAKeyShare,
				});
				await this.#aesKeyEstablished(aesAccess);
				sendBar.readOnly = false;
			} else
				this.#aesKeys[aesAccess] = await this.#generateAES();

		sendBar.focus();
		return el;
	}

	async #render(to: string, messageData: MessageData): Promise<void> {
		const localEdit: string | undefined = this.#editing;
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
		let el: HTMLSpanElement | null = this.#window.document.getElementById(aesAccess) as HTMLSpanElement | null;
		if (!el)
			el = await this.createChat(messageData.from, false);
		let iter: HTMLParagraphElement;
		const paragraph: HTMLParagraphElement = this.#window.document.createElement('p');
		switch (messageData.event) {
			case MessageDataEvent.GroupRSAKeyRequest:
				if (to !== this.#peer.id)
					break;
				delete this.#aesKeys[aesAccess];
				await this.#send(trueFrom, {
					from: split.join(),
					body: await this.#exportRSAKey((await this.#keyPair).publicKey),
					time: '',
					id: '',
					event: MessageDataEvent.GroupRSAKeyShare,
				});
				break;
			case MessageDataEvent.GroupRSAKeyShare:
				if (to !== this.#peer.id)
					break;
				await this.#send(trueFrom, {
					from: split.join(','),
					body: await this.#encryptRSA(aesAccess, messageData.body),
					time: '',
					id: '',
					event: MessageDataEvent.AESKeyShare,
				});
				break;
			case MessageDataEvent.RSAKeyShare:
				if (to !== this.#peer.id)
					break;
				this.#aesKeys[aesAccess] = await this.#generateAES();
				await this.#send(trueFrom, {
					from: split.join(','),
					body: await this.#encryptRSA(aesAccess, messageData.body),
					time: '',
					id: '',
					event: MessageDataEvent.AESKeyShare,
				});
				for (let i: number = 1; i < split.length; i++) {
					let split2: Array<string> = messageData.from.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.#peer.id);
					await this.#send(trueFrom2, {
						from: split2.join(','),
						body: '',
						time: '',
						id: '',
						event: MessageDataEvent.GroupRSAKeyRequest,
					});
				}
				break;
			case MessageDataEvent.AESKeyShare:
				if (to !== this.#peer.id)
					break;
				if (this.#aesKeys[aesAccess])
					break;
				this.#aesKeys[aesAccess] = await this.#decryptRSA(messageData.body);
				break;
			case MessageDataEvent.Typing:
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
				paragraph.id = messageData.id;
				el.insertAdjacentElement('beforeend', paragraph);
				break;
			case MessageDataEvent.StopTyping:
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
			case MessageDataEvent.Delivered:
				let i: number;
				for (i = el.children.length - 1; i >= 0; i--)
					if (el.children[i].id === messageData.id && !el.children[i].innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>'))
						break;
				if (el.children[i])
					el.children[i].insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
				break;
			case MessageDataEvent.Edit:
				this.#window.document.querySelectorAll(`[id='${to === this.#peer.id ? messageData.id : localEdit}']`).forEach(async (el: any): Promise<void> => {
					if ((el.firstChild as HTMLElement).tagName == el.tagName)
						while (el.firstChild.nextSibling)
							el.removeChild(el.firstChild.nextSibling);
					else
						while (el.firstChild)
							el.removeChild(el.firstChild);
					el.insertAdjacentHTML('beforeend', `${await this.#decryptAES(aesAccess, messageData.body)
						} <small><small><small><i>${await this.#decryptAES(aesAccess, messageData.time)
						}</i></small></small></small>`);
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
						body: '',
						time: '',
						id: messageData.id,
						event: MessageDataEvent.Delivered,
					});
				break;
			case MessageDataEvent.Unsend:
				const temp: HTMLParagraphElement = this.#window.document.getElementById(messageData.id) as HTMLParagraphElement;
				while (temp.previousSibling && !(temp.previousSibling as HTMLElement).className)
					temp.parentElement?.removeChild(temp.previousSibling as ChildNode);
				temp.parentElement?.removeChild(temp as ChildNode);

				if (to === this.#peer.id && el.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
					iter = el.lastChild as HTMLParagraphElement;
					while (iter && iter.className === 'typing')
						if (iter.innerHTML === ((split.length > 1) ? trueFrom + ' is ' : '') + 'Typing...') {
							el.removeChild(iter);
							break;
						} else
							iter = iter.previousSibling as HTMLParagraphElement;
				}
				break;
			default:
				paragraph.innerHTML = `${messageData.event !== MessageDataEvent.Delivered ? await this.#decryptAES(aesAccess, messageData.body) : messageData.body
					} <small><small><small><i>${messageData.event !== MessageDataEvent.Delivered ? await this.#decryptAES(aesAccess, messageData.time) : messageData.time
					}</i></small></small></small>`;
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
				paragraph.id = messageData.id;
				paragraph.onclick = async (ev: MouseEvent): Promise<void> => {
					ev.preventDefault();
					if (this.#editing) {
						const prev: HTMLSpanElement = this.#window.document.getElementById(this.#editing) as HTMLSpanElement;
						if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✎<\/i>(<\/small>){3}$/g)) {
							prev.removeChild(prev.lastChild);
							prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
						}
						this.#editing = undefined;
					} else if (this.#replying) {
						const prev: HTMLSpanElement = this.#window.document.getElementById(this.#replying) as HTMLSpanElement;
						if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>⏎<\/i>(<\/small>){3}$/g)) {
							prev.removeChild(prev.lastChild);
							prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
						}
					}
					if (this.#replying != paragraph.id) {
						this.#replying = paragraph.id;
						if (paragraph.lastChild && (paragraph.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✓<\/i>(<\/small>){3}$/g)) {
							paragraph.removeChild(paragraph.lastChild);
							paragraph.insertAdjacentHTML('beforeend', ' <small><small><small><i>⏎</i></small></small></small>');
						} else
							throw new Error('Cannot Reply to Non-Delivered Message.');
					} else
						this.#replying = undefined;
					((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).focus();
					for (let i: number = 0; i < split.length; i++) {
						let split2: Array<string> = aesAccess.split(',');
						const trueFrom2: string = split2[i];
						split2.splice(i, 1);
						split2.unshift(this.#peer.id);
						await this.#send(trueFrom2, {
							from: split2.join(','),
							body: '',
							time: '',
							id: '',
							event: MessageDataEvent.StopTyping,
						}, i === 0);
					}
				}
				if (to !== this.#peer.id)
					paragraph.ondblclick = async (ev: MouseEvent): Promise<void> => {
						ev.preventDefault();
						if (this.#replying) {
							const prev: HTMLSpanElement = this.#window.document.getElementById(this.#replying) as HTMLSpanElement;
							if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>⏎<\/i>(<\/small>){3}$/g)) {
								prev.removeChild(prev.lastChild);
								prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
							}
							this.#replying = undefined;
						} else if (this.#editing) {
							const prev: HTMLSpanElement = this.#window.document.getElementById(this.#editing) as HTMLSpanElement;
							if (prev.lastChild && (prev.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✎<\/i>(<\/small>){3}$/g)) {
								prev.removeChild(prev.lastChild);
								prev.insertAdjacentHTML('beforeend', ' <small><small><small><i>✓</i></small></small></small>');
							}
						}
						this.#editing = paragraph.id;
						if (paragraph.lastChild && (paragraph.lastChild as HTMLElement).outerHTML.match(/(<small>){3}<i>✓<\/i>(<\/small>){3}$/g)) {
							((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).value = Array.from(paragraph.childNodes).slice((paragraph.firstChild as HTMLElement).tagName == paragraph.tagName ? 1 : 0, -5).map((value: ChildNode): string => (value as HTMLElement).tagName == 'BR' ? '\n' : (value as Text).data).join('').slice(0, -1);
							paragraph.removeChild(paragraph.lastChild);
							paragraph.insertAdjacentHTML('beforeend', ' <small><small><small><i>✎</i></small></small></small>');
						} else
							throw new Error('Cannot Edit Non-Delivered Message.');
						((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).focus();
						for (let i: number = 0; i < split.length; i++) {
							let split2: Array<string> = aesAccess.split(',');
							const trueFrom2: string = split2[i];
							split2.splice(i, 1);
							split2.unshift(this.#peer.id);
							await this.#send(trueFrom2, {
								from: split2.join(','),
								body: '',
								time: '',
								id: '',
								event: MessageDataEvent.Typing,
							}, i === 0);
						}
					}
				paragraph.oncontextmenu = (ev: MouseEvent): void => {
					ev.preventDefault();
					if (this.#window.document.getElementById('contextmenu')?.style.display == 'block') {
						this.#reacting = undefined;
						(this.#window.document.getElementById('contextmenu') as HTMLDivElement).style.display = 'none';
					} else {
						this.#reacting = paragraph.id;
						const menu: HTMLDivElement = this.#window.document.getElementById('contextmenu') as HTMLDivElement;
						menu.style.display = 'block';
						menu.style.left = ev.pageX + 'px';
						menu.style.top = ev.pageY + 'px';
					}
				};
				if (messageData.prev) {
					const prev: HTMLParagraphElement = this.#window.document.getElementById(await this.#decryptAES(aesAccess, messageData.prev)) as HTMLParagraphElement;
					const reply: HTMLParagraphElement = this.#window.document.createElement('p');
					reply.className = prev.className + 'Reply';
					reply.id = prev.id;
					reply.innerHTML = `<small><small>${prev.innerHTML}</small></small>`;
					if ((reply.firstChild?.firstChild?.firstChild as HTMLElement).tagName == reply.tagName)
						reply.firstChild?.firstChild?.removeChild(reply.firstChild?.firstChild?.firstChild as HTMLParagraphElement);
					paragraph.insertAdjacentElement('afterbegin', reply);
				}
				if (el.lastChild && (el.lastChild as HTMLParagraphElement).className === 'typing') {
					let iter: HTMLSpanElement = el.lastChild as HTMLParagraphElement;
					while (iter.previousSibling && (iter.previousSibling as HTMLParagraphElement).className === 'typing')
						iter = iter.previousSibling as HTMLParagraphElement;
					el.insertBefore(paragraph, iter);
				}
				else
					el.insertAdjacentElement('beforeend', paragraph);

				if (to === this.#peer.id)
					await this.#send(trueFrom, {
						from: split.join(','),
						body: '',
						time: '',
						id: messageData.id,
						event: MessageDataEvent.Delivered,
					});
				break;
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
			const conn: DataConnection = this.#peer.connect(to);
			conn.on('open', async (): Promise<void> => {
				const data: string = JSON.stringify(messageData);
				if (isFirst)
					await this.#render(to, messageData);
				conn.send(data);
				console.log(`SENT: ${data}`);
				resolve();
			});
		});
	}

	/**
	 * Send a new reaction.
	 * @param {string} reaction - The reaction to send to the client.
	 */
	async react(reaction: string): Promise<void> {
		const aesAccess: string = ((((this.#window.document.getElementById(this.#reacting as string) as HTMLParagraphElement).parentElement as HTMLSpanElement).parentElement as HTMLDetailsElement).firstChild as HTMLElement).innerHTML;
		const split: Array<string> = aesAccess.split(',');
		const messageID: string = this.#randomUUID();
		const messagetime: string = await this.#encryptAES(aesAccess, (this.#editing ? 'edited at ' : '') + new Date().toLocaleTimeString());
		reaction = await this.#encryptAES(aesAccess, reaction);
		this.#reacting = await this.#encryptAES(aesAccess, this.#reacting as string);
		for (let i: number = 0; i < split.length; i++) {
			let split2: Array<string> = aesAccess.split(',');
			const trueFrom2: string = split2[i];
			split2.splice(i, 1);
			split2.unshift(this.#peer.id);
			await this.#send(trueFrom2, {
				from: split2.join(','),
				body: reaction,
				time: messagetime,
				id: messageID,
				event: undefined,
				prev: this.#reacting,
			}, i === 0);
		}
		this.#reacting = undefined;
	}

	/**
	 * Generate a random UUID not in use.
	 */
	#randomUUID(): string {
		let UUID: string;
		do {
			UUID = this.#crypto.randomUUID();
		} while (this.#window.document.getElementById(UUID));
		return UUID;
	}

	/**
	 * Generate a new AES key.
	 */
	async #generateAES(): Promise<[Uint8Array, CryptoKey]> {
		return [this.#crypto.getRandomValues(new Uint8Array(16)), await this.#crypto.subtle.generateKey(
			{
				name: 'AES-CBC',
				length: 256,
			},
			true,
			['encrypt', 'decrypt'])];
	}

	/**
	 * Encrypt a message with an AES key.
	 * @param {string} aesAccess - AES Key ID.
	 * @param {string} message - Message to Encrypt.
	 */
	async #encryptAES(aesAccess: string, message: string): Promise<string> {
		return JSON.stringify(Array.from(new Uint8Array(await this.#crypto.subtle.encrypt(
			{ name: 'AES-CBC', iv: this.#aesKeys[aesAccess][0] },
			this.#aesKeys[aesAccess][1],
			new Uint8Array(new TextEncoder().encode(message))))));
	}

	/**
	 * Decrypt a message with an AES key.
	 * @param {string} aesAccess - AES Key ID.
	 * @param {string} message - Message to Decrypt.
	 */
	async #decryptAES(aesAccess: string, message: string): Promise<string> {
		return new TextDecoder().decode(await this.#crypto.subtle.decrypt(
			{ name: 'AES-CBC', iv: this.#aesKeys[aesAccess][0] },
			this.#aesKeys[aesAccess][1],
			new Uint8Array(JSON.parse(message))));
	}

	/**
	 * Generate a new RSA key.
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
	 * Encrypt an AES Key with an RSA Public Key.
	 * @param {string} aesAccess - AES Key ID to Share.
	 * @param {string} publicKey - RSA Public Key to Encrypt with.
	 */
	async #encryptRSA(aesAccess: string, publicKey: string): Promise<string> {
		return JSON.stringify([
			Array.from(this.#aesKeys[aesAccess][0]),
			Array.from(new Uint8Array(await this.#crypto.subtle.encrypt(
				{ name: 'RSA-OAEP' },
				await this.#importRSAKey(publicKey),
				await this.#crypto.subtle.exportKey('raw', this.#aesKeys[aesAccess][1]),
			)))]);
	}

	/**
	 * Decrypt a message with an RSA key.
	 * @param {string} message - Message to Decrypt.
	 */
	async #decryptRSA(message: string): Promise<[Uint8Array, CryptoKey]> {
		const parsed: Array<any> = JSON.parse(message);
		return [new Uint8Array(parsed[0]), await this.#crypto.subtle.importKey(
			'raw',
			await this.#crypto.subtle.decrypt(
				{ name: 'RSA-OAEP' },
				(await this.#keyPair).privateKey,
				new Uint8Array(parsed[1]),
			),
			'AES-CBC',
			true,
			['encrypt', 'decrypt'])];
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
