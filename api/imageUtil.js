// 사진 고르기·찍기 + 저장용 작은 사진 만들기 (옷 추가, 옷 정보 수정에서 같이 사용)
import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

// 갤러리에서 고르기 — 13주차 예제와 같은 옵션
const pickFromGallery = async () => {
  return await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], quality: 0.3, base64: true,
    allowsEditing: true, aspect: [1, 1],
  })
}

// 카메라로 찍기 (권한 요청 후 사용). 권한이 없으면 null
const takeFromCamera = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync()
  if (!permission.granted) return null
  return await ImagePicker.launchCameraAsync({
    quality: 0.3, base64: true, allowsEditing: true, aspect: [1, 1],
  })
}

// 저장용 작은 사진 만들기 (가로 300px, 압축)
// json-server는 한 번에 약 100KB까지만 받아서, 원본 사진을 그대로 보내면 저장이 실패함
const makeThumbnail = async (uri) => {
  const context = ImageManipulator.manipulate(uri)
  context.resize({ width: 300 })
  const image = await context.renderAsync()
  const result = await image.saveAsync({
    format: SaveFormat.JPEG, compress: 0.5, base64: true,
  })
  return `data:image/jpeg;base64,${result.base64}`
}

export { pickFromGallery, takeFromCamera, makeThumbnail }
