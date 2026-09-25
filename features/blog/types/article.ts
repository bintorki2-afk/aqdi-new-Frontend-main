import type { BlogDetailSection } from "@/features/blog/types/blog-detail";

export type ArticleCategoryId =
  | "property-management"
  | "contracts"
  | "real-estate-market";

export type ArticleSource = { label: string; url: string };

export type Article = {
  slug: string;
  title: string;
  categoryId: ArticleCategoryId;
  date: string; // ISO date, e.g. "2026-09-20"
  readTime: string; // e.g. "٥ دقائق قراءة"
  excerpt: string;
  coverImage: string; // default "/images/blog.jpg"
  imageAlt: string;
  sections: BlogDetailSection[];
  sources?: ArticleSource[];
};
