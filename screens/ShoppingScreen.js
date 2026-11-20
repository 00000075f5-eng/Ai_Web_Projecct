// 살 옷 추천 — 두 가지 방식
// 1) 옷 하나 고르기 : 고른 옷에 어울리는 색상·아이템 + 내 옷장에서 같이 입을 옷
// 2) 옷장 전체 분석 : 옷장 전체를 보고 부족한 옷 3개 추천
import { useState } from 'react'
import {
  StyleSheet, View, Text, TextInput, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import ClothCard from '../components/ClothCard'
import { chat, parseJson } from '../api/llmapi_openai'
import { COLORS } from '../theme'

// 옷 정보를 AI에 보낼 한 줄 글로 바꾸기
const toLine = (c) =>
  `id:${c.id} / ${c.name} / ${c.category} / ${c.color} / ${c.material || ''} / ${c.season}`

export default function ShoppingScreen({ clothes }) {
  const [mode, setMode] = useState('one')        // 'one' 옷 하나 | 'all' 옷장 전체
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 옷 하나 고르기 결과
  const [selectedId, setSelectedId] = useState(null)
  const [advice, setAdvice] = useState(null)     // { comment, colors, items, matchIds }

  // 옷장 전체 분석 결과
  const [style, setStyle] = useState('')         // 원하는 스타일 (선택)
  const [items, setItems] = useState([])         // 추천받은 살 옷 목록
  const [summary, setSummary] = useState('')     // 옷장 분석 한 줄

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

  const changeMode = (next) => {
    setMode(next)
    setMessage('')
  }

  // ---------- 1) 옷 하나 고르기 ----------
  const pickCloth = (cloth) => {
    if (loading) return
    setSelectedId(cloth.id)
    setAdvice(null)
    setMessage('')

    const others = clothes.filter(c => c.id != cloth.id).map(toLine).join('\n')

    const prompt = `너는 코디 도우미야. 내가 고른 옷은 이거야.
${toLine(cloth)}

내 옷장에 있는 다른 옷 목록이야.
${others || '(없음)'}

고른 옷에 어울리는 코디를 알려줘.
- items에는 고른 옷과 같은 종류는 빼고, 하의·아우터·신발·가방 등에서 새로 사면 좋을 아이템 2~3개를 넣어.
- matchIds에는 위 목록 안에서만 고른 옷과 같이 입기 좋은 옷의 id를 넣어. 없으면 빈 배열.
아래 JSON 형식으로만 답해. 다른 말은 쓰지 마.
{
  "comment": "이 옷의 특징과 코디 방향 두 문장",
  "colors": ["어울리는 색상 3개"],
  "items": [
    { "category": "아우터", "name": "추천 아이템 (예: 네이비 가디건)", "reason": "어울리는 이유 한 문장" }
  ],
  "matchIds": ["같이 입기 좋은 내 옷 id"]
}`

    setLoading(true)
    chat(prompt, (text) => {
      setLoading(false)
      const data = parseJson(text)
      if (data === null || typeof data.comment !== 'string') {
        setMessage('추천 실패: ' + text)
        return
      }
      setAdvice({
        comment: data.comment,
        colors: Array.isArray(data.colors) ? data.colors : [],
        items: Array.isArray(data.items) ? data.items : [],
        matchIds: (data.matchIds || []).map(String),
      })
    })
  }

  // ---------- 2) 옷장 전체 분석 ----------
  const recommend = () => {
    if (clothes.length === 0) {
      setMessage('옷장에 옷을 먼저 등록해 주세요.')
      return
    }
    const list = clothes.map(toLine).join('\n')

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

  const selected = clothes.find(c => c.id == selectedId)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>살 옷 추천</Text>
      <Text style={styles.sub}>
        내 옷장 {clothes.length}벌{countText !== '' ? ` (${countText})` : ''}
      </Text>

      {/* 방식 고르기 */}
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentButton, mode === 'one' && styles.segmentActive]}
          onPress={() => changeMode('one')}
        >
          <Text style={[styles.segmentText, mode === 'one' && styles.segmentTextActive]}>
            옷 하나 골라서
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, mode === 'all' && styles.segmentActive]}
          onPress={() => changeMode('all')}
        >
          <Text style={[styles.segmentText, mode === 'all' && styles.segmentTextActive]}>
            옷장 전체 분석
          </Text>
        </TouchableOpacity>
      </View>

      {/* ---------- 1) 옷 하나 고르기 ---------- */}
      {mode === 'one' && (
        <>
          <Text style={styles.guide}>코디가 궁금한 옷을 눌러 보세요</Text>
          {clothes.length === 0 && (
            <Text style={styles.message}>옷장에 옷을 먼저 등록해 주세요.</Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {clothes.map(c => (
              <ClothCard
                key={c.id}
                item={c}
                small
                selected={c.id == selectedId}
                onPress={() => pickCloth(c)}
              />
            ))}
          </ScrollView>

          {loading && <ActivityIndicator size="large" color={COLORS.main} style={styles.loading} />}
          {message !== '' && <Text style={styles.message}>{message}</Text>}

          {advice && selected && (
            <>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>💬 {selected.name}</Text>
                <Text style={styles.text}>{advice.comment}</Text>
              </View>

              {advice.colors.length > 0 && (
                <View style={styles.box}>
                  <Text style={styles.boxTitle}>🎨 어울리는 색상</Text>
                  <View style={styles.colorRow}>
                    {advice.colors.map((color, index) => (
                      <View key={index} style={styles.colorChip}>
                        <Text style={styles.colorText}>{color}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {advice.items.length > 0 && (
                <View style={styles.box}>
                  <Text style={styles.boxTitle}>🛍️ 이런 옷이 어울려요</Text>
                  {advice.items.map((item, index) => (
                    <View key={index} style={styles.adviceItem}>
                      <Text style={styles.name}>
                        <Text style={styles.category}>{item.category}  </Text>
                        {item.name}
                      </Text>
                      <Text style={styles.reason}>{item.reason}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.box}>
                <Text style={styles.boxTitle}>👕 내 옷장에서 같이 입기 좋은 옷</Text>
                {findClothes(advice.matchIds).length === 0 ? (
                  <Text style={styles.reason}>
                    옷장에 잘 맞는 옷이 아직 없어요. 위 아이템을 참고해 보세요.
                  </Text>
                ) : (
                  <ScrollView horizontal>
                    {findClothes(advice.matchIds).map(c => (
                      <ClothCard key={c.id} item={c} small />
                    ))}
                  </ScrollView>
                )}
              </View>
            </>
          )}
        </>
      )}

      {/* ---------- 2) 옷장 전체 분석 ---------- */}
      {mode === 'all' && (
        <>
          <Text style={styles.guide}>옷장 전체를 보고 부족한 옷을 추천해요</Text>
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
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: COLORS.line,
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: COLORS.card,
  },
  segmentText: {
    fontSize: 14,
    color: COLORS.sub,
  },
  segmentTextActive: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  guide: {
    marginTop: 16,
    marginBottom: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorChip: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  colorText: {
    fontSize: 14,
    color: COLORS.text,
  },
  adviceItem: {
    marginBottom: 10,
  },
  category: {
    fontSize: 13,
    color: COLORS.main,
  },
  reason: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.sub,
  },
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
