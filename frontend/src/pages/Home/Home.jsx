import { useEffect, useRef, useState } from 'react'
import './Home.css'
import Chat from '../../components/Chat/Chat'
import InputArea from '../../components/InputArea/InputArea'
import SolutionSteps from '../../components/SolutionSteps/SolutionSteps'

const MAX_HINT_LEVEL = 3
const MAX_HISTORY_MESSAGES = 20
const MIN_SOLUTION_STEPS = 4
const MAX_SOLUTION_STEPS = 6
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

async function postJson(path, body, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}

function toApiHistory(messages) {
  return messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content }))
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasValidSolutionSteps(steps) {
  return (
    Array.isArray(steps) &&
    steps.length >= MIN_SOLUTION_STEPS &&
    steps.length <= MAX_SOLUTION_STEPS &&
    steps.every(isNonEmptyString)
  )
}

function Home({ steps: initialSteps, currentStep }) {
  const [question, setQuestion] = useState('')
  const [detailQuestion, setDetailQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [steps, setSteps] = useState(initialSteps)
  const [hintLevel, setHintLevel] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const activeRequest = useRef(null)
  const messageId = useRef(0)

  useEffect(() => () => activeRequest.current?.abort(), [])

  const nextMessage = (role, content) => {
    messageId.current += 1
    return { id: `message-${messageId.current}`, role, content }
  }

  const beginRequest = () => {
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setIsLoading(true)
    setError('')
    return controller
  }

  const finishRequest = (controller) => {
    if (activeRequest.current === controller) {
      activeRequest.current = null
      setIsLoading(false)
    }
  }

  const resetConversation = () => {
    activeRequest.current?.abort()
    activeRequest.current = null
    setMessages([])
    setSteps(initialSteps)
    setHintLevel(0)
    setIsLoading(false)
    setError('')
  }

  const handleQuestionChange = (value) => {
    setQuestion(value)
    resetConversation()
  }

  const handleSubmit = async () => {
    const normalizedQuestion = question.trim()
    if (!normalizedQuestion || isLoading) return

    const userContent = detailQuestion.trim()
      ? `${normalizedQuestion}\n追加質問: ${detailQuestion.trim()}`
      : normalizedQuestion
    const controller = beginRequest()

    try {
      const data = await postJson(
        '/chat',
        {
          question: userContent,
          history: toApiHistory(messages),
        },
        controller.signal,
      )
      if (
        !hasValidSolutionSteps(data.steps) ||
        !isNonEmptyString(data.hint)
      ) {
        throw new Error('Invalid chat response')
      }

      setSteps(data.steps)
      setHintLevel(1)
      setMessages([
        ...messages,
        nextMessage('user', userContent),
        nextMessage('assistant', data.hint.trim()),
      ])
      setDetailQuestion('')
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError('ヒントを取得できませんでした。時間をおいて再度お試しください。')
      }
    } finally {
      finishRequest(controller)
    }
  }

  const handleMoreHint = async () => {
    const nextHintLevel = hintLevel + 1
    if (!question.trim() || isLoading || nextHintLevel > MAX_HINT_LEVEL) return

    const controller = beginRequest()
    const userMessage = nextMessage('user', 'もう少し具体的なヒントを教えてください。')

    try {
      const data = await postJson(
        '/hint',
        {
          question: question.trim(),
          hint_level: nextHintLevel,
          steps,
          history: toApiHistory(messages),
        },
        controller.signal,
      )
      if (!isNonEmptyString(data.hint) || data.hint_level !== nextHintLevel) {
        throw new Error('Invalid hint response')
      }

      setHintLevel(nextHintLevel)
      setMessages([
        ...messages,
        userMessage,
        nextMessage('assistant', data.hint.trim()),
      ])
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError('追加のヒントを取得できませんでした。時間をおいて再度お試しください。')
      }
    } finally {
      finishRequest(controller)
    }
  }

  return (
    <main className="home">
      <InputArea
        question={question}
        detailQuestion={detailQuestion}
        onQuestionChange={handleQuestionChange}
        onDetailQuestionChange={setDetailQuestion}
        onSubmit={handleSubmit}
        onMoreHint={handleMoreHint}
        isLoading={isLoading}
        canRequestMoreHint={hintLevel > 0 && hintLevel < MAX_HINT_LEVEL}
        error={error}
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
