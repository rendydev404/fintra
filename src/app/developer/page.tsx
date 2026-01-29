import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Globe, Database, Server } from "lucide-react";

export default function DeveloperPage() {
  const envVars = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", status: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", status: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { name: "SUPABASE_SERVICE_ROLE_KEY", status: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: "GROQ_API_KEY", status: !!process.env.GROQ_API_KEY },
    { name: "NEXT_PUBLIC_APP_URL", status: !!process.env.NEXT_PUBLIC_APP_URL },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground">Monitor system health and environment configurations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Operational</div>
            <p className="text-xs text-muted-foreground">All systems normal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{process.env.NODE_ENV}</div>
            <p className="text-xs text-muted-foreground">Running mode</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Environment Variables Check
          </CardTitle>
          <CardDescription>
            Verify that all required environment variables are loaded. Values are hidden for security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {envVars.map((env) => (
              <div key={env.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="font-mono text-sm">{env.name}</div>
                <Badge variant={env.status ? "default" : "destructive"}>
                  {env.status ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Loaded
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Missing
                    </span>
                  )}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
