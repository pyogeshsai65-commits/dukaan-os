import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

function Flourish({ style }) {
  return <View pointerEvents="none" style={[styles.manuscriptFlourish, style]}>
    <View style={styles.manuscriptArc} />
    <View style={[styles.manuscriptArc, styles.manuscriptArcInner]} />
    <View style={styles.manuscriptStem} />
    <View style={[styles.manuscriptLeaf, styles.manuscriptLeafTop]} />
    <View style={[styles.manuscriptLeaf, styles.manuscriptLeafBottom]} />
    <View style={styles.manuscriptDot} />
  </View>;
}

export default function ManuscriptBackdrop() {
  return <View pointerEvents="none" style={styles.manuscriptBackdrop}>
    <Flourish style={styles.manuscriptTopRight} />
    <Flourish style={styles.manuscriptMiddleLeft} />
    <Flourish style={styles.manuscriptBottomRight} />
    <View style={styles.manuscriptHeaderSprig} pointerEvents="none">
      <View style={styles.manuscriptSprigStem} />
      <View style={[styles.manuscriptSprigLeaf, styles.manuscriptSprigLeafOne]} />
      <View style={[styles.manuscriptSprigLeaf, styles.manuscriptSprigLeafTwo]} />
      <View style={[styles.manuscriptSprigLeaf, styles.manuscriptSprigLeafThree]} />
      <View style={[styles.manuscriptSprigLeaf, styles.manuscriptSprigLeafFour]} />
    </View>
    <View style={styles.manuscriptCompass} pointerEvents="none">
      <View style={styles.manuscriptCompassRing} />
      <View style={styles.manuscriptCompassInnerRing} />
      <View style={styles.manuscriptCompassNeedleVertical} />
      <View style={styles.manuscriptCompassNeedleHorizontal} />
      <View style={styles.manuscriptCompassDiamond} />
    </View>
    <View style={styles.manuscriptWritingTop} pointerEvents="none">
      <Text style={styles.manuscriptWritingText}>finis coronat opus</Text>
      <Text style={styles.manuscriptWritingText}>la buena tienda</Text>
    </View>
    <View style={styles.manuscriptWritingBottom} pointerEvents="none">
      <Text style={styles.manuscriptWritingText}>Small business</Text>
      <Text style={styles.manuscriptWritingText}>Bigger tomorrow</Text>
    </View>
    <View style={styles.manuscriptMarginalOrnament} pointerEvents="none">
      <View style={styles.manuscriptMarginalLine} />
      <View style={styles.manuscriptMarginalDiamond} />
      <View style={styles.manuscriptMarginalLine} />
    </View>
    <View style={styles.manuscriptRuleTop} />
    <View style={styles.manuscriptRuleBottom} />
  </View>;
}
