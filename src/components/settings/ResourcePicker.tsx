import React, { useState } from 'react';
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { InventoryItem } from '@shared/types';
interface ResourcePickerProps {
  selected: string[];
  onChange: (resources: string[]) => void;
  inventory: InventoryItem[];
  placeholder?: string;
  className?: string;
}
export function ResourcePicker({
  selected = [],
  onChange,
  inventory = [],
  placeholder = "Select resources...",
  className,
}: ResourcePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const handleSelect = (value: string) => {
    if (!selected.includes(value)) {
      onChange([...selected, value]);
    }
    setOpen(false);
    setInputValue("");
  };
  const handleRemove = (value: string) => {
    onChange(selected.filter((i) => i !== value));
  };
  const handleCreate = () => {
    if (inputValue.trim() && !selected.includes(inputValue.trim())) {
      onChange([...selected, inputValue.trim()]);
    }
    setOpen(false);
    setInputValue("");
  };
  // Filter inventory items that are not already selected
  // Deduplicate inventory items by name for the picker list
  const uniqueInventoryNames = Array.from(new Set(inventory.map(i => i.name)));
  const availableInventory = uniqueInventoryNames.filter(
    (name) => !selected.includes(name)
  );
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2 mb-1">
        {selected.map((resource) => (
          <Badge key={resource} variant="secondary" className="flex items-center gap-1 px-2 py-1">
            {resource}
            <button
              type="button"
              onClick={() => handleRemove(resource)}
              className="text-muted-foreground hover:text-foreground focus:outline-none ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search inventory or add custom..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty className="py-2 px-4 text-sm">
                {inputValue ? (
                  <button
                    className="flex items-center gap-2 text-emerald-600 w-full text-left"
                    onClick={handleCreate}
                  >
                    <Plus className="h-4 w-4" />
                    Add "{inputValue}"
                  </button>
                ) : (
                  "No items found."
                )}
              </CommandEmpty>
              {availableInventory.length > 0 && (
                <CommandGroup heading="Inventory Items">
                  {availableInventory.map((name) => (
                    <CommandItem
                      key={name}
                      value={name}
                      onSelect={() => handleSelect(name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(name) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {inputValue && !availableInventory.some(name => name.toLowerCase() === inputValue.toLowerCase()) && (
                 <>
                   <CommandSeparator />
                   <CommandGroup>
                     <CommandItem value={inputValue} onSelect={handleCreate}>
                       <Plus className="mr-2 h-4 w-4" />
                       Create "{inputValue}"
                     </CommandItem>
                   </CommandGroup>
                 </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}