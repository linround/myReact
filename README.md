# 实现一个React
## 环境搭建
- commit 校验 husky
- 代码格式校验 eslint
- 打包工具 rollup
## package.json
- main 对应的commonjs 规范的入口
- module 对应的是 esmodule 规范的入口

## fiberNode
介于 ReactElement 和 DOM 之间；用于reconciler,对于同一个节点，比较其ReactElement和fiberNode,
生成子fiberNode,并根据比较的结果生成不同标记（插入、删除、移动）