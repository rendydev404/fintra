"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getUserDetails } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, CreditCard, Wallet, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const details = await getUserDetails(id);
        setData(details);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  if (!data || !data.profile) {
    return <div className="p-8">User not found</div>;
  }

  const { profile, accounts, txCount, totalBalance } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/developer/users" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
        </Link>
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24 border-4 border-muted">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-2xl">{profile.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{profile.full_name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{profile.id}</span>
              <Badge variant="outline">{profile.currency}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Joined: {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: profile.currency || 'IDR' }).format(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Across {accounts?.length || 0} accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{txCount || 0}</div>
            <p className="text-xs text-muted-foreground">Lifetime activities</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="json">Raw Data</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {accounts?.map((acc: any) => (
              <Card key={acc.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{acc.name}</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: acc.currency }).format(acc.balance)}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{acc.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="json">
          <Card>
            <CardContent className="p-4">
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
