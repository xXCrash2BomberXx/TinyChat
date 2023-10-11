const { JSDOM } = require("jsdom");

class Client {
	private document: Document;
	constructor() {
		this.document = null as unknown as Document;
		return JSDOM.fromFile('TinyChat.html', {
			runScripts: 'dangerously',
			resources: 'usable',
			pretendToBeVisual: true,
			includeNodeLocations: true
		}).then((dom: any): this => {
			this.document = dom.window.document;
			return this;
		});
	}

	send(message: string, to?: string): void {
		if (to) {
			const createChat: HTMLInputElement = this.document.getElementById('to') as HTMLInputElement;
			createChat.value = to;
			createChat.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', which: 13, keyCode: 13, }));
		}
		const messages = this.document.getElementsByClassName('message');
		const send = messages[messages.length-1].nextElementSibling as HTMLInputElement;
		send.value = message;
		send.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', which: 13, keyCode: 13, }));
	}

	getMessages(from?: string): HTMLSpanElement {
		if (from)
			return this.document.getElementById(from) as HTMLSpanElement;
		return (this.document.body.lastChild as HTMLDetailsElement).children[2] as HTMLSpanElement;
	}

	getId(): string {
		const check: () => void = (): void => {
			if (!this.document.body.children[1].innerHTML.slice('User ID: '.length))
				setTimeout(check, 50);
		}
		check();
		return this.document.body.children[1].innerHTML.slice('User ID: '.length);
	}
}

let tests: {[key: string]: () => Promise<boolean>} = {
	'Send Message': (async (): Promise<boolean> => {
		const sender: Client = await new Client();
		const receiver: Client = await new Client();
		sender.send('test message', receiver.getId());
		return (receiver.getMessages(sender.getId()).lastChild as HTMLParagraphElement).innerHTML.slice(0, 12) === 'test message';
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
