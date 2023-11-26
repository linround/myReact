const { defaults } = require('jest-config');

module.exports = {
	...defaults,
	rootDir: process.cwd(), // 命令执行时的根目录
	modulePathIgnorePatterns: ['<rootDir>/.history'],
	moduleDirectories: [
		// 指定第三方包从何处解析
		// 对于 React ReactDOM
		'dist/node_modules',
		// 对于第三方依赖
		...defaults.moduleDirectories
	],
	testEnvironment: 'jsdom'
};
