import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { Order } from '@/api/orders.api'
import { getCountryName } from '@/lib/countries'
import { formatAmount } from '@/lib/format'

// Brand palette (tailwind.config.js: brand.navy / brand.gold).
const NAVY = '#002365'
const GOLD = '#C08C40'
const GRAY = '#6B7280'
const LIGHT_BORDER = '#E5E5E5'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111111',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: { width: 130, height: 26.5 },
  invoiceTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: NAVY,
    textAlign: 'right',
  },
  metaText: {
    marginTop: 4,
    fontSize: 9,
    color: GRAY,
    textAlign: 'right',
  },
  goldRule: {
    marginTop: 16,
    marginBottom: 16,
    height: 2,
    backgroundColor: GOLD,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  addressBlock: { width: '48%' },
  addressLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: NAVY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  addressText: { fontSize: 10, lineHeight: 1.5, color: '#333333' },
  table: { marginTop: 4 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_BORDER,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  colProduct: { width: '46%' },
  colSize: { width: '22%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '11%', textAlign: 'right' },
  colTotal: { width: '11%', textAlign: 'right' },
  itemName: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY },
  itemSubtitle: { fontSize: 8.5, color: GRAY, marginTop: 1 },
  itemOption: { fontSize: 8, color: GRAY, marginTop: 1.5 },
  cellText: { fontSize: 9.5, color: '#333333' },
  totalsBlock: {
    marginTop: 16,
    alignSelf: 'flex-end',
    width: '45%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalsLabel: { fontSize: 9.5, color: GRAY },
  totalsValue: { fontSize: 9.5, color: '#111111' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: NAVY,
  },
  grandTotalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: NAVY },
  grandTotalValue: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: NAVY },
  notesBlock: {
    marginTop: 24,
    padding: 10,
    backgroundColor: '#F7F5F2',
    borderRadius: 4,
  },
  notesLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: NAVY, marginBottom: 3 },
  notesText: { fontSize: 9.5, color: '#444444', lineHeight: 1.4 },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: LIGHT_BORDER,
    paddingTop: 10,
  },
  footerThanks: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY },
  footerTagline: { fontSize: 8.5, color: GRAY, marginTop: 2 },
})

function formatOMR(n: number) {
  return `OMR ${formatAmount(n)}`
}

/** "Label: value" lines for every option this line was ordered with, skipping
 *  any the customer didn't select. Mirrors the order-complete page's list. */
function itemOptions(item: Order['items'][number]): string[] {
  return [
    item.matSizeName ? `Mat: ${item.matSizeName}` : null,
    item.matColorName ? `Mat color: ${item.matColorName}` : null,
    item.paperTypeName ? `Paper Type: ${item.paperTypeName}` : null,
    item.mdfName ? `MDF Type: ${item.mdfName}` : null,
    item.laminationName ? `Lamination: ${item.laminationName}` : null,
    item.glassTypeName ? `Glass Type: ${item.glassTypeName}` : null,
  ].filter((v): v is string => !!v)
}

function formatAddress(order: Order): string {
  return [
    order.houseNumber ? `Building Number ${order.houseNumber}` : null,
    order.location,
    order.address,
    order.city,
    getCountryName(order.country),
  ]
    .filter(Boolean)
    .join(', ')
}

export function InvoiceDocument({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Document title={`Invoice ${order.orderNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Image style={styles.logo} src="/images/logo.png" />
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.metaText}>Order #{order.orderNumber}</Text>
            <Text style={styles.metaText}>{date}</Text>
          </View>
        </View>
        <View style={styles.goldRule} />

        {/* Billing / shipping */}
        <View style={styles.addressRow}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Billed To</Text>
            <Text style={styles.addressText}>{order.customerName}</Text>
            {order.companyName ? <Text style={styles.addressText}>{order.companyName}</Text> : null}
            <Text style={styles.addressText}>{order.customerEmail}</Text>
            {order.customerPhone ? <Text style={styles.addressText}>{order.customerPhone}</Text> : null}
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Shipping &amp; Billing Address</Text>
            <Text style={styles.addressText}>{formatAddress(order)}</Text>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Product</Text>
            <Text style={[styles.tableHeaderCell, styles.colSize]}>Size</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {order.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colProduct}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
                {/* Options the customer actually chose. Unselected ones are
                    dropped, so a frame without glass/lamination lists nothing
                    extra — same rule as the order-complete page. */}
                {itemOptions(item).map((opt) => (
                  <Text key={opt} style={styles.itemOption}>
                    {opt}
                  </Text>
                ))}
              </View>
              <Text style={[styles.cellText, styles.colSize]}>
                {item.widthCm.toFixed(1)} x {item.heightCm.toFixed(1)} cm
              </Text>
              <Text style={[styles.cellText, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.cellText, styles.colPrice]}>{formatAmount(item.pricePerItem)}</Text>
              <Text style={[styles.cellText, styles.colTotal]}>{formatAmount(item.pricePerItem * item.qty)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatOMR(order.subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Standard Shipping</Text>
            <Text style={styles.totalsValue}>{formatOMR(order.shipping)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Payment method</Text>
            <Text style={styles.totalsValue}>Cash on delivery</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total payment</Text>
            <Text style={styles.grandTotalValue}>{formatOMR(order.total)}</Text>
          </View>
        </View>

        {order.orderNotes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Order notes</Text>
            <Text style={styles.notesText}>{order.orderNotes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerThanks}>Thank you for shopping with Cretixone</Text>
          <Text style={styles.footerTagline}>www.cretixone.com</Text>
        </View>
      </Page>
    </Document>
  )
}
