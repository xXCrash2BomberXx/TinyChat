var polyfills: {
	fetch?: any;
	WebSocket?: any;
	WebRTC?: any;
	FileReader?: any;
};
if (!Peer) {
	//@ts-ignore: 2300
	var { Peer } = require('peerjs');
	polyfills = {
		fetch: require('node-fetch'),
		WebSocket: require('ws'),
		WebRTC: require('wrtc'),
		FileReader: require('filereader')
	};
} else
	polyfills = {};

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
enum MessageDataEvent {
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
enum MessageDataEffects { };

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
	event?: MessageDataEvent,
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

//@ts-ignore: 2451
class Client {
	/**
	 * Message ID of the message being edited.
	 * @type {string?}
	 */
	private editing: string | undefined = undefined;

	/**
	 * Message ID of the message being edited.
	 * @type {string?}
	 */
	private replying: string | undefined = undefined;

	/**
	 * RSA public and private key pair.
	 * @type {Promise<CryptoKeyPair>}
	 */
	private keyPair: Promise<CryptoKeyPair>;

	/**
	 * AES keys for the active conversations.
	 * @type { { [string]: [Uint8Array, CryptoKey] } }
	 */
	private aesKeys: { [id: string]: [Uint8Array, CryptoKey] } = {};

	/**
	 * Exports an RSA `CryptoKey` into a `Promise<string>` that resolves to a `string` representation.
	 * @param {CryptoKey} key - RSA `CryptoKey` to convert to a `string`.
	 * @returns {Promise<string>} `Promise<string>` that resolves to the `string` representation of an RSA `CryptoKey`.
	 */
	private async exportRSAKey(key: CryptoKey): Promise<string> {
		return this.window.btoa(String.fromCharCode.apply(null, new Uint8Array(await this.crypto.subtle.exportKey("spki", key)) as unknown as Array<number>));
	}

	/**
	 * Converts a `string` into an `ArrayBuffer`.
	 * @param {string} str - `string` to convert to an `ArrayBuffer`.
	 * @returns {ArrayBuffer} `ArrayBuffer` representation of the provded `string`.
	 */
	private str2ab(str: string): ArrayBuffer {
		const buf: ArrayBuffer = new ArrayBuffer(str.length);
		const bufView: Uint8Array = new Uint8Array(buf);
		for (let i: number = 0, strLen = str.length; i < strLen; i++) {
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	}

	/**
	 * Imports an RSA `CryptoKey` into a `Promise<CryptoKey>` from a `string` that resolves to the RSA `CryptoKey`.
	 * @param {string} pem - `string` to convert to an RSA `CryptoKey`.
	 * @returns {Promise<CryptoKey>} `Promise<CryptoKey>` that resolves to the RSA `CryptoKey` from the `string` representation.
	 */
	private async importRSAKey(pem: string): Promise<CryptoKey> {
		return this.crypto.subtle.importKey(
			'spki',
			await this.str2ab(this.window.atob(pem)),
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
	private peer: Peer = new Peer({ polyfills });

	private window: Window;
	private crypto: Crypto;

	constructor(w: Window, crypto?: Crypto) {
		this.window = w;
		this.crypto = crypto ? crypto : w.crypto;
		this.keyPair = this.crypto.subtle.generateKey(
			{
				name: 'RSA-OAEP',
				modulusLength: 4096,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: 'SHA-256',
			},
			true,
			['encrypt', 'decrypt'],
		);
		this.peer.on('connection', (dataConnection: DataConnection): void => dataConnection.on('data', async (data: string): Promise<void> => {
			console.log(`RECEIVED: ${data}`);
			const messageData: MessageData = JSON.parse(data);
			let split: Array<string> = messageData.from.split(',');
			const aesAccess: string = (split as any).toSorted().join(',');
			const trueFrom: string = split[0];
			split[0] = this.peer.id;
			let el: HTMLSpanElement | null = this.window.document.getElementById(aesAccess) as HTMLSpanElement | null;
			if (!el)
				el = await this.createChat(messageData.from, false);
			const paragraph: HTMLParagraphElement = this.window.document.createElement('p');
			paragraph.onclick = (ev: MouseEvent): void => {
				ev.preventDefault();
				if (this.editing) {
					const prev: HTMLSpanElement = this.window.document.getElementById(this.editing) as HTMLSpanElement;
					prev.innerHTML = prev.innerHTML.replace(/ (<small>){3}<i>✎<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✓</i></small></small></small>');
					this.editing = undefined;
				} else if (this.replying) {
					const prev: HTMLSpanElement = this.window.document.getElementById(this.replying) as HTMLSpanElement;
					prev.innerHTML = prev.innerHTML.replace(/ (<small>){3}<i>⏎<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✓</i></small></small></small>');
				}
				if (this.replying != paragraph.id) {
					this.replying = paragraph.id;
					if (paragraph.innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>'))
						paragraph.innerHTML = paragraph.innerHTML.replace(/ (<small>){3}<i>✓<\/i>(<\/small>){3}$/g, ' <small><small><small><i>⏎</i></small></small></small>');
					else
						throw new Error('Cannot Reply to Non-Delivered Message.');
				} else
					this.replying = undefined;
				((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).focus();
			};
			switch (messageData.event) {
				case MessageDataEvent.GroupRSAKeyRequest:
					delete this.aesKeys[aesAccess];
					this.send(trueFrom, {
						from: split.join(),
						body: await this.exportRSAKey((await this.keyPair).publicKey),
						time: '',
						id: '',
						event: MessageDataEvent.GroupRSAKeyShare,
					});
					break;
				case MessageDataEvent.GroupRSAKeyShare:
					this.send(trueFrom, {
						from: split.join(','),
						body: JSON.stringify([
							Array.from(this.aesKeys[aesAccess][0]),
							Array.from(new Uint8Array(await this.crypto.subtle.encrypt(
								{ name: 'RSA-OAEP' },
								await this.importRSAKey(messageData.body),
								await this.crypto.subtle.exportKey('raw', this.aesKeys[aesAccess][1]),
							))),
						]),
						time: '',
						id: '',
						event: MessageDataEvent.AESKeyShare,
					});
					break;
				case MessageDataEvent.RSAKeyShare:
					this.aesKeys[aesAccess] = [this.crypto.getRandomValues(new Uint8Array(16)), await this.crypto.subtle.generateKey(
						{
							name: 'AES-CBC',
							length: 256,
						},
						true,
						['encrypt', 'decrypt'],
					)];
					this.send(trueFrom, {
						from: split.join(','),
						body: JSON.stringify([
							Array.from(this.aesKeys[aesAccess][0]),
							Array.from(new Uint8Array(await this.crypto.subtle.encrypt(
								{ name: 'RSA-OAEP' },
								await this.importRSAKey(messageData.body),
								await this.crypto.subtle.exportKey('raw', this.aesKeys[aesAccess][1]),
							))),
						]),
						time: '',
						id: '',
						event: MessageDataEvent.AESKeyShare,
					});
					for (let i: number = 1; i < split.length; i++) {
						let split2: Array<string> = messageData.from.split(',');
						const trueFrom2: string = split2[i];
						split2.splice(i, 1);
						split2.unshift(this.peer.id);
						this.send(trueFrom2, {
							from: split2.join(','),
							body: '',
							time: '',
							id: '',
							event: MessageDataEvent.GroupRSAKeyRequest,
						});
					}
					break;
				case MessageDataEvent.AESKeyShare:
					if (this.aesKeys[aesAccess])
						break;
					const parsed: Array<any> = JSON.parse(messageData.body);
					this.aesKeys[aesAccess] = [new Uint8Array(parsed[0]), await this.crypto.subtle.importKey(
						'raw',
						await this.crypto.subtle.decrypt(
							{ name: 'RSA-OAEP' },
							(await this.keyPair).privateKey,
							new Uint8Array(parsed[1]),
						),
						'AES-CBC',
						true,
						['encrypt', 'decrypt'],
					)];
					break;
				case MessageDataEvent.Typing:
					paragraph.innerHTML = ((split.length > 1) ? trueFrom + ' is ' : '') + 'Typing...';
					paragraph.className = 'typing';
					if (el.lastChild && (el.lastChild as Element).className === 'typing')
						return;
					paragraph.id = messageData.id;
					el.insertAdjacentElement('beforeend', paragraph);
					break;
				case MessageDataEvent.StopTyping:
					if (el.lastChild && (el.lastChild as Element).className === 'typing')
						el.removeChild(el.lastChild);
					break;
				case MessageDataEvent.Delivered:
					let i: number;
					for (i = el.children.length - 1; i >= 0; i--)
						if (el.children[i].id === messageData.id && !el.children[i].innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>'))
							break;
					if (el.children[i])
						el.children[i].innerHTML += ' <small><small><small><i>✓</i></small></small></small>';
					break;
				case MessageDataEvent.Edit:
					(this.window.document.getElementById(messageData.id) as HTMLSpanElement).innerHTML = `${new TextDecoder().decode(await this.crypto.subtle.decrypt(
						{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
						this.aesKeys[aesAccess][1],
						new Uint8Array(JSON.parse(messageData.body)),
					))
						} <small><small><small><i>${new TextDecoder().decode(await this.crypto.subtle.decrypt(
							{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
							this.aesKeys[aesAccess][1],
							new Uint8Array(JSON.parse(messageData.time)),
						))
						}</i></small></small></small> <small><small><small><i>✓</i></small></small></small>`;
					if (el.lastChild && (el.lastChild as Element).className === 'typing')
						el.removeChild(el.lastChild);
					this.send(trueFrom, {
						from: split.join(','),
						body: '',
						time: '',
						id: messageData.id,
						event: MessageDataEvent.Delivered,
					});
					break;
				case MessageDataEvent.Unsend:
					const temp: HTMLParagraphElement = this.window.document.getElementById(messageData.id) as HTMLParagraphElement;
					while (temp.previousSibling && !(temp.previousSibling as HTMLElement).className)
						temp.parentElement?.removeChild(temp.previousSibling as ChildNode);
					temp.parentElement?.removeChild(temp as ChildNode);
					break;
				default:
					paragraph.innerHTML = `${new TextDecoder().decode(await this.crypto.subtle.decrypt(
						{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
						this.aesKeys[aesAccess][1],
						new Uint8Array(JSON.parse(messageData.body)),
					))
						} <small><small><small><i>${new TextDecoder().decode(await this.crypto.subtle.decrypt(
							{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
							this.aesKeys[aesAccess][1],
							new Uint8Array(JSON.parse(messageData.time)),
						))
						}</i></small></small></small> <small><small><small><i>✓</i></small></small></small>`;
					paragraph.className = 'received';
					if (el.lastChild && (el.lastChild as Element).className === 'typing')
						el.removeChild(el.lastChild);
					this.send(trueFrom, {
						from: split.join(','),
						body: '',
						time: '',
						id: messageData.id,
						event: MessageDataEvent.Delivered,
					});
					paragraph.id = messageData.id;
					if (split.length > 1) {
						const from: HTMLParagraphElement = this.window.document.createElement('p');
						from.innerHTML = `<small><small>From: ${trueFrom}</small></small>`;
						if (el.lastChild && (el.lastChild as Element).className === 'typing')
							el.insertBefore(from, el.lastChild);
						else
							el.insertAdjacentElement('beforeend', from);
					}
					if (messageData.prev) {
						const reply: HTMLParagraphElement = this.window.document.createElement('p');
						reply.innerHTML = `<small><small>${(this.window.document.getElementById(new TextDecoder().decode(await this.crypto.subtle.decrypt(
							{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
							this.aesKeys[aesAccess][1],
							new Uint8Array(JSON.parse(messageData.prev)),
						))) as HTMLElement).outerHTML}</small></small>`;
						if (el.lastChild && (el.lastChild as Element).className === 'typing')
							el.insertBefore(reply, el.lastChild);
						else
							el.insertAdjacentElement('beforeend', reply);
					}
					el.insertAdjacentElement('beforeend', paragraph);
					break;
			}
		}));

		/**
		 * Waits for the client to connect to the server and refreshes the client id.
		 */
		const check: () => void = (): void => {
			if (this.peer.id) {
				(this.window.document.getElementById('id') as HTMLSpanElement).innerHTML += `User ID: ${this.peer.id}`;
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
	private async aesKeyEstablished(to: string): Promise<void> {
		return new Promise((resolve: (value: (void | Promise<void>)) => void): void => {
			const client: Client = this;
			function check() {
				if (client.aesKeys[to])
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
	private async createChat(to: string, establishKey: boolean = true): Promise<HTMLSpanElement> {
		to = (to.split(',') as any).toSorted().map((x: string): string => x.trim()).join(',');
		let split: Array<string> = to.split(',');
		const aesAccess: string = to;
		const trueFrom: string = split[0];
		split[0] = this.peer.id;

		const collapsible: HTMLDetailsElement = this.window.document.createElement('details');
		collapsible.open = true;
		this.window.document.body.insertAdjacentElement('beforeend', collapsible);
		const summary: HTMLUnknownElement = this.window.document.createElement('summary');
		summary.innerHTML = aesAccess;
		collapsible.insertAdjacentElement('afterbegin', summary);
		const chatButtons: HTMLDivElement = this.window.document.createElement('div');
		chatButtons.className = 'chatButtonsContainer';

		const clearChatLocal: HTMLInputElement = this.window.document.createElement('input');
		clearChatLocal.value = 'Clear Chat Locally';
		clearChatLocal.type = 'button';
		clearChatLocal.className = 'chatButtons';
		clearChatLocal.onclick = (ev: MouseEvent): void => {
			ev.preventDefault();
			clearChatLocal.parentElement?.nextSibling?.childNodes.forEach((value: ChildNode): void => { clearChatLocal.parentElement?.nextSibling?.removeChild(value); });
		}
		chatButtons.insertAdjacentElement('beforeend', clearChatLocal);

		const clearChatGlobal: HTMLInputElement = this.window.document.createElement('input');
		clearChatGlobal.value = 'Clear Chat Globally';
		clearChatGlobal.type = 'button';
		clearChatGlobal.className = 'chatButtons';
		clearChatGlobal.onclick = (ev: MouseEvent): void => {
			ev.preventDefault();
			clearChatGlobal.parentElement?.nextSibling?.childNodes.forEach((value: ChildNode): void => {
				for (let i: number = 0; i < split.length; i++) {
					let split2: Array<string> = to.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.peer.id);
					this.send(trueFrom2, {
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

		const generateNewAESKeyButton: HTMLInputElement = this.window.document.createElement('input');
		generateNewAESKeyButton.value = 'Generate New AES Key';
		generateNewAESKeyButton.type = 'button';
		generateNewAESKeyButton.className = 'chatButtons';
		generateNewAESKeyButton.onclick = async (ev: MouseEvent): Promise<void> => {
			ev.preventDefault();
			delete this.aesKeys[aesAccess];
			this.send(trueFrom, {
				from: split.join(','),
				body: await this.exportRSAKey((await this.keyPair).publicKey),
				time: '',
				id: '',
				event: MessageDataEvent.RSAKeyShare,
			});
			await this.aesKeyEstablished(aesAccess);
		};
		chatButtons.insertAdjacentElement('beforeend', generateNewAESKeyButton);

		collapsible.insertAdjacentElement('beforeend', chatButtons);
		const el: HTMLSpanElement = this.window.document.createElement('span');
		el.className = 'message';
		el.id = aesAccess;
		collapsible.insertAdjacentElement('beforeend', el);

		if (establishKey) {
			delete this.aesKeys[aesAccess];
			this.send(trueFrom, {
				from: split.join(','),
				body: await this.exportRSAKey((await this.keyPair).publicKey),
				time: '',
				id: '',
				event: MessageDataEvent.RSAKeyShare,
			});
			await this.aesKeyEstablished(aesAccess);
		}

		const sendBar: HTMLInputElement = this.window.document.createElement('input');
		sendBar.type = 'text';
		sendBar.className = 'sendBar';
		sendBar.onkeydown = async (event: KeyboardEvent): Promise<void> => {
			if (event.key === 'Enter' && (sendBar.value || this.editing)) {
				if (sendBar.value)
					sendBar.value = JSON.stringify(Array.from(new Uint8Array(await this.crypto.subtle.encrypt(
						{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
						this.aesKeys[aesAccess][1],
						new Uint8Array(new TextEncoder().encode(sendBar.value)),
					))));
				if (this.replying) {
					const prev: HTMLSpanElement = this.window.document.getElementById(this.replying) as HTMLSpanElement;
					prev.innerHTML = prev.innerHTML.replace(/ (<small>){3}<i>⏎<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✓</i></small></small></small>');
					this.replying = JSON.stringify(Array.from(new Uint8Array(await this.crypto.subtle.encrypt(
						{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
						this.aesKeys[aesAccess][1],
						new Uint8Array(new TextEncoder().encode(this.replying)),
					))));
				}

				const messageID: string = this.editing ? this.editing : this.crypto.randomUUID();
				const messagetime: string = JSON.stringify(Array.from(new Uint8Array(await this.crypto.subtle.encrypt(
					{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
					this.aesKeys[aesAccess][1],
					new Uint8Array(new TextEncoder().encode((this.editing ? 'edited at ' : '') + new Date().toLocaleTimeString())),
				))));
				for (let i: number = 0; i < split.length; i++) {
					let split2: Array<string> = to.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.peer.id);
					this.send(trueFrom2, {
						from: split2.join(','),
						body: sendBar.value,
						time: messagetime,
						id: messageID,
						event: this.editing ? (sendBar.value ? MessageDataEvent.Edit : MessageDataEvent.Unsend) : undefined,
						prev: this.replying,
					}, i === 0);
				}

				sendBar.value = '';
				this.replying = undefined;
				this.editing = undefined;
			} else if (sendBar.value.length === 0 && event.key !== 'Backspace')
				for (let i: number = 0; i < split.length; i++) {
					let split2: Array<string> = to.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.peer.id);
					this.send(trueFrom2, {
						from: split2.join(','),
						body: '',
						time: '',
						id: '',
						event: MessageDataEvent.Typing,
					}, i === 0);
				}
			else if (sendBar.value.length === 1 && event.key === 'Backspace' && !this.editing)
				for (let i: number = 0; i < split.length; i++) {
					let split2: Array<string> = to.split(',');
					const trueFrom2: string = split2[i];
					split2.splice(i, 1);
					split2.unshift(this.peer.id);
					this.send(trueFrom2, {
						from: split2.join(','),
						body: '',
						time: '',
						id: '',
						event: MessageDataEvent.StopTyping,
					}, i === 0);
				}
		};
		collapsible.insertAdjacentElement('beforeend', sendBar);
		sendBar.focus();
		return el;
	}

	/**
	 * Send a new message to the provided `string` ID of a client.
	 * @param {string} to - The recipient ID to send the message to.
	 * @param {MessageData} messageData - {@link MessageData} object to send to the recipient.
	 */
	public send(to: string, messageData: MessageData, isFirst: boolean = true): void {
		const localEdit: string | undefined = this.editing;
		const split: Array<string> = messageData.from.split(',');
		split[0] = to;
		const aesAccess: string = (split as any).toSorted().join(',');
		const conn: DataConnection = this.peer.connect(to);
		conn.on('open', async (): Promise<void> => {
			const data: string = JSON.stringify(messageData);
			conn.send(data);
			console.log(`SENT: ${data}`);
			if (isFirst)
				switch (messageData.event) {
					case MessageDataEvent.RSAKeyShare:
					case MessageDataEvent.AESKeyShare:
					case MessageDataEvent.Typing:
					case MessageDataEvent.StopTyping:
					case MessageDataEvent.GroupRSAKeyRequest:
					case MessageDataEvent.GroupRSAKeyShare:
						break;
					case MessageDataEvent.Edit:
						(this.window.document.getElementById(localEdit as string) as HTMLSpanElement).innerHTML = `${new TextDecoder().decode(await this.crypto.subtle.decrypt(
							{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
							this.aesKeys[aesAccess][1],
							new Uint8Array(JSON.parse(messageData.body)),
						))
							} <small><small><small><i>${new TextDecoder().decode(await this.crypto.subtle.decrypt(
								{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
								this.aesKeys[aesAccess][1],
								new Uint8Array(JSON.parse(messageData.time)),
							))
							}</i></small></small></small>`;
						break;
					case MessageDataEvent.Unsend:
						const temp: HTMLParagraphElement = this.window.document.getElementById(messageData.id) as HTMLParagraphElement;
						while (temp.previousSibling && !(temp.previousSibling as HTMLElement).className)
							temp.parentElement?.removeChild(temp.previousSibling as ChildNode);
						temp.parentElement?.removeChild(temp as ChildNode);
						break;
					case MessageDataEvent.Delivered:
					default:
						const paragraph: HTMLParagraphElement = this.window.document.createElement('p');
						paragraph.innerHTML = `${messageData.event !== MessageDataEvent.Delivered ? new TextDecoder().decode(await this.crypto.subtle.decrypt(
							{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
							this.aesKeys[aesAccess][1],
							new Uint8Array(JSON.parse(messageData.body)),
						)) : messageData.body
							} <small><small><small><i>${messageData.event !== MessageDataEvent.Delivered ? new TextDecoder().decode(await this.crypto.subtle.decrypt(
								{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
								this.aesKeys[aesAccess][1],
								new Uint8Array(JSON.parse(messageData.time)),
							)) : messageData.time
							}</i></small></small></small>`;
						paragraph.className = 'sent';
						paragraph.id = messageData.id;
						paragraph.onclick = (ev: MouseEvent): void => {
							ev.preventDefault();
							if (this.editing) {
								const prev: HTMLSpanElement = this.window.document.getElementById(this.editing) as HTMLSpanElement;
								prev.innerHTML = prev.innerHTML.replace(/ (<small>){3}<i>✎<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✓</i></small></small></small>');
								this.editing = undefined;
							} else if (this.replying) {
								const prev: HTMLSpanElement = this.window.document.getElementById(this.replying) as HTMLSpanElement;
								prev.innerHTML = prev.innerHTML.replace(/ (<small>){3}<i>⏎<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✓</i></small></small></small>');
							}
							if (this.replying != paragraph.id) {
								this.replying = paragraph.id;
								if (paragraph.innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>'))
									paragraph.innerHTML = paragraph.innerHTML.replace(/ (<small>){3}<i>✓<\/i>(<\/small>){3}$/g, ' <small><small><small><i>⏎</i></small></small></small>');
								else
									throw new Error('Cannot Reply to Non-Delivered Message.');
							} else
								this.replying = undefined;
							((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).focus();
						}
						paragraph.ondblclick = (ev: MouseEvent): void => {
							ev.preventDefault();
							if (this.replying) {
								const prev: HTMLSpanElement = this.window.document.getElementById(this.replying) as HTMLSpanElement;
								prev.innerHTML = prev.innerHTML.replace(/ (<small>){3}<i>⏎<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✓</i></small></small></small>');
								this.replying = undefined;
							} else if (this.editing) {
								const prev: HTMLSpanElement = this.window.document.getElementById(this.editing) as HTMLSpanElement;
								prev.innerHTML = prev.innerHTML.replace(/ (<small>){3}<i>✎<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✓</i></small></small></small>');
							}
							this.editing = paragraph.id;
							if (paragraph.innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>')) {
								paragraph.innerHTML = paragraph.innerHTML.replace(/ (<small>){3}<i>✓<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✎</i></small></small></small>');
								((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).value = paragraph.innerHTML.replace(/( (<small>){3}<i>.*<\/i>(<\/small>){3})+$/g, '');
							} else
								throw new Error('Cannot Edit Non-Delivered Message.');
							((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).focus();
						}
						let el: HTMLSpanElement | null = this.window.document.getElementById(aesAccess) as HTMLSpanElement | null;
						if (!el)
							el = await this.createChat(to, false);
						if (messageData.prev) {
							const reply: HTMLParagraphElement = this.window.document.createElement('p');
							reply.innerHTML = `<small><small>${(this.window.document.getElementById(new TextDecoder().decode(await this.crypto.subtle.decrypt(
								{ name: 'AES-CBC', iv: this.aesKeys[aesAccess][0] },
								this.aesKeys[aesAccess][1],
								new Uint8Array(JSON.parse(messageData.prev)),
							))) as HTMLElement).outerHTML}</small></small>`;
							if (el.lastChild && (el.lastChild as Element).className === 'typing')
								el.insertBefore(reply, el.lastChild);
							else
								el.insertAdjacentElement('beforeend', reply);
						}
						if (el.lastChild && (el.lastChild as Element).className === 'typing')
							el.insertBefore(paragraph, el.lastChild);
						else
							el.insertAdjacentElement('beforeend', paragraph);
						break;
				}
		});
	}

	public async getID(): Promise<string> {
		return new Promise((resolve: (value: (string | Promise<string>)) => void): void => {
			const client: Client = this;
			function check() {
				if (client.peer.id)
					resolve(client.peer.id);
				else
					setTimeout(check, 50);
			}
			check();
		});
	}

	public async sendMessage(to: string, message: string): Promise<void> {
		to = (to.split(',') as any).toSorted().map((x: string): string => x.trim()).join(',');
		if (!this.window.document.getElementById(to))
			await this.createChat(to);
		return this.send(to, {
			from: this.peer.id,
			body: JSON.stringify(Array.from(new Uint8Array(await this.crypto.subtle.encrypt(
				{ name: 'AES-CBC', iv: this.aesKeys[to][0] },
				this.aesKeys[to][1],
				new Uint8Array(new TextEncoder().encode(message)),
			)))),
			time: JSON.stringify(Array.from(new Uint8Array(await this.crypto.subtle.encrypt(
				{ name: 'AES-CBC', iv: this.aesKeys[to][0] },
				this.aesKeys[to][1],
				new Uint8Array(new TextEncoder().encode((this.editing ? 'edited at ' : '') + new Date().toLocaleTimeString())),
			)))),
			id: this.crypto.randomUUID(),
			event: undefined,
			prev: undefined
		}, true);
	}

	public getMessages(from: string): HTMLSpanElement {
		from = (from.split(',') as any).toSorted().map((x: string): string => x.trim()).join(',');
		return this.window.document.getElementById(from) as HTMLSpanElement;
	}
}

try {
	module.exports = { Client };
} catch (e) { }
