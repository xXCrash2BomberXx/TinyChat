const { JSDOM } = require("jsdom");
const { Crypto } = require('@peculiar/webcrypto');
global.navigator = Object.create({}, {
	platform: {
		value: 'Node.js',
		enumerable: true,
		writable: false,
		configurable: true
	}
});
const { Peer } = require('peerjs');
const { Client } = require('./TinyChat.js');
const createDocument: () => Promise<Window> = async (): Promise<Window> => {
	return new Promise((resolve: (value: (Window | Promise<Window>)) => void, reject: (reason?: any) => void): void => {
		JSDOM.fromFile('TinyChat.html', {}).then((dom: any): void => resolve(dom.window));
	});
};

let tests: { [key: string]: () => Promise<boolean> } = {
	'Send Message': (async (): Promise<boolean> => {
		const sender: Client = await new Client(await createDocument(), new Crypto());
		const receiver: Client = await new Client(await createDocument(), new Crypto());
		await sender.sendMessage(receiver.getID(), 'test message');
		return (receiver.getMessages(sender.getID()).lastChild as HTMLParagraphElement).innerHTML.slice(0, 12) === 'test message';
	}),
};

for (const test in tests)
	(async (test: string): Promise<void> => {
		if (!(await tests[test]())) {
			console.error(`Failed Test: ${test}`);
			process.exit(1);
		} else
			console.log(`Passes Test: ${test}`);
	})(test);
