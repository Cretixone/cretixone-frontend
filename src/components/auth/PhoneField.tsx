import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { cn } from '@/lib/utils'

interface Props {
  value?: string
  onChange: (value?: string) => void
  placeholder?: string
  invalid?: boolean
  id?: string
}

/**
 * react-phone-number-input wrapped to match the app's input styling. The
 * library renders a country <select> + flag + text input; we style the
 * surrounding box and let `.PhoneInputInput` go borderless (see index.css).
 */
export function PhoneField({ value, onChange, placeholder = 'Phone number', invalid, id }: Props) {
  return (
    <div
      className={cn(
        'phone-field flex h-10 w-full items-center rounded-lg border bg-white px-3 text-sm transition focus-within:ring-2',
        invalid
          ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-200'
          : 'border-black/15 focus-within:border-brand-gold focus-within:ring-brand-gold/30',
      )}
    >
      <PhoneInput
        id={id}
        international
        defaultCountry="OM"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  )
}
