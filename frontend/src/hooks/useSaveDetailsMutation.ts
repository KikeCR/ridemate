import { useMutation, useQueryClient } from "@tanstack/react-query"
import { saveDetails } from "../api/session"
import { SESSION_QUERY_KEY } from "./useSessionQuery"
import type { DetailsPayload } from "../types/session"

export function useSaveDetailsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DetailsPayload) => saveDetails(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}
