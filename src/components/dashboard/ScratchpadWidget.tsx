import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote } from 'lucide-react';
import { useScratchpadStore } from '@/lib/scratchpad-store';
export function ScratchpadWidget() {
  const content = useScratchpadStore((state) => state.content);
  const setContent = useScratchpadStore((state) => state.setContent);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  return (
    <Card className="h-full flex flex-col bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-200/50 dark:border-yellow-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-500">
          <StickyNote className="h-4 w-4" />
          Scratchpad
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[150px]">
        <Textarea
          value={content}
          onChange={handleChange}
          className="h-full resize-none border-0 focus-visible:ring-0 p-0 text-sm bg-transparent placeholder:text-yellow-700/30 dark:placeholder:text-yellow-500/30"
          placeholder="Quick notes, ideas, or reminders..."
        />
      </CardContent>
    </Card>
  );
}