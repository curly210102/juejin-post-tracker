import { getUserId } from "./user";

export const inPinPage = (pathname: string) => {
  return /^\/pins(?:\/|$)/.test(pathname);
};

export const inSelfProfilePage = (pathname: string) => {
  return new RegExp(`^\\/user\\/${getUserId()}(?:\\/|$)`).test(pathname);
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
