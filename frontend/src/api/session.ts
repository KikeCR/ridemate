import { apiFetch } from "./client"
import type { DetailsPayload, SessionEnvelope, ValidatePayload } from "../types/session"

export function fetchSession(): Promise<SessionEnvelope> {
  return apiFetch<SessionEnvelope>("/api/session")
}

export function saveDetails(payload: DetailsPayload): Promise<SessionEnvelope> {
  return apiFetch<SessionEnvelope>("/api/session/details", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function validateSession(payload: ValidatePayload = {}): Promise<SessionEnvelope> {
  return apiFetch<SessionEnvelope>("/api/session/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function goLive(): Promise<SessionEnvelope> {
  return apiFetch<SessionEnvelope>("/api/session/go-live", {
    method: "POST",
    body: JSON.stringify({}),
  })
}
