import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(messages: ChatMessage[], model = 'llama-3.3-70b-versatile') {
  const response = await groq.chat.completions.create({
    messages,
    model,
    temperature: 0.7,
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content || '';
}

export async function categorizeTransaction(description: string, amount: number, categories: string[]) {
  const systemPrompt = `Kamu adalah asisten keuangan AI yang membantu mengkategorikan transaksi.
Berdasarkan deskripsi transaksi, tentukan kategori yang paling sesuai dari daftar yang diberikan.
Jawab HANYA dengan nama kategori yang tepat, tanpa penjelasan tambahan.`;

  const userPrompt = `Deskripsi transaksi: "${description}"
Jumlah: Rp ${amount.toLocaleString('id-ID')}
Kategori yang tersedia: ${categories.join(', ')}

Kategori yang paling sesuai adalah:`;

  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 'llama-3.1-8b-instant');

  return result.trim();
}

export async function generateSpendingInsights(data: {
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: { name: string; amount: number }[];
  monthlyTrend: { month: string; expense: number }[];
}) {
  const systemPrompt = `Kamu adalah konsultan keuangan pribadi AI yang cerdas dan ramah.
Analisis data keuangan pengguna dan berikan 3-5 insight yang berguna dalam Bahasa Indonesia.
Fokus pada:
1. Pola pengeluaran yang perlu diperhatikan
2. Kategori pengeluaran terbesar
3. Tren bulanan
4. Saran praktis untuk menghemat

Format output sebagai JSON array dengan struktur:
[{"title": "...", "description": "...", "type": "spending|saving|budget|recommendation", "severity": "info|warning|success"}]`;

  const userPrompt = `Data Keuangan:
- Total Pemasukan: Rp ${data.totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${data.totalExpense.toLocaleString('id-ID')}
- Rasio Pengeluaran: ${((data.totalExpense / data.totalIncome) * 100).toFixed(1)}%

Breakdown per Kategori:
${data.categoryBreakdown.map(c => `- ${c.name}: Rp ${c.amount.toLocaleString('id-ID')}`).join('\n')}

Tren Bulanan:
${data.monthlyTrend.map(m => `- ${m.month}: Rp ${m.expense.toLocaleString('id-ID')}`).join('\n')}

Berikan insight dan rekomendasi:`;

  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try {
    return JSON.parse(result);
  } catch {
    return [
      {
        title: 'Analisis Tersedia',
        description: result,
        type: 'recommendation',
        severity: 'info',
      },
    ];
  }
}

export async function calculateHealthScore(data: {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  budgetAdherence: number;
  emergencyFundMonths: number;
}) {
  const systemPrompt = `Kamu adalah konsultan keuangan AI. Hitung skor kesehatan keuangan (0-100) berdasarkan data pengguna.

Kriteria penilaian:
- Rasio Tabungan (30%): Idealnya 20%+ dari income
- Pengeluaran (25%): Idealnya <80% dari income
- Kepatuhan Budget (25%): Persentase budget yang terpenuhi
- Dana Darurat (20%): Idealnya 3-6 bulan pengeluaran

Format output sebagai JSON:
{
  "score": 0-100,
  "grade": "A|B|C|D|F",
  "breakdown": {
    "savingsRate": 0-100,
    "expenseRatio": 0-100,
    "budgetAdherence": 0-100,
    "emergencyFund": 0-100
  },
  "recommendations": ["...", "...", "..."]
}`;

  const savingsRate = data.totalIncome > 0 
    ? ((data.totalIncome - data.totalExpense) / data.totalIncome) * 100 
    : 0;

  const userPrompt = `Data Keuangan:
- Total Pemasukan: Rp ${data.totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${data.totalExpense.toLocaleString('id-ID')}
- Total Tabungan: Rp ${data.totalSavings.toLocaleString('id-ID')}
- Rasio Tabungan: ${savingsRate.toFixed(1)}%
- Kepatuhan Budget: ${data.budgetAdherence}%
- Dana Darurat: ${data.emergencyFundMonths} bulan pengeluaran

Hitung skor kesehatan keuangan:`;

  const result = await chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  try {
    return JSON.parse(result);
  } catch {
    // Fallback calculation
    const score = Math.min(100, Math.max(0,
      (savingsRate >= 20 ? 30 : savingsRate * 1.5) +
      (data.totalExpense / data.totalIncome <= 0.8 ? 25 : 25 - ((data.totalExpense / data.totalIncome - 0.8) * 50)) +
      (data.budgetAdherence * 0.25) +
      (Math.min(data.emergencyFundMonths / 6, 1) * 20)
    ));

    return {
      score: Math.round(score),
      grade: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F',
      breakdown: {
        savingsRate: Math.min(100, savingsRate * 5),
        expenseRatio: Math.max(0, 100 - (data.totalExpense / data.totalIncome) * 100),
        budgetAdherence: data.budgetAdherence,
        emergencyFund: Math.min(100, (data.emergencyFundMonths / 6) * 100),
      },
      recommendations: [
        savingsRate < 20 ? 'Tingkatkan rasio tabungan Anda minimal 20% dari pendapatan.' : null,
        data.budgetAdherence < 80 ? 'Perhatikan budget yang sudah Anda tetapkan.' : null,
        data.emergencyFundMonths < 3 ? 'Bangun dana darurat minimal 3 bulan pengeluaran.' : null,
      ].filter(Boolean),
    };
  }
}

export { groq };
