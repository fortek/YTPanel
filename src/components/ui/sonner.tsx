"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-zinc-50 group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-zinc-400",
          actionButton: "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-50",
          cancelButton: "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-50",
          error: "group-[.toaster]:!bg-red-900/50",
          success: "group-[.toaster]:!bg-green-900/50",
        },
      }}
      position="top-right"
      expand={true}
      richColors={true}
      duration={5000}
      {...props}
    />
  )
}

export { Toaster }
