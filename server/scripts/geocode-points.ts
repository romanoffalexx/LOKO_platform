/**
 * Скрипт миграции: геокодирует существующие точки, у которых нет координат.
 * Запуск: npx tsx server/scripts/geocode-points.ts
 */
import { pool } from '../db/pool.js'

const GEOCODER_KEY = process.env.YANDEX_MAPS_GEOCODER_KEY

async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!GEOCODER_KEY) {
    console.error('Ошибка: YANDEX_MAPS_GEOCODER_KEY не задан в .env')
    return null
  }

  try {
    const fullAddress = /краснодар|москва|санкт/i.test(address)
      ? address
      : `Краснодар, ${address}`

    const url = `https://geocode-maps.yandex.ru/1.x/?geocode=${encodeURIComponent(fullAddress)}&format=json&apikey=${encodeURIComponent(GEOCODER_KEY)}`
    const res = await fetch(url)
    if (!res.ok) return null

    const data: any = await res.json()
    const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
    if (!pos) return null

    const [lng, lat] = pos.split(' ').map(Number)
    return { latitude: lat, longitude: lng }
  } catch (err: any) {
    console.error(`Ошибка геокодирования "${address}":`, err.message)
    return null
  }
}

async function main() {
  console.log('Запуск миграции геокодирования точек...\n')

  // Находим точки без координат
  const { rows: points } = await pool.query(
    `SELECT id, name, address FROM points WHERE latitude IS NULL OR longitude IS NULL`
  )

  if (points.length === 0) {
    console.log('Все точки уже имеют координаты. Миграция не требуется.')
    process.exit(0)
  }

  console.log(`Найдено точек без координат: ${points.length}\n`)

  let updated = 0
  let failed = 0

  for (const point of points) {
    console.log(`Геокодирование: "${point.name}" — ${point.address}`)
    const coords = await geocodeAddress(point.address)

    if (coords) {
      await pool.query(
        `UPDATE points SET latitude = $1, longitude = $2 WHERE id = $3`,
        [coords.latitude, coords.longitude, point.id]
      )
      console.log(`  ✓ ${coords.latitude}, ${coords.longitude}\n`)
      updated++
    } else {
      console.log(`  ✗ Не удалось определить координаты\n`)
      failed++
    }

    // Небольшая пауза, чтобы не превысить rate limit
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('\n' + '='.repeat(50))
  console.log(`Миграция завершена:`)
  console.log(`  Обновлено: ${updated}`)
  console.log(`  Ошибок: ${failed}`)
  console.log(`  Всего: ${points.length}`)

  process.exit(0)
}

main().catch(err => {
  console.error('Критическая ошибка:', err)
  process.exit(1)
})
