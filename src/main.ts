import { fetchArticleDetail, fetchArticleList } from "./utils/fetch";
import { inSpecificProfilePage } from "./utils/router";
import { getUserId, updateUserId } from "./utils/user";
import activityData from "./activity.json";
import nm from "nomatter";
import { countWords } from "@homegrown/word-counter";
import { initStorage, saveToStorage } from "./utils/storage";
import renderErrorMessage from "./renderer/renderErrorMessage";
import render from "./renderer/renderActivitySection";
import {
  TypeArticle,
  IArticleContentItem,
  TypeInvalidSummary,
} from "./types/article";

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
          articleContentMap.get(id)?.["modifiedTimeStamp"] !== modifiedTime ||
          articleContentMap.get(id)?.["sloganFit"] === undefined
        );
      })
      .map(({ id }) => fetchArticleDetail(id))
  );
  articleDetails.forEach(({ data }) => {
    const { article_info } = data;
    const { article_id, mark_content, mtime } = article_info;
    const content = nm(mark_content).trim();
    articleContentMap.set(article_id, {
      sloganFit: content.includes(signSlogan),
      linkFit: new RegExp(`${signLink}((?:\/|$)?)`).test(content),
      count: countWords(mark_content),
      modifiedTimeStamp: mtime * 1000,
    });
  });

  saveToStorage(articleStoragePath, Object.fromEntries(articleContentMap));

  return articleList.map((article) => {
    const contentInfo = articleContentMap.get(article.id);
    return {
      ...article,
      sloganFit: contentInfo?.sloganFit ?? false,
      linkFit: contentInfo?.linkFit ?? false,
      count: contentInfo?.count ?? 0,
    };
  });
}

function statistics(articles: TypeArticle[]) {
  const { startTimeStamp, wordCount, categories } = activityData;

  const efficientArticles: TypeArticle[] = [];
  const invalidSummaries: TypeInvalidSummary[] = [];

  articles.forEach((article) => {
    const { id, title, publishTime, category, count, sloganFit, linkFit } =
      article;
    if (publishTime < startTimeStamp) {
      invalidSummaries.push({
        id,
        title,
        status: "time_range",
      });
      return;
    }

    if (!categories.includes(category)) {
      invalidSummaries.push({
        id,
        title,
        status: "category_range",
      });
      return;
    }

    if (count < wordCount) {
      invalidSummaries.push({
        id,
        title,
        status: "word_count",
      });
      return;
    }

    if (!sloganFit) {
      invalidSummaries.push({
        id,
        title,
        status: "slogan_fit",
      });
      return;
    }

    if (!linkFit) {
      invalidSummaries.push({
        id,
        title,
        status: "link_fit",
      });
      return;
    }

    efficientArticles.push(article);
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
    invalidSummaries,
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
    const myUserId = getUserId();
    if (
      !inSpecificProfilePage(prevRouterPathname, myUserId) &&
      inSpecificProfilePage(currentRouterPathname, myUserId)
    ) {
      try {
        const articles = await fetch(myUserId);
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
