import './Chat.css'

const messages = [
  {
    id: 'user-1',
    role: 'user',
    content: '2x + 5 = 17 の解き方を教えてください。',
  },
  {
    id: 'assistant-1',
    role: 'assistant',
    content: 'まず、両辺から 5 を引いてみましょう。すると 2x = 12 になります。',
  },
]

function Chat() {
  return (
    <section className="chat" aria-labelledby="chat-title">
      <div className="chat__heading">
        <p className="chat__eyebrow">AIチャット</p>
        <h2 id="chat-title">AIチャット</h2>
      </div>

      <ol className="chat__messages" aria-label="会話履歴">
        {messages.map((message) => (
          <li className={`chat__message chat__message--${message.role}`} key={message.id}>
            <p className="chat__sender">{message.role === 'assistant' ? 'AI' : 'あなた'}</p>
            <p className="chat__bubble">{message.content}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default Chat
