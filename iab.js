// ===================================================================
// خرید درون‌برنامه‌ای کافه‌بازار برای بازی "گل یا پوچ"
// با استفاده از cordova-plugin-android-iab
// ===================================================================
(function () {
	var BAZAAR_PACKAGE = "com.farsitel.bazaar";
	var BAZAAR_INTENT  = "ir.cafebazaar.pardakht.InAppBillingService.BIND";
	var BILLING_KEY    = "MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwDTg6K4fJKJLNZEeS0Pos3YChhDO6rQhxXWo/EsF8IN34bAZppSOp/JXi9RjQk/iH0TbjX2xQlhc/DfWYx5UtY20zdmDNlDVel4mvKcq6dXjOsU62xnfKvJzJ/dPNgf61C08DbwSAMtLht+9xMoCnf/vTBs9gUFqaafj2JFX4yxV7rYzxn9AruQ1L/L3wMojtfVrUEGfJF5hS8eLdcorIESRlHAA8MUmDKCLR1X/T0CAwEAAQ==";

	// شناسه‌های دقیق محصولات (باید عیناً با پنل کافه‌بازار یکی باشن)
	var SKUS = ["seke200", "seke700", "seke1500"];

	var iabReady = false;

	function logWarn(msg) {
		console.warn("[IAB-Game] " + msg);
	}

	function consumeProduct(productId) {
		inappbilling.consumePurchase(function () {
			// مصرف موفق - کاربر می‌تونه دوباره همین آیتم رو بخره
		}, function (err) {
			logWarn("خطا در consume برای " + productId + ": " + JSON.stringify(err));
		}, productId);
	}

	function onInitSuccess() {
		iabReady = true;
		inappbilling.getPurchases(function (purchases) {
			for (var i = 0; i < purchases.length; i++) {
				consumeProduct(purchases[i].productId);
			}
		}, function (err) {
			logWarn("خطا در getPurchases: " + JSON.stringify(err));
		});
	}

	function onInitError(err) {
		logWarn("خطا در init: " + JSON.stringify(err));
	}

	// این تابع رو از Construct 2 با Execute Javascript صدا بزن:
	// window.purchaseItem('seke200');
	window.purchaseItem = function (productId) {
		if (!iabReady) {
			logWarn("purchaseItem صدا زده شد ولی IAB هنوز آماده نیست");
			return;
		}
		inappbilling.buy(function () {
			window["c2_purchase_" + productId] = true;
			consumeProduct(productId);
		}, function (err) {
			logWarn("خرید ناموفق برای " + productId + ": " + JSON.stringify(err));
		}, productId);
	};

	document.addEventListener("deviceready", function () {
		if (typeof inappbilling === "undefined") {
			logWarn("آبجکت inappbilling پیدا نشد - پلاگین cordova-plugin-android-iab درست نصب نشده");
			return;
		}
		inappbilling.init(onInitSuccess, onInitError, { showLog: false },
			BAZAAR_PACKAGE, BAZAAR_INTENT, BILLING_KEY, SKUS);
	}, false);
})();
