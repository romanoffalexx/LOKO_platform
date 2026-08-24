/**
 * Экспорт данных в CSV-файл.
 * Автоматически экранирует значения с запятыми и кавычками.
 */

function escapeCsv(value: any): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Сгенерировать CSV-строку из массива объектов.
 * @param data   — массив строк (объектов)
 * @param columns — массив { key, label } для порядка и заголовков колонок
 */
export function toCsv(
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
): string {
  const header = columns.map(c => escapeCsv(c.label)).join(',')
  const rows = data.map(row =>
    columns.map(c => escapeCsv(row[c.key])).join(',')
  )
  return [header, ...rows].join('\n')
}

/**
 * Скачать CSV-файл.
 */
export function downloadCsv(csv: string, filename: string) {
  const BOM = '\uFEFF' // UTF-8 BOM для корректного открытия в Excel
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
