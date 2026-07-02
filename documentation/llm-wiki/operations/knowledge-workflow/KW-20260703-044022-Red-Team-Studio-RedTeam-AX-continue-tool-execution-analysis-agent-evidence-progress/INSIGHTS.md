# Insights

The readiness API and operating close API must share the same artifact coverage invariant. Otherwise an operator or automation path can skip the preflight and still close an operating collection with only a subset of required tool results. Enforcing the invariant in close-operating itself gives a safer final API boundary while preserving the no-command-execution model.
