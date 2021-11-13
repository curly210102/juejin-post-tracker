import { IArticle } from "@/types/article";
import { RequestError } from "./error";

export function fetchData({ url = "", userId = "", data = {} }): Promise<{
  [key: string]: any;
}> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "POST",
      url,
      data: JSON.stringify({
        user_id: userId,
        ...data,
      }),
      responseType: "json",
      headers: {
        "User-agent": window.navigator.userAgent,
        "content-type": "application/json",
        origin: "",
      },
      onload: function ({ status, response }) {
        if (status === 200) {
          resolve(response);
        } else {
          console.log("响应体", response);
          reject(
            new RequestError(
              `响应错误：状态码 ${status}`,
              `响应错误：状态码 ${status}，具体信息请见控制台`
            )
          );
        }
      },
      onabort: function () {
        reject(new RequestError("请求中断"));
      },
      onerror: function () {
        reject(new RequestError("请求发送失败"));
      },
      ontimeout: function () {
        reject(new RequestError(`请求超时`));
      },
    });
  });
}

export async function fetchArticleList(
  userId: string,
  startTimeStamp: number,
  endTimeStamp: number,
  requestData = {}
) {
  return await request();

  async function request(
    cursor = "0",
    articles: IArticle[] = []
  ): Promise<IArticle[]> {
    return fetchData({
      url: "https://api.juejin.cn/content_api/v1/article/query_list",
      userId,
      data: { sort_type: 2, cursor, ...requestData },
    }).then(({ data, has_more, cursor, count }) => {
      let lastPublishTime = Infinity;
      if (data) {
        for (const article of data) {
          const { article_id, article_info, category, user_interact } = article;
          // 文章字数、内容、发布时间、评论、点赞、收藏、阅读数
          const {
            ctime,
            mtime,
            audit_status,
            verify_status,
            view_count,
            collect_count,
            digg_count,
            comment_count,
            title,
          } = article_info;
          const { category_name } = category;
          const publishTime = new Date(ctime * 1000).valueOf();
          const modifiedTime = new Date(mtime * 1000).valueOf();
          const verify =
            verify_status === 0
              ? 0
              : audit_status === 2 && verify_status === 1
              ? 1
              : 2;
          if (
            publishTime >= startTimeStamp &&
            publishTime <= endTimeStamp &&
            verify !== 2
          ) {
            articles.push({
              category: category_name,
              id: article_id,
              publishTime,
              modifiedTime,
              view_count,
              collect_count,
              digg_count: digg_count - (user_interact.is_digg ? 1 : 0),
              comment_count,
              title,
            });
          }
        }
      }

      if (
        lastPublishTime > startTimeStamp &&
        has_more &&
        count !== parseInt(cursor, 10)
      ) {
        return request(cursor, articles);
      } else {
        return articles;
      }
    });
  }
}

export async function fetchArticleDetail(articleId: string) {
  return await fetchData({
    url: "https://api.juejin.cn/content_api/v1/article/detail",
    data: {
      article_id: articleId,
    },
  });
}
