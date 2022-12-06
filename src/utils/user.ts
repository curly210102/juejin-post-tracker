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

  return new Promise((resolve) => {
    const menuEl = document.querySelector("#juejin > div.view-container > div > header > div > nav > ul > ul > li.nav-item.menu");
    if (menuEl) {
      const observer = new MutationObserver(() => {
        const userProfileEl = menuEl.querySelector("div.drop-down-menu.light-shadow > div.user-card > div > div.user-detail > a.username");
  
        if (userProfileEl) {
          const userId = getUserIdFromPathName(userProfileEl?.getAttribute("href") ?? "");
          if (!userId) {
            return;
          }
          setUserId(userId);
          document.body.click();
          observer.disconnect();
          resolve(userId);
        }
      });
      observer.observe(menuEl, { childList: true });
      
      const avatarEl = menuEl.querySelector("div.avatar-wrapper");
      if (avatarEl) {
        if (avatarEl.childElementCount !== 0 || (avatarEl).textContent?.trim() !== "") {
          setTimeout(() => {
            (<HTMLElement>avatarEl).click();
          }, 1000);
        } else {
          const observer = new MutationObserver(() => {
            (<HTMLElement>avatarEl).click();
            observer.disconnect();
          });
          observer.observe(avatarEl, {childList: true});
        }
        
      }
    }
  })
}
