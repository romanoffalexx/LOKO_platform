import { type FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IconArrowRight, IconShield, IconCheck } from '@/components/ui/icons'

export const TabletConsent: FC = () => {
  const nav = useNavigate()
  const [pdn, setPdn] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [showDoc, setShowDoc] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col"
    >
      <h2 className="text-2xl font-bold text-loko-text-primary">Согласие</h2>
      <p className="mt-1 text-sm text-loko-text-secondary">
        Подтвердите согласие на обработку персональных данных. Это обязательное условие.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <label className={`card-elevated cursor-pointer p-4 transition-all ${pdn ? 'border-loko-pink/60 shadow-glow-soft' : ''}`}>
          <div className="flex items-start gap-3">
            <input type="checkbox" checked={pdn} onChange={e => setPdn(e.target.checked)} className="sr-only" />
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${pdn ? 'border-loko-pink bg-gradient-brand' : 'border-loko-bg-border bg-loko-bg-base/60'}`}>
              {pdn && <IconCheck size={12} className="text-white" />}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-loko-text-primary">
                <IconShield size={14} className="text-loko-pink" />
                Согласен на обработку ПДн <span className="badge badge-pink !py-0 text-[10px]">обязательно</span>
              </div>
              <div className="mt-1 text-xs text-loko-text-secondary">
                ФИО, телефон, источник регистрации, версия согласия — фиксируются в системе ЯОКО.
              </div>
              <button onClick={e => { e.preventDefault(); setShowDoc(s => !s) }} className="mt-2 text-xs text-loko-pink hover:underline">
                {showDoc ? 'Скрыть текст' : 'Открыть текст согласия'}
              </button>
              {showDoc && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-loko-bg-border bg-loko-bg-base/60 p-2 text-[11px] leading-relaxed text-loko-text-muted">
                  Настоящим я даю согласие ООО «ЯОКО» (ИНН ……) на обработку моих персональных данных в составе: имя, номер телефона, источник регистрации, версия согласия, дата и время — в целях участия в локальных акциях партнёров и получения одноразовых купонов. Согласие действует до отзыва. Регистрация ПД: № ………..
                </motion.div>
              )}
            </div>
          </div>
        </label>

        <label className={`card-elevated cursor-pointer p-4 transition-all ${marketing ? 'border-loko-violet/60' : ''}`}>
          <div className="flex items-start gap-3">
            <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="sr-only" />
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${marketing ? 'border-loko-violet bg-gradient-to-br from-loko-violet to-loko-purple' : 'border-loko-bg-border bg-loko-bg-base/60'}`}>
              {marketing && <IconCheck size={12} className="text-white" />}
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-loko-text-primary">
                Готов получать информацию об акциях <span className="badge badge-violet !py-0 text-[10px]">необязательно</span>
              </div>
              <div className="mt-1 text-xs text-loko-text-secondary">
                Канал: только e-mail/MAX. SMS в MVP не используется.
              </div>
            </div>
          </div>
        </label>
      </div>

      <button
        disabled={!pdn}
        onClick={() => {
          // Сохраняем согласия для следующих шагов
          sessionStorage.setItem('loko_consent', JSON.stringify({ pdn, marketing }))
          nav('/tablet/spin')
        }}
        className="btn-brand mt-6 w-full py-4 text-base"
      >
        Запустить барабан
        <IconArrowRight size={16} />
      </button>

      <div className="mt-3 text-center text-[10px] text-loko-text-muted">
        Согласие v1.2 · 12.08.2026 · ЯОКО
      </div>
    </motion.div>
  )
}
