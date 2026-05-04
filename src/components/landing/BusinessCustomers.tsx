import { useState, type FormEvent } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface FormState {
  company: string
  fullName: string
  phone: string
  email: string
  message: string
}

const INITIAL: FormState = {
  company: '',
  fullName: '',
  phone: '',
  email: '',
  message: '',
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function BusinessCustomers() {
  const [form, setForm] = useState<FormState>(INITIAL)

  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((s) => ({ ...s, [key]: e.target.value }))

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: wire to API
    // eslint-disable-next-line no-console
    console.log('[BusinessCustomers] partnership request:', form)
    setForm(INITIAL)
  }

  return (
    <section
      aria-labelledby="business-title"
      className="relative w-full pb-20 lg:pb-24 z-10"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2 md:gap-16 lg:gap-20">
          <motion.div
            className="md:pt-6 my-auto"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.14 } },
            }}
          >
            <motion.h2
              id="business-title"
              className="text-3xl tracking-tight text-brand-navy font-medium md:text-5xl"
              variants={fadeUp}
            >
              Cretix for Business
              <br />
              Customers
            </motion.h2>
            <motion.p
              className="my-8 max-w-md text-sm leading-relaxed text-foreground/75 md:text-base"
              variants={fadeUp}
            >
              Partnering with galleries, designers, and businesses to deliver
              exceptional framing solutions.
            </motion.p>

            <motion.blockquote
              className="mt-10 max-w-md rounded-[20px] border border-black/10 backdrop-blur-[2px] px-6 py-6 md:px-7 md:py-7"
              variants={fadeUp}
            >
              <p className="text-[14px] italic font-normal font-liberation text-foreground/80">
                "The Curator Lab is the only lab we trust with our limited
                edition series. Their attention to detail is simply
                unmatched."
              </p>
              <footer className="mt-4 text-sm font-semibold text-foreground">
                — Director, NYC Modern Gallery
              </footer>
            </motion.blockquote>
          </motion.div>

          {/* Right: contact form */}
          <div>
          <motion.form
            onSubmit={onSubmit}
            className="rounded-[33px] bg-[#EEF1FF] px-10 p-6 md:p-8 lg:p-10 md:max-w-[560px] md:ml-auto"
            aria-label="Request partnership"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="grid grid-cols-1 gap-5">
              <Field
                id="bc-company"
                label="Company Name"
                value={form.company}
                onChange={update('company')}
                required
              />
              <Field
                id="bc-fullname"
                label="Full Name"
                value={form.fullName}
                onChange={update('fullName')}
                required
              />
              <Field
                id="bc-phone"
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={update('phone')}
              />
              <Field
                id="bc-email"
                label="Email"
                type="email"
                value={form.email}
                onChange={update('email')}
                required
              />

              <div className="flex flex-col gap-2">
                <Label htmlFor="bc-message">Message</Label>
                <Textarea
                  id="bc-message"
                  rows={4}
                  value={form.message}
                  onChange={update('message')}
                  className='resize-none'
                />
              </div>
            </div>

            <div className="mt-7">
              <Button
                type="submit"
                variant="gold"
                size="sm"
                className="h-10 rounded-md px-6 text-xs font-medium tracking-wide"
              >
                Request Partnership
              </Button>
            </div>
          </motion.form>
          </div>
        </div>
      </div>
    </section>
  )
}

interface FieldProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

function Field({ id, label, type = 'text', value, onChange, required }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  )
}
