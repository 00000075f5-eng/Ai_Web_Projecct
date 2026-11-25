// 13주차 [AI활용] 수업 모듈(llmapi_openai.js)과 같은 방식
// - axios로 Gemini API(OpenAI 호환 주소) 호출
// - 결과는 return 하지 않고 콜백(onMessage)으로 전달 → 화면에서 setState
import axios from 'axios'

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_KEY}`,
}

// 질문 1개를 보내고 답변 받기 (조합 추천에 사용)
const chat = (prompt, onMessage) => {
  axios.post('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    { model: 'gemini-3.5-flash-lite', temperature: 0.7,
      messages: [{ role: 'user', content: prompt }] },
    { headers, timeout: 90000 }
  ).then(res => onMessage(res.data.choices[0].message.content))
   .catch(err => onMessage(
     err.response?.data?.error?.message || err.message))
}

// 이미지를 보고 질문에 답변 (옷 사진 분석에 사용)
// imageUrl : https 주소 또는 data URI(base64)
const describeImage = (imageUrl, prompt, onMessage) => {
  axios.post('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
    model: 'gemini-3.5-flash-lite',
    messages: [{ role: 'user', content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imageUrl } },
    ]}],
  }, { headers, timeout: 90000 }
  ).then(res => onMessage(res.data.choices[0].message.content))
   .catch(err => onMessage(
     err.response?.data?.error?.message || err.message))
}

// AI 답변에서 JSON만 꺼내기 (수업에 없는 부분)
// AI가 ```json ... ``` 처럼 감싸서 답할 때가 있어서 { } 사이만 잘라 파싱
// 실패하면 null → 화면에서 "분석 실패" 처리
const parseJson = (text) => {
  try {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    return JSON.parse(text.slice(start, end + 1))
  } catch (err) {
    return null
  }
}

export { chat, describeImage, parseJson }
