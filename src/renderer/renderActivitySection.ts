import { TypeArticle, TypeInvalidSummary } from "@/types/article";
import { profileRenderer } from "./profile";
import activityData from "@/activity.json";
import styles from "./activity.module.css";
import { getFromStorage, saveToStorage } from "@/utils/storage";

type Props = {
  efficientArticles: TypeArticle[];
  invalidSummaries: TypeInvalidSummary[];
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
export default ({
  efficientArticles,
  dayCount,
  totalCount,
  invalidSummaries,
}: Props) => {
  const articleCount = efficientArticles.length;
  const containerEl = $("<div>");

  containerEl.append(renderStreak(articleCount, dayCount));
  if (invalidSummaries.length > 0) {
    containerEl.append(renderWarning(invalidSummaries));
  }
  activityData.rules.forEach((rule) => {
    containerEl.append(renderOneRule(rule, articleCount, dayCount));
  });
  containerEl.append(renderStatistics(totalCount));
  containerEl.append(renderEncourage());

  profileRenderer.add({
    key: activityData.key,
    title: activityData.title,
    link: activityData.docLink,
    startTime: activityData.startTimeStamp,
    endTime: activityData.endTimeStamp,
    node: containerEl[0],
  });
};

const InvalidStatus2Text = {
  time_range: "不在活动时间内",
  category_range: "不在限定分类内",
  word_count: "未达字数",
  slogan_fit: "暗号文本不符",
  link_fit: "暗号链接不符",
};

const renderWarning = (invalidSummaries: TypeInvalidSummary[]) => {
  const popup = $("<div>", { class: styles.warningPopup });
  const trigger = $("<a>", { class: styles.textGray600 }).text(
    `${invalidSummaries.length} 篇`
  );
  const text = $("<p>", { class: styles.textGray300 }).append(
    "⚠️ 有",
    trigger,
    "文章未参加活动"
  );
  const panel = $("<div>").addClass(styles.warningPanel);
  trigger.on("click", (e) => {
    e.stopPropagation();
    panel.toggleClass(styles.show);
  });

  document.body.addEventListener("click", () => {
    panel.removeClass(styles.show);
  });

  const list = $("<table>");
  panel.append(list);
  invalidSummaries.forEach(({ id, title, status }) => {
    list.append(
      `<tr><td><a href="https://juejin.cn/post/${id}" target="_blank" onclick="event.stopPropagation()">${title}</a></td><td>${InvalidStatus2Text[status]}</td></tr>`
    );
  });

  popup.append(text);
  popup.append(panel);

  return popup;
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
      const { name, days = 0, count = 0 } = rewards[0];
      containerEl.append(
        renderProgress(
          name!,
          Math.min(1, dayCount / Math.max(1, days)) *
            Math.min(articleCount / Math.max(1, count), 1)
        )
      );
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
            .text(nextRuleText ? `目标：更文 ${nextRuleText}` : "")
        );

      containerEl.append(nextRewardEl);
    }

    if (currentReward?.text) {
      containerEl.append($("<p>").text(currentReward?.text));
    }
  } else {
    const reward = rewards[0];
    const { name, count = 0, days = 0, text } = reward;
    if (name) {
      containerEl.append(
        renderProgress(
          name,
          Math.min(1, dayCount / Math.max(1, days)) *
            Math.min(articleCount / Math.max(1, count), 1)
        )
      );
    }

    if (text) {
      containerEl.append(
        $("<p>", { class: styles["text-gray-300"] })
          .addClass(styles.textCenter)
          .text(text)
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

function renderEncourage() {
  const containerEl = $("<section>");

  const $header = $("<header>").addClass(styles["encourageHeader"]);
  containerEl.append(
    $header.append($("<h3>").addClass(styles["text-gray-600"]).text("我的目标"))
  );

  const storageName = "post_target";
  const writtenTarget = getFromStorage(storageName);
  const $targetPreview = $("<p>")
    .addClass(styles["encouragePreview"])
    .text(writtenTarget ?? "从简单文章开始练习，一步一步养成写作习惯");
  containerEl.append($targetPreview);

  if (!writtenTarget) {
    const $actionBtn = $("<a>").text("设定");
    const $targetEditor = ($("<textarea>") as JQuery<HTMLTextAreaElement>)
      .addClass(styles["encourageEditor"])
      .attr("placeholder", "设定目标，回车确定");

    function submitNewTarget() {
      const newTarget = $targetEditor.val()?.toString().trim();

      if (newTarget) {
        const confirmed = confirm(`确认设定目标: ${newTarget}`);
        if (confirmed) {
          saveToStorage(storageName, newTarget);
          $targetPreview.text(newTarget);
          $targetEditor.remove();
          $actionBtn.remove();
        }
      }
      $targetEditor.hide();
      $targetPreview.show();
    }
    function quitNewTarget() {
      const newTarget = $targetEditor.val()?.toString().trim();
      console.log(newTarget);
      if (!newTarget || confirm(`确认放弃编辑？`)) {
        $targetEditor.val("").hide();
        $targetPreview.show();
      } else {
        $targetEditor.trigger("focus");
      }
    }
    $targetEditor.on("keydown", (event) => {
      if (event.key == "Enter") {
        event.preventDefault();
        submitNewTarget();
      } else if (event.key == "Escape") {
        event.preventDefault();
        quitNewTarget();
      }
    });
    $targetEditor.on("blur", () => {
      $targetEditor.hide();
      $targetPreview.show();
    });
    $targetEditor.hide();
    containerEl.append($targetEditor);

    $actionBtn.on("click", () => {
      $targetPreview.hide();
      $targetEditor.show();
      $targetEditor.trigger("focus");
    });
    $header.append($actionBtn);
  }

  return containerEl[0];
}
