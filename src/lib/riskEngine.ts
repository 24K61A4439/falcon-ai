import type {
  CallAnalysis,
  RiskLevel,
  TacticName,
  TacticScore,
  TranscriptSegment,
} from "@/types/call"

interface PatternGroup {
  name: string
  shortName: TacticName
  patterns: RegExp[]
}

const groups: PatternGroup[] = [
  {
    name: "Authority Impersonation",
    shortName: "Authority",
    patterns: [
      /\b(?:bank|police|cbi|rbi|income tax|customs|government|kyc|officer|manager|department)\b/i,
      /(?:बैंक|पुलिस|अधिकारी|केवाईसी|सरकार)/i,
    ],
  },
  {
    name: "Threat / Fear",
    shortName: "Threat",
    patterns: [
      /\b(?:blocked|suspended|arrest|warrant|legal action|freeze|penalty|jail|digital arrest)\b/i,
      /(?:बंद|गिरफ्तार|जेल|कार्रवाई|अकाउंट ब्लॉक)/i,
    ],
  },
  {
    name: "Secrecy",
    shortName: "Secrecy",
    patterns: [
      /\b(?:do not tell|don't tell|keep (?:this )?secret|do not discuss|without telling|confidential)\b/i,
      /(?:किसी को मत बताना|गुप्त|किसी से मत कहना)/i,
    ],
  },
  {
    name: "OTP / Payment",
    shortName: "OTP Request",
    patterns: [
      /\b(?:share|tell|read|send|give|enter)\b.{0,24}\b(?:otp|pin|password|cvv|code)\b/i,
      /\b(?:transfer|send|pay|deposit)\b.{0,24}(?:₹|rs\.?|rupees?|money|funds?|amount)\b/i,
      /(?:ओटीपी|पिन|पासवर्ड).{0,24}(?:बताओ|बताना|शेयर|भेजो)/i,
    ],
  },
  {
    name: "Urgency",
    shortName: "Urgency",
    patterns: [
      /\b(?:immediately|right now|today only|within \d+ minutes?|urgent|quickly|last chance)\b/i,
      /(?:अभी|तुरंत|जल्दी|आज ही)/i,
    ],
  },
  {
    name: "Emotional Trick",
    shortName: "Emotional Trick",
    patterns: [
      /\b(?:your (?:son|daughter|grandchild|family)|accident|hospital|emergency|help me|in trouble)\b/i,
      /(?:बेटा|बेटी|पोता|पोती|अस्पताल|मुसीबत|मदद)/i,
    ],
  },
]

const safeOtpLanguage =
  /\b(?:never|do not|don't|won't|will not)\b.{0,22}\b(?:ask|share|tell|read|give)\b.{0,18}\b(?:otp|pin|password|cvv)\b/i

const levelForScore = (score: number): RiskLevel =>
  score >= 75 ? "high" : score >= 40 ? "medium" : "low"

export function analyzeTranscript(
  text: string,
  firstWarningMs = 0,
): CallAnalysis {
  const normalized = text.trim()
  const scores = new Map<TacticName, number>()
  const matches = new Map<TacticName, string>()

  for (const group of groups) {
    let hits = 0
    for (const pattern of group.patterns) {
      const match = normalized.match(pattern)
      if (match) {
        hits += 1
        if (!matches.has(group.shortName)) matches.set(group.shortName, match[0])
      }
    }
    scores.set(group.shortName, Math.min(96, hits * 38 + (hits ? 28 : 0)))
  }
  if (safeOtpLanguage.test(normalized)) {
    scores.set("OTP Request", 0)
    matches.delete("OTP Request")
  }

  const otp = scores.get("OTP Request") ?? 0
  const secrecy = scores.get("Secrecy") ?? 0
  const threat = scores.get("Threat") ?? 0
  const authority = scores.get("Authority") ?? 0
  const urgency = scores.get("Urgency") ?? 0
  const emotion = scores.get("Emotional Trick") ?? 0
  let score = Math.round(
    otp * 0.31 +
      threat * 0.2 +
      secrecy * 0.17 +
      authority * 0.13 +
      urgency * 0.11 +
      emotion * 0.08,
  )
  if (otp >= 60 && (secrecy >= 60 || threat >= 60)) score += 28
  if (authority >= 60 && threat >= 60) score += 12
  if (!normalized) score = 0
  score = Math.min(99, score)

  const tactics: TacticScore[] = groups.map((group) => ({
    name: group.name,
    shortName: group.shortName,
    score: scores.get(group.shortName) ?? 0,
  }))
  const detected = tactics.filter((tactic) => tactic.score > 0)
  const level = levelForScore(score)
  let warning = "No dangerous request detected."
  if (otp > 0) warning = "Do not share your OTP, PIN, or password."
  else if (threat > 0) warning = "Hang up and verify this claim independently."
  else if (secrecy > 0) warning = "Tell a trusted family member about this call."
  else if (level === "medium") warning = "Pause before taking any action."

  const sentences = normalized
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
  const transcript: TranscriptSegment[] = sentences.map((sentence, index) => {
    const found = detected.find((tactic) => {
      const phrase = matches.get(tactic.shortName)
      return phrase && sentence.toLowerCase().includes(phrase.toLowerCase())
    })
    return {
      id: index + 1,
      time: new Date(index * 3000).toISOString().slice(14, 19),
      text: sentence,
      highlight: found ? matches.get(found.shortName) : undefined,
      tactic: found?.shortName,
    }
  })

  return {
    score,
    level,
    firstWarningMs,
    transcript,
    tactics,
    warning,
    explanation: detected.length
      ? `The call contains ${detected
          .map((tactic) => tactic.shortName.toLowerCase())
          .join(", ")} signals. Risk rises when several tactics appear together.`
      : "No manipulation pattern or request for sensitive information was detected.",
  }
}
