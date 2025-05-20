import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface TextProps extends RNTextProps {
  variant?: 'header' | 'title' | 'subtitle' | 'body' | 'caption';
  weight?: 'regular' | 'medium' | 'bold';
  color?: string;
  center?: boolean;
}

export default function Text({
  children,
  variant = 'body',
  weight = 'regular',
  color,
  center = false,
  style,
  ...props
}: TextProps) {
  const textStyles = [
    styles.text,
    variant === 'header' && styles.header,
    variant === 'title' && styles.title,
    variant === 'subtitle' && styles.subtitle,
    variant === 'body' && styles.body,
    variant === 'caption' && styles.caption,
    weight === 'medium' && styles.medium,
    weight === 'bold' && styles.bold,
    center && styles.center,
    color && { color },
    style,
  ];

  return (
    <RNText style={textStyles} {...props}>
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Colors.text,
    fontSize: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 14,
    color: Colors.darkGray,
  },
  medium: {
    fontWeight: '500',
  },
  bold: {
    fontWeight: 'bold',
  },
  center: {
    textAlign: 'center',
  },
});