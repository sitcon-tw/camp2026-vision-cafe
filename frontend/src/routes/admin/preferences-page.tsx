import { PencilIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import type { AdminPreferencesPayload } from "@/lib/vision-cafe-api"
import {
  getSpeakerCandidateNames,
  type StudentSpeakerPreference,
} from "@/lib/vision-cafe"
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { fetchAdmin } from "@/routes/admin/components/api-client"
import { AdminSectionPage } from "@/routes/admin/components/section-page"
import {
  formatSubmittedAt,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/routes/admin/components/date-time"

export default function AdminPreferencesPage() {
  const [preferences, setPreferences] = useState<StudentSpeakerPreference[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const speakerNames = getSpeakerCandidateNames()
  const normalizedQuery = query.trim().toLowerCase()
  const filteredPreferences = useMemo(
    () =>
      preferences.filter((preference) => {
        if (!normalizedQuery) {
          return true
        }

        return [
          preference.studentId,
          preference.studentName,
          preference.teamName,
          ...preference.preferenceOrder,
        ].some((value) => value.toLowerCase().includes(normalizedQuery))
      }),
    [normalizedQuery, preferences],
  )

  useEffect(() => {
    async function loadPreferences() {
      const response = await fetchAdmin("/api/admin/preferences")

      if (!response.ok) {
        setError("無法載入學員志願。")
        setLoading(false)
        return
      }

      const payload = (await response.json()) as AdminPreferencesPayload

      setPreferences(payload.preferences)
      setLoading(false)
    }

    void loadPreferences()
  }, [])

  async function updatePreference(
    studentId: string,
    updates: Pick<StudentSpeakerPreference, "preferenceOrder" | "submittedAt">,
  ) {
    const currentPreferences = preferences

    setPreferences((current) =>
      updateLocalPreference(current, studentId, updates),
    )
    setError(null)

    const response = await fetchAdmin(
      `/api/admin/preferences/${encodeURIComponent(studentId)}`,
      {
        body: JSON.stringify(updates),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      },
    )

    if (!response.ok) {
      setPreferences(currentPreferences)
      setError("志願更新失敗。")
    }
  }

  return (
    <AdminSectionPage title="志願控制">
      <Card className="max-h-[calc(100svh-10rem)] overflow-hidden">
        <CardHeader className="gap-3">
          <Badge variant="outline">
            <SlidersHorizontalIcon
              aria-hidden="true"
              data-icon="inline-start"
            />
            志願控制
          </Badge>
          <CardTitle className="text-2xl font-black tracking-tight">
            學員志願序
          </CardTitle>
          <CardDescription className="text-base leading-7">
            查看、搜尋並修改每位學員的志願序與送出時間。分配優先序以送出時間為準，未送出者排最後。
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{preferences.length} 位學員</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-col gap-4 overflow-hidden">
          <div className="relative shrink-0">
            <SearchIcon
              aria-hidden="true"
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              value={query}
              placeholder="搜尋姓名、組別、講者"
              aria-label="搜尋學員志願"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
              <Spinner aria-hidden="true" />
              載入中
            </div>
          ) : null}

          <div className="min-h-0 overflow-y-auto pr-1">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>學員</TableHead>
                  <TableHead>志願序</TableHead>
                  <TableHead>送出時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPreferences.map((preference) => (
                  <PreferenceRow
                    key={preference.studentId}
                    preference={preference}
                    speakerNames={speakerNames}
                    onUpdatePreference={(studentId, updates) =>
                      void updatePreference(studentId, updates)
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPreferences.length === 0 ? (
            <p className="text-muted-foreground shrink-0 text-center text-sm font-semibold">
              沒有符合搜尋條件的學員。
            </p>
          ) : null}
          {error ? (
            <p className="text-destructive shrink-0 text-sm font-semibold">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AdminSectionPage>
  )
}

type PreferenceRowProps = {
  preference: StudentSpeakerPreference
  speakerNames: string[]
  onUpdatePreference: (
    studentId: string,
    updates: Pick<StudentSpeakerPreference, "preferenceOrder" | "submittedAt">,
  ) => void
}

function PreferenceRow({
  preference,
  speakerNames,
  onUpdatePreference,
}: PreferenceRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-black">{preference.studentName}</span>
          <span className="text-muted-foreground text-xs">
            {preference.studentId} / {preference.teamName}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <PreferenceOrderBadges preference={preference} />
      </TableCell>
      <TableCell>{formatSubmittedAt(preference.submittedAt)}</TableCell>
      <TableCell className="text-right">
        <EditPreferenceDialog
          preference={preference}
          speakerNames={speakerNames}
          onUpdatePreference={onUpdatePreference}
        />
      </TableCell>
    </TableRow>
  )
}

type EditPreferenceDialogProps = {
  preference: StudentSpeakerPreference
  speakerNames: string[]
  onUpdatePreference: (
    studentId: string,
    updates: Pick<StudentSpeakerPreference, "preferenceOrder" | "submittedAt">,
  ) => void
}

function EditPreferenceDialog({
  preference,
  speakerNames,
  onUpdatePreference,
}: EditPreferenceDialogProps) {
  const [preferenceOrder, setPreferenceOrder] = useState(
    createEditablePreferenceOrder(preference.preferenceOrder, speakerNames),
  )
  const [submittedAt, setSubmittedAt] = useState(
    toDateTimeLocalValue(preference.submittedAt),
  )

  function updateRank(rankIndex: number, speakerName: string) {
    setPreferenceOrder((current) => {
      const nextOrder = current.map((currentSpeakerName, index) =>
        index === rankIndex ? speakerName : currentSpeakerName,
      )
      const remainingSpeakerNames = speakerNames.filter(
        (candidate) => !nextOrder.includes(candidate),
      )

      return nextOrder.map((currentSpeakerName, index) => {
        if (
          index !== rankIndex &&
          currentSpeakerName === speakerName &&
          remainingSpeakerNames[0]
        ) {
          return remainingSpeakerNames.shift() ?? currentSpeakerName
        }

        return currentSpeakerName
      })
    })
  }

  function savePreference() {
    onUpdatePreference(preference.studentId, {
      preferenceOrder,
      submittedAt: fromDateTimeLocalValue(submittedAt),
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <PencilIcon aria-hidden="true" data-icon="inline-start" />
          修改
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改志願序</DialogTitle>
          <DialogDescription>
            {preference.studentName} / {preference.teamName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[min(60dvh,28rem)] gap-4 overflow-y-auto pr-1">
          {preferenceOrder.map((speakerName, index) => (
            <div
              key={`${preference.studentId}-rank-${index}`}
              className="grid gap-2"
            >
              <Label htmlFor={`${preference.studentId}-rank-${index}`}>
                第 {index + 1} 志願
              </Label>
              <NativeSelect
                id={`${preference.studentId}-rank-${index}`}
                value={speakerName}
                onChange={(event) => updateRank(index, event.target.value)}
              >
                {speakerNames.map((candidateName) => (
                  <NativeSelectOption key={candidateName} value={candidateName}>
                    {candidateName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          ))}

          <div className="grid gap-2">
            <Label htmlFor={`${preference.studentId}-submitted-at`}>
              送出時間
            </Label>
            <Input
              id={`${preference.studentId}-submitted-at`}
              type="datetime-local"
              value={submittedAt}
              onChange={(event) => setSubmittedAt(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              取消
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" onClick={savePreference}>
              儲存
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type PreferenceOrderBadgesProps = {
  preference: StudentSpeakerPreference
}

function PreferenceOrderBadges({ preference }: PreferenceOrderBadgesProps) {
  if (preference.preferenceOrder.length === 0) {
    return <Badge variant="secondary">尚未送出志願</Badge>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {preference.preferenceOrder.map((speakerName, index) => (
        <Badge key={`${preference.studentId}-${speakerName}`} variant="outline">
          {index + 1}. {speakerName}
        </Badge>
      ))}
    </div>
  )
}

function createEditablePreferenceOrder(
  preferenceOrder: string[],
  speakerNames: string[],
) {
  if (preferenceOrder.length === 0) {
    return speakerNames
  }

  return preferenceOrder
}

function updateLocalPreference(
  preferences: StudentSpeakerPreference[],
  studentId: string,
  updates: Pick<StudentSpeakerPreference, "preferenceOrder" | "submittedAt">,
) {
  return preferences.map((preference) =>
    preference.studentId === studentId
      ? { ...preference, ...updates }
      : preference,
  )
}
