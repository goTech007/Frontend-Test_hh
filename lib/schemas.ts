import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Название товара обязательно"),
  type: z.string().default("product"),
  description_short: z.string().min(1, "Краткое описание обязательно"),
  description_long: z.string().min(1, "Полное описание обязательно"),
  code: z.string().min(1, "Артикул обязателен"),
  unit: z.number().default(116),
  category: z.number().default(2477),
  cashback_type: z.string().default("lcard_cashback"),
  seo_title: z.string().min(1, "SEO заголовок обязателен"),
  seo_description: z.string().min(1, "SEO описание обязательно"),
  seo_keywords: z.array(z.string()).min(1, "Добавьте хотя бы одно ключевое слово"),
  global_category_id: z.number().default(127),
  marketplace_price: z.number().min(0, "Цена должна быть положительной"),
  chatting_percent: z.number().min(0).max(100),
  address: z.string().min(1, "Адрес обязателен"),
  latitude: z.number(),
  longitude: z.number(),
});

export type ProductFormData = z.infer<typeof productSchema>;
