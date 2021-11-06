export interface IArticle {
  category: string;
  id: string;
  publishTime: number;
  modifiedTime: number;
  view_count: number;
  collect_count: number;
  digg_count: number;
  comment_count: number;
  title: string;
}

export interface IArticleContentItem {
  count: number;
  modifiedTimeStamp: number;
  sloganFit: boolean;
  linkFit: boolean;
}

export type TypeArticle = IArticle &
  Pick<IArticleContentItem, "count" | "sloganFit" | "linkFit">;

export type TypeInvalidSummary = {
  id: string;
  title: string;
  status:
    | "time_range"
    | "category_range"
    | "word_count"
    | "slogan_fit"
    | "link_fit";
};
