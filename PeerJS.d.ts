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

//@ts-ignore: 2300, 2451
declare class Peer {
	constructor(options?: {
		key?: string,
		host?: string,
		port?: number,
		pingInterval?: number,
		path?: string,
		secure?: boolean,
		config?: object,
		polyfills?: {
			fetch?: any;
			WebSocket?: any;
			WebRTC?: any;
			FileReader?: any;
		},
		debug?: number,
	}, id?: string);
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
