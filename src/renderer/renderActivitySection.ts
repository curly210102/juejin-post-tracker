import { TypeArticle } from "@/types/article";
import { profileRenderer } from "./profile";
import activityData from "@/activity.json";
import styles from "./activity.module.css";

type Props = {
  efficientArticles: TypeArticle[];
  dayCount: number;
  totalCount: Record<"view" | "comment" | "digg" | "collect", number>;
};

interface IRule {
  title: string;
  rewards: {
    name?: string;
    count?: number;
    days?: number;
    text?: string;
  }[];
}
export default ({ efficientArticles, dayCount, totalCount }: Props) => {
  const articleCount = efficientArticles.length;
  const containerEl = $("<div>");

  containerEl.append(renderStreak(articleCount, dayCount));
  activityData.rules.forEach((rule) => {
    containerEl.append(renderOneRule(rule, articleCount, dayCount));
  });
  containerEl.append(renderStatistics(totalCount));

  profileRenderer.add({
    key: activityData.key,
    title: activityData.title,
    link: activityData.docLink,
    startTime: activityData.startTimeStamp,
    endTime: activityData.endTimeStamp,
    node: containerEl[0],
  });
};

const renderOneRule = (
  { rewards }: IRule,
  articleCount: number,
  dayCount: number
) => {
  const isLadder = rewards.length > 1;
  const containerEl = $("<p>");
  // 当前奖励
  // 下一等级
  // 说明
  if (isLadder) {
    const maxLevel = rewards.length;
    let level = -1;
    for (let i = 0; i < maxLevel; i++) {
      const { count = 0, days = 0 } = rewards[i];
      if (dayCount >= days && articleCount >= count) level = i;
      else break;
    }

    const currentReward = rewards[level];
    const nextReward = rewards[level + 1];
    if (currentReward) {
      containerEl.append(renderProgress(currentReward.name!, 1));
    } else {
      containerEl.append(renderProgress(rewards[0].name!, 0));
    }

    if (nextReward) {
      const { count, days, name } = nextReward;
      const nextRuleText = [
        days ? `${days} 天` : "",
        count ? `${count} 篇` : "",
      ]
        .filter(Boolean)
        .join("，");
      const nextRewardEl = $("<p>", { class: styles.flex })
        .append(
          $("<div>", { class: styles["text-gray-600"] })
            .addClass(styles.item)
            .text(`下一等级：${name}`)
        )
        .append(
          $("<div>", { class: styles["text-gray-300"] })
            .addClass(styles.item)
            .text(nextRuleText ? `需要更文 ${nextRuleText}` : "")
        );

      containerEl.append(nextRewardEl);
    }

    if (currentReward?.text) {
      containerEl.append($("<p>").text(currentReward?.text));
    }
  } else {
    const reward = rewards[0];
    const { name, count = 0, days = 0, text } = reward;
    const isPassed = articleCount > count && dayCount > days;
    if (name) {
      containerEl.append(
        renderProgress(
          name,
          Math.min(1, dayCount / Math.max(1, days)) *
            Math.min(articleCount / Math.max(1, count), 1)
        )
      );
    }

    if (text && isPassed) {
      containerEl.append(
        $("<p>", { class: styles["text-gray-600"] }).text(text)
      );
    }
  }

  return containerEl[0];
};

const renderProgress = (text: string, progress: number) => {
  return $("<div>")
    .addClass(styles.progress)
    .append($("<i>").text(text))
    .css("--progress", progress);
};

const renderStreak = (articleCount: number, dayCount: number) => {
  const containerEl = $("<p>").addClass(styles.flex);

  containerEl.append(
    $("<div>")
      .addClass(styles.item)
      .addClass(styles.streakItem)
      .text(`${articleCount}`)
      .append($("<span>").text("篇").addClass(styles["text-gray-300"]))
  );
  containerEl.append(
    $("<div>")
      .addClass(styles.item)
      .addClass(styles.streakItem)
      .text(`${dayCount}`)
      .append($("<span>").text("天").addClass(styles["text-gray-300"]))
  );

  return containerEl[0];
};

const renderStatistics = (totalCount: Props["totalCount"]) => {
  type TypeKey = keyof typeof totalCount;
  const countLocale: Record<TypeKey, string> = {
    view: "阅读量",
    comment: "评论量",
    digg: "点赞",
    collect: "收藏",
  };
  const containerEl = $("<p>")
    .addClass(styles.statistics)
    .addClass(styles.flex);

  Object.entries(totalCount).forEach(([key, count]) => {
    const itemEl = $("<div>").addClass(styles.item);
    const countEl = $("<div>").addClass(styles.count).text(`${count}`);
    const hintEl = $("<div>")
      .addClass(styles.hint)
      .addClass(styles["text-gray-300"])
      .text(`${countLocale[key as TypeKey]}`);

    itemEl.append(countEl).append(hintEl);
    containerEl.append(itemEl);
  });
  return containerEl[0];
};
