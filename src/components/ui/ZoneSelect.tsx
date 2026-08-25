import { useEffect, useState } from 'react'
import { zonesApi } from '@/lib/api'

/**
 * Поле «Зона» для формы точки: всплывающий список зон из справочника
 * и кнопка «+» для создания новой зоны на лету.
 */
export function ZoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [zones, setZones] = useState<{ id: string; name: string }[]>([])

  const load = async () => {
    try { setZones(await zonesApi.list()) } catch { /* справочник недоступен — поле не критичное */ }
  }
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    const name = window.prompt('Название новой зоны:')
    if (!name || !name.trim()) return
    try {
      await zonesApi.create({ name: name.trim() })
      await load()
      onChange(name.trim())
    } catch (err) {
      console.error('[Zone create]', err)
    }
  }

  // Значение может быть «старым» (не из справочника) — показываем его отдельным пунктом
  const hasLegacyValue = !!value && !zones.some(z => z.name === value)

  return (
    <div className="flex items-center gap-2">
      <select value={value} onChange={e => onChange(e.target.value)} className="input w-full">
        <option value="">— не выбрана —</option>
        {hasLegacyValue && <option value={value}>{value}</option>}
        {zones.map(z => (
          <option key={z.id} value={z.name}>{z.name}</option>
        ))}
      </select>
      <button type="button" onClick={handleAdd} title="Создать новую зону" className="btn-ghost shrink-0 px-2 text-base leading-none">
        +
      </button>
    </div>
  )
}
