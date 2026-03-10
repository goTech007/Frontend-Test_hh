"use client"

import * as React from "react"
import Link from "next/link"
import { Package, Plus, RefreshCw, Search, Tag, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Product {
  id?: number
  name: string
  type: string
  code: string
  description_short: string
  category: number
  marketplace_price: number
  address?: string
  seo_keywords?: string[]
}

const CATEGORY_NAMES: Record<number, string> = {
  2477: "Электроника",
  2478: "Одежда",
  2479: "Дом и сад",
  2480: "Спорт",
  2481: "Красота",
  2482: "Детские товары",
  2483: "Книги",
  2484: "Еда",
  2485: "Авто",
  2486: "Прочее",
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/products")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch")
      const list = json.data?.result ?? json.data
      setProducts(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { fetchProducts() }, [])

  // Reset to page 1 when search or page size changes
  React.useEffect(() => { setPage(1) }, [search, pageSize])

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.code?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const getPageNumbers = () => {
    const pages: (number | "…")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push("…")
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
      if (page < totalPages - 2) pages.push("…")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-none">Товары</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Маркетплейс TableCRM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Обновить
            </Button>
            <Link href="/">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить товар
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Search + page size */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию или артикулу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / стр.</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="mb-4 text-sm text-muted-foreground">
            {search
              ? <>Найдено: <span className="font-medium text-foreground">{filtered.length}</span> из {products.length}</>
              : <>Всего товаров: <span className="font-medium text-foreground">{products.length}</span></>
            }
            {filtered.length > 0 && (
              <span className="ml-2">
                · Показано {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="grid gap-4">
            {Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Товаров не найдено</p>
            {search ? (
              <p className="text-sm mt-1">Попробуйте изменить поисковый запрос</p>
            ) : (
              <Link href="/">
                <Button className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Создать первый товар
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Products */}
        <div className="grid gap-4">
          {!loading && paginated.map((product, i) => (
            <Card key={product.id ?? i} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate">{product.name || <span className="text-muted-foreground italic">Без названия</span>}</h3>
                      {product.marketplace_price > 0 && (
                        <span className="font-bold text-primary shrink-0">
                          {product.marketplace_price.toLocaleString("ru-RU")} ₽
                        </span>
                      )}
                    </div>
                    {product.description_short && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description_short}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {product.code && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Tag className="h-3 w-3" />
                          {product.code}
                        </Badge>
                      )}
                      {product.type && (
                        <Badge variant="secondary" className="text-xs capitalize">{product.type}</Badge>
                      )}
                      {product.category && CATEGORY_NAMES[product.category] && (
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_NAMES[product.category]}
                        </Badge>
                      )}
                      {product.address && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {product.address.split(",")[0]}
                        </span>
                      )}
                    </div>
                    {product.seo_keywords && product.seo_keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.seo_keywords.slice(0, 4).map((kw) => (
                          <span key={kw} className="text-xs bg-muted px-1.5 py-0.5 rounded">{kw}</span>
                        ))}
                        {product.seo_keywords.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{product.seo_keywords.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {getPageNumbers().map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  size="icon"
                  onClick={() => setPage(p)}
                  className="w-9 h-9"
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
