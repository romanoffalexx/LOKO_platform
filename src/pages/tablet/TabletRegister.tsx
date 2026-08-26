import { type FC, useState } from 'react'
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
  const [phoneRaw, setPhoneRaw] = useState('+7 ')
  const [name, setName] = useState('')
  const [existing, setExisting] = useState<{ id: string; name: string } | null>(null)
  const [searching, setSearching] = useState(false)

  const onPhone = (v: string) => {
    // Показываем ровно то, что ввели; если стёрли префикс — восстанавливаем +7
    let val = v
    if (!val.trim().startsWith('+7')) {
      val = '+7 ' + val.replace(/\D/g, '')
    }
    // Ограничение: после +7 только 10 цифр (итого +7 XXXXXXXXXX)
    const digits = val.replace(/\D/g, '')
    if (digits.length > 11) {
      val = '+7 ' + digits.slice(1, 11)
    } else {
      val = '+7 ' + digits.slice(1)
    }
    // Форматирование: +7 (xxx) xxx xx xx
    const d = digits.slice(1) // убираем первую 7 или 8
    let formatted = '+7'
    if (d.length > 0) formatted += ' (' + d.slice(0, 3)
    if (d.length >= 3) formatted += ') ' + d.slice(3, 6)
    if (d.length >= 6) formatted += ' ' + d.slice(6, 8)
    if (d.length >= 8) formatted += ' ' + d.slice(8, 10)
    setPhoneRaw(formatted)
    const norm = normalizePhone(val)
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
              type="tel"
              value={phoneRaw}
              onChange={e => onPhone(e.target.value)}
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
