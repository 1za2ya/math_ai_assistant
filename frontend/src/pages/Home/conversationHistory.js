export const MAX_HISTORY_MESSAGES = 20

export function toApiHistory(messages) {
  return messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content }))
}
