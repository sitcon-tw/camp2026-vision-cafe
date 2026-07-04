export const statusToneClassNames = {
  success: {
    badge:
      "border-transparent bg-status-success text-status-success-foreground hover:bg-status-success/90",
    dot: "bg-status-success",
    icon: "text-status-success",
  },
  info: {
    badge:
      "border-transparent bg-status-info text-status-info-foreground hover:bg-status-info/90",
    dot: "bg-status-info",
    icon: "text-status-info",
  },
  magic: {
    badge:
      "border-transparent bg-status-magic text-status-magic-foreground hover:bg-status-magic/90",
    dot: "bg-status-magic",
    icon: "text-status-magic",
  },
  warning: {
    badge:
      "border-transparent bg-status-warning text-status-warning-foreground hover:bg-status-warning/90",
    dot: "bg-status-warning",
    icon: "text-status-warning",
  },
  danger: {
    badge:
      "border-transparent bg-destructive text-primary-foreground hover:bg-destructive/90",
    dot: "bg-destructive",
    icon: "text-destructive",
  },
} as const

export type StatusTone = keyof typeof statusToneClassNames

export const pebbleToneClassNames = {
  explore: {
    badge:
      "border-pebble-explore/20 bg-pebble-explore-muted text-pebble-explore-foreground",
  },
  spark: {
    badge:
      "border-pebble-spark/20 bg-pebble-spark-muted text-pebble-spark-foreground",
  },
  resonate: {
    badge:
      "border-pebble-resonate/20 bg-pebble-resonate-muted text-pebble-resonate-foreground",
  },
  engineer: {
    badge:
      "border-pebble-engineer/20 bg-pebble-engineer-muted text-pebble-engineer-foreground",
  },
  play: {
    badge:
      "border-pebble-play/20 bg-pebble-play-muted text-pebble-play-foreground",
  },
} as const

export type PebbleTone = keyof typeof pebbleToneClassNames
