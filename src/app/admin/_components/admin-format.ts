export function formatSubmittedAt(value: string | null) {
  if (!value) {
    return "尚未送出"
  }

  const date = new Date(value)
  const period = date.getHours() < 12 ? "上午" : "下午"
  const hour = date.getHours() % 12 || 12
  const minute = date.getMinutes().toString().padStart(2, "0")

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${period}${hour}:${minute}`
}

export function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return ""
  }

  return value.slice(0, 16)
}

export function fromDateTimeLocalValue(value: string) {
  if (!value) {
    return null
  }

  return new Date(value).toISOString()
}
