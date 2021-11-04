import { RequestError } from "@/utils/error";
import { profileRenderer } from "./profile";

export default function (error: Error) {
  if (error instanceof RequestError) {
    const node = $("<div>").html(`<p>${error.text}</p>`)[0];
    profileRenderer.add({ key: "error", node, title: "请求错误" });
  } else {
    const node = $("<div>").html(
      `<p>发现一个 Bug！<a href='https://juejin.cn/post/7014067898784169991'>反馈</a>给开发人员</p>`
    )[0];
    profileRenderer.add({ key: "error", node, title: "处理错误" });
  }
}
