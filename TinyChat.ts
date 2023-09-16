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
	id: string,
	event?: MessageDataEvent,
};

var editing: string | null = null;

const peer: Peer = new Peer();
peer.on('connection', (dataConnection: DataConnection): void => {
	dataConnection.on('data', (data: string): void => {
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
				paragraph.id = messageData.id;
				el.insertAdjacentElement('beforeend', paragraph);
				break;
			case MessageDataEvent.StopTyping:
				if (el.lastChild && (el.lastChild as Element).className == 'typing')
					el.removeChild(el.lastChild);
				break;
			case MessageDataEvent.Delivered:
				let i: number;
				for (i = el.children.length - 1; i >= 0; i--)
					if (el.children[i].id == messageData.id && !el.children[i].innerHTML.endsWith(' <small><small><small><i>✓</i></small></small></small>'))
						break;
				el.children[i].innerHTML += ' <small><small><small><i>✓</i></small></small></small>';
				break;
			case MessageDataEvent.Edit:
				(document.getElementById(messageData.id) as HTMLSpanElement).innerHTML = `${messageData.body} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				if (el.lastChild && (el.lastChild as Element).className == 'typing')
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
				paragraph.innerHTML = `${messageData.body} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				paragraph.className = 'received';
				if (el.lastChild && (el.lastChild as Element).className == 'typing')
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
			if (editing)
				send(to, {
					from: peer.id,
					body: sendBar.value,
					time: 'edited at ' + new Date().toLocaleTimeString(),
					id: editing,
					event: MessageDataEvent.Edit,
				});
			else
				send(to, {
					from: peer.id,
					body: sendBar.value,
					time: new Date().toLocaleTimeString(),
					id: crypto.randomUUID(),
				});
			sendBar.value = '';
		} else if (sendBar.value.length == 0 && event.key != 'Backspace')
			send(to, {
				from: peer.id,
				body: '',
				time: '',
				id: crypto.randomUUID(),
				event: MessageDataEvent.Typing,
			});
		else if (sendBar.value.length == 1 && event.key == 'Backspace')
			send(to, {
				from: peer.id,
				body: '',
				time: '',
				id: crypto.randomUUID(),
				event: MessageDataEvent.StopTyping,
			});
	};
	el.insertAdjacentElement('afterend', sendBar);
	return el;
}

const send = (to: string, messageData: MessageData): void => {
	const conn: DataConnection = peer.connect(to);
	conn.on('open', () => {
		conn.send(JSON.stringify(messageData));
		switch (messageData.event) {
			case MessageDataEvent.Typing:
			case MessageDataEvent.StopTyping:
				break;
			case MessageDataEvent.Edit:
				(document.getElementById(editing as string) as HTMLSpanElement).innerHTML = `${messageData.body} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				break;
			default:
				const paragraph: HTMLParagraphElement = document.createElement('p');
				paragraph.innerHTML = `${messageData.body} <small><small><small><i>${messageData.time}</i></small></small></small>`;
				paragraph.className = 'sent';
				paragraph.id = messageData.id;
				paragraph.ondblclick = (ev: MouseEvent): void => {
					ev.preventDefault();
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
				}
				const el: HTMLSpanElement = document.getElementById(to) as HTMLSpanElement;
				if (el.lastChild && (el.lastChild as Element).className == 'typing')
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
