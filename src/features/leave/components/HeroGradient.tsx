import { StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { CRIMSON } from '@/features/leave/meta';

export function HeroGradient() {
  return (
    <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
      <Defs>
        <SvgLinearGradient id="leaveHeroGrad" x1="0%" y1="0%" x2="60%" y2="100%">
          <Stop offset="0%" stopColor={CRIMSON.cr4} />
          <Stop offset="40%" stopColor={CRIMSON.cr3} />
          <Stop offset="100%" stopColor={CRIMSON.cr} />
        </SvgLinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#leaveHeroGrad)" />
    </Svg>
  );
}
