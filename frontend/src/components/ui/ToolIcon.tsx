import React from 'react';
import {
  Sparkles,
  FileText,
  Languages,
  ScanText,
  EyeOff,
  Minimize2,
  FileSpreadsheet,
  FileType,
  Table,
  FileCheck,
  Presentation,
  FileSliders,
  Image,
  Images,
  Code,
  FileImage,
  Layers,
  Scissors,
  Trash2,
  Copy,
  Grid,
  Crop,
  Hash,
  Lock,
  Unlock,
  Stamp,
  PenTool,
  RotateCw,
  ScanLine,
  GitCompare,
  Palette,
  Wrench
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  FileText,
  Languages,
  ScanText,
  EyeOff,
  Minimize2,
  FileSpreadsheet,
  FileType,
  Table,
  FileCheck,
  Presentation,
  FileSliders,
  Image,
  Images,
  Code,
  FileImage,
  Layers,
  Scissors,
  Trash2,
  Copy,
  Grid,
  Crop,
  Hash,
  Lock,
  Unlock,
  Stamp,
  PenTool,
  RotateCw,
  ScanLine,
  GitCompare,
  Palette,
  Wrench
};

export const ToolIcon: React.FC<{ name: string; className?: string }> = ({
  name,
  className = 'w-5 h-5'
}) => {
  const IconComponent = iconMap[name] || FileText;
  return <IconComponent className={className} />;
};
