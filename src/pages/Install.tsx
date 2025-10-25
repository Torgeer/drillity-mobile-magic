import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Share, Plus, MoreVertical } from "lucide-react";
import drillityLogo from "@/assets/drillity-logo.png";

export default function Install() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={drillityLogo} alt="Drillity" className="h-16" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl">Install Drillity on your phone</CardTitle>
          <CardDescription className="text-base">
            Install the app for the best experience - works offline and loads faster!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* iPhone Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">För iPhone (Safari)</h3>
            </div>
            <ol className="space-y-3 text-muted-foreground ml-9">
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground min-w-[1.5rem]">1.</span>
                <span>Öppna denna sida i Safari-webbläsaren</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground min-w-[1.5rem]">2.</span>
                <span className="flex items-center gap-2">
                  Tryck på <Share className="h-4 w-4 inline text-primary" /> dela-knappen längst ner
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground min-w-[1.5rem]">3.</span>
                <span className="flex items-center gap-2">
                  Scroll down and select <Plus className="h-4 w-4 inline text-primary" /> "Add to Home Screen"
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground min-w-[1.5rem]">4.</span>
                <span>Tap "Add" to confirm</span>
              </li>
            </ol>
          </div>

          {/* Android Instructions */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-semibold">För Android (Chrome)</h3>
            </div>
            <ol className="space-y-3 text-muted-foreground ml-9">
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground min-w-[1.5rem]">1.</span>
                <span>Öppna denna sida i Chrome-webbläsaren</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground min-w-[1.5rem]">2.</span>
                <span className="flex items-center gap-2">
                  Tap the <MoreVertical className="h-4 w-4 inline text-primary" /> menu button in the top right
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground min-w-[1.5rem]">3.</span>
                <span>Select "Install app" or "Add to home screen"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-semibold text-foreground min-w-[1.5rem]">4.</span>
                <span>Tap "Install" to confirm</span>
              </li>
            </ol>
          </div>

          {/* Benefits */}
          <div className="bg-sidebar rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sidebar-foreground">Fördelar med installerad app:</h4>
            <ul className="space-y-1 text-sm text-sidebar-foreground/80">
              <li>✓ Fungerar offline</li>
              <li>✓ Snabbare laddning</li>
              <li>✓ Egen ikon på hemskärmen</li>
              <li>✓ Fullskärmsläge utan webbläsarfält</li>
            </ul>
          </div>

          <div className="text-center pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="/">Tillbaka till appen</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
