import {
  ArrowRightIcon,
  CoffeeIcon,
  ScanLineIcon,
  SparklesIcon,
  StoreIcon,
} from "lucide-react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Separator } from "@/shared/ui/separator"

const stations = [
  {
    title: "Receipt vision",
    description:
      "Capture cafe orders and turn them into structured CAMP tasks.",
    icon: ScanLineIcon,
  },
  {
    title: "Barista queue",
    description:
      "A light operations board for staff handoff and fulfillment state.",
    icon: CoffeeIcon,
  },
  {
    title: "Guest moments",
    description:
      "Surface playful, scannable interactions using the same game language.",
    icon: SparklesIcon,
  },
]

export default function Page() {
  return (
    <main className="bg-background text-foreground min-h-screen overflow-hidden">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-5 py-6 sm:px-8 lg:px-12">
        <header className="border-border bg-card/80 flex flex-col gap-4 rounded-[2rem] border p-4 shadow-[0_18px_0_rgba(23,35,58,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="border-border bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-2xl border shadow-[0_6px_0_rgba(23,35,58,0.12)]">
              <StoreIcon aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm font-semibold tracking-[0.24em] uppercase">
                CAMP 2026
              </p>
              <h1 className="text-2xl font-black tracking-tight">
                Vision Cafe
              </h1>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="w-fit rounded-full px-4 py-2 text-sm"
          >
            Light mode locked
          </Badge>
        </header>

        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-5">
              <Badge className="w-fit rounded-full px-4 py-2">
                Next.js ready
              </Badge>
              <div className="flex flex-col gap-4">
                <h2 className="max-w-3xl text-5xl leading-[0.95] font-black tracking-tight sm:text-6xl lg:text-7xl">
                  Same game feel, cafe-shaped foundation.
                </h2>
                <p className="text-muted-foreground max-w-2xl text-lg leading-8 sm:text-xl">
                  A clean Next.js App Router starter with the CAMP 2026 shadcn
                  layer and warm Vision Cafe theme already in place.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full px-6">
                Open cafe loop
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-6">
                Explore components
              </Button>
            </div>
          </div>

          <Card className="border-border bg-card/90 relative overflow-hidden rounded-[2rem] shadow-[0_22px_0_rgba(23,35,58,0.1)]">
            <CardHeader className="gap-3">
              <div className="flex items-center justify-between gap-4">
                <Badge className="rounded-full">App Router</Badge>
                <span className="text-muted-foreground text-sm font-semibold">
                  Next 16
                </span>
              </div>
              <CardTitle className="text-3xl font-black">
                Cafe control card
              </CardTitle>
              <CardDescription className="text-base leading-7">
                This starter keeps the game project's component vocabulary and
                palette, with the framework foundation reset to plain Next.js.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Separator />
              <div className="grid gap-3">
                {stations.map((station) => {
                  const Icon = station.icon

                  return (
                    <div
                      key={station.title}
                      className="border-border bg-background/60 flex items-start gap-4 rounded-3xl border p-4"
                    >
                      <div className="bg-secondary text-secondary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl">
                        <Icon aria-hidden="true" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="font-black tracking-tight">
                          {station.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-6">
                          {station.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
