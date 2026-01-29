"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

export default function PlaygroundPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">UI Playground</h1>
        <p className="text-muted-foreground">Test components and design system consistency.</p>
      </div>

      <Tabs defaultValue="buttons">
        <TabsList>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="toasts">Toasts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buttons" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Button Variants</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Button States</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button disabled>Disabled</Button>
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </Button>
              <Button>
                <Mail className="mr-2 h-4 w-4" />
                With Icon
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card description goes here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Card content area.</p>
                    </CardContent>
                </Card>
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle>Primary Card</CardTitle>
                        <CardDescription className="text-primary-foreground/80">Description</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Content on primary background.</p>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="toasts">
            <Card>
                <CardHeader>
                    <CardTitle>Toast Notifications</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Button onClick={() => toast("Default Toast")}>Default</Button>
                    <Button variant="secondary" onClick={() => toast.success("Success Toast")}>Success</Button>
                    <Button variant="destructive" onClick={() => toast.error("Error Toast")}>Error</Button>
                    <Button variant="outline" onClick={() => toast.info("Info Toast")}>Info</Button>
                    <Button variant="ghost" onClick={() => toast.warning("Warning Toast")}>Warning</Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
