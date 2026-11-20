# 내 옷장 — AI 옷장 관리 앱

옷 사진을 찍으면 AI가 종류, 색, 소재, 세탁·보관 방법을 알려주고, 빨래 바구니로 세탁할 옷을 관리하며, 내 옷장을 보고 새로 살 옷을 추천해 주는 앱.

## 실행 방법

1. 패키지 설치
   ```
   npm install
   npx expo install --fix
   ```
2. API 키 넣기: `.env.local.example`을 복사해서 이름을 `.env.local`로 바꾸고 OpenAI 키 입력
3. 터미널 1: 데이터 서버 켜기
   ```
   npm run server
   ```
4. 터미널 2: 앱 실행 (처음이거나 키를 바꿨으면 `--clear`)
   ```
   npx expo start --clear
   ```
   웹은 `w`, 휴대폰은 Expo Go로 QR 스캔

휴대폰으로 실행하면 `api/closetApi.js`의 `SERVER`를 PC의 IP 주소로 바꿔야 해요 (cmd → `ipconfig` → IPv4 주소). PC와 휴대폰은 같은 와이파이에 연결.

## 파일 구조

```
App.js                  화면 전환(하단 탭) + 옷 목록 상태 + CRUD 함수
db.json                 json-server 데이터 (clothes)
api/closetApi.js        json-server 요청 (axios)
api/llmapi_openai.js    OpenAI 요청 (chat, describeImage) — 13주차 수업 모듈 방식
api/imageUtil.js        사진 고르기·찍기, 저장용 작은 사진 만들기
screens/HomeScreen.js   옷장 목록, 이름 검색, 종류별 필터
screens/AddScreen.js    사진 → AI 분석 → 저장
screens/DetailScreen.js 세탁·보관 정보, 정보·사진 수정, 세탁 토글, 삭제
screens/LaundryScreen.js 빨래 바구니, 세탁 완료 / 바구니에 넣기
screens/ShoppingScreen.js 살 옷 추천 (옷 하나 골라서 / 옷장 전체 분석)
components/ClothCard.js 옷 카드
components/TabBar.js    하단 탭 메뉴 (옷장 · 옷 추가 · 세탁 · 살 옷)
theme.js                색상
```

## 데이터 흐름

```
사진 선택 → describeImage(AI) → 종류·색·세탁·보관 JSON
  → onAdd → axios.post → db.json
  → Detail: 정보 수정·세탁 필요 토글 (axios.patch) / 삭제 (axios.delete)
  → Laundry: needWash인 옷 = 빨래 바구니, 세탁 완료 / 바구니에 넣기 (axios.patch)
  → Shopping: 옷 하나 선택 → chat(AI) → 어울리는 색상·아이템 + 같이 입을 내 옷
              옷장 전체 → chat(AI) → 부족한 옷 3개 + 함께 입기 좋은 내 옷
```

## 수업 내용 대응

| 기능 | 수업 |
|---|---|
| StyleSheet, TouchableOpacity, Image, Flexbox, 카드 | 3주차 스타일링 |
| ClothCard에 옷 객체를 props로 통째로 전달 | 5주차 컴포넌트 |
| map 반복 출력, 이벤트 | 6주차 Hook A |
| useState, useEffect | 7주차 Hook B |
| onAdd / onUpdate(id, !needWash) / onDelete (map, filter) | 10주차 CRUD |
| axios + async/await + try/catch | 11주차 비동기 |
| expo-image-picker, describeImage, chat, .env.local | 13주차 AI활용 |
| 사진 줄이기 (expo-image-manipulator) | 수업 외 |

수업에 없는 부분: json-server 실행, AI 답변을 JSON으로 받아 파싱하는 `parseJson`.

## 알아둘 점

- `EXPO_PUBLIC_` 키는 앱 안에 그대로 들어가요. 수업 데모용이고, 실제 서비스라면 서버를 거쳐 호출해야 해요.
- json-server는 한 번에 약 100KB까지만 받아요. 그래서 사진은 `expo-image-manipulator`로 가로 300px로 줄인 뒤 db.json의 `imageUri`에 저장해요 (AI에는 원본 품질로 보냄).
- AI 분석이 틀릴 수 있어서 저장 전에 직접 고칠 수 있게 했어요.
