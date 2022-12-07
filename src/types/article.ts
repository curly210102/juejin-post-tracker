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
  tags: {
    tag_id: string;
    tag_name: string;
  }[]
}

export interface IArticleContentItem {
  count: number;
  modifiedTimeStamp: number;
  sloganFit: boolean;
  linkFit: boolean;
  tagFit?: boolean;
}

export type TypeArticle = IArticle &
  Pick<IArticleContentItem, "count" | "sloganFit" | "linkFit" | "tagFit">;

export type TypeInvalidSummary = {
  id: string;
  title: string;
  status:
    | "time_range"
    | "category_range"
    | "word_count"
    | "slogan_fit"
    | "link_fit"
    | "tag_fit";
};
