// 옷 카드 하나 — 3주차 카드 컴포넌트 + 5주차 JSON 객체를 props로 통째로 전달
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native'
import { COLORS } from '../theme'

export default function ClothCard({ item, onPress, small = false, selected = false }) {
  return (
    <TouchableOpacity
      style={[styles.card, small && styles.small, selected && styles.selected]}
      onPress={onPress}
      disabled={!onPress}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={styles.noImageText}>{item.category || '옷'}</Text>
        </View>
      )}

      {/* 세탁 필요 표시 — 10주차 check 토글을 needWash로 사용 */}
      {item.needWash && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>세탁 필요</Text>
        </View>
      )}

      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
      {!small && (
        <Text style={styles.info} numberOfLines={1}>
          {item.category} · {item.color}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  small: {
    width: 100,
    marginRight: 8,
  },
  selected: {
    borderWidth: 2,
    borderColor: COLORS.main,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  noImage: {
    backgroundColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: COLORS.sub,
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: COLORS.wash,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  name: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  info: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.sub,
  },
})
