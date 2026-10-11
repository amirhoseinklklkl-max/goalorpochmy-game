// ===================================================================
// یکپارچه‌سازی تبلیغات ادیوری برای بازی "گل یا پوچ"
// بر اساس مستندات رسمی: https://github.com/adivery/adivery-cordova-plugin
// مستقل از موتور Construct 2 کار می‌کند و از API رسمی
// window.cr_getC2Runtime() برای خواندن نام لایوت فعلی استفاده می‌کند
// ===================================================================
(function () {
	var APP_ID           = "7ef0f577-941e-4edf-9672-8fab205d73cb";
	var BANNER_ZONE_ID    = "1cfbc67f-d054-4d09-865b-631118eb78a3";
	var REWARDED_ZONE_ID  = "87958e35-0cfc-42bb-86d2-874a6d98d696";

	// نام دقیق لایوتی که نباید بنر داخلش نمایش داده بشه
	var HIDE_BANNER_LAYOUT = "online game";

	var bannerCreated  = false;
	var lastLayoutName = null;
	var adiveryReady   = false;
	var gameStartTime  = null;

	var BANNER_START_DELAY_MS   = 5000;   // ۵ ثانیه بعد از باز شدن بازی
	var BANNER_REFRESH_INTERVAL_MS = 3 * 60 * 1000; // هر ۳ دقیقه رفرش

	function log(msg) {
		console.log("[Adivery-Game] " + msg);
	}

	var diagTickCount = 0;

	function getRuntime() {
		try {
			if (window.cr_getC2Runtime) return window.cr_getC2Runtime();
			return window.c2runtime || null;
		} catch (err) {
			log("خطا در getRuntime: " + err.message);
			return null;
		}
	}

	// نام‌های واقعی لایوت‌های بازی (برای مچ کردن با فیلد درست روی rt.ya)
	var KNOWN_LAYOUT_NAMES = ["load", "menu", "shop", "game", "2nafare", "binabin",
		"chatroom", "hesab", "گنجینه", "بازارسیاه", "rahnama", "4dast", "6dast",
		"onlinmenusheet", "online game", "gameonloneshet"];

	var foundNameKey = null; // وقتی پیدا شد، دیگه هر بار اسکن نمی‌کنیم

	function scanForNameKey(ya) {
		var keys = Object.keys(ya);
		for (var i = 0; i < keys.length; i++) {
			var k = keys[i];
			var v = ya[k];
			if (typeof v === "string" && KNOWN_LAYOUT_NAMES.indexOf(v) !== -1) {
				return k;
			}
		}
		return null;
	}

	function getCurrentLayoutName() {
		var rt = getRuntime();
		diagTickCount++;

		if (!rt || !rt.ya) {
			if (diagTickCount % 12 === 0) {
				log("تشخیص: rt=" + (rt ? "موجود" : "null") + " | rt.ya=" + (rt && rt.ya ? "موجود" : "null"));
			}
			return null;
		}

		if (foundNameKey === null) {
			foundNameKey = scanForNameKey(rt.ya) || false;
			if (foundNameKey) {
				log("فیلد اسم لایوت پیدا شد: rt.ya." + foundNameKey);
			} else if (diagTickCount % 12 === 0) {
				// همه‌ی فیلدهای رشته‌ای رو چاپ کن تا دستی پیدا کنیم
				var keys = Object.keys(rt.ya);
				var strFields = [];
				for (var i = 0; i < keys.length; i++) {
					if (typeof rt.ya[keys[i]] === "string") {
						strFields.push(keys[i] + "=" + JSON.stringify(rt.ya[keys[i]]));
					}
				}
				log("فیلد اسم پیدا نشد. فیلدهای رشته‌ای rt.ya: " + strFields.join(" | "));
				log("همه‌ی کلیدهای rt.ya: " + keys.join(","));
			}
		}

		if (foundNameKey) return rt.ya[foundNameKey];
		return null;
	}

	// این فلگ رو Construct 2 هر نیم‌ثانیه با Browser.ExecJS چک می‌کنه
	window.c2_rewardBelit = false;

	// استخراج داده از ایونت‌های کوردوا/ادیوری (طبق مستندات رسمی پلاگین)
	function extractEventData(e) {
		if (e && typeof e.originalEvent !== "undefined") e = e.originalEvent;
		return (e && (e.detail || e.data)) || e || {};
	}

	function initAdivery() {
		if (typeof Adivery === "undefined") {
			log("خطا: آبجکت Adivery پیدا نشد - پلاگین adivery-cordova درست نصب/لود نشده");
			return;
		}

		log("شروع initialize...");
		Adivery.initialize(APP_ID);
		Adivery.setLoggingEnabled(true);

		// آماده‌سازی تبلیغ جایزه‌ای از همین اول
		Adivery.prepareRewardedAd(REWARDED_ZONE_ID);
		adiveryReady = true;

		// --- ایونت‌های رسمی طبق مستندات ---
		document.addEventListener("onRewardedAdLoaded", function (e) {
			log("تبلیغ جایزه‌ای لود شد: " + JSON.stringify(extractEventData(e)));
		}, false);

		document.addEventListener("onRewardedAdShown", function (e) {
			log("تبلیغ جایزه‌ای نمایش داده شد");
		}, false);

		document.addEventListener("onRewardedAdClosed", function (e) {
			var data = extractEventData(e);
			log("تبلیغ جایزه‌ای بسته شد، isRewarded=" + data.isRewarded);
			if (data.isRewarded) {
				window.c2_rewardBelit = true;
			}
			// برای نمایش بعدی دوباره آماده‌اش کن
			Adivery.prepareRewardedAd(REWARDED_ZONE_ID);
		}, false);

		document.addEventListener("onBannerAdLoaded", function () {
			log("بنر لود شد");
		}, false);

		document.addEventListener("onBannerAdShown", function () {
			log("بنر نمایش داده شد");
		}, false);

		document.addEventListener("onError", function (e) {
			var data = extractEventData(e);
			log("خطای ادیوری: " + JSON.stringify(data));
		}, false);
	}

	// این تابع رو از Construct 2 با Execute Javascript صدا بزن:
	// window.showBelitRewardAd();
	window.showBelitRewardAd = function () {
		if (typeof Adivery === "undefined") {
			log("showBelitRewardAd صدا زده شد ولی Adivery وجود نداره");
			return;
		}
		log("درخواست نمایش تبلیغ جایزه‌ای...");
		Adivery.showAd(REWARDED_ZONE_ID);
	};

	function showBanner() {
		if (!adiveryReady || bannerCreated) return;
		try {
			log("ساخت و نمایش بنر...");
			Adivery.createBanner(BANNER_ZONE_ID, Adivery.AD_POSITION.BOTTOM_CENTER, Adivery.AD_SIZE.BANNER_SMALL);
			Adivery.showBanner();
			bannerCreated = true;
		} catch (err) {
			log("خطا در showBanner: " + err.message);
		}
	}

	function hideBanner() {
		if (!adiveryReady || !bannerCreated) return;
		try {
			log("مخفی کردن بنر...");
			Adivery.hideBanner();
		} catch (err) {
			log("خطا در hideBanner: " + err.message);
		}
	}

	function showBannerAgain() {
		if (!adiveryReady || !bannerCreated) return;
		Adivery.showBanner();
	}

	// هر ۳ دقیقه یه تبلیغ بنری جدید بگیر (فقط وقتی بنر الان نمایش داده شده و تو لایوت ممنوعه نیستیم)
	function refreshBanner() {
		if (!adiveryReady || !bannerCreated) return;
		if (lastLayoutName === HIDE_BANNER_LAYOUT) return;
		try {
			log("رفرش بنر برای تبلیغ جدید...");
			Adivery.createBanner(BANNER_ZONE_ID, Adivery.AD_POSITION.BOTTOM_CENTER, Adivery.AD_SIZE.BANNER_SMALL);
			Adivery.showBanner();
		} catch (err) {
			log("خطا در refreshBanner: " + err.message);
		}
	}

	// هر چند صدم ثانیه چک می‌کنه الان کدوم لایوت در حال اجراست
	function pollLayout() {
		var name = getCurrentLayoutName();
		if (name === null || name === lastLayoutName) return;
		lastLayoutName = name;
		log("لایوت عوض شد به: " + name);

		if (name === HIDE_BANNER_LAYOUT) {
			hideBanner();
			return;
		}

		if (bannerCreated) {
			showBannerAgain();
			return;
		}

		// اولین نمایش بنر: فقط اگه ۵ ثانیه از شروع بازی گذشته باشه
		var elapsed = Date.now() - gameStartTime;
		if (elapsed >= BANNER_START_DELAY_MS) {
			showBanner();
		}
		// وگرنه هیچی - تیک‌های بعدی pollLayout دوباره چک می‌کنن
	}

	// چون ممکنه کاربر تو همون ۵ ثانیه اول تو لایوت غیر از "online game" بمونه
	// و pollLayout دیگه چیزی صدا نزنه (چون lastLayoutName عوض نشده)، یه چک جدا
	// فقط برای رعایت تاخیر ۵ ثانیه‌ای لازم داریم:
	function checkInitialBannerDelay() {
		if (bannerCreated) return; // قبلاً نمایش داده شده
		if (lastLayoutName === null || lastLayoutName === HIDE_BANNER_LAYOUT) return;
		var elapsed = Date.now() - gameStartTime;
		if (elapsed >= BANNER_START_DELAY_MS) {
			showBanner();
		}
	}

	document.addEventListener("deviceready", function () {
		log("deviceready اجرا شد");
		gameStartTime = Date.now();
		initAdivery();
		setInterval(pollLayout, 400);
		setInterval(checkInitialBannerDelay, 500);
		setInterval(refreshBanner, BANNER_REFRESH_INTERVAL_MS);
	}, false);
})();
