import "server-only"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

type Org = {
  name: string
  businessName: string | null
  email: string | null
  phone: string | null
  website: string | null
  logoUrl?: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

type Customer = {
  fullName: string
  email: string | null
  phone: string | null
  homeAddress: string | null
  workAddress: string | null
}

type Item = {
  name: string
  type: string
  quantity: number
  unitPrice: any
  lineTotal: any
}

type Payment = {
  amount: any
  method: string
  paidAt: Date
  notes: string | null
}

type SaleForPdf = {
  id: string
  description: string | null
  notes: string | null
  createdAt: Date
  dueDate: Date | null
  poNumber: string | null
  serviceAddress: string | null
  subtotalAmount: any
  discountAmount: any
  taxRate: any
  taxAmount: any
  totalAmount: any
  paidAmount: any
  balanceAmount: any
  status: string
  organization: Org
  customer: Customer
  items: Item[]
  payments: Payment[]
}

function money(v: any) {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return "$0.00"
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

function fmtDate(d?: Date | null) {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return "—"
  }
}

function orgDisplayName(org: Org) {
  return (org.businessName?.trim() || org.name || "").trim()
}

function orgAddressLines(org: Org) {
  const cityStateZip = [org.city, org.state, org.zip].filter(Boolean).join(" ")
  return [org.addressLine1, org.addressLine2, cityStateZip || null, org.country]
    .filter((x) => (x ?? "").toString().trim().length > 0)
    .map((x) => String(x))
}

function customerBlocks(cust: Customer, serviceAddress?: string | null) {
  const blocks: { label: string; value: string }[] = []
  const service = (serviceAddress ?? "").trim()
  const home = (cust.homeAddress ?? "").trim()
  const work = (cust.workAddress ?? "").trim()
  if (service) blocks.push({ label: "Service Address", value: service })
  if (home) blocks.push({ label: "Home Address", value: home })
  if (work) blocks.push({ label: "Work Address", value: work })
  return blocks
}

function wrapText(text: string, maxChars: number) {
  const t = (text || "").trim()
  if (!t) return []
  const words = t.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (next.length > maxChars) {
      if (line) lines.push(line)
      line = w
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

async function embedLogo(pdf: PDFDocument, logoUrl?: string | null) {
  if (!logoUrl) return null
  const match = logoUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/)
  if (!match) return null
  const bytes = Buffer.from(match[2], "base64")
  if (match[1] === "image/png") {
    return pdf.embedPng(bytes)
  }
  return pdf.embedJpg(bytes)
}

export async function renderInvoicePdfBuffer(sale: SaleForPdf): Promise<Buffer> {
  const pdf = await PDFDocument.create()

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const LETTER = { w: 612, h: 792 }
  const margin = 48

  const text = (
    page: any,
    s: string,
    x: number,
    y: number,
    size: number,
    bold = false,
    color = rgb(0.1, 0.1, 0.1)
  ) => {
    page.drawText(s, {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color,
    })
  }

  const textRight = (
    page: any,
    s: string,
    rightX: number,
    y: number,
    size: number,
    bold = false,
    color = rgb(0.1, 0.1, 0.1)
  ) => {
    const f = bold ? fontBold : font
    const w = f.widthOfTextAtSize(s, size)
    page.drawText(s, {
      x: rightX - w,
      y,
      size,
      font: f,
      color,
    })
  }

  const line = (page: any, x1: number, y1: number, x2: number, y2: number, thickness = 1) => {
    page.drawLine({
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness,
      color: rgb(0.9, 0.9, 0.9),
    })
  }

  let page = pdf.addPage([LETTER.w, LETTER.h])
  let y = LETTER.h - margin

  const org = sale.organization
  const cust = sale.customer
  const invoiceNumber = `INV-${sale.createdAt.getFullYear()}-${sale.id.slice(-6).toUpperCase()}`
  const logoImage = await embedLogo(pdf, org.logoUrl)

  // Header
  if (logoImage) {
    const maxW = 200
    const maxH = 80
    const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height, 1)
    const w = logoImage.width * scale
    const h = logoImage.height * scale
    page.drawImage(logoImage, {
      x: LETTER.w - margin - w,
      y: LETTER.h - margin - h + 6,
      width: w,
      height: h,
    })
  }
  text(page, (org.name || "ORGANIZATION").toUpperCase(), margin, y, 9, false, rgb(0.45, 0.45, 0.45))
  y -= 18
  text(page, orgDisplayName(org) || "ByteLedger", margin, y, 18, true)
  y -= 18

  const orgLines = orgAddressLines(org)
  for (const l of orgLines) {
    text(page, l, margin, y, 10, false, rgb(0.25, 0.25, 0.25))
    y -= 14
  }

  const meta = [
    org.email ? `Email: ${org.email}` : null,
    org.phone ? `Phone: ${org.phone}` : null,
    org.website ? `Website: ${org.website}` : null,
  ].filter(Boolean) as string[]
  for (const m of meta) {
    text(page, m, margin, y, 10, false, rgb(0.25, 0.25, 0.25))
    y -= 14
  }

  y -= 10
  line(page, margin, y, LETTER.w - margin, y)
  y -= 22

  // Invoice meta
  text(page, "INVOICE", margin, y, 10, true, rgb(0.35, 0.35, 0.35))
  y -= 18
  text(page, sale.description || "Invoice", margin, y, 14, true)
  y -= 14
  text(page, `#${sale.id.slice(0, 8)}`, margin, y, 10, false, rgb(0.45, 0.45, 0.45))

  const rightX = LETTER.w - margin
  textRight(page, `Invoice #: ${invoiceNumber}`, rightX, y + 28, 10, false, rgb(0.25, 0.25, 0.25))
  textRight(page, `Created: ${fmtDate(sale.createdAt)}`, rightX, y + 14, 10, false, rgb(0.25, 0.25, 0.25))
  textRight(page, `Due: ${fmtDate(sale.dueDate)}`, rightX, y, 10, false, rgb(0.25, 0.25, 0.25))
  y -= 18
  textRight(page, `PO Number: ${sale.poNumber?.trim() || "—"}`, rightX, y, 10, false, rgb(0.25, 0.25, 0.25))
  y -= 14
  textRight(page, `Status: ${sale.status}`, rightX, y, 10, false, rgb(0.25, 0.25, 0.25))

  y -= 22
  line(page, margin, y, LETTER.w - margin, y)
  y -= 22

  // Bill To
  text(page, "BILL TO", margin, y, 10, true, rgb(0.35, 0.35, 0.35))
  y -= 18
  text(page, cust.fullName || "Customer", margin, y, 12, true)
  y -= 16

  const blocks = customerBlocks(cust, sale.serviceAddress)
  for (const b of blocks) {
    text(page, b.label, margin, y, 9, true, rgb(0.45, 0.45, 0.45))
    y -= 12
    const lines = wrapText(b.value, 70)
    for (const ln of lines) {
      text(page, ln, margin, y, 10, false, rgb(0.15, 0.15, 0.15))
      y -= 12
    }
    y -= 6
  }

  const custMeta = [
    cust.email ? `Email: ${cust.email}` : null,
    cust.phone ? `Phone: ${cust.phone}` : null,
  ].filter(Boolean) as string[]
  if (custMeta.length) {
    text(page, custMeta.join("  •  "), margin, y, 10, false, rgb(0.25, 0.25, 0.25))
    y -= 18
  }

  // Details
  if ((sale.description ?? "").trim() || (sale.notes ?? "").trim()) {
    y -= 6
    text(page, "DETAILS", margin, y, 10, true, rgb(0.35, 0.35, 0.35))
    y -= 16

    if ((sale.description ?? "").trim()) {
      text(page, "Description:", margin, y, 10, true, rgb(0.25, 0.25, 0.25))
      y -= 12
      for (const ln of wrapText(String(sale.description), 95)) {
        text(page, ln, margin, y, 10, false, rgb(0.15, 0.15, 0.15))
        y -= 12
      }
      y -= 6
    }

    if ((sale.notes ?? "").trim()) {
      text(page, "Notes:", margin, y, 10, true, rgb(0.25, 0.25, 0.25))
      y -= 12
      for (const ln of wrapText(String(sale.notes), 95)) {
        text(page, ln, margin, y, 10, false, rgb(0.15, 0.15, 0.15))
        y -= 12
      }
      y -= 6
    }

    y -= 10
    line(page, margin, y, LETTER.w - margin, y)
    y -= 22
  }

  // Items table
  const tableLeft = margin
  const tableRight = LETTER.w - margin
  const gap = 10

  const totalW = 92
  const priceW = 78
  const qtyW = 46
  const typeW = 86

  const colTotalRight = tableRight
  const colTotalLeft = colTotalRight - totalW

  const colPriceRight = colTotalLeft - gap
  const colPriceLeft = colPriceRight - priceW

  const colQtyRight = colPriceLeft - gap
  const colQtyLeft = colQtyRight - qtyW

  const colTypeRight = colQtyLeft - gap
  const colTypeLeft = colTypeRight - typeW

  const colItemLeft = tableLeft
  const colItemRight = colTypeLeft - gap

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = pdf.addPage([LETTER.w, LETTER.h])
      y = LETTER.h - margin
    }
  }

  const headerSize = 8
  text(page, "ITEM", colItemLeft, y, headerSize, true, rgb(0.35, 0.35, 0.35))
  text(page, "TYPE", colTypeLeft, y, headerSize, true, rgb(0.35, 0.35, 0.35))
  textRight(page, "QTY", colQtyRight, y, headerSize, true, rgb(0.35, 0.35, 0.35))
  textRight(page, "PRICE", colPriceRight, y, headerSize, true, rgb(0.35, 0.35, 0.35))
  textRight(page, "LINE TOTAL", colTotalRight, y, headerSize, true, rgb(0.35, 0.35, 0.35))

  y -= 12
  line(page, tableLeft, y, tableRight, y)
  y -= 14

  const itemFontSize = 10

  for (const it of sale.items || []) {
    ensureSpace(52)

    const approxChars = Math.max(18, Math.floor((colItemRight - colItemLeft) / 5.2))
    const nameLines = wrapText(it.name || "", approxChars)
    const rowLines = Math.max(1, Math.min(3, nameLines.length))
    const rowHeight = 12 * rowLines + 14

    let yy = y
    for (const ln of nameLines.slice(0, 3)) {
      text(page, ln, colItemLeft, yy, itemFontSize, false, rgb(0.12, 0.12, 0.12))
      yy -= 12
    }

    const typeStr = String(it.type || "")
    const typeMaxChars = Math.max(6, Math.floor((colTypeRight - colTypeLeft) / 5.2))
    const typeShort = typeStr.length > typeMaxChars ? typeStr.slice(0, typeMaxChars) : typeStr
    text(page, typeShort, colTypeLeft, y, itemFontSize, false, rgb(0.25, 0.25, 0.25))

    textRight(page, String(it.quantity ?? 0), colQtyRight, y, itemFontSize, false, rgb(0.12, 0.12, 0.12))
    textRight(page, money(it.unitPrice), colPriceRight, y, itemFontSize, false, rgb(0.12, 0.12, 0.12))
    textRight(page, money(it.lineTotal), colTotalRight, y, itemFontSize, false, rgb(0.12, 0.12, 0.12))

    y -= rowHeight
    line(page, tableLeft, y, tableRight, y)
    y -= 12
  }

  // Totals
  ensureSpace(140)
  const totalsRight = tableRight
  y -= 8

  textRight(page, `Subtotal: ${money(sale.subtotalAmount)}`, totalsRight, y, 11, false, rgb(0.15, 0.15, 0.15))
  y -= 14
  textRight(page, `Discount: -${money(sale.discountAmount)}`, totalsRight, y, 11, false, rgb(0.15, 0.15, 0.15))
  y -= 14
  textRight(page, `Tax (${Number(sale.taxRate || 0).toFixed(3)}%): ${money(sale.taxAmount)}`, totalsRight, y, 11, false, rgb(0.15, 0.15, 0.15))
  y -= 18
  textRight(page, `TOTAL: ${money(sale.totalAmount)}`, totalsRight, y, 13, true, rgb(0.05, 0.05, 0.05))
  y -= 18
  textRight(page, `Paid: ${money(sale.paidAmount)}`, totalsRight, y, 11, false, rgb(0.15, 0.15, 0.15))
  y -= 14
  textRight(page, `Balance: ${money(sale.balanceAmount)}`, totalsRight, y, 11, false, rgb(0.15, 0.15, 0.15))

  // Payments list
  if ((sale.payments || []).length) {
    ensureSpace(140)
    y -= 18
    text(page, "PAYMENTS", margin, y, 10, true, rgb(0.35, 0.35, 0.35))
    y -= 12
    line(page, margin, y, tableRight, y)
    y -= 14

    for (const p of sale.payments) {
      ensureSpace(32)
      const label = `${fmtDate(p.paidAt)} • ${p.method}${p.notes ? ` • ${p.notes}` : ""}`
      text(page, label, margin, y, 9, false, rgb(0.25, 0.25, 0.25))
      textRight(page, money(p.amount), tableRight, y, 9, true, rgb(0.12, 0.12, 0.12))
      y -= 14
    }
  }

  const footer = "Powered by Byte Networks. Thank you for your business."
  page.drawText(footer, {
    x: margin,
    y: margin - 10,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  const bytes = await pdf.save()
  return Buffer.from(bytes)
}
