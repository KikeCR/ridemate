import { useMutation, useQueryClient } from "@tanstack/react-query"
import { goLive } from "../api/session"
import { SESSION_QUERY_KEY } from "./useSessionQuery"

export function useGoLiveMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => goLive(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}
