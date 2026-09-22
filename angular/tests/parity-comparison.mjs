// Correspondence is structural, never based on CSS classes or text. Only the
// enumerated framework/port adaptations below may be flattened or normalized.
export const properties = [
  "display",
  "color",
  "backgroundColor",
  "backgroundImage",
  "opacity",
  "boxShadow",
  "textShadow",
  "textDecorationLine",
  "objectFit",
  "fontSize",
  "lineHeight",
  "fontWeight",
  "textAlign",
  "gap",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginBottom",
  "borderTopWidth",
  "borderBottomWidth",
  "borderColor",
  "borderTopLeftRadius",
  "borderBottomLeftRadius",
  "gridTemplateColumns",
  "flexDirection",
];

// Serialized into the real browser by the runner; deliberately self-contained.
export function measureComponent(properties) {
  const angular = !!document.querySelector("app-canvas-page");
  const root = document.querySelector(
    angular ? "app-canvas-page" : "#__nuxt > div",
  );
  if (!root) throw new Error("Expected Angular page or Nuxt application root");
  const hosts = new Set([
    "canvas-component-tree",
    "canvas-children",
    "canvas-element",
    "canvas-slot",
    "canvas-markup",
    ...[
      "accordion",
      "accordion-item",
      "blockquote",
      "button",
      "card",
      "card-container",
      "footer",
      "grid-container",
      "header",
      "heading",
      "hero",
      "image",
      "logo-card",
      "section",
      "spacer",
      "text",
      "two-column-text",
      "video",
    ].map((name) => "app-" + name),
  ]);
  const allowed = [];
  const records = [];
  const ignored = (el, reason) => allowed.push({ tag: el.localName, reason });
  const children = (el) =>
    Array.from(el.children).flatMap((child) => {
      if (hosts.has(child.localName)) {
        ignored(child, "Canvas/registry host has no layout box");
        if (getComputedStyle(child).display !== "contents")
          throw new Error(`Unexpected boxed host: ${child.localName}`);
        return children(child);
      }
      if (child.localName === "template") {
        ignored(child, "Inert Angular template declaration");
        return [];
      }
      if (
        !angular &&
        child.matches("span.nuxt-route-announcer") &&
        child.querySelector('[role="status"][aria-live]')
      ) {
        ignored(
          child,
          "Nuxt application route announcer, outside component content",
        );
        return [];
      }
      if (
        angular &&
        child.matches("canvas-markup > span") &&
        child.style.display === "contents"
      ) {
        ignored(child, "CanvasMarkup trusted HTML binding host");
        return children(child);
      }
      if (
        angular &&
        child.matches("app-card div.mb-2") &&
        child.children.length === 1 &&
        child.firstElementChild.localName === "app-heading"
      ) {
        ignored(
          child,
          "Card heading margin resides on wrapper instead of Vue heading root",
        );
        return children(child).map((heading) => ({
          element: heading,
          marginWrapper: child,
        }));
      }
      return [child];
    });
  function visit(items, parent = "") {
    items.forEach((item, index) => {
      const el = item.element ?? item;
      const key = `${parent}/${index}:${el.localName}`;
      const style = getComputedStyle(el),
        box = el.getBoundingClientRect();
      const classes = new Set(
        Array.from(el.classList).filter((c) => c !== "ng-star-inserted"),
      );
      if (item.marginWrapper) classes.add("mb-2");
      if (el.hasAttribute("data-accordion-group")) {
        classes.delete("canvas-accordion");
        // Vue divider utilities target native children; Angular's equivalent
        // explicit host-chain CSS is checked through computed borders below.
        for (const c of [...classes])
          if (/^divide-(y|gray-(200|300|400)|primary-(200|300))$/.test(c))
            classes.delete(c);
      }
      if (
        el.hasAttribute("data-accordion-item") &&
        el.closest('[data-variant="bordered"]')
      ) {
        for (const c of ["-mt-px", "rounded-t-lg", "rounded-b-lg"])
          classes.delete(c);
      }
      const attrs = {};
      for (const name of [
        "id",
        "href",
        "src",
        "alt",
        "width",
        "height",
        "poster",
        "controls",
        "type",
        "kind",
        "role",
        "title",
        "aria-label",
        "target",
        "rel",
        "d",
        "viewBox",
        "fill",
        "stroke",
        "stroke-width",
        "aria-hidden",
        "aria-expanded",
        "aria-controls",
        "aria-labelledby",
        "inert",
        "data-variant",
        "data-border-color",
      ]) {
        if (el.hasAttribute(name)) attrs[name] = el.getAttribute(name);
      }
      // Framework-generated IDs differ, but actual relationships must be valid.
      if (el.hasAttribute("data-accordion-button")) {
        if (
          !document
            .getElementById(attrs["aria-controls"])
            ?.hasAttribute("data-accordion-content")
        )
          throw new Error("Broken accordion aria-controls");
        attrs.id = "$button";
        attrs["aria-controls"] = "$panel";
      }
      if (el.hasAttribute("data-accordion-content")) {
        if (
          !document
            .getElementById(attrs["aria-labelledby"])
            ?.hasAttribute("data-accordion-button")
        )
          throw new Error("Broken accordion aria-labelledby");
        attrs.id = "$panel";
        attrs["aria-labelledby"] = "$button";
      }
      // Angular additionally marks this decorative link-card chevron as hidden.
      if (
        !angular &&
        el.localName === "svg" &&
        el.matches("a.group svg.size-5")
      )
        attrs["aria-hidden"] = "true";
      if (el.matches("[data-accordion-button] > span.relative")) {
        attrs.iconShapes = JSON.stringify(
          Array.from(el.querySelectorAll("svg")).map((svg) => ({
            classes: Array.from(svg.classList).sort(),
            paths: Array.from(svg.querySelectorAll("path")).map((path) =>
              Object.fromEntries(
                ["d", "stroke", "stroke-width"].map((name) => [
                  name,
                  path.getAttribute(name),
                ]),
              ),
            ),
          })),
        );
      }
      const styles = Object.fromEntries(properties.map((p) => [p, style[p]]));
      if (item.marginWrapper)
        styles.marginBottom = getComputedStyle(item.marginWrapper).marginBottom;
      records.push({
        key,
        tag: el.localName,
        classes: [...classes].sort(),
        text: (() => {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          const parts = [];
          while (walker.nextNode()) {
            const text = walker.currentNode.textContent
              .replace(/\s+/g, " ")
              .trim();
            if (text) parts.push(text);
          }
          return parts.join(" ");
        })(),
        attrs,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        style: styles,
      });
      if (el.matches("[data-accordion-button] > span.relative")) {
        // React/Angular fade overlaid +/- SVGs; Vue toggles display on the
        // same icons. Compare the shared icon box, not animation internals.
        ignored(el, "Bordered accordion +/- animation implementation subtree");
      } else visit(children(el), key);
    });
  }
  visit(children(root));
  return { records, allowed };
}

export function compareMeasurements(actual, expected) {
  const differences = [];
  const remaining = new Map(expected.records.map((el) => [el.key, el]));
  let compared = 0;
  for (const el of actual.records) {
    const other = remaining.get(el.key);
    if (!other) {
      differences.push({
        key: el.key,
        property: "unexpected actual element",
        actual: el,
      });
      continue;
    }
    remaining.delete(el.key);
    compared++;
    const diff = (property, a, b) =>
      differences.push({ key: el.key, property, actual: a, expected: b });
    for (const prop of ["tag", "classes", "text", "attrs"]) {
      if (JSON.stringify(el[prop]) !== JSON.stringify(other[prop]))
        diff(prop, el[prop], other[prop]);
    }
    for (const dimension of ["x", "y", "width", "height"]) {
      if (Math.abs(el[dimension] - other[dimension]) > 1)
        diff(dimension, el[dimension], other[dimension]);
    }
    for (const prop of properties) {
      const a = el.style[prop],
        b = other.style[prop];
      const roundingOnly =
        /^-?[\d.]+px$/.test(a) &&
        /^-?[\d.]+px$/.test(b) &&
        Math.abs(parseFloat(a) - parseFloat(b)) < 0.01;
      if (a !== b && !roundingOnly) diff(prop, a, b);
    }
  }
  for (const el of remaining.values())
    differences.push({
      key: el.key,
      property: "missing actual element",
      expected: el,
    });
  return { compared, differences };
}
