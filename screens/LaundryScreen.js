// 세탁 — 빨래 바구니(세탁 필요인 옷) + 세탁 완료 처리 (Update)
// 10주차 할일/한일 토글과 같은 구조: needWash 값을 바꿔서 바구니에 넣고 뺌
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity } from 'react-native'
import { COLORS } from '../theme'

// 옷 한 줄 — 작은 사진 + 이름 + 오른쪽 버튼
const Row = ({ item, buttonText, buttonStyle, onPress, onOpen, showLaundry }) => (
  <View style={styles.row}>
    <TouchableOpacity style={styles.rowMain} onPress={() => onOpen(item.id)}>
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.noImage]}>
          <Text style={styles.noImageText}>{item.category}</Text>
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.info} numberOfLines={1}>
          {item.category} · {item.color} · {item.material}
        </Text>
        {showLaundry && (
          <Text style={styles.laundry}>🧺 {item.laundry || '세탁 방법 정보 없음'}</Text>
        )}
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.rowButton, buttonStyle]} onPress={onPress}>
      <Text style={styles.rowButtonText}>{buttonText}</Text>
    </TouchableOpacity>
  </View>
)

export default function LaundryScreen({ clothes, onUpdate, onOpen }) {
  const basket = clothes.filter(c => c.needWash)     // 빨래 바구니
  const clean = clothes.filter(c => !c.needWash)     // 깨끗한 옷

  // 바구니에 있는 옷 전부 세탁 완료
  const finishAll = async () => {
    for (const c of basket) {
      await onUpdate(c.id, { needWash: false })
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>세탁</Text>
      <Text style={styles.sub}>
        빨래 바구니 {basket.length}벌 · 깨끗한 옷 {clean.length}벌
      </Text>

      {/* ---------- 빨래 바구니 ---------- */}
      <View style={styles.sectionHeader}>
        <Text style={styles.section}>빨래 바구니</Text>
        {basket.length > 0 && (
          <TouchableOpacity onPress={finishAll}>
            <Text style={styles.finishAll}>전체 세탁 완료</Text>
          </TouchableOpacity>
        )}
      </View>

      {basket.length === 0 && (
        <Text style={styles.empty}>빨래 바구니가 비어 있어요 🎉</Text>
      )}
      {basket.map(item => (
        <Row
          key={item.id}
          item={item}
          showLaundry
          onOpen={onOpen}
          buttonText="세탁 완료"
          buttonStyle={styles.doneButton}
          onPress={() => onUpdate(item.id, { needWash: false })}
        />
      ))}

      {/* ---------- 깨끗한 옷 ---------- */}
      <Text style={[styles.section, styles.cleanSection]}>깨끗한 옷</Text>
      {clean.length === 0 && (
        <Text style={styles.empty}>깨끗한 옷이 없어요.</Text>
      )}
      {clean.map(item => (
        <Row
          key={item.id}
          item={item}
          buttonText="바구니에 넣기"
          onOpen={onOpen}
          buttonStyle={styles.addButton}
          onPress={() => onUpdate(item.id, { needWash: true })}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.sub,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  section: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cleanSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  finishAll: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.main,
  },
  empty: {
    marginVertical: 16,
    textAlign: 'center',
    color: COLORS.sub,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  noImage: {
    backgroundColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 11,
    color: COLORS.sub,
  },
  rowText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  info: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.sub,
  },
  laundry: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.text,
  },
  rowButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneButton: {
    backgroundColor: COLORS.main,
  },
  addButton: {
    backgroundColor: COLORS.wash,
  },
  rowButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
})
