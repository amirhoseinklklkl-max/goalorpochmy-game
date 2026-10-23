// ===================================================================
// خرید درون‌برنامه‌ای مایکت برای بازی "گل یا پوچ"
// با استفاده از cordova-plugin-android-iab
// ===================================================================
(function () {
	var MYKET_PACKAGE = "ir.mservices.market";
	var MYKET_INTENT  = "ir.mservices.market.InAppBillingService.BIND";
	var BILLING_KEY   = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAYv7c4feYMlNywSl8Yd2OmlUS2/odPZ8QptkX4jFGyUqs7MXU/oQKO7C/ml6m5h/AflFshHlRbN/qYAVeGWpWD6RMR8pO2p1w+ytW4NoSVNNmJlLQStZfl09S1spvFzGot/uQ0IcF4k8xX6yiEXz3VGai2IMemnscmmghnkng8wIDAQAB";

	// شناسه‌های دقیق محصولات (باید عیناً با پنل مایکت یکی باشن)
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
		// هر خریدی که قبلاً انجام شده ولی به هر دلیلی consume نشده
		// رو الان consume کن تا کاربر طلبش جا نمونه و بتونه دوباره بخره
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
			MYKET_PACKAGE, MYKET_INTENT, BILLING_KEY, SKUS);
	}, false);
})();
