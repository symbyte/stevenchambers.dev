---
title: "Yep"
description: "its a post"
pubDate: 2026-11-07
draft: false
---

Just a post with some stuff in it. Trying to get used to typing with this new setup. I feel like it is a better approach, just takes some getting used to.

heres some code I guess:

```typescript
const thing: "thing" | "otherThing" = "thing";

function thingFunction(p: typeof thing) {
  console.log(`a ${p}`);
}

thingFunction(thing); // > a thing
```
