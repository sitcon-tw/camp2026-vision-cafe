import type { ParticipantRole } from "@/lib/vision-cafe"
import { Badge } from "@/components/ui/badge"

type ParticipantRoleBadgeProps = {
  role: ParticipantRole
}

export function ParticipantRoleBadge({ role }: ParticipantRoleBadgeProps) {
  return (
    <Badge variant={role === "counselor" ? "secondary" : "outline"}>
      {role === "counselor" ? "隊輔" : "學員"}
    </Badge>
  )
}
