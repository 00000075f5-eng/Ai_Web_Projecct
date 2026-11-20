// 홈 — 옷장 목록 (Read) + 이름 검색 + 종류별 필터
import { useState } from 'react'
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native'
import ClothCard from '../components/ClothCard'
import { COLORS } from '../theme'

const WASH = '세탁 필요'   // 필터 이름

export default function HomeScreen({ clothes, onOpen }) {
  const [keyword, setKeyword] = useState('')   // 검색어
  const [filter, setFilter] = useState('전체') // 선택한 필터

  // 상태 정보 출력 — 10주차 "할일/한일 개수" 출력과 같은 방식
  const washCount = clothes.filter(c => c.needWash).length

  // 필터 목록 — 옷장에 있는 종류만 자동으로 만듦 (중복 제거)
  const categories = []
  clothes.forEach(c => {
    if (c.category && !categories.includes(c.category)) categories.push(c.category)
  })
  const filters = ['전체', ...categories, WASH]

  // 필터 + 검색 적용 — filter 함수 두 번
  const shown = clothes
    .filter(c => {
      if (filter === '전체') return true
      if (filter === WASH) return c.needWash
      return c.category === filter
    })
    .filter(c => (c.name || '').toLowerCase().includes(keyword.trim().toLowerCase()))

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 옷장</Text>
      <Text style={styles.summary}>
        전체 {clothes.length}벌 · 세탁 필요 {washCount}벌
      </Text>

      <TextInput
        style={styles.search}
        value={keyword}
        onChangeText={text => setKeyword(text)}
        placeholder="🔍  옷 이름으로 검색"
        placeholderTextColor={COLORS.sub}
      />

      {/* 종류별 필터 — 가로로 스크롤 */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {filters.map(name => {
            const active = filter === name
            return (
              <TouchableOpacity
                key={name}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(name)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {clothes.length === 0 && (
          <Text style={styles.empty}>아직 등록한 옷이 없어요.{'\n'}아래 "옷 추가" 탭에서 등록해 보세요.</Text>
        )}
        {clothes.length > 0 && shown.length === 0 && (
          <Text style={styles.empty}>조건에 맞는 옷이 없어요.</Text>
        )}
        {/* 6주차 map으로 반복 출력 */}
        {shown.map(cloth => (
          <ClothCard key={cloth.id} item={cloth} onPress={() => onOpen(cloth.id)} />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summary: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.sub,
  },
  search: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  chips: {
    marginTop: 10,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  empty: {
    marginTop: 40,
    width: '100%',
    textAlign: 'center',
    lineHeight: 22,
    color: COLORS.sub,
  },
})
