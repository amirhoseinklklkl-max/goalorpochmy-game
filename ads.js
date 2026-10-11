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

	function log(msg) {
		console.log("[Adivery-Game] " + msg);
	}

	function getRuntime() {
		if (window.cr_getC2Runtime) return window.cr_getC2Runtime();
		return window.c2runtime || null;
	}

	function getCurrentLayoutName() {
		var rt = getRuntime();
		if (rt && rt.ya && typeof rt.ya.fa === "string") return rt.ya.fa;
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
		log("ساخت و نمایش بنر...");
		Adivery.createBanner(BANNER_ZONE_ID, Adivery.AD_POSITION.BOTTOM_CENTER, Adivery.AD_SIZE.BANNER_SMALL);
		Adivery.showBanner();
		bannerCreated = true;
	}

	function hideBanner() {
		if (!adiveryReady || !bannerCreated) return;
		log("مخفی کردن بنر...");
		Adivery.hideBanner();
	}

	function showBannerAgain() {
		if (!adiveryReady || !bannerCreated) return;
		Adivery.showBanner();
	}

	// هر چند صدم ثانیه چک می‌کنه الان کدوم لایوت در حال اجراست
	function pollLayout() {
		var name = getCurrentLayoutName();
		if (name === null || name === lastLayoutName) return;
		lastLayoutName = name;
		log("لایوت عوض شد به: " + name);

		if (name === HIDE_BANNER_LAYOUT) {
			hideBanner();
		} else if (bannerCreated) {
			showBannerAgain();
		} else {
			showBanner();
		}
	}

	document.addEventListener("deviceready", function () {
		log("deviceready اجرا شد");
		initAdivery();
		setInterval(pollLayout, 400);
	}, false);
})();
