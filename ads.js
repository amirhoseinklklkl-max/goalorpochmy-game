// ===================================================================
// یکپارچه‌سازی تبلیغات ادیوری برای بازی "گل یا پوچ" - نسخه نهایی (ریلیز)
// بر اساس مستندات رسمی: https://github.com/adivery/adivery-cordova-plugin
// ===================================================================
(function () {
	var APP_ID            = "7ef0f577-941e-4edf-9672-8fab205d73cb";
	var BANNER_ZONE_ID     = "1cfbc67f-d054-4d09-865b-631118eb78a3";
	var REWARDED_ZONE_ID   = "87958e35-0cfc-42bb-86d2-874a6d98d696";

	var HIDE_BANNER_LAYOUT = "online game";
	var BANNER_START_DELAY_MS      = 5000;
	var BANNER_REFRESH_INTERVAL_MS = 3 * 60 * 1000;

	var bannerCreated  = false;
	var lastLayoutName = null;
	var adiveryReady   = false;
	var gameStartTime  = null;
	var foundNameKey   = null;

	// فقط خطاهای واقعی رو لاگ می‌کنیم، نه هر قدم رو
	function logError(msg) {
		console.warn("[Adivery-Game] " + msg);
	}

	function getRuntime() {
		try {
			if (window.cr_getC2Runtime) return window.cr_getC2Runtime();
			return window.c2runtime || null;
		} catch (err) {
			return null;
		}
	}

	var KNOWN_LAYOUT_NAMES = ["load", "menu", "shop", "game", "2nafare", "binabin",
		"chatroom", "hesab", "گنجینه", "بازارسیاه", "rahnama", "4dast", "6dast",
		"onlinmenusheet", "online game", "gameonloneshet"];

	function scanForNameKey(ya) {
		var keys = Object.keys(ya);
		for (var i = 0; i < keys.length; i++) {
			var v = ya[keys[i]];
			if (typeof v === "string" && KNOWN_LAYOUT_NAMES.indexOf(v) !== -1) return keys[i];
		}
		return null;
	}

	function getCurrentLayoutName() {
		var rt = getRuntime();
		if (!rt || !rt.ya) return null;
		if (foundNameKey === null) foundNameKey = scanForNameKey(rt.ya) || false;
		if (foundNameKey) return rt.ya[foundNameKey];
		return null;
	}

	// این فلگ رو Construct 2 هر نیم‌ثانیه با Browser.ExecJS چک می‌کنه
	window.c2_rewardBelit = false;

	function extractEventData(e) {
		if (e && typeof e.originalEvent !== "undefined") e = e.originalEvent;
		return (e && (e.detail || e.data)) || e || {};
	}

	function initAdivery() {
		if (typeof Adivery === "undefined") {
			logError("آبجکت Adivery پیدا نشد - پلاگین adivery-cordova درست نصب/لود نشده");
			return;
		}

		Adivery.initialize(APP_ID);
		Adivery.prepareRewardedAd(REWARDED_ZONE_ID);
		adiveryReady = true;

		document.addEventListener("onRewardedAdClosed", function (e) {
			var data = extractEventData(e);
			if (data.isRewarded) {
				window.c2_rewardBelit = true;
			}
			Adivery.prepareRewardedAd(REWARDED_ZONE_ID);
		}, false);

		document.addEventListener("onError", function (e) {
			logError("خطای ادیوری: " + JSON.stringify(extractEventData(e)));
		}, false);
	}

	// این تابع رو از Construct 2 با Execute Javascript صدا بزن:
	// window.showBelitRewardAd();
	window.showBelitRewardAd = function () {
		if (typeof Adivery === "undefined") return;
		Adivery.showAd(REWARDED_ZONE_ID);
	};

	function showBanner() {
		if (!adiveryReady || bannerCreated) return;
		try {
			Adivery.createBanner(BANNER_ZONE_ID, Adivery.AD_POSITION.BOTTOM_CENTER, Adivery.AD_SIZE.BANNER_SMALL);
			Adivery.showBanner();
			bannerCreated = true;
		} catch (err) {
			logError("خطا در showBanner: " + err.message);
		}
	}

	function hideBanner() {
		if (!adiveryReady || !bannerCreated) return;
		try {
			Adivery.hideBanner();
		} catch (err) {
			logError("خطا در hideBanner: " + err.message);
		}
	}

	function showBannerAgain() {
		if (!adiveryReady || !bannerCreated) return;
		Adivery.showBanner();
	}

	function refreshBanner() {
		if (!adiveryReady || !bannerCreated) return;
		if (lastLayoutName === HIDE_BANNER_LAYOUT) return;
		try {
			Adivery.createBanner(BANNER_ZONE_ID, Adivery.AD_POSITION.BOTTOM_CENTER, Adivery.AD_SIZE.BANNER_SMALL);
			Adivery.showBanner();
		} catch (err) {
			logError("خطا در refreshBanner: " + err.message);
		}
	}

	function pollLayout() {
		var name = getCurrentLayoutName();
		if (name === null || name === lastLayoutName) return;
		lastLayoutName = name;

		if (name === HIDE_BANNER_LAYOUT) {
			hideBanner();
			return;
		}
		if (bannerCreated) {
			showBannerAgain();
			return;
		}
		if (Date.now() - gameStartTime >= BANNER_START_DELAY_MS) {
			showBanner();
		}
	}

	function checkInitialBannerDelay() {
		if (bannerCreated) return;
		if (lastLayoutName === null || lastLayoutName === HIDE_BANNER_LAYOUT) return;
		if (Date.now() - gameStartTime >= BANNER_START_DELAY_MS) {
			showBanner();
		}
	}

	document.addEventListener("deviceready", function () {
		gameStartTime = Date.now();
		initAdivery();
		setInterval(pollLayout, 400);
		setInterval(checkInitialBannerDelay, 500);
		setInterval(refreshBanner, BANNER_REFRESH_INTERVAL_MS);
	}, false);
})();
