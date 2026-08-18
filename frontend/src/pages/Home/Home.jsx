import { useEffect, useReducer, useRef, useState } from 'react'
import './Home.css'
import Chat from '../../components/Chat/Chat'
import InputArea from '../../components/InputArea/InputArea'
import SolutionSteps from '../../components/SolutionSteps/SolutionSteps'
import { initialLearningProgress, learningProgressReducer } from './learningProgress'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
const MIN_SOLUTION_STEPS = 4
const MAX_SOLUTION_STEPS = 6
const MAX_HISTORY_MESSAGES = 20

async function postJson(path, body, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
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

function Home({ initialSteps }) {
  const [question, setQuestion] = useState('')
  const [detailQuestion, setDetailQuestion] = useState('')
  const [solutionSteps, setSolutionSteps] = useState(initialSteps)
  const [messages, setMessages] = useState([])
  const [loadingAction, setLoadingAction] = useState(null)
  const [error, setError] = useState('')
  const [progress, dispatchProgress] = useReducer(
    learningProgressReducer,
    initialLearningProgress,
  )
  const activeRequest = useRef(null)
  const messageId = useRef(0)

  useEffect(() => () => activeRequest.current?.abort(), [])

  const nextMessage = (role, content) => {
    messageId.current += 1
    return { id: `message-${messageId.current}`, role, content }
  }

  const beginRequest = (action) => {
    const controller = new AbortController()
    activeRequest.current = controller
    setLoadingAction(action)
    setError('')
    return controller
  }

  const finishRequest = (controller) => {
    if (activeRequest.current === controller) {
      activeRequest.current = null
      setLoadingAction(null)
    }
  }

  const resetProblem = () => {
    activeRequest.current?.abort()
    activeRequest.current = null
    setDetailQuestion('')
    setSolutionSteps(initialSteps)
    setMessages([])
    setLoadingAction(null)
    setError('')
    dispatchProgress({ type: 'reset' })
  }

  const handleQuestionChange = (value) => {
    setQuestion(value)
    resetProblem()
  }

  const handleProblemSubmit = async () => {
    const normalizedQuestion = question.trim()
    if (!normalizedQuestion || activeRequest.current) return

    const request = beginRequest('problem')
    try {
      const data = await postJson(
        '/chat',
        {
          question: normalizedQuestion,
          history: toApiHistory(messages),
        },
        request.signal,
      )
      if (activeRequest.current !== request) return
      if (!hasValidSolutionSteps(data.steps) || !isNonEmptyString(data.hint)) {
        throw new Error('Invalid solution response')
      }

      setSolutionSteps(data.steps.map((step) => step.trim()))
      setMessages([
        nextMessage('user', normalizedQuestion),
        nextMessage('assistant', data.hint.trim()),
      ])
      dispatchProgress({ type: 'start' })
    } catch (requestError) {
      if (requestError.name !== 'AbortError' && activeRequest.current === request) {
        setError('問題を送信できませんでした。時間をおいて再度お試しください。')
      }
    } finally {
      finishRequest(request)
    }
  }

  const handleNextHint = async () => {
    const nextStep = progress.currentStep + 1
    if (
      !progress.hasStarted ||
      progress.userMarkedUnderstood ||
      nextStep >= solutionSteps.length ||
      activeRequest.current
    ) {
      return
    }

    const request = beginRequest('next')
    try {
      const data = await postJson(
        '/hint',
        {
          question: question.trim(),
          steps: solutionSteps,
          current_step: nextStep,
          history: toApiHistory(messages),
        },
        request.signal,
      )
      if (activeRequest.current !== request) return
      if (!isNonEmptyString(data.hint) || data.current_step !== nextStep) {
        throw new Error('Invalid hint response')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        nextMessage('user', '次の解法ステップのヒントを教えてください。'),
        nextMessage('assistant', data.hint.trim()),
      ])
      dispatchProgress({ type: 'advance', stepCount: solutionSteps.length })
    } catch (requestError) {
      if (requestError.name !== 'AbortError' && activeRequest.current === request) {
        setError('次のヒントを取得できませんでした。時間をおいて再度お試しください。')
      }
    } finally {
      finishRequest(request)
    }
  }

  const handleDetailSubmit = async () => {
    const normalizedDetail = detailQuestion.trim()
    if (!progress.hasStarted || !normalizedDetail || activeRequest.current) return

    const requestedStep = progress.currentStep
    const request = beginRequest('detail')
    try {
      const data = await postJson(
        '/detail',
        {
          question: question.trim(),
          steps: solutionSteps,
          current_step: requestedStep,
          detail_question: normalizedDetail,
          history: toApiHistory(messages),
        },
        request.signal,
      )
      if (activeRequest.current !== request) return
      if (!isNonEmptyString(data.explanation) || data.current_step !== requestedStep) {
        throw new Error('Invalid detail response')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        nextMessage('user', normalizedDetail),
        nextMessage('assistant', data.explanation.trim()),
      ])
      setDetailQuestion('')
      dispatchProgress({ type: 'details_received' })
    } catch (requestError) {
      if (requestError.name !== 'AbortError' && activeRequest.current === request) {
        setError('詳しい説明を取得できませんでした。時間をおいて再度お試しください。')
      }
    } finally {
      finishRequest(request)
    }
  }

  const handleUnderstood = () => {
    if (!progress.hasStarted || activeRequest.current) return
    dispatchProgress({ type: 'mark_understood' })
    setError('')
  }

  const isLastStep =
    progress.hasStarted && progress.currentStep >= solutionSteps.length - 1
  const isLoading = loadingAction !== null

  return (
    <main className="home">
      <InputArea
        question={question}
        detailQuestion={detailQuestion}
        onQuestionChange={handleQuestionChange}
        onDetailQuestionChange={setDetailQuestion}
        onProblemSubmit={handleProblemSubmit}
        onDetailSubmit={handleDetailSubmit}
        onNextHint={handleNextHint}
        onUnderstood={handleUnderstood}
        loadingAction={loadingAction}
        isLoading={isLoading}
        hasStarted={progress.hasStarted}
        isLastStep={isLastStep}
        isUnderstood={progress.userMarkedUnderstood}
        error={error}
      />

      <div className="home__workspace">
        <SolutionSteps steps={solutionSteps} currentStep={progress.currentStep} />

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
