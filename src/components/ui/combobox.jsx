import * as React from "react"
import { ChevronsUpDown, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({ options, value, onValueChange, placeholder = "Selecionar..." }) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = (currentValue) => {
    onValueChange(currentValue === value ? "" : currentValue)
    setOpen(false)
    setInputValue("")
  }

  const handleInputChange = (newValue) => {
    setInputValue(newValue)
  }

  const handleCreateNew = () => {
    if (inputValue.trim()) {
      onValueChange(inputValue.trim())
      setInputValue("")
      setOpen(false)
    }
  }

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  )

  const showCreateOption = inputValue.trim() && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9"
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {showCreateOption ? (
                <div className="p-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleCreateNew}
                  >
                    Criar "{inputValue}"
                  </Button>
                </div>
              ) : (
                "Nenhuma opção encontrada."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
