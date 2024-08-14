//Wed Aug 14 2024 13:00:58 GMT+0000 (Coordinated Universal Time)
//Base:https://github.com/echo094/decode-js
//Modify:https://github.com/smallfawn/decode_action
const $ = new Env("店铺签到监控（超级无线/超级会员）");
const jdCookie = require("./jdCookie"),
  common = require("./utils/Rebels_jdCommon"),
  notify = require("./utils/Rebels_sendJDNotify"),
  getToken = require("./utils/Rebels_Token"),
  {
    wuxianDefense
  } = require("./utils/Rebels_H"),
  {
    wuxian_savePrize
  } = require("./utils/Rebels_savePrize"),
  activityUrl = process.env.jd_wx_shopSign_activityUrl || "",
  joinMember = process.env.jd_wx_shopSign_joinMember === "true",
  isNotify = process.env.jd_wx_shopSign_notify === "true";
let cookie = "",
  activityCookie = "",
  originCookie = "";
const cookiesArr = Object.keys(jdCookie).map(_0x5bafbf => jdCookie[_0x5bafbf]).filter(_0x15ee49 => _0x15ee49);
!cookiesArr[0] && ($.msg($.name, "【提示】请先获取Cookie"), process.exit(1));
!(async () => {
  console.log("==========" + $.name + "变量开启状态==========");
  console.log("代理开关: [" + common.getProxyStatus() + "]");
  console.log("是否入会：[" + joinMember + "]");
  console.log("是否推送通知：[" + isNotify + "]");
  console.log("==========" + $.name + "变量状态结束==========");
  if (!activityUrl) {
    console.log("⚠ 请先定义必要的环境变量后再运行脚本");
    return;
  }
  const _0xdf5506 = common.parseUrl(activityUrl);
  if (!_0xdf5506) {
    console.log("⚠ 请填写格式正确的链接");
    return;
  }
  $.activityUrl = activityUrl;
  $.activityId = common.getUrlParameter(activityUrl, "activityId");
  $.hostname = _0xdf5506?.["hostname"];
  if ($.hostname) {
    if ($.hostname.includes("cjhy")) {
      $.activityMode = "cjhy";
    } else {
      if ($.hostname.includes("lzkj")) {
        $.activityMode = "lzkj";
        $.hostname = "lzkj-isv.isvjd.com";
      } else {
        $.hostname.includes("lorealjdcampaign") && ($.activityMode = "lorealjdcampaign");
      }
    }
    $.activityMode === "lorealjdcampaign" ? $.baseUrl = "https://" + $.hostname + "/prod/cc/cjwx" : $.baseUrl = "https://" + $.hostname;
    $.origin = $.baseUrl;
  }
  if (!$.activityId || !$.activityMode || !$.hostname) {
    console.log("⚠ 请填写格式正确的变量");
    return;
  }
  notify.config({
    title: $.name
  });
  console.log("活动入口：" + $.activityUrl);
  for (let _0x45d7d1 = 0; _0x45d7d1 < cookiesArr.length; _0x45d7d1++) {
    $.index = _0x45d7d1 + 1;
    cookie = cookiesArr[_0x45d7d1];
    originCookie = cookiesArr[_0x45d7d1];
    common.setCookie(cookie);
    $.UserName = decodeURIComponent(common.getCookieValue(cookie, "pt_pin"));
    $.UA = common.genUA($.UserName);
    $.UUID = common.genUuid("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    $.te = Math.floor(Math.random() * 9000) + 1000;
    $.message = notify.create($.index, $.UserName);
    $.nickName = "";
    console.log("\n******开始【京东账号" + $.index + "】" + ($.nickName || $.UserName) + "******\n");
    await Main();
    common.unsetCookie();
    if ($.outFlag || $.runEnd) {
      break;
    }
  }
  isNotify && notify.getMessage() && (notify.appendContent("\n活动地址：" + $.activityUrl), await notify.push());
})().catch(_0x496ec6 => $.logErr(_0x496ec6)).finally(() => $.done());
async function Main() {
  try {
    $.skipRun = false;
    $.isMember = false;
    $.needJoinMember = false;
    $.secretPin = "";
    $.pinToken = "";
    $.LZ_AES_PIN = "";
    activityCookie = "";
    if ($.skipRun || $.runEnd || $.outFlag) {
      return;
    }
    await getFirstLZCK($.activityUrl);
    await $.wait(500);
    if ($.skipRun) {
      console.log("获取 LZ_TOKEN 失败！");
      $.message.fix("获取[LZ_TOKEN]失败");
      return;
    }
    if ($.outFlag || $.runEnd) {
      return;
    }
    if (!$.venderId) {
      await sendRequest("getSimpleActInfoVo");
      if (!$.venderId) {
        console.log("getSimpleActInfoVo 未能获取店铺信息");
        $.message.fix("未能获取店铺信息");
        $.runEnd = true;
        return;
      }
    }
    $.jdToken = await getToken(originCookie, $.baseUrl);
    if (!$.jdToken) {
      console.log("获取 Token 失败！");
      $.message.fix("获取[Token]失败");
      return;
    }
    if ($.activityMode === "cjhy") {
      await sendRequest("initPinToken");
      if ($.runEnd || $.skipRun || $.outFlag) {
        return;
      }
      if (!$.pinToken) {
        console.log("获取 pinToken 失败！");
        $.message.fix("获取[pinToken]失败");
        return;
      }
    } else {
      await sendRequest("getMyPing");
      if ($.runEnd || $.skipRun || $.outFlag) {
        return;
      }
      if (!$.secretPin) {
        console.log("未能获取用户鉴权信息！");
        $.message.fix("未能获取用户鉴权信息");
        return;
      }
    }
    $.activityMode === "cjhy" ? await $.wait(1000) : await $.wait(500);
    switch ($.activityMode) {
      case "lzkj":
      case "lorealjdcampaign":
        $.formatPin = $.secretPin;
        break;
      case "cjhy":
        $.formatPin = encodeURIComponent($.secretPin);
        break;
    }
    switch ($.activityMode) {
      case "lzkj":
      case "lorealjdcampaign":
        await sendRequest("accessLogWithAD");
        break;
      case "cjhy":
        await sendRequest("accessLog");
        break;
    }
    if (joinMember) {
      switch ($.activityMode) {
        case "lzkj":
        case "lorealjdcampaign":
          await sendRequest("getActMemberInfo");
          break;
        case "cjhy":
          await sendRequest("getOpenCardInfo");
          break;
      }
      if ($.outFlag || $.skipRun) {
        return;
      }
      if (!$.isMember) {
        const _0x24a248 = await common.joinShopMember($.venderId);
        _0x24a248 && (console.log("加入店铺会员成功"), $.isMember = true);
      }
      $.activityMode === "cjhy" ? await $.wait(1000) : await $.wait(500);
    }
    $.index === 1 && ($.activityUrl.indexOf("/sign/sevenDay/signActivity") !== -1 ? await sendRequest("getSignInfo") : await sendRequest("getActivity"));
    if ($.outFlag || $.skipRun || $.runEnd) {
      return;
    }
    $.activityMode === "cjhy" ? await $.wait(1000) : await $.wait(500);
    for (let _0x2f55d8 = 0; _0x2f55d8 < 5; _0x2f55d8++) {
      await sendRequest("signUp");
      if ($.signStop) {
        break;
      }
      $.activityMode === "cjhy" ? await $.wait(1000) : await $.wait(500);
    }
    await sendRequest("attendLog");
  } catch (_0x38335f) {
    console.log("❌ 脚本运行遇到了错误\n" + _0x38335f);
  }
}
async function handleResponse(_0x429932, _0x525edf) {
  try {
    switch (_0x429932) {
      case "getMyPing":
        if (_0x525edf.result === true && _0x525edf.data) {
          $.secretPin = _0x525edf.data?.["secretPin"];
          $.nickname = _0x525edf.data?.["nickname"];
        } else {
          _0x525edf.errorMessage ? (console.log(_0x429932 + " " + _0x525edf.errorMessage), $.message.fix(_0x525edf.errorMessage)) : console.log("❓" + _0x429932 + " " + JSON.stringify(_0x525edf));
        }
        break;
      case "initPinToken":
        if (_0x525edf.result === true && _0x525edf.data) {
          $.secretPin = _0x525edf.data?.["secretPin"];
          $.nickname = _0x525edf.data?.["nickname"];
        } else {
          _0x525edf.errorMessage ? (console.log(_0x429932 + " " + _0x525edf.errorMessage), $.message.fix(_0x525edf.errorMessage)) : console.log("❓" + _0x429932 + " " + JSON.stringify(_0x525edf));
        }
        break;
      case "getSimpleActInfoVo":
        if (_0x525edf.result === true && _0x525edf.data) {
          $.venderId = _0x525edf.data?.["venderId"];
          $.shopId = _0x525edf.data?.["shopId"];
          $.activityType = _0x525edf.data?.["activityType"];
        } else {
          _0x525edf.errorMessage ? console.log(_0x429932 + " " + _0x525edf.errorMessage) : console.log("❓" + _0x429932 + " " + JSON.stringify(_0x525edf));
        }
        break;
      case "getActMemberInfo":
      case "getOpenCardInfo":
        if (_0x525edf.result === true) {
          if (_0x525edf.data) {
            if (_0x525edf.data.hasOwnProperty("openCard")) {
              $.isMember = _0x525edf.data.openCard;
            } else {
              _0x525edf.data.hasOwnProperty("openedCard") && ($.isMember = _0x525edf.data.openedCard);
            }
            if (typeof $.isMember === "number") {
              $.isMember = $.isMember === 1;
            } else {
              typeof $.isMember === "undefined" && ($.isMember = false);
            }
          } else {
            $.isMember = true;
          }
        } else {
          if (_0x525edf.errorMessage) {
            if (!(_0x525edf.errorMessage.includes("擦肩") && !_0x525edf?.["data"])) {
              console.log(_0x429932 + " " + _0x525edf.errorMessage);
            }
          } else {
            $.isMember = false;
          }
        }
        break;
      case "getShopInfo":
        if (_0x525edf.isOk === true && _0x525edf.shopInfo) {
          $.shopName = _0x525edf?.["shopInfo"]?.["shopName"];
        } else {
          _0x525edf.msg ? console.log(_0x525edf.msg) : console.log("❓" + _0x429932 + " " + JSON.stringify(_0x525edf));
        }
        break;
      case "getSignInfo":
        if (_0x525edf) {
          const _0x4c485d = "活动时间：" + $.time("yyyy-MM-dd HH:mm:ss", _0x525edf?.["startTime"]) + " 至 " + $.time("yyyy-MM-dd HH:mm:ss", _0x525edf?.["endTime"]);
          console.log(_0x4c485d);
          notify.appendContent("\n" + _0x4c485d);
          const _0x1d11e8 = _0x525edf.giftConditions;
          if (_0x1d11e8 && typeof _0x1d11e8 === "object" && _0x1d11e8.length > 0) {
            let _0x44cf6b = "累计奖励：";
            for (let _0x2ed02d of _0x1d11e8) {
              const _0x37ba5a = _0x2ed02d.gift,
                _0x52191f = _0x2ed02d.dayNum;
              if (_0x37ba5a && _0x52191f) {
                let _0x3caf6c = _0x37ba5a.giftName;
                switch (_0x37ba5a.giftType) {
                  case 6:
                  case 9:
                  case 13:
                  case 14:
                  case 15:
                  case 16:
                    break;
                  case 7:
                    _0x3caf6c += "[实物]";
                    break;
                  case 8:
                    _0x3caf6c += "[专享价]";
                    break;
                  default:
                    _0x3caf6c.includes("券") && (_0x3caf6c = "优惠券");
                    break;
                }
                _0x37ba5a.giftTotal ? _0x44cf6b += "\n  签到" + _0x52191f + "天，" + _0x3caf6c + "（" + _0x37ba5a.giftTotal + "份" + (_0x37ba5a.insufficient ? "，已发完" : "") + "）" : _0x44cf6b += "\n  签到" + _0x52191f + "天，" + _0x3caf6c + (_0x37ba5a.insufficient ? "（已发完）" : "");
              }
            }
            notify.appendContent("\n" + _0x44cf6b);
            console.log(_0x44cf6b + "\n");
          }
          let _0x29f1fc = _0x525edf?.["startTime"],
            _0x49500d = _0x525edf?.["endTime"];
          const _0x42984d = Date.now();
          if (_0x49500d && _0x42984d > _0x49500d) {
            const _0x215b37 = $.time("yyyy-MM-dd HH:mm", _0x49500d);
            console.log("活动已于 " + _0x215b37 + " 结束，下次早点来吧~");
            $.message.fix("活动已结束，结束时间：" + _0x215b37);
            $.runEnd = true;
            return;
          }
          if (_0x29f1fc && _0x42984d < _0x29f1fc) {
            const _0x46a61e = $.time("yyyy-MM-dd HH:mm", _0x29f1fc);
            console.log("活动将在 " + _0x46a61e + " 开始，晚点再来吧~");
            $.message.fix("活动尚未开始，开始时间：" + _0x46a61e);
            $.runEnd = true;
            return;
          }
        } else {
          console.log("没有获取到活动信息");
          $.message.fix("没有获取到活动信息");
          $.skipRun = true;
        }
        break;
      case "getActivity":
        if (_0x525edf.isOk === true && _0x525edf.act) {
          const _0x34e2b9 = "活动时间：" + _0x525edf.act?.["actTimeStr"];
          console.log(_0x34e2b9);
          notify.appendContent("\n" + _0x34e2b9);
          const _0x40a013 = _0x525edf.act?.["wxSignActivityGiftBean"];
          if (_0x40a013) {
            const _0x5b08f7 = _0x40a013?.["gift"];
            if (_0x5b08f7) {
              let _0xe84c78 = _0x5b08f7?.["giftName"];
              switch (_0x5b08f7?.["giftType"]) {
                case 6:
                case 9:
                case 13:
                case 14:
                case 15:
                case 16:
                  break;
                case 7:
                  _0xe84c78 += "[实物]";
                  break;
                case 8:
                  _0xe84c78 += "[专享价]";
                  break;
                default:
                  _0xe84c78.includes("券") && (_0xe84c78 = "优惠券");
                  break;
              }
              console.log("每日奖励：" + _0xe84c78 + "（" + _0x5b08f7?.["giftTotal"] + "份" + (_0x5b08f7?.["insufficient"] ? "，已发完" : "") + "）");
              notify.appendContent("\n每日奖励：" + _0xe84c78 + "（" + _0x5b08f7?.["giftTotal"] + "份" + (_0x5b08f7?.["insufficient"] ? "，已发完" : "") + "）");
            }
            const _0x5a8a26 = _0x40a013?.["giftConditions"];
            if (_0x5a8a26 && typeof _0x5a8a26 === "object" && _0x5a8a26.length > 0) {
              let _0x573113 = "累计奖励：";
              for (let _0x343fcc of _0x5a8a26) {
                const _0x4dc043 = _0x343fcc?.["gift"],
                  _0x206d2c = _0x343fcc?.["dayNum"];
                if (_0x4dc043 && _0x206d2c) {
                  let _0x2d8e0c = _0x4dc043?.["giftName"];
                  switch (_0x4dc043.giftType) {
                    case 6:
                    case 9:
                    case 13:
                    case 14:
                    case 15:
                    case 16:
                      break;
                    case 7:
                      _0x2d8e0c += "[实物]";
                      break;
                    case 8:
                      _0x2d8e0c += "[专享价]";
                      break;
                    default:
                      _0x2d8e0c.includes("券") && (_0x2d8e0c = "优惠券");
                      break;
                  }
                  _0x573113 += "\n  签到" + _0x206d2c + "天，" + _0x2d8e0c + "（" + _0x4dc043.giftTotal + "份" + (_0x4dc043.insufficient ? "，已发完" : "") + "）";
                }
              }
              notify.appendContent("\n" + _0x573113);
              console.log(_0x573113 + "\n");
            }
          }
          let _0x4744b8 = _0x525edf.act?.["startTime"],
            _0x43023e = _0x525edf.act?.["endTime"];
          const _0x4e217 = Date.now();
          if (_0x43023e && _0x4e217 > _0x43023e) {
            const _0x3ce8eb = $.time("yyyy-MM-dd HH:mm", _0x43023e);
            console.log("活动已于 " + _0x3ce8eb + " 结束，下次早点来吧~");
            $.message.fix("活动已结束，结束时间：" + _0x3ce8eb);
            $.runEnd = true;
            return;
          }
          if (_0x4744b8 && _0x4e217 < _0x4744b8) {
            const _0x250cf2 = $.time("yyyy-MM-dd HH:mm", _0x4744b8);
            console.log("活动将在 " + _0x250cf2 + " 开始，晚点再来吧~");
            $.message.fix("活动尚未开始，开始时间：" + _0x250cf2);
            $.runEnd = true;
            return;
          }
        } else {
          _0x525edf.msg ? (console.log(_0x525edf.msg), $.message.fix(_0x525edf.msg), $.skipRun = true) : console.log("❓" + _0x429932 + " " + JSON.stringify(_0x525edf));
        }
        break;
      case "signUp":
        if (_0x525edf.isOk) {
          $.signStop = true;
          const _0x1985f7 = activityUrl.indexOf("/sign/sevenDay/signActivity") !== -1 ? _0x525edf?.["signResult"]?.["gift"] : _0x525edf?.["gift"];
          if (_0x1985f7) {
            const _0x192959 = _0x1985f7?.["insufficient"];
            process.stdout.write("签到成功 ➜ ");
            if (!_0x192959) {
              switch (parseInt(_0x1985f7.giftType)) {
                case 6:
                  console.log("🎉 " + _0x1985f7.giftName + " 🐶");
                  break;
                case 7:
                  const _0x2cc459 = _0x525edf.addressId;
                  let _0x292fcb = _0x1985f7.giftName;
                  console.log("🎉 恭喜获得实物~");
                  console.log("奖品名称：" + _0x292fcb);
                  console.log("参考价值：" + _0x1985f7?.["priceInfo"] + "（元）");
                  _0x1985f7?.["showImage"] && console.log("预览图片：" + _0x1985f7.showImage);
                  const _0x283c27 = {
                      baseUrl: $.baseUrl,
                      cookie: activityCookie,
                      ua: $.UA,
                      activityId: $.activityId,
                      activityType: $.activityType,
                      venderId: $.venderId,
                      secretPin: $.secretPin,
                      prizeName: _0x292fcb,
                      generateId: _0x2cc459,
                      activityUrl: $.activityUrl
                    },
                    _0x2ff2d2 = await wuxian_savePrize(_0x283c27);
                  !isNotify && _0x2ff2d2 && (await notify.sendNotify($.name + "中奖通知", "【京东账号" + $.index + "】" + $.nickName + "\n抽中实物 " + _0x292fcb + "，已成功自动登记收货地址\n\n" + $.activityUrl));
                  break;
                case 8:
                  console.log("🗑️ 专享价");
                  break;
                case 9:
                  console.log("🗑️ " + _0x1985f7.giftName + " 🎟️");
                  break;
                case 13:
                case 14:
                case 15:
                  console.log("🎉 恭喜获得" + _0x1985f7.giftName + " 🎁");
                  !isNotify && (await notify.sendNotify($.name + "中奖通知", "【京东账号" + $.index + "】" + $.nickName + "\n抽中 " + _0x1985f7.giftName + "\n\n" + $.activityUrl));
                  break;
                case 16:
                  console.log("🎉 " + _0x1985f7.priceInfo + " 🧧");
                  break;
                default:
                  _0x1985f7.giftName.includes("券") ? console.log("🗑️ 优惠券") : console.log("获得：" + _0x1985f7.giftName);
                  break;
              }
            } else {
              _0x1985f7?.["giftName"] ? console.log("未中奖（原奖品 \"" + _0x1985f7.giftName + "\" 已发完）") : console.log("未中奖（奖品已发完）");
            }
          } else {
            console.log("签到成功");
          }
        } else {
          if (_0x525edf.msg) {
            !["火爆", "擦肩", "缓存", "数据忙"].some(_0x28be6b => _0x525edf.msg.includes(_0x28be6b)) && (console.log("签到失败 ➜ " + _0x525edf.msg), $.signStop = true);
            for (let _0x2033a9 of ["未开始", "结束", "不存在", "不在"]) {
              if (_0x525edf.msg.includes(_0x2033a9)) {
                $.signStop = true;
                $.runEnd = true;
                break;
              }
            }
          } else {
            $.signStop = true;
            console.log("❓" + _0x429932 + " " + JSON.stringify(_0x525edf));
          }
        }
        break;
    }
  } catch (_0x24152b) {
    console.log("❌ 未能正确处理 " + _0x429932 + " 请求响应 " + (_0x24152b.message || _0x24152b));
  }
}
async function sendRequest(_0x4e6d41) {
  if ($.runEnd || $.outFlag) {
    return;
  }
  let _0x388456 = $.baseUrl,
    _0xebafbd = null,
    _0x456a4d = null,
    _0x116776 = null,
    _0x11bf10 = "POST";
  switch (_0x4e6d41) {
    case "getMyPing":
      _0x388456 += "/customer/getMyPing";
      _0xebafbd = {
        token: $.jdToken,
        fromType: "APP",
        userId: $.venderId
      };
      break;
    case "getSimpleActInfoVo":
      _0x388456 += "/customer/getSimpleActInfoVo";
      _0xebafbd = {
        activityId: $.activityId
      };
      break;
    case "initPinToken":
      _0x11bf10 = "GET";
      _0x388456 += "/customer/initPinToken";
      _0x116776 = {
        status: "1",
        activityId: $.activityId,
        jdToken: $.jdToken,
        source: "01",
        venderId: $.venderId,
        uuid: $.UUID,
        clientTime: Date.now()
      };
      break;
    case "accessLog":
      _0x388456 += "/common/accessLog";
      _0xebafbd = {
        venderId: $.venderId,
        code: $.activityType,
        pin: $.formatPin,
        activityId: $.activityId,
        pageUrl: $.activityUrl,
        subType: "app",
        adSource: ""
      };
      break;
    case "accessLogWithAD":
      _0x388456 += "/common/accessLogWithAD";
      _0xebafbd = {
        venderId: $.venderId,
        code: $.activityType,
        pin: $.formatPin,
        activityId: $.activityId,
        pageUrl: $.activityUrl,
        subType: "app"
      };
      break;
    case "getActMemberInfo":
      _0x388456 += "/wxCommonInfo/getActMemberInfo";
      _0xebafbd = {
        activityId: $.activity,
        venderId: $.venderId,
        pin: $.formatPin
      };
      break;
    case "getOpenCardInfo":
      _0x388456 += "/mc/new/brandCard/common/shopAndBrand/getOpenCardInfo";
      _0xebafbd = {
        venderId: $.venderId,
        buyerPin: $.formatPin,
        activityType: $.activityType
      };
      break;
    case "getShopInfo":
      _0x388456 += "/sign/wx/getShopInfo";
      _0xebafbd = {
        activityId: $.activityId
      };
      break;
    case "getSignInfo":
      _0x388456 += "/sign/sevenDay/wx/getSignInfo";
      _0xebafbd = {
        actId: $.activityId,
        venderId: $.venderId,
        pin: $.formatPin
      };
      break;
    case "getActivity":
      _0x388456 += "/sign/wx/getActivity";
      _0xebafbd = {
        actId: $.activityId,
        venderId: $.venderId
      };
      break;
    case "signUp":
      $.activityUrl.indexOf("/sign/sevenDay/signActivity") != -1 ? _0x388456 += "/sign/sevenDay/wx/signUp" : _0x388456 += "/sign/wx/signUp";
      _0xebafbd = {
        actId: $.activityId,
        pin: $.formatPin
      };
      break;
    case "attendLog":
      _0x388456 += "/common/attendLog";
      _0xebafbd = {
        venderId: $.venderId,
        activityType: $.activityType,
        activityId: $.activityId,
        pin: $.formatPin,
        clientType: "",
        uuid: ""
      };
      break;
    default:
      console.log("❌ 未知请求 " + _0x4e6d41);
      return;
  }
  const _0x508e42 = $.activityMode === "cjhy" && wuxianDefense.isDefenseApi(_0x388456.replace($.baseUrl, "").split("?")[0]);
  _0x508e42 && (_0xebafbd?.["pin"] && (_0xebafbd.pin = encodeURIComponent($.secretPin)), _0x456a4d = {
    ecyText: wuxianDefense.encrypt({
      actId: $.activityId,
      ..._0xebafbd
    }, $.pinToken, $.te)
  });
  const _0x4eaca6 = {
    url: _0x388456,
    method: _0x11bf10,
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-CN,zh;q=0.9",
      Connection: "keep-alive",
      "Content-Type": _0x508e42 ? "application/json" : "application/x-www-form-urlencoded",
      Cookie: activityCookie.trim(),
      Origin: $.origin,
      Referer: $.activityUrl,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent": $.UA,
      "X-Requested-With": "XMLHttpRequest"
    },
    params: _0x116776,
    data: _0x508e42 ? _0x456a4d : _0xebafbd,
    timeout: 30000
  };
  _0x11bf10 === "GET" && (delete _0x4eaca6.data, delete _0x4eaca6.headers["Content-Type"]);
  const _0x413759 = 3;
  let _0x54237a = 0,
    _0x11a0ff = null,
    _0x440d29 = false;
  while (_0x54237a < _0x413759) {
    _0x54237a > 0 && (await $.wait(1000));
    const _0x59c4c6 = await common.request(_0x4eaca6);
    if (!_0x59c4c6.success) {
      _0x11a0ff = _0x4e6d41 + " 请求失败 ➜ " + _0x59c4c6.error;
      _0x54237a++;
      if (_0x59c4c6.status) {
        if (_0x59c4c6.status === 500 && _0x508e42) {
          _0x4eaca6.data = {
            ecyText: wuxianDefense.encrypt({
              actId: $.activityId,
              ..._0xebafbd
            }, $.pinToken, $.te)
          };
        } else {
          [403, 493].includes(_0x59c4c6.status) && (_0x440d29 = true);
        }
      }
      continue;
    }
    if (["accessLog", "accessLogWithAD", "attendLog"].includes(_0x4e6d41)) {
      break;
    }
    if (!_0x59c4c6.data) {
      _0x11a0ff = _0x4e6d41 + " 请求失败 ➜ 无响应数据";
      _0x54237a++;
      _0x508e42 && (_0x4eaca6.data = {
        ecyText: wuxianDefense.encrypt({
          actId: $.activityId,
          ..._0xebafbd
        }, $.pinToken, $.te)
      });
      continue;
    }
    const _0x173e18 = common.getResponseCookie(_0x59c4c6, activityCookie);
    let _0x323432 = "";
    switch (_0x4e6d41) {
      case "getMyPing":
        _0x323432 = common.getCookieValue(_0x173e18, "LZ_AES_PIN");
        _0x323432 ? $.LZ_AES_PIN = _0x323432 : (console.log("获取 LZ_AES_PIN 失败！"), $.message.fix("获取[LZ_AES_PIN]失败"), $.skipRun = true);
        break;
      case "initPinToken":
        const _0x4e2649 = common.getCookieValue(_0x173e18, "pToken");
        if (_0x4e2649) {
          $.pinToken = _0x4e2649;
        } else {
          console.log("获取 pinToken 失败！");
          $.message.fix("获取[pinToken]失败");
          $.skipRun = true;
          break;
        }
        _0x323432 = common.getCookieValue(_0x173e18, "LZ_AES_PIN");
        if (_0x323432) {
          $.LZ_AES_PIN = _0x323432;
        } else {
          console.log("获取 LZ_AES_PIN 失败！");
          $.message.fix("获取[LZ_AES_PIN]失败");
          $.skipRun = true;
          break;
        }
        const _0x51ea9c = common.getCookieValue(_0x173e18, "te");
        _0x51ea9c && ($.te = _0x51ea9c);
        break;
    }
    ["getMyPing"].includes(_0x4e6d41) && (activityCookie = _0x173e18);
    await handleResponse(_0x4e6d41, _0x59c4c6.data);
    _0x323432 = common.getCookieValue(activityCookie, "LZ_AES_PIN");
    !_0x323432 && $.LZ_AES_PIN && (activityCookie += " LZ_AES_PIN=" + $.LZ_AES_PIN + "; ");
    const _0x45633a = common.getCookieValue(activityCookie, "AUTH_C_USER");
    !_0x45633a && $.secretPin && (activityCookie += "AUTH_C_USER=" + $.secretPin + "; ");
    const _0x5f47e7 = common.getCookieValue(activityCookie, "pToken");
    !_0x5f47e7 && $.pinToken && (activityCookie += "pToken=" + $.pinToken + "; ");
    const _0x15a357 = common.getCookieValue(activityCookie, "te");
    !_0x15a357 && $.te && (activityCookie += "te=" + $.te);
    _0x440d29 = false;
    break;
  }
  _0x54237a >= _0x413759 && (console.log(_0x11a0ff), _0x440d29 && !["accessLogWithAD", "accessLog"].includes(_0x4e6d41) && ($.outFlag = true, $.message && $.message.fix(_0x11a0ff)));
}
async function getFirstLZCK(_0x20365f) {
  $.skipRun = true;
  const _0x4bf604 = {
      url: _0x20365f,
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh;q=0.9",
        Connection: "keep-alive",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        Referer: _0x20365f,
        "User-Agent": $.UA
      },
      timeout: 30000
    },
    _0x597202 = 3;
  let _0x2a1cdd = 0,
    _0x1a126b = null,
    _0x5c0252 = false;
  while (_0x2a1cdd < _0x597202) {
    _0x2a1cdd > 0 && (await $.wait(1000));
    const _0x1f1c7b = await common.request(_0x4bf604);
    if (!_0x1f1c7b.success) {
      _0x1a126b = "getFirstLZCK 请求失败 ➜ " + _0x1f1c7b.error;
      _0x2a1cdd++;
      _0x1f1c7b.status && [403, 493].includes(_0x1f1c7b.status) && (_0x5c0252 = true);
      continue;
    }
    if (!_0x1f1c7b.data) {
      _0x1a126b = "getFirstLZCK 请求失败 ➜ 无响应数据";
      _0x2a1cdd++;
      continue;
    }
    _0x1f1c7b.data.match(/(活动已经结束)/) && _0x1f1c7b.data.match(/(活动已经结束)/)[1] && ($.runEnd = true, console.log("活动已结束或不存在"), $.message && $.message.insert("活动已结束或不存在"));
    activityCookie = common.getResponseCookie(_0x1f1c7b);
    $.skipRun = false;
    break;
  }
  _0x2a1cdd >= _0x597202 && (console.log(_0x1a126b), _0x5c0252 && ($.outFlag = true, $.message && $.message.insert(_0x1a126b)));
}
function Env(t, e) {
  "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
  class s {
    constructor(t) {
      this.env = t;
    }
    send(t, e = "GET") {
      t = "string" == typeof t ? {
        url: t
      } : t;
      let s = this.get;
      "POST" === e && (s = this.post);
      return new Promise((e, i) => {
        s.call(this, t, (t, s, r) => {
          t ? i(t) : e(s);
        });
      });
    }
    get(t) {
      return this.send.call(this.env, t);
    }
    post(t) {
      return this.send.call(this.env, t, "POST");
    }
  }
  return new class {
    constructor(t, e) {
      this.name = t;
      this.http = new s(this);
      this.data = null;
      this.dataFile = "box.dat";
      this.logs = [];
      this.isMute = !1;
      this.isNeedRewrite = !1;
      this.logSeparator = "\n";
      this.startTime = new Date().getTime();
      Object.assign(this, e);
      this.log("", `🔔${this.name}, 开始!`);
    }
    isNode() {
      return "undefined" != typeof module && !!module.exports;
    }
    isQuanX() {
      return "undefined" != typeof $task;
    }
    isSurge() {
      return "undefined" != typeof $httpClient && "undefined" == typeof $loon;
    }
    isLoon() {
      return "undefined" != typeof $loon;
    }
    toObj(t, e = null) {
      try {
        return JSON.parse(t);
      } catch {
        return e;
      }
    }
    toStr(t, e = null) {
      try {
        return JSON.stringify(t);
      } catch {
        return e;
      }
    }
    getjson(t, e) {
      let s = e;
      const i = this.getdata(t);
      if (i) {
        try {
          s = JSON.parse(this.getdata(t));
        } catch {}
      }
      return s;
    }
    setjson(t, e) {
      try {
        return this.setdata(JSON.stringify(t), e);
      } catch {
        return !1;
      }
    }
    getScript(t) {
      return new Promise(e => {
        this.get({
          url: t
        }, (t, s, i) => e(i));
      });
    }
    runScript(t, e) {
      return new Promise(s => {
        let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
        i = i ? i.replace(/\n/g, "").trim() : i;
        let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
        r = r ? 1 * r : 20;
        r = e && e.timeout ? e.timeout : r;
        const [o, h] = i.split("@"),
          n = {
            url: `http://${h}/v1/scripting/evaluate`,
            body: {
              script_text: t,
              mock_type: "cron",
              timeout: r
            },
            headers: {
              "X-Key": o,
              Accept: "*/*"
            }
          };
        this.post(n, (t, e, i) => s(i));
      }).catch(t => this.logErr(t));
    }
    loaddata() {
      if (!this.isNode()) {
        return {};
      }
      {
        this.fs = this.fs ? this.fs : require("fs");
        this.path = this.path ? this.path : require("path");
        const t = this.path.resolve(this.dataFile),
          e = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(t),
          i = !s && this.fs.existsSync(e);
        if (!s && !i) {
          return {};
        }
        {
          const i = s ? t : e;
          try {
            return JSON.parse(this.fs.readFileSync(i));
          } catch (t) {
            return {};
          }
        }
      }
    }
    writedata() {
      if (this.isNode()) {
        this.fs = this.fs ? this.fs : require("fs");
        this.path = this.path ? this.path : require("path");
        const t = this.path.resolve(this.dataFile),
          e = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(t),
          i = !s && this.fs.existsSync(e),
          r = JSON.stringify(this.data);
        s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r);
      }
    }
    lodash_get(t, e, s) {
      const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
      let r = t;
      for (const t of i) if (r = Object(r)[t], void 0 === r) {
        return s;
      }
      return r;
    }
    lodash_set(t, e, s) {
      return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t);
    }
    getdata(t) {
      let e = this.getval(t);
      if (/^@/.test(t)) {
        const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
          r = s ? this.getval(s) : "";
        if (r) {
          try {
            const t = JSON.parse(r);
            e = t ? this.lodash_get(t, i, "") : e;
          } catch (t) {
            e = "";
          }
        }
      }
      return e;
    }
    setdata(t, e) {
      let s = !1;
      if (/^@/.test(e)) {
        const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
          o = this.getval(i),
          h = i ? "null" === o ? null : o || "{}" : "{}";
        try {
          const e = JSON.parse(h);
          this.lodash_set(e, r, t);
          s = this.setval(JSON.stringify(e), i);
        } catch (e) {
          const o = {};
          this.lodash_set(o, r, t);
          s = this.setval(JSON.stringify(o), i);
        }
      } else {
        s = this.setval(t, e);
      }
      return s;
    }
    getval(t) {
      return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null;
    }
    setval(t, e) {
      return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null;
    }
    initGotEnv(t) {
      this.got = this.got ? this.got : require("got");
      this.cktough = this.cktough ? this.cktough : require("tough-cookie");
      this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar();
      t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar));
    }
    get(t, e = () => {}) {
      t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]);
      this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
        "X-Surge-Skip-Scripting": !1
      })), $httpClient.get(t, (t, s, i) => {
        !t && s && (s.body = i, s.statusCode = s.status);
        e(t, s, i);
      })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
        hints: !1
      })), $task.fetch(t).then(t => {
        const {
          statusCode: s,
          statusCode: i,
          headers: r,
          body: o
        } = t;
        e(null, {
          status: s,
          statusCode: i,
          headers: r,
          body: o
        }, o);
      }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
        try {
          if (t.headers["set-cookie"]) {
            const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
            s && this.ckjar.setCookieSync(s, null);
            e.cookieJar = this.ckjar;
          }
        } catch (t) {
          this.logErr(t);
        }
      }).then(t => {
        const {
          statusCode: s,
          statusCode: i,
          headers: r,
          body: o
        } = t;
        e(null, {
          status: s,
          statusCode: i,
          headers: r,
          body: o
        }, o);
      }, t => {
        const {
          message: s,
          response: i
        } = t;
        e(s, i, i && i.body);
      }));
    }
    post(t, e = () => {}) {
      if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) {
        this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
          "X-Surge-Skip-Scripting": !1
        }));
        $httpClient.post(t, (t, s, i) => {
          !t && s && (s.body = i, s.statusCode = s.status);
          e(t, s, i);
        });
      } else {
        if (this.isQuanX()) {
          t.method = "POST";
          this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
            hints: !1
          }));
          $task.fetch(t).then(t => {
            const {
              statusCode: s,
              statusCode: i,
              headers: r,
              body: o
            } = t;
            e(null, {
              status: s,
              statusCode: i,
              headers: r,
              body: o
            }, o);
          }, t => e(t));
        } else {
          if (this.isNode()) {
            this.initGotEnv(t);
            const {
              url: s,
              ...i
            } = t;
            this.got.post(s, i).then(t => {
              const {
                statusCode: s,
                statusCode: i,
                headers: r,
                body: o
              } = t;
              e(null, {
                status: s,
                statusCode: i,
                headers: r,
                body: o
              }, o);
            }, t => {
              const {
                message: s,
                response: i
              } = t;
              e(s, i, i && i.body);
            });
          }
        }
      }
    }
    time(t, e = null) {
      const s = e ? new Date(e) : new Date();
      let i = {
        "M+": s.getMonth() + 1,
        "d+": s.getDate(),
        "H+": s.getHours(),
        "m+": s.getMinutes(),
        "s+": s.getSeconds(),
        "q+": Math.floor((s.getMonth() + 3) / 3),
        S: s.getMilliseconds()
      };
      /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
      for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
      return t;
    }
    msg(e = t, s = "", i = "", r) {
      const o = t => {
        if (!t) {
          return t;
        }
        if ("string" == typeof t) {
          return this.isLoon() ? t : this.isQuanX() ? {
            "open-url": t
          } : this.isSurge() ? {
            url: t
          } : void 0;
        }
        if ("object" == typeof t) {
          if (this.isLoon()) {
            let e = t.openUrl || t.url || t["open-url"],
              s = t.mediaUrl || t["media-url"];
            return {
              openUrl: e,
              mediaUrl: s
            };
          }
          if (this.isQuanX()) {
            let e = t["open-url"] || t.url || t.openUrl,
              s = t["media-url"] || t.mediaUrl;
            return {
              "open-url": e,
              "media-url": s
            };
          }
          if (this.isSurge()) {
            let e = t.url || t.openUrl || t["open-url"];
            return {
              url: e
            };
          }
        }
      };
      if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
        let t = ["", "==============📣系统通知📣=============="];
        t.push(e);
        s && t.push(s);
        i && t.push(i);
        console.log(t.join("\n"));
        this.logs = this.logs.concat(t);
      }
    }
    log(...t) {
      t.length > 0 && (this.logs = [...this.logs, ...t]);
      console.log(t.join(this.logSeparator));
    }
    logErr(t, e) {
      const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
      s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t);
    }
    wait(t) {
      return new Promise(e => setTimeout(e, t));
    }
    done(t = {}) {
      const e = new Date().getTime(),
        s = (e - this.startTime) / 1000;
      this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`);
      this.log();
      (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t);
    }
  }(t, e);
}