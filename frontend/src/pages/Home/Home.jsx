import { useEffect, useReducer, useRef, useState } from 'react'
import './Home.css'
import Chat from '../../components/Chat/Chat'
import Diagram from '../../components/Diagram/Diagram'
import InputArea from '../../components/InputArea/InputArea'
import SolutionSteps from '../../components/SolutionSteps/SolutionSteps'
import { initialLearningProgress, learningProgressReducer } from './learningProgress'
import { EMPTY_DIAGRAM, normalizeSolutionResponse } from './solutionResponse'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function Home({ initialSteps }) {
  const [question, setQuestion] = useState('')
  const [detailQuestion, setDetailQuestion] = useState('')
  const [solutionSteps, setSolutionSteps] = useState(initialSteps)
  const [calculationSteps, setCalculationSteps] = useState([])
  const [diagram, setDiagram] = useState(EMPTY_DIAGRAM)
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
    setCalculationSteps([])
    setDiagram(EMPTY_DIAGRAM)
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
      const data = await postJson('/chat', { question: normalizedQuestion }, request.signal)
      if (activeRequest.current !== request) return
      const solution = normalizeSolutionResponse(data)
      if (solution === null) throw new Error('Invalid solution response')

      setSolutionSteps(solution.steps)
      setCalculationSteps(solution.calculationSteps)
      setDiagram(solution.diagram)
      setMessages([
        nextMessage('user', normalizedQuestion),
        nextMessage('assistant', solution.hint),
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
        },
        request.signal,
      )
      if (activeRequest.current !== request) return
      if (!isNonEmptyString(data.hint) || data.current_step !== nextStep) {
        throw new Error('Invalid hint response')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
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
        <Diagram calculationSteps={calculationSteps} diagram={diagram} />
      </div>

      <Chat messages={messages} />
    </main>
  )
}

export default Home
