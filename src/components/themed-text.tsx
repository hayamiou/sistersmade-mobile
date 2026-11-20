import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, PoliceTitre, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  // Les titres prennent la couleur primaire (framboise) par défaut ; le reste, la couleur du texte.
  // themeColor, s'il est fourni, garde la priorité.
  const couleurParDefaut: ThemeColor = type === 'title' ? 'primary' : 'text';

  return (
    <Text style={[{ color: theme[themeColor ?? couleurParDefaut] }, styles[type], style]} {...rest} />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontFamily: PoliceTitre, // Fredoka SemiBold, chargée dans _layout.tsx
    fontSize: 32,
    lineHeight: 40,
    // Pas de fontWeight : la police n'existe qu'en « Regular ». Demander du gras
    // à iOS sur une police sans version grasse peut le faire revenir à la police système.
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: 600,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});