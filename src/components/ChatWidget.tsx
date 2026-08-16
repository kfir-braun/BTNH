import { useState } from 'preact/hooks';

type Message = {
	role: 'user' | 'assistant';
	text: string;
};

/**
 * Shell only: UI for the persistent AI assistant widget, no backend wired
 * up yet. Sending a message will eventually hit a Worker endpoint backed
 * by a per-session Durable Object; for now it just echoes locally so the
 * widget is visibly interactive during development.
 */
export default function ChatWidget() {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState('');
	const [messages, setMessages] = useState<Message[]>([
		{
			role: 'assistant',
			text: "Hey! I'm the BTNH base-building assistant (not wired up to Claude yet). Ask me about layouts, infrastructure, aesthetics, or efficiency.",
		},
	]);

	function send(e: Event) {
		e.preventDefault();
		const text = input.trim();
		if (!text) return;
		setMessages((prev) => [
			...prev,
			{ role: 'user', text },
			{ role: 'assistant', text: '(placeholder response — AI backend not connected yet)' },
		]);
		setInput('');
	}

	return (
		<div class="chat-widget">
			{open ? (
				<div class="chat-panel">
					<div class="chat-header">
						<span>BTNH Assistant</span>
						<button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
							×
						</button>
					</div>
					<div class="chat-messages">
						{messages.map((m, i) => (
							<div class={`chat-message chat-message--${m.role}`} key={i}>
								{m.text}
							</div>
						))}
					</div>
					<form class="chat-input" onSubmit={send}>
						<input
							type="text"
							value={input}
							placeholder="Ask about base building..."
							onInput={(e) => setInput((e.target as HTMLInputElement).value)}
						/>
						<button type="submit">Send</button>
					</form>
				</div>
			) : (
				<button type="button" class="chat-bubble" onClick={() => setOpen(true)} aria-label="Open chat">
					💬
				</button>
			)}

			<style>{`
				.chat-widget {
					position: fixed;
					bottom: 1.5rem;
					right: 1.5rem;
					z-index: 50;
					font-family: system-ui, sans-serif;
				}
				.chat-bubble {
					width: 3.25rem;
					height: 3.25rem;
					border-radius: 50%;
					border: none;
					background: #2a6df0;
					color: white;
					font-size: 1.4rem;
					cursor: pointer;
					box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
				}
				.chat-panel {
					width: 320px;
					max-height: 440px;
					display: flex;
					flex-direction: column;
					background: #1c1c1c;
					color: #eee;
					border-radius: 12px;
					overflow: hidden;
					box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
				}
				.chat-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 0.6rem 0.9rem;
					background: #2a6df0;
					font-weight: 600;
				}
				.chat-header button {
					background: none;
					border: none;
					color: white;
					font-size: 1.1rem;
					cursor: pointer;
				}
				.chat-messages {
					flex: 1;
					overflow-y: auto;
					padding: 0.75rem;
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
					font-size: 0.9rem;
				}
				.chat-message {
					padding: 0.5rem 0.65rem;
					border-radius: 8px;
					max-width: 85%;
				}
				.chat-message--assistant {
					background: #2a2a2a;
					align-self: flex-start;
				}
				.chat-message--user {
					background: #2a6df0;
					align-self: flex-end;
				}
				.chat-input {
					display: flex;
					border-top: 1px solid #2a2a2a;
				}
				.chat-input input {
					flex: 1;
					padding: 0.6rem;
					background: none;
					border: none;
					color: inherit;
				}
				.chat-input input:focus {
					outline: none;
				}
				.chat-input button {
					padding: 0 0.9rem;
					border: none;
					background: #2a6df0;
					color: white;
					cursor: pointer;
				}
			`}</style>
		</div>
	);
}
