import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

type AppLanguage = 'en' | 'hi' | 'te'
type TranslatableAttribute = 'placeholder' | 'title' | 'aria-label'
type AttributeTarget = { element: Element; attribute: TranslatableAttribute; sourceValue: string }

const CACHE_PREFIX = 'ui_translation_cache_v1'
const ATTRIBUTES: TranslatableAttribute[] = ['placeholder', 'title', 'aria-label']
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'CODE', 'PRE', 'TEXTAREA'])
const SHORTCUT_PATTERN = /^[⌘⇧⌥⌃A-Z0-9\s+]+$/

const textRecords = new WeakMap<Text, { sourceValue: string; sourceText: string; translatedValue?: string; language?: AppLanguage }>()
const attributeRecords = new WeakMap<Element, Map<string, { sourceValue: string; sourceText: string; translatedValue?: string; language?: AppLanguage }>>()

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function isProbablyTranslatable(value: string) {
  const text = normalizeText(value)
  if (text.length < 2 || text.length > 220) return false
  if (!/[A-Za-z]/.test(text)) return false
  if (/@|https?:\/\//i.test(text)) return false
  if (/^[\d\s₹$€£.,:%/+\-–—#()[\]]+$/.test(text)) return false
  if (SHORTCUT_PATTERN.test(text)) return false
  return true
}

function shouldSkipElement(element: Element | null) {
  if (!element) return true
  if (SKIP_TAGS.has(element.tagName)) return true
  return Boolean(element.closest('[data-no-ui-translate]'))
}

function cachedTranslations(language: AppLanguage) {
  try {
    return JSON.parse(localStorage.getItem(`${CACHE_PREFIX}:${language}`) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function saveCachedTranslations(language: AppLanguage, cache: Record<string, string>) {
  try {
    const entries = Object.entries(cache).slice(-700)
    localStorage.setItem(`${CACHE_PREFIX}:${language}`, JSON.stringify(Object.fromEntries(entries)))
  } catch {
    // Browser storage can be unavailable or full; translation still works for the current page.
  }
}

function applyTextTranslation(node: Text, translation: string, language: AppLanguage) {
  const record = textRecords.get(node)
  if (!record) return
  const leading = record.sourceValue.match(/^\s*/)?.[0] ?? ''
  const trailing = record.sourceValue.match(/\s*$/)?.[0] ?? ''
  const translatedValue = `${leading}${translation}${trailing}`
  record.translatedValue = translatedValue
  record.language = language
  node.nodeValue = translatedValue
}

function applyAttributeTranslation(target: AttributeTarget, translation: string, language: AppLanguage) {
  const records = attributeRecords.get(target.element)
  const record = records?.get(target.attribute)
  if (!record) return
  record.translatedValue = translation
  record.language = language
  target.element.setAttribute(target.attribute, translation)
}

export function UiAutoTranslator() {
  const { user } = useAuth()
  const language = (user?.language ?? 'en') as AppLanguage
  const languageRef = useRef<AppLanguage>(language)
  const observerRef = useRef<MutationObserver | null>(null)
  const textNodesRef = useRef(new Set<Text>())
  const attributeTargetsRef = useRef(new Set<AttributeTarget>())
  const pendingTextsRef = useRef(new Map<string, Set<Text>>())
  const pendingAttributesRef = useRef(new Map<string, AttributeTarget[]>())
  const debounceRef = useRef<number | null>(null)
  const cacheRef = useRef<Record<string, string>>({})

  useEffect(() => {
    languageRef.current = language
    cacheRef.current = language === 'en' ? {} : cachedTranslations(language)

    const restoreEnglish = () => {
      textNodesRef.current.forEach((node) => {
        const record = textRecords.get(node)
        if (record?.translatedValue && node.nodeValue === record.translatedValue) {
          node.nodeValue = record.sourceValue
        }
      })
      attributeTargetsRef.current.forEach(({ element, attribute }) => {
        const record = attributeRecords.get(element)?.get(attribute)
        if (record?.translatedValue && element.getAttribute(attribute) === record.translatedValue) {
          element.setAttribute(attribute, record.sourceValue)
        }
      })
    }

    const queueTextNode = (node: Text) => {
      if (languageRef.current === 'en' || shouldSkipElement(node.parentElement)) return
      const raw = node.nodeValue ?? ''
      const existing = textRecords.get(node)
      const sourceValue = existing?.translatedValue === raw ? existing.sourceValue : raw
      const sourceText = existing?.translatedValue === raw ? existing.sourceText : normalizeText(sourceValue)
      if (!isProbablyTranslatable(sourceText)) return

      textRecords.set(node, { sourceValue, sourceText, translatedValue: existing?.translatedValue, language: existing?.language })
      textNodesRef.current.add(node)

      const cached = cacheRef.current[sourceText]
      if (cached) {
        if (!(existing?.translatedValue === raw && existing.language === languageRef.current)) {
          applyTextTranslation(node, cached, languageRef.current)
        }
        return
      }

      const bucket = pendingTextsRef.current.get(sourceText) ?? new Set<Text>()
      bucket.add(node)
      pendingTextsRef.current.set(sourceText, bucket)
    }

    const queueAttribute = (element: Element, attribute: TranslatableAttribute) => {
      if (languageRef.current === 'en' || shouldSkipElement(element)) return
      const raw = element.getAttribute(attribute) ?? ''
      const records = attributeRecords.get(element) ?? new Map()
      const existing = records.get(attribute)
      const sourceValue = existing?.translatedValue === raw ? existing.sourceValue : raw
      const sourceText = existing?.translatedValue === raw ? existing.sourceText : normalizeText(sourceValue)
      if (!isProbablyTranslatable(sourceText)) return

      records.set(attribute, { sourceValue, sourceText, translatedValue: existing?.translatedValue, language: existing?.language })
      attributeRecords.set(element, records)

      const target = { element, attribute, sourceValue }
      attributeTargetsRef.current.add(target)

      const cached = cacheRef.current[sourceText]
      if (cached) {
        if (!(existing?.translatedValue === raw && existing.language === languageRef.current)) {
          applyAttributeTranslation(target, cached, languageRef.current)
        }
        return
      }

      const bucket = pendingAttributesRef.current.get(sourceText) ?? []
      bucket.push(target)
      pendingAttributesRef.current.set(sourceText, bucket)
    }

    const flush = async () => {
      debounceRef.current = null
      const activeLanguage = languageRef.current
      if (activeLanguage === 'en') return

      const sources = Array.from(new Set([
        ...pendingTextsRef.current.keys(),
        ...pendingAttributesRef.current.keys(),
      ])).slice(0, 80)
      if (!sources.length) return

      pendingTextsRef.current.clear()
      pendingAttributesRef.current.clear()

      const cached = cacheRef.current
      const missing = sources.filter((source) => !cached[source])
      if (missing.length) {
        try {
          const { data } = await api.post<{ translations: Record<string, string> }>('/ui-translation/batch', {
            language: activeLanguage,
            texts: missing,
          })
          Object.assign(cached, data.translations)
          saveCachedTranslations(activeLanguage, cached)
        } catch {
          return
        }
      }

      sources.forEach((source) => {
        const translation = cached[source]
        if (!translation) return
        textNodesRef.current.forEach((node) => {
          const record = textRecords.get(node)
          if (record?.sourceText === source && node.isConnected) applyTextTranslation(node, translation, activeLanguage)
        })
        attributeTargetsRef.current.forEach((target) => {
          const record = attributeRecords.get(target.element)?.get(target.attribute)
          if (record?.sourceText === source && target.element.isConnected) applyAttributeTranslation(target, translation, activeLanguage)
        })
      })
    }

    const scheduleFlush = () => {
      if (languageRef.current === 'en') return
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => { void flush() }, 250)
    }

    const processElementAttributes = (element: Element) => {
      ATTRIBUTES.forEach((attribute) => {
        if (element.hasAttribute(attribute)) queueAttribute(element, attribute)
      })
    }

    const processRoot = (root: Node) => {
      if (languageRef.current === 'en') return
      if (root.nodeType === Node.TEXT_NODE) {
        queueTextNode(root as Text)
        return
      }
      if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return

      if (root.nodeType === Node.ELEMENT_NODE) processElementAttributes(root as Element)
      const elementRoot = root as Element | DocumentFragment
      if ('querySelectorAll' in elementRoot) {
        elementRoot.querySelectorAll('*').forEach(processElementAttributes)
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let current = walker.nextNode()
      while (current) {
        queueTextNode(current as Text)
        current = walker.nextNode()
      }
      scheduleFlush()
    }

    observerRef.current?.disconnect()
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    pendingTextsRef.current.clear()
    pendingAttributesRef.current.clear()

    if (language === 'en') {
      restoreEnglish()
      return
    }

    processRoot(document.body)
    observerRef.current = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          processRoot(mutation.target)
        } else if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          processElementAttributes(mutation.target as Element)
        } else {
          mutation.addedNodes.forEach(processRoot)
        }
      }
      scheduleFlush()
    })
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTES,
    })

    return () => {
      observerRef.current?.disconnect()
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [language])

  return null
}
