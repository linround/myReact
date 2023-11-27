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

# FunctionComponent 的实现
需要考虑的问题
- 如何支持FC
- 如何组织hooks
## 如何支持FC   
FC基于：
- beginWork
- completeWork


# 关于useState
hook 脱离FC上下文，仅仅是普通函数，如何让他拥有感知上下文的能力？
比如：
- hook如何知道在另一个hook的上下文环境
- hook 怎么知道当前是mount还是update
解决方啊：在不同上下文调用的hook不是同一个函数
- hooks如何知道自身的数据保存在哪？
可以记录当前正在render 的FC对应的fiberNode,在fiberNode 中保存数据；

# 关于函数组件的初步理解
函数组件的关键是形成ReactElement,在这个形成的过程中，设计了一套链表解构的hooks.
同时实现了使用hooks方法来触发组建的更新。同时通过全局变量的方式来确定当前fiber和当前hooks指针。

# 实现测试环节
# update 初探  
对于beginWork
- 处理 ChildDeletion 的情况
- 处理节点移动的情况  

对于completeWork  
- 需要处理HostText 内容更新的情况
- 需要处理HostComponent 属性变化的情况

对于commitWork 
- 对于childDeletion，需要遍历被删除的子树

对于useState
- 实现相对于 mountState的updateState

## commitWork流程
对于标记 ChildDeletion 子树；由于子树中：
- 对于FC，需要处理 useEffect,unmount执行，解绑ref
- 对于HostComponent ，需要解绑 ref
- 对于子树 的 根HostComponent，需要移除DOM