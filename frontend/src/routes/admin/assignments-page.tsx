import {
  CheckCircle2Icon,
  ClipboardListIcon,
  HistoryIcon,
  PlayIcon,
  RocketIcon,
  SendIcon,
} from "lucide-react"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import type {
  AdminAssignmentPlanPayload,
  AdminPublishedAssignmentPlansPayload,
  ApiErrorPayload,
  PublishedAssignmentPlan,
} from "@/lib/vision-cafe-api"
import type { SpeakerAssignmentPlan } from "@/lib/vision-cafe"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

import { fetchAdmin } from "@/routes/admin/components/api-client"
import { formatSubmittedAt } from "@/routes/admin/components/date-time"
import { AdminSectionPage } from "@/routes/admin/components/section-page"

import { AssignmentPlanViewer } from "./assignments/components/assignment-plan-viewer"

const assignmentViewerCardClassName =
  "h-[35rem] max-h-[calc(100svh-10rem)] w-full min-w-0 overflow-hidden"

async function fetchPublishedAssignmentPlans() {
  const response = await fetchAdmin("/api/admin/assignments/published")

  if (!response.ok) {
    throw new Error("Failed to load published assignment plans")
  }

  const payload =
    (await response.json()) as AdminPublishedAssignmentPlansPayload

  return payload.assignmentPlans
}

async function assignmentErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as ApiErrorPayload
    return payload.error || fallback
  } catch {
    return fallback
  }
}

export default function AdminAssignmentsPage() {
  const [assignmentPlan, setAssignmentPlan] =
    useState<SpeakerAssignmentPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingPublishedPlans, setLoadingPublishedPlans] = useState(true)
  const [published, setPublished] = useState(false)
  const [publishedPlansError, setPublishedPlansError] = useState<string | null>(
    null,
  )
  const [publishedAssignmentPlans, setPublishedAssignmentPlans] = useState<
    PublishedAssignmentPlan[]
  >([])
  const [publishing, setPublishing] = useState(false)
  const [selectedPublishedPlanId, setSelectedPublishedPlanId] = useState<
    string | null
  >(null)

  const loadPublishedAssignmentPlans = useCallback(
    async (options: { selectActive?: boolean } = {}) => {
      try {
        const nextAssignmentPlans = await fetchPublishedAssignmentPlans()

        setPublishedAssignmentPlans(nextAssignmentPlans)
        setSelectedPublishedPlanId((currentId) => {
          if (!nextAssignmentPlans.length) {
            return null
          }

          if (options.selectActive) {
            return nextAssignmentPlans[0].id
          }

          if (
            currentId &&
            nextAssignmentPlans.some((plan) => plan.id === currentId)
          ) {
            return currentId
          }

          return nextAssignmentPlans[0].id
        })
      } catch {
        setPublishedPlansError("正式分配紀錄讀取失敗。")
      } finally {
        setLoadingPublishedPlans(false)
      }
    },
    [],
  )

  useEffect(() => {
    let ignore = false

    void fetchPublishedAssignmentPlans()
      .then((nextAssignmentPlans) => {
        if (ignore) {
          return
        }

        setPublishedAssignmentPlans(nextAssignmentPlans)
        setSelectedPublishedPlanId(nextAssignmentPlans[0]?.id ?? null)
        setLoadingPublishedPlans(false)
      })
      .catch(() => {
        if (ignore) {
          return
        }

        setPublishedPlansError("正式分配紀錄讀取失敗。")
        setLoadingPublishedPlans(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const selectedPublishedPlan = useMemo(
    () =>
      publishedAssignmentPlans.find(
        (plan) => plan.id === selectedPublishedPlanId,
      ) ??
      publishedAssignmentPlans[0] ??
      null,
    [publishedAssignmentPlans, selectedPublishedPlanId],
  )

  async function runDryRun() {
    setGenerating(true)
    setPublished(false)
    setError(null)

    const response = await fetchAdmin("/api/admin/assignments/dry-run", {
      method: "POST",
    })

    if (!response.ok) {
      setError(await assignmentErrorMessage(response, "Dry run 產生失敗。"))
      setGenerating(false)
      return
    }

    const payload = (await response.json()) as AdminAssignmentPlanPayload

    setAssignmentPlan(payload.assignmentPlan)
    setGenerating(false)
  }

  async function publishAssignmentPlan() {
    setPublishing(true)
    setError(null)

    const response = await fetchAdmin("/api/admin/assignments/publish", {
      method: "POST",
    })

    if (!response.ok) {
      setError(await assignmentErrorMessage(response, "正式分配發布失敗。"))
      setPublishing(false)
      return
    }

    const payload = (await response.json()) as AdminAssignmentPlanPayload

    setAssignmentPlan(payload.assignmentPlan)
    setPublished(true)
    setPublishing(false)
    setLoadingPublishedPlans(true)
    setPublishedPlansError(null)
    void loadPublishedAssignmentPlans({ selectActive: true })
  }

  return (
    <AdminSectionPage title="分配控制">
      <div className="flex min-h-0 w-full flex-col gap-5">
        <Card className={`${assignmentViewerCardClassName} min-h-[28rem]`}>
          <CardHeader className="gap-3 has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
            <Badge variant="outline">
              <ClipboardListIcon aria-hidden="true" data-icon="inline-start" />
              分配控制
            </Badge>
            <CardTitle className="text-2xl font-black tracking-tight">
              一鍵分配場次
            </CardTitle>
            <CardDescription className="text-base leading-7">
              依送出時間、講者志願與場次容量產生分配結果。每位講者 2
              個場次，每場 12 位學員，隊輔另計且同隊兩位分居不同場次。
            </CardDescription>
            <CardAction className="col-start-1 row-span-1 row-start-auto justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end">
              <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={generating}
                  onClick={runDryRun}
                >
                  {generating ? (
                    <Spinner aria-hidden="true" />
                  ) : (
                    <PlayIcon aria-hidden="true" data-icon="inline-start" />
                  )}
                  {generating ? "產生中" : "產生 dry run"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!assignmentPlan || publishing}
                  onClick={publishAssignmentPlan}
                >
                  {publishing ? (
                    <Spinner aria-hidden="true" />
                  ) : (
                    <SendIcon aria-hidden="true" data-icon="inline-start" />
                  )}
                  {publishing ? "發布中" : "發布正式分配"}
                </Button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
            {assignmentPlan ? (
              <AssignmentPlanViewer assignmentPlan={assignmentPlan} />
            ) : (
              <EmptyAssignmentState
                icon={<ClipboardListIcon aria-hidden="true" />}
                title="尚未產生分配結果"
                description="先產生 dry run，確認場次與小隊分配狀態後再發布正式分配。"
              />
            )}
            {error ? (
              <p className="text-destructive shrink-0 text-sm font-semibold">
                {error}
              </p>
            ) : null}
            {published ? (
              <p className="shrink-0 text-sm font-black">已發布正式分配。</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="py-3">
          <Separator className="bg-ink/40 h-1 rounded-full" />
        </div>

        <div className="grid min-h-0 gap-5 xl:h-[42rem] xl:max-h-[calc(100svh-8rem)] xl:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)] xl:items-stretch">
          <PublishedAssignmentPlansPanel
            assignmentPlans={publishedAssignmentPlans}
            error={publishedPlansError}
            loading={loadingPublishedPlans}
            selectedAssignmentPlanId={selectedPublishedPlan?.id ?? null}
            onSelectAssignmentPlan={setSelectedPublishedPlanId}
          />

          <Card className="h-full min-h-[32rem] w-full min-w-0 overflow-hidden">
            <CardHeader className="gap-3">
              <Badge
                variant={
                  selectedPublishedPlan?.isActive ? "default" : "outline"
                }
              >
                <RocketIcon aria-hidden="true" data-icon="inline-start" />
                {selectedPublishedPlan?.isActive
                  ? "Active 正式分配"
                  : "正式版本"}
              </Badge>
              <CardTitle className="text-2xl font-black tracking-tight">
                正式分配查看器
              </CardTitle>
              <CardDescription className="text-base leading-7">
                {selectedPublishedPlan
                  ? `發布於 ${formatSubmittedAt(selectedPublishedPlan.publishedAt)}，產生於 ${formatSubmittedAt(selectedPublishedPlan.generatedAt)}。`
                  : "尚未發布正式分配。"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
              {selectedPublishedPlan ? (
                <AssignmentPlanViewer assignmentPlan={selectedPublishedPlan} />
              ) : (
                <EmptyAssignmentState
                  icon={<RocketIcon aria-hidden="true" />}
                  title="尚無正式版本"
                  description="發布正式分配後，最新版本會成為 Active，並出現在這裡供管理員檢視。"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminSectionPage>
  )
}

type PublishedAssignmentPlansPanelProps = {
  assignmentPlans: PublishedAssignmentPlan[]
  error: string | null
  loading: boolean
  onSelectAssignmentPlan: (assignmentPlanId: string) => void
  selectedAssignmentPlanId: string | null
}

function PublishedAssignmentPlansPanel({
  assignmentPlans,
  error,
  loading,
  onSelectAssignmentPlan,
  selectedAssignmentPlanId,
}: PublishedAssignmentPlansPanelProps) {
  const activeAssignmentPlan = assignmentPlans[0] ?? null

  return (
    <Card className="h-full min-h-[28rem] w-full min-w-0 overflow-hidden">
      <CardHeader className="gap-3">
        <Badge variant="outline">
          <HistoryIcon aria-hidden="true" data-icon="inline-start" />
          正式版本
        </Badge>
        <CardTitle className="text-2xl font-black tracking-tight">
          發布紀錄
        </CardTitle>
        <CardDescription className="text-base leading-7">
          最新發布的版本會自動成為 Active，前台查詢只會讀取這一版。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
        {loading && !assignmentPlans.length ? (
          <div className="flex min-h-48 items-center justify-center">
            <Spinner aria-label="讀取正式分配紀錄" />
          </div>
        ) : null}

        {activeAssignmentPlan ? (
          <div className="border-ink bg-primary/10 flex flex-col gap-3 rounded-[1rem] border-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge>
                <CheckCircle2Icon aria-hidden="true" data-icon="inline-start" />
                Active
              </Badge>
              <span className="text-muted-foreground text-xs font-bold">
                {formatSubmittedAt(activeAssignmentPlan.publishedAt)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-black">
                {activeAssignmentPlan.assignedStudentCount} /{" "}
                {activeAssignmentPlan.studentCapacity} 位學員、
                {activeAssignmentPlan.assignedCounselorCount} 位隊輔已分配
              </p>
              <p className="text-muted-foreground text-sm font-semibold">
                {activeAssignmentPlan.unassignedStudentCount +
                  activeAssignmentPlan.unassignedCounselorCount}{" "}
                未分配，產生於{" "}
                {formatSubmittedAt(activeAssignmentPlan.generatedAt)}
              </p>
            </div>
          </div>
        ) : null}

        {assignmentPlans.length ? (
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto pr-1">
            {assignmentPlans.map((assignmentPlan) => (
              <PublishedAssignmentPlanButton
                key={assignmentPlan.id}
                assignmentPlan={assignmentPlan}
                selected={assignmentPlan.id === selectedAssignmentPlanId}
                onSelect={onSelectAssignmentPlan}
              />
            ))}
          </div>
        ) : loading ? null : (
          <EmptyAssignmentState
            icon={<HistoryIcon aria-hidden="true" />}
            title="尚無發布紀錄"
            description="每次發布正式分配都會保留一筆紀錄，最新一筆會成為 Active。"
          />
        )}

        {error ? (
          <p className="text-destructive shrink-0 text-sm font-semibold">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

type PublishedAssignmentPlanButtonProps = {
  assignmentPlan: PublishedAssignmentPlan
  onSelect: (assignmentPlanId: string) => void
  selected: boolean
}

function PublishedAssignmentPlanButton({
  assignmentPlan,
  onSelect,
  selected,
}: PublishedAssignmentPlanButtonProps) {
  return (
    <button
      type="button"
      className={`border-ink flex w-full min-w-0 flex-col gap-2 rounded-[1rem] border-2 p-3 text-left transition-colors ${
        selected
          ? "bg-secondary text-secondary-foreground"
          : "bg-background hover:bg-accent"
      }`}
      onClick={() => onSelect(assignmentPlan.id)}
    >
      <span className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-black">
          {formatSubmittedAt(assignmentPlan.publishedAt)}
        </span>
        {assignmentPlan.isActive ? <Badge>Active</Badge> : null}
      </span>
      <span className="text-muted-foreground text-xs font-semibold">
        {assignmentPlan.assignedStudentCount} / {assignmentPlan.studentCapacity}{" "}
        位學員、{assignmentPlan.assignedCounselorCount} 位隊輔已分配 ·{" "}
        {assignmentPlan.unassignedStudentCount +
          assignmentPlan.unassignedCounselorCount}{" "}
        未分配
      </span>
      <span className="text-muted-foreground text-xs font-semibold">
        產生於 {formatSubmittedAt(assignmentPlan.generatedAt)}
      </span>
    </button>
  )
}

type EmptyAssignmentStateProps = {
  description: string
  icon: ReactNode
  title: string
}

function EmptyAssignmentState({
  description,
  icon,
  title,
}: EmptyAssignmentStateProps) {
  return (
    <div className="border-ink bg-background flex min-h-64 flex-col items-center justify-center gap-3 rounded-[1rem] border-2 p-6 text-center">
      <span className="[&_svg]:size-8">{icon}</span>
      <p className="text-lg font-black">{title}</p>
      <p className="text-muted-foreground max-w-lg text-sm leading-6">
        {description}
      </p>
    </div>
  )
}
