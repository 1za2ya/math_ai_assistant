import assert from 'node:assert/strict'
import test from 'node:test'

import { MAX_HISTORY_MESSAGES, toApiHistory } from './conversationHistory.js'

test('APIへは直近の履歴だけをUI用idなしで渡す', () => {
  const messages = Array.from(
    { length: MAX_HISTORY_MESSAGES + 2 },
    (_, index) => ({
      id: `message-${index}`,
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `message ${index}`,
    }),
  )

  const history = toApiHistory(messages)

  assert.equal(history.length, MAX_HISTORY_MESSAGES)
  assert.deepEqual(history[0], { role: 'user', content: 'message 2' })
  assert.deepEqual(history.at(-1), {
    role: 'assistant',
    content: `message ${MAX_HISTORY_MESSAGES + 1}`,
  })
  assert.ok(history.every((message) => !('id' in message)))
})

test('履歴が空でも空配列を返す', () => {
  assert.deepEqual(toApiHistory([]), [])
})
