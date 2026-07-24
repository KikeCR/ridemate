import { useMutation, useQueryClient } from "@tanstack/react-query"
import { retryValidationItem } from "../api/session"
import { SESSION_QUERY_KEY } from "./useSessionQuery"

export function useRetryItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => retryValidationItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  })
}
