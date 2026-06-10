'use client';

import { useTheme } from '@/contexts/ThemeContext';
import DarkSelectProjectPage from '@/designs/dark/SelectProjectPage';
import LightSelectProjectPage from '@/designs/light/SelectProjectPage';

export default function SelectProjectRoute() {
  const { themeId } = useTheme();
  return themeId === 'dark' ? <DarkSelectProjectPage /> : <LightSelectProjectPage />;
}
