#!/usr/bin/env node
// این هوک بعد از آماده‌سازی پروژه اندروید اجرا میشه و نسخه androidx.appcompat رو
// به 1.7.0 force می‌کنه تا با باگ AAPT2 جدید روی ارور "Invalid <color>" برخورد نکنیم.
module.exports = function (context) {
	var fs = require('fs');
	var path = require('path');

	var buildGradlePath = path.join(context.opts.projectRoot, 'platforms', 'android', 'build.gradle');

	if (!fs.existsSync(buildGradlePath)) {
		console.log('[fix-appcompat] build.gradle پیدا نشد، رد شدم: ' + buildGradlePath);
		return;
	}

	var content = fs.readFileSync(buildGradlePath, 'utf8');
	var marker = '// FIX_APPCOMPAT_FORCE';

	if (content.indexOf(marker) !== -1) {
		console.log('[fix-appcompat] قبلاً اعمال شده، رد شدم.');
		return;
	}

	var patch = '\n' + marker + '\n' +
		'allprojects {\n' +
		'    configurations.all {\n' +
		'        resolutionStrategy {\n' +
		"            force 'androidx.appcompat:appcompat:1.7.0'\n" +
		"            force 'org.jetbrains.kotlin:kotlin-stdlib:1.9.24'\n" +
		"            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.24'\n" +
		"            force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.24'\n" +
		'        }\n' +
		'    }\n' +
		'}\n';

	fs.appendFileSync(buildGradlePath, patch);
	console.log('[fix-appcompat] نسخه appcompat با موفقیت force شد روی: ' + buildGradlePath);
};
