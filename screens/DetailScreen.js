// 옷 상세 — 세탁·보관 정보, 정보 수정·세탁 필요 토글(Update), 삭제(Delete)
import { useState } from 'react'
import {
  StyleSheet, View, Text, TextInput, Image, ScrollView, TouchableOpacity,
} from 'react-native'
import { pickFromGallery, takeFromCamera, makeThumbnail } from '../api/imageUtil'
import { COLORS } from '../theme'

// 수정할 수 있는 칸 [키, 화면에 보일 이름]
const FIELDS = [
  ['name', '이름'],
  ['category', '종류'],
  ['color', '색상'],
  ['material', '소재'],
  ['season', '계절'],
  ['laundry', '세탁 방법'],
  ['storage', '보관 방법'],
]

export default function DetailScreen({ item, onUpdate, onDelete, onBack }) {
  const [confirm, setConfirm] = useState(false)   // 삭제 한 번 더 확인
  const [editing, setEditing] = useState(false)   // 수정 모드인지
  const [form, setForm] = useState({})            // 수정 중인 값
  const [message, setMessage] = useState('')

  // 수정 시작 — 지금 값을 form에 복사
  const startEdit = () => {
    const copy = {}
    FIELDS.forEach(([key]) => { copy[key] = item[key] || '' })
    copy.imageUri = item.imageUri || ''
    setForm(copy)
    setMessage('')
    setEditing(true)
  }

  const changeField = (key, text) => {
    setForm({ ...form, [key]: text })
  }

  // 사진 바꾸기 — 고른 사진을 작게 줄여서 form.imageUri에 넣음 (저장 버튼을 눌러야 반영)
  const changePhoto = async (res) => {
    if (res === null) {
      setMessage('카메라 권한이 필요해요.')
      return
    }
    if (res.canceled) return
    try {
      const thumb = await makeThumbnail(res.assets[0].uri)
      setForm({ ...form, imageUri: thumb })
      setMessage('')
    } catch (err) {
      setMessage('사진 바꾸기 실패: ' + err.message)
    }
  }

  // 수정 저장 — 바뀐 칸만 PATCH로 보냄
  const saveEdit = async () => {
    if (form.name.trim() === '') {
      setMessage('이름은 비워둘 수 없어요.')
      return
    }
    const ok = await onUpdate(item.id, form)
    if (ok) setEditing(false)
  }

  // ---------- 수정 모드 화면 ----------
  if (editing) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.name}>옷 정보 수정</Text>
        {message !== '' && <Text style={styles.message}>{message}</Text>}

        {form.imageUri ? (
          <Image source={{ uri: form.imageUri }} style={[styles.image, styles.editImage]} />
        ) : (
          <View style={[styles.image, styles.editImage, styles.noImage]}>
            <Text style={styles.sub}>사진 없음</Text>
          </View>
        )}
        <View style={styles.photoRow}>
          <TouchableOpacity
            style={[styles.photoButton, styles.flex]}
            onPress={async () => changePhoto(await pickFromGallery())}
          >
            <Text style={styles.photoText}>갤러리에서 바꾸기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoButton, styles.flex, styles.last]}
            onPress={async () => changePhoto(await takeFromCamera())}
          >
            <Text style={styles.photoText}>카메라로 바꾸기</Text>
          </TouchableOpacity>
        </View>

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

        <View style={styles.row}>
          <TouchableOpacity style={[styles.saveButton, styles.flex]} onPress={saveEdit}>
            <Text style={styles.white}>저장</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelButton, styles.flex]} onPress={() => setEditing(false)}>
            <Text style={styles.sub}>취소</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  // ---------- 보기 화면 ----------
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← 옷장으로</Text>
      </TouchableOpacity>

      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.noImage]}>
          <Text style={styles.sub}>{item.category}</Text>
        </View>
      )}

      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.sub}>
        {item.category} · {item.color} · {item.material} · {item.season}
      </Text>

      {/* 세탁 상태 토글 — 10주차 onUpdate(id, !check) 와 같은 방식 */}
      <TouchableOpacity
        style={[styles.washButton, item.needWash && styles.washOn]}
        onPress={() => onUpdate(item.id, { needWash: !item.needWash })}
      >
        <Text style={[styles.washText, item.needWash && styles.white]}>
          {item.needWash ? '세탁 필요 (누르면 세탁 완료)' : '깨끗함 (누르면 세탁 필요로 표시)'}
        </Text>
      </TouchableOpacity>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>세탁 방법</Text>
        <Text style={styles.boxText}>{item.laundry || '정보 없음'}</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>보관 방법</Text>
        <Text style={styles.boxText}>{item.storage || '정보 없음'}</Text>
      </View>

      <Text style={styles.date}>등록일 {item.createdAt}</Text>

      <TouchableOpacity style={styles.editButton} onPress={startEdit}>
        <Text style={styles.editText}>정보 수정</Text>
      </TouchableOpacity>

      {confirm ? (
        <View style={styles.row}>
          <TouchableOpacity style={[styles.deleteButton, styles.flex]} onPress={() => onDelete(item.id)}>
            <Text style={styles.white}>정말 삭제</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cancelButton, styles.flex]} onPress={() => setConfirm(false)}>
            <Text style={styles.sub}>취소</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirm(true)}>
          <Text style={styles.danger}>옷 삭제</Text>
        </TouchableOpacity>
      )}
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
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  noImage: {
    backgroundColor: COLORS.line,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sub: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.sub,
  },
  washButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.wash,
    alignItems: 'center',
  },
  washOn: {
    backgroundColor: COLORS.wash,
  },
  washText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.wash,
  },
  white: {
    color: '#fff',
  },
  danger: {
    color: COLORS.danger,
  },
  editImage: {
    marginTop: 12,
  },
  photoRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  photoButton: {
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  photoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  last: {
    marginRight: 0,
  },
  editButton: {
    marginTop: 20,
    backgroundColor: COLORS.text,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.text,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  message: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.danger,
  },
  field: {
    marginTop: 10,
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
  box: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  boxText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  date: {
    marginTop: 14,
    fontSize: 13,
    color: COLORS.sub,
  },
  row: {
    flexDirection: 'row',
    marginTop: 20,
  },
  flex: {
    flex: 1,
    marginTop: 0,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
  },
})
