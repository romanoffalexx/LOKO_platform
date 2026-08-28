import { useState, type FC, type InputHTMLAttributes } from 'react'
import { IconEye, IconEyeOff } from './icons'

/** Поле ввода пароля с иконкой «глаз» для показа/скрытия */
export const PasswordInput: FC<InputHTMLAttributes<HTMLInputElement>> = (props) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`input w-full pr-10 ${props.className || ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-loko-text-muted hover:text-loko-text-primary transition-colors"
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
      </button>
    </div>
  )
}
