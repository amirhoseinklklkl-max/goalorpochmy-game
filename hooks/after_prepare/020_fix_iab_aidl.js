#!/usr/bin/env node
// پلاگین cordova-plugin-android-iab فایل IInAppBillingService.aidl رو تو مسیر قدیمی
// (که دیگه توسط Gradle/AGP جدید کامپایل نمیشه) می‌ذاره و همین باعث ارور
// "package com.android.vending.billing does not exist" میشه.
// این هوک فایل رو مستقیم تو مسیر جدیدی که AGP می‌شناسه (app/src/main/aidl/...) می‌سازه.
module.exports = function (context) {
	var fs = require('fs');
	var path = require('path');

	var aidlDir = path.join(
		context.opts.projectRoot,
		'platforms', 'android', 'app', 'src', 'main', 'aidl',
		'com', 'android', 'vending', 'billing'
	);
	var aidlFile = path.join(aidlDir, 'IInAppBillingService.aidl');

	var platformDir = path.join(context.opts.projectRoot, 'platforms', 'android');
	if (!fs.existsSync(platformDir)) {
		console.log('[fix-iab-aidl] پلتفرم اندروید پیدا نشد، رد شدم.');
		return;
	}

	if (fs.existsSync(aidlFile)) {
		console.log('[fix-iab-aidl] فایل aidl از قبل سر جاشه.');
		return;
	}

	var aidlContent = [
		'/*',
		' * Copyright (C) 2012 The Android Open Source Project',
		' *',
		' * Licensed under the Apache License, Version 2.0 (the "License");',
		' * you may not use this file except in compliance with the License.',
		' * You may obtain a copy of the License at',
		' *',
		' *      http://www.apache.org/licenses/LICENSE-2.0',
		' *',
		' * Unless required by applicable law or agreed to in writing, software',
		' * distributed under the License is distributed on an "AS IS" BASIS,',
		' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
		' * See the License for the specific language governing permissions and',
		' * limitations under the License.',
		' */',
		'',
		'package com.android.vending.billing;',
		'',
		'import android.os.Bundle;',
		'',
		'interface IInAppBillingService {',
		'    int isBillingSupported(int apiVersion, String packageName, String type);',
		'',
		'    Bundle getSkuDetails(int apiVersion, String packageName, String type, in Bundle skusBundle);',
		'',
		'    Bundle getBuyIntent(int apiVersion, String packageName, String sku, String type, String developerPayload);',
		'',
		'    Bundle getPurchases(int apiVersion, String packageName, String type, String continuationToken);',
		'',
		'    int consumePurchase(int apiVersion, String packageName, String purchaseToken);',
		'',
		'    int isPromoEligible(int apiVersion, String packageName, String type);',
		'',
		'    Bundle getBuyIntentToReplaceSkus(int apiVersion, String packageName, inout List<String> oldSkus, String newSku, String type, String developerPayload);',
		'}',
		''
	].join('\n');

	fs.mkdirSync(aidlDir, { recursive: true });
	fs.writeFileSync(aidlFile, aidlContent);
	console.log('[fix-iab-aidl] فایل IInAppBillingService.aidl با موفقیت ساخته شد در: ' + aidlFile);
};
