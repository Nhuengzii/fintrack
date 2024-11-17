import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  displayLarge: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    letterSpacing: 0,
  },
  displayMedium: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: 'Inter-Medium',
    fontSize: 24,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    letterSpacing: 0.25,
  },
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563EB',
    secondary: '#3B82F6',
    accent: '#60A5FA',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
};
