import { getLocale, getTranslations } from "next-intl/server";

import BlogListingLayout from "@/features/blog/components/blog-listing-layout";
import { ARTICLE_CATEGORY_LABEL_KEY } from "@/features/blog/data/blog-post-config";
import { getAllArticles } from "@/features/blog/data/get-articles";
import type { Article } from "@/features/blog/types/article";
import type { BlogListingLabels } from "@/features/blog/types/blog-listing-labels";
import type { BlogGridPost } from "@/features/blog/types/blog-post";
import { formatArticleDate } from "@/features/blog/utils/format-article-date";

export default async function BlogListingSection() {
  const t = await getTranslations("blog.listing");
  const tabsT = await getTranslations("blog.listing.tabs");
  const locale = await getLocale();

  const articles = await getAllArticles();

  const categoryCounts = articles.reduce<Record<string, number>>(
    (counts, article) => {
      counts[article.categoryId] = (counts[article.categoryId] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const baseCategoryItems = t.raw(
    "sidebar.categories.items",
  ) as BlogListingLabels["sidebar"]["categories"]["items"];

  // Reflect real article counts for the categories the store actually uses;
  // leave the other (static) categories untouched.
  const categoryItems = baseCategoryItems.map((item) =>
    item.id in categoryCounts
      ? { ...item, count: String(categoryCounts[item.id]) }
      : item,
  );

  const labels: BlogListingLabels = {
    tabs: {
      all: t("tabs.all"),
      propertyManagement: t("tabs.propertyManagement"),
      contracts: t("tabs.contracts"),
      realEstateMarket: t("tabs.realEstateMarket"),
    },
    sidebar: {
      stats: {
        title: t("sidebar.stats.title"),
        subtitle: t("sidebar.stats.subtitle"),
        description: t("sidebar.stats.description"),
        statsHeading: t("sidebar.stats.statsHeading"),
        logoAlt: t("sidebar.stats.logoAlt"),
        activeUsers: t("sidebar.stats.activeUsers"),
        activeUsersLabel: t("sidebar.stats.activeUsersLabel"),
        annualContracts: t("sidebar.stats.annualContracts"),
        annualContractsLabel: t("sidebar.stats.annualContractsLabel"),
        leasedUnits: t("sidebar.stats.leasedUnits"),
        leasedUnitsLabel: t("sidebar.stats.leasedUnitsLabel"),
      },
      categories: {
        title: t("sidebar.categories.title"),
        items: categoryItems,
      },
      tags: {
        title: t("sidebar.tags.title"),
        items: t.raw("sidebar.tags.items") as string[],
      },
      newsletter: {
        badge: t("sidebar.newsletter.badge"),
        title: t("sidebar.newsletter.title"),
        description: t("sidebar.newsletter.description"),
        placeholder: t("sidebar.newsletter.placeholder"),
        subscribe: t("sidebar.newsletter.subscribe"),
        submitEmailLabel: t("sidebar.newsletter.submitEmailLabel"),
      },
    },
    post: {
      listCategory: t("post.listCategory"),
      listTitle: t("post.listTitle"),
      date: t("post.date"),
      readTime: t("post.readTime"),
      views: t("post.views"),
      readMore: t("post.readMore"),
    },
    pagination: {
      previous: t("pagination.previous"),
      next: t("pagination.next"),
    },
  };

  const toGridPost = (article: Article): BlogGridPost => {
    const categoryLabel = tabsT(ARTICLE_CATEGORY_LABEL_KEY[article.categoryId]);

    return {
      slug: article.slug,
      imageSrc: article.coverImage,
      featuredCategory: categoryLabel,
      featuredTitle: article.title,
      listCategory: categoryLabel,
      listTitle: article.title,
      description: article.excerpt,
      date: formatArticleDate(article.date, locale),
      readTime: article.readTime,
      categoryId: article.categoryId,
    };
  };

  const posts = articles.map(toGridPost);

  return (
    <section className=" py-12 md:py-16">
      <div className="container">
        <BlogListingLayout labels={labels} posts={posts} />
      </div>
    </section>
  );
}
