// 옷 추가 — 사진 선택 → AI 분석 → 확인·수정 → 저장 (Create)
import { useState } from 'react'
import {
  StyleSheet, View, Text, TextInput, Image, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { describeImage, parseJson } from '../api/llmapi_openai'
import { pickFromGallery, takeFromCamera, makeThumbnail } from '../api/imageUtil'
import { COLORS } from '../theme'

// 입력 칸 목록 [키, 화면에 보일 이름]
const FIELDS = [
  ['name', '이름'],
  ['category', '종류'],
  ['color', '색상'],
  ['material', '소재'],
  ['season', '계절'],
  ['laundry', '세탁 방법'],
  ['storage', '보관 방법'],
]

const EMPTY_FORM = {
  name: '', category: '', color: '', material: '',
  season: '', laundry: '', storage: '',
}

// AI에게 보낼 질문 — JSON으로만 답하게 해서 바로 form에 넣을 수 있게 함
const PROMPT = `이 사진 속 옷을 분석해서 아래 JSON 형식으로만 답해. 다른 말은 쓰지 마.
{
  "name": "옷을 부를 짧은 이름 (예: 베이지 울 니트)",
  "category": "상의, 하의, 아우터, 원피스, 신발, 가방, 액세서리 중 하나",
  "color": "주요 색상",
  "material": "추정 소재",
  "season": "봄, 여름, 가을, 겨울, 사계절 중 어울리는 것",
  "laundry": "세탁 방법 한두 문장 (물 온도, 세탁 코스, 건조 방법)",
  "storage": "보관 방법 한 문장 (옷걸이/개어서, 주의할 점)"
}
옷이 아닌 사진이면 name에 "옷 아님"이라고 써.`

export default function AddScreen({ onAdd, onBack }) {
  const [image, setImage] = useState(null)     // 화면 표시용 (asset.uri)
  const [base64, setBase64] = useState(null)   // AI 전송용 (data URI)
  const [thumb, setThumb] = useState(null)     // db.json 저장용 작은 사진
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // 사진 고른 뒤 공통 처리 — 13주차: 표시는 uri, 전송은 base64 (상태 분리)
  const handleResult = async (res) => {
    if (!res.canceled) {
      const asset = res.assets[0]
      setImage(asset.uri)
      setBase64(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`)
      setMessage('')
      try {
        setThumb(await makeThumbnail(asset.uri))
      } catch (err) {
        setThumb(null)
        setMessage('사진 줄이기 실패: ' + err.message)
      }
    }
  }

  // 갤러리에서 고르기
  const pickImage = async () => {
    handleResult(await pickFromGallery())
  }

  // 카메라로 찍기 (권한 요청 후 사용)
  const takePhoto = async () => {
    const res = await takeFromCamera()
    if (res === null) {
      setMessage('카메라 권한이 필요해요.')
      return
    }
    handleResult(res)
  }

  // AI 분석 — 결과는 콜백으로 받아서 setState
  const analyze = () => {
    if (!base64) {
      setMessage('먼저 사진을 골라 주세요.')
      return
    }
    setLoading(true)
    setMessage('')
    describeImage(base64, PROMPT, (text) => {
      setLoading(false)
      const data = parseJson(text)
      if (data === null) {
        setMessage('분석 실패: ' + text)
        return
      }
      setForm({ ...EMPTY_FORM, ...data })
      setMessage('AI 분석 결과예요. 틀린 부분은 고쳐서 저장하세요.')
    })
  }

  // 입력 칸 하나 바꾸기 — 객체 복사 후 해당 키만 변경
  const changeField = (key, text) => {
    setForm({ ...form, [key]: text })
  }

  const save = async () => {
    if (form.name.trim() === '') {
      setMessage('이름을 입력해 주세요.')
      return
    }
    const ok = await onAdd({
      ...form,
      imageUri: thumb || '',   // 원본 대신 작은 사진 저장
      needWash: false,
      createdAt: new Date().toISOString().slice(0, 10),
    })
    if (ok) onBack()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>옷 추가</Text>

      {image ? (
        <Image source={{ uri: image }} style={styles.preview} />
      ) : (
        <View style={[styles.preview, styles.noImage]}>
          <Text style={styles.sub}>사진을 골라 주세요</Text>
        </View>
      )}

      <View style={styles.row}>
        <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
          <Text style={styles.smallButtonText}>갤러리</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smallButton} onPress={takePhoto}>
          <Text style={styles.smallButtonText}>카메라</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, styles.aiButton]}
          onPress={analyze}
          disabled={loading}
        >
          <Text style={[styles.smallButtonText, styles.white]}>AI 분석</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={COLORS.main} style={styles.loading} />}
      {message !== '' && <Text style={styles.message}>{message}</Text>}

      {FIELDS.map(([key, label]) => (
        <View key={key} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, (key === 'laundry' || key === 'storage') && styles.multi]}
            value={form[key]}
            onChangeText={text => changeField(key, text)}
            multiline={key === 'laundry' || key === 'storage'}
            placeholder={label}
            placeholderTextColor={COLORS.sub}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={save}>
        <Text style={[styles.smallButtonText, styles.white]}>옷장에 저장</Text>
      </TouchableOpacity>
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
    marginBottom: 12,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  noImage: {
    backgroundColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sub: {
    color: COLORS.sub,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  smallButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  aiButton: {
    backgroundColor: COLORS.main,
    borderColor: COLORS.main,
    marginRight: 0,
  },
  smallButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  white: {
    color: '#fff',
  },
  loading: {
    marginVertical: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.main,
    marginBottom: 8,
  },
  field: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: COLORS.sub,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  multi: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
})
