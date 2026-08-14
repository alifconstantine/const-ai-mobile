import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, KeyRound, Mic, Terminal, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto p-8 max-w-5xl space-y-8">
      <div className="flex items-center justify-between border-b pb-6 border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Const AI Control Center</h1>
          <p className="text-zinc-500 mt-1">
            Web Management Dashboard & API Configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Docs</Button>
          <Button>Open App</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <KeyRound className="w-8 h-8 text-indigo-500 mb-2" />
            <CardTitle>BYOK Management</CardTitle>
            <CardDescription>
              Configure your Gemini, Claude, GPT, & OpenRouter API Keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              Manage Keys
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Mic className="w-8 h-8 text-emerald-500 mb-2" />
            <CardTitle>Voice Persona Gallery</CardTitle>
            <CardDescription>
              Custom Supertonic-3 voice styles and preset parameters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              Explore Voices
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Terminal className="w-8 h-8 text-amber-500 mb-2" />
            <CardTitle>Autonomous Agent & HITL</CardTitle>
            <CardDescription>
              Audit pending actions, tool streams, and operating modes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              Agent Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
