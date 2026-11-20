// 앱의 중심 — 화면 전환 + 옷 목록 상태 + CRUD 함수
// 옷 데이터(clothes)는 여기 한 곳에서만 관리하고, 각 화면에는 props로 전달
import { useState, useEffect } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import HomeScreen from './screens/HomeScreen'
import AddScreen from './screens/AddScreen'
import DetailScreen from './screens/DetailScreen'
import LaundryScreen from './screens/LaundryScreen'
import ShoppingScreen from './screens/ShoppingScreen'
import TabBar from './components/TabBar'
import { getClothes, addCloth, updateCloth, deleteCloth } from './api/closetApi'
import { COLORS } from './theme'

export default function App() {
  // 'home' | 'add' | 'detail' | 'laundry' | 'shopping'  (내비게이션 라이브러리 대신 useState로 화면 전환, 하단 탭이 setScreen 호출)
  const [screen, setScreen] = useState('home')
  const [clothes, setClothes] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')

  // 처음 한 번만 서버에서 옷 목록 불러오기 — 7주차 useEffect + 11주차 axios
  useEffect(() => {
    const load = async () => {
      try {
        setClothes(await getClothes())
      } catch (err) {
        setError('서버 연결 실패: json-server가 켜져 있는지 확인하세요.')
      }
    }
    load()
  }, [])

  // ---------- CRUD (10주차 구조 + 서버 저장) ----------
  // Create
  const onAdd = async (cloth) => {
    try {
      const saved = await addCloth(cloth)          // 서버(db.json)에 저장
      setClothes(prev => [...prev, saved])        // 화면 상태에 추가
      return true
    } catch (err) {
      setError('저장 실패: ' + err.message)
      return false
    }
  }

  // Update
  const onUpdate = async (id, changes) => {
    try {
      const saved = await updateCloth(id, changes)
      // prev 사용: '전체 세탁 완료'처럼 여러 번 연속 수정해도 앞의 수정이 사라지지 않게 함
      setClothes(prev => prev.map(c => {
        if (c.id == id) return saved
        return c
      }))
      return true
    } catch (err) {
      setError('수정 실패: ' + err.message)
      return false
    }
  }

  // Delete
  const onDelete = async (id) => {
    try {
      await deleteCloth(id)
      setClothes(prev => prev.filter(c => c.id != id))
      setScreen('home')
    } catch (err) {
      setError('삭제 실패: ' + err.message)
    }
  }

  const openDetail = (id) => {
    setSelectedId(id)
    setScreen('detail')
  }
  const goHome = () => setScreen('home')

  const selected = clothes.find(c => c.id == selectedId)

  // 탭에서 보일 위치 — 상세 화면은 옷장 탭 안에 있는 화면
  const currentTab = screen === 'detail' ? 'home' : screen

  return (
    // 바깥 상자: 배경 / 안쪽 상자: 웹에서도 휴대폰 폭(최대 480px)으로 가운데 표시
    <View style={styles.outer}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        {error !== '' && (
          <TouchableOpacity style={styles.error} onPress={() => setError('')}>
            <Text style={styles.errorText}>{error}  (눌러서 닫기)</Text>
          </TouchableOpacity>
        )}

        <View style={styles.screen}>
          {screen === 'home' && (
            <HomeScreen clothes={clothes} onOpen={openDetail} />
          )}
          {screen === 'add' && (
            <AddScreen onAdd={onAdd} onBack={goHome} />
          )}
          {screen === 'detail' && selected && (
            <DetailScreen
              item={selected}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onBack={goHome}
            />
          )}
          {screen === 'laundry' && (
            <LaundryScreen clothes={clothes} onUpdate={onUpdate} onOpen={openDetail} />
          )}
          {screen === 'shopping' && (
            <ShoppingScreen clothes={clothes} />
          )}
        </View>

        <TabBar current={currentTab} onChange={setScreen} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: COLORS.line,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: COLORS.bg,
    paddingTop: 48,
  },
  screen: {
    flex: 1,
  },
  error: {
    backgroundColor: COLORS.danger,
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#fff',
    fontSize: 13,
  },
})
