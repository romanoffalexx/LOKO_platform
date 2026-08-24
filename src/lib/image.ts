/**
 * Валидация изображения логотипа.
 * Проверяет: тип файла, размер 200×200, вес ≤ 100 КБ.
 * Возвращает base64 data-URL.
 */

const LOGO_WIDTH = 200
const LOGO_HEIGHT = 200
const LOGO_MAX_BYTES = 100 * 1024 // 100 КБ

export async function validateLogo(file: File): Promise<string> {
  // Валидация типа
  if (!file.type.startsWith('image/')) {
    throw new Error('Файл должен быть изображением (PNG, JPEG, WebP)')
  }

  // Валидация веса
  if (file.size > LOGO_MAX_BYTES) {
    throw new Error(`Вес файла: ${(file.size / 1024).toFixed(0)} КБ. Максимум: 100 КБ.`)
  }

  // Читаем как data-URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  // Загружаем в Image для проверки размеров
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Не удалось загрузить изображение'))
    image.src = dataUrl
  })

  // Валидация размеров
  if (img.width !== LOGO_WIDTH || img.height !== LOGO_HEIGHT) {
    throw new Error(`Размер изображения: ${img.width}×${img.height}. Требуется: ${LOGO_WIDTH}×${LOGO_HEIGHT}.`)
  }

  return dataUrl
}
