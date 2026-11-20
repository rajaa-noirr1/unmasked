// Answer options in a random order, so the right one is not always A.
// An order is a list of positions (e.g. [2, 0, 3, 1]): the content keeps its own order (which is what
// marks the right answer, in both languages and in the database); only what is shown is reordered.
export function shuffledOrder(n) {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// The question as shown: options reordered, and the right answer's position moved with them.
export function inOrder(item, order) {
  if (!order || order.length !== item.options.length) return item
  return { ...item, options: order.map((k) => item.options[k]), answerIndex: order.indexOf(item.answerIndex) }
}
