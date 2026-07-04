"use client"

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  GripVerticalIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/shared/ui/item"
import { Separator } from "@/shared/ui/separator"
import { cn } from "@/shared/utils"

import {
  getSpeakerCandidateByName,
  getSpeakerCandidateNames,
  getSpeakerCandidates,
  type Speaker,
  type SpeakerLink,
} from "./speaker-data"

type DragState = {
  speakerName: string
  startY: number
  offsetY: number
}

const REORDER_DRAG_THRESHOLD = 44

export default function SelectPage() {
  const speakers = getSpeakerCandidates()
  const [submitted, setSubmitted] = useState(false)
  const [speakerOrder, setSpeakerOrder] = useState(getSpeakerCandidateNames)

  const orderedSpeakers = speakerOrder
    .map((speakerName) => getSpeakerCandidateByName(speakerName))
    .filter((speaker): speaker is Speaker => Boolean(speaker))

  function updateOrder(nextOrder: string[]) {
    setSpeakerOrder(nextOrder)
    setSubmitted(false)
  }

  return (
    <main className="bg-background text-foreground min-h-dvh">
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-5">
        <StudentHeader />
        <SpeakerIntroList speakers={speakers} />

        <PreferenceDialog
          speakers={orderedSpeakers}
          submitted={submitted}
          onSubmit={() => setSubmitted(true)}
          onUpdateOrder={updateOrder}
        />
      </section>
    </main>
  )
}

function StudentHeader() {
  return (
    <header className="flex items-start gap-3 pt-1">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-tight font-black tracking-tight">
            講者志願選填
          </h1>
          <p className="text-muted-foreground text-sm leading-6">視界咖啡館</p>
        </div>
      </div>
    </header>
  )
}

type SpeakerIntroListProps = {
  speakers: Speaker[]
}

function SpeakerIntroList({ speakers }: SpeakerIntroListProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {speakers.map((speaker, index) => (
        <SpeakerIntroCard
          key={speaker.speaker_name}
          speaker={speaker}
          order={index + 1}
        />
      ))}
    </div>
  )
}

type SpeakerIntroCardProps = {
  speaker: Speaker
  order: number
}

function SpeakerIntroCard({ speaker, order }: SpeakerIntroCardProps) {
  return (
    <Dialog>
      <Card className="gap-5">
        <CardHeader className="gap-4">
          <div className="flex items-start gap-4">
            <SpeakerAvatar speaker={speaker} className="size-16" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Badge variant="outline" className="self-start">
                講者 {order.toString().padStart(2, "0")}
              </Badge>
              <CardTitle className="text-2xl font-black tracking-tight">
                {speaker.speaker_name}
              </CardTitle>
            </div>
          </div>
          <CardDescription className="line-clamp-3 text-base leading-7">
            {speaker.description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="pt-0">
          <DialogTrigger asChild>
            <Button type="button" className="w-full">
              查看介紹
            </Button>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
        <DialogHeader className="items-center gap-4 text-center">
          <SpeakerAvatar speaker={speaker} className="size-20" />
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-2xl font-black tracking-tight">
              {speaker.speaker_name}
            </DialogTitle>
            <DialogDescription className="text-foreground text-base leading-7">
              {speaker.description}
            </DialogDescription>
          </div>
        </DialogHeader>
        {speaker.links?.length ? <SpeakerLinks links={speaker.links} /> : null}
        <DialogFooter className="gap-3 sm:flex-col sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full">
              知道了
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type SpeakerLinksProps = {
  links: SpeakerLink[]
}

function SpeakerLinks({ links }: SpeakerLinksProps) {
  return (
    <div className="flex flex-col gap-3">
      <Separator />
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-black">相關連結</h3>
        <div className="grid gap-2">
          {links.map((link) => (
            <Button
              key={link.href}
              asChild
              type="button"
              variant="outline"
              className="h-auto min-h-10 w-full justify-between px-3 py-2 text-left leading-5 whitespace-normal"
            >
              <a href={link.href} target="_blank" rel="noreferrer">
                <span>{link.label}</span>
                <ExternalLinkIcon aria-hidden="true" />
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

type PreferenceDialogProps = {
  speakers: Speaker[]
  submitted: boolean
  onSubmit: () => void
  onUpdateOrder: (nextOrder: string[]) => void
}

function PreferenceDialog({
  speakers,
  submitted,
  onSubmit,
  onUpdateOrder,
}: PreferenceDialogProps) {
  return (
    <Dialog>
      <div className="bg-background/95 sticky bottom-0 mt-auto flex flex-col gap-3 py-4">
        <DialogTrigger asChild>
          <Button type="button" size="lg" className="w-full">
            選擇講者
          </Button>
        </DialogTrigger>
      </div>

      <SpeakerRankingPanel
        speakers={speakers}
        submitted={submitted}
        onSubmit={onSubmit}
        onUpdateOrder={onUpdateOrder}
      />
    </Dialog>
  )
}

type SpeakerRankingPanelProps = {
  speakers: Speaker[]
  submitted: boolean
  onSubmit: () => void
  onUpdateOrder: (nextOrder: string[]) => void
}

function SpeakerRankingPanel({
  speakers,
  submitted,
  onSubmit,
  onUpdateOrder,
}: SpeakerRankingPanelProps) {
  const dragRef = useRef<DragState | null>(null)
  const [activeDrag, setActiveDrag] = useState<DragState | null>(null)

  const speakerNames = useMemo(
    () => speakers.map((speaker) => speaker.speaker_name),
    [speakers],
  )
  const speakerNamesRef = useRef(speakerNames)
  const activeDragSpeakerName = activeDrag?.speakerName

  useEffect(() => {
    speakerNamesRef.current = speakerNames
  }, [speakerNames])

  useEffect(() => {
    if (!activeDragSpeakerName) {
      return
    }

    function clearDrag() {
      dragRef.current = null
      setActiveDrag(null)
    }

    window.addEventListener("pointerup", clearDrag)
    window.addEventListener("pointercancel", clearDrag)

    return () => {
      window.removeEventListener("pointerup", clearDrag)
      window.removeEventListener("pointercancel", clearDrag)
    }
  }, [activeDragSpeakerName])

  function reorderSpeaker(speakerName: string, nextIndex: number) {
    const currentOrder = speakerNamesRef.current
    const currentIndex = currentOrder.indexOf(speakerName)

    if (
      currentIndex < 0 ||
      nextIndex < 0 ||
      nextIndex >= currentOrder.length ||
      currentIndex === nextIndex
    ) {
      return false
    }

    const nextOrder = [...currentOrder]
    const [movedSpeaker] = nextOrder.splice(currentIndex, 1)
    nextOrder.splice(nextIndex, 0, movedSpeaker)
    onUpdateOrder(nextOrder)

    return true
  }

  function moveSpeaker(speakerName: string, direction: -1 | 1) {
    const currentIndex = speakerNamesRef.current.indexOf(speakerName)
    reorderSpeaker(speakerName, currentIndex + direction)
  }

  function handleDragStart(
    speakerName: string,
    event: PointerEvent<HTMLButtonElement>,
  ) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const nextDrag = {
      speakerName,
      startY: event.clientY,
      offsetY: 0,
    }

    dragRef.current = nextDrag
    setActiveDrag(nextDrag)
  }

  function handleDragMove(
    speakerName: string,
    event: PointerEvent<HTMLButtonElement>,
  ) {
    const drag = dragRef.current

    if (!drag || drag.speakerName !== speakerName) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const rawOffsetY = event.clientY - drag.startY
    const offsetY = clamp(rawOffsetY, -82, 82)
    const shouldReorder = Math.abs(rawOffsetY) >= REORDER_DRAG_THRESHOLD

    if (shouldReorder) {
      const currentIndex = speakerNamesRef.current.indexOf(speakerName)
      const direction = rawOffsetY > 0 ? 1 : -1
      const didReorder = reorderSpeaker(speakerName, currentIndex + direction)

      if (didReorder) {
        const nextDrag = {
          speakerName,
          startY: event.clientY,
          offsetY: 0,
        }

        dragRef.current = nextDrag
        setActiveDrag(nextDrag)
        return
      }
    }

    const nextDrag = { ...drag, offsetY }

    dragRef.current = nextDrag
    setActiveDrag(nextDrag)
  }

  function finishDrag(
    speakerName: string,
    event: PointerEvent<HTMLButtonElement>,
  ) {
    const drag = dragRef.current

    if (!drag || drag.speakerName !== speakerName) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    dragRef.current = null
    setActiveDrag(null)
  }

  function handleLostPointerCapture(speakerName: string) {
    const drag = dragRef.current

    if (!drag || drag.speakerName !== speakerName) {
      return
    }

    dragRef.current = null
    setActiveDrag(null)
  }

  return (
    <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
      <DialogHeader className="pr-8">
        <DialogTitle className="text-2xl font-black tracking-tight">
          排講者志願
        </DialogTitle>
        <DialogDescription className="text-base leading-7">
          按住右側把手拖曳排序，也可以用上下按鈕微調。
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <ItemGroup className="gap-3">
          {speakers.map((speaker, index) => {
            const isActive = activeDrag?.speakerName === speaker.speaker_name

            return (
              <SpeakerRankItem
                key={speaker.speaker_name}
                speaker={speaker}
                rank={index + 1}
                isActive={isActive}
                offsetY={isActive ? activeDrag.offsetY : 0}
                canMoveUp={index > 0}
                canMoveDown={index < speakers.length - 1}
                onMoveUp={() => moveSpeaker(speaker.speaker_name, -1)}
                onMoveDown={() => moveSpeaker(speaker.speaker_name, 1)}
                onDragHandlePointerDown={(event) =>
                  handleDragStart(speaker.speaker_name, event)
                }
                onDragHandlePointerMove={(event) =>
                  handleDragMove(speaker.speaker_name, event)
                }
                onDragHandlePointerUp={(event) =>
                  finishDrag(speaker.speaker_name, event)
                }
                onDragHandlePointerCancel={(event) =>
                  finishDrag(speaker.speaker_name, event)
                }
                onDragHandleLostPointerCapture={() =>
                  handleLostPointerCapture(speaker.speaker_name)
                }
              />
            )
          })}
        </ItemGroup>

        {submitted ? (
          <Alert>
            <CheckIcon aria-hidden="true" />
            <AlertTitle>已送出志願</AlertTitle>
            <AlertDescription>
              <p>
                {speakers
                  .map(
                    (speaker, index) =>
                      `${rankLabel(index + 1)}：${speaker.speaker_name}`,
                  )
                  .join(" / ")}
              </p>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <Separator />

      <DialogFooter className="gap-3 sm:flex-col sm:justify-start">
        {submitted ? null : (
          <Button type="button" className="w-full" onClick={onSubmit}>
            送出
          </Button>
        )}
        <DialogClose asChild>
          <Button type="button" variant="outline" className="w-full">
            {submitted ? "完成" : "稍後再排"}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}

type SpeakerRankItemProps = {
  speaker: Speaker
  rank: number
  isActive: boolean
  offsetY: number
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDragHandlePointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  onDragHandlePointerMove: (event: PointerEvent<HTMLButtonElement>) => void
  onDragHandlePointerUp: (event: PointerEvent<HTMLButtonElement>) => void
  onDragHandlePointerCancel: (event: PointerEvent<HTMLButtonElement>) => void
  onDragHandleLostPointerCapture: () => void
}

function SpeakerRankItem({
  speaker,
  rank,
  isActive,
  offsetY,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDragHandlePointerDown,
  onDragHandlePointerMove,
  onDragHandlePointerUp,
  onDragHandlePointerCancel,
  onDragHandleLostPointerCapture,
}: SpeakerRankItemProps) {
  return (
    <Item
      role="listitem"
      variant="outline"
      tabIndex={0}
      aria-label={`${speaker.speaker_name}，目前${rankLabel(rank)}`}
      aria-grabbed={isActive}
      className={cn(
        "border-ink bg-card gap-3 rounded-[1.25rem] border-2 p-3 shadow-[3px_3px_0_rgba(23,35,58,0.1)] select-none",
        isActive
          ? "bg-surface-raised relative scale-[1.01] shadow-[6px_6px_0_rgba(23,35,58,0.18)] transition-none"
          : "transition-transform duration-150",
      )}
      style={{
        transform: isActive ? `translateY(${offsetY}px)` : undefined,
      }}
    >
      <ItemMedia>
        <Badge variant={rank === 1 ? "default" : "secondary"}>
          {rankLabel(rank)}
        </Badge>
      </ItemMedia>
      <SpeakerAvatar speaker={speaker} className="size-12" />
      <ItemContent>
        <ItemTitle className="text-base font-black">
          {speaker.speaker_name}
        </ItemTitle>
      </ItemContent>
      <ItemActions
        className="flex-col"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`上移 ${speaker.speaker_name}`}
          disabled={!canMoveUp}
          onClick={onMoveUp}
        >
          <ChevronUpIcon data-icon="icon" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`下移 ${speaker.speaker_name}`}
          disabled={!canMoveDown}
          onClick={onMoveDown}
        >
          <ChevronDownIcon data-icon="icon" />
        </Button>
      </ItemActions>
      <ItemActions>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`拖曳 ${speaker.speaker_name}`}
          onPointerDown={onDragHandlePointerDown}
          onPointerMove={onDragHandlePointerMove}
          onPointerUp={onDragHandlePointerUp}
          onPointerCancel={onDragHandlePointerCancel}
          onLostPointerCapture={onDragHandleLostPointerCapture}
          className={cn(
            "cursor-grab touch-none",
            isActive && "cursor-grabbing",
          )}
        >
          <GripVerticalIcon data-icon="icon" />
        </Button>
      </ItemActions>
    </Item>
  )
}

type SpeakerAvatarProps = {
  speaker: Speaker
  className?: string
}

function SpeakerAvatar({ speaker, className }: SpeakerAvatarProps) {
  return (
    <Avatar size="lg" className={className}>
      <AvatarImage src={speaker.avatar} alt={speaker.speaker_name} />
      <AvatarFallback>{speakerInitials(speaker.speaker_name)}</AvatarFallback>
    </Avatar>
  )
}

function rankLabel(rank: number) {
  if (rank === 1) {
    return "第一志願"
  }

  if (rank === 2) {
    return "第二志願"
  }

  return `第 ${rank} 志願`
}

function speakerInitials(speakerName: string) {
  return speakerName.trim().slice(0, 2)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
