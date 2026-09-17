import React from "react"
import { RouterProvider } from "react-router-dom"
import { QueryProvider } from "./app/providers/QueryProvider"
import { ThemeProvider } from "./app/providers/ThemeProvider"
import { TenantProvider } from "./app/providers/TenantProvider"
import { AuthProvider } from "./app/providers/AuthProvider"
import { router } from "./app/router/routes"

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="light">
        <TenantProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </TenantProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
