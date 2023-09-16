declare class DataConnection {
	send(data: any): void;
	close(): void;
	on(event: 'data', callback: (data: any) => void): void;
	on(event: 'open', callback: () => void): void;
	on(event: 'close', callback: () => void): void;
	on(event: 'error', callback: (err: Error) => void): void;
	dataChannel: object;
	label: string;
	metadata: any;
	open: boolean;
	peerConnection: object;
	peer: string;
	reliable: boolean;
	serialization: string;
	type: string;
	bufferSize: number;
}

declare class MediaConnection {
	answer(stream: MediaStream, options?: {
		sdpTransform?: object
	}): void;
	close(): void;
	on(event: 'stream', callback: (stream: MediaStream) => void): void;
	on(event: 'close', callback: () => void): void;
	on(event: 'error', callback: (err: Error) => void): void;
	open: boolean;
	metadata: any;
	peer: string;
	type: string;
}

declare class util {
	browser: string;
	supports: {
		audioVideo: boolean,
		data: boolean,
		binary: boolean,
		reliable: boolean,
	};
}

declare class Peer {
	constructor(id?: string, options?: {
		key?: string,
		host?: string,
		port?: number,
		pingInterval?: number,
		path?: string,
		secure?: boolean,
		config?: object,
		debug?: number,
	});
	call(id: string, stream: MediaStream, options?: {
		metadata?: object,
		sdpTransform?: Function,
	}): MediaConnection;
	connect(id: string, options?: {
		label?: string,
		metadata?: any,
		serialization?: string,
		reliable?: boolean,
	}): DataConnection;
	on(event: 'open', callback: (id: string) => void): void;
	on(event: 'connection', callback: (dataConnection: DataConnection) => void): void;
	on(event: 'call', callback: (mediaConnection: MediaConnection) => void): void;
	on(event: 'close', callback: () => void): void;
	on(event: 'disconnected', callback: () => void): void;
	on(event: 'error', callback: (err: Error) => void): void;
	disconnect(): void;
	reconnect(): void;
	destroy(): void;
	id: string;
	connections: object;
	disconnected: boolean;
	destroyed: boolean;
}

enum MessageDataEvent {
	Typing,
	StopTyping,
	Edit,
	Reaction,
	Effect,
	Delivered,
};

interface MessageData {
	from: string,
	body: string,
	time: string,
	event?: MessageDataEvent,
};

const peer: Peer = new Peer();
peer.on('connection', function (dataConnection: DataConnection) {
	dataConnection.on('data', function (data: string) {
		const messageData: MessageData = JSON.parse(data);
		let el: HTMLSpanElement | null = document.getElementById(messageData.from) as HTMLSpanElement | null;
		if (!el)
			el = createChat(messageData.from);
		const paragraph: HTMLParagraphElement = document.createElement('p');
		switch (messageData.event) {
			case MessageDataEvent.Typing:
				paragraph.innerHTML = 'Typing...';
				paragraph.className = 'typing';
				if (el.lastChild && (el.lastChild as Element).className == 'typing')
					return;
				break;
			case MessageDataEvent.StopTyping:
				if (el.lastChild && (el.lastChild as Element).className == 'typing')
					el.removeChild(el.lastChild);
				return;
			case MessageDataEvent.Delivered:
				let i: number;
				for (i = el.children.length - 1; i >= 0; i--)
					if (!el.children[i].innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>'))
						break;
				el.children[i].innerHTML += ' <small><small><small><i>✓</i></small></small></small>';
				return;
			default:
				paragraph.innerHTML = `${messageData.body} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				paragraph.className = 'received';
				if (el.lastChild && (el.lastChild as Element).className == 'typing')
					el.removeChild(el.lastChild);
				send(messageData.from, {
					from: peer.id,
					body: '',
					time: '',
					event: MessageDataEvent.Delivered,
				});
		}
		el.insertAdjacentElement('beforeend', paragraph);
	});
});

const createChat = (to: string): HTMLSpanElement => {
	const el = document.createElement('span');
	el.className = 'message';
	el.id = to;
	el.innerHTML = `<u>${to}</u>`
	document.body.insertAdjacentElement('beforeend', el);

	const sendBar: HTMLInputElement = document.createElement('input');
	sendBar.type = 'text';
	sendBar.className = 'sendBar';
	sendBar.onkeydown = (event: KeyboardEvent): void => {
		if (event.key == 'Enter') {
			send(to, { from: peer.id, body: sendBar.value, time: new Date().toLocaleTimeString() });
			sendBar.value = '';
		} else
			send(to, {
				from: peer.id,
				body: '',
				time: '',
				event: (event.key == 'Backspace' && sendBar.value.length <= 1) ?
					MessageDataEvent.StopTyping : MessageDataEvent.Typing,
			});
	};
	el.insertAdjacentElement('afterend', sendBar);
	return el;
}

const send = (to: string, messageData: MessageData): void => {
	const conn: DataConnection = peer.connect(to);
	conn.on('open', () => {
		conn.send(JSON.stringify(messageData));
		if (messageData.event == MessageDataEvent.Typing)
			return;
		const paragraph: HTMLParagraphElement = document.createElement('p');
		paragraph.innerHTML = `${messageData.body} <small><small><small><i>${messageData.time}</i></small></small></small>`;
		paragraph.className = 'sent';
		(document.getElementById(to) as HTMLSpanElement).insertAdjacentElement('beforeend', paragraph);
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
