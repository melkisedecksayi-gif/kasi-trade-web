export const printReceipt = ({ items, total, date, shopName, receiptNo }) => {
  const win = window.open('', '_blank', 'width=380,height=600');
  const rows = (items || []).map(i => `
    <tr>
      <td style="padding:4px 0;font-size:12px;">${i.name} x${i.quantity || 1}</td>
      <td style="padding:4px 0;font-size:12px;text-align:right;">${i.price?.toLocaleString() || i.sell_price?.toLocaleString()}</td>
    </tr>
  `).join('');

  win.document.write(`
    <html><head><title>Receipt</title>
    <style>
      body { font-family: 'Courier New', monospace; max-width: 320px; margin: 0 auto; padding: 20px; color: #000; }
      h2 { text-align: center; margin: 0; font-size: 18px; }
      .sub { text-align: center; font-size: 11px; color: #555; margin: 4px 0 16px; }
      .divider { border: none; border-top: 1px dashed #000; margin: 10px 0; }
      .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 8px; }
      .footer { text-align: center; font-size: 10px; color: #777; margin-top: 16px; }
      @media print { body { padding: 0; } }
    </style></head><body>
      <h2>${shopName || 'KasiTRADE'}</h2>
      <p class="sub">${receiptNo ? 'Receipt #' + receiptNo : ''}<br/>${new Date(date).toLocaleDateString('sw-TZ', { day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' })}</p>
      <hr class="divider" />
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <hr class="divider" />
      <p class="total">TSh ${(total || 0).toLocaleString()}</p>
      <p class="footer">Asante kwa kununua kwetu!<br/>Karibu tena</p>
      <script>window.onload=function(){window.print();window.close();}</script>
    </body></html>
  `);
  win.document.close();
};

export const printReport = ({ title, headers, rows, totals }) => {
  const win = window.open('', '_blank', 'width=900,height=700');
  const thRow = (headers || []).map(h => `<th style="padding:8px 12px;text-align:left;border-bottom:2px solid #6366f1;font-size:12px;">${h}</th>`).join('');
  const dataRow = (rows || []).map(r => `
    <tr>${(r || []).map(c => `<td style="padding:7px 12px;border-bottom:1px solid #eee;font-size:12px;">${c}</td>`).join('')}</tr>
  `).join('');
  const totalRow = totals ? `
    <tr style="font-weight:bold;">${(totals || []).map(t => `<td style="padding:8px 12px;border-top:2px solid #6366f1;font-size:13px;">${t}</td>`).join('')}</tr>
  ` : '';

  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: 'Inter', sans-serif; padding: 30px; color: #0f172a; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .date { font-size: 12px; color: #64748b; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; }
      .no-print { margin-bottom: 16px; }
      @media print {
        body { padding: 0; }
        .no-print { display: none; }
      }
    </style></head><body>
      <div class="no-print">
        <button onclick="window.print()" style="padding:8px 20px;background:#6366f1;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Print / Save PDF</button>
      </div>
      <h1>${title}</h1>
      <p class="date">${new Date().toLocaleDateString('sw-TZ', { day:'numeric', month:'long', year:'numeric' })}</p>
      <table><thead><tr>${thRow}</tr></thead><tbody>${dataRow}${totalRow}</tbody></table>
    </body></html>
  `);
  win.document.close();
};
