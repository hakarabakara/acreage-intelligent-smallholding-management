import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
interface PrintButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}
export function PrintButton({ className, variant = "outline", size = "sm" }: PrintButtonProps) {
  const handlePrint = () => {
    window.print();
  };
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handlePrint} 
      className={cn("gap-2", className)}
    >
      <Printer className="h-4 w-4" />
      <span className="hidden sm:inline">Print</span>
    </Button>
  );
}