⚡ Optimize Dashboard array rendering with useMemo

### 💡 What:
The array slice `schools.slice(0, 5)` was moved out of the JSX render and wrapped in a `useMemo` hook, creating a new variable `recentSchools`.

### 🎯 Why:
Before this change, `schools.slice(0, 5)` was called on every render of the `Dashboard` component. `Array.prototype.slice()` returns a new array reference every time it is called. This meant that on every state update (e.g. when location data or logs updated every second), a new array was being allocated and garbage collected. By memoizing the sliced array with `useMemo`, we ensure that the slice is only recalculated when the `schools` array actually changes, preventing unnecessary memory allocation and garbage collection overhead during rapid render cycles.

### 📊 Measured Improvement:
Because this is a React render-cycle optimization that avoids re-allocating a new array on every render, direct programmatic benchmarking of the component in isolation is impractical without setting up a full React testing/profiling environment. However, since the Dashboard component contains high-frequency state updates (like WebSockets for live bus locations), avoiding array allocations in the render function is a proven optimization technique to reduce Javascript garbage collection pauses and keep the framerate high.
