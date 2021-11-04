import { fetchArticleDetail, fetchArticleList } from "./utils/fetch";
import { inSelfProfilePage } from "./utils/router";
import { getUserId, updateUserId } from "./utils/user";
import activityData from "./activity.json";
import nm from "nomatter";
import { countWords } from "@homegrown/word-counter";
import { initStorage, saveToStorage } from "./utils/storage";
import renderErrorMessage from "./renderer/renderErrorMessage";
import render from "./renderer/renderActivitySection";
import { TypeArticle, IArticleContentItem } from "./types/article";

const articleStoragePath = `juejin-post-tracker/article_contents`;
const articleContentMap = new Map<string, IArticleContentItem>(
  Object.entries(initStorage(articleStoragePath, 1, []))
);

async function fetch(userId: string) {
  const { startTimeStamp, endTimeStamp, categories, signSlogan, signLink } =
    activityData;
  const articleList = await fetchArticleList(
    userId,
    startTimeStamp,
    endTimeStamp,
    new Set(categories)
  );
  const articleDetails = await Promise.all(
    articleList
      .filter(({ id, modifiedTime }) => {
        return (
          !articleContentMap.has(id) ||
          articleContentMap.get(id)?.["modifiedTimeStamp"] !==
            modifiedTime.valueOf()
        );
      })
      .map(({ id }) => fetchArticleDetail(id))
  );
  articleDetails.forEach(({ data }) => {
    const { article_info } = data;
    const { article_id, mark_content, mtime } = article_info;
    const content = nm(mark_content).trim();
    articleContentMap.set(article_id, {
      isFit:
        content.includes(signSlogan) &&
        new RegExp(`${signLink}((?:\/|$)?)`).test(content),
      count: countWords(mark_content),
      modifiedTimeStamp: mtime * 1000,
    });
  });

  saveToStorage(articleStoragePath, Object.fromEntries(articleContentMap));

  return articleList.map((article) => {
    const contentInfo = articleContentMap.get(article.id);
    return {
      ...article,
      isFit: contentInfo?.isFit ?? false,
      count: contentInfo?.count ?? 0,
    };
  });
}

function statistics(articles: TypeArticle[]) {
  const { startTimeStamp, wordCount, categories } = activityData;

  const efficientArticles = articles.filter((article) => {
    return (
      article.publishTime > startTimeStamp &&
      categories.includes(article.category) &&
      article.count >= wordCount &&
      article.isFit
    );
  });
  const publishTimeGroup: number[] = [];
  const totalCount = {
    view: 0,
    digg: 0,
    comment: 0,
    collect: 0,
  };
  efficientArticles.forEach(
    ({ publishTime, view_count, digg_count, comment_count, collect_count }) => {
      const day = Math.floor(
        (publishTime - startTimeStamp) / (24 * 60 * 60 * 1000)
      );
      publishTimeGroup[day] = (publishTimeGroup[day] ?? 0) + 1;
      totalCount.view += view_count;
      totalCount.digg += digg_count;
      totalCount.collect += collect_count;
      totalCount.comment += comment_count;
    }
  );
  const dayCount = publishTimeGroup.filter(Boolean).length;

  return {
    totalCount,
    dayCount,
    efficientArticles,
  };
}

const plugin = {
  onLoaded() {
    updateUserId();
  },
  async onRouteChange(
    prevRouterPathname: string,
    currentRouterPathname: string
  ) {
    if (
      !inSelfProfilePage(prevRouterPathname) &&
      inSelfProfilePage(currentRouterPathname)
    ) {
      try {
        const articles = await fetch(getUserId());
        const stats = statistics(articles);
        render(stats);
      } catch (error) {
        if (error instanceof Error) {
          renderErrorMessage(error);
        } else {
          console.log(error);
        }
      }
    }
  },
};

export default plugin;
