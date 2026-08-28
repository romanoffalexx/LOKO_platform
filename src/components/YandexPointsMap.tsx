import { useEffect, useRef, useState } from 'react'

interface Point {
  id: string
  name: string
  address: string
  is_active: boolean
}

declare global {
  interface Window {
    ymaps: any
  }
}

/**
 * Геокодирование через HTTP Geocoder API (отдельный ключ).
 * Возвращает [lat, lng] или null.
 */
async function geocodeAddress(address: string, apiKey: string): Promise<[number, number] | null> {
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?geocode=${encodeURIComponent(address)}&format=json&apikey=${encodeURIComponent(apiKey)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos
    if (!pos) return null
    const [lng, lat] = pos.split(' ').map(Number)
    return [lat, lng]
  } catch {
    return null
  }
}

/**
 * Карта Яндекс с маркерами точек организации.
 * - JavaScript API key — для отображения карты
 * - Geocoder API key — для геокодирования адресов (HTTP)
 * Если адрес не содержит город — подразумевается Краснодар.
 */
export function YandexPointsMap({ points }: { points: Point[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)

  const jsApiKey = import.meta.env.VITE_YANDEX_MAPS_KEY || 'none'
  const geocoderApiKey = import.meta.env.VITE_YANDEX_MAPS_GEOCODER_KEY || ''

  // Загружаем JavaScript API Яндекса один раз
  useEffect(() => {
    if (window.ymaps) {
      setMapReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${jsApiKey}&lang=ru_RU`
    script.async = true
    script.onload = () => {
      window.ymaps.ready(() => setMapReady(true))
    }
    document.head.appendChild(script)
  }, [jsApiKey])

  // Инициализируем карту и размещаем маркеры
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    const ymaps = window.ymaps
    const map = new ymaps.Map(mapRef.current, {
      center: [45.0355, 38.9753], // Краснодар по умолчанию
      zoom: 12,
      controls: ['zoomControl', 'typeSelector'],
    })

    let placedCount = 0

    const placeMarkers = async () => {
      for (const point of points) {
        // Если адрес не содержит город — добавляем Краснодар
        const fullAddress = /краснодар|москва|санкт/i.test(point.address)
          ? point.address
          : `Краснодар, ${point.address}`

        // Геокодирование через HTTP API (отдельный ключ)
        const coords = geocoderApiKey
          ? await geocodeAddress(fullAddress, geocoderApiKey)
          : null

        // Fallback: если нет ключа геокодера — используем встроенный ymaps.geocode
        let finalCoords = coords
        if (!finalCoords && !geocoderApiKey) {
          try {
            const res = await ymaps.geocode(fullAddress)
            const c = res.geoObjects.get(0)?.geometry?.getCoordinates()
            if (c) finalCoords = c
          } catch { /* skip */ }
        }

        if (finalCoords) {
          const placemark = new ymaps.Placemark(
            finalCoords,
            {
              balloonContentHeader: point.name,
              balloonContentBody: point.address,
              hintContent: point.name,
            },
            {
              preset: point.is_active ? 'islands#violetDotIcon' : 'islands#grayDotIcon',
            }
          )
          map.geoObjects.add(placemark)
          placedCount++
        }
      }

      // Центрируем карту по маркерам
      if (map.geoObjects.getLength() > 0) {
        map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
      }
      setLoading(false)
    }

    placeMarkers()

    return () => {
      map.destroy()
    }
  }, [mapReady, points, geocoderApiKey])

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-loko-bg-base/60 text-sm text-loko-text-muted">
          Загрузка карты…
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
