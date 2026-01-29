"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFormatCurrency } from "@/hooks/use-format-currency";

export function PredictiveChart() {
  const formatCurrency = useFormatCurrency();

  // Mock data for forecasting
  // In a real app, this would be calculated from historical transaction data
  const data = [
    { name: 'Okt', balance: 12000000, type: 'history' },
    { name: 'Nov', balance: 13500000, type: 'history' },
    { name: 'Des', balance: 11000000, type: 'history' },
    { name: 'Jan', balance: 14200000, type: 'history' }, // Current
    { name: 'Feb', balance: 15800000, type: 'prediction' },
    { name: 'Mar', balance: 17500000, type: 'prediction' },
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-violet-500" />
                    Prediksi Saldo 3 Bulan Kedepan
                </CardTitle>
                <CardDescription>
                    Berdasarkan pola pemasukan dan pengeluaran Anda saat ini.
                </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-violet-500 rounded-full opacity-50"></div> History
                </div>
                 <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div> Prediksi
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`} 
              />
              <Tooltip 
                formatter={(value: any) => [formatCurrency(Number(value)), "Saldo"]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#8b5cf6" 
                fillOpacity={1} 
                fill="url(#colorBalance)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
