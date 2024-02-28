#  react性能优化
- bailout 策略：减少不必要的子组件 render.
- eagerState 策略：不必要的更新，没必要开启后续调度流程。
## bailout 策略
命中的组件可以不通过reconcile生产wip.child，而是直接复用上次更新生成的 wip.child。

## eagerState 策略.

状态更新前后没有变化，那么就没有必要触发更新。为此需要做：
1. 计算更新后的状态
2. 与更新前的状态作比较


## 性能优化一般思路

- 将变化的部分与不变的部分进行分离。
- 命中性能优化的子组件，不需要render。