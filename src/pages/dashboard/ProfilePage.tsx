import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PhoneField } from '@/components/auth/PhoneField'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(80),
  lastName: z.string().trim().min(1, 'Required').max(80),
  phone: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  zipcode: z.string().trim().max(20).optional(),
})
type Values = z.infer<typeof schema>

const fieldCls = 'border border-black/15'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
      zipcode: user?.zipcode ?? '',
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        address: user.address ?? '',
        zipcode: user.zipcode ?? '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const submit = form.handleSubmit(async (v) => {
    const updated = await authApi.updateProfile({
      firstName: v.firstName,
      lastName: v.lastName,
      phone: v.phone || undefined,
      address: v.address || undefined,
      zipcode: v.zipcode || undefined,
    })
    setUser(updated)
  })

  const e = form.formState.errors

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-lg font-semibold text-brand-navy">Profile settings</h2>
      <p className="mt-1 text-sm text-foreground/55">Update your contact and shipping details.</p>

      <form onSubmit={submit} className="mt-6 max-w-xl space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-first">First name</Label>
            <Input id="p-first" className={cn('mt-1', fieldCls)} {...form.register('firstName')} />
            {e.firstName && <p className="mt-1 text-[11px] text-red-500">{e.firstName.message}</p>}
          </div>
          <div>
            <Label htmlFor="p-last">Last name</Label>
            <Input id="p-last" className={cn('mt-1', fieldCls)} {...form.register('lastName')} />
            {e.lastName && <p className="mt-1 text-[11px] text-red-500">{e.lastName.message}</p>}
          </div>
        </div>

        <div>
          <Label>Email</Label>
          <Input value={user?.email ?? ''} disabled className={cn('mt-1 bg-black/[0.03]', fieldCls)} />
          <p className="mt-1 text-[11px] text-foreground/40">Email can't be changed.</p>
        </div>

        <div>
          <Label htmlFor="p-phone">Phone</Label>
          <div className="mt-1">
            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => <PhoneField id="p-phone" value={field.value} onChange={field.onChange} />}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="p-address">Address</Label>
          <Input id="p-address" className={cn('mt-1', fieldCls)} {...form.register('address')} />
        </div>
        <div>
          <Label htmlFor="p-zip">Zip code</Label>
          <Input id="p-zip" className={cn('mt-1', fieldCls)} {...form.register('zipcode')} />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="navy" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}
