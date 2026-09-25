export const BLOG_POST_IMAGE = "/images/blog.jpg";

export const BLOG_COMMENT_USER_IMAGE = "/images/user.jpg";

export const BLOG_POST_SLUG = "property-data-management";

export const BLOG_LIST_ITEMS_COUNT = 3;

export const BLOG_GRID_PAGE_SIZE = 9;

export const BLOG_GRID_TOTAL_POSTS = 45;

export const BLOG_GRID_TOTAL_PAGES = 5;

export const BLOG_TAB_CONFIG = [
  { id: "all", labelKey: "all" },
  { id: "property-management", labelKey: "propertyManagement" },
  { id: "contracts", labelKey: "contracts" },
  { id: "real-estate-market", labelKey: "realEstateMarket" },
] as const;

export const BLOG_POST_CATEGORY_ROTATION = [
  "property-management",
  "contracts",
  "real-estate-market",
] as const;

// Maps an article's categoryId to the i18n tab label key under `blog.listing.tabs`.
export const ARTICLE_CATEGORY_LABEL_KEY = {
  "property-management": "propertyManagement",
  contracts: "contracts",
  "real-estate-market": "realEstateMarket",
} as const;
