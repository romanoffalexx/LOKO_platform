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
 * Фронтенд только отображает готовые координаты из БД.
 * Геокодирование происходит на бэкенде при создании/обновлении точки.
 */
export function YandexPointsMap({ points }: { points: Point[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
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

    // Фильтруем только точки с валидными координатами
    const validPoints = points.filter(p => p.latitude !== null && p.longitude !== null)

    validPoints.forEach(point => {
      const placemark = new ymaps.Placemark(
        [point.latitude!, point.longitude!],
        {
          balloonContentHeader: point.name,
          balloonContentBody: point.address,
          hintContent: point.name,
        },
        {
          preset: point.is_active ? 'islands#greenDotIcon' : 'islands#grayDotIcon',
        }
      )
      map.geoObjects.add(placemark)
    })

    // Автоматическое центрирование по всем маркерам
    if (validPoints.length > 0) {
      map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
    }

    return () => {
      map.destroy()
    }
  }, [mapReady, points])

  return (
    <div className="relative h-full w-full" style={{ minHeight: 400 }}>
      {!mapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-loko-bg-base/60 text-sm text-loko-text-muted">
          Загрузка карты…
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
