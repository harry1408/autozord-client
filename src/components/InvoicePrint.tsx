import { Invoice, ShopSettings } from '@/types';
import { format } from 'date-fns';

const fmt = (val: number) =>
  new Intl.NumberFormat('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export interface PrintFormData {
  serviceAdvisor: string;
  visitType: string;
  mileageOut: string;
  extrasWithVehicle: string;
}

interface Props {
  invoice: Invoice;
  shop: ShopSettings;
  printData: PrintFormData;
}

const TERMS = `I hereby authorize the repair work listed herein, including sublet work, to be done along with necessary materials. You and your employees may operate the described vehicle for the purposes of testing, inspection or delivery at my risk. An express lien is acknowledged on said vehicle to secure the amount of repairs thereto. You will not be held responsible for loss or damage to vehicle or articles left in vehicle in case of fire, theft, accident or any other cause beyond your control. Customer agrees to pay all collection costs and /or attorneys fees in the event that default is made in any payment due. If vehicle is returned to customer without repair service being performed, a diagnostic and handling fee (including reassembly) may be charged. I have read and understand the above and acknowledge receipt of an estimate.`;

export default function InvoicePrint({ invoice, shop, printData }: Props) {
  const ro = invoice.repairOrder;
  const customer = invoice.customer;
  const vehicle = ro?.vehicle as ({ make: string; model: string; year: number; vin?: string; licensePlate?: string }) | undefined;
  const laborLines = ro?.laborLines ?? [];
  const partsLines = ro?.partsLines ?? [];
  const payments = invoice.payments ?? [];
  const statusHistory = (ro as any)?.statusHistory ?? [];
  const roTechnicians: any[] = (ro as any)?.technicians ?? [];

  const laborTotal = laborLines.reduce((s, l) => s + l.subtotal, 0);
  const partsTotal = partsLines.reduce((s, p) => s + p.subtotal, 0);

  const totalTaxRate = (shop.gstRate ?? 5) + (shop.pstRate ?? 7);
  const gstAmount = totalTaxRate > 0 ? invoice.taxAmount * ((shop.gstRate ?? 5) / totalTaxRate) : 0;
  const pstAmount = invoice.taxAmount - gstAmount;

  const jobName = laborLines[0]?.description?.toUpperCase() ?? ro?.roNumber ?? 'SERVICE';

  const firstTech = roTechnicians[0]?.technician?.user;
  const defaultAdvisor = firstTech ? `${firstTech.firstName} ${firstTech.lastName}` : '';

  const mileageOut = printData.mileageOut || (ro?.mileageOut ? String(ro.mileageOut) : '');

  const approvedEvent = [...statusHistory].reverse().find(
    (h: any) => h.toStatus === 'APPROVED' || h.toStatus === 'INVOICED' || h.toStatus === 'COMPLETED'
  );

  const allItems = [
    ...laborLines.map((l, i) => ({
      sr: i + 1,
      description: l.description,
      price: l.rate,
      qty: `${l.hours}`,
      qtyLabel: 'hrs',
      total: l.subtotal,
    })),
    ...partsLines.map((p, i) => ({
      sr: laborLines.length + i + 1,
      description: `${p.name}${p.partNumber ? ` (${p.partNumber})` : ''}`,
      price: p.sellingPrice,
      qty: `${p.quantity}`,
      qtyLabel: '',
      total: p.subtotal,
    })),
  ];

  // Apply tax only to the last line item for display (total tax shown on last row)
  const subtotalBeforeTax = invoice.subtotal - invoice.discount;

  const s: Record<string, React.CSSProperties> = {
    page: { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12px', color: '#000', backgroundColor: '#fff', padding: '16px', maxWidth: '870px', margin: '0 auto', lineHeight: '1.4' },
    header: { display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #555', paddingBottom: '8px', marginBottom: '8px' },
    shopName: { fontWeight: 'bold', fontSize: '16px', marginBottom: '2px' },
    refTable: { fontSize: '12px', borderCollapse: 'collapse' as const },
    refTd: { paddingBottom: '1px' },
    refLabel: { fontWeight: 'bold', paddingRight: '6px', whiteSpace: 'nowrap' as const },
    infoTable: { width: '100%', borderCollapse: 'collapse' as const, border: '1px solid #aaa', marginBottom: '8px' },
    infoTh: { padding: '3px 6px', fontWeight: 'bold', backgroundColor: '#f0f0f0', borderRight: '1px solid #aaa', borderBottom: '1px solid #aaa', textAlign: 'left' as const, whiteSpace: 'nowrap' as const },
    infoTd: { padding: '3px 6px', borderRight: '1px solid #aaa', verticalAlign: 'top' as const },
    jobHeader: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#e8e8e8', padding: '3px 6px', marginBottom: '2px', fontWeight: 'bold', fontSize: '12px' },
    itemTable: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '8px', border: '1px solid #aaa' },
    th: { backgroundColor: '#d0d0d0', padding: '3px 5px', borderRight: '1px solid #aaa', borderBottom: '1px solid #aaa', textAlign: 'left' as const, fontWeight: 'bold' },
    thR: { backgroundColor: '#d0d0d0', padding: '3px 5px', borderRight: '1px solid #aaa', borderBottom: '1px solid #aaa', textAlign: 'right' as const, fontWeight: 'bold' },
    td: { padding: '3px 5px', borderRight: '1px solid #aaa', borderBottom: '1px solid #aaa', verticalAlign: 'top' as const },
    tdR: { padding: '3px 5px', borderRight: '1px solid #aaa', borderBottom: '1px solid #aaa', textAlign: 'right' as const, verticalAlign: 'top' as const },
    footRow: { backgroundColor: '#f5f5f5', borderTop: '1px solid #aaa' },
    feesTable: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '8px', border: '1px solid #aaa' },
    termsBlock: { display: 'flex', gap: '12px', marginBottom: '8px' },
    termsLeft: { flex: 1, fontSize: '11px', lineHeight: '1.4' },
    termsRight: { width: '240px', flexShrink: 0 },
    summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '2px 6px', borderBottom: '1px solid #eee' },
    summaryRowBold: { display: 'flex', justifyContent: 'space-between', padding: '2px 6px', fontWeight: 'bold', borderTop: '1px solid #aaa', borderBottom: '1px solid #eee' },
    txTable: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '8px', border: '1px solid #aaa' },
    authSection: { border: '1px solid #aaa', padding: '6px', fontSize: '12px' },
    sigBox: { border: '1px solid #aaa', height: '40px', marginTop: '4px', width: '140px' },
  };

  return (
    <div id="invoice-print" style={s.page}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print {
            position: fixed !important;
            inset: 0 !important;
            margin: 0 !important;
            padding: 12px !important;
            max-width: 100% !important;
            font-size: 11px !important;
          }
          @page { margin: 8mm; size: A4; }
        }
      `}</style>

      {/* ── LOGO (centered, top of page) ──────────────────────────────── */}
      {shop.logoUrl && (
        <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '20px' }}>
          <img src={shop.logoUrl} alt="logo" style={{ height: '60px', display: 'inline-block' }} />
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <div>
          <div style={s.shopName}>{shop.shopName}</div>
          {shop.address && <div>{shop.address}</div>}
          {shop.email && <div>{shop.email}</div>}
          {shop.phone && <div>{shop.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <table style={s.refTable}>
            <tbody>
              <tr>
                <td style={{ ...s.refTd, ...s.refLabel }}>REF RO#:</td>
                <td style={s.refTd}>{ro?.roNumber ?? '—'}</td>
              </tr>
              <tr>
                <td style={{ ...s.refTd, ...s.refLabel }}>Invoice #:</td>
                <td style={s.refTd}>{invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style={{ ...s.refTd, ...s.refLabel }}>Invoice Date:</td>
                <td style={s.refTd}>{format(new Date(invoice.createdAt), 'MM/dd/yyyy')}</td>
              </tr>
              <tr>
                <td style={{ ...s.refTd, ...s.refLabel }}>Order Date:</td>
                <td style={s.refTd}>{ro?.createdAt ? format(new Date(ro.createdAt as any), 'MM/dd/yyyy') : format(new Date(invoice.createdAt), 'MM/dd/yyyy')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── INFO BAR ───────────────────────────────────────────────────── */}
      <table style={s.infoTable}>
        <thead>
          <tr>
            <th style={s.infoTh}>Customer Info:</th>
            <th style={s.infoTh}>Vehicle Info:</th>
            <th style={s.infoTh}>Visit Type:</th>
            <th style={s.infoTh}>Mileage In:</th>
            <th style={{ ...s.infoTh, borderRight: 'none' }}>Extras with Vehicle:</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={s.infoTd}>
              <div style={{ fontWeight: 'bold' }}>
                {customer?.firstName?.toUpperCase()} {customer?.lastName?.toUpperCase()}
              </div>
              {customer?.email && <div>{customer.email.toUpperCase()}</div>}
              {customer?.phone && <div>{customer.phone}</div>}
            </td>
            <td style={s.infoTd}>
              {vehicle && (
                <div style={{ fontWeight: 'bold' }}>
                  {vehicle.year} {vehicle.make?.toUpperCase()} {vehicle.model?.toUpperCase()}
                </div>
              )}
              {vehicle?.vin && <div>{vehicle.vin}</div>}
              {vehicle?.licensePlate && <div>License Plate: {vehicle.licensePlate}</div>}
            </td>
            <td style={s.infoTd}>
              <div>{printData.visitType || '—'}</div>
              <div style={{ marginTop: '6px', fontWeight: 'bold' }}>Service Advisor:</div>
              <div>{printData.serviceAdvisor || defaultAdvisor || '—'}</div>
            </td>
            <td style={s.infoTd}>
              <div>{ro?.mileageIn ? `${ro.mileageIn} KM` : '—'}</div>
              <div style={{ marginTop: '6px', fontWeight: 'bold' }}>Mileage Out:</div>
              <div>{mileageOut ? `${mileageOut} KM` : '—'}</div>
            </td>
            <td style={{ ...s.infoTd, borderRight: 'none' }}>
              <div>{printData.extrasWithVehicle || '—'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── JOB HEADER ─────────────────────────────────────────────────── */}
      <div style={s.jobHeader}>
        <span>1 of 1. {jobName}</span>
        <span>Reference: Tech Recommendation</span>
      </div>

      {/* ── ITEMS TABLE ────────────────────────────────────────────────── */}
      <table style={s.itemTable}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: '28px' }}>Sr#</th>
            <th style={s.th}>Item Description</th>
            <th style={{ ...s.thR, width: '60px' }}>Price</th>
            <th style={{ ...s.thR, width: '60px' }}>QTY/Hrs</th>
            <th style={{ ...s.thR, width: '58px' }}>Discount</th>
            <th style={{ ...s.thR, width: '55px' }}>Tax</th>
            <th style={{ ...s.thR, width: '65px', borderRight: 'none' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {allItems.map((item, idx) => {
            const isLast = idx === allItems.length - 1;
            const taxOnItem = isLast ? invoice.taxAmount : 0;
            return (
              <tr key={idx}>
                <td style={s.td}>{item.sr}</td>
                <td style={s.td}>{item.description}</td>
                <td style={s.tdR}>${fmt(item.price)}</td>
                <td style={s.tdR}>{item.qty}{item.qtyLabel ? ` ${item.qtyLabel}` : ''}</td>
                <td style={s.tdR}>$0</td>
                <td style={s.tdR}>{taxOnItem > 0 ? `$${fmt(taxOnItem)}` : '$0'}</td>
                <td style={{ ...s.tdR, borderRight: 'none' }}>${fmt(item.total + (isLast ? invoice.taxAmount : 0))}</td>
              </tr>
            );
          })}
          {allItems.length === 0 && (
            <tr>
              <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#888' }}>No line items</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={s.footRow}>
            <td colSpan={7} style={{ padding: '4px 6px', borderTop: '1px solid #aaa' }}>
              <span>Labor: ${fmt(laborTotal)}</span>
              <span style={{ marginLeft: '12px' }}>Parts &amp; Supplies: ${fmt(partsTotal)}</span>
              <span style={{ marginLeft: '12px' }}>Miscellaneous: $0.00</span>
              <span style={{ marginLeft: '12px' }}>Discount: ${fmt(invoice.discount)}</span>
              <span style={{ marginLeft: '12px' }}>Tax: ${fmt(invoice.taxAmount)}</span>
              {(shop.pstNumber || shop.gstNumber) && (
                <span style={{ marginLeft: '6px', color: '#555' }}>
                  ({shop.pstNumber ? `PST#${shop.pstNumber}: $${fmt(pstAmount)}` : `PST: $${fmt(pstAmount)}`}
                  {shop.gstNumber ? `, GST #${shop.gstNumber}: $${fmt(gstAmount)}` : `, GST: $${fmt(gstAmount)}`})
                </span>
              )}
            </td>
          </tr>
          <tr style={s.footRow}>
            <td colSpan={7} style={{ padding: '3px 6px', fontWeight: 'bold' }}>
              Total Amount: ${fmt(invoice.total)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── FEES SECTION ───────────────────────────────────────────────── */}
      <table style={s.feesTable}>
        <thead>
          <tr>
            <th style={s.th}>Fee</th>
            <th style={{ ...s.thR, width: '80px' }}>Amount</th>
            <th style={{ ...s.thR, width: '60px' }}>Tax</th>
            <th style={{ ...s.thR, width: '140px' }}>
              Approved Total<br />
              <span style={{ fontWeight: 'normal', fontSize: '10px' }}>(Sub Total + Fee Amount + Fee)</span>
            </th>
            <th style={{ ...s.thR, width: '140px', borderRight: 'none' }}>
              Estimated Total<br />
              <span style={{ fontWeight: 'normal', fontSize: '10px' }}>(Sub Total + Fee Amount + Fee)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={s.td}>
              <div>Supply Fee</div>
              <div style={{ fontSize: '10px', color: '#666' }}>calculated estimate fees: $0</div>
              <div style={{ fontSize: '10px', color: '#666' }}>calculated approved fees: $0</div>
            </td>
            <td style={s.tdR}>$0.00</td>
            <td style={s.tdR}>0%</td>
            <td style={s.tdR}>${fmt(subtotalBeforeTax)}</td>
            <td style={{ ...s.tdR, borderRight: 'none' }}>${fmt(subtotalBeforeTax)}</td>
          </tr>
        </tbody>
      </table>

      {/* ── TERMS + SUMMARY ────────────────────────────────────────────── */}
      <div style={s.termsBlock}>
        <div style={s.termsLeft}>
          <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Terms &amp; Conditions:</div>
          <p style={{ margin: 0 }}>{TERMS}</p>
          <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Signature</div>
          <div style={s.sigBox} />
        </div>
        <div style={s.termsRight}>
          <div style={{ border: '1px solid #aaa', fontSize: '12px' }}>
            {[
              { label: 'Total Parts & Supplies', val: `$${fmt(partsTotal)}` },
              { label: 'Subtotal', val: `$${fmt(invoice.subtotal)}` },
              { label: 'Total Discount', val: `-$${fmt(invoice.discount)}` },
              { label: 'Total Tax', val: `$${fmt(invoice.taxAmount)}` },
              ...(shop.gstNumber ? [{ label: `GST #${shop.gstNumber}`, val: `$${fmt(gstAmount)}` }] : [{ label: 'GST', val: `$${fmt(gstAmount)}` }]),
              ...(shop.pstNumber ? [{ label: `PST# ${shop.pstNumber}`, val: `$${fmt(pstAmount)}` }] : [{ label: 'PST', val: `$${fmt(pstAmount)}` }]),
              { label: 'Extra Amount', val: '$0.00' },
              { label: 'Credit Card Fee (Calculated Credit Card Fee: $0)', val: '0%' },
              { label: 'Supply Fee (Calculated Supply Fee: $0)', val: '$0.00' },
            ].map(({ label, val }) => (
              <div key={label} style={s.summaryRow}>
                <span style={{ color: '#555' }}>{label}</span>
                <span>{val}</span>
              </div>
            ))}
            <div style={s.summaryRowBold}>
              <span>Grand Total</span>
              <span>${fmt(invoice.total)}</span>
            </div>
            <div style={s.summaryRow}>
              <span>Paid Amount</span>
              <span style={{ color: '#166534' }}>${fmt(invoice.amountPaid)}</span>
            </div>
            <div style={{ ...s.summaryRowBold, color: invoice.balance > 0 ? '#991b1b' : '#166534' }}>
              <span>Remaining Amount:</span>
              <span>${fmt(invoice.balance)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRANSACTION HISTORY ────────────────────────────────────────── */}
      {payments.length > 0 && (
        <>
          <div style={{ fontWeight: 'bold', marginBottom: '3px', marginTop: '6px' }}>Transaction History</div>
          <table style={s.txTable}>
            <thead>
              <tr>
                <th style={s.th}>Date</th>
                <th style={s.th}>Name</th>
                <th style={{ ...s.th, width: '30px' }}>CC</th>
                <th style={s.th}>Payment Method</th>
                <th style={s.th}>Info</th>
                <th style={{ ...s.thR, width: '70px' }}>Amount</th>
                <th style={{ ...s.th, borderRight: 'none', width: '50px' }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id} style={{ backgroundColor: i % 2 === 1 ? '#fafafa' : '#fff' }}>
                  <td style={s.td}>{format(new Date(p.paidAt), 'yyyy-MM-dd')}</td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 'bold' }}>
                      {customer?.firstName?.toUpperCase()} {customer?.lastName?.toUpperCase()}
                    </div>
                    {customer?.phone && <div style={{ color: '#555' }}>{customer.phone}</div>}
                  </td>
                  <td style={s.td} />
                  <td style={s.td}>{p.method.charAt(0) + p.method.slice(1).toLowerCase()}</td>
                  <td style={s.td}>{p.referenceNumber ?? '—'}</td>
                  <td style={s.tdR}>${fmt(p.amount)}</td>
                  <td style={{ ...s.td, borderRight: 'none', color: '#166534', fontWeight: 'bold' }}>Paid</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── AUTHORIZATION HISTORY ──────────────────────────────────────── */}
      {statusHistory.length > 0 && (
        <>
          <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Authorization History:</div>
          <div style={s.authSection}>
            {approvedEvent && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '3px', fontSize: '11px', color: '#555' }}>
                <span>
                  By {approvedEvent.changedBy
                    ? `${approvedEvent.changedBy.firstName} ${approvedEvent.changedBy.lastName}`
                    : printData.serviceAdvisor || defaultAdvisor || '—'
                  } via In Person
                </span>
                <span>{format(new Date(approvedEvent.changedAt), 'hh:mm a • MM/dd/yyyy')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>{jobName}</span>
                <span style={{ backgroundColor: '#166534', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontSize: '11px' }}>Approved</span>
              </div>
              <span style={{ fontWeight: 'bold' }}>${fmt(invoice.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '3px' }}>
              <span>Total Amount:</span>
              <span>${fmt(invoice.total)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
