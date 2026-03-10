"use client"

import * as React from "react"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Sparkles, Loader2, Send, MapPin, RefreshCw, Tag, Package,
  DollarSign, Search, Info, ChevronRight, CheckCircle2, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { KeywordsInput } from "@/components/KeywordsInput"
import { useToast } from "@/components/ui/use-toast"
import { productSchema, type ProductFormData } from "@/lib/schemas"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: 2477, name: "Электроника и гаджеты" },
  { id: 2478, name: "Одежда и обувь" },
  { id: 2479, name: "Дом и сад" },
  { id: 2480, name: "Спорт и отдых" },
  { id: 2481, name: "Красота и здоровье" },
  { id: 2482, name: "Детские товары" },
  { id: 2483, name: "Книги и канцелярия" },
  { id: 2484, name: "Еда и напитки" },
  { id: 2485, name: "Автотовары" },
  { id: 2486, name: "Прочее" },
]

const UNITS = [
  { id: 116, name: "шт (штука)" },
  { id: 117, name: "кг (килограмм)" },
  { id: 118, name: "л (литр)" },
  { id: 119, name: "м (метр)" },
  { id: 120, name: "упак (упаковка)" },
  { id: 121, name: "комп (комплект)" },
]

const CASHBACK_TYPES = [
  { value: "lcard_cashback", label: "L-Card кэшбек" },
  { value: "percent_cashback", label: "Процентный кэшбек" },
  { value: "fixed_cashback", label: "Фиксированный кэшбек" },
]

const GLOBAL_CATEGORIES = [
  { id: 127, name: "Товары" },
  { id: 128, name: "Услуги" },
  { id: 129, name: "Цифровые товары" },
]

type AILoadingState = {
  generateAll: boolean
  generateSeo: boolean
  improveShort: boolean
  improveLong: boolean
  suggestCategory: boolean
}

export function ProductCardForm() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState("basic")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitSuccess, setSubmitSuccess] = React.useState(false)
  const [aiLoading, setAiLoading] = React.useState<AILoadingState>({
    generateAll: false,
    generateSeo: false,
    improveShort: false,
    improveLong: false,
    suggestCategory: false,
  })

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: "product",
      unit: 116,
      category: 2477,
      cashback_type: "lcard_cashback",
      global_category_id: 127,
      seo_keywords: [],
      marketplace_price: 0,
      chatting_percent: 4,
      latitude: 55.7558,
      longitude: 37.6173,
    },
  })

  const watchedValues = watch()

  const calculateProgress = () => {
    const fields = [
      watchedValues.name, watchedValues.description_short, watchedValues.description_long,
      watchedValues.code, watchedValues.seo_title, watchedValues.seo_description,
      watchedValues.address, watchedValues.marketplace_price,
    ]
    const keywordsOk = watchedValues.seo_keywords?.length > 0
    const filledFields = fields.filter(f => f && String(f).length > 0).length
    return Math.round(((filledFields + (keywordsOk ? 1 : 0)) / (fields.length + 1)) * 100)
  }

  const progress = calculateProgress()

  const callAI = async (action: string, data: Record<string, unknown>) => {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, data }),
    })
    if (!response.ok) throw new Error("AI request failed")
    const result = await response.json()
    return result.data
  }

  const handleGenerateAll = async () => {
    const name = getValues("name")
    if (!name) {
      toast({ title: "Введите название", description: "Для генерации полей необходимо указать название товара", variant: "destructive" })
      return
    }
    setAiLoading(prev => ({ ...prev, generateAll: true }))
    try {
      const data = await callAI("generate_all", { name })
      if (data.description_short) setValue("description_short", data.description_short)
      if (data.description_long) setValue("description_long", data.description_long)
      if (data.code) setValue("code", data.code)
      if (data.seo_title) setValue("seo_title", data.seo_title)
      if (data.seo_description) setValue("seo_description", data.seo_description)
      if (data.seo_keywords) setValue("seo_keywords", data.seo_keywords)
      if (data.marketplace_price) setValue("marketplace_price", data.marketplace_price)
      if (data.chatting_percent) setValue("chatting_percent", data.chatting_percent)
      if (data.address) setValue("address", data.address)
      if (data.latitude) setValue("latitude", data.latitude)
      if (data.longitude) setValue("longitude", data.longitude)
      toast({ title: "Готово!", description: "Все поля заполнены на основе названия товара" })
    } catch {
      toast({ title: "Ошибка AI", description: "Не удалось сгенерировать данные. Проверьте API ключ.", variant: "destructive" })
    } finally {
      setAiLoading(prev => ({ ...prev, generateAll: false }))
    }
  }

  const handleGenerateSEO = async () => {
    const { name, description_short, description_long } = getValues()
    if (!name) {
      toast({ title: "Введите название товара", variant: "destructive" })
      return
    }
    setAiLoading(prev => ({ ...prev, generateSeo: true }))
    try {
      const data = await callAI("generate_seo", { name, description_short, description_long })
      if (data.seo_title) setValue("seo_title", data.seo_title)
      if (data.seo_description) setValue("seo_description", data.seo_description)
      if (data.seo_keywords) setValue("seo_keywords", data.seo_keywords)
      toast({ title: "SEO сгенерированы!", description: "SEO поля успешно заполнены" })
    } catch {
      toast({ title: "Ошибка AI", description: "Не удалось сгенерировать SEO", variant: "destructive" })
    } finally {
      setAiLoading(prev => ({ ...prev, generateSeo: false }))
    }
  }

  const handleImproveDescription = async (type: "short" | "long") => {
    const text = getValues(type === "short" ? "description_short" : "description_long")
    if (!text) {
      toast({ title: "Введите текст для улучшения", variant: "destructive" })
      return
    }
    setAiLoading(prev => ({ ...prev, [type === "short" ? "improveShort" : "improveLong"]: true }))
    try {
      const data = await callAI("improve_description", { text, type })
      if (data.improved_text) {
        setValue(type === "short" ? "description_short" : "description_long", data.improved_text)
        toast({ title: "Текст улучшен!", description: "Описание успешно переработано" })
      }
    } catch {
      toast({ title: "Ошибка AI", description: "Не удалось улучшить текст", variant: "destructive" })
    } finally {
      setAiLoading(prev => ({ ...prev, [type === "short" ? "improveShort" : "improveLong"]: false }))
    }
  }

  const handleSuggestCategory = async () => {
    const { name, description_short } = getValues()
    if (!name) {
      toast({ title: "Введите название товара", variant: "destructive" })
      return
    }
    setAiLoading(prev => ({ ...prev, suggestCategory: true }))
    try {
      const data = await callAI("suggest_category", { name, description_short })
      if (data.category_id) {
        setValue("category", data.category_id)
        toast({ title: `Категория: ${data.category_name}`, description: `Уверенность: ${data.confidence}` })
      }
    } catch {
      toast({ title: "Ошибка AI", description: "Не удалось определить категорию", variant: "destructive" })
    } finally {
      setAiLoading(prev => ({ ...prev, suggestCategory: false }))
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Геолокация недоступна", variant: "destructive" })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", pos.coords.latitude)
        setValue("longitude", pos.coords.longitude)
        toast({ title: "Координаты получены!", description: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` })
      },
      () => { toast({ title: "Не удалось получить геолокацию", variant: "destructive" }) }
    )
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed")
      }
      setSubmitSuccess(true)
      toast({ title: "Товар создан!", description: "Карточка товара успешно добавлена в маркетплейс" })
    } catch (err) {
      toast({ title: "Ошибка создания", description: String(err), variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabStatus = {
    basic: !!(watchedValues.name && watchedValues.description_short && watchedValues.description_long && watchedValues.code),
    category: true,
    pricing: watchedValues.marketplace_price > 0,
    seo: !!(watchedValues.seo_title && watchedValues.seo_description && watchedValues.seo_keywords?.length > 0),
    location: !!(watchedValues.address),
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-lg leading-none">Создание карточки товара</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Маркетплейс TableCRM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/products">
                <Button variant="outline" size="sm" className="gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Все товары</span>
                </Button>
              </Link>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Заполнено:</span>
                <Progress value={progress} className="w-24 h-2" />
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || submitSuccess} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitSuccess ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {isSubmitting ? "Создаём..." : submitSuccess ? "Создано!" : "Создать товар"}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* AI Generate All Banner */}
          {watchedValues.name && (
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">AI-заполнение всех полей</p>
                      <p className="text-sm text-blue-600">Нейросеть заполнит все поля по названию &quot;{watchedValues.name}&quot;</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateAll}
                    disabled={aiLoading.generateAll}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    {aiLoading.generateAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {aiLoading.generateAll ? "Генерируем..." : "Заполнить всё"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full mb-6">
                {[
                  { id: "basic", label: "Основное", icon: Info },
                  { id: "category", label: "Категория", icon: Tag },
                  { id: "pricing", label: "Цена", icon: DollarSign },
                  { id: "seo", label: "SEO", icon: Search },
                  { id: "location", label: "Адрес", icon: MapPin },
                ].map(({ id, label, icon: Icon }) => (
                  <TabsTrigger key={id} value={id} className="gap-1.5 text-xs sm:text-sm">
                    <span className="hidden sm:inline">
                      {tabStatus[id as keyof typeof tabStatus] ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </span>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* TAB: Basic Info */}
              <TabsContent value="basic">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Основная информация
                      </CardTitle>
                      <CardDescription>Название, описания и артикул товара</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Name field */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-1">
                          Название товара <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="Например: Беспроводные наушники Sony WH-1000XM5"
                          className={cn(errors.name && "border-destructive")}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> {errors.name.message}
                          </p>
                        )}
                      </div>

                      {/* Code */}
                      <div className="space-y-2">
                        <Label htmlFor="code">Артикул / SKU <span className="text-destructive">*</span></Label>
                        <Input
                          id="code"
                          {...register("code")}
                          placeholder="Например: SONY-WH1000XM5-BLK"
                          className={cn(errors.code && "border-destructive")}
                        />
                        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                      </div>

                      {/* Type */}
                      <div className="space-y-2">
                        <Label>Тип</Label>
                        <Controller
                          name="type"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="product">Товар</SelectItem>
                                <SelectItem value="service">Услуга</SelectItem>
                                <SelectItem value="digital">Цифровой товар</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Short description */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="description_short">
                            Краткое описание <span className="text-destructive">*</span>
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleImproveDescription("short")}
                                disabled={aiLoading.improveShort}
                                className="gap-1.5 h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                {aiLoading.improveShort ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                AI улучшить
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Улучшить текст с помощью ИИ</TooltipContent>
                          </Tooltip>
                        </div>
                        <Textarea
                          id="description_short"
                          {...register("description_short")}
                          placeholder="Краткое описание товара в 1-2 предложения"
                          className={cn("resize-none", errors.description_short && "border-destructive")}
                          rows={3}
                        />
                        {errors.description_short && <p className="text-sm text-destructive">{errors.description_short.message}</p>}
                      </div>

                      {/* Long description */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="description_long">
                            Полное описание <span className="text-destructive">*</span>
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleImproveDescription("long")}
                                disabled={aiLoading.improveLong}
                                className="gap-1.5 h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                {aiLoading.improveLong ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                AI улучшить
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Переписать для продающего эффекта</TooltipContent>
                          </Tooltip>
                        </div>
                        <Textarea
                          id="description_long"
                          {...register("description_long")}
                          placeholder="Подробное описание товара: характеристики, преимущества, условия использования..."
                          className={cn("resize-none", errors.description_long && "border-destructive")}
                          rows={6}
                        />
                        {errors.description_long && <p className="text-sm text-destructive">{errors.description_long.message}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setActiveTab("category")} className="gap-2">
                      Далее: Категория <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Category */}
              <TabsContent value="category">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        Категория и единицы
                      </CardTitle>
                      <CardDescription>Выберите категорию и единицу измерения</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Категория</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleSuggestCategory}
                                disabled={aiLoading.suggestCategory}
                                className="gap-1.5 h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                {aiLoading.suggestCategory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                AI определить
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Автоматически определить категорию</TooltipContent>
                          </Tooltip>
                        </div>
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите категорию" />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Глобальная категория</Label>
                        <Controller
                          name="global_category_id"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GLOBAL_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Единица измерения</Label>
                        <Controller
                          name="unit"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {UNITS.map((unit) => (
                                  <SelectItem key={unit.id} value={String(unit.id)}>{unit.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>Назад</Button>
                    <Button type="button" onClick={() => setActiveTab("pricing")} className="gap-2">
                      Далее: Цена <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Pricing */}
              <TabsContent value="pricing">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Ценообразование
                      </CardTitle>
                      <CardDescription>Цена, кэшбек и комиссия</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="marketplace_price">Цена на маркетплейсе (₽) <span className="text-destructive">*</span></Label>
                        <Input
                          id="marketplace_price"
                          type="number"
                          {...register("marketplace_price", { valueAsNumber: true })}
                          placeholder="0"
                          min="0"
                          className={cn(errors.marketplace_price && "border-destructive")}
                        />
                        {errors.marketplace_price && <p className="text-sm text-destructive">{errors.marketplace_price.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="chatting_percent">
                          Процент чата (%)
                          <span className="ml-2 text-xs text-muted-foreground">Комиссия за продажу через чат</span>
                        </Label>
                        <Input
                          id="chatting_percent"
                          type="number"
                          {...register("chatting_percent", { valueAsNumber: true })}
                          placeholder="4"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Тип кэшбека</Label>
                        <Controller
                          name="cashback_type"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CASHBACK_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      {watchedValues.marketplace_price > 0 && (
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                          <p className="text-sm font-medium">Предварительный расчёт:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Цена:</span>
                            <span className="font-medium">{watchedValues.marketplace_price.toLocaleString("ru-RU")} ₽</span>
                            <span className="text-muted-foreground">Комиссия ({watchedValues.chatting_percent}%):</span>
                            <span className="font-medium text-red-500">
                              -{(watchedValues.marketplace_price * watchedValues.chatting_percent / 100).toLocaleString("ru-RU")} ₽
                            </span>
                            <span className="text-muted-foreground">Выручка:</span>
                            <span className="font-medium text-green-600">
                              {(watchedValues.marketplace_price * (1 - watchedValues.chatting_percent / 100)).toLocaleString("ru-RU")} ₽
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("category")}>Назад</Button>
                    <Button type="button" onClick={() => setActiveTab("seo")} className="gap-2">
                      Далее: SEO <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* TAB: SEO */}
              <TabsContent value="seo">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        SEO настройки
                      </CardTitle>
                      <CardDescription>Оптимизация для поисковых систем</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleGenerateSEO}
                          disabled={aiLoading.generateSeo}
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          {aiLoading.generateSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          Сгенерировать SEO через AI
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seo_title">SEO заголовок <span className="text-destructive">*</span></Label>
                        <Input
                          id="seo_title"
                          {...register("seo_title")}
                          placeholder="Заголовок для поисковых систем (до 60 символов)"
                          className={cn(errors.seo_title && "border-destructive")}
                        />
                        {watchedValues.seo_title && (
                          <p className={cn("text-xs", watchedValues.seo_title.length > 60 ? "text-destructive" : "text-muted-foreground")}>
                            {watchedValues.seo_title.length}/60 символов
                          </p>
                        )}
                        {errors.seo_title && <p className="text-sm text-destructive">{errors.seo_title.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seo_description">SEO описание <span className="text-destructive">*</span></Label>
                        <Textarea
                          id="seo_description"
                          {...register("seo_description")}
                          placeholder="Описание для поисковых систем (150-160 символов)"
                          className={cn("resize-none", errors.seo_description && "border-destructive")}
                          rows={3}
                        />
                        {watchedValues.seo_description && (
                          <p className={cn("text-xs", (watchedValues.seo_description.length < 150 || watchedValues.seo_description.length > 160) ? "text-amber-500" : "text-green-600")}>
                            {watchedValues.seo_description.length}/160 символов
                            {watchedValues.seo_description.length >= 150 && watchedValues.seo_description.length <= 160 ? " ✓ Оптимально" : " (рекомендуется 150-160)"}
                          </p>
                        )}
                        {errors.seo_description && <p className="text-sm text-destructive">{errors.seo_description.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>SEO ключевые слова <span className="text-destructive">*</span></Label>
                        <Controller
                          name="seo_keywords"
                          control={control}
                          render={({ field }) => (
                            <KeywordsInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Введите ключевое слово и нажмите Enter"
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">Нажмите Enter или запятую для добавления. Backspace для удаления последнего.</p>
                        {errors.seo_keywords && <p className="text-sm text-destructive">{errors.seo_keywords.message}</p>}
                      </div>

                      {/* SEO Preview */}
                      {(watchedValues.seo_title || watchedValues.seo_description) && (
                        <div className="rounded-lg border p-4 space-y-1 bg-white">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Предпросмотр в поиске</p>
                          <p className="text-blue-600 text-lg hover:underline cursor-pointer leading-tight">
                            {watchedValues.seo_title || "Заголовок страницы"}
                          </p>
                          <p className="text-green-700 text-sm">tablecrm.com/products/...</p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {watchedValues.seo_description || "Описание страницы будет показано здесь"}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("pricing")}>Назад</Button>
                    <Button type="button" onClick={() => setActiveTab("location")} className="gap-2">
                      Далее: Адрес <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Location */}
              <TabsContent value="location">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Адрес и координаты
                      </CardTitle>
                      <CardDescription>Укажите местонахождение товара или продавца</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="address">Адрес <span className="text-destructive">*</span></Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGetLocation}
                            className="gap-1.5 h-7 text-xs"
                          >
                            <MapPin className="h-3 w-3" />
                            Моё местоположение
                          </Button>
                        </div>
                        <Input
                          id="address"
                          {...register("address")}
                          placeholder="Например: ул. Пушкина, д. 10, Москва, Россия, 101000"
                          className={cn(errors.address && "border-destructive")}
                        />
                        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitude">Широта</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="any"
                            {...register("latitude", { valueAsNumber: true })}
                            placeholder="55.7558"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitude">Долгота</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="any"
                            {...register("longitude", { valueAsNumber: true })}
                            placeholder="37.6173"
                          />
                        </div>
                      </div>

                      {watchedValues.latitude && watchedValues.longitude && (
                        <div className="rounded-lg bg-muted p-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Координаты: {watchedValues.latitude.toFixed(6)}, {watchedValues.longitude.toFixed(6)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Final Summary */}
                  <Card className="border-green-200 bg-green-50/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-green-900">Готово к публикации</p>
                          <p className="text-sm text-green-700 mt-1">Форма заполнена на {progress}%. Нажмите кнопку выше для создания товара.</p>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(tabStatus).map(([tab, ok]) => (
                              <div key={tab} className={cn("flex items-center gap-1", ok ? "text-green-700" : "text-amber-600")}>
                                {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                <span>{{ basic: "Основное", category: "Категория", pricing: "Цена", seo: "SEO", location: "Адрес" }[tab]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("seo")}>Назад</Button>
                    <Button type="submit" disabled={isSubmitting || submitSuccess} className="gap-2" size="lg">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submitSuccess ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      {isSubmitting ? "Создаём товар..." : submitSuccess ? "Товар создан!" : "Создать карточку товара"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </div>
    </TooltipProvider>
  )
}
