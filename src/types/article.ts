export interface IArticle {
  category: string;
  id: string;
  publishTime: number;
  modifiedTime: number;
  view_count: number;
  collect_count: number;
  digg_count: number;
  comment_count: number;
}

export interface IArticleContentItem {
  count: number;
  modifiedTimeStamp: number;
  isFit: boolean;
}

export type TypeArticle = IArticle &
  Pick<IArticleContentItem, "count" | "isFit">;
