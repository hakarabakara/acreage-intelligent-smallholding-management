import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Tractor, ArrowLeft } from 'lucide-react';
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4 text-center">
      <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <Tractor className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Lost in the fields?</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for seems to have gone fallow. It might have been moved, deleted, or never existed.
      </p>
      <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
        </Link>
      </Button>
    </div>
  );
}