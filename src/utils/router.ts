export const inPinPage = (pathname: string) => {
  return /^\/pins(?:\/|$)/.test(pathname);
};

export const inSpecificProfilePage = (pathname: string, userId: string) => {
  return new RegExp(`^\\/user\\/${userId}(?:\\/|$)`).test(pathname);
};

export const inProfilePage = (pathname: string) => {
  return /\/user\/(\d+)(?:\/|$)/.test(pathname);
};

export const getUserIdFromPathName = (pathname: string) => {
  return pathname?.match(/\/user\/(\d+)(?:\/|$)/)?.[1];
};

export const inCreatorPage = (pathname: string) => {
  return /^\/creator(?:\/|$)/.test(pathname);
};
