
// ==UserScript==
// @name         juejin-post-tracker
// @namespace    juejin-post-tracker
// @version      0.1.0
// @include      *
// @run-at       document-end
// @require      tampermonkey://vendor/jquery.js
// @match        juejin.cn
// @connect      juejin.cn
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
(function () {
  'use strict';

  class RequestError extends Error {
    constructor(message, text) {
      super(message);
      this.text = text !== null && text !== void 0 ? text : message;
    }

  }

  function fetchData(_ref) {
    let {
      url = "",
      userId = "",
      data = {}
    } = _ref;
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url,
        data: JSON.stringify({
          user_id: userId,
          ...data
        }),
        responseType: "json",
        headers: {
          "User-agent": window.navigator.userAgent,
          "content-type": "application/json",
          origin: ""
        },
        onload: function (_ref2) {
          let {
            status,
            response
          } = _ref2;

          if (status === 200) {
            resolve(response);
          } else {
            console.log("响应体", response);
            reject(new RequestError(`响应错误：状态码 ${status}`, `响应错误：状态码 ${status}，具体信息请见控制台`));
          }
        },
        onabort: function () {
          reject(new RequestError("请求中断"));
        },
        onerror: function () {
          reject(new RequestError("请求发送失败"));
        },
        ontimeout: function () {
          reject(new RequestError(`请求超时`));
        }
      });
    });
  }
  async function fetchArticleList(userId, startTimeStamp, endTimeStamp) {
    let requestData = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    return await request();

    async function request() {
      let cursor = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "0";
      let articles = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      return fetchData({
        url: "https://api.juejin.cn/content_api/v1/article/query_list",
        userId,
        data: {
          sort_type: 2,
          cursor,
          ...requestData
        }
      }).then(_ref3 => {
        let {
          data,
          has_more,
          cursor,
          count
        } = _ref3;
        let lastPublishTime = Infinity;

        if (data) {
          for (const article of data) {
            const {
              article_id,
              article_info,
              category,
              user_interact,
              tags
            } = article; // 文章字数、内容、发布时间、评论、点赞、收藏、阅读数

            const {
              ctime,
              mtime,
              audit_status,
              verify_status,
              view_count,
              collect_count,
              digg_count,
              comment_count,
              title
            } = article_info;
            const {
              category_name
            } = category;
            const publishTime = new Date(ctime * 1000).valueOf();
            const modifiedTime = new Date(mtime * 1000).valueOf();
            const verify = verify_status === 0 ? 0 : audit_status === 2 && verify_status === 1 ? 1 : 2;

            if (publishTime >= startTimeStamp && publishTime <= endTimeStamp && verify !== 2) {
              articles.push({
                category: category_name,
                id: article_id,
                publishTime,
                modifiedTime,
                view_count,
                collect_count,
                digg_count: digg_count - (user_interact.is_digg ? 1 : 0),
                comment_count,
                title,
                tags
              });
            }
          }
        }

        if (lastPublishTime > startTimeStamp && has_more && count !== parseInt(cursor, 10)) {
          return request(cursor, articles);
        } else {
          return articles;
        }
      });
    }
  }
  async function fetchArticleDetail(articleId) {
    return await fetchData({
      url: "https://api.juejin.cn/content_api/v1/article/detail",
      data: {
        article_id: articleId
      }
    });
  }

  const inSpecificProfilePage = (pathname, userId) => {
    return new RegExp(`^\\/user\\/${userId}(?:\\/|$)`).test(pathname);
  };
  const getUserIdFromPathName = pathname => {
    var _pathname$match;

    return pathname === null || pathname === void 0 ? void 0 : (_pathname$match = pathname.match(/\/user\/(\d+)(?:\/|$)/)) === null || _pathname$match === void 0 ? void 0 : _pathname$match[1];
  };

  const user = {
    id: ""
  };
  function getUserId() {
    return user.id;
  }
  function setUserId(userId) {
    user.id = userId;
  }
  function updateUserId() {
    return new Promise(resolve => {
      const menuEl = document.querySelector("#juejin > div.view-container > div > header > div > nav > ul > ul > li.nav-item.menu");

      if (menuEl) {
        const observer = new MutationObserver(() => {
          const userProfileEl = menuEl.querySelector("div.drop-down-menu.light-shadow > div.user-card > div > div.user-detail > a.username");

          if (userProfileEl) {
            var _userProfileEl$getAtt;

            const userId = getUserIdFromPathName((_userProfileEl$getAtt = userProfileEl === null || userProfileEl === void 0 ? void 0 : userProfileEl.getAttribute("href")) !== null && _userProfileEl$getAtt !== void 0 ? _userProfileEl$getAtt : "");

            if (!userId) {
              return;
            }

            setUserId(userId);
            document.body.click();
            observer.disconnect();
            resolve(userId);
          }
        });
        observer.observe(menuEl, {
          childList: true
        });
        const avatarEl = menuEl.querySelector("div.avatar-wrapper");

        if (avatarEl) {
          var _avatarEl$textContent;

          if (avatarEl.childElementCount !== 0 || ((_avatarEl$textContent = avatarEl.textContent) === null || _avatarEl$textContent === void 0 ? void 0 : _avatarEl$textContent.trim()) !== "") {
            setTimeout(() => {
              avatarEl.click();
            }, 1000);
          } else {
            const observer = new MutationObserver(() => {
              avatarEl.click();
              observer.disconnect();
            });
            observer.observe(avatarEl, {
              childList: true
            });
          }
        }
      }
    });
  }

  var key = "2022DecPost";
  var title = "日新计划｜12月更文挑战";
  var desc = "限定：活动开始时创作等级为 Lv0-Lv3 的用户";
  var docLink = "https://juejin.cn/post/7167294154827890702";
  var categories = [
  	"前端",
  	"后端",
  	"Android",
  	"iOS",
  	"人工智能"
  ];
  var startTimeStamp = 1668960000000;
  var endTimeStamp = 1672502399999;
  var signSlogan = "开启掘金成长之旅！这是我参与「掘金日新计划 · 12 月更文挑战」的第\\d天";
  var signLink = "https://juejin.cn/post/7167294154827890702";
  var tagNames = [
  	"掘金·日新计划"
  ];
  var wordCount = 500;
  var rules = [
  	{
  		title: "进度追踪",
  		rewards: [
  			{
  				name: "第一关",
  				days: 7
  			},
  			{
  				name: "第二关",
  				days: 14
  			},
  			{
  				name: "第三关",
  				days: 21
  			},
  			{
  				name: "第四关",
  				days: 32
  			}
  		]
  	},
  	{
  		title: "「劳模」奖励",
  		rewards: [
  			{
  				name: "「劳模」奖励",
  				count: 45,
  				text: "更文天数不限，投稿累计 ≧ 45 篇"
  			}
  		]
  	}
  ];
  var activityData = {
  	key: key,
  	title: title,
  	desc: desc,
  	docLink: docLink,
  	categories: categories,
  	startTimeStamp: startTimeStamp,
  	endTimeStamp: endTimeStamp,
  	signSlogan: signSlogan,
  	signLink: signLink,
  	tagNames: tagNames,
  	wordCount: wordCount,
  	rules: rules
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function nomatter(content, { open = '---', close = open } = {}) {
    const openRE = new RegExp('^\\n*' + open + '\\n', 'g');
    const closeRE = new RegExp('\\n' + close + '(\\n\\s*|$)', 'g');

    let match = openRE.exec(content);
    if (match) {
      closeRE.lastIndex = openRE.lastIndex - 1;
      match = closeRE.exec(content);
      if (match) {
        return content.slice(closeRE.lastIndex);
      }
    }

    return content;
  }

  var nomatter_1 = nomatter;

  var dist = {};

  var emojiPattern = {};

  Object.defineProperty(emojiPattern, "__esModule", { value: true });
  emojiPattern.default = "\u{1F3F4}\u{E0067}\u{E0062}(?:\u{E0077}\u{E006C}\u{E0073}|\u{E0073}\u{E0063}\u{E0074}|\u{E0065}\u{E006E}\u{E0067})\u{E007F}|(?:\u{1F9D1}\u{1F3FF}\u200D\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D)?|\u200D(?:\u{1F48B}\u200D)?)\u{1F9D1}|\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}]|\u{1FAF1}\u{1F3FF}\u200D\u{1FAF2})[\u{1F3FB}-\u{1F3FE}]|(?:\u{1F9D1}\u{1F3FE}\u200D\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D)?|\u200D(?:\u{1F48B}\u200D)?)\u{1F9D1}|\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}]|\u{1FAF1}\u{1F3FE}\u200D\u{1FAF2})[\u{1F3FB}-\u{1F3FD}\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FD}\u200D\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D)?|\u200D(?:\u{1F48B}\u200D)?)\u{1F9D1}|\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}]|\u{1FAF1}\u{1F3FD}\u200D\u{1FAF2})[\u{1F3FB}\u{1F3FC}\u{1F3FE}\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FC}\u200D\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D)?|\u200D(?:\u{1F48B}\u200D)?)\u{1F9D1}|\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}]|\u{1FAF1}\u{1F3FC}\u200D\u{1FAF2})[\u{1F3FB}\u{1F3FD}-\u{1F3FF}]|(?:\u{1F9D1}\u{1F3FB}\u200D\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D)?|\u200D(?:\u{1F48B}\u200D)?)\u{1F9D1}|\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D[\u{1F468}\u{1F469}]|\u{1FAF1}\u{1F3FB}\u200D\u{1FAF2})[\u{1F3FC}-\u{1F3FF}]|\u{1F468}(?:\u{1F3FB}(?:\u200D(?:\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FF}]|\u{1F468}[\u{1F3FB}-\u{1F3FF}])|\u200D(?:\u{1F48B}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FF}]|\u{1F468}[\u{1F3FB}-\u{1F3FF}]))|\u{1F91D}\u200D\u{1F468}[\u{1F3FC}-\u{1F3FF}]|[\u2695\u2696\u2708]\uFE0F|[\u2695\u2696\u2708]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]))?|[\u{1F3FC}-\u{1F3FF}]\u200D\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FF}]|\u{1F468}[\u{1F3FB}-\u{1F3FF}])|\u200D(?:\u{1F48B}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FF}]|\u{1F468}[\u{1F3FB}-\u{1F3FF}]))|\u200D(?:\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D)?|\u200D(?:\u{1F48B}\u200D)?)\u{1F468}|[\u{1F468}\u{1F469}]\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FE}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FE}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}-\u{1F3FD}\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FD}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}\u{1F3FC}\u{1F3FE}\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FC}\u200D(?:\u{1F91D}\u200D\u{1F468}[\u{1F3FB}\u{1F3FD}-\u{1F3FF}]|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:[\u{1F468}\u{1F469}]\u200D[\u{1F466}\u{1F467}]|[\u{1F466}\u{1F467}])|\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FF}|\u{1F3FE}|\u{1F3FD}|\u{1F3FC}|\u200D[\u2695\u2696\u2708])?|(?:\u{1F469}(?:\u{1F3FB}\u200D\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}]))|[\u{1F3FC}-\u{1F3FF}]\u200D\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])))|\u{1F9D1}[\u{1F3FB}-\u{1F3FF}]\u200D\u{1F91D}\u200D\u{1F9D1})[\u{1F3FB}-\u{1F3FF}]|\u{1F469}\u200D\u{1F469}\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F469}(?:\u200D(?:\u2764(?:\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}]))|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FE}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FD}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FC}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FB}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F9D1}(?:\u200D(?:\u{1F91D}\u200D\u{1F9D1}|[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F3FF}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FE}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FD}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FC}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}]|\u{1F3FB}\u200D[\u{1F33E}\u{1F373}\u{1F37C}\u{1F384}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9AF}-\u{1F9B3}\u{1F9BC}\u{1F9BD}])|\u{1F469}\u200D\u{1F466}\u200D\u{1F466}|\u{1F469}\u200D\u{1F469}\u200D[\u{1F466}\u{1F467}]|\u{1F469}\u200D\u{1F467}\u200D[\u{1F466}\u{1F467}]|(?:\u{1F441}\uFE0F?\u200D\u{1F5E8}|\u{1F9D1}(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FB}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\u{1F469}(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FB}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\u{1F636}\u200D\u{1F32B}|\u{1F3F3}\uFE0F?\u200D\u26A7|\u{1F43B}\u200D\u2744|(?:[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u{1F46F}\u{1F9DE}\u{1F9DF}])\u200D[\u2640\u2642]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}](?:[\uFE0F\u{1F3FB}-\u{1F3FF}]\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\u{1F3F4}\u200D\u2620|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93C}-\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}]\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299\u{1F004}\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F202}\u{1F237}\u{1F321}\u{1F324}-\u{1F32C}\u{1F336}\u{1F37D}\u{1F396}\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}\u{1F39F}\u{1F3CD}\u{1F3CE}\u{1F3D4}-\u{1F3DF}\u{1F3F5}\u{1F3F7}\u{1F43F}\u{1F4FD}\u{1F549}\u{1F54A}\u{1F56F}\u{1F570}\u{1F573}\u{1F576}-\u{1F579}\u{1F587}\u{1F58A}-\u{1F58D}\u{1F5A5}\u{1F5A8}\u{1F5B1}\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}\u{1F6CB}\u{1F6CD}-\u{1F6CF}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6F0}\u{1F6F3}])\uFE0F|\u{1F441}\uFE0F?\u200D\u{1F5E8}|\u{1F9D1}(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FB}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\u{1F469}(?:\u{1F3FF}\u200D[\u2695\u2696\u2708]|\u{1F3FE}\u200D[\u2695\u2696\u2708]|\u{1F3FD}\u200D[\u2695\u2696\u2708]|\u{1F3FC}\u200D[\u2695\u2696\u2708]|\u{1F3FB}\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\u{1F3F3}\uFE0F?\u200D\u{1F308}|\u{1F469}\u200D\u{1F467}|\u{1F469}\u200D\u{1F466}|\u{1F636}\u200D\u{1F32B}|\u{1F3F3}\uFE0F?\u200D\u26A7|\u{1F635}\u200D\u{1F4AB}|\u{1F62E}\u200D\u{1F4A8}|\u{1F415}\u200D\u{1F9BA}|\u{1FAF1}(?:\u{1F3FF}|\u{1F3FE}|\u{1F3FD}|\u{1F3FC}|\u{1F3FB})?|\u{1F9D1}(?:\u{1F3FF}|\u{1F3FE}|\u{1F3FD}|\u{1F3FC}|\u{1F3FB})?|\u{1F469}(?:\u{1F3FF}|\u{1F3FE}|\u{1F3FD}|\u{1F3FC}|\u{1F3FB})?|\u{1F43B}\u200D\u2744|(?:[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u{1F46F}\u{1F9DE}\u{1F9DF}])\u200D[\u2640\u2642]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}](?:[\uFE0F\u{1F3FB}-\u{1F3FF}]\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\u{1F3F4}\u200D\u2620|\u{1F1FD}\u{1F1F0}|\u{1F1F6}\u{1F1E6}|\u{1F1F4}\u{1F1F2}|\u{1F408}\u200D\u2B1B|\u2764(?:\uFE0F\u200D[\u{1F525}\u{1FA79}]|\u200D[\u{1F525}\u{1FA79}])|\u{1F441}\uFE0F?|\u{1F3F3}\uFE0F?|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93C}-\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}]\u200D[\u2640\u2642]|\u{1F1FF}[\u{1F1E6}\u{1F1F2}\u{1F1FC}]|\u{1F1FE}[\u{1F1EA}\u{1F1F9}]|\u{1F1FC}[\u{1F1EB}\u{1F1F8}]|\u{1F1FB}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1EE}\u{1F1F3}\u{1F1FA}]|\u{1F1FA}[\u{1F1E6}\u{1F1EC}\u{1F1F2}\u{1F1F3}\u{1F1F8}\u{1F1FE}\u{1F1FF}]|\u{1F1F9}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1ED}\u{1F1EF}-\u{1F1F4}\u{1F1F7}\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FF}]|\u{1F1F8}[\u{1F1E6}-\u{1F1EA}\u{1F1EC}-\u{1F1F4}\u{1F1F7}-\u{1F1F9}\u{1F1FB}\u{1F1FD}-\u{1F1FF}]|\u{1F1F7}[\u{1F1EA}\u{1F1F4}\u{1F1F8}\u{1F1FA}\u{1F1FC}]|\u{1F1F5}[\u{1F1E6}\u{1F1EA}-\u{1F1ED}\u{1F1F0}-\u{1F1F3}\u{1F1F7}-\u{1F1F9}\u{1F1FC}\u{1F1FE}]|\u{1F1F3}[\u{1F1E6}\u{1F1E8}\u{1F1EA}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F4}\u{1F1F5}\u{1F1F7}\u{1F1FA}\u{1F1FF}]|\u{1F1F2}[\u{1F1E6}\u{1F1E8}-\u{1F1ED}\u{1F1F0}-\u{1F1FF}]|\u{1F1F1}[\u{1F1E6}-\u{1F1E8}\u{1F1EE}\u{1F1F0}\u{1F1F7}-\u{1F1FB}\u{1F1FE}]|\u{1F1F0}[\u{1F1EA}\u{1F1EC}-\u{1F1EE}\u{1F1F2}\u{1F1F3}\u{1F1F5}\u{1F1F7}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1EF}[\u{1F1EA}\u{1F1F2}\u{1F1F4}\u{1F1F5}]|\u{1F1EE}[\u{1F1E8}-\u{1F1EA}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}]|\u{1F1ED}[\u{1F1F0}\u{1F1F2}\u{1F1F3}\u{1F1F7}\u{1F1F9}\u{1F1FA}]|\u{1F1EC}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EE}\u{1F1F1}-\u{1F1F3}\u{1F1F5}-\u{1F1FA}\u{1F1FC}\u{1F1FE}]|\u{1F1EB}[\u{1F1EE}-\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1F7}]|\u{1F1EA}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1ED}\u{1F1F7}-\u{1F1FA}]|\u{1F1E9}[\u{1F1EA}\u{1F1EC}\u{1F1EF}\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1FF}]|\u{1F1E8}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1EE}\u{1F1F0}-\u{1F1F5}\u{1F1F7}\u{1F1FA}-\u{1F1FF}]|\u{1F1E7}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EF}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1E6}[\u{1F1E8}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F2}\u{1F1F4}\u{1F1F6}-\u{1F1FA}\u{1F1FC}\u{1F1FD}\u{1F1FF}]|[#\*0-9]\uFE0F?\u20E3|\u{1F93C}[\u{1F3FB}-\u{1F3FF}]|\u2764\uFE0F?|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\uFE0F\u{1F3FB}-\u{1F3FF}]?|\u{1F3F4}|[\u270A\u270B\u{1F385}\u{1F3C2}\u{1F3C7}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}\u{1F467}\u{1F46B}-\u{1F46D}\u{1F472}\u{1F474}-\u{1F476}\u{1F478}\u{1F47C}\u{1F483}\u{1F485}\u{1F48F}\u{1F491}\u{1F4AA}\u{1F57A}\u{1F595}\u{1F596}\u{1F64C}\u{1F64F}\u{1F6C0}\u{1F6CC}\u{1F90C}\u{1F90F}\u{1F918}-\u{1F91F}\u{1F930}-\u{1F934}\u{1F936}\u{1F977}\u{1F9B5}\u{1F9B6}\u{1F9BB}\u{1F9D2}\u{1F9D3}\u{1F9D5}\u{1FAC3}-\u{1FAC5}\u{1FAF0}\u{1FAF2}-\u{1FAF6}][\u{1F3FB}-\u{1F3FF}]|[\u261D\u270C\u270D\u{1F574}\u{1F590}][\uFE0F\u{1F3FB}-\u{1F3FF}]|[\u261D\u270A-\u270D\u{1F385}\u{1F3C2}\u{1F3C7}\u{1F408}\u{1F415}\u{1F43B}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}\u{1F467}\u{1F46B}-\u{1F46D}\u{1F472}\u{1F474}-\u{1F476}\u{1F478}\u{1F47C}\u{1F483}\u{1F485}\u{1F48F}\u{1F491}\u{1F4AA}\u{1F574}\u{1F57A}\u{1F590}\u{1F595}\u{1F596}\u{1F62E}\u{1F635}\u{1F636}\u{1F64C}\u{1F64F}\u{1F6C0}\u{1F6CC}\u{1F90C}\u{1F90F}\u{1F918}-\u{1F91F}\u{1F930}-\u{1F934}\u{1F936}\u{1F93C}\u{1F977}\u{1F9B5}\u{1F9B6}\u{1F9BB}\u{1F9D2}\u{1F9D3}\u{1F9D5}\u{1FAC3}-\u{1FAC5}\u{1FAF0}\u{1FAF2}-\u{1FAF6}]|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F470}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F935}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9CD}-\u{1F9CF}\u{1F9D4}\u{1F9D6}-\u{1F9DD}]|[\u{1F46F}\u{1F9DE}\u{1F9DF}]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299\u{1F004}\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F202}\u{1F237}\u{1F321}\u{1F324}-\u{1F32C}\u{1F336}\u{1F37D}\u{1F396}\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}\u{1F39F}\u{1F3CD}\u{1F3CE}\u{1F3D4}-\u{1F3DF}\u{1F3F5}\u{1F3F7}\u{1F43F}\u{1F4FD}\u{1F549}\u{1F54A}\u{1F56F}\u{1F570}\u{1F573}\u{1F576}-\u{1F579}\u{1F587}\u{1F58A}-\u{1F58D}\u{1F5A5}\u{1F5A8}\u{1F5B1}\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}\u{1F6CB}\u{1F6CD}-\u{1F6CF}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6F0}\u{1F6F3}]|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B50\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F201}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F236}\u{1F238}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F320}\u{1F32D}-\u{1F335}\u{1F337}-\u{1F37C}\u{1F37E}-\u{1F384}\u{1F386}-\u{1F393}\u{1F3A0}-\u{1F3C1}\u{1F3C5}\u{1F3C6}\u{1F3C8}\u{1F3C9}\u{1F3CF}-\u{1F3D3}\u{1F3E0}-\u{1F3F0}\u{1F3F8}-\u{1F407}\u{1F409}-\u{1F414}\u{1F416}-\u{1F43A}\u{1F43C}-\u{1F43E}\u{1F440}\u{1F444}\u{1F445}\u{1F451}-\u{1F465}\u{1F46A}\u{1F479}-\u{1F47B}\u{1F47D}-\u{1F480}\u{1F484}\u{1F488}-\u{1F48E}\u{1F490}\u{1F492}-\u{1F4A9}\u{1F4AB}-\u{1F4FC}\u{1F4FF}-\u{1F53D}\u{1F54B}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F5A4}\u{1F5FB}-\u{1F62D}\u{1F62F}-\u{1F634}\u{1F637}-\u{1F644}\u{1F648}-\u{1F64A}\u{1F680}-\u{1F6A2}\u{1F6A4}-\u{1F6B3}\u{1F6B7}-\u{1F6BF}\u{1F6C1}-\u{1F6C5}\u{1F6D0}-\u{1F6D2}\u{1F6D5}-\u{1F6D7}\u{1F6DD}-\u{1F6DF}\u{1F6EB}\u{1F6EC}\u{1F6F4}-\u{1F6FC}\u{1F7E0}-\u{1F7EB}\u{1F7F0}\u{1F90D}\u{1F90E}\u{1F910}-\u{1F917}\u{1F920}-\u{1F925}\u{1F927}-\u{1F92F}\u{1F93A}\u{1F93F}-\u{1F945}\u{1F947}-\u{1F976}\u{1F978}-\u{1F9B4}\u{1F9B7}\u{1F9BA}\u{1F9BC}-\u{1F9CC}\u{1F9D0}\u{1F9E0}-\u{1F9FF}\u{1FA70}-\u{1FA74}\u{1FA78}-\u{1FA7C}\u{1FA80}-\u{1FA86}\u{1FA90}-\u{1FAAC}\u{1FAB0}-\u{1FABA}\u{1FAC0}-\u{1FAC2}\u{1FAD0}-\u{1FAD9}\u{1FAE0}-\u{1FAE7}]";

  (function (exports) {
  var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
      return (mod && mod.__esModule) ? mod : { "default": mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.count = exports.countCharacters = exports.countLines = exports.countWords = void 0;
  const emojiPattern_1 = __importDefault(emojiPattern);
  const PatternString = {
      emoji: emojiPattern_1.default,
      cjk: "\\p{Script=Han}|\\p{Script=Kana}|\\p{Script=Hira}|\\p{Script=Hangul}",
      word: "[\\p{Alphabetic}\\p{Decimal_Number}\\p{Connector_Punctuation}\\p{Join_Control}]+",
      number: "(?:[\\p{Decimal_Number}](?:\\.?\\p{Decimal_Number})+)",
  };
  const wordPattern = new RegExp(`${PatternString.emoji}|${PatternString.cjk}|${PatternString.number}|${PatternString.word}`, "gu");
  const characterPattern = new RegExp(`${PatternString.emoji}|\\S`, "ug");
  const characterPatternWithSpace = new RegExp(`${PatternString.emoji}|.`, "ug");
  const countWords = (text) => {
      var _a, _b;
      return (_b = (_a = text.normalize().match(wordPattern)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
  };
  exports.countWords = countWords;
  const countLines = (text) => {
      var _a;
      return (_a = text.split("\n").length) !== null && _a !== void 0 ? _a : 0;
  };
  exports.countLines = countLines;
  const countCharacters = (text, withSpace = false) => {
      var _a, _b;
      return ((_b = (_a = text
          .normalize()
          .match(withSpace ? characterPatternWithSpace : characterPattern)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0);
  };
  exports.countCharacters = countCharacters;
  const count = (text) => {
      return {
          words: (0, exports.countWords)(text),
          lines: (0, exports.countLines)(text),
          characters: (0, exports.countCharacters)(text),
          charactersWithSpaces: (0, exports.countCharacters)(text, true),
      };
  };
  exports.count = count;
  }(dist));

  var metaData = {
  	"@name": "juejin-post-tracker",
  	"@include": "*",
  	"@run-at": "document-end",
  	"@require": "tampermonkey://vendor/jquery.js",
  	"@match": "juejin.cn",
  	"@connect": "juejin.cn"
  };

  const extensionSlug = metaData["@name"];
  const initStorage = (name, version, defaultValue) => {
    const versionPath = `${name}/version`;

    if (getFromStorage(versionPath, 0) < version) {
      saveToStorage(name, defaultValue);
      saveToStorage(versionPath, version);
      return defaultValue;
    } else {
      var _getFromStorage;

      return (_getFromStorage = getFromStorage(name)) !== null && _getFromStorage !== void 0 ? _getFromStorage : defaultValue;
    }
  };
  const saveToStorage = (name, value) => {
    GM_setValue(`${extensionSlug}/${name}`, value);
  };
  const getFromStorage = (name, defaultValue) => {
    return GM_getValue(`${extensionSlug}/${name}`, defaultValue);
  };

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var check = function (it) {
    return it && it.Math == Math && it;
  };

  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global$e =
    // eslint-disable-next-line es/no-global-this -- safe
    check(typeof globalThis == 'object' && globalThis) ||
    check(typeof window == 'object' && window) ||
    // eslint-disable-next-line no-restricted-globals -- safe
    check(typeof self == 'object' && self) ||
    check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
    // eslint-disable-next-line no-new-func -- fallback
    (function () { return this; })() || Function('return this')();

  var objectGetOwnPropertyDescriptor = {};

  var fails$a = function (exec) {
    try {
      return !!exec();
    } catch (error) {
      return true;
    }
  };

  var fails$9 = fails$a;

  // Detect IE8's incomplete defineProperty implementation
  var descriptors = !fails$9(function () {
    // eslint-disable-next-line es/no-object-defineproperty -- required for testing
    return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
  });

  var objectPropertyIsEnumerable = {};

  var $propertyIsEnumerable = {}.propertyIsEnumerable;
  // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
  var getOwnPropertyDescriptor$1 = Object.getOwnPropertyDescriptor;

  // Nashorn ~ JDK8 bug
  var NASHORN_BUG = getOwnPropertyDescriptor$1 && !$propertyIsEnumerable.call({ 1: 2 }, 1);

  // `Object.prototype.propertyIsEnumerable` method implementation
  // https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable
  objectPropertyIsEnumerable.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
    var descriptor = getOwnPropertyDescriptor$1(this, V);
    return !!descriptor && descriptor.enumerable;
  } : $propertyIsEnumerable;

  var createPropertyDescriptor$2 = function (bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };

  var toString$5 = {}.toString;

  var classofRaw$1 = function (it) {
    return toString$5.call(it).slice(8, -1);
  };

  var fails$8 = fails$a;
  var classof$4 = classofRaw$1;

  var split = ''.split;

  // fallback for non-array-like ES3 and non-enumerable old V8 strings
  var indexedObject = fails$8(function () {
    // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
    // eslint-disable-next-line no-prototype-builtins -- safe
    return !Object('z').propertyIsEnumerable(0);
  }) ? function (it) {
    return classof$4(it) == 'String' ? split.call(it, '') : Object(it);
  } : Object;

  // `RequireObjectCoercible` abstract operation
  // https://tc39.es/ecma262/#sec-requireobjectcoercible
  var requireObjectCoercible$5 = function (it) {
    if (it == undefined) throw TypeError("Can't call method on " + it);
    return it;
  };

  // toObject with fallback for non-array-like ES3 strings
  var IndexedObject = indexedObject;
  var requireObjectCoercible$4 = requireObjectCoercible$5;

  var toIndexedObject$3 = function (it) {
    return IndexedObject(requireObjectCoercible$4(it));
  };

  // `IsCallable` abstract operation
  // https://tc39.es/ecma262/#sec-iscallable
  var isCallable$d = function (argument) {
    return typeof argument === 'function';
  };

  var isCallable$c = isCallable$d;

  var isObject$6 = function (it) {
    return typeof it === 'object' ? it !== null : isCallable$c(it);
  };

  var global$d = global$e;
  var isCallable$b = isCallable$d;

  var aFunction = function (argument) {
    return isCallable$b(argument) ? argument : undefined;
  };

  var getBuiltIn$4 = function (namespace, method) {
    return arguments.length < 2 ? aFunction(global$d[namespace]) : global$d[namespace] && global$d[namespace][method];
  };

  var getBuiltIn$3 = getBuiltIn$4;

  var engineUserAgent = getBuiltIn$3('navigator', 'userAgent') || '';

  var global$c = global$e;
  var userAgent = engineUserAgent;

  var process = global$c.process;
  var Deno = global$c.Deno;
  var versions = process && process.versions || Deno && Deno.version;
  var v8 = versions && versions.v8;
  var match, version;

  if (v8) {
    match = v8.split('.');
    version = match[0] < 4 ? 1 : match[0] + match[1];
  } else if (userAgent) {
    match = userAgent.match(/Edge\/(\d+)/);
    if (!match || match[1] >= 74) {
      match = userAgent.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    }
  }

  var engineV8Version = version && +version;

  /* eslint-disable es/no-symbol -- required for testing */

  var V8_VERSION = engineV8Version;
  var fails$7 = fails$a;

  // eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing
  var nativeSymbol = !!Object.getOwnPropertySymbols && !fails$7(function () {
    var symbol = Symbol();
    // Chrome 38 Symbol has incorrect toString conversion
    // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances
    return !String(symbol) || !(Object(symbol) instanceof Symbol) ||
      // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
      !Symbol.sham && V8_VERSION && V8_VERSION < 41;
  });

  /* eslint-disable es/no-symbol -- required for testing */

  var NATIVE_SYMBOL$1 = nativeSymbol;

  var useSymbolAsUid = NATIVE_SYMBOL$1
    && !Symbol.sham
    && typeof Symbol.iterator == 'symbol';

  var isCallable$a = isCallable$d;
  var getBuiltIn$2 = getBuiltIn$4;
  var USE_SYMBOL_AS_UID$1 = useSymbolAsUid;

  var isSymbol$2 = USE_SYMBOL_AS_UID$1 ? function (it) {
    return typeof it == 'symbol';
  } : function (it) {
    var $Symbol = getBuiltIn$2('Symbol');
    return isCallable$a($Symbol) && Object(it) instanceof $Symbol;
  };

  var tryToString$1 = function (argument) {
    try {
      return String(argument);
    } catch (error) {
      return 'Object';
    }
  };

  var isCallable$9 = isCallable$d;
  var tryToString = tryToString$1;

  // `Assert: IsCallable(argument) is true`
  var aCallable$1 = function (argument) {
    if (isCallable$9(argument)) return argument;
    throw TypeError(tryToString(argument) + ' is not a function');
  };

  var aCallable = aCallable$1;

  // `GetMethod` abstract operation
  // https://tc39.es/ecma262/#sec-getmethod
  var getMethod$3 = function (V, P) {
    var func = V[P];
    return func == null ? undefined : aCallable(func);
  };

  var isCallable$8 = isCallable$d;
  var isObject$5 = isObject$6;

  // `OrdinaryToPrimitive` abstract operation
  // https://tc39.es/ecma262/#sec-ordinarytoprimitive
  var ordinaryToPrimitive$1 = function (input, pref) {
    var fn, val;
    if (pref === 'string' && isCallable$8(fn = input.toString) && !isObject$5(val = fn.call(input))) return val;
    if (isCallable$8(fn = input.valueOf) && !isObject$5(val = fn.call(input))) return val;
    if (pref !== 'string' && isCallable$8(fn = input.toString) && !isObject$5(val = fn.call(input))) return val;
    throw TypeError("Can't convert object to primitive value");
  };

  var shared$4 = {exports: {}};

  var global$b = global$e;

  var setGlobal$3 = function (key, value) {
    try {
      // eslint-disable-next-line es/no-object-defineproperty -- safe
      Object.defineProperty(global$b, key, { value: value, configurable: true, writable: true });
    } catch (error) {
      global$b[key] = value;
    } return value;
  };

  var global$a = global$e;
  var setGlobal$2 = setGlobal$3;

  var SHARED = '__core-js_shared__';
  var store$3 = global$a[SHARED] || setGlobal$2(SHARED, {});

  var sharedStore = store$3;

  var store$2 = sharedStore;

  (shared$4.exports = function (key, value) {
    return store$2[key] || (store$2[key] = value !== undefined ? value : {});
  })('versions', []).push({
    version: '3.18.3',
    mode: 'global',
    copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
  });

  var requireObjectCoercible$3 = requireObjectCoercible$5;

  // `ToObject` abstract operation
  // https://tc39.es/ecma262/#sec-toobject
  var toObject$2 = function (argument) {
    return Object(requireObjectCoercible$3(argument));
  };

  var toObject$1 = toObject$2;

  var hasOwnProperty = {}.hasOwnProperty;

  // `HasOwnProperty` abstract operation
  // https://tc39.es/ecma262/#sec-hasownproperty
  var hasOwnProperty_1 = Object.hasOwn || function hasOwn(it, key) {
    return hasOwnProperty.call(toObject$1(it), key);
  };

  var id = 0;
  var postfix = Math.random();

  var uid$2 = function (key) {
    return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
  };

  var global$9 = global$e;
  var shared$3 = shared$4.exports;
  var hasOwn$6 = hasOwnProperty_1;
  var uid$1 = uid$2;
  var NATIVE_SYMBOL = nativeSymbol;
  var USE_SYMBOL_AS_UID = useSymbolAsUid;

  var WellKnownSymbolsStore = shared$3('wks');
  var Symbol$1 = global$9.Symbol;
  var createWellKnownSymbol = USE_SYMBOL_AS_UID ? Symbol$1 : Symbol$1 && Symbol$1.withoutSetter || uid$1;

  var wellKnownSymbol$7 = function (name) {
    if (!hasOwn$6(WellKnownSymbolsStore, name) || !(NATIVE_SYMBOL || typeof WellKnownSymbolsStore[name] == 'string')) {
      if (NATIVE_SYMBOL && hasOwn$6(Symbol$1, name)) {
        WellKnownSymbolsStore[name] = Symbol$1[name];
      } else {
        WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
      }
    } return WellKnownSymbolsStore[name];
  };

  var isObject$4 = isObject$6;
  var isSymbol$1 = isSymbol$2;
  var getMethod$2 = getMethod$3;
  var ordinaryToPrimitive = ordinaryToPrimitive$1;
  var wellKnownSymbol$6 = wellKnownSymbol$7;

  var TO_PRIMITIVE = wellKnownSymbol$6('toPrimitive');

  // `ToPrimitive` abstract operation
  // https://tc39.es/ecma262/#sec-toprimitive
  var toPrimitive$1 = function (input, pref) {
    if (!isObject$4(input) || isSymbol$1(input)) return input;
    var exoticToPrim = getMethod$2(input, TO_PRIMITIVE);
    var result;
    if (exoticToPrim) {
      if (pref === undefined) pref = 'default';
      result = exoticToPrim.call(input, pref);
      if (!isObject$4(result) || isSymbol$1(result)) return result;
      throw TypeError("Can't convert object to primitive value");
    }
    if (pref === undefined) pref = 'number';
    return ordinaryToPrimitive(input, pref);
  };

  var toPrimitive = toPrimitive$1;
  var isSymbol = isSymbol$2;

  // `ToPropertyKey` abstract operation
  // https://tc39.es/ecma262/#sec-topropertykey
  var toPropertyKey$2 = function (argument) {
    var key = toPrimitive(argument, 'string');
    return isSymbol(key) ? key : String(key);
  };

  var global$8 = global$e;
  var isObject$3 = isObject$6;

  var document$1 = global$8.document;
  // typeof document.createElement is 'object' in old IE
  var EXISTS$1 = isObject$3(document$1) && isObject$3(document$1.createElement);

  var documentCreateElement$1 = function (it) {
    return EXISTS$1 ? document$1.createElement(it) : {};
  };

  var DESCRIPTORS$5 = descriptors;
  var fails$6 = fails$a;
  var createElement = documentCreateElement$1;

  // Thank's IE8 for his funny defineProperty
  var ie8DomDefine = !DESCRIPTORS$5 && !fails$6(function () {
    // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
    return Object.defineProperty(createElement('div'), 'a', {
      get: function () { return 7; }
    }).a != 7;
  });

  var DESCRIPTORS$4 = descriptors;
  var propertyIsEnumerableModule = objectPropertyIsEnumerable;
  var createPropertyDescriptor$1 = createPropertyDescriptor$2;
  var toIndexedObject$2 = toIndexedObject$3;
  var toPropertyKey$1 = toPropertyKey$2;
  var hasOwn$5 = hasOwnProperty_1;
  var IE8_DOM_DEFINE$1 = ie8DomDefine;

  // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
  var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.es/ecma262/#sec-object.getownpropertydescriptor
  objectGetOwnPropertyDescriptor.f = DESCRIPTORS$4 ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
    O = toIndexedObject$2(O);
    P = toPropertyKey$1(P);
    if (IE8_DOM_DEFINE$1) try {
      return $getOwnPropertyDescriptor(O, P);
    } catch (error) { /* empty */ }
    if (hasOwn$5(O, P)) return createPropertyDescriptor$1(!propertyIsEnumerableModule.f.call(O, P), O[P]);
  };

  var objectDefineProperty = {};

  var isObject$2 = isObject$6;

  // `Assert: Type(argument) is Object`
  var anObject$7 = function (argument) {
    if (isObject$2(argument)) return argument;
    throw TypeError(String(argument) + ' is not an object');
  };

  var DESCRIPTORS$3 = descriptors;
  var IE8_DOM_DEFINE = ie8DomDefine;
  var anObject$6 = anObject$7;
  var toPropertyKey = toPropertyKey$2;

  // eslint-disable-next-line es/no-object-defineproperty -- safe
  var $defineProperty = Object.defineProperty;

  // `Object.defineProperty` method
  // https://tc39.es/ecma262/#sec-object.defineproperty
  objectDefineProperty.f = DESCRIPTORS$3 ? $defineProperty : function defineProperty(O, P, Attributes) {
    anObject$6(O);
    P = toPropertyKey(P);
    anObject$6(Attributes);
    if (IE8_DOM_DEFINE) try {
      return $defineProperty(O, P, Attributes);
    } catch (error) { /* empty */ }
    if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
    if ('value' in Attributes) O[P] = Attributes.value;
    return O;
  };

  var DESCRIPTORS$2 = descriptors;
  var definePropertyModule$2 = objectDefineProperty;
  var createPropertyDescriptor = createPropertyDescriptor$2;

  var createNonEnumerableProperty$4 = DESCRIPTORS$2 ? function (object, key, value) {
    return definePropertyModule$2.f(object, key, createPropertyDescriptor(1, value));
  } : function (object, key, value) {
    object[key] = value;
    return object;
  };

  var redefine$2 = {exports: {}};

  var isCallable$7 = isCallable$d;
  var store$1 = sharedStore;

  var functionToString = Function.toString;

  // this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper
  if (!isCallable$7(store$1.inspectSource)) {
    store$1.inspectSource = function (it) {
      return functionToString.call(it);
    };
  }

  var inspectSource$2 = store$1.inspectSource;

  var global$7 = global$e;
  var isCallable$6 = isCallable$d;
  var inspectSource$1 = inspectSource$2;

  var WeakMap$1 = global$7.WeakMap;

  var nativeWeakMap = isCallable$6(WeakMap$1) && /native code/.test(inspectSource$1(WeakMap$1));

  var shared$2 = shared$4.exports;
  var uid = uid$2;

  var keys = shared$2('keys');

  var sharedKey$2 = function (key) {
    return keys[key] || (keys[key] = uid(key));
  };

  var hiddenKeys$4 = {};

  var NATIVE_WEAK_MAP = nativeWeakMap;
  var global$6 = global$e;
  var isObject$1 = isObject$6;
  var createNonEnumerableProperty$3 = createNonEnumerableProperty$4;
  var hasOwn$4 = hasOwnProperty_1;
  var shared$1 = sharedStore;
  var sharedKey$1 = sharedKey$2;
  var hiddenKeys$3 = hiddenKeys$4;

  var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
  var WeakMap = global$6.WeakMap;
  var set, get, has;

  var enforce = function (it) {
    return has(it) ? get(it) : set(it, {});
  };

  var getterFor = function (TYPE) {
    return function (it) {
      var state;
      if (!isObject$1(it) || (state = get(it)).type !== TYPE) {
        throw TypeError('Incompatible receiver, ' + TYPE + ' required');
      } return state;
    };
  };

  if (NATIVE_WEAK_MAP || shared$1.state) {
    var store = shared$1.state || (shared$1.state = new WeakMap());
    var wmget = store.get;
    var wmhas = store.has;
    var wmset = store.set;
    set = function (it, metadata) {
      if (wmhas.call(store, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
      metadata.facade = it;
      wmset.call(store, it, metadata);
      return metadata;
    };
    get = function (it) {
      return wmget.call(store, it) || {};
    };
    has = function (it) {
      return wmhas.call(store, it);
    };
  } else {
    var STATE = sharedKey$1('state');
    hiddenKeys$3[STATE] = true;
    set = function (it, metadata) {
      if (hasOwn$4(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
      metadata.facade = it;
      createNonEnumerableProperty$3(it, STATE, metadata);
      return metadata;
    };
    get = function (it) {
      return hasOwn$4(it, STATE) ? it[STATE] : {};
    };
    has = function (it) {
      return hasOwn$4(it, STATE);
    };
  }

  var internalState = {
    set: set,
    get: get,
    has: has,
    enforce: enforce,
    getterFor: getterFor
  };

  var DESCRIPTORS$1 = descriptors;
  var hasOwn$3 = hasOwnProperty_1;

  var FunctionPrototype = Function.prototype;
  // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
  var getDescriptor = DESCRIPTORS$1 && Object.getOwnPropertyDescriptor;

  var EXISTS = hasOwn$3(FunctionPrototype, 'name');
  // additional protection from minified / mangled / dropped function names
  var PROPER = EXISTS && (function something() { /* empty */ }).name === 'something';
  var CONFIGURABLE = EXISTS && (!DESCRIPTORS$1 || (DESCRIPTORS$1 && getDescriptor(FunctionPrototype, 'name').configurable));

  var functionName = {
    EXISTS: EXISTS,
    PROPER: PROPER,
    CONFIGURABLE: CONFIGURABLE
  };

  var global$5 = global$e;
  var isCallable$5 = isCallable$d;
  var hasOwn$2 = hasOwnProperty_1;
  var createNonEnumerableProperty$2 = createNonEnumerableProperty$4;
  var setGlobal$1 = setGlobal$3;
  var inspectSource = inspectSource$2;
  var InternalStateModule = internalState;
  var CONFIGURABLE_FUNCTION_NAME = functionName.CONFIGURABLE;

  var getInternalState$1 = InternalStateModule.get;
  var enforceInternalState = InternalStateModule.enforce;
  var TEMPLATE = String(String).split('String');

  (redefine$2.exports = function (O, key, value, options) {
    var unsafe = options ? !!options.unsafe : false;
    var simple = options ? !!options.enumerable : false;
    var noTargetGet = options ? !!options.noTargetGet : false;
    var name = options && options.name !== undefined ? options.name : key;
    var state;
    if (isCallable$5(value)) {
      if (String(name).slice(0, 7) === 'Symbol(') {
        name = '[' + String(name).replace(/^Symbol\(([^)]*)\)/, '$1') + ']';
      }
      if (!hasOwn$2(value, 'name') || (CONFIGURABLE_FUNCTION_NAME && value.name !== name)) {
        createNonEnumerableProperty$2(value, 'name', name);
      }
      state = enforceInternalState(value);
      if (!state.source) {
        state.source = TEMPLATE.join(typeof name == 'string' ? name : '');
      }
    }
    if (O === global$5) {
      if (simple) O[key] = value;
      else setGlobal$1(key, value);
      return;
    } else if (!unsafe) {
      delete O[key];
    } else if (!noTargetGet && O[key]) {
      simple = true;
    }
    if (simple) O[key] = value;
    else createNonEnumerableProperty$2(O, key, value);
  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
  })(Function.prototype, 'toString', function toString() {
    return isCallable$5(this) && getInternalState$1(this).source || inspectSource(this);
  });

  var objectGetOwnPropertyNames = {};

  var ceil = Math.ceil;
  var floor$1 = Math.floor;

  // `ToIntegerOrInfinity` abstract operation
  // https://tc39.es/ecma262/#sec-tointegerorinfinity
  var toIntegerOrInfinity$4 = function (argument) {
    var number = +argument;
    // eslint-disable-next-line no-self-compare -- safe
    return number !== number || number === 0 ? 0 : (number > 0 ? floor$1 : ceil)(number);
  };

  var toIntegerOrInfinity$3 = toIntegerOrInfinity$4;

  var max$2 = Math.max;
  var min$2 = Math.min;

  // Helper for a popular repeating case of the spec:
  // Let integer be ? ToInteger(index).
  // If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
  var toAbsoluteIndex$1 = function (index, length) {
    var integer = toIntegerOrInfinity$3(index);
    return integer < 0 ? max$2(integer + length, 0) : min$2(integer, length);
  };

  var toIntegerOrInfinity$2 = toIntegerOrInfinity$4;

  var min$1 = Math.min;

  // `ToLength` abstract operation
  // https://tc39.es/ecma262/#sec-tolength
  var toLength$2 = function (argument) {
    return argument > 0 ? min$1(toIntegerOrInfinity$2(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
  };

  var toLength$1 = toLength$2;

  // `LengthOfArrayLike` abstract operation
  // https://tc39.es/ecma262/#sec-lengthofarraylike
  var lengthOfArrayLike$1 = function (obj) {
    return toLength$1(obj.length);
  };

  var toIndexedObject$1 = toIndexedObject$3;
  var toAbsoluteIndex = toAbsoluteIndex$1;
  var lengthOfArrayLike = lengthOfArrayLike$1;

  // `Array.prototype.{ indexOf, includes }` methods implementation
  var createMethod$1 = function (IS_INCLUDES) {
    return function ($this, el, fromIndex) {
      var O = toIndexedObject$1($this);
      var length = lengthOfArrayLike(O);
      var index = toAbsoluteIndex(fromIndex, length);
      var value;
      // Array#includes uses SameValueZero equality algorithm
      // eslint-disable-next-line no-self-compare -- NaN check
      if (IS_INCLUDES && el != el) while (length > index) {
        value = O[index++];
        // eslint-disable-next-line no-self-compare -- NaN check
        if (value != value) return true;
      // Array#indexOf ignores holes, Array#includes - not
      } else for (;length > index; index++) {
        if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
      } return !IS_INCLUDES && -1;
    };
  };

  var arrayIncludes = {
    // `Array.prototype.includes` method
    // https://tc39.es/ecma262/#sec-array.prototype.includes
    includes: createMethod$1(true),
    // `Array.prototype.indexOf` method
    // https://tc39.es/ecma262/#sec-array.prototype.indexof
    indexOf: createMethod$1(false)
  };

  var hasOwn$1 = hasOwnProperty_1;
  var toIndexedObject = toIndexedObject$3;
  var indexOf = arrayIncludes.indexOf;
  var hiddenKeys$2 = hiddenKeys$4;

  var objectKeysInternal = function (object, names) {
    var O = toIndexedObject(object);
    var i = 0;
    var result = [];
    var key;
    for (key in O) !hasOwn$1(hiddenKeys$2, key) && hasOwn$1(O, key) && result.push(key);
    // Don't enum bug & hidden keys
    while (names.length > i) if (hasOwn$1(O, key = names[i++])) {
      ~indexOf(result, key) || result.push(key);
    }
    return result;
  };

  // IE8- don't enum bug keys
  var enumBugKeys$3 = [
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf'
  ];

  var internalObjectKeys$1 = objectKeysInternal;
  var enumBugKeys$2 = enumBugKeys$3;

  var hiddenKeys$1 = enumBugKeys$2.concat('length', 'prototype');

  // `Object.getOwnPropertyNames` method
  // https://tc39.es/ecma262/#sec-object.getownpropertynames
  // eslint-disable-next-line es/no-object-getownpropertynames -- safe
  objectGetOwnPropertyNames.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
    return internalObjectKeys$1(O, hiddenKeys$1);
  };

  var objectGetOwnPropertySymbols = {};

  // eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
  objectGetOwnPropertySymbols.f = Object.getOwnPropertySymbols;

  var getBuiltIn$1 = getBuiltIn$4;
  var getOwnPropertyNamesModule = objectGetOwnPropertyNames;
  var getOwnPropertySymbolsModule = objectGetOwnPropertySymbols;
  var anObject$5 = anObject$7;

  // all object keys, includes non-enumerable and symbols
  var ownKeys$1 = getBuiltIn$1('Reflect', 'ownKeys') || function ownKeys(it) {
    var keys = getOwnPropertyNamesModule.f(anObject$5(it));
    var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
    return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
  };

  var hasOwn = hasOwnProperty_1;
  var ownKeys = ownKeys$1;
  var getOwnPropertyDescriptorModule = objectGetOwnPropertyDescriptor;
  var definePropertyModule$1 = objectDefineProperty;

  var copyConstructorProperties$1 = function (target, source) {
    var keys = ownKeys(source);
    var defineProperty = definePropertyModule$1.f;
    var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!hasOwn(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  };

  var fails$5 = fails$a;
  var isCallable$4 = isCallable$d;

  var replacement = /#|\.prototype\./;

  var isForced$1 = function (feature, detection) {
    var value = data[normalize(feature)];
    return value == POLYFILL ? true
      : value == NATIVE ? false
      : isCallable$4(detection) ? fails$5(detection)
      : !!detection;
  };

  var normalize = isForced$1.normalize = function (string) {
    return String(string).replace(replacement, '.').toLowerCase();
  };

  var data = isForced$1.data = {};
  var NATIVE = isForced$1.NATIVE = 'N';
  var POLYFILL = isForced$1.POLYFILL = 'P';

  var isForced_1 = isForced$1;

  var global$4 = global$e;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
  var createNonEnumerableProperty$1 = createNonEnumerableProperty$4;
  var redefine$1 = redefine$2.exports;
  var setGlobal = setGlobal$3;
  var copyConstructorProperties = copyConstructorProperties$1;
  var isForced = isForced_1;

  /*
    options.target      - name of the target object
    options.global      - target is the global object
    options.stat        - export as static methods of target
    options.proto       - export as prototype methods of target
    options.real        - real prototype method for the `pure` version
    options.forced      - export even if the native feature is available
    options.bind        - bind methods to the target, required for the `pure` version
    options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
    options.unsafe      - use the simple assignment of property instead of delete + defineProperty
    options.sham        - add a flag to not completely full polyfills
    options.enumerable  - export as enumerable property
    options.noTargetGet - prevent calling a getter on target
    options.name        - the .name of the function if it does not match the key
  */
  var _export = function (options, source) {
    var TARGET = options.target;
    var GLOBAL = options.global;
    var STATIC = options.stat;
    var FORCED, target, key, targetProperty, sourceProperty, descriptor;
    if (GLOBAL) {
      target = global$4;
    } else if (STATIC) {
      target = global$4[TARGET] || setGlobal(TARGET, {});
    } else {
      target = (global$4[TARGET] || {}).prototype;
    }
    if (target) for (key in source) {
      sourceProperty = source[key];
      if (options.noTargetGet) {
        descriptor = getOwnPropertyDescriptor(target, key);
        targetProperty = descriptor && descriptor.value;
      } else targetProperty = target[key];
      FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
      // contained in target
      if (!FORCED && targetProperty !== undefined) {
        if (typeof sourceProperty === typeof targetProperty) continue;
        copyConstructorProperties(sourceProperty, targetProperty);
      }
      // add a flag to not completely full polyfills
      if (options.sham || (targetProperty && targetProperty.sham)) {
        createNonEnumerableProperty$1(sourceProperty, 'sham', true);
      }
      // extend global
      redefine$1(target, key, sourceProperty, options);
    }
  };

  var wellKnownSymbol$5 = wellKnownSymbol$7;

  var TO_STRING_TAG$1 = wellKnownSymbol$5('toStringTag');
  var test = {};

  test[TO_STRING_TAG$1] = 'z';

  var toStringTagSupport = String(test) === '[object z]';

  var TO_STRING_TAG_SUPPORT = toStringTagSupport;
  var isCallable$3 = isCallable$d;
  var classofRaw = classofRaw$1;
  var wellKnownSymbol$4 = wellKnownSymbol$7;

  var TO_STRING_TAG = wellKnownSymbol$4('toStringTag');
  // ES3 wrong here
  var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

  // fallback for IE11 Script Access Denied error
  var tryGet = function (it, key) {
    try {
      return it[key];
    } catch (error) { /* empty */ }
  };

  // getting tag from ES6+ `Object.prototype.toString`
  var classof$3 = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
    var O, tag, result;
    return it === undefined ? 'Undefined' : it === null ? 'Null'
      // @@toStringTag case
      : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag
      // builtinTag case
      : CORRECT_ARGUMENTS ? classofRaw(O)
      // ES3 arguments fallback
      : (result = classofRaw(O)) == 'Object' && isCallable$3(O.callee) ? 'Arguments' : result;
  };

  var classof$2 = classof$3;

  var toString$4 = function (argument) {
    if (classof$2(argument) === 'Symbol') throw TypeError('Cannot convert a Symbol value to a string');
    return String(argument);
  };

  var anObject$4 = anObject$7;

  // `RegExp.prototype.flags` getter implementation
  // https://tc39.es/ecma262/#sec-get-regexp.prototype.flags
  var regexpFlags$1 = function () {
    var that = anObject$4(this);
    var result = '';
    if (that.global) result += 'g';
    if (that.ignoreCase) result += 'i';
    if (that.multiline) result += 'm';
    if (that.dotAll) result += 's';
    if (that.unicode) result += 'u';
    if (that.sticky) result += 'y';
    return result;
  };

  var regexpStickyHelpers = {};

  var fails$4 = fails$a;
  var global$3 = global$e;

  // babel-minify and Closure Compiler transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
  var $RegExp$2 = global$3.RegExp;

  regexpStickyHelpers.UNSUPPORTED_Y = fails$4(function () {
    var re = $RegExp$2('a', 'y');
    re.lastIndex = 2;
    return re.exec('abcd') != null;
  });

  regexpStickyHelpers.BROKEN_CARET = fails$4(function () {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
    var re = $RegExp$2('^r', 'gy');
    re.lastIndex = 2;
    return re.exec('str') != null;
  });

  var internalObjectKeys = objectKeysInternal;
  var enumBugKeys$1 = enumBugKeys$3;

  // `Object.keys` method
  // https://tc39.es/ecma262/#sec-object.keys
  // eslint-disable-next-line es/no-object-keys -- safe
  var objectKeys$1 = Object.keys || function keys(O) {
    return internalObjectKeys(O, enumBugKeys$1);
  };

  var DESCRIPTORS = descriptors;
  var definePropertyModule = objectDefineProperty;
  var anObject$3 = anObject$7;
  var objectKeys = objectKeys$1;

  // `Object.defineProperties` method
  // https://tc39.es/ecma262/#sec-object.defineproperties
  // eslint-disable-next-line es/no-object-defineproperties -- safe
  var objectDefineProperties = DESCRIPTORS ? Object.defineProperties : function defineProperties(O, Properties) {
    anObject$3(O);
    var keys = objectKeys(Properties);
    var length = keys.length;
    var index = 0;
    var key;
    while (length > index) definePropertyModule.f(O, key = keys[index++], Properties[key]);
    return O;
  };

  var getBuiltIn = getBuiltIn$4;

  var html$1 = getBuiltIn('document', 'documentElement');

  /* global ActiveXObject -- old IE, WSH */

  var anObject$2 = anObject$7;
  var defineProperties = objectDefineProperties;
  var enumBugKeys = enumBugKeys$3;
  var hiddenKeys = hiddenKeys$4;
  var html = html$1;
  var documentCreateElement = documentCreateElement$1;
  var sharedKey = sharedKey$2;

  var GT = '>';
  var LT = '<';
  var PROTOTYPE = 'prototype';
  var SCRIPT = 'script';
  var IE_PROTO = sharedKey('IE_PROTO');

  var EmptyConstructor = function () { /* empty */ };

  var scriptTag = function (content) {
    return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
  };

  // Create object with fake `null` prototype: use ActiveX Object with cleared prototype
  var NullProtoObjectViaActiveX = function (activeXDocument) {
    activeXDocument.write(scriptTag(''));
    activeXDocument.close();
    var temp = activeXDocument.parentWindow.Object;
    activeXDocument = null; // avoid memory leak
    return temp;
  };

  // Create object with fake `null` prototype: use iframe Object with cleared prototype
  var NullProtoObjectViaIFrame = function () {
    // Thrash, waste and sodomy: IE GC bug
    var iframe = documentCreateElement('iframe');
    var JS = 'java' + SCRIPT + ':';
    var iframeDocument;
    iframe.style.display = 'none';
    html.appendChild(iframe);
    // https://github.com/zloirock/core-js/issues/475
    iframe.src = String(JS);
    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(scriptTag('document.F=Object'));
    iframeDocument.close();
    return iframeDocument.F;
  };

  // Check for document.domain and active x support
  // No need to use active x approach when document.domain is not set
  // see https://github.com/es-shims/es5-shim/issues/150
  // variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
  // avoid IE GC bug
  var activeXDocument;
  var NullProtoObject = function () {
    try {
      activeXDocument = new ActiveXObject('htmlfile');
    } catch (error) { /* ignore */ }
    NullProtoObject = typeof document != 'undefined'
      ? document.domain && activeXDocument
        ? NullProtoObjectViaActiveX(activeXDocument) // old IE
        : NullProtoObjectViaIFrame()
      : NullProtoObjectViaActiveX(activeXDocument); // WSH
    var length = enumBugKeys.length;
    while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
    return NullProtoObject();
  };

  hiddenKeys[IE_PROTO] = true;

  // `Object.create` method
  // https://tc39.es/ecma262/#sec-object.create
  var objectCreate = Object.create || function create(O, Properties) {
    var result;
    if (O !== null) {
      EmptyConstructor[PROTOTYPE] = anObject$2(O);
      result = new EmptyConstructor();
      EmptyConstructor[PROTOTYPE] = null;
      // add "__proto__" for Object.getPrototypeOf polyfill
      result[IE_PROTO] = O;
    } else result = NullProtoObject();
    return Properties === undefined ? result : defineProperties(result, Properties);
  };

  var fails$3 = fails$a;
  var global$2 = global$e;

  // babel-minify and Closure Compiler transpiles RegExp('.', 's') -> /./s and it causes SyntaxError
  var $RegExp$1 = global$2.RegExp;

  var regexpUnsupportedDotAll = fails$3(function () {
    var re = $RegExp$1('.', 's');
    return !(re.dotAll && re.exec('\n') && re.flags === 's');
  });

  var fails$2 = fails$a;
  var global$1 = global$e;

  // babel-minify and Closure Compiler transpiles RegExp('(?<a>b)', 'g') -> /(?<a>b)/g and it causes SyntaxError
  var $RegExp = global$1.RegExp;

  var regexpUnsupportedNcg = fails$2(function () {
    var re = $RegExp('(?<a>b)', 'g');
    return re.exec('b').groups.a !== 'b' ||
      'b'.replace(re, '$<a>c') !== 'bc';
  });

  /* eslint-disable regexp/no-empty-capturing-group, regexp/no-empty-group, regexp/no-lazy-ends -- testing */
  /* eslint-disable regexp/no-useless-quantifier -- testing */
  var toString$3 = toString$4;
  var regexpFlags = regexpFlags$1;
  var stickyHelpers = regexpStickyHelpers;
  var shared = shared$4.exports;
  var create = objectCreate;
  var getInternalState = internalState.get;
  var UNSUPPORTED_DOT_ALL = regexpUnsupportedDotAll;
  var UNSUPPORTED_NCG = regexpUnsupportedNcg;

  var nativeExec = RegExp.prototype.exec;
  var nativeReplace = shared('native-string-replace', String.prototype.replace);

  var patchedExec = nativeExec;

  var UPDATES_LAST_INDEX_WRONG = (function () {
    var re1 = /a/;
    var re2 = /b*/g;
    nativeExec.call(re1, 'a');
    nativeExec.call(re2, 'a');
    return re1.lastIndex !== 0 || re2.lastIndex !== 0;
  })();

  var UNSUPPORTED_Y = stickyHelpers.UNSUPPORTED_Y || stickyHelpers.BROKEN_CARET;

  // nonparticipating capturing group, copied from es5-shim's String#split patch.
  var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

  var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y || UNSUPPORTED_DOT_ALL || UNSUPPORTED_NCG;

  if (PATCH) {
    // eslint-disable-next-line max-statements -- TODO
    patchedExec = function exec(string) {
      var re = this;
      var state = getInternalState(re);
      var str = toString$3(string);
      var raw = state.raw;
      var result, reCopy, lastIndex, match, i, object, group;

      if (raw) {
        raw.lastIndex = re.lastIndex;
        result = patchedExec.call(raw, str);
        re.lastIndex = raw.lastIndex;
        return result;
      }

      var groups = state.groups;
      var sticky = UNSUPPORTED_Y && re.sticky;
      var flags = regexpFlags.call(re);
      var source = re.source;
      var charsAdded = 0;
      var strCopy = str;

      if (sticky) {
        flags = flags.replace('y', '');
        if (flags.indexOf('g') === -1) {
          flags += 'g';
        }

        strCopy = str.slice(re.lastIndex);
        // Support anchored sticky behavior.
        if (re.lastIndex > 0 && (!re.multiline || re.multiline && str.charAt(re.lastIndex - 1) !== '\n')) {
          source = '(?: ' + source + ')';
          strCopy = ' ' + strCopy;
          charsAdded++;
        }
        // ^(? + rx + ) is needed, in combination with some str slicing, to
        // simulate the 'y' flag.
        reCopy = new RegExp('^(?:' + source + ')', flags);
      }

      if (NPCG_INCLUDED) {
        reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
      }
      if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

      match = nativeExec.call(sticky ? reCopy : re, strCopy);

      if (sticky) {
        if (match) {
          match.input = match.input.slice(charsAdded);
          match[0] = match[0].slice(charsAdded);
          match.index = re.lastIndex;
          re.lastIndex += match[0].length;
        } else re.lastIndex = 0;
      } else if (UPDATES_LAST_INDEX_WRONG && match) {
        re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
      }
      if (NPCG_INCLUDED && match && match.length > 1) {
        // Fix browsers whose `exec` methods don't consistently return `undefined`
        // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
        nativeReplace.call(match[0], reCopy, function () {
          for (i = 1; i < arguments.length - 2; i++) {
            if (arguments[i] === undefined) match[i] = undefined;
          }
        });
      }

      if (match && groups) {
        match.groups = object = create(null);
        for (i = 0; i < groups.length; i++) {
          group = groups[i];
          object[group[0]] = match[group[1]];
        }
      }

      return match;
    };
  }

  var regexpExec$2 = patchedExec;

  var $$2 = _export;
  var exec = regexpExec$2;

  // `RegExp.prototype.exec` method
  // https://tc39.es/ecma262/#sec-regexp.prototype.exec
  $$2({ target: 'RegExp', proto: true, forced: /./.exec !== exec }, {
    exec: exec
  });

  // TODO: Remove from `core-js@4` since it's moved to entry points

  var redefine = redefine$2.exports;
  var regexpExec$1 = regexpExec$2;
  var fails$1 = fails$a;
  var wellKnownSymbol$3 = wellKnownSymbol$7;
  var createNonEnumerableProperty = createNonEnumerableProperty$4;

  var SPECIES = wellKnownSymbol$3('species');
  var RegExpPrototype$1 = RegExp.prototype;

  var fixRegexpWellKnownSymbolLogic = function (KEY, exec, FORCED, SHAM) {
    var SYMBOL = wellKnownSymbol$3(KEY);

    var DELEGATES_TO_SYMBOL = !fails$1(function () {
      // String methods call symbol-named RegEp methods
      var O = {};
      O[SYMBOL] = function () { return 7; };
      return ''[KEY](O) != 7;
    });

    var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails$1(function () {
      // Symbol-named RegExp methods call .exec
      var execCalled = false;
      var re = /a/;

      if (KEY === 'split') {
        // We can't use real regex here since it causes deoptimization
        // and serious performance degradation in V8
        // https://github.com/zloirock/core-js/issues/306
        re = {};
        // RegExp[@@split] doesn't call the regex's exec method, but first creates
        // a new one. We need to return the patched regex when creating the new one.
        re.constructor = {};
        re.constructor[SPECIES] = function () { return re; };
        re.flags = '';
        re[SYMBOL] = /./[SYMBOL];
      }

      re.exec = function () { execCalled = true; return null; };

      re[SYMBOL]('');
      return !execCalled;
    });

    if (
      !DELEGATES_TO_SYMBOL ||
      !DELEGATES_TO_EXEC ||
      FORCED
    ) {
      var nativeRegExpMethod = /./[SYMBOL];
      var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
        var $exec = regexp.exec;
        if ($exec === regexpExec$1 || $exec === RegExpPrototype$1.exec) {
          if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
            // The native String method already delegates to @@method (this
            // polyfilled function), leasing to infinite recursion.
            // We avoid it by directly calling the native @@method method.
            return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
          }
          return { done: true, value: nativeMethod.call(str, regexp, arg2) };
        }
        return { done: false };
      });

      redefine(String.prototype, KEY, methods[0]);
      redefine(RegExpPrototype$1, SYMBOL, methods[1]);
    }

    if (SHAM) createNonEnumerableProperty(RegExpPrototype$1[SYMBOL], 'sham', true);
  };

  var toIntegerOrInfinity$1 = toIntegerOrInfinity$4;
  var toString$2 = toString$4;
  var requireObjectCoercible$2 = requireObjectCoercible$5;

  var createMethod = function (CONVERT_TO_STRING) {
    return function ($this, pos) {
      var S = toString$2(requireObjectCoercible$2($this));
      var position = toIntegerOrInfinity$1(pos);
      var size = S.length;
      var first, second;
      if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
      first = S.charCodeAt(position);
      return first < 0xD800 || first > 0xDBFF || position + 1 === size
        || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
          ? CONVERT_TO_STRING ? S.charAt(position) : first
          : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
    };
  };

  var stringMultibyte = {
    // `String.prototype.codePointAt` method
    // https://tc39.es/ecma262/#sec-string.prototype.codepointat
    codeAt: createMethod(false),
    // `String.prototype.at` method
    // https://github.com/mathiasbynens/String.prototype.at
    charAt: createMethod(true)
  };

  var charAt = stringMultibyte.charAt;

  // `AdvanceStringIndex` abstract operation
  // https://tc39.es/ecma262/#sec-advancestringindex
  var advanceStringIndex$1 = function (S, index, unicode) {
    return index + (unicode ? charAt(S, index).length : 1);
  };

  var toObject = toObject$2;

  var floor = Math.floor;
  var replace = ''.replace;
  var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d{1,2}|<[^>]*>)/g;
  var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d{1,2})/g;

  // `GetSubstitution` abstract operation
  // https://tc39.es/ecma262/#sec-getsubstitution
  var getSubstitution$2 = function (matched, str, position, captures, namedCaptures, replacement) {
    var tailPos = position + matched.length;
    var m = captures.length;
    var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
    if (namedCaptures !== undefined) {
      namedCaptures = toObject(namedCaptures);
      symbols = SUBSTITUTION_SYMBOLS;
    }
    return replace.call(replacement, symbols, function (match, ch) {
      var capture;
      switch (ch.charAt(0)) {
        case '$': return '$';
        case '&': return matched;
        case '`': return str.slice(0, position);
        case "'": return str.slice(tailPos);
        case '<':
          capture = namedCaptures[ch.slice(1, -1)];
          break;
        default: // \d\d?
          var n = +ch;
          if (n === 0) return match;
          if (n > m) {
            var f = floor(n / 10);
            if (f === 0) return match;
            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
            return match;
          }
          capture = captures[n - 1];
      }
      return capture === undefined ? '' : capture;
    });
  };

  var anObject$1 = anObject$7;
  var isCallable$2 = isCallable$d;
  var classof$1 = classofRaw$1;
  var regexpExec = regexpExec$2;

  // `RegExpExec` abstract operation
  // https://tc39.es/ecma262/#sec-regexpexec
  var regexpExecAbstract = function (R, S) {
    var exec = R.exec;
    if (isCallable$2(exec)) {
      var result = exec.call(R, S);
      if (result !== null) anObject$1(result);
      return result;
    }
    if (classof$1(R) === 'RegExp') return regexpExec.call(R, S);
    throw TypeError('RegExp#exec called on incompatible receiver');
  };

  var fixRegExpWellKnownSymbolLogic = fixRegexpWellKnownSymbolLogic;
  var fails = fails$a;
  var anObject = anObject$7;
  var isCallable$1 = isCallable$d;
  var toIntegerOrInfinity = toIntegerOrInfinity$4;
  var toLength = toLength$2;
  var toString$1 = toString$4;
  var requireObjectCoercible$1 = requireObjectCoercible$5;
  var advanceStringIndex = advanceStringIndex$1;
  var getMethod$1 = getMethod$3;
  var getSubstitution$1 = getSubstitution$2;
  var regExpExec = regexpExecAbstract;
  var wellKnownSymbol$2 = wellKnownSymbol$7;

  var REPLACE$1 = wellKnownSymbol$2('replace');
  var max$1 = Math.max;
  var min = Math.min;

  var maybeToString = function (it) {
    return it === undefined ? it : String(it);
  };

  // IE <= 11 replaces $0 with the whole match, as if it was $&
  // https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
  var REPLACE_KEEPS_$0 = (function () {
    // eslint-disable-next-line regexp/prefer-escape-replacement-dollar-char -- required for testing
    return 'a'.replace(/./, '$0') === '$0';
  })();

  // Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
  var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
    if (/./[REPLACE$1]) {
      return /./[REPLACE$1]('a', '$0') === '';
    }
    return false;
  })();

  var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
    var re = /./;
    re.exec = function () {
      var result = [];
      result.groups = { a: '7' };
      return result;
    };
    // eslint-disable-next-line regexp/no-useless-dollar-replacements -- false positive
    return ''.replace(re, '$<a>') !== '7';
  });

  // @@replace logic
  fixRegExpWellKnownSymbolLogic('replace', function (_, nativeReplace, maybeCallNative) {
    var UNSAFE_SUBSTITUTE = REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE ? '$' : '$0';

    return [
      // `String.prototype.replace` method
      // https://tc39.es/ecma262/#sec-string.prototype.replace
      function replace(searchValue, replaceValue) {
        var O = requireObjectCoercible$1(this);
        var replacer = searchValue == undefined ? undefined : getMethod$1(searchValue, REPLACE$1);
        return replacer
          ? replacer.call(searchValue, O, replaceValue)
          : nativeReplace.call(toString$1(O), searchValue, replaceValue);
      },
      // `RegExp.prototype[@@replace]` method
      // https://tc39.es/ecma262/#sec-regexp.prototype-@@replace
      function (string, replaceValue) {
        var rx = anObject(this);
        var S = toString$1(string);

        if (
          typeof replaceValue === 'string' &&
          replaceValue.indexOf(UNSAFE_SUBSTITUTE) === -1 &&
          replaceValue.indexOf('$<') === -1
        ) {
          var res = maybeCallNative(nativeReplace, rx, S, replaceValue);
          if (res.done) return res.value;
        }

        var functionalReplace = isCallable$1(replaceValue);
        if (!functionalReplace) replaceValue = toString$1(replaceValue);

        var global = rx.global;
        if (global) {
          var fullUnicode = rx.unicode;
          rx.lastIndex = 0;
        }
        var results = [];
        while (true) {
          var result = regExpExec(rx, S);
          if (result === null) break;

          results.push(result);
          if (!global) break;

          var matchStr = toString$1(result[0]);
          if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
        }

        var accumulatedResult = '';
        var nextSourcePosition = 0;
        for (var i = 0; i < results.length; i++) {
          result = results[i];

          var matched = toString$1(result[0]);
          var position = max$1(min(toIntegerOrInfinity(result.index), S.length), 0);
          var captures = [];
          // NOTE: This is equivalent to
          //   captures = result.slice(1).map(maybeToString)
          // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
          // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
          // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
          for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
          var namedCaptures = result.groups;
          if (functionalReplace) {
            var replacerArgs = [matched].concat(captures, position, S);
            if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
            var replacement = toString$1(replaceValue.apply(undefined, replacerArgs));
          } else {
            replacement = getSubstitution$1(matched, S, position, captures, namedCaptures, replaceValue);
          }
          if (position >= nextSourcePosition) {
            accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
            nextSourcePosition = position + matched.length;
          }
        }
        return accumulatedResult + S.slice(nextSourcePosition);
      }
    ];
  }, !REPLACE_SUPPORTS_NAMED_GROUPS || !REPLACE_KEEPS_$0 || REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE);

  var isObject = isObject$6;
  var classof = classofRaw$1;
  var wellKnownSymbol$1 = wellKnownSymbol$7;

  var MATCH = wellKnownSymbol$1('match');

  // `IsRegExp` abstract operation
  // https://tc39.es/ecma262/#sec-isregexp
  var isRegexp = function (it) {
    var isRegExp;
    return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classof(it) == 'RegExp');
  };

  var $$1 = _export;
  var requireObjectCoercible = requireObjectCoercible$5;
  var isCallable = isCallable$d;
  var isRegExp = isRegexp;
  var toString = toString$4;
  var getMethod = getMethod$3;
  var getRegExpFlags = regexpFlags$1;
  var getSubstitution = getSubstitution$2;
  var wellKnownSymbol = wellKnownSymbol$7;

  var REPLACE = wellKnownSymbol('replace');
  var RegExpPrototype = RegExp.prototype;
  var max = Math.max;

  var stringIndexOf = function (string, searchValue, fromIndex) {
    if (fromIndex > string.length) return -1;
    if (searchValue === '') return fromIndex;
    return string.indexOf(searchValue, fromIndex);
  };

  // `String.prototype.replaceAll` method
  // https://tc39.es/ecma262/#sec-string.prototype.replaceall
  $$1({ target: 'String', proto: true }, {
    replaceAll: function replaceAll(searchValue, replaceValue) {
      var O = requireObjectCoercible(this);
      var IS_REG_EXP, flags, replacer, string, searchString, functionalReplace, searchLength, advanceBy, replacement;
      var position = 0;
      var endOfLastMatch = 0;
      var result = '';
      if (searchValue != null) {
        IS_REG_EXP = isRegExp(searchValue);
        if (IS_REG_EXP) {
          flags = toString(requireObjectCoercible('flags' in RegExpPrototype
            ? searchValue.flags
            : getRegExpFlags.call(searchValue)
          ));
          if (!~flags.indexOf('g')) throw TypeError('`.replaceAll` does not allow non-global regexes');
        }
        replacer = getMethod(searchValue, REPLACE);
        if (replacer) {
          return replacer.call(searchValue, O, replaceValue);
        }
      }
      string = toString(O);
      searchString = toString(searchValue);
      functionalReplace = isCallable(replaceValue);
      if (!functionalReplace) replaceValue = toString(replaceValue);
      searchLength = searchString.length;
      advanceBy = max(1, searchLength);
      position = stringIndexOf(string, searchString, 0);
      while (position !== -1) {
        if (functionalReplace) {
          replacement = toString(replaceValue(searchString, position, string));
        } else {
          replacement = getSubstitution(searchString, string, position, [], undefined, replaceValue);
        }
        result += string.slice(endOfLastMatch, position) + replacement;
        endOfLastMatch = position + searchLength;
        position = stringIndexOf(string, searchString, position + advanceBy);
      }
      if (endOfLastMatch < string.length) {
        result += string.slice(endOfLastMatch);
      }
      return result;
    }
  });

  function styleInject(css, ref) {
    if ( ref === void 0 ) ref = {};
    var insertAt = ref.insertAt;

    if (!css || typeof document === 'undefined') { return; }

    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';

    if (insertAt === 'top') {
      if (head.firstChild) {
        head.insertBefore(style, head.firstChild);
      } else {
        head.appendChild(style);
      }
    } else {
      head.appendChild(style);
    }

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }
  }

  var css_248z$1 = ".style-module_block__1wMKW {\n  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);\n  margin-bottom: 1rem;\n  background-color: #fff;\n  border-radius: 2px;\n  user-select: none;\n}\n\n.style-module_title__2d9pT {\n  padding: 1.333rem;\n  font-size: 1.333rem;\n  font-weight: 600;\n  color: #31445b;\n  border-bottom: 1px solid rgba(230, 230, 231, 0.5);\n  cursor: pointer;\n}\n\n.style-module_content__1-VKy {\n  padding: 1.333rem;\n}\n\n.style-module_header__2_Vg4 {\n  margin: 0;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 6px;\n}\n\n.style-module_header__2_Vg4 > a {\n  color: inherit;\n}\n\n.style-module_header__2_Vg4 > span {\n  font-size: 1rem;\n  color: #8a9aa9;\n}\n\n.style-module_section__1cMQp {\n  padding-bottom: 10px;\n  margin-bottom: 20px;\n  border-bottom: 1px solid rgba(230, 230, 231, 0.5);\n}\n\n.style-module_desc__3vV3f {\n  color: inherit;\n  opacity: 0.4;\n  font-weight: 500;\n  font-size: 0.8rem;\n  margin-top: -2px;\n}\n\n.style-module_date__3eZA- {\n  font-size: 1rem;\n  color: #8a9aa9;\n}\n\n.style-module_profileSidebar__bamb0 {\n  overflow: auto;\n  height: calc(100vh - 8rem);\n  padding-right: 16px;\n}\n";
  var styles$1 = {"block":"style-module_block__1wMKW","title":"style-module_title__2d9pT","content":"style-module_content__1-VKy","header":"style-module_header__2_Vg4","section":"style-module_section__1cMQp","desc":"style-module_desc__3vV3f","date":"style-module_date__3eZA-","profileSidebar":"style-module_profileSidebar__bamb0"};
  styleInject(css_248z$1);

  const formatDate = (dateInstance, format) => {
    const year = dateInstance.getFullYear();
    const month = dateInstance.getMonth() + 1;
    const date = dateInstance.getDate();
    return format.replaceAll("YYYY", year.toString()).replaceAll("MM", `${month}`.padStart(2, "0")).replaceAll("DD", `${date}`.padStart(2, "0")).replaceAll("M", month.toString()).replaceAll("D", date.toString());
  };

  class ProfileRenderer {
    constructor() {
      _defineProperty(this, "renderId", Math.random().toString(16).slice(2));

      _defineProperty(this, "sectionData", []);

      const containerEl = $("<div>").data("tampermonkey", this.renderId).addClass(styles$1.block);
      const titleEl = $("<div>").addClass(styles$1.title).text("活动状态");
      titleEl.on("click", () => {
        const isHidden = !contentEl.is(":hidden");
        contentEl.toggle();
        saveToStorage("profile_stat_hidden", isHidden);
      });
      const contentEl = $("<div>").addClass(styles$1.content);

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

    add(data) {
      const now = new Date().valueOf();
      const {
        key,
        node,
        title,
        link,
        startTime,
        endTime,
        desc
      } = data;
      const dateText = startTime && endTime ? `${formatDate(new Date(startTime), "MM/DD")} - ${formatDate(new Date(endTime), "MM/DD")}` : "";
      const descStyle = styles$1.desc;
      const dateStyle = styles$1.date;
      const headerEl = $("<h3>", {
        class: styles$1.header
      }).html(`<a href="${link}" target="__blank">${title}</a>` + (desc ? `<div class="${descStyle}">${desc}</div>` : " ") + `<div class="${dateStyle}">${dateText}</div>`);
      const sectionEl = $("<div>").addClass(styles$1.section).append(headerEl).append(node);
      data.node = sectionEl[0];
      this.sectionData = this.sectionData.filter(section => section.key !== key).concat([data]).sort((a, b) => {
        var _a$endTime, _b$endTime, _b$startTime, _a$startTime;

        const isFinishA = ((_a$endTime = a.endTime) !== null && _a$endTime !== void 0 ? _a$endTime : 0) > now;
        const isFinishB = ((_b$endTime = b.endTime) !== null && _b$endTime !== void 0 ? _b$endTime : 0) > now;
        if (isFinishA && !isFinishB) return -1;else if (isFinishB && !isFinishA) return 1;
        return ((_b$startTime = b.startTime) !== null && _b$startTime !== void 0 ? _b$startTime : 0) - ((_a$startTime = a.startTime) !== null && _a$startTime !== void 0 ? _a$startTime : 0);
      });
      this.render();
    }

    render() {
      this.mainEl.empty().append(this.sectionData.map(_ref => {
        let {
          node
        } = _ref;
        return node;
      }));
      this.mount();
    }

    mount() {
      if (!this.containerEl.is(":visible")) {
        const parentEl = $(".user-view .sticky-wrap");

        if (!parentEl.length) {
          setTimeout(() => this.mount(), 1000);
          return;
        }

        parentEl.addClass(styles$1.profileSidebar);
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

  const profileRenderer = new ProfileRenderer();

  function renderErrorMessage (error) {
    if (error instanceof RequestError) {
      const node = $("<div>").html(`<p>${error.text}</p>`)[0];
      profileRenderer.add({
        key: "error",
        node,
        title: "请求错误"
      });
    } else {
      const node = $("<div>").html(`<p>发现一个 Bug！<a href='https://juejin.cn/post/7014067898784169991'>反馈</a>给开发人员</p>`)[0];
      profileRenderer.add({
        key: "error",
        node,
        title: "处理错误"
      });
    }
  }

  var css_248z = ".activity-module_text-gray-600__2RpuA {\n  color: #8a9aa9;\n}\n.activity-module_text-gray-300__39jCA {\n  color: #939aa3a3;\n}\n.activity-module_text-center__3Ep0f {\n  text-align: center;\n}\n\n.activity-module_statistics__3dckC {\n  margin-top: 10px;\n}\n.activity-module_statistics__3dckC .activity-module_count__3M9TI {\n  font-size: 16px;\n}\n\n.activity-module_statistics__3dckC .activity-module_hint__3iHfR {\n  margin-top: 4px;\n}\n\n.activity-module_flex__TwuyD {\n  display: flex;\n}\n\n.activity-module_flex__TwuyD .activity-module_item__kQoGS {\n  flex: 1;\n  text-align: center;\n}\n\n.activity-module_progress__3L2_J {\n  --progress: 0;\n  border-radius: 20px;\n  padding: 0.5em 1em;\n  position: relative;\n  overflow: hidden;\n  background-color: #f4f5f5;\n}\n.activity-module_progress__3L2_J > i {\n  font-size: 1rem;\n  font-weight: 700;\n  position: relative;\n  color: hsl(0, 0%, calc((var(--progress) * 0.2 + 0.8) * 100%));\n}\n.activity-module_progress__3L2_J:before {\n  content: \"\";\n  position: absolute;\n  background-color: rgba(255, 255, 255, 0.25);\n  top: 0;\n  left: 0;\n  height: 100%;\n  width: calc(var(--progress) * 100%);\n  background-color: #007fff;\n}\n\n.activity-module_streakItem__3ITOC {\n  font-size: 1.75rem;\n  font-weight: 600;\n}\n\n.activity-module_streakItem__3ITOC > span {\n  font-size: 1rem;\n  font-weight: normal;\n  margin-left: 4px;\n}\n\n.activity-module_warningPopup__1CWrG {\n  position: relative;\n}\n\n.activity-module_warningPanel__Xz4vb {\n  position: absolute;\n  display: none;\n  padding: 0.6rem;\n  background-color: #fff;\n  border: 1px solid #f3f3f4;\n  border-radius: 2px;\n  box-shadow: 0 2px 4px 0 rgb(0 0 0 / 5%);\n  z-index: 1;\n}\n\n.activity-module_show__1_pIG {\n  display: block;\n}\n\n.activity-module_hide__ZiV8Z {\n  display: none;\n}\n\n.activity-module_encourageHeader__1pv8F {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.activity-module_encourageHeader__1pv8F > h3 {\n  margin-bottom: 0.5em;\n}\n.activity-module_encourageHeader__1pv8F > a {\n  color: #8a9aa9;\n}\n\n.activity-module_encourageEditor__1dr8y {\n  border-radius: 4px;\n  border: 1px solid #f4f5f5;\n  padding: 6px;\n  color: #31445b;\n}\n\n.activity-module_encouragePreview__UwssD {\n  margin: 0;\n  line-height: 1.5;\n  font-weight: 500;\n  color: #333;\n  letter-spacing: 1px;\n}\n";
  var styles = {"text-gray-600":"activity-module_text-gray-600__2RpuA","text-gray-300":"activity-module_text-gray-300__39jCA","text-center":"activity-module_text-center__3Ep0f","statistics":"activity-module_statistics__3dckC","count":"activity-module_count__3M9TI","hint":"activity-module_hint__3iHfR","flex":"activity-module_flex__TwuyD","item":"activity-module_item__kQoGS","progress":"activity-module_progress__3L2_J","streakItem":"activity-module_streakItem__3ITOC","warningPopup":"activity-module_warningPopup__1CWrG","warningPanel":"activity-module_warningPanel__Xz4vb","show":"activity-module_show__1_pIG","hide":"activity-module_hide__ZiV8Z","encourageHeader":"activity-module_encourageHeader__1pv8F","encourageEditor":"activity-module_encourageEditor__1dr8y","encouragePreview":"activity-module_encouragePreview__UwssD","textGray600":"activity-module_text-gray-600__2RpuA","textGray300":"activity-module_text-gray-300__39jCA","textCenter":"activity-module_text-center__3Ep0f"};
  styleInject(css_248z);

  var render = (_ref => {
    let {
      efficientArticles,
      dayCount,
      totalCount,
      invalidSummaries
    } = _ref;
    const articleCount = efficientArticles.length;
    const containerEl = $("<div>");
    containerEl.append(renderStreak(articleCount, dayCount));

    if (invalidSummaries.length > 0) {
      containerEl.append(renderWarning(invalidSummaries));
    }

    activityData.rules.forEach(rule => {
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
      desc: activityData.desc
    });
  });
  const InvalidStatus2Text = {
    time_range: "不在活动时间内",
    category_range: "不在限定分类内",
    word_count: "未达字数",
    slogan_fit: "暗号文本不符",
    link_fit: "暗号链接不符",
    tag_fit: "未选择指定标签"
  };

  const renderWarning = invalidSummaries => {
    const popup = $("<div>", {
      class: styles.warningPopup
    });
    const trigger = $("<a>", {
      class: styles.textGray600
    }).text(`${invalidSummaries.length} 篇`);
    const text = $("<p>", {
      class: styles.textGray300
    }).append("⚠️ 有", trigger, "文章未参加活动");
    const panel = $("<div>").addClass(styles.warningPanel);

    if (invalidSummaries.length > 0) {
      trigger.on("click", e => {
        e.stopPropagation();
        panel.toggleClass(styles.show);
      });
    }

    document.body.addEventListener("click", () => {
      panel.removeClass(styles.show);
    });
    const list = $("<table>");
    panel.append(list);
    invalidSummaries.forEach(_ref2 => {
      let {
        id,
        title,
        status
      } = _ref2;
      list.append(`<tr><td><a href="https://juejin.cn/post/${id}" target="_blank" onclick="event.stopPropagation()">${title}</a></td><td>${InvalidStatus2Text[status]}</td></tr>`);
    });
    popup.append(text);
    popup.append(panel);
    return popup;
  };

  const renderOneRule = (_ref3, articleCount, dayCount) => {
    let {
      rewards
    } = _ref3;
    const isLadder = rewards.length > 1;
    const containerEl = $("<p>"); // 当前奖励
    // 下一等级
    // 说明

    if (isLadder) {
      const maxLevel = rewards.length;
      let level = -1;

      for (let i = 0; i < maxLevel; i++) {
        const {
          count = 0,
          days = 0
        } = rewards[i];
        if (dayCount >= days && articleCount >= count) level = i;else break;
      }

      const currentReward = rewards[level];
      const nextReward = rewards[level + 1];

      if (currentReward) {
        containerEl.append(renderProgress(currentReward.name, 1));
      } else {
        const {
          name,
          days = 0,
          count = 0
        } = rewards[0];
        containerEl.append(renderProgress(name, Math.min(1, dayCount / Math.max(1, days)) * Math.min(articleCount / Math.max(1, count), 1)));
      }

      if (nextReward) {
        const {
          count,
          days,
          name
        } = nextReward;
        const nextRuleText = [days ? `${days} 天` : "", count ? `${count} 篇` : ""].filter(Boolean).join("，");
        const nextRewardEl = $("<p>", {
          class: styles.flex
        }).append($("<div>", {
          class: styles["text-gray-600"]
        }).addClass(styles.item).text(`下一等级：${name}`)).append($("<div>", {
          class: styles["text-gray-300"]
        }).addClass(styles.item).text(nextRuleText ? `目标：更文 ${nextRuleText}` : ""));
        containerEl.append(nextRewardEl);
      }

      if (currentReward !== null && currentReward !== void 0 && currentReward.text) {
        containerEl.append($("<p>").text(currentReward === null || currentReward === void 0 ? void 0 : currentReward.text));
      }
    } else {
      const reward = rewards[0];
      const {
        name,
        count = 0,
        days = 0,
        text
      } = reward;

      if (name) {
        containerEl.append(renderProgress(name, Math.min(1, dayCount / Math.max(1, days)) * Math.min(articleCount / Math.max(1, count), 1)));
      }

      if (text) {
        containerEl.append($("<p>", {
          class: styles["text-gray-300"]
        }).addClass(styles.textCenter).text(text));
      }
    }

    return containerEl[0];
  };

  const renderProgress = (text, progress) => {
    return $("<div>").addClass(styles.progress).append($("<i>").text(text)).css("--progress", progress);
  };

  const renderStreak = (articleCount, dayCount) => {
    const containerEl = $("<p>").addClass(styles.flex);
    containerEl.append($("<div>").addClass(styles.item).addClass(styles.streakItem).text(`${articleCount}`).append($("<span>").text("篇").addClass(styles["text-gray-300"])));
    containerEl.append($("<div>").addClass(styles.item).addClass(styles.streakItem).text(`${dayCount}`).append($("<span>").text("天").addClass(styles["text-gray-300"])));
    return containerEl[0];
  };

  const renderStatistics = totalCount => {
    const countLocale = {
      view: "阅读量",
      comment: "评论量",
      digg: "点赞",
      collect: "收藏"
    };
    const containerEl = $("<p>").addClass(styles.statistics).addClass(styles.flex);
    Object.entries(totalCount).forEach(_ref4 => {
      let [key, count] = _ref4;
      const itemEl = $("<div>").addClass(styles.item);
      const countEl = $("<div>").addClass(styles.count).text(`${count}`);
      const hintEl = $("<div>").addClass(styles.hint).addClass(styles["text-gray-300"]).text(`${countLocale[key]}`);
      itemEl.append(countEl).append(hintEl);
      containerEl.append(itemEl);
    });
    return containerEl[0];
  };

  function renderEncourage() {
    const containerEl = $("<section>");
    const $header = $("<header>").addClass(styles["encourageHeader"]);
    containerEl.append($header.append($("<h3>").addClass(styles["text-gray-600"]).text("我的目标")));
    const storageName = "post_target";
    const writtenTarget = getFromStorage(storageName);
    const $targetPreview = $("<p>").addClass(styles["encouragePreview"]).text(writtenTarget !== null && writtenTarget !== void 0 ? writtenTarget : "从写下一篇文章开始，一步一步养成写作习惯");
    containerEl.append($targetPreview);

    if (!writtenTarget) {
      const $actionBtn = $("<a>").text("设定");
      const $targetEditor = $("<textarea>").addClass(styles["encourageEditor"]).attr("placeholder", "设定目标，回车确定");

      function submitNewTarget() {
        var _$targetEditor$val;

        const newTarget = (_$targetEditor$val = $targetEditor.val()) === null || _$targetEditor$val === void 0 ? void 0 : _$targetEditor$val.toString().trim();

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
        var _$targetEditor$val2;

        const newTarget = (_$targetEditor$val2 = $targetEditor.val()) === null || _$targetEditor$val2 === void 0 ? void 0 : _$targetEditor$val2.toString().trim();
        console.log(newTarget);

        if (!newTarget || confirm(`确认放弃编辑？`)) {
          $targetEditor.val("").hide();
          $targetPreview.show();
        } else {
          $targetEditor.trigger("focus");
        }
      }

      $targetEditor.on("keydown", event => {
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

  const articleStoragePath = `juejin-post-tracker/article_contents`;
  const articleContentMap = new Map(Object.entries(initStorage(articleStoragePath, 1, [])));

  async function fetch(userId) {
    const {
      startTimeStamp,
      endTimeStamp,
      signSlogan,
      signLink,
      tagNames
    } = activityData;
    const articleList = await fetchArticleList(userId, startTimeStamp, endTimeStamp);
    const articleDetails = await Promise.all(articleList.filter(_ref => {
      var _articleContentMap$ge, _articleContentMap$ge2;

      let {
        id,
        modifiedTime
      } = _ref;
      return !articleContentMap.has(id) || ((_articleContentMap$ge = articleContentMap.get(id)) === null || _articleContentMap$ge === void 0 ? void 0 : _articleContentMap$ge["modifiedTimeStamp"]) !== modifiedTime || ((_articleContentMap$ge2 = articleContentMap.get(id)) === null || _articleContentMap$ge2 === void 0 ? void 0 : _articleContentMap$ge2["sloganFit"]) === undefined;
    }).map(_ref2 => {
      let {
        id
      } = _ref2;
      return fetchArticleDetail(id);
    }));
    articleDetails.forEach(_ref3 => {
      let {
        data
      } = _ref3;
      const {
        article_info
      } = data;
      const {
        article_id,
        mark_content,
        mtime
      } = article_info;
      const content = nomatter_1(mark_content).trim();
      articleContentMap.set(article_id, {
        sloganFit: new RegExp(signSlogan).test(content),
        linkFit: new RegExp(`${signLink}((?:\/|$)?)`).test(content),
        count: dist.countWords(mark_content),
        modifiedTimeStamp: mtime * 1000
      });
    });
    saveToStorage(articleStoragePath, Object.fromEntries(articleContentMap));
    return articleList.map(article => {
      var _contentInfo$sloganFi, _contentInfo$linkFit, _contentInfo$count;

      const articleTags = new Set(article.tags.filter(tag => tagNames.includes(tag.tag_name)).map(tag => tag.tag_id));
      const contentInfo = articleContentMap.get(article.id);
      return { ...article,
        sloganFit: (_contentInfo$sloganFi = contentInfo === null || contentInfo === void 0 ? void 0 : contentInfo.sloganFit) !== null && _contentInfo$sloganFi !== void 0 ? _contentInfo$sloganFi : false,
        linkFit: (_contentInfo$linkFit = contentInfo === null || contentInfo === void 0 ? void 0 : contentInfo.linkFit) !== null && _contentInfo$linkFit !== void 0 ? _contentInfo$linkFit : false,
        count: (_contentInfo$count = contentInfo === null || contentInfo === void 0 ? void 0 : contentInfo.count) !== null && _contentInfo$count !== void 0 ? _contentInfo$count : 0,
        tagFit: articleTags.size === tagNames.length
      };
    });
  }

  function statistics(articles) {
    const {
      startTimeStamp,
      wordCount,
      categories
    } = activityData;
    const efficientArticles = [];
    const invalidSummaries = [];
    articles.forEach(article => {
      const {
        id,
        title,
        publishTime,
        category,
        count,
        sloganFit,
        linkFit,
        tagFit
      } = article;

      if (publishTime < startTimeStamp) {
        invalidSummaries.push({
          id,
          title,
          status: "time_range"
        });
        return;
      }

      if (!categories.includes(category)) {
        invalidSummaries.push({
          id,
          title,
          status: "category_range"
        });
        return;
      }

      if (count < wordCount) {
        invalidSummaries.push({
          id,
          title,
          status: "word_count"
        });
        return;
      }

      if (!sloganFit) {
        invalidSummaries.push({
          id,
          title,
          status: "slogan_fit"
        });
        return;
      }

      if (!linkFit) {
        invalidSummaries.push({
          id,
          title,
          status: "link_fit"
        });
        return;
      }

      if (!tagFit) {
        invalidSummaries.push({
          id,
          title,
          status: "tag_fit"
        });
        return;
      }

      efficientArticles.push(article);
    });
    const publishTimeGroup = [];
    const totalCount = {
      view: 0,
      digg: 0,
      comment: 0,
      collect: 0
    };
    efficientArticles.forEach(_ref4 => {
      var _publishTimeGroup$day;

      let {
        publishTime,
        view_count,
        digg_count,
        comment_count,
        collect_count
      } = _ref4;
      const day = Math.floor((publishTime - startTimeStamp) / (24 * 60 * 60 * 1000));
      publishTimeGroup[day] = ((_publishTimeGroup$day = publishTimeGroup[day]) !== null && _publishTimeGroup$day !== void 0 ? _publishTimeGroup$day : 0) + 1;
      totalCount.view += view_count;
      totalCount.digg += digg_count;
      totalCount.collect += collect_count;
      totalCount.comment += comment_count;
    });
    const dayCount = publishTimeGroup.filter(Boolean).length;
    return {
      totalCount,
      dayCount,
      efficientArticles,
      invalidSummaries
    };
  }

  async function renderStats(myUserId) {
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

  const plugin = {
    onLoaded() {
      updateUserId().then(() => {
        const myUserId = getUserId();
        renderStats(myUserId);
      });
    },

    async onRouteChange(prevRouterPathname, currentRouterPathname) {
      const myUserId = getUserId();

      if (!inSpecificProfilePage(prevRouterPathname, myUserId) && inSpecificProfilePage(currentRouterPathname, myUserId)) {
        renderStats(myUserId);
      }
    }

  };

  return plugin;

})();
