import { useEffect, useRef, useState } from 'react'

export interface Point {
  id: string
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  is_active: boolean
}

declare global {
  interface Window {
    ymaps: any
  }
}

/**
 * Карта Яндекс с маркерами точек организации.
 * ВРЕМЕННОЕ РЕШЕНИЕ: использует ymaps.geocode() для геокодирования на клиенте.
 * TODO: Переключить на серверное геокодирование, когда заработает HTTP Geocoder API ключ.
 */
export function YandexPointsMap({ points }: { points: Point[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY || ''

  // Загрузка JavaScript API Яндекса
  useEffect(() => {
    if (window.ymaps) {
      setMapReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true
    script.onload = () => {
      window.ymaps.ready(() => setMapReady(true))
    }
    document.head.appendChild(script)
  }, [apiKey])

  // Инициализация карты и размещение маркеров
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    const ymaps = window.ymaps
    const map = new ymaps.Map(mapRef.current, {
      center: [45.0355, 38.9753], // Краснодар по умолчанию
      zoom: 10,
      controls: ['zoomControl', 'typeSelector'],
    })

    const placeMarkers = async () => {
      for (const point of points) {
        let coords: [number, number] | null = null

        // Если есть готовые координаты — используем их
        if (point.latitude && point.longitude) {
          coords = [point.latitude, point.longitude]
        } else {
          // Иначе геокодируем адрес через ymaps.geocode()
          try {
            const fullAddress = /краснодар|москва|санкт/i.test(point.address)
              ? point.address
              : `Краснодар, ${point.address}`

            const res = await ymaps.geocode(fullAddress)
            const c = res.geoObjects.get(0)?.geometry?.getCoordinates()
            if (c) coords = c
          } catch {
            // геокодинг не удался, пропускаем
          }
        }

        if (coords) {
          const placemark = new ymaps.Placemark(
            coords,
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
        }
      }

      // Автоматическое центрирование по всем маркерам
      if (map.geoObjects.getLength() > 0) {
        map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
      }
      setLoading(false)
    }

    placeMarkers()

    return () => {
      map.destroy()
    }
  }, [mapReady, points])

  return (
    <div className="relative h-full w-full" style={{ minHeight: 400 }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-loko-bg-base/60 text-sm text-loko-text-muted">
          Загрузка карты…
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
