import { getUserIdFromPathName } from "./router";

const user = {
  id: "",
};

export function getUserId() {
  return user.id;
}

export function setUserId(userId: string) {
  user.id = userId;
}

export function updateUserId() {
  const userProfileEl = document.querySelector(
    ".user-dropdown-list > .nav-menu-item-group:nth-child(2) > .nav-menu-item > a[href]"
  );
  const userId = getUserIdFromPathName(
    userProfileEl?.getAttribute("href") ?? ""
  );

  if (!userId) {
    return;
  }

  setUserId(userId);
}
