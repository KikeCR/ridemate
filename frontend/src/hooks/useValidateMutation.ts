import { useMutation, useQueryClient } from "@tanstack/react-query"
import { validateSession } from "../api/session"
import { SESSION_QUERY_KEY } from "./useSessionQuery"
import type { ValidatePayload } from "../types/session"

export function useValidateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ValidatePayload = {}) => validateSession(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}
