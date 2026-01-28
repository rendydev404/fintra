import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import type { Transaction } from '@/types';

interface ExportData {
  transactions: Transaction[];
  summary: {
    income: number;
    expense: number;
    netCashFlow: number;
    savingsRate: number;
  };
  dateRange: {
    from: Date;
    to: Date;
  };
  currency: string;
}

// Format amount with currency symbol
const formatAmount = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Export to Excel (XLSX format with proper tables)
export function exportToExcel(data: ExportData): void {
  const { transactions, summary, dateRange, currency } = data;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // ========== SHEET 1: RINGKASAN ==========
  const summaryData = [
    ['LAPORAN KEUANGAN'],
    [''],
    ['Informasi Laporan', ''],
    ['Periode', `${format(dateRange.from, 'dd MMMM yyyy', { locale: id })} - ${format(dateRange.to, 'dd MMMM yyyy', { locale: id })}`],
    ['Dibuat', format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })],
    ['Mata Uang', currency],
    [''],
    ['RINGKASAN KEUANGAN', ''],
    ['Keterangan', 'Jumlah'],
    ['Total Pemasukan', summary.income],
    ['Total Pengeluaran', summary.expense],
    ['Arus Kas Bersih', summary.netCashFlow],
    ['Rasio Tabungan', `${summary.savingsRate.toFixed(1)}%`],
    ['Jumlah Transaksi', transactions.length],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths for summary sheet
  summarySheet['!cols'] = [
    { wch: 25 }, // Column A
    { wch: 40 }, // Column B
  ];
  
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');
  
  // ========== SHEET 2: PENGELUARAN PER KATEGORI ==========
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const name = t.category?.name || 'Lainnya';
      expenseByCategory[name] = (expenseByCategory[name] || 0) + t.amount;
    });
  
  const sortedExpenses = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
  
  const expenseData = [
    ['PENGELUARAN PER KATEGORI'],
    [''],
    ['No', 'Kategori', 'Jumlah', 'Persentase'],
    ...sortedExpenses.map(([name, value], index) => [
      index + 1,
      name,
      value,
      summary.expense > 0 ? `${((value / summary.expense) * 100).toFixed(1)}%` : '0%',
    ]),
    ['', 'TOTAL', summary.expense, '100%'],
  ];
  
  const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
  expenseSheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 25 }, // Kategori
    { wch: 18 }, // Jumlah
    { wch: 12 }, // Persentase
  ];
  
  XLSX.utils.book_append_sheet(wb, expenseSheet, 'Pengeluaran');
  
  // ========== SHEET 3: PEMASUKAN PER KATEGORI ==========
  const incomeByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'income')
    .forEach(t => {
      const name = t.category?.name || 'Lainnya';
      incomeByCategory[name] = (incomeByCategory[name] || 0) + t.amount;
    });
  
  const sortedIncome = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);
  
  const incomeData = [
    ['PEMASUKAN PER KATEGORI'],
    [''],
    ['No', 'Kategori', 'Jumlah', 'Persentase'],
    ...sortedIncome.map(([name, value], index) => [
      index + 1,
      name,
      value,
      summary.income > 0 ? `${((value / summary.income) * 100).toFixed(1)}%` : '0%',
    ]),
    ['', 'TOTAL', summary.income, '100%'],
  ];
  
  const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
  incomeSheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 25 }, // Kategori
    { wch: 18 }, // Jumlah
    { wch: 12 }, // Persentase
  ];
  
  XLSX.utils.book_append_sheet(wb, incomeSheet, 'Pemasukan');
  
  // ========== SHEET 4: DAFTAR TRANSAKSI ==========
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );
  
  const transactionData = [
    ['DAFTAR TRANSAKSI'],
    [''],
    ['No', 'Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Akun', 'Jumlah'],
    ...sortedTransactions.map((t, index) => [
      index + 1,
      format(new Date(t.transaction_date), 'dd/MM/yyyy'),
      t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
      t.category?.name || '-',
      t.description || '-',
      t.account?.name || '-',
      t.type === 'expense' ? -t.amount : t.amount,
    ]),
  ];
  
  const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
  transactionSheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // Tanggal
    { wch: 12 }, // Tipe
    { wch: 20 }, // Kategori
    { wch: 35 }, // Deskripsi
    { wch: 15 }, // Akun
    { wch: 18 }, // Jumlah
  ];
  
  XLSX.utils.book_append_sheet(wb, transactionSheet, 'Transaksi');
  
  // Generate and download file
  const filename = `Laporan_Keuangan_${format(dateRange.from, 'yyyyMMdd')}_${format(dateRange.to, 'yyyyMMdd')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Keep old CSV export as backup (renamed)
export function exportToCSV(data: ExportData): void {
  // Just call Excel export instead
  exportToExcel(data);
}

// Export to PDF (generate HTML and print)
export function exportToPDF(data: ExportData): void {
  const { transactions, summary, dateRange, currency } = data;
  
  // Group transactions by category
  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};
  
  transactions.forEach(t => {
    const categoryName = t.category?.name || 'Lainnya';
    if (t.type === 'income') {
      incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + t.amount;
    } else if (t.type === 'expense') {
      expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + t.amount;
    }
  });
  
  // Sort by value
  const sortedIncome = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);
  const sortedExpense = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
  
  // Create print window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup diblokir. Silakan izinkan popup untuk mencetak laporan.');
    return;
  }
  
  const periodText = `${format(dateRange.from, 'dd MMMM yyyy', { locale: id })} - ${format(dateRange.to, 'dd MMMM yyyy', { locale: id })}`;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Keuangan - ${periodText}</title>
      <meta charset="utf-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3B82F6;
        }
        .header h1 {
          color: #1e40af;
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header .period {
          color: #6b7280;
          font-size: 14px;
        }
        .header .generated {
          color: #9ca3af;
          font-size: 12px;
          margin-top: 5px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .summary-card {
          background: #f9fafb;
          border-radius: 8px;
          padding: 15px;
          border: 1px solid #e5e7eb;
        }
        .summary-card .label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .summary-card .value {
          font-size: 20px;
          font-weight: 700;
          margin-top: 5px;
        }
        .summary-card .value.income { color: #059669; }
        .summary-card .value.expense { color: #dc2626; }
        .summary-card .value.net-positive { color: #059669; }
        .summary-card .value.net-negative { color: #dc2626; }
        .summary-card .value.savings { color: #2563eb; }
        .category-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .category-table th,
        .category-table td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .category-table th {
          background: #f3f4f6;
          font-weight: 600;
          font-size: 13px;
          color: #374151;
        }
        .category-table td {
          font-size: 14px;
        }
        .category-table .amount {
          text-align: right;
          font-weight: 600;
        }
        .category-table .percent {
          text-align: right;
          color: #6b7280;
          font-size: 13px;
        }
        .transaction-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 10px;
        }
        .transaction-table th,
        .transaction-table td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .transaction-table th {
          background: #f3f4f6;
          font-weight: 600;
          font-size: 11px;
          color: #374151;
          text-transform: uppercase;
        }
        .transaction-table .type-income { color: #059669; }
        .transaction-table .type-expense { color: #dc2626; }
        .transaction-table .amount {
          text-align: right;
          font-weight: 500;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #3B82F6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        .print-btn:hover {
          background: #2563eb;
        }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
      
      <div class="header">
        <h1>📊 Laporan Keuangan</h1>
        <div class="period">${periodText}</div>
        <div class="generated">Dibuat pada: ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id })}</div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Ringkasan</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Total Pemasukan</div>
            <div class="value income">${formatAmount(summary.income, currency)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Pengeluaran</div>
            <div class="value expense">${formatAmount(summary.expense, currency)}</div>
          </div>
          <div class="summary-card">
            <div class="label">Arus Kas Bersih</div>
            <div class="value ${summary.netCashFlow >= 0 ? 'net-positive' : 'net-negative'}">
              ${summary.netCashFlow >= 0 ? '+' : ''}${formatAmount(summary.netCashFlow, currency)}
            </div>
          </div>
          <div class="summary-card">
            <div class="label">Rasio Tabungan</div>
            <div class="value savings">${summary.savingsRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      
      ${sortedExpense.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Pengeluaran per Kategori</h2>
        <table class="category-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th class="amount">Jumlah</th>
              <th class="percent">%</th>
            </tr>
          </thead>
          <tbody>
            ${sortedExpense.map(([name, value]) => `
              <tr>
                <td>${name}</td>
                <td class="amount">${formatAmount(value, currency)}</td>
                <td class="percent">${((value / summary.expense) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
            <tr style="font-weight: 600; background: #f9fafb;">
              <td>Total</td>
              <td class="amount">${formatAmount(summary.expense, currency)}</td>
              <td class="percent">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${sortedIncome.length > 0 ? `
      <div class="section">
        <h2 class="section-title">Pemasukan per Kategori</h2>
        <table class="category-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th class="amount">Jumlah</th>
              <th class="percent">%</th>
            </tr>
          </thead>
          <tbody>
            ${sortedIncome.map(([name, value]) => `
              <tr>
                <td>${name}</td>
                <td class="amount">${formatAmount(value, currency)}</td>
                <td class="percent">${((value / summary.income) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
            <tr style="font-weight: 600; background: #f9fafb;">
              <td>Total</td>
              <td class="amount">${formatAmount(summary.income, currency)}</td>
              <td class="percent">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <div class="section">
        <h2 class="section-title">Daftar Transaksi (${transactions.length} transaksi)</h2>
        <table class="transaction-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Kategori</th>
              <th>Deskripsi</th>
              <th>Akun</th>
              <th class="amount">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 100).map(t => `
              <tr>
                <td>${format(new Date(t.transaction_date), 'dd/MM/yy')}</td>
                <td class="type-${t.type}">${t.type === 'income' ? 'Masuk' : t.type === 'expense' ? 'Keluar' : 'Transfer'}</td>
                <td>${t.category?.name || '-'}</td>
                <td>${t.description || '-'}</td>
                <td>${t.account?.name || '-'}</td>
                <td class="amount type-${t.type}">${t.type === 'expense' ? '-' : '+'}${formatAmount(t.amount, currency)}</td>
              </tr>
            `).join('')}
            ${transactions.length > 100 ? `
              <tr>
                <td colspan="6" style="text-align: center; color: #6b7280; font-style: italic;">
                  ... dan ${transactions.length - 100} transaksi lainnya (lihat file CSV untuk semua data)
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
      
      <div class="footer">
        <p>Laporan dibuat oleh FinTra App</p>
        <p>© ${new Date().getFullYear()} - Semua data bersifat rahasia</p>
      </div>
    </body>
    </html>
  `);
  
  printWindow.document.close();
}
