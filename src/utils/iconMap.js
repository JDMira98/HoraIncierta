import {
  Activity,
  CircleDot,
  Clock,
  DoorClosed,
  DoorOpen,
  Flower,
  Grid,
  Leaf,
  Sparkles,
  Sun,
} from 'lucide-react';

const iconMap = {
  Activity,
  CircleDot,
  Clock,
  DoorClosed,
  DoorOpen,
  Flower,
  Grid,
  Leaf,
  Sparkles,
  Sun,
  Venus: CircleDot,
};

export const getIconByName = (name) => {
  if (!name) {
    return Sparkles;
  }
  return iconMap[name] ?? Sparkles;
};
