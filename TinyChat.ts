enum MessageDataEvent {
	Typing,
	StopTyping,
	Edit,
	Reaction,
	Effect,
	Delivered,
	RSAKeyShare,
	AESKeyShare,
};

enum MessageDataEffects {};

interface MessageData {
	from: number,
	body: string,
	time: string,
	id: string,
	event?: MessageDataEvent,
	prev?: string,
	effect?: MessageDataEffects,
};

var editing: string | undefined = undefined;
var replying: string | undefined = undefined;

var keyPair: Promise<CryptoKeyPair> = crypto.subtle.generateKey(
	{
		name: 'RSA-OAEP',
		modulusLength: 4096,
		publicExponent: new Uint8Array([1, 0, 1]),
		hash: 'SHA-256',
	},
	true,
	['encrypt', 'decrypt'],
);

var aesKeys: { [id: string]: [Uint8Array, CryptoKey] } = {};

const exportRSAKey = async (key: CryptoKey): Promise<string> => `-----BEGIN PUBLIC KEY-----\n${window.btoa(String.fromCharCode.apply(null, new Uint8Array(await window.crypto.subtle.exportKey("spki", key)) as unknown as Array<number>))}\n-----END PUBLIC KEY-----`;

const str2ab = (str: string): ArrayBuffer => {
	const buf: ArrayBuffer = new ArrayBuffer(str.length);
	const bufView: Uint8Array = new Uint8Array(buf);
	for (let i: number = 0, strLen = str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

const importRSAKey = async (pem: string): Promise<CryptoKey> => crypto.subtle.importKey(
	'spki',
	await str2ab(window.atob(pem.substring('-----BEGIN PUBLIC KEY-----'.length, pem.length - '-----END PUBLIC KEY-----'.length - 1))),
	{
		name: 'RSA-OAEP',
		hash: 'SHA-256',
	},
	true,
	['encrypt'],
);

const peer: Peer = new Peer();
peer.on('connection', (dataConnection: DataConnection): void => {
	dataConnection.on('data', async (data: string): Promise<void> => {
		console.log(`RECEIVED: ${data}`);
		const messageData: MessageData = JSON.parse(data);
		let el: HTMLSpanElement | null = document.getElementById(messageData.from) as HTMLSpanElement | null;
		if (!el)
			el = await createChat(messageData.from, false);
		const paragraph: HTMLParagraphElement = document.createElement('p');
		switch (messageData.event) {
			case MessageDataEvent.RSAKeyShare:
				aesKeys[messageData.from] = [crypto.getRandomValues(new Uint8Array(16)), await window.crypto.subtle.generateKey(
					{
						name: 'AES-CBC',
						length: 256,
					},
					true,
					['encrypt', 'decrypt'],
				)];
				send(messageData.from, {
					from: peer.id,
					body: JSON.stringify([
						Array.from(aesKeys[messageData.from][0]),
						Array.from(new Uint8Array(await crypto.subtle.encrypt(
							{ name: 'RSA-OAEP' },
							await importRSAKey(messageData.body),
							await crypto.subtle.exportKey('raw', aesKeys[messageData.from][1]),
						))),
					]),
					time: '',
					id: '',
					event: MessageDataEvent.AESKeyShare,
				});
				break;
			case MessageDataEvent.AESKeyShare:
				const parsed: Array<any> = JSON.parse(messageData.body);
				aesKeys[messageData.from] = [new Uint8Array(parsed[0]), await crypto.subtle.importKey(
					'raw',
					await crypto.subtle.decrypt(
						{ name: 'RSA-OAEP' },
						(await keyPair).privateKey,
						new Uint8Array(parsed[1]),
					),
					'AES-CBC',
					true,
					['encrypt', 'decrypt'],
				)];
				break;
			case MessageDataEvent.Typing:
				paragraph.innerHTML = 'Typing...';
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
				el.children[i].innerHTML += ' <small><small><small><i>✓</i></small></small></small>';
				break;
			case MessageDataEvent.Edit:
				(document.getElementById(messageData.id) as HTMLSpanElement).innerHTML = `${
					new TextDecoder().decode(await crypto.subtle.decrypt(
						{ name: 'AES-CBC', iv: aesKeys[messageData.from][0] },
						aesKeys[messageData.from][1],
						new Uint8Array(JSON.parse(messageData.body)),
					))
				} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				if (el.lastChild && (el.lastChild as Element).className === 'typing')
					el.removeChild(el.lastChild);
				send(messageData.from, {
					from: peer.id,
					body: '',
					time: '',
					id: messageData.id,
					event: MessageDataEvent.Delivered,
				});
				break;
			default:
				paragraph.innerHTML = `${
					new TextDecoder().decode(await crypto.subtle.decrypt(
						{ name: 'AES-CBC', iv: aesKeys[messageData.from][0] },
						aesKeys[messageData.from][1],
						new Uint8Array(JSON.parse(messageData.body)),
					))
				} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				paragraph.className = 'received';
				if (el.lastChild && (el.lastChild as Element).className === 'typing')
					el.removeChild(el.lastChild);
				send(messageData.from, {
					from: peer.id,
					body: '',
					time: '',
					id: messageData.id,
					event: MessageDataEvent.Delivered,
				});
				paragraph.id = messageData.id;
				el.insertAdjacentElement('beforeend', paragraph);
				break;
		}
	});
});

const createChat = async (to: string, establishKey: boolean = true): Promise<HTMLSpanElement> => {
	const el = document.createElement('span');
	el.className = 'message';
	el.id = to;
	el.innerHTML = `<u>${to}</u>`
	document.body.insertAdjacentElement('beforeend', el);

	if (establishKey)
		send(to, {
			from: peer.id,
			body: await exportRSAKey((await keyPair).publicKey),
			time: '',
			id: '',
			event: MessageDataEvent.RSAKeyShare,
		});

	const sendBar: HTMLInputElement = document.createElement('input');
	sendBar.type = 'text';
	sendBar.className = 'sendBar';
	sendBar.onkeydown = async (event: KeyboardEvent): Promise<void> => {
		if (event.key === 'Enter') {
			sendBar.value = JSON.stringify(Array.from(new Uint8Array(await crypto.subtle.encrypt(
				{ name: 'AES-CBC', iv: aesKeys[to][0] },
				aesKeys[to][1],
				new Uint8Array(new TextEncoder().encode(sendBar.value)),
			))));
			if (editing)
				send(to, {
					from: peer.id,
					body: sendBar.value,
					time: 'edited at ' + new Date().toLocaleTimeString(),
					id: editing,
					event: MessageDataEvent.Edit,
					prev: replying,
				});
			else
				send(to, {
					from: peer.id,
					body: sendBar.value,
					time: new Date().toLocaleTimeString(),
					id: crypto.randomUUID(),
					prev: replying,
				});
			sendBar.value = '';
			replying = undefined;
		} else if (sendBar.value.length === 0 && event.key != 'Backspace')
			send(to, {
				from: peer.id,
				body: '',
				time: '',
				id: '',
				event: MessageDataEvent.Typing,
			});
		else if (sendBar.value.length === 1 && event.key === 'Backspace')
			send(to, {
				from: peer.id,
				body: '',
				time: '',
				id: '',
				event: MessageDataEvent.StopTyping,
			});
	};
	el.insertAdjacentElement('afterend', sendBar);
	sendBar.focus();
	return el;
}

const send = (to: string, messageData: MessageData): void => {
	const conn: DataConnection = peer.connect(to);
	conn.on('open', async (): Promise<void> => {
		const data: string = JSON.stringify(messageData);
		conn.send(data);
		console.log(`SENT: ${data}`);
		switch (messageData.event) {
			case MessageDataEvent.RSAKeyShare:
			case MessageDataEvent.AESKeyShare:
			case MessageDataEvent.Typing:
			case MessageDataEvent.StopTyping:
				break;
			case MessageDataEvent.Edit:
				(document.getElementById(editing as string) as HTMLSpanElement).innerHTML = `${
					new TextDecoder().decode(await crypto.subtle.decrypt(
						{ name: 'AES-CBC', iv: aesKeys[to][0] },
						aesKeys[to][1],
						new Uint8Array(JSON.parse(messageData.body)),
					))
				} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				break;
			default:
				const paragraph: HTMLParagraphElement = document.createElement('p');
				paragraph.innerHTML = `${
					
				messageData.event !== MessageDataEvent.Delivered ? new TextDecoder().decode(await crypto.subtle.decrypt(
						{ name: 'AES-CBC', iv: aesKeys[to][0] },
						aesKeys[to][1],
						new Uint8Array(JSON.parse(messageData.body)),
					)) : messageData.body
				} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				paragraph.className = 'sent';
				paragraph.id = messageData.id;
				paragraph.onclick = (ev: MouseEvent): void => {
					ev.preventDefault();
					console.log(`REPLYING: ${paragraph.id}`);
					replying = paragraph.id;
					((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).focus();
				}
				paragraph.ondblclick = (ev: MouseEvent): void => {
					ev.preventDefault();
					console.log(`EDITING: ${paragraph.id}`);
					replying = undefined;
					if (editing) {
						const prev: HTMLSpanElement = document.getElementById(editing) as HTMLSpanElement;
						prev.innerHTML = prev.innerHTML.replace(/ (<small>){3}<i>✎<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✓</i></small></small></small>');
					}
					editing = paragraph.id;
					if (paragraph.innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>')) {
						paragraph.innerHTML = paragraph.innerHTML.replace(/ (<small>){3}<i>✓<\/i>(<\/small>){3}$/g, ' <small><small><small><i>✎</i></small></small></small>');
						((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).value = paragraph.innerHTML.replace(/( (<small>){3}<i>.*<\/i>(<\/small>){3})+$/g, '');
					} else
						throw new Error('Cannot Edit Non-Delivered Message.');
					((paragraph.parentNode as HTMLSpanElement).nextSibling as HTMLInputElement).focus();
				}
				const el: HTMLSpanElement = document.getElementById(to) as HTMLSpanElement;
				if (el.lastChild && (el.lastChild as Element).className === 'typing')
					el.insertBefore(paragraph, el.lastChild);
				else
					el.insertAdjacentElement('beforeend', paragraph);
				break;
		}
	});
}

const check = (): void => {
	if (peer.id) {
		(document.getElementById('id') as HTMLSpanElement).innerHTML += `User ID: ${peer.id}`;
		return;
	}
	setTimeout(check, 50);
}
check();
