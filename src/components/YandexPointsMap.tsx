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
 * Карта Яндекс с маркерами точек организации.
 * Если адрес не содержит город — подразумевается Краснодар.
 */
export function YandexPointsMap({ points }: { points: Point[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)

  // Загружаем API Яндекса один раз
  useEffect(() => {
    if (window.ymaps) {
      setMapReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=none&lang=ru_RU'
    script.async = true
    script.onload = () => {
      window.ymaps.ready(() => setMapReady(true))
    }
    document.head.appendChild(script)
  }, [])

  // Инициализируем карту и размещаем маркеры
  useEffect(() => {
    if (!mapReady || !mapRef.current || points.length === 0) {
      setLoading(false)
      return
    }

    const ymaps = window.ymaps
    const map = new ymaps.Map(mapRef.current, {
      center: [45.0355, 38.9753], // Краснодар по умолчанию
      zoom: 12,
      controls: ['zoomControl', 'typeSelector'],
    })

    let placedCount = 0

    points.forEach((point) => {
      // Если адрес не содержит город — добавляем Краснодар
      const fullAddress = /краснодар|москва|санкт/i.test(point.address)
        ? point.address
        : `Краснодар, ${point.address}`

      ymaps.geocode(fullAddress).then((res: any) => {
        const coords = res.geoObjects.get(0)?.geometry?.getCoordinates()
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
          placedCount++
        }
      }).catch(() => {
        // geocoding failed, skip
      })
    })

    // Центрируем карту по маркерам после гекодинга
    setTimeout(() => {
      if (map.geoObjects.getLength() > 0) {
        map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
      }
      setLoading(false)
    }, 2000)

    return () => {
      map.destroy()
    }
  }, [mapReady, points])

  if (points.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-loko-text-muted">
        Нет точек для отображения на карте
      </div>
    )
  }

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
