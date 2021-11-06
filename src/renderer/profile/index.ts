import { getFromStorage, saveToStorage } from "@/utils/storage";
import styles from "./style.module.css";

export const formatDate = (dateInstance: Date, format: string) => {
  const year = dateInstance.getFullYear();
  const month = dateInstance.getMonth() + 1;
  const date = dateInstance.getDate();

  return format
    .replaceAll("YYYY", year.toString())
    .replaceAll("MM", `${month}`.padStart(2, "0"))
    .replaceAll("DD", `${date}`.padStart(2, "0"))
    .replaceAll("M", month.toString())
    .replaceAll("D", date.toString());
};

export interface IProfileRenderData {
  key: string;
  node: HTMLElement;
  title: string;
  link?: string;
  startTime?: number;
  endTime?: number;
}
class ProfileRenderer {
  private renderId: string = Math.random().toString(16).slice(2);
  private containerEl: JQuery<HTMLElement>;
  private mainEl: JQuery<HTMLElement>;
  private sectionData: IProfileRenderData[] = [];
  constructor() {
    const containerEl = $("<div>")
      .data("tampermonkey", this.renderId)
      .addClass(styles.block);

    const titleEl = $("<div>").addClass(styles.title).text("活动状态");
    titleEl.on("click", () => {
      const isHidden = !contentEl.is(":hidden");
      contentEl.toggle();
      saveToStorage("profile_stat_hidden", isHidden);
    });

    const contentEl = $("<div>").addClass(styles.content);
    if (getFromStorage("profile_stat_hidden", false)) {
      contentEl.hide();
    } else {
      contentEl.show();
    }

    containerEl.append(titleEl);
    containerEl.append(contentEl);
    this.containerEl = containerEl;
    this.mainEl = contentEl;
  }

  add(data: IProfileRenderData) {
    const now = new Date().valueOf();
    const { key, node, title, link, startTime, endTime } = data;
    const dateText =
      startTime && endTime
        ? `${formatDate(new Date(startTime), "MM/DD")} - ${formatDate(
            new Date(endTime),
            "MM/DD"
          )}`
        : "";

    const headerEl = $("<h3>", { class: styles.header }).html(
      `<a href="${link}" target="__blank">${title}</a> <span>${dateText}</span>`
    );

    const sectionEl = $("<div>")
      .addClass(styles.section)
      .append(headerEl)
      .append(node);

    data.node = sectionEl[0];

    this.sectionData = this.sectionData
      .filter((section) => section.key !== key)
      .concat([data])
      .sort((a, b) => {
        const isFinishA = (a.endTime ?? 0) > now;
        const isFinishB = (b.endTime ?? 0) > now;

        if (isFinishA && !isFinishB) return -1;
        else if (isFinishB && !isFinishA) return 1;

        return (b.startTime ?? 0) - (a.startTime ?? 0);
      });

    this.render();
  }

  render() {
    this.mainEl.empty().append(this.sectionData.map(({ node }) => node));
    this.mount();
  }

  mount() {
    if (!this.containerEl.is(":visible")) {
      const parentEl = $(".user-view .sticky-wrap");
      if (!parentEl.length) {
        setTimeout(() => this.mount(), 1000);
        return;
      }

      parentEl.addClass(styles.profileSidebar);
      parentEl.find(`[data-tampermonkey=${this.renderId}]`).remove();

      const siblingEl = $(".user-view .follow-block");
      if (siblingEl.length) {
        siblingEl.after(this.containerEl);
      } else if (parentEl.length) {
        parentEl.append(this.containerEl);
      }
    }
  }
}

export const profileRenderer = new ProfileRenderer();
