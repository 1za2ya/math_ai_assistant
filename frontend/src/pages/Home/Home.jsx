import { useEffect, useRef, useState } from 'react'
import './Home.css'
import Chat from '../../components/Chat/Chat'
import InputArea from '../../components/InputArea/InputArea'
import SolutionSteps from '../../components/SolutionSteps/SolutionSteps'

const MAX_HINT_LEVEL = 3
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

function Home({ steps, currentStep }) {
  const [question, setQuestion] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [messages, setMessages] = useState([])
  const [isHintLoading, setIsHintLoading] = useState(false)
  const [hintError, setHintError] = useState('')
  const activeHintRequest = useRef(null)

  useEffect(() => {
    return () => {
      const request = activeHintRequest.current
      activeHintRequest.current = null
      request?.abort()
    }
  }, [])

  const handleQuestionChange = (value) => {
    activeHintRequest.current?.abort()
    activeHintRequest.current = null
    setQuestion(value)
    setHintLevel(0)
    setMessages([])
    setIsHintLoading(false)
    setHintError('')
  }

  const handleMoreHint = async () => {
    const normalizedQuestion = question.trim()
    if (!normalizedQuestion) {
      setHintError('問題を入力してください。')
      return
    }

    if (activeHintRequest.current || isHintLoading || hintLevel >= MAX_HINT_LEVEL) {
      return
    }

    const nextHintLevel = hintLevel + 1
    const request = new AbortController()
    activeHintRequest.current = request
    setIsHintLoading(true)
    setHintError('')

    try {
      const response = await fetch(`${API_BASE_URL}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: normalizedQuestion,
          hint_level: nextHintLevel,
        }),
        signal: request.signal,
      })

      if (!response.ok) {
        throw new Error('Hint request failed')
      }

      const data = await response.json()
      const hint = typeof data.hint === 'string' ? data.hint.trim() : ''
      if (!hint || data.hint_level !== nextHintLevel) {
        throw new Error('Invalid hint response')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-hint-${data.hint_level}`,
          role: 'assistant',
          content: hint,
        },
      ])
      setHintLevel(data.hint_level)
    } catch (error) {
      if (error.name !== 'AbortError') {
        setHintError('ヒントを取得できませんでした。時間をおいて再度お試しください。')
      }
    } finally {
      if (activeHintRequest.current === request) {
        activeHintRequest.current = null
        setIsHintLoading(false)
      }
    }
  }

  return (
    <main className="home">
      <InputArea
        question={question}
        onQuestionChange={handleQuestionChange}
        onMoreHint={handleMoreHint}
        isHintLoading={isHintLoading}
        hasReachedMaxHint={hintLevel >= MAX_HINT_LEVEL}
        error={hintError}
      />

      <div className="home__workspace">
        <SolutionSteps steps={steps} currentStep={currentStep} />

        <section className="home__panel home__diagram" aria-labelledby="diagram-title">
          <div className="home__section-heading">
            <p className="home__eyebrow">図・途中式</p>
            <h2 id="diagram-title">考え方を可視化</h2>
          </div>
          <p className="home__placeholder">図や途中式が表示されます。</p>
        </section>
      </div>

      <Chat messages={messages} />
    </main>
  )
}

export default Home
