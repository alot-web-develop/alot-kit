import type { ReactNode } from 'react';
import type { PressableProps } from 'react-native';
export declare const Button: (
  props: Omit<PressableProps, 'children'> & {
    children?: ReactNode;
    variant?: 'default' | 'secondary' | 'outline';
    size?: 'default' | 'sm' | 'lg';
  },
) => React.JSX.Element;
