// 살 옷 추천 — 내 옷장 목록을 AI에 보내서 부족한 아이템 추천받기
import { useState } from 'react'
import {
  StyleSheet, View, Text, TextInput, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import ClothCard from '../components/ClothCard'
import { chat, parseJson } from '../api/llmapi_openai'
import { COLORS } from '../theme'

export default function ShoppingScreen({ clothes }) {
  const [style, setStyle] = useState('')         // 원하는 스타일 (선택)
  const [items, setItems] = useState([])         // 추천받은 살 옷 목록
  const [summary, setSummary] = useState('')     // 옷장 분석 한 줄
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 종류별 개수 — 예: { 상의: 2, 하의: 1 }
  const countByCategory = {}
  clothes.forEach(c => {
    countByCategory[c.category] = (countByCategory[c.category] || 0) + 1
  })
  const countText = Object.keys(countByCategory)
    .map(key => `${key} ${countByCategory[key]}벌`)
    .join(' · ')

  // id 목록 → 실제 옷 객체 목록
  const findClothes = (ids) =>
    ids.map(id => clothes.find(c => c.id == id)).filter(c => c)

  const recommend = () => {
    if (clothes.length === 0) {
      setMessage('옷장에 옷을 먼저 등록해 주세요.')
      return
    }
    const list = clothes
      .map(c => `id:${c.id} / ${c.name} / ${c.category} / ${c.color} / ${c.season}`)
      .join('\n')

    const prompt = `너는 옷장 정리 도우미야. 아래는 내 옷장에 있는 옷 목록이야.
${list}

원하는 스타일: ${style || '특별히 없음'}

이 옷장을 보고 부족한 종류, 색상, 계절을 생각해서 새로 사면 좋을 옷 3개를 추천해.
이미 비슷한 옷이 있으면 추천하지 마.
각 옷마다 내 옷장에서 함께 입기 좋은 옷의 id도 골라줘.
아래 JSON 형식으로만 답해. 다른 말은 쓰지 마.
{
  "summary": "내 옷장의 특징 한 문장",
  "items": [
    {
      "name": "추천 옷 이름 (예: 네이비 가디건)",
      "category": "상의, 하의, 아우터, 원피스, 신발, 가방, 액세서리 중 하나",
      "color": "색상",
      "reason": "추천 이유 한두 문장",
      "matchIds": ["함께 입기 좋은 내 옷 id"]
    }
  ]
}`

    setLoading(true)
    setMessage('')
    setItems([])
    setSummary('')
    chat(prompt, (text) => {
      setLoading(false)
      const data = parseJson(text)
      if (data === null || !Array.isArray(data.items)) {
        setMessage('추천 실패: ' + text)
        return
      }
      setSummary(data.summary || '')
      setItems(data.items.map(item => ({
        ...item,
        matchIds: (item.matchIds || []).map(String),
      })))
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>살 옷 추천</Text>
      <Text style={styles.sub}>
        내 옷장 {clothes.length}벌{countText !== '' ? ` (${countText})` : ''}을 보고
        부족한 옷을 추천해요
      </Text>

      <TextInput
        style={styles.input}
        value={style}
        onChangeText={text => setStyle(text)}
        onSubmitEditing={recommend}
        placeholder="원하는 스타일 (예: 깔끔한 출근룩, 캐주얼)"
        placeholderTextColor={COLORS.sub}
      />
      <TouchableOpacity style={styles.mainButton} onPress={recommend} disabled={loading}>
        <Text style={styles.white}>AI 살 옷 추천</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color={COLORS.main} style={styles.loading} />}
      {message !== '' && <Text style={styles.message}>{message}</Text>}

      {summary !== '' && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>내 옷장 분석</Text>
          <Text style={styles.text}>{summary}</Text>
        </View>
      )}

      {items.map((item, index) => (
        <View key={index} style={styles.box}>
          <Text style={styles.number}>추천 {index + 1}</Text>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.info}>{item.category} · {item.color}</Text>
          <Text style={styles.text}>{item.reason}</Text>

          {findClothes(item.matchIds).length > 0 && (
            <>
              <Text style={styles.matchTitle}>내 옷장에서 같이 입기 좋은 옷</Text>
              <ScrollView horizontal>
                {findClothes(item.matchIds).map(c => (
                  <ClothCard key={c.id} item={c} small />
                ))}
              </ScrollView>
            </>
          )}
        </View>
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
    paddingBottom: 60,
  },
  back: {
    fontSize: 15,
    color: COLORS.main,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.sub,
  },
  input: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  mainButton: {
    marginTop: 10,
    backgroundColor: COLORS.text,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  white: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loading: {
    marginVertical: 12,
  },
  message: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.main,
  },
  summaryBox: {
    marginTop: 16,
    backgroundColor: COLORS.line,
    borderRadius: 12,
    padding: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  box: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
  },
  number: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.main,
  },
  name: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  info: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.sub,
  },
  text: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  matchTitle: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    color: COLORS.sub,
  },
})
