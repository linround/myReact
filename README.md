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

## 实现事件系统
- 模拟实现浏览器事件捕获、冒泡流程
- 实现合成事件对象
- 方便后续扩展
### 实现ReactDOM 与 Reconciler 对接
将事件保存在DOM中，通过创建以下两个对接时机
- 创建DOM时
- 更新属性时
### 触发事件系统
- 由于之前事件已经将props存储在了DOM中
- 获取到绑定事件的元素。
- 从该元素开始，向上收集 capture 和 bubble 事件
- 按顺序 触发收集到的事件数组

### diff 过程
- 将之前的 节点利用key值或者index,存在一个map中   
- 遍历新的 fiber 节点。根据新的节点的key 值，从之前的map数据中获取该节点。
- 如果之前存在该节点，那就复用该节点；不存在之前的就重新创建新的fiber 节点
- 比较index,标记该fiber 节点是移动还是插入

### 第十三章
第13章节出现了一个deleteRemainingChildren.但是在之前的章节中并没有出现过这个函数的实现。有点断层的感觉。
所以不打算实现该章节的代码了。

### 第十四章
批处理的实现。例如，多次调用setState的时候，只用触发依次render
- react是在微任务中进行的渲染

### lane 模型
用于批处理更新调度。

### 不同的effect
- **useEffect**   
依赖变化后的，当前的commit阶段完成后异步执行

- **useLayoutEffect**    
在当前commit阶段同步执行

- **useInsertionEffect**    
  在当前commit阶段同步执行，无法拿到dom的引用，主要是给css ，js库使用

#### 实现 useEffect 需要的功能
- 保存依赖
- 需要能够保存 create 回调
- 需要能够保存 destroy 回调
- 需要能够区分是否触发 create 回调
  - mount 时
  - 以来变化时
  
#####  关于 scheduler 包的使用 

### 时间切片的作用
避免在每一帧渲染时发生卡顿.任务执行时间大于每一帧的时间的时候，就会导致在该帧
的任务无法完成执行，从而造成卡顿。  

通过把任务切成小的任务，从而避免任务的执行时间过长，从而避免卡顿的出现。

### Suspense
- useTransition 并发更新时产生的 loading
- lazy 钩子配合 Suspense 。
- use 钩子配合 Suspense
#### 服务端渲染（SSR）
- Selective Hydration
- RSC (React Server Component)

### offscreen 来实现 keep-alive组件
  

## React.memo
让 props全等比较变为 props 浅比较
