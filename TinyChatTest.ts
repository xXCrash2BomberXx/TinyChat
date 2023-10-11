const { JSDOM } = require("jsdom");

class Client {
	dom: any;
	constructor() {
		this.dom = new JSDOM('', {
			url: "file://TinyChat.html",
			includeNodeLocations: true,
			runScripts: 'dangerously'
		});
	}

	send(message: string, to?: string): void {
		if (to) {
			const createChat: HTMLInputElement = this.dom.window.document.getElementById('to');
			createChat.value = to;
			createChat.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', which: 13, keyCode: 13, }));
		}
		const messages = this.dom.window.document.getElementsByClassName('message');
		const send = messages[messages.length-1].nextElementSibling;
		send.value = message;
		send.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', which: 13, keyCode: 13, }));
	}

	getMessages(from?: string): HTMLSpanElement {
		if (from)
			return this.dom.window.document.getElementById(from);
		return this.dom.window.document.body.lastChild.children[2];
	}

	getId() {
		return this.dom.window.document.body.children[1].innerHTML.slice('User ID: '.length)
	}
}
