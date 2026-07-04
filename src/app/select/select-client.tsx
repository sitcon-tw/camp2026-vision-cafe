"use client"

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleAlertIcon,
  ExternalLinkIcon,
  GripVerticalIcon,
  LogOutIcon,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { AppPageShell } from "@/shared/ui/app-page-shell"
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
import { Spinner } from "@/shared/ui/spinner"
import { cn } from "@/shared/utils"

import type { StudentSelectionPayload } from "@/shared/data/vision-cafe-api"
import {
  getSpeakerCandidateByName,
  getSpeakerCandidateNames,
  getSpeakerCandidates,
  type Speaker,
  type SpeakerLink,
} from "@/shared/data/vision-cafe"

type DragState = {
  speakerName: string
  startY: number
  offsetY: number
}

const REORDER_DRAG_THRESHOLD = 44

type SelectClientProps = {
  initialData: StudentSelectionPayload
}

export function SelectClient({ initialData }: SelectClientProps) {
  const speakers = getSpeakerCandidates()
  const [submitted, setSubmitted] = useState(
    Boolean(initialData.preference.submittedAt),
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [speakerOrder, setSpeakerOrder] = useState(() =>
    normalizeInitialSpeakerOrder(initialData.preference.preferenceOrder),
  )

  const orderedSpeakers = speakerOrder
    .map((speakerName) => getSpeakerCandidateByName(speakerName))
    .filter((speaker): speaker is Speaker => Boolean(speaker))

  function updateOrder(nextOrder: string[]) {
    setSpeakerOrder(nextOrder)
    setSubmitted(false)
    setSubmitError(null)
  }

  async function submitPreference() {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/student/preferences", {
        body: JSON.stringify({
          preferenceOrder: speakerOrder,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error("送出失敗，請稍後再試。")
      }

      setSubmitted(true)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "送出失敗。")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppPageShell title="講者志願選填" backHref="/" backLabel="回到首頁">
      <Alert className="grid-cols-[auto_1fr_auto] items-center gap-x-3 has-[>svg]:grid-cols-[auto_1fr_auto] [&>svg]:translate-y-0">
        <CheckIcon
          aria-hidden="true"
          className="row-span-2 row-start-1 self-center"
        />
        <AlertTitle className="col-start-2 row-start-1">
          {initialData.student.studentName} / {initialData.student.teamName}
        </AlertTitle>
        <AlertDescription className="col-start-2 row-start-2">
          <p>已使用 GitHub 帳號 {initialData.student.githubUsername} 登入。</p>
        </AlertDescription>
        <Button
          type="button"
          variant="outline"
            size="sm"
            className="col-start-3 row-span-2 row-start-1 self-center shadow-none"
          onClick={() => void signOut({ callbackUrl: "/select" })}
        >
          <LogOutIcon aria-hidden="true" />
          登出
        </Button>
      </Alert>

      {!initialData.flowControls.speakerPreferenceSelectionOpen ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>目前尚未開放選填</AlertTitle>
          <AlertDescription>
            <p>請等待工作人員開放後再回到此頁面。</p>
          </AlertDescription>
        </Alert>
      ) : null}

      <SpeakerIntroList speakers={speakers} />

      <PreferenceDialog
        speakers={orderedSpeakers}
        submitted={submitted}
        submitError={submitError}
        submitting={submitting}
        selectionOpen={initialData.flowControls.speakerPreferenceSelectionOpen}
        onSubmit={submitPreference}
        onUpdateOrder={updateOrder}
      />
    </AppPageShell>
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
  selectionOpen: boolean
  speakers: Speaker[]
  submitted: boolean
  submitError: string | null
  submitting: boolean
  onSubmit: () => Promise<void>
  onUpdateOrder: (nextOrder: string[]) => void
}

function PreferenceDialog({
  selectionOpen,
  speakers,
  submitted,
  submitError,
  submitting,
  onSubmit,
  onUpdateOrder,
}: PreferenceDialogProps) {
  return (
    <Dialog>
      <div className="bg-background/95 sticky bottom-0 mt-auto flex flex-col gap-3 py-4">
        <DialogTrigger asChild>
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!selectionOpen}
          >
            選擇講者
          </Button>
        </DialogTrigger>
      </div>

      <SpeakerRankingPanel
        speakers={speakers}
        submitted={submitted}
        submitError={submitError}
        submitting={submitting}
        selectionOpen={selectionOpen}
        onSubmit={onSubmit}
        onUpdateOrder={onUpdateOrder}
      />
    </Dialog>
  )
}

type SpeakerRankingPanelProps = {
  selectionOpen: boolean
  speakers: Speaker[]
  submitted: boolean
  submitError: string | null
  submitting: boolean
  onSubmit: () => Promise<void>
  onUpdateOrder: (nextOrder: string[]) => void
}

function SpeakerRankingPanel({
  selectionOpen,
  speakers,
  submitted,
  submitError,
  submitting,
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

        {submitError ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>送出失敗</AlertTitle>
            <AlertDescription>
              <p>{submitError}</p>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <Separator />

      <DialogFooter className="gap-3 sm:flex-col sm:justify-start">
        {submitted ? null : (
          <Button
            type="button"
            className="w-full"
            disabled={!selectionOpen || submitting}
            onClick={onSubmit}
          >
            {submitting ? <Spinner aria-hidden="true" /> : null}
            {submitting ? "送出中" : "送出"}
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

function normalizeInitialSpeakerOrder(preferenceOrder: string[]) {
  const speakerNames = getSpeakerCandidateNames()
  const speakerNameSet = new Set(speakerNames)
  const normalizedOrder = preferenceOrder.filter((speakerName) =>
    speakerNameSet.has(speakerName),
  )

  for (const speakerName of speakerNames) {
    if (!normalizedOrder.includes(speakerName)) {
      normalizedOrder.push(speakerName)
    }
  }

  return normalizedOrder
}
