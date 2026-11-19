import type { ViewProps } from 'react-native';
type BoxComponent = ((props: ViewProps) => React.JSX.Element) & {
  Header: (props: ViewProps) => React.JSX.Element;
  Body: (props: ViewProps) => React.JSX.Element;
  Footer: (props: ViewProps) => React.JSX.Element;
};
export declare const Box: BoxComponent;
