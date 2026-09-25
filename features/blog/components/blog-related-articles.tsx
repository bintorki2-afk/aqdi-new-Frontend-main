import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";

export type RelatedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
};

type BlogRelatedArticlesProps = {
  title: string;
  readMoreLabel: string;
  articles: RelatedArticle[];
};

// Internal linking for SEO + reader engagement: 3 related articles after the body.
export default function BlogRelatedArticles({
  title,
  readMoreLabel,
  articles,
}: BlogRelatedArticlesProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5 border-t border-border/60 pt-8">
      <h2 className="text-2xl font-extrabold text-brand">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group flex flex-col gap-2 rounded-2xl border border-border/60 p-5 transition-colors hover:border-brand/40"
          >
            <span className="text-xs font-bold text-brand-secondary">
              {article.category}
            </span>
            <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-brand">
              {article.title}
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-foreground/70">
              {article.excerpt}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand">
              {readMoreLabel}
              <ArrowUpLeft className="size-3.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
