import { useState } from "react";
import { Check, X, Wallet, Target, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFormatCurrency } from "@/hooks/use-format-currency";
import { ActionData } from "./ai-assistant-provider";
import { createBudgetAction, createGoalAction, createSubscriptionAction } from "@/actions/ai";
import { toast } from "sonner";

interface ActionCardProps {
  action: ActionData;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ActionCard({ action, onConfirm, onCancel }: ActionCardProps) {
  const formatCurrency = useFormatCurrency();
  const { type, data, status } = action;
  const [isLoading, setIsLoading] = useState(false);

  if (status !== "pending") return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    let result;

    try {
      if (type === 'budget') {
        result = await createBudgetAction(data);
      } else if (type === 'goal') {
        result = await createGoalAction(data);
      } else if (type === 'subscription') {
        result = await createSubscriptionAction(data);
      }

      if (result?.success) {
        toast.success(`Berhasil membuat ${type}!`);
        onConfirm();
      } else {
        toast.error(`Gagal: ${result?.error || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case "budget": return <Wallet className="h-5 w-5 text-blue-500" />;
      case "goal": return <Target className="h-5 w-5 text-violet-500" />;
      case "subscription": return <CreditCard className="h-5 w-5 text-pink-500" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "budget": return "Buat Budget Baru";
      case "goal": return "Set Target Nabung";
      case "subscription": return "Catat Langganan";
    }
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3 space-y-0">
        <div className="p-2 rounded-lg bg-muted">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : getIcon()}
        </div>
        <div>
          <CardTitle className="text-sm font-bold">{getTitle()}</CardTitle>
          <Badge variant="outline" className="mt-1 text-[10px] h-5 capitalize">
            {type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">Nama:</div>
          <div className="font-medium text-right">{data.name}</div>
          
          <div className="text-muted-foreground">Nominal:</div>
          <div className="font-medium text-right">{formatCurrency(data.amount)}</div>
          
          {data.category && (
            <>
              <div className="text-muted-foreground">Kategori:</div>
              <div className="font-medium text-right">{data.category}</div>
            </>
          )}
          
          {data.target_date && (
             <>
              <div className="text-muted-foreground">Target:</div>
              <div className="font-medium text-right">{data.target_date}</div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 bg-muted/50 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 h-8 text-xs hover:bg-destructive/10 hover:text-destructive border-destructive/20"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="w-3 h-3 mr-1" /> Batal
        </Button>
        <Button 
          size="sm" 
          className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
             <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
             <Check className="w-3 h-3 mr-1" /> 
          )}
          {isLoading ? "Proses..." : "Konfirmasi"}
        </Button>
      </CardFooter>
    </Card>
  );
}
