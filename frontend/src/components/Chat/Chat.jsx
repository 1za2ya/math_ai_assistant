import './Chat.css'

function Chat({ messages }) {
  return (
    <section className="chat" aria-labelledby="chat-title">
      <div className="chat__heading">
        <p className="chat__eyebrow">AIチャット</p>
        <h2 id="chat-title">AIチャット</h2>
      </div>

      <div aria-live="polite">
        {messages.length === 0 ? (
          <p className="chat__empty">取得したヒントがここに表示されます。</p>
        ) : (
          <ol className="chat__messages" aria-label="会話履歴">
            {messages.map((message) => (
              <li className={`chat__message chat__message--${message.role}`} key={message.id}>
                <p className="chat__sender">{message.role === 'assistant' ? 'AI' : 'あなた'}</p>
                <p className="chat__bubble">{message.content}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

export default Chat
