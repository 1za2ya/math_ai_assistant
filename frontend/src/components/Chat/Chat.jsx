import './Chat.css'

function Chat({ messages }) {
  return (
    <section className="chat" aria-labelledby="chat-title">
      <div className="chat__heading">
        <p className="chat__eyebrow">AIチャット</p>
        <h2 id="chat-title">AIチャット</h2>
      </div>

      <ol className="chat__messages" aria-label="会話履歴">
        {messages.length === 0 && (
          <li className="chat__empty">問題を送信すると、ここに会話が表示されます。</li>
        )}
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
