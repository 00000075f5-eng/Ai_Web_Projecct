// json-server(db.json)에 보내는 요청 모음 — 11주차 [비동기] axios + async/await
import axios from 'axios'

// 웹 브라우저로 실행 : localhost
// 휴대폰 Expo Go로 실행 : PC의 IP 주소로 바꾸기 (예: 'http://192.168.0.10:3000')
//   → PC에서 cmd 열고 ipconfig 입력 → IPv4 주소 확인
export const SERVER = 'http://localhost:3000'

// ---------- 옷 (clothes) ----------
// Read : 전체 목록
const getClothes = async () => {
  const response = await axios.get(`${SERVER}/clothes`)
  return response.data
}

// Create : 새 옷 추가 → 서버가 id를 붙여서 돌려줌
const addCloth = async (cloth) => {
  const response = await axios.post(`${SERVER}/clothes`, cloth)
  return response.data
}

// Update : 바뀐 항목만 보내기 (예: { needWash: true })
const updateCloth = async (id, changes) => {
  const response = await axios.patch(`${SERVER}/clothes/${id}`, changes)
  return response.data
}

// Delete
const deleteCloth = async (id) => {
  await axios.delete(`${SERVER}/clothes/${id}`)
}

export { getClothes, addCloth, updateCloth, deleteCloth }
