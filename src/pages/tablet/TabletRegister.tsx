import { type FC, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { participantsApi } from '@/lib/api'
import { IconArrowRight, IconPhone, IconCheck } from '@/components/ui/icons'

function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.length === 0) return ''
  // Отделяем код страны (7/8), если его ввели вместе с номером
  while (d.length > 10 && (d[0] === '7' || d[0] === '8')) d = d.slice(1)
  return ('+7' + d).slice(0, 12)
}

export const TabletRegister: FC = () => {
  const nav = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [phoneRaw, setPhoneRaw] = useState('+7 ')
  const [name, setName] = useState('')
  const [existing, setExisting] = useState<{ id: string; name: string } | null>(null)
  const [searching, setSearching] = useState(false)

  const formatPhoneDisplay = (digits: string): string => {
    // digits — до 11 цифр, первая = '7'
    const area = digits.slice(1) // до 10 цифр после 7
    let f = '+7'
    if (area.length > 0) f += ' (' + area.slice(0, 3)
    if (area.length >= 3) f += ') ' + area.slice(3, 6)
    if (area.length >= 6) f += ' ' + area.slice(6, 8)
    if (area.length >= 8) f += ' ' + area.slice(8, 10)
    return f
  }

  const onPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const raw = input.value
    const cursorPos = input.selectionStart ?? raw.length
    const prevLen = phoneRaw.length

    // Определяем: было ли удаление (строка стала короче или курсор не в конце)
    const isDeletion = raw.length < prevLen || cursorPos < raw.length

    // Считаем цифры до позиции курсора (для отслеживания позиции)
    let digitsBeforeCursor = 0
    for (let i = 0; i < cursorPos && i < raw.length; i++) {
      if (/\d/.test(raw[i])) digitsBeforeCursor++
    }

    // Извлекаем все цифры из ввода
    let allDigits = raw.replace(/\D/g, '')

    // Нормализуем код страны
    if (allDigits.length === 0) {
      allDigits = '7'
    } else if (allDigits[0] === '8') {
      allDigits = '7' + allDigits.slice(1)
    } else if (allDigits[0] !== '7') {
      allDigits = '7' + allDigits
    }

    // Ограничение: 7 + 10 цифр = 11
    if (allDigits.length > 11) allDigits = allDigits.slice(0, 11)

    // Форматируем для отображения
    const formatted = formatPhoneDisplay(allDigits)
    setPhoneRaw(formatted)

    // Вычисляем новую позицию курсора
    let newPos: number
    if (isDeletion && digitsBeforeCursor > 0) {
      // При удалении: курсор ставим ПОСЛЕ цифры, которая теперь на позиции N
      // Но если перед курсором символ форматирования — переносим курсор перед ним
      let pos = 0
      let digitCount = 0
      while (pos < formatted.length && digitCount < digitsBeforeCursor) {
        if (/\d/.test(formatted[pos])) digitCount++
        pos++
      }
      // Skip backwards past any formatting characters
      while (pos > 3 && pos > 0 && !/\d/.test(formatted[pos - 1])) {
        pos--
      }
      newPos = pos
    } else {
      // При вводе — обычная логика
      let pos = 0
      let digitCount = 0
      while (pos < formatted.length && digitCount < digitsBeforeCursor) {
        if (/\d/.test(formatted[pos])) digitCount++
        pos++
      }
      if (digitsBeforeCursor >= allDigits.length) pos = formatted.length
      newPos = pos
    }

    requestAnimationFrame(() => {
      input.setSelectionRange(newPos, newPos)
    })

    // Поиск участника если номер полный
    const norm = normalizePhone(formatted)
    if (norm.length >= 12) {
      setSearching(true)
      participantsApi.list({ phone: norm.slice(-10), limit: 1 })
        .then(rows => {
          if (rows.length > 0) {
            setExisting({ id: rows[0].id, name: rows[0].name })
          } else {
            setExisting(null)
          }
        })
        .catch(() => setExisting(null))
        .finally(() => setSearching(false))
    } else {
      setExisting(null)
    }
  }

  const onPhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Запрещаем удалять префикс +7
    if (e.key === 'Backspace') {
      const input = e.currentTarget
      const pos = input.selectionStart ?? 0
      if (pos <= 3) {
        e.preventDefault()
      }
    }
  }

  const canNext = normalizePhone(phoneRaw).length >= 12 && (existing || name.trim().length >= 2)

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col"
    >
      <h2 className="text-2xl font-bold text-loko-text-primary">Регистрация</h2>
      <p className="mt-1 text-sm text-loko-text-secondary">Осталось меньше минуты. Без SMS и рассылок.</p>

      {/* Приветствие если уже есть */}
      <AnimatePresence>
        {existing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-loko-success/30 bg-loko-success/10 p-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loko-success/20 text-loko-success">
              <IconCheck size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-loko-text-primary">Здравствуйте, {existing.name.split(' ')[0]}!</div>
              <div className="text-xs text-loko-text-muted">Мы вас узнали. Имя не понадобится.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex flex-col gap-3">
        <div>
          <label className="text-xs text-loko-text-muted">Телефон</label>
          <div className="relative mt-1.5">
            <IconPhone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-loko-text-muted" />
            <input
              ref={inputRef}
              type="tel"
              value={phoneRaw}
              onChange={onPhone}
              onKeyDown={onPhoneKeyDown}
              placeholder="+7 (___) ___-__-__"
              className="input pl-11 font-mono text-lg tracking-wider"
              inputMode="tel"
              autoFocus={!existing}
            />
          </div>
        </div>

        {!existing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label className="text-xs text-loko-text-muted">Имя</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Как к вам обращаться?"
              className="input mt-1.5 text-lg"
            />
          </motion.div>
        )}
      </div>

      <button
        disabled={!canNext}
        onClick={() => {
          // Сохраняем данные регистрации для следующих шагов
          sessionStorage.setItem('loko_register', JSON.stringify({
            phone: normalizePhone(phoneRaw),
            name: existing?.name ?? name,
            participantId: existing?.id ?? null,
          }))
          nav('/tablet/consent')
        }}
        className="btn-brand mt-6 w-full py-4 text-base"
      >
        Продолжить
        <IconArrowRight size={16} />
      </button>

      <div className="mt-3 text-center text-[10px] text-loko-text-muted">
        Нажимая «Продолжить», вы соглашаетесь с обработкой персональных данных
      </div>
    </motion.div>
  )
}
