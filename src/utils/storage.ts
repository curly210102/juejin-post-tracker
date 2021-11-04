import metaData from "../meta.json";
const extensionSlug = metaData["@name"];

export const initStorage = (
  name: string,
  version: number,
  defaultValue: any
) => {
  const versionPath = `${name}/version`;
  if (getFromStorage(versionPath, 0) < version) {
    saveToStorage(name, defaultValue);
    saveToStorage(versionPath, version);
    return defaultValue;
  } else {
    return getFromStorage(name) ?? defaultValue;
  }
};

export const saveToStorage = (name: string, value: any) => {
  GM_setValue(`${extensionSlug}/${name}`, value);
};

export const getFromStorage = (name: string, defaultValue?: any) => {
  return GM_getValue(`${extensionSlug}/${name}`, defaultValue);
};
