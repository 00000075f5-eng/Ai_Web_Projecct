// 하단 탭 메뉴 — 탭을 누르면 App.js의 screen 상태가 바뀜
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { COLORS } from '../theme'

// [screen 이름, 아이콘, 글자]
const TABS = [
  ['home', '👕', '옷장'],
  ['add', '➕', '옷 추가'],
  ['laundry', '🧺', '세탁'],
  ['shopping', '🛍️', '살 옷'],
]

export default function TabBar({ current, onChange }) {
  return (
    <View style={styles.bar}>
      {TABS.map(([key, icon, label]) => {
        const active = current === key
        return (
          <TouchableOpacity key={key} style={styles.tab} onPress={() => onChange(key)}>
            <Text style={[styles.icon, !active && styles.dim]}>{icon}</Text>
            <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  dim: {
    opacity: 0.4,
  },
  label: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.sub,
  },
  activeLabel: {
    color: COLORS.main,
    fontWeight: 'bold',
  },
})
