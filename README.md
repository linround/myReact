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

## workLoop
完成fiber 树的构建，并且标记好对于fiber的操作

## commit 阶段
- beforeMutation 阶段
- mutation 阶段
- layout 阶段

## dependencies 与 peerDependencies 的区别
## Placement 过程简介
- createRoot
创建 fiberRootNode
- render 开始渲染，传入要渲染的ReactElement
- createUpdate
创建一个update,将其放入，rootFiber 的updateQueue中
- scheduleUpdateOnFiber
- markUpdateFromFiberToRoot
找到fiberRootNode
- preparereFreshStack
创建 根workInProgress
- workLoop
创建fiber树，并完成DOM树的生成
- performUnitOfWork
进入递归阶段 完成fiber树和DOM树的生成
- beginWork
从根节点开始，从updateQueue中拿到对应的ReactElement
- reconcileChildren
将ReactElement 转换成 fiber
- completeUnitOfWork
从最里面的叶子fiber开始，创建DOM。并将子DOM进行挂载在当前的真实DOM上。
- commitRoot
从fiberRootNode 开始。
- commitMutationEffects
传入finishedWork,将被标记的fiber,进行对应的DOM操作