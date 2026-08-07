import { pdf } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/components/InvoiceDocument'
import type { Order } from '@/api/orders.api'

/** Renders the order's invoice to a PDF and triggers a browser download. */
export async function downloadInvoice(order: Order): Promise<void> {
  const blob = await pdf(<InvoiceDocument order={order} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Invoice-${order.orderNumber}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
