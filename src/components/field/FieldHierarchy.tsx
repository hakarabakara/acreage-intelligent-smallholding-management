import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, MapPin, Layers, Sprout } from 'lucide-react';
import type { Field } from '@shared/types';
import { cn } from '@/lib/utils';
interface FieldHierarchyProps {
  fields: Field[];
  onSelectField: (id: string) => void;
}
interface TreeNodeProps {
  field: Field;
  allFields: Field[];
  level: number;
  onSelect: (id: string) => void;
}
function TreeNode({ field, allFields, level, onSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = allFields.filter(f => f.parentId === field.id);
  const hasChildren = children.length > 0;
  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
          level > 0 && "ml-6"
        )}
        onClick={() => onSelect(field.id)}
      >
        <div 
          className="p-1 rounded-sm hover:bg-muted text-muted-foreground"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-1">
          {level === 0 ? (
            <Layers className="h-4 w-4 text-blue-500" />
          ) : (
            <MapPin className="h-4 w-4 text-emerald-500" />
          )}
          <span className="font-medium text-sm">{field.name}</span>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">
            {field.type || 'field'}
          </Badge>
          {field.currentCrop && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Sprout className="h-3 w-3" />
              <span>{field.currentCrop}</span>
            </div>
          )}
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="border-l border-border/50 ml-[1.15rem]">
          {children.map(child => (
            <TreeNode 
              key={child.id} 
              field={child} 
              allFields={allFields} 
              level={level + 1} 
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export function FieldHierarchy({ fields, onSelectField }: FieldHierarchyProps) {
  const rootFields = fields.filter(f => !f.parentId);
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Land Hierarchy
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No fields defined.
          </div>
        ) : (
          <div className="space-y-1">
            {rootFields.map(field => (
              <TreeNode 
                key={field.id} 
                field={field} 
                allFields={fields} 
                level={0} 
                onSelect={onSelectField}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}