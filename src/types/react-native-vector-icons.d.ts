declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextStyle } from 'react-native';

  export interface IconProps {
    size?: number;
    name: string;
    color?: string;
    style?: TextStyle;
  }

  export default class Ionicons extends Component<IconProps> {
    static glyphMap: Record<string, number>;
  }
}
