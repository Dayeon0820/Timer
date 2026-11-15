// 집중 상태별 아이콘 (lucide-react)
import { CameraOff, Eye, LoaderCircle, Moon, Sprout, UserX } from 'lucide-react';

export const STATUS_ICON = {
  idle: CameraOff,
  loading: LoaderCircle,
  focused: Sprout,
  drowsy: Moon,
  distracted: Eye,
  away: UserX,
};
