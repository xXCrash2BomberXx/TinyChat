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

const peer: Peer = new Peer();
peer.on('connection', function (dataConnection: DataConnection) {
	dataConnection.on('data', function (data: string) {
		const split: Array<string> = data.split(/\|(.*)/s);
		let el: HTMLTextAreaElement | null = document.getElementById(split[0]) as HTMLTextAreaElement | null;
		if (el)
			el.value += '\n' + split[1];
		else {
			el = new HTMLTextAreaElement();
			el.id = split[0];
			el.disabled = true;
			el.value = split[0] + "\n" + split[1];
			document.body.insertAdjacentElement('beforeend', el);
		}
	});
});

function send() {
	const to: HTMLInputElement = document.getElementById("to") as HTMLInputElement;
	const message: HTMLInputElement = document.getElementById("message") as HTMLInputElement;
	const conn: DataConnection = peer.connect(to.value);
	conn.on('open', () => {
		conn.send(peer.id + "|" + message);
		let el: HTMLTextAreaElement | null = document.getElementById(to.value) as HTMLTextAreaElement | null;
		if (el)
			el.value += '\n' + message;
		else {
			el = new HTMLTextAreaElement();
			el.id = to.value;
			el.disabled = true;
			el.value = to.value + "\n" + message.value;
			document.body.insertAdjacentElement('beforeend', el);
		}
	});
}
