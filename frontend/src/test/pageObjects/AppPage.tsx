import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { expect } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import App from "../../App"

export class AppPage {
  static async render() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    )
    await waitFor(() => {
      expect(screen.queryByText("Loading your session...")).not.toBeInTheDocument()
    })
    return new AppPage()
  }

  text(value: string) {
    return screen.getByText(value)
  }

  queryText(value: string) {
    return screen.queryByText(value)
  }

  queryLabel(value: string) {
    return screen.queryByLabelText(value)
  }

  clickButton(name: string) {
    fireEvent.click(screen.getByRole("button", { name }))
    return this
  }
}
