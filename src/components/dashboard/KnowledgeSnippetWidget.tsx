import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sprout, RotateCw, Beaker, Lightbulb } from 'lucide-react';
import { getRandomKnowledgeTip, KnowledgeTip } from '@/lib/knowledge-base';
import { cn } from '@/lib/utils';
export function KnowledgeSnippetWidget() {
    const [tip, setTip] = useState<KnowledgeTip | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const refreshTip = () => {
        setIsAnimating(true);
        // Small delay for animation feel
        setTimeout(() => {
            setTip(getRandomKnowledgeTip());
            setIsAnimating(false);
        }, 300);
    };
    useEffect(() => {
        setTip(getRandomKnowledgeTip());
    }, []);
    if (!tip) return null;
    const getIcon = (iconType: string) => {
        switch (iconType) {
            case 'rotate': return <RotateCw className="h-5 w-5" />;
            case 'soil': return <Beaker className="h-5 w-5" />;
            case 'sprout': return <Sprout className="h-5 w-5" />;
            default: return <Lightbulb className="h-5 w-5" />;
        }
    };
    return (
        <Card className="bg-neutral-900 text-white overflow-hidden relative h-full flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 pointer-events-none" />
            <CardHeader className="pb-2 relative z-10 flex flex-row items-start justify-between space-y-0">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        {getIcon(tip.icon)}
                        <span>Agronomy Tip</span>
                    </CardTitle>
                    <CardDescription className="text-neutral-400 mt-1">
                        {tip.category.charAt(0).toUpperCase() + tip.category.slice(1)} Insight
                    </CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshTip}
                    className={cn("text-neutral-400 hover:text-white hover:bg-white/10", isAnimating && "animate-spin")}
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="relative z-10 flex-1 flex flex-col justify-center">
                <h4 className="font-medium text-emerald-300 mb-2">{tip.title}</h4>
                <p className="text-sm text-neutral-300 leading-relaxed">
                    {tip.content}
                </p>
            </CardContent>
        </Card>
    );
}