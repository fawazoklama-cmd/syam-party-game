import React from 'react';
import {
  HelpCircle,
  Gamepad2,
  Zap,
  Flag,
  Smile,
  Trophy,
  Calculator,
  Type,
  Keyboard,
  Palette,
  Activity,
  Grid,
  CircleDot,
  Sparkles,
  BrainCircuit,
  Share2,
  Shield,
  UserCheck,
  Volume2,
  Vote,
  Dice5,
} from 'lucide-react';

interface GameIconProps {
  iconName: string;
  className?: string;
}

export const GameIcon: React.FC<GameIconProps> = ({ iconName, className = 'w-6 h-6' }) => {
  switch (iconName) {
    case 'HelpCircle':
      return <HelpCircle className={className} />;
    case 'Gamepad2':
      return <Gamepad2 className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Flag':
      return <Flag className={className} />;
    case 'Smile':
      return <Smile className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Calculator':
      return <Calculator className={className} />;
    case 'Type':
      return <Type className={className} />;
    case 'Keyboard':
      return <Keyboard className={className} />;
    case 'Palette':
      return <Palette className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Grid':
      return <Grid className={className} />;
    case 'CircleDot':
      return <CircleDot className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'BrainCircuit':
      return <BrainCircuit className={className} />;
    case 'Share2':
      return <Share2 className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'UserCheck':
      return <UserCheck className={className} />;
    case 'Volume2':
      return <Volume2 className={className} />;
    case 'Vote':
      return <Vote className={className} />;
    default:
      // If it's an emoji or unlisted
      if (iconName && iconName.length <= 4) {
        return <span className="text-xl leading-none">{iconName}</span>;
      }
      return <Dice5 className={className} />;
  }
};
