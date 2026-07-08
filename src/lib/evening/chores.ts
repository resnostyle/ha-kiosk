import type { HassEntity } from 'home-assistant-js-websocket'
import { isEntityAvailable } from '../ha/utils'

const DONE_STATES = new Set(['approved', 'completed', 'done'])

export function choreIsOutstanding(entity: HassEntity | undefined): boolean {
  if (!isEntityAvailable(entity)) return false
  const globalState = entity?.attributes?.global_state
  if (typeof globalState === 'string' && DONE_STATES.has(globalState)) return false
  const state = entity?.state ?? ''
  if (DONE_STATES.has(state)) return false
  return state === 'pending' || state === 'claimed' || state === 'overdue'
}

export function choreStatusLabel(entity: HassEntity | undefined): string {
  if (!isEntityAvailable(entity)) return 'offline'
  const globalState = entity?.attributes?.global_state
  if (typeof globalState === 'string' && globalState.length > 0) return globalState
  return entity?.state ?? 'unknown'
}
