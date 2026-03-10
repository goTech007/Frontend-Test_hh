"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface KeywordsInputProps {
  value: string[]
  onChange: (keywords: string[]) => void
  placeholder?: string
  className?: string
}

export function KeywordsInput({ value, onChange, placeholder = "Добавить ключевое слово...", className }: KeywordsInputProps) {
  const [inputValue, setInputValue] = React.useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault()
      const newKeyword = inputValue.trim().replace(/,$/, "")
      if (newKeyword && !value.includes(newKeyword)) {
        onChange([...value, newKeyword])
      }
      setInputValue("")
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeKeyword = (keyword: string) => {
    onChange(value.filter((k) => k !== keyword))
  }

  return (
    <div className={cn("flex flex-wrap gap-2 rounded-md border border-input bg-background p-2 min-h-[42px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
      {value.map((keyword) => (
        <Badge key={keyword} variant="secondary" className="gap-1 text-sm">
          {keyword}
          <button
            type="button"
            onClick={() => removeKeyword(keyword)}
            className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 border-0 p-0 h-auto shadow-none focus-visible:ring-0 min-w-[120px]"
      />
    </div>
  )
}
